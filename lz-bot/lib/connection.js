const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const readline = require('readline');
const fs = require('fs-extra');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const config = require('../config');

const SESSION_PATH = config.sessionPath;

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
    rl.question(chalk.cyan('Ingresa tu número (ej: +51999999999): '), num => {
      rl.close();
      resolve(num.trim().replace(/[^0-9]/g, ''));
    });
  });
}

async function createConnection(handler) {
  const method = await selectConnectionMethod();

  fs.ensureDirSync(SESSION_PATH);
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  const { version } = await fetchLatestBaileysVersion();

  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: ['LZ BOT', 'Chrome', '120.0'],
    generateHighQualityLinkPreview: true,
    shouldIgnoreJid: jid => isJidBroadcast(jid),
    getMessage: async () => undefined
  });

  // ── QR or Pairing Code ──────────────────────
  if (method === 'qr') {
    sock.ev.on('connection.update', ({ qr }) => {
      if (qr) {
        console.log(chalk.green('\n📱 Escanea el código QR desde WhatsApp → Dispositivos vinculados → Vincular dispositivo\n'));
        qrcode.generate(qr, { small: true });
      }
    });
  } else {
    // Pairing code method
    if (!sock.authState.creds.registered) {
      const phoneNumber = await askPhoneNumber();
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(chalk.green(`\n🔑 Tu código de vinculación: ${chalk.bold.yellow(code)}`));
        console.log(chalk.gray('  WhatsApp → Dispositivos vinculados → Vincular con número de teléfono\n'));
      } catch (e) {
        console.error(chalk.red('Error al solicitar código de vinculación:', e.message));
      }
    }
  }

  // ── Connection events ───────────────────────
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      console.log(chalk.red(`\n⚠️  Conexión cerrada. Razón: ${reason}`));

      if (shouldReconnect) {
        console.log(chalk.yellow('🔄 Reconectando automáticamente...'));
        setTimeout(() => createConnection(handler), 5000);
      } else {
        console.log(chalk.red('🚪 Sesión cerrada. Por favor vuelve a vincular el bot.'));
        // Remove corrupted session
        try { fs.removeSync(SESSION_PATH); } catch {}
      }
    }

    if (connection === 'open') {
      console.log(chalk.green(`\n✅ Bot conectado como: ${sock.user?.name || sock.user?.id}`));
      console.log(chalk.gray(`   Número: ${sock.user?.id?.split(':')[0]}`));
      console.log(chalk.gray(`   Versión WA: ${version.join('.')}\n`));
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── Attach message handler ──────────────────
  handler(sock);

  return sock;
}

module.exports = { createConnection };
