# 🤖 LZ BOT — WhatsApp Bot

Bot de WhatsApp completo con sistema de plugins, economía, IA, moderación de grupos y mucho más.

---

## ⚡ Requisitos

- **Node.js** v18 o superior
- **FFmpeg** instalado en el sistema (para stickers y edición de audio/imagen)
- Una cuenta de WhatsApp activa

### Instalar FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
```

**Windows:** Descarga desde https://ffmpeg.org/download.html

**Termux:**
```bash
pkg install ffmpeg
```

---

## 🚀 Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/lz-bot.git
cd lz-bot

# 2. Instala dependencias
npm install

# 3. Configura las variables de entorno
cp .env.example .env
# Edita .env y agrega tu número y APIs

# 4. Inicia el bot
npm start
```

---

## 🔗 Conexión

Al iniciar el bot, aparecerá un menú:

```
━━━━━━━━━━━━━━━━━━━━━━━
         LZ BOT
━━━━━━━━━━━━━━━━━━━━━━━

[1] Conectar mediante QR
[2] Conectar mediante Código

Seleccione una opción:
```

### Método 1 — QR
Escanea el código QR desde WhatsApp → Dispositivos vinculados → Vincular dispositivo.

### Método 2 — Código de vinculación
Ingresa tu número (ej: `+51999999999`) y el bot generará un código de 8 dígitos que debes ingresar en WhatsApp → Dispositivos vinculados → Vincular con número de teléfono.

La sesión se guarda automáticamente. No necesitarás escanear de nuevo al reiniciar.

---

## ⚙️ Configuración (.env)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `BOT_NAME` | Nombre del bot | `LZ BOT` |
| `PREFIX` | Prefijo de comandos | `.` |
| `OWNER_NUMBER` | Tu número (sin + ni espacios) | `5219999999999` |
| `OWNER_NAME` | Tu nombre | `Developer` |
| `OPENAI_KEY` | API key de OpenAI (opcional) | `sk-...` |
| `GEMINI_KEY` | API key de Google Gemini (opcional) | `...` |
| `STICKER_AUTHOR` | Autor de stickers | `LZ BOT` |
| `STICKER_PACK` | Nombre del pack | `LZ BOT Pack` |

---

## 📜 Comandos

### 🔹 General
| Comando | Descripción |
|---------|-------------|
| `.menu` / `.help` | Muestra el menú principal |
| `.register Nombre/Edad` | Registra tu perfil (solo una vez) |
| `.profile` | Ver tu perfil |
| `.ping` | Prueba la latencia |
| `.runtime` | Tiempo de actividad del bot |
| `.info` | Información del bot |
| `.owner` | Info del dueño |
| `.rules` | Reglas del bot |

### 🤖 IA
| Comando | Descripción |
|---------|-------------|
| `.ai <pregunta>` | Chat con IA |
| `.chat <mensaje>` | Chat conversacional |
| `.code <descripción>` | Genera código |
| `.translate <texto> al <idioma>` | Traduce texto |
| `.summarize <texto>` | Resume texto |
| `.imageprompt <descripción>` | Genera prompt para imágenes IA |

### 💰 Economía
| Comando | Descripción |
|---------|-------------|
| `.balance` | Ver tus coins |
| `.daily` | Recompensa diaria |
| `.weekly` | Recompensa semanal |
| `.work` | Trabaja para ganar coins (CD: 1h) |
| `.mine` | Minería (CD: 2h) |
| `.hunt` | Caza (CD: 1.5h) |
| `.transfer @numero cantidad` | Transferir coins |
| `.shop` | Ver la tienda |
| `.buy <número>` | Comprar un ítem |
| `.rank` | Top 10 más ricos |

### 🎮 Juegos
| Comando | Descripción |
|---------|-------------|
| `.slot <apuesta>` | Máquina tragamonedas |
| `.coinflip cara/sello <apuesta>` | Cara o sello |
| `.math` | Desafío matemático |
| `.quiz` | Pregunta de trivia |
| `.hangman` | Ahorcado |
| `.guess <letra>` | Adivinar letra en ahorcado |
| `.tictactoe <número>` | Tres en raya vs bot |

### 📥 Descargas
| Comando | Descripción |
|---------|-------------|
| `.ytmp3 <búsqueda>` | Descargar audio de YouTube |
| `.ytmp4 <búsqueda>` | Descargar video de YouTube |
| `.tiktok <url>` | Descargar TikTok sin marca |
| `.pin <url>` | Descargar imagen de Pinterest |
| `.github <usuario/repo>` | Info de repositorio GitHub |

### 🎭 Stickers
| Comando | Descripción |
|---------|-------------|
| `.s` / `.sticker` | Imagen/Video → Sticker |
| `.toimg` | Sticker → Imagen |
| `.attp <texto>` | Sticker de texto animado |
| `.brat <texto>` | Estilo BRAT |

### 🖼️ Edición de imágenes
`.blur` `.invert` `.sketch` `.brightness` `.cartoon` `.anime` `.rotate` `.removebg` `.upscale`

### 🔊 Edición de audio
`.bass` `.reverb` `.nightcore` `.robot` `.deep` `.slow` `.fast` `.reverse`

### 🔧 Herramientas
`.calc <expresión>` `.qr <texto>` `.password` `.shorturl <url>` `.weather <ciudad>` `.date` `.time` `.speed`

### 🔍 Búsquedas
`.wikipedia <tema>` `.youtube <búsqueda>` `.google <búsqueda>` `.npm <paquete>` `.anime <nombre>` `.manga <nombre>`

### 👥 Grupos (solo admins)
`.tagall` `.hidetag` `.kick` `.add <número>` `.promote` `.demote` `.open` `.close` `.link` `.resetlink` `.delete`

### 🛡️ Moderación (solo admins)
`.antilink on/off` `.antibot on/off` `.antispam on/off` `.antiarab on/off` `.antisticker on/off` `.antilinkgc on/off` `.antifake on/off` `.warn` `.unwarn` `.mute <minutos>` `.unmute`

### 👋 Bienvenida (solo admins)
`.welcome on/off` `.goodbye on/off` `.setwelcome <mensaje>` `.setbye <mensaje>`

### ⚙️ Configuración (Operadores)
`.mode public/group/private` `.autoread on/off` `.autotyping on/off` `.autorecord on/off` `.block` `.unblock <número>` `.blacklist add/remove/list`

### 👑 Owner/Operadores
`.addowner <número>` `.delowner <número>` `.listowner` `.ban` `.unban <número>` `.broadcast <mensaje>` `.restart` `.logs` `.memory` `.backup` `.givecoins <número> <cantidad>` `.givexp <número> <cantidad>` `.panel`

### 💻 Solo Developer
`.eval <código>` `.exec <comando>` `.shell <comando>` `.resetuser <número>` `.prefix <nuevo>`

---

## 🏗️ Arquitectura

```
lz-bot/
├── index.js              # Entry point y router de mensajes
├── config.js             # Configuración centralizada
├── .env.example          # Variables de entorno
│
├── database/
│   └── db.js             # Base de datos JSON (sin dependencias externas)
│
├── lib/
│   ├── connection.js     # Conexión WhatsApp (QR + Pairing Code)
│   ├── permissions.js    # Sistema de permisos por niveles
│   └── security.js       # Anti-spam, flood, rate limit, cooldowns
│
└── plugins/
    ├── basic.js          # Comandos generales
    ├── ai.js             # IA (OpenAI / Gemini)
    ├── economy.js        # Sistema económico
    ├── games.js          # Juegos interactivos
    ├── sticker.js        # Creación de stickers
    ├── image.js          # Edición de imágenes
    ├── audio.js          # Efectos de audio
    ├── download.js       # Descargas multimedia
    ├── search.js         # Búsquedas web
    ├── group.js          # Administración de grupos
    ├── moderation.js     # Moderación automática
    ├── welcome.js        # Bienvenida/despedida
    ├── owner.js          # Comandos de propietario
    └── config-cmd.js     # Configuración del bot
```

---

## 🔒 Sistema de Permisos

| Nivel | Quién | Acceso |
|-------|-------|--------|
| 0 | Usuario registrado | Comandos básicos, IA, economía, juegos |
| 1 | Admin de grupo | Moderación, gestión del grupo |
| 2 | Operador | Administración del bot, broadcast, restart |
| 3 | Developer | Acceso total: eval, shell, resetdb |

---

## 🛡️ Seguridad

- Anti-spam por ventana de tiempo
- Anti-flood de mensajes
- Rate limit de comandos
- Cooldowns por comando
- Detección de mensajes maliciosos
- Reconexión automática
- Manejo de errores sin crashear el bot

---

## 🌐 Hosting

Compatible con cualquier plataforma:
- **Render / Railway** — `npm start`
- **VPS Ubuntu** — `pm2 start index.js --name lz-bot`
- **Termux** — `node index.js`
- **Docker** — Usa `node:18-slim` como base
- **Pterodactyl** — Node.js egg, startup: `node index.js`

---

## 📝 Licencia

MIT — Libre para uso personal y comercial.
