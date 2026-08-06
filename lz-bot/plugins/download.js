const axios = require('axios');
const config = require('../config');
const { checkCooldown, setCooldown, formatCooldown } = require('../lib/security');

const DL_COOLDOWN = 20000; // 20 seconds

// ── Búsqueda YouTube via scraping ligero ──────
async function searchYoutube(query) {
  // Usa la API pública de sugerencias de YouTube para obtener el primer resultado
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9'
    },
    timeout: 10000
  });
  const html = res.data;
  // Extrae el primer videoId del JSON embebido en la página
  const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  if (!match) return null;
  const vidId = match[1];
  // Extrae título si es posible
  const titleMatch = html.match(/"title":{"runs":\[{"text":"([^"]+)"}/);
  const title = titleMatch ? titleMatch[1] : query;
  return { videoId: vidId, title, url: `https://youtube.com/watch?v=${vidId}` };
}

// ── Descarga via Cobalt API (servicio gratuito) ─
async function cobaltDownload(youtubeUrl, audioOnly = false) {
  const payload = {
    url: youtubeUrl,
    downloadMode: audioOnly ? 'audio' : 'auto',
    audioFormat: 'mp3',
    filenameStyle: 'basic',
    videoQuality: '720'
  };
  const res = await axios.post('https://api.cobalt.tools/', payload, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });
  return res.data; // { status, url, filename }
}

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
        const isUrl = query.startsWith('http');

        await sock.sendMessage(msg.key.remoteJid, { text: `🔍 _Buscando "${query}"..._` }, { quoted: msg });

        try {
          let videoUrl = query;
          let videoTitle = query;

          if (!isUrl) {
            const result = await searchYoutube(query);
            if (!result) throw new Error('No se encontró el video en YouTube');
            videoUrl = result.url;
            videoTitle = result.title;
            await sock.sendMessage(msg.key.remoteJid, { text: `🎵 Encontrado: *${videoTitle}*\n⏳ _Descargando audio..._` }, { quoted: msg });
          }

          const cobalt = await cobaltDownload(videoUrl, true);

          if (!cobalt.url) throw new Error('No se pudo obtener el enlace de descarga');

          const audioRes = await axios.get(cobalt.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            maxContentLength: 50 * 1024 * 1024 // máx 50 MB
          });

          await sock.sendMessage(msg.key.remoteJid, {
            audio: Buffer.from(audioRes.data),
            mimetype: 'audio/mpeg',
            ptt: false
          }, { quoted: msg });

          await sock.sendMessage(msg.key.remoteJid, {
            text: `✅ *${videoTitle}*\n🔗 ${videoUrl}`
          }, { quoted: msg });

        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *No se pudo descargar el audio*\n\n${e.message}\n\n💡 _Intenta con la URL directa de YouTube_`
          }, { quoted: msg });
        }
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
        const isUrl = query.startsWith('http');

        await sock.sendMessage(msg.key.remoteJid, { text: `🔍 _Buscando "${query}"..._` }, { quoted: msg });

        try {
          let videoUrl = query;
          let videoTitle = query;

          if (!isUrl) {
            const result = await searchYoutube(query);
            if (!result) throw new Error('No se encontró el video en YouTube');
            videoUrl = result.url;
            videoTitle = result.title;
            await sock.sendMessage(msg.key.remoteJid, { text: `🎬 Encontrado: *${videoTitle}*\n⏳ _Descargando video (720p)..._` }, { quoted: msg });
          }

          const cobalt = await cobaltDownload(videoUrl, false);

          if (!cobalt.url) throw new Error('No se pudo obtener el enlace de descarga');

          const videoRes = await axios.get(cobalt.url, {
            responseType: 'arraybuffer',
            timeout: 90000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            maxContentLength: 100 * 1024 * 1024 // máx 100 MB
          });

          await sock.sendMessage(msg.key.remoteJid, {
            video: Buffer.from(videoRes.data),
            caption: `🎬 *${videoTitle}*\n🔗 ${videoUrl}`,
            mimetype: 'video/mp4'
          }, { quoted: msg });

        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *No se pudo descargar el video*\n\n${e.message}\n\n💡 _Intenta con la URL directa de YouTube o usa ${config.prefix}ytmp3 para solo audio_`
          }, { quoted: msg });
        }
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
