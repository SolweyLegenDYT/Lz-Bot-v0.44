const axios = require('axios');
const config = require('../config');
const { checkCooldown, setCooldown, formatCooldown } = require('../lib/security');

const DL_COOLDOWN = 15000; // 15 seconds

module.exports = {
  name: 'download',
  commands: [
    // ── YouTube MP3 ────────────────────────────
    {
      pattern: /^(ytmp3|play|audio)\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'dl');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'dl', DL_COOLDOWN);

        const query = match[2].trim();
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🎵 *YouTube MP3*\n\nBuscando: "${query}"...\n\n⚠️ Esta función requiere una API de descarga (yt-dlp o API pública).\nInstala *yt-dlp* en el servidor para activarla.\n\nComando: \`yt-dlp -x --audio-format mp3 "ytsearch1:${query}"\``
        }, { quoted: msg });
      }
    },

    // ── YouTube MP4 ────────────────────────────
    {
      pattern: /^(ytmp4|video)\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'dl');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'dl', DL_COOLDOWN);

        const query = match[2].trim();
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🎬 *YouTube MP4*\n\nBuscando: "${query}"...\n\n⚠️ Esta función requiere *yt-dlp* instalado en el servidor.\nEjecuta: \`yt-dlp "ytsearch1:${query}" -f best\``
        }, { quoted: msg });
      }
    },

    // ── TikTok ─────────────────────────────────
    {
      pattern: /^(tiktok|tt)\s+(https?:\/\/\S+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'dl');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'dl', DL_COOLDOWN);

        const url = match[2];
        await sock.sendMessage(msg.key.remoteJid, { text: '📥 _Descargando TikTok..._' }, { quoted: msg });

        try {
          // Using a public TikTok API
          const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, { timeout: 15000 });
          const data = res.data;
          if (data?.video?.noWatermark) {
            const videoRes = await axios.get(data.video.noWatermark, { responseType: 'arraybuffer', timeout: 30000 });
            await sock.sendMessage(msg.key.remoteJid, {
              video: Buffer.from(videoRes.data),
              caption: `🎵 ${data.title || 'TikTok'}\n👤 ${data.author?.name || 'Unknown'}`,
              mimetype: 'video/mp4'
            }, { quoted: msg });
          } else {
            throw new Error('No se encontró video');
          }
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ No se pudo descargar el TikTok.\nError: ${e.message}`
          }, { quoted: msg });
        }
      }
    },

    // ── Instagram ──────────────────────────────
    {
      pattern: /^ig\s+(https?:\/\/\S+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'dl');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'dl', DL_COOLDOWN);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `📸 *Instagram Downloader*\n\nURL: ${match[1]}\n\n⚠️ Esta función requiere autenticación con Instagram.\nConfigura cookies de sesión en el archivo .env para activarla.`
        }, { quoted: msg });
      }
    },

    // ── Spotify ────────────────────────────────
    {
      pattern: /^(spotify|spotifydl)\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'dl');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'dl', DL_COOLDOWN);

        const query = match[2].trim();
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🎵 *Spotify Downloader*\n\nBusca: "${query}"\n\n⚠️ Esta función requiere una API de Spotify.\nConfigura SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en .env`
        }, { quoted: msg });
      }
    },

    // ── Facebook ───────────────────────────────
    {
      pattern: /^fb\s+(https?:\/\/\S+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'dl');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'dl', DL_COOLDOWN);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `📘 *Facebook Downloader*\n\n⚠️ Los videos de Facebook requieren cookies de sesión.\nConfigura FB_COOKIES en .env para activarlo.`
        }, { quoted: msg });
      }
    },

    // ── Pinterest ──────────────────────────────
    {
      pattern: /^pin\s+(https?:\/\/\S+)$/i,
      async handler(sock, msg, { sender, match }) {
        const url = match[1];
        await sock.sendMessage(msg.key.remoteJid, { text: '📌 _Descargando Pinterest..._' }, { quoted: msg });
        try {
          const res = await axios.get(`https://www.pinterest.com/oembed/?url=${encodeURIComponent(url)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
          });
          const thumb = res.data?.thumbnail_url;
          if (thumb) {
            const imgRes = await axios.get(thumb, { responseType: 'arraybuffer', timeout: 15000 });
            await sock.sendMessage(msg.key.remoteJid, {
              image: Buffer.from(imgRes.data),
              caption: `📌 ${res.data?.title || 'Pinterest'}`
            }, { quoted: msg });
          } else throw new Error('No se encontró imagen');
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ No se pudo descargar: ${e.message}` }, { quoted: msg });
        }
      }
    },

    // ── GitHub repo info ───────────────────────
    {
      pattern: /^github\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)$/i,
      async handler(sock, msg, { match }) {
        const repo = match[1];
        try {
          const res = await axios.get(`https://api.github.com/repos/${repo}`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' },
            timeout: 8000
          });
          const d = res.data;
          await sock.sendMessage(msg.key.remoteJid, {
            text: `🐙 *GitHub — ${d.full_name}*\n\n📝 ${d.description || 'Sin descripción'}\n⭐ Stars: ${d.stargazers_count}\n🍴 Forks: ${d.forks_count}\n👁️ Watchers: ${d.watchers_count}\n💻 Lenguaje: ${d.language || 'N/A'}\n📅 Actualizado: ${new Date(d.updated_at).toLocaleDateString('es')}\n🔗 ${d.html_url}`
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ No se encontró el repositorio "${repo}"` }, { quoted: msg });
        }
      }
    }
  ]
};
