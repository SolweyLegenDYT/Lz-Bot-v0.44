const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
  Browsers
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const readline = require('readline');
const fs = require('fs-extra');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const config = require('../config');

const SESSION_PATH = config.sessionPath;

// ── Reconexión con backoff exponencial ──────────
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60000; // máx 60s entre intentos

function getReconnectDelay() {
  const delay = Math.min(5000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  return delay;
}

function printBanner() {
  console.log(chalk.cyan(`
━━━━━━━━━━━━━━━━━━━━━━━
${chalk.bold.white('         LZ BOT')}
━━━━━━━━━━━━━━━━━━━━━━━
  v${config.botVersion} | Prefix: ${config.prefix}
━━━━━━━━━━━━━━━━━━━━━━━
`));
}

async function selectConnectionMethod() {
  printBanner();
  console.log(chalk.yellow('[1] Conectar mediante QR'));
  console.log(chalk.yellow('[2] Conectar mediante Código'));
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise(resolve => {
    rl.question(chalk.cyan('Seleccione una opción: '), answer => {
      rl.close();
      resolve(answer.trim() === '2' ? 'code' : 'qr');
    });
  });
}

async function askPhoneNumber() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(chalk.cyan('Ingresa tu número (ej: +521XXXXXXXXXX): '), num => {
      rl.close();
      resolve(num.trim().replace(/[^0-9]/g, ''));
    });
  });
}

// ── Obtener versión de WA Web de forma robusta ──
async function getWAVersion() {
  try {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.gray(`   WA Web v${version.join('.')} ${isLatest ? '(latest)' : '(puede estar desactualizada)'}`));
    return version;
  } catch {
    // Versión conocida estable como fallback
    console.log(chalk.yellow('   No se pudo obtener versión WA — usando versión estable de respaldo'));
    return [2, 3000, 1015901307];
  }
}

// ── Crear socket de WhatsApp ─────────────────────
async function buildSocket(state, version, logger) {
  return makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    // Browsers.ubuntu('Chrome') es el fingerprint más aceptado por WhatsApp
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    retryRequestDelayMs: 2000,
    generateHighQualityLinkPreview: true,
    shouldIgnoreJid: jid => isJidBroadcast(jid),
    getMessage: async () => ({ conversation: '' })
  });
}

// ── Conexión principal (primera vez — muestra QR/código) ─
async function createConnection(handler) {
  const method = await selectConnectionMethod();

  fs.ensureDirSync(SESSION_PATH);
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  const version = await getWAVersion();
  const logger = pino({ level: 'silent' });

  const sock = await buildSocket(state, version, logger);

  // ── Mostrar QR o Código de vinculación ─────────
  if (method === 'qr') {
    sock.ev.on('connection.update', ({ qr }) => {
      if (qr) {
        console.log(chalk.green('\n📱 Escanea el QR → WhatsApp → Dispositivos vinculados → Vincular dispositivo\n'));
        qrcode.generate(qr, { small: true });
      }
    });
  } else {
    if (!sock.authState.creds.registered) {
      const phoneNumber = await askPhoneNumber();
      try {
        await new Promise(r => setTimeout(r, 2000)); // esperar que el socket esté listo
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(chalk.green(`\n🔑 Código de vinculación: ${chalk.bold.yellow(code)}`));
        console.log(chalk.gray('  WhatsApp → Dispositivos vinculados → Vincular con número de teléfono\n'));
      } catch (e) {
        console.error(chalk.red('❌ Error al solicitar código:', e.message));
      }
    }
  }

  // ── Eventos de conexión ─────────────────────────
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    handleConnectionUpdate({ connection, lastDisconnect, sock, handler, version, saveCreds });
  });

  sock.ev.on('creds.update', saveCreds);

  handler(sock);
  return sock;
}

// ── Reconexión silenciosa (sin menú, usa sesión guardada) ─
async function reconnect(handler) {
  const delay = getReconnectDelay();
  console.log(chalk.yellow(`🔄 Reconectando en ${Math.round(delay / 1000)}s... (intento ${reconnectAttempts})`));

  await new Promise(r => setTimeout(r, delay));

  try {
    fs.ensureDirSync(SESSION_PATH);
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    const version = await getWAVersion();
    const logger = pino({ level: 'silent' });

    const sock = await buildSocket(state, version, logger);

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
      handleConnectionUpdate({ connection, lastDisconnect, sock, handler, version, saveCreds });
    });

    sock.ev.on('creds.update', saveCreds);

    handler(sock);
    return sock;
  } catch (e) {
    console.error(chalk.red('❌ Error al reconectar:', e.message));
    return reconnect(handler);
  }
}

// ── Manejador central de eventos de conexión ────
function handleConnectionUpdate({ connection, lastDisconnect, handler }) {
  if (connection === 'connecting') {
    console.log(chalk.gray('   Conectando con WhatsApp...'));
  }

  if (connection === 'open') {
    reconnectAttempts = 0; // resetear contador al conectar exitosamente
    console.log(chalk.green('\n✅ Bot conectado correctamente'));
  }

  if (connection === 'close') {
    const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
    const reason = lastDisconnect?.error?.message || 'Desconocido';

    console.log(chalk.red(`\n⚠️  Conexión cerrada — Código: ${statusCode} | ${reason}`));

    switch (statusCode) {
      case DisconnectReason.loggedOut:
        // Sesión inválida — borrar y pedir vinculación de nuevo
        console.log(chalk.red('🚪 Sesión cerrada por WhatsApp. Borra la carpeta "session" y reinicia el bot.'));
        try { fs.removeSync(SESSION_PATH); } catch {}
        process.exit(1);
        break;

      case DisconnectReason.badSession:
        // Sesión corrupta — borrar y reconectar
        console.log(chalk.yellow('🗑️  Sesión corrupta. Eliminando sesión y reiniciando...'));
        try { fs.removeSync(SESSION_PATH); } catch {}
        reconnect(handler);
        break;

      case 503:
        // WhatsApp rechazó la conexión temporalmente — esperar más
        console.log(chalk.yellow('⏳ WhatsApp rechazó la conexión (503). Espera un momento antes de reintentar.'));
        reconnect(handler);
        break;

      case DisconnectReason.connectionReplaced:
        console.log(chalk.red('📵 Conexión reemplazada — el bot fue abierto en otro lugar.'));
        process.exit(0);
        break;

      case DisconnectReason.timedOut:
      case DisconnectReason.connectionLost:
      case DisconnectReason.connectionClosed:
      default:
        // Desconexión temporal — reconectar normalmente
        reconnect(handler);
        break;
    }
  }
}

module.exports = { createConnection };
