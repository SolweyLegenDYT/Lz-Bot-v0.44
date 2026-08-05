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

async function getImageBuffer(msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const targetMsg = quoted ? { message: quoted } : msg;
  const type = Object.keys(targetMsg.message || {})[0];
  if (!type?.includes('image')) return null;
  try {
    return await downloadMediaMessage({ message: targetMsg.message, key: msg.key }, 'buffer', {});
  } catch { return null; }
}

async function applyFFmpegFilter(buf, filter, ext = 'jpg') {
  const id = uuidv4();
  const input = path.join(tmpDir, `${id}_in.${ext}`);
  const output = path.join(tmpDir, `${id}_out.${ext}`);
  fs.writeFileSync(input, buf);
  try {
    await runCmd(`ffmpeg -i "${input}" ${filter} "${output}" -y`);
    return fs.readFileSync(output);
  } finally {
    fs.removeSync(input);
    fs.removeSync(output);
  }
}

function makeFilter(name, filter, description) {
  return {
    pattern: new RegExp(`^${name}$`, 'i'),
    async handler(sock, msg) {
      const buf = await getImageBuffer(msg);
      if (!buf) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Envía o responde una imagen con *${config.prefix}${name}*` }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { text: `🖼️ _Aplicando ${description}..._` }, { quoted: msg });
      try {
        const out = await applyFFmpegFilter(buf, filter);
        await sock.sendMessage(msg.key.remoteJid, { image: out, caption: `✅ Filtro: *${description}*` }, { quoted: msg });
      } catch (e) {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}\n_Asegúrate de tener ffmpeg instalado._` }, { quoted: msg });
      }
    }
  };
}

module.exports = {
  name: 'image',
  commands: [
    makeFilter('blur', '-vf boxblur=5:1', 'Desenfoque'),
    makeFilter('pixel', '-vf pixelize=10:10', 'Pixelado'),
    makeFilter('invert', '-vf negate', 'Invertir colores'),
    makeFilter('sketch', '-vf edgedetect=low=0.1:high=0.4', 'Boceto'),
    makeFilter('brightness', '-vf eq=brightness=0.3', 'Brillo +'),

    // Cartoon effect
    {
      pattern: /^cartoon$/i,
      async handler(sock, msg) {
        const buf = await getImageBuffer(msg);
        if (!buf) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Envía una imagen con *${config.prefix}cartoon*` }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, { text: '🎨 _Aplicando efecto cartoon..._' }, { quoted: msg });
        try {
          const out = await applyFFmpegFilter(buf, '-vf "edgedetect=low=0.1:high=0.3,negate"');
          await sock.sendMessage(msg.key.remoteJid, { image: out, caption: '🎨 Efecto: *Cartoon*' }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // Anime effect
    {
      pattern: /^anime$/i,
      async handler(sock, msg) {
        const buf = await getImageBuffer(msg);
        if (!buf) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Envía una imagen con *${config.prefix}anime*` }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, { text: '🌸 _Aplicando filtro anime..._' }, { quoted: msg });
        try {
          const out = await applyFFmpegFilter(buf, '-vf "hue=s=2,eq=contrast=1.3:brightness=0.1"');
          await sock.sendMessage(msg.key.remoteJid, { image: out, caption: '🌸 Efecto: *Anime*' }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // Rotate
    {
      pattern: /^rotate(?:\s+(\d+))?$/i,
      async handler(sock, msg, { match }) {
        const degrees = parseInt(match?.[1]) || 90;
        const buf = await getImageBuffer(msg);
        if (!buf) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Envía una imagen con *${config.prefix}rotate*` }, { quoted: msg });
        try {
          const out = await applyFFmpegFilter(buf, `-vf "rotate=${degrees}*PI/180"`);
          await sock.sendMessage(msg.key.remoteJid, { image: out, caption: `🔄 Rotada ${degrees}°` }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // Remove background placeholder
    {
      pattern: /^removebg$/i,
      async handler(sock, msg) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🖼️ *Remove Background*\n\n⚠️ Esta función requiere la API de remove.bg.\nConfigura *REMOVEBG_API_KEY* en tu .env\n\nhttps://www.remove.bg/`
        }, { quoted: msg });
      }
    },

    // Upscale placeholder
    {
      pattern: /^(upscale|hd)$/i,
      async handler(sock, msg) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `📸 *Upscale HD*\n\n⚠️ Esta función requiere una API de upscaling.\nConfigura *UPSCALE_API_KEY* en tu .env\n\nAlternativas: waifu2x, upscayl, real-esrgan`
        }, { quoted: msg });
      }
    }
  ]
};
