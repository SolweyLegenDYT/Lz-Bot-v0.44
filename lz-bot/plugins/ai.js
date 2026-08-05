const axios = require('axios');
const config = require('../config');
const db = require('../database/db');
const { checkCooldown, setCooldown, formatCooldown } = require('../lib/security');

async function callOpenAI(prompt, system = 'Eres un asistente útil y amigable llamado LZ BOT.') {
  if (!config.openaiKey) return '⚠️ No hay clave de API configurada. El owner debe agregar OPENAI_KEY en el archivo .env';
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000
    },
    { headers: { Authorization: `Bearer ${config.openaiKey}`, 'Content-Type': 'application/json' } }
  );
  return res.data.choices[0].message.content.trim();
}

async function callGemini(prompt) {
  if (!config.geminiKey) return '⚠️ No hay clave de API configurada. El owner debe agregar GEMINI_KEY en el archivo .env';
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiKey}`,
    { contents: [{ parts: [{ text: prompt }] }] }
  );
  return res.data.candidates[0].content.parts[0].text.trim();
}

async function callAI(prompt, system) {
  if (config.openaiKey) return callOpenAI(prompt, system);
  if (config.geminiKey) return callGemini(prompt);
  return '⚠️ Configura OPENAI_KEY o GEMINI_KEY en el archivo .env para usar los comandos de IA.';
}

const AI_COOLDOWN = 5000; // 5 seconds

module.exports = {
  name: 'ai',
  commands: [
    {
      pattern: /^(ai|chat|gpt|ask)\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'ai');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'ai', AI_COOLDOWN);

        const prompt = match[2].trim();
        await sock.sendMessage(msg.key.remoteJid, { text: '🤖 _Procesando..._' }, { quoted: msg });
        try {
          const reply = await callAI(prompt);
          await sock.sendMessage(msg.key.remoteJid, { text: `🤖 *LZ BOT IA*\n\n${reply}` }, { quoted: msg });
          const user = db.getUser(sender);
          if (user) { db.addXP(sender, config.xpPerCommand); db.updateUser(sender, { totalCommands: (user.totalCommands || 0) + 1 }); }
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error de IA: ${e.message}` }, { quoted: msg });
        }
      }
    },

    {
      pattern: /^code\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const cd = checkCooldown(sender, 'ai');
        if (cd) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.cooldown(formatCooldown(cd)) }, { quoted: msg });
        setCooldown(sender, 'ai', AI_COOLDOWN);

        const prompt = match[1].trim();
        await sock.sendMessage(msg.key.remoteJid, { text: '💻 _Generando código..._' }, { quoted: msg });
        try {
          const system = 'Eres un experto programador. Responde SOLO con código bien comentado. Indica el lenguaje al inicio.';
          const code = await callAI(prompt, system);
          await sock.sendMessage(msg.key.remoteJid, { text: `💻 *Código generado:*\n\n\`\`\`\n${code}\n\`\`\`` }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    {
      pattern: /^translate\s+(.+?)\s+(?:al?|to)\s+(\w+)$/i,
      async handler(sock, msg, { sender, match }) {
        const text = match[1].trim();
        const lang = match[2].trim();
        await sock.sendMessage(msg.key.remoteJid, { text: '🌐 _Traduciendo..._' }, { quoted: msg });
        try {
          const result = await callAI(`Traduce el siguiente texto al ${lang}. Solo responde con la traducción:\n${text}`);
          await sock.sendMessage(msg.key.remoteJid, { text: `🌐 *Traducción (${lang}):*\n\n${result}` }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    {
      pattern: /^summarize\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const text = match[1].trim();
        await sock.sendMessage(msg.key.remoteJid, { text: '📝 _Resumiendo..._' }, { quoted: msg });
        try {
          const result = await callAI(`Resume el siguiente texto de forma concisa y clara:\n${text}`);
          await sock.sendMessage(msg.key.remoteJid, { text: `📝 *Resumen:*\n\n${result}` }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    },

    {
      pattern: /^imageprompt\s+(.+)$/i,
      async handler(sock, msg, { sender, match }) {
        const desc = match[1].trim();
        await sock.sendMessage(msg.key.remoteJid, { text: '🎨 _Generando prompt..._' }, { quoted: msg });
        try {
          const system = 'Eres un experto en prompts para generación de imágenes con IA (Midjourney, DALL-E, Stable Diffusion). Genera un prompt detallado, en inglés, con estilos artísticos, iluminación, composición y calidad. Solo responde con el prompt.';
          const result = await callAI(desc, system);
          await sock.sendMessage(msg.key.remoteJid, { text: `🎨 *Prompt generado:*\n\n${result}` }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
      }
    }
  ]
};
