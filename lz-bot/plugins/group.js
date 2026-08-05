const config = require('../config');
const db = require('../database/db');
const { isGroupAdmin, isBotAdmin } = require('../lib/permissions');

module.exports = {
  name: 'group',
  groupOnly: true,
  commands: [
    // ── Tag all ────────────────────────────────
    {
      pattern: /^tagall(?:\s+(.+))?$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const text = match[1] || '📢 Atención a todos';
        const mentions = groupMetadata.participants.map(p => p.id);
        const mentionText = mentions.map(m => `@${m.split('@')[0]}`).join(' ');

        await sock.sendMessage(msg.key.remoteJid, {
          text: `📢 *${text}*\n\n${mentionText}`,
          mentions
        }, { quoted: msg });
      }
    },

    // ── Hidetag ────────────────────────────────
    {
      pattern: /^hidetag(?:\s+(.+))?$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const text = match[1] || '‏';
        const mentions = groupMetadata.participants.map(p => p.id);
        await sock.sendMessage(msg.key.remoteJid, { text, mentions }, { quoted: msg });
      }
    },

    // ── Kick ───────────────────────────────────
    {
      pattern: /^kick$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const botIsAdmin = await isBotAdmin(sock, msg.key.remoteJid);
        if (!botIsAdmin) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Necesito ser administrador para expulsar usuarios.' }, { quoted: msg });

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const target = quoted?.participant || msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde el mensaje del usuario o mencionalo.\nEjemplo: *${config.prefix}kick @usuario*` }, { quoted: msg });

        try {
          await sock.groupParticipantsUpdate(msg.key.remoteJid, [target], 'remove');
          await sock.sendMessage(msg.key.remoteJid, { text: `✅ @${target.split('@')[0]} fue expulsado del grupo.`, mentions: [target] }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ No pude expulsar al usuario: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Add ────────────────────────────────────
    {
      pattern: /^add\s+(\d+)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const botIsAdmin = await isBotAdmin(sock, msg.key.remoteJid);
        if (!botIsAdmin) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Necesito ser administrador.' }, { quoted: msg });

        const number = match[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        try {
          await sock.groupParticipantsUpdate(msg.key.remoteJid, [number], 'add');
          await sock.sendMessage(msg.key.remoteJid, { text: `✅ @${number.split('@')[0]} fue añadido al grupo.`, mentions: [number] }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ No pude añadir al usuario: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Promote ────────────────────────────────
    {
      pattern: /^promote$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const botIsAdmin = await isBotAdmin(sock, msg.key.remoteJid);
        if (!botIsAdmin) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Necesito ser administrador.' }, { quoted: msg });

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const target = quoted?.participant;
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde el mensaje del usuario a promover.` }, { quoted: msg });

        try {
          await sock.groupParticipantsUpdate(msg.key.remoteJid, [target], 'promote');
          await sock.sendMessage(msg.key.remoteJid, { text: `⬆️ @${target.split('@')[0]} fue promovido a administrador.`, mentions: [target] }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Demote ─────────────────────────────────
    {
      pattern: /^demote$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const botIsAdmin = await isBotAdmin(sock, msg.key.remoteJid);
        if (!botIsAdmin) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Necesito ser administrador.' }, { quoted: msg });

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const target = quoted?.participant;
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde el mensaje del usuario a degradar.` }, { quoted: msg });

        try {
          await sock.groupParticipantsUpdate(msg.key.remoteJid, [target], 'demote');
          await sock.sendMessage(msg.key.remoteJid, { text: `⬇️ @${target.split('@')[0]} fue degradado.`, mentions: [target] }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Open/Close group ───────────────────────
    {
      pattern: /^(open|close)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const botIsAdmin = await isBotAdmin(sock, msg.key.remoteJid);
        if (!botIsAdmin) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Necesito ser administrador.' }, { quoted: msg });

        const isOpen = match[1].toLowerCase() === 'open';
        try {
          await sock.groupSettingUpdate(msg.key.remoteJid, isOpen ? 'not_announcement' : 'announcement');
          await sock.sendMessage(msg.key.remoteJid, {
            text: isOpen ? '🔓 Grupo abierto. Todos pueden enviar mensajes.' : '🔒 Grupo cerrado. Solo admins pueden enviar mensajes.'
          }, { quoted: msg });
          db.updateGroup(msg.key.remoteJid, { open: isOpen });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Link ───────────────────────────────────
    {
      pattern: /^link$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        try {
          const code = await sock.groupInviteCode(msg.key.remoteJid);
          await sock.sendMessage(msg.key.remoteJid, {
            text: `🔗 *Link del grupo*\n\nhttps://chat.whatsapp.com/${code}`
          }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Reset link ─────────────────────────────
    {
      pattern: /^resetlink$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        try {
          await sock.groupRevokeInvite(msg.key.remoteJid);
          const newCode = await sock.groupInviteCode(msg.key.remoteJid);
          await sock.sendMessage(msg.key.remoteJid, {
            text: `✅ *Link reseteado*\n\nNuevo link:\nhttps://chat.whatsapp.com/${newCode}`
          }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── Delete message ─────────────────────────
    {
      pattern: /^delete$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
        if (!quotedMsg) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde el mensaje que deseas eliminar.` }, { quoted: msg });

        try {
          await sock.sendMessage(msg.key.remoteJid, { delete: { remoteJid: msg.key.remoteJid, fromMe: false, id: quotedMsg.stanzaId, participant: quotedMsg.participant } });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ No pude eliminar el mensaje: ${e.message}` }, { quoted: msg });
        }
      }
    }
  ]
};
