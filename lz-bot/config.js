require('dotenv').config();

module.exports = {
  // ──────────────────────────────────────────
  //  BOT IDENTITY
  // ──────────────────────────────────────────
  botName: process.env.BOT_NAME || 'Lz BOT',
  botVersion: '1.0.0',
  // Usamos BOT_PREFIX (no PREFIX) para evitar conflicto con la variable $PREFIX de Termux
  prefix: process.env.BOT_PREFIX || '.',
  language: process.env.LANGUAGE || 'es',

  // ──────────────────────────────────────────
  //  MENU IMAGE
  //  Pon la URL directa de tu imagen aquí o en .env
  //  Debe ser una URL pública directa (no Google Photos privado)
  //  Ejemplo: https://i.imgur.com/XXXXX.png
  // ──────────────────────────────────────────
  menuImage: process.env.MENU_IMAGE_URL || 'https://i.imgur.com/pOBRL8d.jpeg',

  // ──────────────────────────────────────────
  //  OWNER / DEVELOPER
  // ──────────────────────────────────────────
  // Format: "31629049445" (country code + number, no + or spaces)
  ownerNumber: process.env.OWNER_NUMBER || '',
  ownerName: process.env.OWNER_NAME || 'LzSunshNe',

  // ──────────────────────────────────────────
  //  SESSION
  // ──────────────────────────────────────────
  sessionPath: './session',

  // ──────────────────────────────────────────
  //  DATABASE
  // ──────────────────────────────────────────
  dbPath: './database/data.json',

  // ──────────────────────────────────────────
  //  AI / APIs (optional — bot funciona sin estas claves)
  // ──────────────────────────────────────────
  openaiKey: process.env.OPENAI_KEY || '',
  geminiKey: process.env.GEMINI_KEY || '',

  // ──────────────────────────────────────────
  //  ECONOMY
  // ──────────────────────────────────────────
  dailyAmount: 500,
  weeklyAmount: 2000,
  startCoins: 100,
  startXP: 0,
  xpPerMessage: 2,
  xpPerCommand: 5,
  levelMultiplier: 100, // XP needed = level * levelMultiplier

  // ──────────────────────────────────────────
  //  WORK ECONOMY
  // ──────────────────────────────────────────
  workJobs: [
    { job: 'programador', min: 100, max: 500 },
    { job: 'diseñador', min: 80, max: 400 },
    { job: 'streamer', min: 50, max: 300 },
    { job: 'youtuber', min: 70, max: 350 },
    { job: 'minero', min: 60, max: 250 },
    { job: 'cazador', min: 40, max: 200 },
    { job: 'agricultor', min: 30, max: 150 },
    { job: 'chef', min: 50, max: 280 },
    { job: 'médico', min: 150, max: 600 },
    { job: 'abogado', min: 120, max: 550 }
  ],

  // ──────────────────────────────────────────
  //  COOLDOWNS (in milliseconds)
  // ──────────────────────────────────────────
  cooldowns: {
    default: 3000,
    work: 3600000,    // 1 hour
    mine: 7200000,    // 2 hours
    hunt: 5400000,    // 1.5 hours
    daily: 86400000,  // 24 hours
    weekly: 604800000 // 7 days
  },

  // ──────────────────────────────────────────
  //  SECURITY
  // ──────────────────────────────────────────
  antiSpam: {
    enabled: true,
    maxMessages: 5,
    timeWindow: 5000, // 5 seconds
    muteTime: 60000   // 1 minute
  },
  antiFlood: {
    enabled: true,
    maxMessages: 10,
    timeWindow: 10000
  },
  rateLimit: {
    maxCommands: 8,
    timeWindow: 10000
  },

  // ──────────────────────────────────────────
  //  STICKER CONFIG
  // ──────────────────────────────────────────
  stickerAuthor: process.env.STICKER_AUTHOR || 'Lz Bot',
  stickerPack: process.env.STICKER_PACK || 'Lz 🐿️ᴀͨʀͧᴅᷞɪͦʟᷠʟᷧᴀ',

  // ──────────────────────────────────────────
  //  LEVELS
  // ──────────────────────────────────────────
  levelRewards: {
    5:  { coins: 500,  message: '¡Desbloqueaste comandos premium básicos!' },
    10: { coins: 1000, message: '¡Desbloqueaste comandos de economía avanzada!' },
    20: { coins: 2500, message: '¡Desbloqueaste comandos de IA sin límite!' },
    50: { coins: 5000, message: '¡Leyenda! Acceso completo a todos los comandos.' }
  },

  // ──────────────────────────────────────────
  //  SHOP ITEMS
  // ──────────────────────────────────────────
  shopItems: [
    { id: 'vip',     name: 'VIP Pass',       price: 5000,  description: 'Acceso a comandos VIP por 7 días' },
    { id: 'boost',   name: 'XP Boost x2',    price: 2000,  description: 'Duplica tu XP por 24 horas' },
    { id: 'protect', name: 'Escudo Anti-Ban', price: 3000,  description: 'Protección contra bans por 3 días' },
    { id: 'lucky',   name: 'Amuleto Suerte',  price: 1500,  description: 'Aumenta tus ganancias en juegos un 25%' }
  ],

  // ──────────────────────────────────────────
  //  MESSAGES
  // ──────────────────────────────────────────
  messages: {
    noPermission: '❌ No tienes permisos para usar este comando.',
    groupOnly: '❌ Este comando solo funciona en grupos.',
    privateOnly: '❌ Este comando solo funciona en privado.',
    ownerOnly: '❌ Este comando es exclusivo del owner.',
    adminOnly: '❌ Este comando es solo para administradores del grupo.',
    operatorOnly: '❌ Este comando es solo para operadores del bot.',
    notRegistered: '❌ Debes registrarte primero.\nUsa: .register Nombre/Edad',
    alreadyRegistered: '❌ Ya estás registrado. Usa .profile para ver tu perfil.',
    banned: '🚫 Estás baneado del bot.',
    cooldown: (time) => `⏳ Espera ${time} antes de usar este comando de nuevo.`,
    error: '❌ Ocurrió un error al procesar tu solicitud.'
  }
};
