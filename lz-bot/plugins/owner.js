const config = require('../config');
const db = require('../database/db');
const { isDeveloper, isOperator } = require('../lib/permissions');
const os = require('os');
const fs = require('fs-extra');

module.exports = {
  name: 'owner',
  commands: [
    // ── Add owner (operator) ───────────────────
    {
      pattern: /^addowner\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const number = match[1].replace(/[^0-9]/g, '');
        db.addOwner(number);
        await sock.sendMessage(msg.key.remoteJid, { text: `✅ *${number}* fue añadido como operador.` }, { quoted: msg });
      }
    },

    // ── Del owner ──────────────────────────────
    {
      pattern: /^delowner\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isDeveloper(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.ownerOnly }, { quoted: msg });
        const number = match[1].replace(/[^0-9]/g, '');
        db.removeOwner(number);
        await sock.sendMessage(msg.key.remoteJid, { text: `✅ *${number}* fue removido como operador.` }, { quoted: msg });
      }
    },

    // ── List owners ────────────────────────────
    {
      pattern: /^(listowner|operator)$/i,
      async handler(sock, msg, { sender }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const settings = db.getSettings();
        const list = settings.owners.length
          ? settings.owners.map((n, i) => `${i + 1}. +${n}`).join('\n')
          : 'Sin operadores adicionales.';
        await sock.sendMessage(msg.key.remoteJid, {
          text: `👑 *Lista de Operadores*\n\n${list}\n\n🔑 Developer: +${config.ownerNumber}`
        }, { quoted: msg });
      }
    },

    // ── Ban user ───────────────────────────────
    {
      pattern: /^ban$/i,
      async handler(sock, msg, { sender }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const target = quoted?.participant || quoted?.mentionedJid?.[0];
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Responde el mensaje del usuario a banear.' }, { quoted: msg });
        db.banUser(target);
        await sock.sendMessage(msg.key.remoteJid, { text: `🚫 @${target.split('@')[0]} fue baneado del bot.`, mentions: [target] }, { quoted: msg });
      }
    },

    // ── Unban user ─────────────────────────────
    {
      pattern: /^unban\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const number = match[1] + '@s.whatsapp.net';
        db.unbanUser(number);
        await sock.sendMessage(msg.key.remoteJid, { text: `✅ ${match[1]} fue desbaneado.` }, { quoted: msg });
      }
    },

    // ── Broadcast ──────────────────────────────
    {
      pattern: /^broadcast\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const text = match[1];
        const users = db.getAllUsers();
        let sent = 0;
        await sock.sendMessage(msg.key.remoteJid, { text: `📢 Enviando broadcast a *${users.length}* usuarios...` }, { quoted: msg });
        for (const user of users) {
          try {
            await sock.sendMessage(user.id, { text: `📢 *Mensaje de ${config.botName}*\n\n${text}` });
            sent++;
            await new Promise(r => setTimeout(r, 500)); // rate limit
          } catch {}
        }
        await sock.sendMessage(msg.key.remoteJid, { text: `✅ Broadcast enviado a *${sent}/${users.length}* usuarios.` }, { quoted: msg });
      }
    },

    // ── Restart ────────────────────────────────
    {
      pattern: /^restart$/i,
      async handler(sock, msg, { sender }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, { text: '🔄 Reiniciando bot...' }, { quoted: msg });
        setTimeout(() => process.exit(0), 2000);
      }
    },

    // ── Logs ───────────────────────────────────
    {
      pattern: /^logs$/i,
      async handler(sock, msg, { sender }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const totalUsers = db.getAllUsers().length;
        const totalGroups = db.getAllGroups().length;
        const mem = process.memoryUsage();
        const text = `📊 *Logs del Sistema*\n\n👥 Usuarios: *${totalUsers}*\n💬 Grupos: *${totalGroups}*\n🧠 RAM: *${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB*\n💻 CPU: *${os.loadavg()[0].toFixed(2)}*\n🖥️ SO: *${os.platform()}*\n⏱️ Uptime OS: *${Math.floor(os.uptime() / 3600)}h*`;
        await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
      }
    },

    // ── Memory ─────────────────────────────────
    {
      pattern: /^memory$/i,
      async handler(sock, msg, { sender }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const mem = process.memoryUsage();
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🧠 *Uso de Memoria*\n\nHeap: *${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB*\nRSS: *${(mem.rss / 1024 / 1024).toFixed(2)} MB*\nExternal: *${(mem.external / 1024 / 1024).toFixed(2)} MB*`
        }, { quoted: msg });
      }
    },

    // ── Backup DB ──────────────────────────────
    {
      pattern: /^backup$/i,
      async handler(sock, msg, { sender }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        try {
          const dbContent = fs.readFileSync('./database/data.json');
          await sock.sendMessage(msg.key.remoteJid, {
            document: dbContent,
            mimetype: 'application/json',
            fileName: `backup-${Date.now()}.json`,
            caption: '✅ Backup de la base de datos'
          }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Give coins ─────────────────────────────
    {
      pattern: /^givecoins\s+(\d+)\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const target = match[1] + '@s.whatsapp.net';
        const amount = parseInt(match[2]);
        if (!db.getUser(target)) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Usuario no registrado.' }, { quoted: msg });
        db.addCoins(target, amount);
        await sock.sendMessage(msg.key.remoteJid, { text: `✅ Se dieron *${amount} coins* a *${match[1]}*.` }, { quoted: msg });
      }
    },

    // ── Give XP ────────────────────────────────
    {
      pattern: /^givexp\s+(\d+)\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const target = match[1] + '@s.whatsapp.net';
        const amount = parseInt(match[2]);
        if (!db.getUser(target)) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Usuario no registrado.' }, { quoted: msg });
        db.addXP(target, amount);
        await sock.sendMessage(msg.key.remoteJid, { text: `✅ Se dieron *${amount} XP* a *${match[1]}*.` }, { quoted: msg });
      }
    },

    // ── Reset user ─────────────────────────────
    {
      pattern: /^resetuser\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isDeveloper(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.ownerOnly }, { quoted: msg });
        const target = match[1] + '@s.whatsapp.net';
        db.deleteUser(target);
        await sock.sendMessage(msg.key.remoteJid, { text: `✅ Usuario *${match[1]}* eliminado de la base de datos.` }, { quoted: msg });
      }
    },

    // ── Eval (Developer only) ──────────────────
    {
      pattern: /^eval\s+(.+)$/is,
      async handler(sock, msg, { sender, match }) {
        if (!isDeveloper(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.ownerOnly }, { quoted: msg });
        try {
          let result = eval(match[1]);
          if (result instanceof Promise) result = await result;
          await sock.sendMessage(msg.key.remoteJid, {
            text: `✅ *eval*\n\n\`\`\`\n${JSON.stringify(result, null, 2)}\n\`\`\``
          }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error:\n${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Shell (Developer only) ─────────────────
    {
      pattern: /^(exec|shell)\s+(.+)$/is,
      async handler(sock, msg, { sender, match }) {
        if (!isDeveloper(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.ownerOnly }, { quoted: msg });
        const { exec } = require('child_process');
        exec(match[2], { timeout: 10000 }, async (err, stdout, stderr) => {
          const out = (stdout || '') + (stderr || '') || 'Sin salida';
          await sock.sendMessage(msg.key.remoteJid, {
            text: `💻 *Shell*\n\`\`\`\n${out.substring(0, 2000)}\n\`\`\``
          }, { quoted: msg });
        });
      }
    },

    // ── Join group ─────────────────────────────
    {
      pattern: /^join\s+(https?:\/\/chat\.whatsapp\.com\/\S+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const code = match[1].split('chat.whatsapp.com/')[1];
        try {
          await sock.groupAcceptInvite(code);
          await sock.sendMessage(msg.key.remoteJid, { text: `✅ Me uní al grupo exitosamente.` }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Leave group ────────────────────────────
    {
      pattern: /^leave$/i,
      async handler(sock, msg, { sender }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, { text: '👋 Saliendo del grupo...' }, { quoted: msg });
        await sock.groupLeave(msg.key.remoteJid);
      }
    },

    // ── Panel ──────────────────────────────────
    {
      pattern: /^panel$/i,
      async handler(sock, msg, { sender }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, {
          text: `╭━━〔 👑 CREATOR PANEL 〕━━⬣

🔧 *Operadores*
${config.prefix}addowner | ${config.prefix}delowner | ${config.prefix}listowner

👤 *Usuarios*
${config.prefix}ban | ${config.prefix}unban | ${config.prefix}resetuser
${config.prefix}givecoins | ${config.prefix}givexp

📢 *Comunicación*
${config.prefix}broadcast | ${config.prefix}join | ${config.prefix}leave

⚙️ *Sistema*
${config.prefix}restart | ${config.prefix}logs | ${config.prefix}memory | ${config.prefix}backup

💻 *Desarrollador*
${config.prefix}eval | ${config.prefix}exec | ${config.prefix}shell

╰━━━━━━━━━━━━━━━━━━⬣`
        }, { quoted: msg });
      }
    }
  ]
};
