const config = require('../config');
const db = require('../database/db');
const { checkCooldown, setCooldown, formatCooldown } = require('../lib/security');

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ── Quiz questions ──────────────────────────
const quizQuestions = [
  { q: '¿Cuántos planetas tiene el sistema solar?', a: '8', opts: ['7', '8', '9', '10'] },
  { q: '¿Cuál es el idioma más hablado del mundo?', a: 'Chino mandarín', opts: ['Inglés', 'Español', 'Chino mandarín', 'Hindi'] },
  { q: '¿En qué año llegó el hombre a la luna?', a: '1969', opts: ['1965', '1967', '1969', '1972'] },
  { q: '¿Cuál es el océano más grande?', a: 'Pacífico', opts: ['Atlántico', 'Índico', 'Pacífico', 'Ártico'] },
  { q: '¿Cuántos continentes tiene la Tierra?', a: '7', opts: ['5', '6', '7', '8'] },
  { q: '¿Cuál es el elemento más abundante en el universo?', a: 'Hidrógeno', opts: ['Helio', 'Oxígeno', 'Hidrógeno', 'Carbono'] },
  { q: '¿Cuál es el animal más rápido del mundo?', a: 'Guepardo', opts: ['León', 'Guepardo', 'Halcón peregrino', 'Caballo'] },
  { q: '¿Cuánto es la raíz cuadrada de 144?', a: '12', opts: ['10', '11', '12', '14'] },
  { q: '¿Quién escribió "Don Quijote"?', a: 'Cervantes', opts: ['Shakespeare', 'Cervantes', 'Dante', 'Goethe'] },
  { q: '¿Cuál es la capital de Francia?', a: 'París', opts: ['Lyon', 'Marsella', 'París', 'Burdeos'] }
];

const hangmanWords = ['javascript', 'python', 'programar', 'computadora', 'algoritmo', 'variable', 'funcion', 'bucle', 'array', 'objeto', 'bot', 'whatsapp', 'economia', 'aventura', 'dragon'];
const triviaActive = new Map();
const hangmanActive = new Map();

module.exports = {
  name: 'games',
  commands: [
    // ── Slot Machine ───────────────────────────
    {
      pattern: /^slot\s*(\d+)?$/i,
      async handler(sock, msg, { sender, match }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });

        const bet = parseInt(match[1]) || 50;
        if (bet < 10) return sock.sendMessage(msg.key.remoteJid, { text: '❌ La apuesta mínima es *10 coins*.' }, { quoted: msg });
        if (user.coins < bet) return sock.sendMessage(msg.key.remoteJid, { text: `❌ No tienes suficientes coins.\n💰 Tu balance: *${user.coins}*` }, { quoted: msg });

        const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '🎰'];
        const s1 = symbols[rand(0, symbols.length - 1)];
        const s2 = symbols[rand(0, symbols.length - 1)];
        const s3 = symbols[rand(0, symbols.length - 1)];

        let result, earned = 0;
        if (s1 === s2 && s2 === s3) {
          if (s1 === '💎') { earned = bet * 10; result = `🎊 *JACKPOT! TRIPLE DIAMANTE!*`; }
          else if (s1 === '⭐') { earned = bet * 5; result = `🌟 *TRIPLE ESTRELLA!*`; }
          else { earned = bet * 3; result = `🎉 *¡TRIPLE!*`; }
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
          earned = Math.floor(bet * 1.5);
          result = `✅ *Par — ganaste algo*`;
        } else {
          earned = -bet;
          result = `❌ *No hay suerte esta vez*`;
        }

        db.addCoins(sender, earned);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `🎰 *SLOT MACHINE*\n\n[ ${s1} | ${s2} | ${s3} ]\n\n${result}\n${earned >= 0 ? `+${earned}` : earned} coins\n\n💰 Balance: *${db.getUser(sender).coins.toLocaleString()} coins*`
        }, { quoted: msg });
      }
    },

    // ── Coinflip ───────────────────────────────
    {
      pattern: /^coinflip\s+(cara|sello|heads|tails)\s+(\d+)$/i,
      async handler(sock, msg, { sender, match }) {
        const user = db.getUser(sender);
        if (!user) return sock.sendMessage(msg.key.remoteJid, { text: config.messages.notRegistered }, { quoted: msg });

        const choice = match[1].toLowerCase();
        const bet = parseInt(match[2]);
        if (user.coins < bet) return sock.sendMessage(msg.key.remoteJid, { text: `❌ No tienes suficientes coins.` }, { quoted: msg });

        const result = Math.random() < 0.5 ? 'cara' : 'sello';
        const won = choice === result || (choice === 'heads' && result === 'cara') || (choice === 'tails' && result === 'sello');

        db.addCoins(sender, won ? bet : -bet);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `🪙 *Lanzamiento de moneda*\n\nTú elegiste: *${choice}*\nResultado: *${result}*\n\n${won ? `✅ *¡Ganaste ${bet} coins!*` : `❌ *Perdiste ${bet} coins*`}\n💰 Balance: *${db.getUser(sender).coins.toLocaleString()}*`
        }, { quoted: msg });
      }
    },

    // ── Math challenge ─────────────────────────
    {
      pattern: /^math$/i,
      async handler(sock, msg, { sender }) {
        const a = rand(1, 20);
        const b = rand(1, 20);
        const ops = ['+', '-', '*'];
        const op = ops[rand(0, 2)];
        let answer;
        if (op === '+') answer = a + b;
        else if (op === '-') answer = a - b;
        else answer = a * b;

        triviaActive.set(sender, { type: 'math', answer: String(answer), reward: 30, expires: Date.now() + 30000 });

        await sock.sendMessage(msg.key.remoteJid, {
          text: `🧮 *Desafío Matemático*\n\n¿Cuánto es *${a} ${op} ${b}*?\n\n_Tienes 30 segundos para responder._`
        }, { quoted: msg });
      }
    },

    // ── Quiz ────────────────────────────────────
    {
      pattern: /^quiz$/i,
      async handler(sock, msg, { sender }) {
        const q = quizQuestions[rand(0, quizQuestions.length - 1)];
        const shuffled = q.opts.sort(() => Math.random() - 0.5);
        const letters = ['A', 'B', 'C', 'D'];
        const optText = shuffled.map((o, i) => `${letters[i]}) ${o}`).join('\n');
        const correctLetter = letters[shuffled.indexOf(q.a)];

        triviaActive.set(sender, { type: 'quiz', answer: correctLetter.toLowerCase(), altAnswer: q.a.toLowerCase(), reward: 50, expires: Date.now() + 30000 });

        await sock.sendMessage(msg.key.remoteJid, {
          text: `❓ *Quiz*\n\n${q.q}\n\n${optText}\n\n_Responde con la letra. Tienes 30 segundos._`
        }, { quoted: msg });
      }
    },

    // ── Trivia answer handler ──────────────────
    {
      pattern: /^(.+)$/i,
      priority: -1, // lowest priority
      async handler(sock, msg, { sender, body }) {
        const active = triviaActive.get(sender);
        if (!active) return false; // not handled
        if (Date.now() > active.expires) {
          triviaActive.delete(sender);
          return false;
        }

        const answer = body.trim().toLowerCase();
        if (answer === active.answer || answer === (active.altAnswer || '')) {
          triviaActive.delete(sender);
          const user = db.getUser(sender);
          if (user) db.addCoins(sender, active.reward);
          await sock.sendMessage(msg.key.remoteJid, {
            text: `✅ *¡Correcto!* +${active.reward} coins 🎉\n💰 Total: *${user ? db.getUser(sender).coins.toLocaleString() : '—'}*`
          }, { quoted: msg });
          return true;
        }
        return false;
      }
    },

    // ── Hangman ─────────────────────────────────
    {
      pattern: /^hangman$/i,
      async handler(sock, msg, { sender }) {
        const word = hangmanWords[rand(0, hangmanWords.length - 1)];
        hangmanActive.set(sender, {
          word,
          guessed: [],
          wrong: [],
          maxWrong: 6,
          expires: Date.now() + 300000
        });

        const display = word.split('').map(l => '_').join(' ');
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🎯 *Ahorcado*\n\n📝 Palabra: *${display}*\n❤️ Vidas: 6/6\n\n_Escribe una letra para adivinar._\nUsa *${config.prefix}guess letra*`
        }, { quoted: msg });
      }
    },

    // ── Hangman guess ──────────────────────────
    {
      pattern: /^guess\s+([a-z])$/i,
      async handler(sock, msg, { sender, match }) {
        const game = hangmanActive.get(sender);
        if (!game || Date.now() > game.expires) {
          hangmanActive.delete(sender);
          return sock.sendMessage(msg.key.remoteJid, { text: '❌ No tienes un juego activo. Usa *' + config.prefix + 'hangman*' }, { quoted: msg });
        }

        const letter = match[1].toLowerCase();
        if (game.guessed.includes(letter) || game.wrong.includes(letter)) {
          return sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Ya usaste la letra *${letter}*.` }, { quoted: msg });
        }

        if (game.word.includes(letter)) {
          game.guessed.push(letter);
        } else {
          game.wrong.push(letter);
        }

        const display = game.word.split('').map(l => game.guessed.includes(l) ? l : '_').join(' ');
        const lives = game.maxWrong - game.wrong.length;
        const won = !display.includes('_');
        const lost = lives <= 0;

        if (won) {
          hangmanActive.delete(sender);
          const user = db.getUser(sender);
          if (user) db.addCoins(sender, 100);
          return sock.sendMessage(msg.key.remoteJid, {
            text: `🎉 *¡GANASTE!*\nLa palabra era: *${game.word}*\n+100 coins 💰`
          }, { quoted: msg });
        }

        if (lost) {
          hangmanActive.delete(sender);
          return sock.sendMessage(msg.key.remoteJid, {
            text: `💀 *¡PERDISTE!*\nLa palabra era: *${game.word}*`
          }, { quoted: msg });
        }

        hangmanActive.set(sender, game);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🎯 *Ahorcado*\n\n📝 Palabra: *${display}*\n❤️ Vidas: ${lives}/${game.maxWrong}\n❌ Letras incorrectas: ${game.wrong.join(', ') || 'ninguna'}`
        }, { quoted: msg });
      }
    },

    // ── TicTacToe (vs bot) ─────────────────────
    {
      pattern: /^tictactoe\s*(\d)?$/i,
      async handler(sock, msg, { sender, match }) {
        const board = Array(9).fill('⬜');
        const playerMark = '❌';
        const botMark = '⭕';

        const pos = parseInt(match[1]);
        if (!isNaN(pos) && pos >= 1 && pos <= 9) {
          board[pos - 1] = playerMark;
          // Simple bot move
          const empty = board.map((v, i) => v === '⬜' ? i : -1).filter(i => i >= 0);
          if (empty.length > 0) board[empty[rand(0, empty.length - 1)]] = botMark;
        }

        const grid = [
          board.slice(0, 3).join(''),
          board.slice(3, 6).join(''),
          board.slice(6, 9).join('')
        ].join('\n');

        await sock.sendMessage(msg.key.remoteJid, {
          text: `🎮 *Tic Tac Toe*\nTú: ❌ | Bot: ⭕\n\n${grid}\n\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\n_Usa *${config.prefix}tictactoe número* para jugar_`
        }, { quoted: msg });
      }
    }
  ]
};
