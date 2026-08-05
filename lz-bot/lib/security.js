const NodeCache = require('node-cache');
const config = require('../config');
const db = require('../database/db');

// Per-user message counters for spam detection
const spamMap = new Map();
const floodMap = new Map();
const rateLimitMap = new Map();
const cooldownMap = new NodeCache({ stdTTL: 0 });

// ─────────────────────────────────────────────
//  Anti-Spam
// ─────────────────────────────────────────────
function checkSpam(userId) {
  const cfg = config.antiSpam;
  if (!cfg.enabled) return false;

  const now = Date.now();
  const data = spamMap.get(userId) || { count: 0, firstMsg: now };

  if (now - data.firstMsg > cfg.timeWindow) {
    spamMap.set(userId, { count: 1, firstMsg: now });
    return false;
  }

  data.count++;
  spamMap.set(userId, data);

  return data.count > cfg.maxMessages;
}

// ─────────────────────────────────────────────
//  Anti-Flood
// ─────────────────────────────────────────────
function checkFlood(userId) {
  const cfg = config.antiFlood;
  if (!cfg.enabled) return false;

  const now = Date.now();
  const data = floodMap.get(userId) || { count: 0, firstMsg: now };

  if (now - data.firstMsg > cfg.timeWindow) {
    floodMap.set(userId, { count: 1, firstMsg: now });
    return false;
  }

  data.count++;
  floodMap.set(userId, data);

  return data.count > cfg.maxMessages;
}

// ─────────────────────────────────────────────
//  Rate Limit (commands)
// ─────────────────────────────────────────────
function checkRateLimit(userId) {
  const cfg = config.rateLimit;
  const now = Date.now();
  const data = rateLimitMap.get(userId) || { count: 0, firstCmd: now };

  if (now - data.firstCmd > cfg.timeWindow) {
    rateLimitMap.set(userId, { count: 1, firstCmd: now });
    return false;
  }

  data.count++;
  rateLimitMap.set(userId, data);

  return data.count > cfg.maxCommands;
}

// ─────────────────────────────────────────────
//  Cooldown per command
// ─────────────────────────────────────────────
function checkCooldown(userId, command) {
  const key = `${userId}:${command}`;
  const remaining = cooldownMap.get(key);
  if (remaining) return remaining; // ms remaining
  return null;
}

function setCooldown(userId, command, durationMs) {
  const key = `${userId}:${command}`;
  const expiresAt = Date.now() + durationMs;
  cooldownMap.set(key, expiresAt, Math.ceil(durationMs / 1000));
}

function formatCooldown(expiresAt) {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return '0s';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─────────────────────────────────────────────
//  Malicious message detection
// ─────────────────────────────────────────────
const maliciousPatterns = [
  /crash\s*bot/i,
  /\u0000/g,  // null bytes
  /(?:eval|exec|shell)\s*\(/i
];

function isMalicious(text) {
  return maliciousPatterns.some(p => p.test(text));
}

// ─────────────────────────────────────────────
//  Arab text detection
// ─────────────────────────────────────────────
function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

// ─────────────────────────────────────────────
//  Link detection
// ─────────────────────────────────────────────
function hasLink(text) {
  return /https?:\/\/\S+|www\.\S+/i.test(text);
}

function hasGroupLink(text) {
  return /chat\.whatsapp\.com\/\S+/i.test(text);
}

module.exports = {
  checkSpam,
  checkFlood,
  checkRateLimit,
  checkCooldown,
  setCooldown,
  formatCooldown,
  isMalicious,
  isArabic,
  hasLink,
  hasGroupLink
};
