require('dotenv').config();
const { createConnection } = require('./lib/connection');
const config = require('./config');
const db = require('./database/db');
const { checkSpam, checkFlood, checkRateLimit, isMalicious, isArabic, hasLink, hasGroupLink } = require('./lib/security');
const { isDeveloper } = require('./lib/permissions');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// ── Ensure tmp dir ────────────────────────────
fs.ensureDirSync('./tmp');
fs.ensureDirSync('./session');
fs.ensureDirSync('./database');

// ── Load all plugins ──────────────────────────
const pluginDir = path.join(__dirname, 'plugins');
const plugins = [];

fs.readdirSync(pluginDir)
  .filter(f => f.endsWith('.js'))
  .forEach(file => {
    try {
      const plugin = require(path.join(pluginDir, file));
      plugins.push(plugin);
      console.log(chalk.green(`✅ Plugin cargado: ${plugin.name || file}`));
    } catch (e) {
      console.error(chalk.red(`❌ Error al cargar plugin ${file}: ${e.message}`));
    }
  });

// ── Flatten all commands ───────────────────────
const commands = [];
for (const plugin of plugins) {
  if (plugin.commands) {
    for (const cmd of plugin.commands) {
      commands.push(cmd);
    }
  }
}

console.log(chalk.cyan(`\n📦 ${commands.length} comandos cargados desde ${plugins.length} plugins\n`));

// ── Extract body from message ──────────────────
function getBody(msg) {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    ''
  );
}

// ── Anti-spam moderation for groups ───────────
async function handleGroupModeration(sock, msg, body, groupMetadata) {
  const groupId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const group = db.getGroup(groupId);

  if (!group) return;

  // Check if user is admin (skip moderation for admins)
  const isAdmin = groupMetadata.participants.some(
    p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
  );
  if (isAdmin || isDeveloper(sender)) return;

  const msgType = Object.keys(msg.message || {})[0] || '';

  // Anti-link
  if (group.antiLink && hasLink(body) && !hasGroupLink(body)) {
    try {
      await sock.sendMessage(groupId, {
        text: `🚫 @${sender.split('@')[0]} Los enlaces no están permitidos en este grupo.`,
        mentions: [sender]
      });
      await sock.groupParticipantsUpdate(groupId, [sender], 'remove').catch(() => {});
    } catch {}
    return;
  }

  // Anti-group link
  if (group.antiLinkGc && hasGroupLink(body)) {
    try {
      await sock.sendMessage(groupId, {
        text: `🚫 @${sender.split('@')[0]} Los links de grupos no están permitidos.`,
        mentions: [sender]
      });
      await sock.groupParticipantsUpdate(groupId, [sender], 'remove').catch(() => {});
    } catch {}
    return;
  }

  // Anti-arab
  if (group.antiArab && isArabic(body)) {
    try {
      await sock.sendMessage(groupId, {
        text: `🚫 @${sender.split('@')[0]} El texto en árabe no está permitido.`,
        mentions: [sender]
      });
      await sock.groupParticipantsUpdate(groupId, [sender], 'remove').catch(() => {});
    } catch {}
    return;
  }

  // Anti-sticker
  if (group.antiSticker && msgType === 'stickerMessage') {
    await sock.sendMessage(groupId, {
      delete: msg.key
    }).catch(() => {});
    return;
  }

  // Anti-long text
  if (group.antiLongText && body.length > 1000) {
    await sock.sendMessage(groupId, {
      text: `⚠️ @${sender.split('@')[0]} Mensaje muy largo eliminado.`,
      mentions: [sender]
    });
    await sock.sendMessage(groupId, { delete: msg.key }).catch(() => {});
    return;
  }

  // Check if user is muted
  if (db.isMuted(groupId, sender)) {
    await sock.sendMessage(groupId, { delete: msg.key }).catch(() => {});
    return;
  }
}

// ── Main handler ───────────────────────────────
async function handler(sock) {
  // Welcome event for groups
  sock.ev.on('group-participants.update', async (update) => {
    for (const plugin of plugins) {
      if (plugin.events?.['group-participants.update']) {
        await plugin.events['group-participants.update'](sock, update).catch(e =>
          console.error(chalk.red('Error en evento group-participants.update:', e.message))
        );
      }
    }
  });

  // Main message handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const sender = isGroup ? (msg.key.participant || '') : remoteJid;
        const body = getBody(msg);
        const settings = db.getSettings();

        // ── Auto-read ──────────────────────
        if (settings.autoRead) {
          await sock.readMessages([msg.key]).catch(() => {});
        }

        // ── Ban check ──────────────────────
        if (db.isBanned(sender)) continue;

        // ── Mode check ─────────────────────
        if (settings.mode === 'private' && isGroup) continue;
        if (settings.mode === 'group' && !isGroup) continue;

        // ── Malicious check ────────────────
        if (isMalicious(body)) continue;

        // ── Anti-spam/flood ────────────────
        if (checkSpam(sender) || checkFlood(sender)) continue;

        // ── Group moderation ───────────────
        let groupMetadata = null;
        if (isGroup) {
          try { groupMetadata = await sock.groupMetadata(remoteJid); } catch {}
          if (groupMetadata) {
            await handleGroupModeration(sock, msg, body, groupMetadata);
          }
        }

        // ── XP for messages ────────────────
        const user = db.getUser(sender);
        if (user) {
          db.updateUser(sender, { totalMessages: (user.totalMessages || 0) + 1 });
          const xpResult = db.addXP(sender, config.xpPerMessage);
          if (xpResult.leveled) {
            const reward = config.levelRewards[xpResult.level];
            const levelMsg = `🎉 *¡Subiste de nivel!*\n\n⭐ Nuevo nivel: *${xpResult.level}*${reward ? `\n🎁 Recompensa: *+${reward.coins} coins*\n💬 ${reward.message}` : ''}`;
            await sock.sendMessage(remoteJid, { text: levelMsg, mentions: [sender] }).catch(() => {});
          }
        }

        // ── Auto-typing ────────────────────
        if (settings.autoTyping && body.startsWith(settings.prefix || config.prefix)) {
          await sock.sendPresenceUpdate('composing', remoteJid).catch(() => {});
        }

        // ── Command parsing ─────────────────
        const prefix = settings.prefix || config.prefix;
        if (!body.startsWith(prefix)) continue;

        const bodyWithoutPrefix = body.slice(prefix.length).trim();

        // ── Rate limit ─────────────────────
        if (checkRateLimit(sender)) {
          await sock.sendMessage(remoteJid, {
            text: '⏳ Estás ejecutando comandos muy rápido. Espera un momento.'
          }, { quoted: msg }).catch(() => {});
          continue;
        }

        // ── Match command ──────────────────
        let matched = false;
        for (const cmd of commands) {
          const match = bodyWithoutPrefix.match(cmd.pattern);
          if (!match) continue;

          const args = bodyWithoutPrefix.split(/\s+/).slice(1);
          const context = {
            sender,
            isGroup,
            groupMetadata,
            args,
            body: bodyWithoutPrefix,
            match,
            prefix
          };

          try {
            // Auto-typing on command
            if (settings.autoTyping) {
              await sock.sendPresenceUpdate('composing', remoteJid).catch(() => {});
            }

            const result = await cmd.handler(sock, msg, context);
            if (result !== false) {
              // Track command usage
              if (user) {
                db.updateUser(sender, { totalCommands: (user.totalCommands || 0) + 1 });
                db.addXP(sender, config.xpPerCommand);
              }
              matched = true;
              break;
            }
          } catch (e) {
            console.error(chalk.red(`❌ Error en comando [${cmd.pattern}]: ${e.message}`));
            await sock.sendMessage(remoteJid, {
              text: config.messages.error
            }, { quoted: msg }).catch(() => {});
          }
        }

      } catch (e) {
        console.error(chalk.red('❌ Error al procesar mensaje:', e.message));
      }
    }
  });

  console.log(chalk.green('✅ Handlers de eventos registrados.'));
}

// ── Start bot ──────────────────────────────────
async function start() {
  console.log(chalk.cyan('🚀 Iniciando LZ BOT...'));

  // Anti-crash
  process.on('uncaughtException', (e) => {
    console.error(chalk.red('⚠️ Error no capturado:', e.message));
  });
  process.on('unhandledRejection', (e) => {
    console.error(chalk.red('⚠️ Promesa rechazada:', e?.message || e));
  });

  await createConnection(handler);
}

start();
