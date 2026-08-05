const config = require('../config');
const db = require('../database/db');
const { isGroupAdmin } = require('../lib/permissions');

module.exports = {
  name: 'welcome',
  commands: [
    // ── Welcome on/off ─────────────────────────
    {
      pattern: /^welcome\s+(on|off)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateGroup(msg.key.remoteJid, { welcome: enabled });
        await sock.sendMessage(msg.key.remoteJid, {
          text: `👋 Bienvenida automática ${enabled ? '✅ activada' : '❌ desactivada'}`
        }, { quoted: msg });
      }
    },

    // ── Goodbye on/off ─────────────────────────
    {
      pattern: /^goodbye\s+(on|off)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateGroup(msg.key.remoteJid, { goodbye: enabled });
        await sock.sendMessage(msg.key.remoteJid, {
          text: `👋 Despedida automática ${enabled ? '✅ activada' : '❌ desactivada'}`
        }, { quoted: msg });
      }
    },

    // ── Set welcome message ────────────────────
    {
      pattern: /^setwelcome\s+(.+)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const welcomeMsg = match[1].trim();
        db.updateGroup(msg.key.remoteJid, { welcomeMsg });
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ Mensaje de bienvenida configurado:\n\n"${welcomeMsg}"\n\n_Variables disponibles: {name}, {group}_`
        }, { quoted: msg });
      }
    },

    // ── Set goodbye message ────────────────────
    {
      pattern: /^setbye\s+(.+)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const goodbyeMsg = match[1].trim();
        db.updateGroup(msg.key.remoteJid, { goodbyeMsg });
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ Mensaje de despedida configurado:\n\n"${goodbyeMsg}"\n\n_Variables disponibles: {name}, {group}_`
        }, { quoted: msg });
      }
    }
  ],

  // ── Event handlers ─────────────────────────
  events: {
    async 'group-participants.update'(sock, update) {
      const { id, participants, action } = update;
      const group = db.getGroup(id);

      if (action === 'add' && group.welcome) {
        let metadata;
        try { metadata = await sock.groupMetadata(id); } catch { return; }
        const groupName = metadata.subject;

        for (const participant of participants) {
          const name = `@${participant.split('@')[0]}`;
          const msg = (group.welcomeMsg || `¡Bienvenido/a {name} a *{group}*! 👋\n\nUsa *${config.prefix}register Nombre/Edad* para registrarte.`)
            .replace(/{name}/g, name)
            .replace(/{group}/g, groupName);

          await sock.sendMessage(id, {
            text: msg,
            mentions: [participant]
          }).catch(() => {});
        }
      }

      if (action === 'remove' && group.goodbye) {
        let metadata;
        try { metadata = await sock.groupMetadata(id); } catch { return; }
        const groupName = metadata.subject;

        for (const participant of participants) {
          const name = `@${participant.split('@')[0]}`;
          const msg = (group.goodbyeMsg || `👋 {name} ha salido de *{group}*.`)
            .replace(/{name}/g, name)
            .replace(/{group}/g, groupName);

          await sock.sendMessage(id, {
            text: msg,
            mentions: [participant]
          }).catch(() => {});
        }
      }
    }
  }
};
