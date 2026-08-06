# 🤖 LZ BOT — Bot de WhatsApp

> **Bot de WhatsApp completo** con sistema de plugins, economía virtual, inteligencia artificial, descargas multimedia, juegos interactivos, moderación de grupos y mucho más.

---

## 📸 Vista previa

Para mostrar tu imagen en el `.menu`, sube tu foto a [Imgur](https://imgur.com) u otro hosting público y configura `MENU_IMAGE_URL` en el archivo `.env`.

Al escribir `.menu` en WhatsApp, el bot enviará tu imagen junto con todos los comandos disponibles.

---

## ⚡ Requisitos

| Herramienta | Versión mínima | Para qué se usa |
|---|---|---|
| **Node.js** | v18+ | Ejecutar el bot |
| **FFmpeg** | Cualquier versión | Stickers y efectos de audio/imagen |
| **Cuenta WhatsApp** | Activa | Vincular el bot |

### Instalar FFmpeg

**Ubuntu / Debian / Termux:**
```bash
sudo apt install ffmpeg        # Ubuntu/Debian
pkg install ffmpeg             # Termux
```

**Windows:** Descarga desde [ffmpeg.org](https://ffmpeg.org/download.html) y agrégalo al PATH.

---

## 🚀 Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/SolweyLegenDYT/Lz-Bot-v0.44.git
cd Lz-Bot-v0.44/lz-bot

# 2. Instala las dependencias
npm install

# 3. Configura tus variables de entorno
cp .env.example .env
nano .env   # Edita con tu número, APIs, etc.

# 4. ¡Inicia el bot!
npm start
```

---

## 🔗 Vinculación con WhatsApp

Al iniciar el bot, aparece este menú:

```
━━━━━━━━━━━━━━━━━━━━━━━
         LZ BOT
━━━━━━━━━━━━━━━━━━━━━━━

[1] Conectar mediante QR
[2] Conectar mediante Código

Seleccione una opción:
```

| Método | Cómo usarlo |
|---|---|
| **[1] QR** | Escanea el código desde WhatsApp → Dispositivos vinculados → Vincular dispositivo |
| **[2] Código** | Ingresa tu número → WhatsApp genera un código de 8 dígitos en Dispositivos vinculados |

✅ La sesión se guarda automáticamente. Al reiniciar no necesitas vincular de nuevo.

---

## ⚙️ Configuración (.env)

```env
BOT_NAME=LZ BOT            # Nombre del bot en menús
PREFIX=.                   # Prefijo de comandos
OWNER_NUMBER=521999999999  # Tu número (sin + ni espacios)
OWNER_NAME=Developer       # Tu nombre

OPENAI_KEY=sk-...          # (Opcional) Para .ai .chat .code etc.
GEMINI_KEY=...             # (Opcional) Alternativa a OpenAI

STICKER_AUTHOR=LZ BOT      # Autor que aparece en los stickers
STICKER_PACK=LZ BOT Pack   # Nombre del pack de stickers

# Imagen que aparece cuando alguien escribe .menu
# Sube tu imagen a imgur.com y pon aquí la URL directa
MENU_IMAGE_URL=https://i.imgur.com/TU_IMAGEN.jpg
```

---

## 📜 Comandos

### 🔹 General
| Comando | Descripción |
|---|---|
| `.menu` / `.help` | Muestra el menú con imagen |
| `.register Nombre/Edad` | Registra tu perfil |
| `.profile` | Ver tu perfil y estadísticas |
| `.ping` | Latencia del bot |
| `.runtime` | Tiempo de actividad |
| `.info` | Información del bot |
| `.owner` | Datos del dueño |
| `.rules` | Reglas del bot |

### 🤖 Inteligencia Artificial
| Comando | Descripción |
|---|---|
| `.ai <pregunta>` | Chat con IA (OpenAI/Gemini) |
| `.chat <mensaje>` | Conversación continua |
| `.code <descripción>` | Genera código fuente |
| `.translate <texto> al <idioma>` | Traduce a cualquier idioma |
| `.summarize <texto>` | Resume textos largos |
| `.imageprompt <descripción>` | Crea prompts para IA generativa |

### 📥 Descargas
| Comando | Descripción |
|---|---|
| `.ytmp3 <búsqueda o URL>` | ⬇️ Descarga audio MP3 de YouTube |
| `.ytmp4 <búsqueda o URL>` | ⬇️ Descarga video MP4 de YouTube |
| `.tiktok <url>` | TikTok sin marca de agua |
| `.ig <url>` | Video/foto de Instagram |
| `.fb <url>` | Video de Facebook |
| `.spotify <canción>` | Buscar en Spotify |
| `.pin <url>` | Imagen de Pinterest |
| `.github <usuario/repo>` | Info de repositorio GitHub |

> 💡 Para `.ytmp3` y `.ytmp4` puedes poner el nombre de la canción/video directamente — el bot lo busca automáticamente.

### 🎭 Stickers
| Comando | Descripción |
|---|---|
| `.s` / `.sticker` | Imagen o video → Sticker |
| `.toimg` | Sticker → Imagen |
| `.attp <texto>` | Sticker de texto animado |
| `.brat <texto>` | Estilo BRAT (texto verde) |

### 🖼️ Edición de Imágenes
`.blur` `.invert` `.sketch` `.cartoon` `.anime` `.rotate` `.removebg` `.upscale` `.brightness`

### 🔊 Efectos de Audio
`.bass` `.reverb` `.nightcore` `.robot` `.deep` `.slow` `.fast` `.reverse`

### 💰 Economía Virtual
| Comando | Descripción |
|---|---|
| `.balance` | Ver tus monedas |
| `.daily` | Recompensa diaria (500 coins) |
| `.weekly` | Recompensa semanal (2000 coins) |
| `.work` | Trabaja y gana coins (CD: 1h) |
| `.mine` | Minería (CD: 2h) |
| `.hunt` | Caza (CD: 1.5h) |
| `.transfer @numero cantidad` | Envía coins a alguien |
| `.shop` | Ver la tienda de ítems |
| `.buy <número>` | Comprar un ítem |
| `.rank` | Top 10 más ricos |

### 🎮 Juegos
| Comando | Descripción |
|---|---|
| `.slot <apuesta>` | 🎰 Máquina tragamonedas |
| `.coinflip cara/sello <apuesta>` | 🪙 Cara o sello |
| `.math` | ➗ Desafío matemático rápido |
| `.quiz` | ❓ Pregunta de trivia |
| `.hangman` | 🪢 Ahorcado |
| `.guess <letra>` | Adivinar letra en ahorcado |
| `.tictactoe <número>` | ⭕ Tres en raya vs bot |

### 🔧 Herramientas
`.calc <expresión>` `.qr <texto>` `.password` `.shorturl <url>` `.weather <ciudad>` `.date` `.time`

### 🔍 Búsquedas
`.wikipedia <tema>` `.youtube <búsqueda>` `.google <búsqueda>` `.npm <paquete>` `.anime <nombre>` `.manga <nombre>`

### 👥 Grupos _(solo admins)_
`.tagall` `.kick` `.add <número>` `.promote` `.demote` `.open` `.close` `.link` `.delete`

### 🛡️ Moderación _(solo admins)_
`.antilink on/off` `.antibot on/off` `.antispam on/off` `.antiarab on/off`
`.warn` `.unwarn` `.mute <minutos>` `.unmute`
`.welcome on/off` `.goodbye on/off` `.setwelcome <mensaje>` `.setbye <mensaje>`

### ⚙️ Configuración _(Operadores)_
`.mode public/group/private` `.autoread on/off` `.autotyping on/off`
`.block` `.unblock <número>` `.blacklist add/remove/list`

### 👑 Owner / Operadores
`.addowner <número>` `.ban` `.broadcast <mensaje>` `.restart` `.logs` `.backup`
`.givecoins <número> <cantidad>` `.givexp <número> <cantidad>` `.panel`

### 💻 Solo Developer
`.eval <código js>` `.exec <comando shell>` `.resetuser <número>` `.prefix <nuevo>`

---

## 🏗️ Estructura del Proyecto

```
lz-bot/
├── index.js              ← Router principal de mensajes
├── config.js             ← Toda la configuración centralizada
├── .env.example          ← Plantilla de variables de entorno
│
├── database/
│   └── db.js             ← Base de datos en JSON (sin servidor)
│
├── lib/
│   ├── connection.js     ← Conexión (QR + Código)
│   ├── permissions.js    ← Sistema de 4 niveles de permisos
│   └── security.js       ← Anti-spam, flood, cooldowns
│
└── plugins/              ← Cada función en su propio archivo
    ├── basic.js          ← Menú (con imagen), registro, perfil
    ├── ai.js             ← IA: OpenAI y Google Gemini
    ├── economy.js        ← Economía virtual completa
    ├── games.js          ← Juegos interactivos
    ├── sticker.js        ← Creación de stickers
    ├── image.js          ← Edición de imágenes
    ├── audio.js          ← Efectos de audio
    ├── download.js       ← Descargas (YouTube, TikTok, etc.)
    ├── search.js         ← Búsquedas web
    ├── group.js          ← Gestión de grupos
    ├── moderation.js     ← Moderación automática
    ├── welcome.js        ← Bienvenida y despedida
    ├── owner.js          ← Comandos de propietario
    └── config-cmd.js     ← Configuración del bot
```

---

## 🔒 Sistema de Permisos

| Nivel | Rol | Qué puede hacer |
|---|---|---|
| 0 | Usuario | Comandos básicos, IA, economía, juegos, descargas |
| 1 | Admin de grupo | Moderación y gestión del grupo |
| 2 | Operador | Administración del bot, broadcast, restart |
| 3 | Developer | Acceso total: eval, shell, resetdb |

---

## 🌐 Cómo hacer hosting

| Plataforma | Comando |
|---|---|
| **Termux (Android)** | `node index.js` |
| **VPS Ubuntu** | `pm2 start index.js --name lz-bot` |
| **Render / Railway** | `npm start` |
| **Pterodactyl** | Node.js egg, startup: `node index.js` |
| **Docker** | Base: `node:18-slim` |

---

## 🛡️ Seguridad incorporada

- ✅ Anti-spam por ventana de tiempo
- ✅ Anti-flood de mensajes  
- ✅ Rate limit de comandos
- ✅ Cooldowns configurables por comando
- ✅ Detección de mensajes maliciosos
- ✅ Reconexión automática ante caídas
- ✅ Manejo de errores — el bot nunca crashea

---

## 📝 Licencia

**MIT** — Libre para uso personal y comercial.

---

<div align="center">
  Hecho con ❤️ por <b>LZ Developer</b>
</div>
