const config = require('../config');
const db = require('../database/db');
const { isGroupAdmin, isBotAdmin } = require('../lib/permissions');

module.exports = {
  name: 'moderation',
  commands: [
    // ── Anti-link ──────────────────────────────
    {
      pattern: /^antilink\s+(on|off)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateGroup(msg.key.remoteJid, { antiLink: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `🛡️ Anti-link ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Anti-bot ───────────────────────────────
    {
      pattern: /^antibot\s+(on|off)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateGroup(msg.key.remoteJid, { antiBot: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `🤖 Anti-bot ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Anti-spam ──────────────────────────────
    {
      pattern: /^antispam\s+(on|off)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateGroup(msg.key.remoteJid, { antiSpam: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `🛡️ Anti-spam ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Anti-arab ──────────────────────────────
    {
      pattern: /^antiarab\s+(on|off)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateGroup(msg.key.remoteJid, { antiArab: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `🌍 Anti-árabe ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Anti-sticker ───────────────────────────
    {
      pattern: /^antisticker\s+(on|off)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateGroup(msg.key.remoteJid, { antiSticker: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `🎭 Anti-sticker ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Anti-linkgc ────────────────────────────
    {
      pattern: /^antilinkgc\s+(on|off)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateGroup(msg.key.remoteJid, { antiLinkGc: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `🔗 Anti-link de grupos ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Anti-fake ──────────────────────────────
    {
      pattern: /^antifake\s+(on|off)$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });
        const enabled = match[1].toLowerCase() === 'on';
        db.updateGroup(msg.key.remoteJid, { antiFake: enabled });
        await sock.sendMessage(msg.key.remoteJid, { text: `👤 Anti-fake ${enabled ? '✅ activado' : '❌ desactivado'}` }, { quoted: msg });
      }
    },

    // ── Warn ───────────────────────────────────
    {
      pattern: /^warn(?:\s+(.+))?$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const target = quoted?.participant;
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde el mensaje del usuario a advertir.` }, { quoted: msg });

        const warns = db.addWarn(msg.key.remoteJid, target);
        const MAX_WARNS = 3;

        await sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ *Advertencia*\n@${target.split('@')[0]} recibió una advertencia.\n\n🔴 Warns: *${warns}/${MAX_WARNS}*${warns >= MAX_WARNS ? '\n\n🚫 Máximo de warns alcanzado.' : ''}`,
          mentions: [target]
        }, { quoted: msg });

        if (warns >= MAX_WARNS) {
          const botIsAdmin = await isBotAdmin(sock, msg.key.remoteJid);
          if (botIsAdmin) {
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [target], 'remove');
            await sock.sendMessage(msg.key.remoteJid, { text: `🚫 @${target.split('@')[0]} fue expulsado por acumular ${MAX_WARNS} warns.`, mentions: [target] });
          }
        }
      }
    },

    // ── Unwarn ─────────────────────────────────
    {
      pattern: /^unwarn$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const target = quoted?.participant;
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde el mensaje del usuario.` }, { quoted: msg });

        const warns = db.removeWarn(msg.key.remoteJid, target);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ Se eliminó una advertencia de @${target.split('@')[0]}.\n⚠️ Warns: *${warns}/3*`,
          mentions: [target]
        }, { quoted: msg });
      }
    },

    // ── Mute user ──────────────────────────────
    {
      pattern: /^mute\s*(\d+)?$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata, match }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const target = quoted?.participant;
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde el mensaje del usuario a silenciar.` }, { quoted: msg });

        const minutes = parseInt(match[1]) || 5;
        const until = Date.now() + minutes * 60000;
        db.muteUser(msg.key.remoteJid, target, until);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `🔇 @${target.split('@')[0]} fue silenciado por *${minutes} minutos*.`,
          mentions: [target]
        }, { quoted: msg });
      }
    },

    // ── Unmute user ────────────────────────────
    {
      pattern: /^unmute$/i,
      async handler(sock, msg, { sender, isGroup, groupMetadata }) {
        if (!isGroup) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.groupOnly }, { quoted: msg });
        if (!isGroupAdmin(sender, groupMetadata)) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.adminOnly }, { quoted: msg });

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const target = quoted?.participant;
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde el mensaje del usuario a desmutear.` }, { quoted: msg });

        db.unmuteUser(msg.key.remoteJid, target);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🔊 @${target.split('@')[0]} ya puede hablar de nuevo.`,
          mentions: [target]
        }, { quoted: msg });
      }
    }
  ]
};
