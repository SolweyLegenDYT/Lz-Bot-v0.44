const axios = require('axios');
const config = require('../config');
const { checkCooldown, setCooldown, formatCooldown } = require('../lib/security');

const SEARCH_COOLDOWN = 5000;

module.exports = {
  name: 'search',
  commands: [
    // ── Wikipedia ──────────────────────────────
    {
      pattern: /^wikipedia\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'search');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'search', SEARCH_COOLDOWN);

        const query = encodeURIComponent(match[1].trim());
        await sock.sendMessage(msg.key.remoteJid, { text: '🔍 _Buscando en Wikipedia..._' }, { quoted: msg });
        try {
          const res = await axios.get(
            `https://es.wikipedia.org/api/rest_v1/page/summary/${query}`,
            { timeout: 8000 }
          );
          const { title, extract, content_urls } = res.data;
          const text = extract?.substring(0, 500) + (extract?.length > 500 ? '...' : '');
          await sock.sendMessage(msg.key.remoteJid, {
            text: `📚 *Wikipedia — ${title}*\n\n${text}\n\n🔗 ${content_urls?.desktop?.page || ''}`
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ No se encontró información sobre "${decodeURIComponent(query)}" en Wikipedia.`
          }, { quoted: msg });
        }
      }
    },

    // ── YouTube search ─────────────────────────
    {
      pattern: /^youtube\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'search');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'search', SEARCH_COOLDOWN);

        const query = match[1].trim();
        const encoded = encodeURIComponent(query);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `▶️ *YouTube — "${query}"*\n\n🔗 https://www.youtube.com/results?search_query=${encoded}\n\n_Usa ${config.prefix}ytmp3 o ${config.prefix}ytmp4 para descargar_`
        }, { quoted: msg });
      }
    },

    // ── Google search ──────────────────────────
    {
      pattern: /^google\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'search');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'search', SEARCH_COOLDOWN);

        const query = match[1].trim();
        const encoded = encodeURIComponent(query);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🔍 *Google — "${query}"*\n\n🔗 https://www.google.com/search?q=${encoded}`
        }, { quoted: msg });
      }
    },

    // ── NPM package ────────────────────────────
    {
      pattern: /^npm\s+(.+)$/i,
      async handler(sock, msg, { match }) {
        const pkg = match[1].trim();
        try {
          const res = await axios.get(`https://registry.npmjs.org/${pkg}`, { timeout: 8000 });
          const d = res.data;
          const latest = d['dist-tags']?.latest;
          const info = d.versions?.[latest];
          await sock.sendMessage(msg.key.remoteJid, {
            text: `📦 *NPM — ${d.name}*\n\n📝 ${d.description || 'Sin descripción'}\n🏷️ Versión: *${latest}*\n⬇️ Descargas semanales: ver npmjs.com\n🔗 https://npmjs.com/package/${pkg}`
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ No se encontró el paquete "${pkg}" en NPM.` }, { quoted: msg });
        }
      }
    },

    // ── Anime search ────────────────────────────
    {
      pattern: /^anime\s+(.+)$/i,
      async handler(sock, msg, { match }) {
        const query = match[1].trim();
        try {
          const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, { timeout: 10000 });
          const anime = res.data.data?.[0];
          if (!anime) throw new Error('No encontrado');
          await sock.sendMessage(msg.key.remoteJid, {
            text: `🌸 *Anime — ${anime.title}*\n\n📝 ${anime.synopsis?.substring(0, 300) || 'Sin sinopsis'}...\n\n⭐ Puntuación: *${anime.score || 'N/A'}*\n📺 Episodios: *${anime.episodes || '?'}*\n🗂️ Géneros: ${anime.genres?.map(g => g.name).join(', ') || 'N/A'}\n🔗 https://myanimelist.net/anime/${anime.mal_id}`
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ No se encontró el anime "${query}".` }, { quoted: msg });
        }
      }
    },

    // ── Manga search ────────────────────────────
    {
      pattern: /^manga\s+(.+)$/i,
      async handler(sock, msg, { match }) {
        const query = match[1].trim();
        try {
          const res = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=1`, { timeout: 10000 });
          const manga = res.data.data?.[0];
          if (!manga) throw new Error('No encontrado');
          await sock.sendMessage(msg.key.remoteJid, {
            text: `📖 *Manga — ${manga.title}*\n\n📝 ${manga.synopsis?.substring(0, 300) || 'Sin sinopsis'}...\n\n⭐ Puntuación: *${manga.score || 'N/A'}*\n📚 Capítulos: *${manga.chapters || '?'}*\n🗂️ Géneros: ${manga.genres?.map(g => g.name).join(', ') || 'N/A'}`
          }, { quoted: msg });
        } catch {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ No se encontró el manga "${query}".` }, { quoted: msg });
        }
      }
    }
  ]
};
