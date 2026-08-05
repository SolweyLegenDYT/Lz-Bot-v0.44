const db = require('../database/db');
const config = require('../config');

/**
 * Permission levels:
 *  0 - User (registered)
 *  1 - Group Admin
 *  2 - Operator (bot owner added via .addowner)
 *  3 - Developer (hardcoded owner number)
 */

function getPermissionLevel(senderId, groupMetadata = null) {
  const clean = senderId.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');

  // Developer
  if (clean === config.ownerNumber) return 3;

  // Operator
  const settings = db.getSettings();
  if (settings.owners.includes(clean)) return 2;

  // Group Admin
  if (groupMetadata) {
    const isAdmin = groupMetadata.participants.some(
      p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
    );
    if (isAdmin) return 1;
  }

  // User
  return 0;
}

function isDeveloper(senderId) {
  return getPermissionLevel(senderId) === 3;
}

function isOperator(senderId) {
  return getPermissionLevel(senderId) >= 2;
}

function isGroupAdmin(senderId, groupMetadata) {
  return getPermissionLevel(senderId, groupMetadata) >= 1;
}

function isBotAdmin(sock, groupId) {
  // Check if the bot itself is admin in the group
  return new Promise(async (resolve) => {
    try {
      const meta = await sock.groupMetadata(groupId);
      const botId = sock.user.id.replace(':0', '') + '@s.whatsapp.net';
      const botParticipant = meta.participants.find(p => p.id === botId);
      resolve(botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin'));
    } catch {
      resolve(false);
    }
  });
}

module.exports = { getPermissionLevel, isDeveloper, isOperator, isGroupAdmin, isBotAdmin };
