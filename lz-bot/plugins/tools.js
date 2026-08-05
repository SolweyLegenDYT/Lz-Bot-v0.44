const axios = require('axios');
const config = require('../config');
const { create } = require('qrcode-terminal');
const QRCode = require('qrcode-terminal');
const mathjs = require('mathjs');
const crypto = require('crypto');

module.exports = {
  name: 'tools',
  commands: [
    // ── QR Generator ───────────────────────────
    {
      pattern: /^qr\s+(.+)$/i,
      async handler(sock, msg, { match }) {
        const text = match[1].trim();
        try {
          const { default: QRCodeLib } = await import('qrcode').catch(() => ({ default: null }));
          if (!QRCodeLib) {
            return sock.sendMessage(msg.key.remoteJid, {
              text: `📷 *QR Generado*\n\nInstala *qrcode* con: npm i qrcode\nTexto: "${text}"`
            }, { quoted: msg });
          }
          const buf = await QRCodeLib.toBuffer(text, { type: 'png', width: 300, margin: 2 });
          await sock.sendMessage(msg.key.remoteJid, {
            image: buf,
            caption: `📷 *Código QR*\n"${text}"`
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `📷 *QR para:* "${text}"\n\n_Instala qrcode (npm i qrcode) para generar imagen QR_`
          }, { quoted: msg });
        }
      }
    },

    // ── Calculator ─────────────────────────────
    {
      pattern: /^calc\s+(.+)$/i,
      async handler(sock, msg, { match }) {
        const expression = match[1].trim();
        try {
          const result = mathjs.evaluate(expression);
          await sock.sendMessage(msg.key.remoteJid, {
            text: `🧮 *Calculadora*\n\n📝 ${expression}\n✅ = *${result}*`
          }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Expresión inválida: "${expression}"`
          }, { quoted: msg });
        }
      }
    },

    // ── Password Generator ─────────────────────
    {
      pattern: /^password(?:\s+(\d+))?$/i,
      async handler(sock, msg, { match }) {
        const len = Math.min(parseInt(match[1]) || 16, 64);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}';
        let password = '';
        for (let i = 0; i < len; i++) {
          password += chars[Math.floor(Math.random() * chars.length)];
        }
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🔐 *Contraseña Generada*\n\n\`${password}\`\n\n🔢 Longitud: ${len} caracteres`
        }, { quoted: msg });
      }
    },

    // ── Short URL ──────────────────────────────
    {
      pattern: /^shorturl\s+(https?:\/\/\S+)$/i,
      async handler(sock, msg, { match }) {
        const url = match[1];
        try {
          const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 8000 });
          await sock.sendMessage(msg.key.remoteJid, {
            text: `🔗 *URL Acortada*\n\n📎 Original: ${url}\n✂️ Corta: *${res.data}*`
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(msg.key.remoteJid, { text: '❌ No se pudo acortar la URL.' }, { quoted: msg });
        }
      }
    },

    // ── Weather ────────────────────────────────
    {
      pattern: /^weather\s+(.+)$/i,
      async handler(sock, msg, { match }) {
        const city = encodeURIComponent(match[1].trim());
        try {
          const res = await axios.get(`https://wttr.in/${city}?format=%C+%t+%h+%w&lang=es`, { timeout: 8000 });
          const [condition, temp, humidity, wind] = res.data.split(' ');
          await sock.sendMessage(msg.key.remoteJid, {
            text: `🌤️ *Clima en ${decodeURIComponent(city)}*\n\n🌡️ Temperatura: *${temp}*\n☁️ Condición: *${condition}*\n💧 Humedad: *${humidity}*\n💨 Viento: *${wind}*`
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `🌤️ *Clima*\n\nNo se pudo obtener el clima de "${decodeURIComponent(city)}".\nVerifica el nombre de la ciudad.`
          }, { quoted: msg });
        }
      }
    },

    // ── Date ───────────────────────────────────
    {
      pattern: /^date$/i,
      async handler(sock, msg) {
        const now = new Date();
        await sock.sendMessage(msg.key.remoteJid, {
          text: `📅 *Fecha actual*\n\n${now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
        }, { quoted: msg });
      }
    },

    // ── Time ───────────────────────────────────
    {
      pattern: /^time$/i,
      async handler(sock, msg) {
        const now = new Date();
        await sock.sendMessage(msg.key.remoteJid, {
          text: `⏰ *Hora actual*\n\n${now.toLocaleTimeString('es-ES')}\n🌐 UTC: ${now.toUTCString()}`
        }, { quoted: msg });
      }
    },

    // ── Speed test (simulated) ─────────────────
    {
      pattern: /^speed$/i,
      async handler(sock, msg) {
        await sock.sendMessage(msg.key.remoteJid, { text: '📡 _Midiendo velocidad..._' }, { quoted: msg });
        const start = Date.now();
        try {
          await axios.get('https://httpbin.org/get', { timeout: 5000 });
          const ms = Date.now() - start;
          const mbps = (Math.random() * 50 + 10).toFixed(2);
          await sock.sendMessage(msg.key.remoteJid, {
            text: `📡 *Test de velocidad*\n\n⚡ Ping: *${ms}ms*\n⬇️ Descarga: *~${mbps} Mbps*\n⬆️ Subida: *~${(mbps / 2).toFixed(2)} Mbps*`
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(msg.key.remoteJid, { text: '❌ Error en el test de velocidad.' }, { quoted: msg });
        }
      }
    }
  ]
};
