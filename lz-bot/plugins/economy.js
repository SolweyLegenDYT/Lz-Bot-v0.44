const config = require('../config');
const db = require('../database/db');
const { checkCooldown, setCooldown, formatCooldown } = require('../lib/security');

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  name: 'economy',
  commands: [
    // ── Balance ────────────────────────────────
    {
      pattern: /^balance$/i,
      async handler(sock, msg, { sender }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, {
          text: `💰 *Balance de ${user.name}*\n\n💵 Coins: *${user.coins.toLocaleString()}*\n⭐ Nivel: *${user.level}*`
        }, { quoted: msg });
      }
    },

    // ── Daily ──────────────────────────────────
    {
      pattern: /^daily$/i,
      async handler(sock, msg, { sender }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });

        if (user.lastDaily) {
          const next = new Date(user.lastDaily).getTime() + config.cooldowns.daily;
          if (Date.now() < next) {
            const remaining = next - Date.now();
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            return sock.sendMessage(msg.key.remoteJid, {
              text: `⏳ Ya reclamaste tu recompensa diaria.\n⏰ Vuelve en *${h}h ${m}m*`
            }, { quoted: msg });
          }
        }

        const amount = config.dailyAmount + rand(0, 100);
        db.addCoins(sender, amount);
        db.updateUser(sender, { lastDaily: new Date().toISOString() });

        await sock.sendMessage(msg.key.remoteJid, {
          text: `📅 *Recompensa Diaria*\n\n✅ Recibiste *${amount} coins*!\n💰 Total: *${db.getUser(sender).coins.toLocaleString()} coins*`
        }, { quoted: msg });
      }
    },

    // ── Weekly ─────────────────────────────────
    {
      pattern: /^weekly$/i,
      async handler(sock, msg, { sender }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });

        if (user.lastWeekly) {
          const next = new Date(user.lastWeekly).getTime() + config.cooldowns.weekly;
          if (Date.now() < next) {
            const remaining = next - Date.now();
            const d = Math.floor(remaining / 86400000);
            const h = Math.floor((remaining % 86400000) / 3600000);
            return sock.sendMessage(msg.key.remoteJid, {
              text: `⏳ Ya reclamaste tu recompensa semanal.\n⏰ Vuelve en *${d}d ${h}h*`
            }, { quoted: msg });
          }
        }

        const amount = config.weeklyAmount + rand(0, 500);
        db.addCoins(sender, amount);
        db.updateUser(sender, { lastWeekly: new Date().toISOString() });

        await sock.sendMessage(msg.key.remoteJid, {
          text: `📅 *Recompensa Semanal*\n\n✅ Recibiste *${amount} coins*!\n💰 Total: *${db.getUser(sender).coins.toLocaleString()} coins*`
        }, { quoted: msg });
      }
    },

    // ── Work ───────────────────────────────────
    {
      pattern: /^work$/i,
      async handler(sock, msg, { sender }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });

        const cd = checkCooldown(sender, 'work');
        if (cd) return sock.sendMessage(msg.key.remoteJid, {
          text: `⏳ Ya trabajaste. Descansa un poco.\n⏰ Vuelve en *${formatCooldown(cd)}*`
        }, { quoted: msg });

        const job = config.workJobs[rand(0, config.workJobs.length - 1)];
        const earned = rand(job.min, job.max);
        db.addCoins(sender, earned);
        db.addXP(sender, config.xpPerCommand);
        setCooldown(sender, 'work', config.cooldowns.work);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `💼 *¡Trabajo completado!*\n\nTrabajaste como *${job.job}* y ganaste *${earned} coins*!\n💰 Total: *${db.getUser(sender).coins.toLocaleString()} coins*`
        }, { quoted: msg });
      }
    },

    // ── Mine ───────────────────────────────────
    {
      pattern: /^mine$/i,
      async handler(sock, msg, { sender }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });

        const cd = checkCooldown(sender, 'mine');
        if (cd) return sock.sendMessage(msg.key.remoteJid, {
          text: `⏳ La mina está vacía.\n⏰ Vuelve en *${formatCooldown(cd)}*`
        }, { quoted: msg });

        const resources = ['💎 Diamante', '🥇 Oro', '🪨 Piedra', '🔮 Cristal', '⚡ Energita'];
        const resource = resources[rand(0, resources.length - 1)];
        const earned = rand(50, 300);
        db.addCoins(sender, earned);
        db.addXP(sender, config.xpPerCommand * 2);
        setCooldown(sender, 'mine', config.cooldowns.mine);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `⛏️ *¡Minería exitosa!*\n\nEncontraste *${resource}* y lo vendiste por *${earned} coins*!\n💰 Total: *${db.getUser(sender).coins.toLocaleString()} coins*`
        }, { quoted: msg });
      }
    },

    // ── Hunt ───────────────────────────────────
    {
      pattern: /^hunt$/i,
      async handler(sock, msg, { sender }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });

        const cd = checkCooldown(sender, 'hunt');
        if (cd) return sock.sendMessage(msg.key.remoteJid, {
          text: `⏳ Necesitas recuperar fuerza.\n⏰ Vuelve en *${formatCooldown(cd)}*`
        }, { quoted: msg });

        const animals = ['🦌 Ciervo', '🐗 Jabalí', '🦊 Zorro', '🐇 Conejo', '🦅 Águila'];
        const animal = animals[rand(0, animals.length - 1)];
        const earned = rand(40, 250);
        db.addCoins(sender, earned);
        db.addXP(sender, config.xpPerCommand * 2);
        setCooldown(sender, 'hunt', config.cooldowns.hunt);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `🏹 *¡Caza exitosa!*\n\nCazaste un *${animal}* y lo vendiste por *${earned} coins*!\n💰 Total: *${db.getUser(sender).coins.toLocaleString()} coins*`
        }, { quoted: msg });
      }
    },

    // ── Transfer ───────────────────────────────
    {
      pattern: /^transfer\s+@?(\d+)\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });

        const targetNum = match[1] + '@s.whatsapp.net';
        const amount = parseInt(match[2]);

        if (isNaN(amount) || amount <= 0) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Cantidad inválida.' }, { quoted: msg });
        if (user.coins < amount) return sock.sendMessage(msg.key.remoteJid, { text: `❌ No tienes suficientes coins.\n💰 Tu balance: *${user.coins}*` }, { quoted: msg });

        const target = db.getUser(targetNum);
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: '❌ El usuario no está registrado.' }, { quoted: msg });

        db.addCoins(sender, -amount);
        db.addCoins(targetNum, amount);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `💸 *Transferencia exitosa*\n\nEnviaste *${amount} coins* a *${target.name}*\n💰 Tu nuevo balance: *${db.getUser(sender).coins.toLocaleString()} coins*`
        }, { quoted: msg });
      }
    },

    // ── Shop ───────────────────────────────────
    {
      pattern: /^shop$/i,
      async handler(sock, msg) {
        const items = config.shopItems.map((item, i) =>
          `${i + 1}. *${item.name}* — ${item.price} coins\n   _${item.description}_`
        ).join('\n\n');

        await sock.sendMessage(msg.key.remoteJid, {
          text: `🏪 *Tienda LZ BOT*\n\n${items}\n\n_Usa *${config.prefix}buy <número>* para comprar_`
        }, { quoted: msg });
      }
    },

    // ── Buy ────────────────────────────────────
    {
      pattern: /^buy\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });

        const idx = parseInt(match[1]) - 1;
        if (idx < 0 || idx >= config.shopItems.length) {
          return sock.sendMessage(msg.key.remoteJid, { text: `❌ Ítem inválido. Usa *${config.prefix}shop* para ver la tienda.` }, { quoted: msg });
        }

        const item = config.shopItems[idx];
        if (user.coins < item.price) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: `❌ No tienes suficientes coins.\n💰 Necesitas: *${item.price}*\n💵 Tienes: *${user.coins}*`
          }, { quoted: msg });
        }

        db.addCoins(sender, -item.price);
        const inv = user.inventory || [];
        inv.push({ id: item.id, name: item.name, boughtAt: new Date().toISOString() });
        db.updateUser(sender, { inventory: inv });

        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ *¡Compra exitosa!*\n\n🛍️ Compraste: *${item.name}*\n💰 Nuevo balance: *${db.getUser(sender).coins.toLocaleString()} coins*`
        }, { quoted: msg });
      }
    },

    // ── Rank ───────────────────────────────────
    {
      pattern: /^rank$/i,
      async handler(sock, msg) {
        const users = db.getAllUsers().sort((a, b) => b.coins - a.coins).slice(0, 10);
        const list = users.map((u, i) => `${i + 1}. *${u.name}* — ${u.coins.toLocaleString()} coins`).join('\n');
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🏆 *Top 10 Más Ricos*\n\n${list || 'No hay usuarios registrados.'}`
        }, { quoted: msg });
      }
    }
  ]
};
