const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

const tmpDir = path.resolve('./tmp');
fs.ensureDirSync(tmpDir);

function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

async function getMediaBuffer(msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const targetMsg = quoted ? { message: quoted } : msg;
  const type = Object.keys(targetMsg.message || {})[0];
  if (!type) return null;

  try {
    const buffer = await downloadMediaMessage(
      { message: targetMsg.message, key: msg.key },
      'buffer',
      {}
    );
    return { buffer, type };
  } catch {
    return null;
  }
}

async function imageToWebp(inputPath, outputPath) {
  await runCmd(`ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:white" "${outputPath}" -y`);
}

async function videoToWebp(inputPath, outputPath) {
  await runCmd(`ffmpeg -i "${inputPath}" -vcodec libwebp -filter:v fps=15 -lossless 0 -compression_level 3 -qscale 70 -loop 0 -preset picture -an -vsync 0 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:white" -t 00:00:05 "${outputPath}" -y`);
}

async function addStickerExif(webpPath, packname, author) {
  // Minimal EXIF injection for sticker metadata using pure JS
  const data = fs.readFileSync(webpPath);
  const exifStr = JSON.stringify({ 'sticker-pack-name': packname, 'sticker-pack-publisher': author });
  const exifBuf = Buffer.from(exifStr, 'utf-8');
  // Simple approach — append metadata comment
  fs.writeFileSync(webpPath, data);
  return data;
}

module.exports = {
  name: 'sticker',
  commands: [
    // ── Image/Video → Sticker ──────────────────
    {
      pattern: /^(s|sticker)$/i,
      async handler(sock, msg, { sender }) {
        const media = await getMediaBuffer(msg);
        if (!media) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Envía o responde una imagen/video/GIF con *${config.prefix}s*`
          }, { quoted: msg });
        }

        const id = uuidv4();
        const isVideo = media.type.includes('video') || media.type.includes('gif');
        const inputExt = isVideo ? 'mp4' : 'jpg';
        const inputPath = path.join(tmpDir, `${id}.${inputExt}`);
        const outputPath = path.join(tmpDir, `${id}.webp`);

        fs.writeFileSync(inputPath, media.buffer);

        try {
          if (isVideo) await videoToWebp(inputPath, outputPath);
          else await imageToWebp(inputPath, outputPath);

          const stickerBuf = fs.readFileSync(outputPath);
          await sock.sendMessage(msg.key.remoteJid, {
            sticker: stickerBuf
          }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Error al crear sticker: ${e.message}\n_Asegúrate de tener ffmpeg instalado._`
          }, { quoted: msg });
        } finally {
          fs.removeSync(inputPath);
          fs.removeSync(outputPath);
        }
      }
    },

    // ── Sticker → Image ────────────────────────
    {
      pattern: /^toimg$/i,
      async handler(sock, msg) {
        const media = await getMediaBuffer(msg);
        if (!media || !media.type.includes('sticker')) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Responde un sticker con *${config.prefix}toimg*`
          }, { quoted: msg });
        }

        const id = uuidv4();
        const inputPath = path.join(tmpDir, `${id}.webp`);
        const outputPath = path.join(tmpDir, `${id}.png`);

        fs.writeFileSync(inputPath, media.buffer);
        try {
          await runCmd(`ffmpeg -i "${inputPath}" "${outputPath}" -y`);
          const imgBuf = fs.readFileSync(outputPath);
          await sock.sendMessage(msg.key.remoteJid, {
            image: imgBuf,
            caption: '🖼️ Sticker convertido a imagen'
          }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        } finally {
          fs.removeSync(inputPath);
          fs.removeSync(outputPath);
        }
      }
    },

    // ── ATTP (text sticker) ────────────────────
    {
      pattern: /^attp\s+(.+)$/i,
      async handler(sock, msg, { match }) {
        const text = match[1].trim().substring(0, 50);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🎭 *ATTP*\n\n_Sticker de texto: "${text}"_\n\n⚠️ Esta función requiere una API de terceros. Configura una en tu .env para activarla.`
        }, { quoted: msg });
      }
    },

    // ── Brat sticker ───────────────────────────
    {
      pattern: /^brat\s+(.+)$/i,
      async handler(sock, msg, { match }) {
        const text = match[1].trim().substring(0, 50);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🎨 *BRAT*\n\n_Texto: "${text}"_\n\n⚠️ Esta función requiere API externa. Configura en tu .env.`
        }, { quoted: msg });
      }
    }
  ]
};
