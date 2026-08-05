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

async function getAudioBuffer(msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const targetMsg = quoted ? { message: quoted } : msg;
  const type = Object.keys(targetMsg.message || {})[0];
  if (!type?.includes('audio')) return null;
  try {
    return await downloadMediaMessage({ message: targetMsg.message, key: msg.key }, 'buffer', {});
  } catch { return null; }
}

async function applyAudioFilter(buf, filter, inputExt = 'ogg') {
  const id = uuidv4();
  const input = path.join(tmpDir, `${id}_in.${inputExt}`);
  const output = path.join(tmpDir, `${id}_out.mp3`);
  fs.writeFileSync(input, buf);
  try {
    await runCmd(`ffmpeg -i "${input}" ${filter} "${output}" -y`);
    return fs.readFileSync(output);
  } finally {
    fs.removeSync(input);
    fs.removeSync(output);
  }
}

function makeAudioEffect(name, filter, caption) {
  return {
    pattern: new RegExp(`^${name}$`, 'i'),
    async handler(sock, msg) {
      const buf = await getAudioBuffer(msg);
      if (!buf) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde un audio con *${config.prefix}${name}*` }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { text: `🔊 _Aplicando efecto ${caption}..._` }, { quoted: msg });
      try {
        const out = await applyAudioFilter(buf, filter);
        await sock.sendMessage(msg.key.remoteJid, {
          audio: out,
          mimetype: 'audio/mpeg',
          ptt: false
        }, { quoted: msg });
      } catch (e) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ Error: ${e.message}\n_Asegúrate de tener ffmpeg instalado._`
        }, { quoted: msg });
      }
    }
  };
}

module.exports = {
  name: 'audio',
  commands: [
    makeAudioEffect('bass', '-af "equalizer=f=40:t=o:w=2:g=15"', 'Bass Boost'),
    makeAudioEffect('reverb', '-af "aecho=0.8:0.9:1000:0.3"', 'Reverb'),
    makeAudioEffect('robot', '-af "aecho=0.8:0.9:50:0.5,atempo=0.9,asetrate=44100*0.8"', 'Robot'),
    makeAudioEffect('nightcore', '-af "asetrate=44100*1.25,aresample=44100,atempo=1.0"', 'Nightcore'),
    makeAudioEffect('deep', '-af "asetrate=44100*0.75,aresample=44100"', 'Deep/Voz Grave'),
    makeAudioEffect('slow', '-af "atempo=0.7"', 'Lento'),
    makeAudioEffect('fast', '-af "atempo=1.5"', 'Rápido'),

    // Reverse
    {
      pattern: /^reverse$/i,
      async handler(sock, msg) {
        const buf = await getAudioBuffer(msg);
        if (!buf) return sock.sendMessage(msg.key.remoteJid, { text: `❌ Responde un audio con *${config.prefix}reverse*` }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, { text: '🔊 _Invirtiendo audio..._' }, { quoted: msg });
        try {
          const out = await applyAudioFilter(buf, '-af areverse');
          await sock.sendMessage(msg.key.remoteJid, { audio: out, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    }
  ]
};
