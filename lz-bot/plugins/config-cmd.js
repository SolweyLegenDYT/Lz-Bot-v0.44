const config = require('../config');
const db = require('../database/db');
const { isOperator, isDeveloper } = require('../lib/permissions');

module.exports = {
  name: 'config',
  commands: [
    // ── Mode ───────────────────────────────────
    {
      pattern: /^mode\s+(public|group|private)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const mode = match[1].toLowerCase();
        db.updateSettings({ mode });
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ Modo cambiado a *${mode}*\n\n🌐 public — responde a todos\n👥 group — solo en grupos\n🔒 private — solo en privado`
        }, { quoted: msg });
      }
    },

    // ── Prefix ─────────────────────────────────
    {
      pattern: /^prefix\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isDeveloper(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.ownerOnly }, { quoted: msg });
        const prefix = match[1].trim().charAt(0);
        db.updateSettings({ prefix });
        config.prefix = prefix;
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ Prefijo cambiado a *${prefix}*\n⚠️ Reinicia el bot para aplicar en toda la app.`
        }, { quoted: msg });
      }
    },

    // ── Auto-read ──────────────────────────────
    {
      pattern: /^autoread\s+(on|off)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateSettings({ autoRead: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `👁️ Auto-read ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Auto-typing ────────────────────────────
    {
      pattern: /^autotyping\s+(on|off)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateSettings({ autoTyping: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `⌨️ Auto-typing ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Auto-record ────────────────────────────
    {
      pattern: /^autorecord\s+(on|off)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateSettings({ autoRecord: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `🎙️ Auto-record ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Block ──────────────────────────────────
    {
      pattern: /^block$/i,
      async handler(sock, msg, { sender }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const target = quoted?.participant || quoted?.mentionedJid?.[0];
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Responde un mensaje del usuario a bloquear.' }, { quoted: msg });
        try {
          await sock.updateBlockStatus(target, 'block');
          await sock.sendMessage(msg.key.remoteJid, { text: `🚫 @${target.split('@')[0]} fue bloqueado.`, mentions: [target] }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Unblock ────────────────────────────────
    {
      pattern: /^unblock\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const target = match[1] + '@s.whatsapp.net';
        try {
          await sock.updateBlockStatus(target, 'unblock');
          await sock.sendMessage(msg.key.remoteJid, { text: `✅ ${match[1]} fue desbloqueado.` }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Blacklist ──────────────────────────────
    {
      pattern: /^blacklist\s+(add|remove|list)\s*(\d+)?$/i,
      async handler(sock, msg, { sender, match }) {
        if (!isOperator(sender)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.operatorOnly }, { quoted: msg });
        const action = match[1].toLowerCase();
        const settings = db.getSettings();

        if (action === 'list') {
          const list = settings.blacklist.length ? settings.blacklist.join('\n') : 'Lista vacía.';
          return sock.sendMessage(msg.key.remoteJid, { text: `🚫 *Blacklist*\n\n${list}` }, { quoted: msg });
        }

        const number = match[2];
        if (!number) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Especifica un número.' }, { quoted: msg });

        if (action === 'add') {
          if (!settings.blacklist.includes(number)) settings.blacklist.push(number);
          db.updateSettings({ blacklist: settings.blacklist });
          await sock.sendMessage(msg.key.remoteJid, { text: `✅ *${number}* añadido a la blacklist.` }, { quoted: msg });
        } else {
          db.updateSettings({ blacklist: settings.blacklist.filter(n => n !== number) });
          await sock.sendMessage(msg.key.remoteJid, { text: `✅ *${number}* removido de la blacklist.` }, { quoted: msg });
        }
      }
    }
  ]
};
