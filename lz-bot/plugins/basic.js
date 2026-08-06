const config = require('../config');
const db = require('../database/db');
const { isDeveloper, isOperator } = require('../lib/permissions');
const os = require('os');

const startTime = Date.now();

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h ${m % 60}m ${s % 60}s`;
}

module.exports = {
  name: 'basic',
  commands: [
    {
      pattern: /^(menu|help)$/i,
      async handler(sock, msg, { sender, isGroup }) {
        const user = db.getUser(sender);
        const level = user ? user.level : 1;
        const coins = user ? user.coins : 0;

        const menuText = `╭━━〔 🤖 *${config.botName}* 〕━━⬣
┃👤 Usuario: ${user ? user.name : 'Sin registrar'}
┃⭐ Nivel: ${level}
┃💰 Coins: ${coins.toLocaleString()}
┃📅 Registro: ${user ? new Date(user.registeredAt).toLocaleDateString('es') : '—'}
┃🏷️ Modo: ${db.getSettings().mode}
┃⚡ Ping: ${Date.now() - (msg.messageTimestamp * 1000)}ms
╰━━━━━━━━━━━━━━⬣

📜 *COMANDOS PRINCIPALES*

🔹 *General*
${config.prefix}menu | ${config.prefix}ping | ${config.prefix}runtime | ${config.prefix}info
${config.prefix}register | ${config.prefix}profile | ${config.prefix}owner | ${config.prefix}rules

🤖 *IA*
${config.prefix}ai | ${config.prefix}chat | ${config.prefix}translate
${config.prefix}code | ${config.prefix}summarize | ${config.prefix}imageprompt

📥 *Descargas*
${config.prefix}ytmp3 <búsqueda> | ${config.prefix}ytmp4 <búsqueda>
${config.prefix}tiktok <url> | ${config.prefix}ig <url> | ${config.prefix}fb <url>
${config.prefix}spotify <canción> | ${config.prefix}pin <url>

🎭 *Stickers*
${config.prefix}s | ${config.prefix}toimg | ${config.prefix}attp | ${config.prefix}brat

🖼️ *Imágenes*
${config.prefix}removebg | ${config.prefix}upscale | ${config.prefix}blur
${config.prefix}cartoon | ${config.prefix}sketch | ${config.prefix}invert

🔊 *Audio*
${config.prefix}bass | ${config.prefix}reverb | ${config.prefix}nightcore | ${config.prefix}robot

🔧 *Herramientas*
${config.prefix}qr | ${config.prefix}calc | ${config.prefix}weather
${config.prefix}shorturl | ${config.prefix}password | ${config.prefix}date

💰 *Economía*
${config.prefix}balance | ${config.prefix}daily | ${config.prefix}work
${config.prefix}mine | ${config.prefix}hunt | ${config.prefix}shop | ${config.prefix}transfer

🎮 *Juegos*
${config.prefix}slot | ${config.prefix}coinflip | ${config.prefix}quiz
${config.prefix}hangman | ${config.prefix}tictactoe | ${config.prefix}math

👥 *Grupos* _(solo admins)_
${config.prefix}tagall | ${config.prefix}kick | ${config.prefix}add
${config.prefix}promote | ${config.prefix}demote | ${config.prefix}warn

🛡️ *Moderación* _(solo admins)_
${config.prefix}antilink | ${config.prefix}antibot | ${config.prefix}antispam
${config.prefix}welcome | ${config.prefix}goodbye

> _Usa *${config.prefix}info* para más detalles_`;

        // Si hay imagen de menú configurada, enviarla con el menú como caption
        if (config.menuImage && config.menuImage.startsWith('http')) {
          try {
            const axios = require('axios');
            const imgRes = await axios.get(config.menuImage, {
              responseType: 'arraybuffer',
              timeout: 15000,
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            await sock.sendMessage(msg.key.remoteJid, {
              image: Buffer.from(imgRes.data),
              caption: menuText
            }, { quoted: msg });
            return;
          } catch (e) {
            // Si la imagen falla, manda solo texto
          }
        }
        await sock.sendMessage(msg.key.remoteJid, { text: menuText }, { quoted: msg });
      }
    },

    {
      pattern: /^ping$/i,
      async handler(sock, msg) {
        const start = Date.now();
        await sock.sendMessage(msg.key.remoteJid, { text: '🏓 Calculando...' }, { quoted: msg });
        const latency = Date.now() - start;
        await sock.sendMessage(msg.key.remoteJid, {
          text: `⚡ *Pong!*\n📡 Latencia: *${latency}ms*`
        }, { quoted: msg });
      }
    },

    {
      pattern: /^runtime$/i,
      async handler(sock, msg) {
        const uptime = formatUptime(Date.now() - startTime);
        const mem = process.memoryUsage();
        const text = `⏱️ *Runtime del Bot*

🕐 Tiempo activo: *${uptime}*
🧠 RAM usada: *${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB*
💻 Plataforma: *${os.platform()}*
🖥️ Node.js: *${process.version}*
📦 Versión bot: *${config.botVersion}*`;
        await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
      }
    },

    {
      pattern: /^register\s+(.+)\/(\d+)$/i,
      async handler(sock, msg, { sender, args, match }) {
        const name = match[1].trim();
        const age = parseInt(match[2]);

        if (!name || isNaN(age) || age < 1 || age > 120) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Formato inválido.\nUsa: *${config.prefix}register Nombre/Edad*\nEjemplo: *${config.prefix}register Lz/22*`
          }, { quoted: msg });
        }

        const created = db.createUser(sender, name, age);
        if (!created) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: config.messages.alreadyRegistered
          }, { quoted: msg });
        }

        const text = `✅ *Registro completado.*

👤 Nombre: *${name}*
🎂 Edad: *${age}*

🎁 Coins iniciales: *${config.startCoins}*
⭐ Nivel: *1*

¡Bienvenido/a a *${config.botName}* 🎉
Usa *${config.prefix}menu* para ver todos los comandos.`;

        await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
      }
    },

    {
      pattern: /^profile$/i,
      async handler(sock, msg, { sender }) {
        const user = db.getUser(sender);
        if (!user) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: config.messages.notRegistered
          }, { quoted: msg });
        }

        const xpNeeded = user.level * config.levelMultiplier;
        const bar = Math.floor((user.xp / xpNeeded) * 10);
        const xpBar = '█'.repeat(bar) + '░'.repeat(10 - bar);

        const text = `╭━━〔 👤 *Perfil* 〕━━⬣
┃📛 Nombre: ${user.name}
┃🎂 Edad: ${user.age}
┃⭐ Nivel: ${user.level}
┃📊 XP: ${user.xp}/${xpNeeded}
┃[${xpBar}]
┃💰 Coins: ${user.coins.toLocaleString()}
┃🏆 Mensajes: ${user.totalMessages}
┃📟 Comandos: ${user.totalCommands}
┃📅 Registro: ${new Date(user.registeredAt).toLocaleDateString('es')}
┃⚠️ Warns: ${user.warns || 0}
╰━━━━━━━━━━━━━━⬣`;

        await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
      }
    },

    {
      pattern: /^level$/i,
      async handler(sock, msg, { sender }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });
        const xpNeeded = user.level * config.levelMultiplier;
        await sock.sendMessage(msg.key.remoteJid, {
          text: `⭐ *Nivel ${user.level}*\n📊 XP: ${user.xp}/${xpNeeded}\n💡 Siguiente nivel en *${xpNeeded - user.xp} XP*`
        }, { quoted: msg });
      }
    },

    {
      pattern: /^owner$/i,
      async handler(sock, msg) {
        const text = `👑 *Owner de ${config.botName}*\n\n📛 Nombre: ${config.ownerName}\n📱 Número: wa.me/${config.ownerNumber}`;
        await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
      }
    },

    {
      pattern: /^rules$/i,
      async handler(sock, msg) {
        const text = `📜 *Reglas de ${config.botName}*

1️⃣ No hacer spam de comandos.
2️⃣ No intentar crashear el bot.
3️⃣ Respetar a los demás usuarios.
4️⃣ No usar el bot para actividades ilegales.
5️⃣ Los abusos pueden resultar en ban permanente.

_Ante cualquier problema escribe al owner._`;
        await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
      }
    },

    {
      pattern: /^info$/i,
      async handler(sock, msg) {
        const settings = db.getSettings();
        const totalUsers = db.getAllUsers().length;
        const totalGroups = db.getAllGroups().length;
        const text = `ℹ️ *Información del Bot*

🤖 Nombre: *${config.botName}*
📦 Versión: *${config.botVersion}*
🔹 Prefijo: *${config.prefix}*
🌐 Modo: *${settings.mode}*
👥 Usuarios registrados: *${totalUsers}*
💬 Grupos activos: *${totalGroups}*
🟢 Librería: *Baileys*
💻 Node.js: *${process.version}*
⏱️ Uptime: *${formatUptime(Date.now() - startTime)}*`;
        await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
      }
    }
  ]
};
