# 📱 LZ BOT — Instalación en Termux (Android)

Guía completa para instalar y ejecutar el bot directamente desde tu teléfono Android usando Termux.

---

## ⚡ Instalación en 1 solo comando

Abre **Termux** y pega este comando:

```bash
curl -sSL https://raw.githubusercontent.com/SolweyLegenDYT/Lz-Bot-v0.44/main/lz-bot/termux-install.sh | bash
```

El script hace todo automáticamente:
- ✅ Instala Node.js, Git y FFmpeg
- ✅ Clona el repositorio en `~/Lz-Bot-v0.44`
- ✅ Instala las dependencias npm
- ✅ Te pide tu número y nombre para configurar `.env`
- ✅ Crea el comando `lzbot` para iniciar el bot desde cualquier parte
- ✅ Pregunta si quieres iniciar el bot al finalizar

Después de instalar, para iniciar el bot **siempre usa**:
```bash
lzbot
```

---

## 🔧 Instalación manual paso a paso

Si prefieres hacerlo tú mismo:

### Paso 1 — Instalar paquetes necesarios

```bash
pkg update && pkg upgrade -y
pkg install nodejs git ffmpeg -y
```

### Paso 2 — Clonar el repositorio

```bash
cd ~
git clone https://github.com/SolweyLegenDYT/Lz-Bot-v0.44.git
cd ~/Lz-Bot-v0.44/lz-bot
```

> ⚠️ Siempre usa `~/` al principio para que funcione sin importar en qué carpeta estés.

### Paso 3 — Instalar dependencias

```bash
npm install
```

> ⏳ Puede tardar 3-8 minutos la primera vez. No cierres Termux.

### Paso 4 — Configurar el bot

```bash
cp .env.example .env
nano .env
```

Rellena los campos mínimos:

```env
BOT_NAME=LZ BOT
OWNER_NUMBER=521XXXXXXXXXX    ← Tu número (sin + ni espacios)
OWNER_NAME=Tu Nombre
```

Guarda con `Ctrl+X` → `Y` → `Enter`

### Paso 5 — Iniciar el bot

```bash
npm start
```

---

## 📷 Escanear el código QR

Al iniciar aparecerá este menú:

```
━━━━━━━━━━━━━━━━━━━━━━━
         LZ BOT
━━━━━━━━━━━━━━━━━━━━━━━

[1] Conectar mediante QR
[2] Conectar mediante Código

Seleccione una opción:
```

**Escribe `1` y presiona Enter.** Aparecerá un código QR en la pantalla.

Para escanearlo desde WhatsApp:
1. Abre WhatsApp en tu teléfono
2. Ve a **⋮ Menú** → **Dispositivos vinculados**
3. Pulsa **Vincular dispositivo**
4. Apunta la cámara al código QR en Termux

✅ El bot se conecta automáticamente. La sesión se guarda — no necesitas escanear de nuevo al reiniciar.

---

## 📲 Opción 2 — Código de vinculación (sin QR)

Si el QR es difícil de escanear desde el mismo teléfono, usa el código:

1. Escribe `2` en el menú inicial
2. Ingresa tu número con código de país (ej: `521XXXXXXXXXX`)
3. Ve a WhatsApp → **Dispositivos vinculados** → **Vincular con número de teléfono**
4. Ingresa el código de 8 dígitos que muestra el bot

---

## 🔄 Mantener el bot activo en segundo plano

Para que el bot siga corriendo aunque cambies de app:

```bash
# Instalar screen (una sola vez)
pkg install screen -y

# Crear una sesión llamada "lzbot"
screen -S lzbot

# Iniciar el bot dentro del screen
cd ~/Lz-Bot-v0.44/lz-bot && npm start

# Desconectarte sin detener el bot
# Presiona: Ctrl + A, luego D

# Volver a ver el bot cuando quieras
screen -r lzbot
```

---

## ❓ Error: "Cannot find module 'dotenv'" (u otro módulo)

Significa que `npm install` no terminó correctamente. Solución:

```bash
cd ~/Lz-Bot-v0.44/lz-bot
npm install
npm start
```

Si sigue fallando:
```bash
cd ~/Lz-Bot-v0.44/lz-bot
rm -rf node_modules
npm install --legacy-peer-deps
npm start
```

---

## ❓ Error: "No such file or directory"

Si ves este error al hacer `cd`:
```
bash: cd: Lz-Bot-v0.44/lz-bot: No such file or directory
```

La causa es que estás en una carpeta diferente al home. Solución — **siempre usa la ruta completa con `~/`**:

```bash
cd ~/Lz-Bot-v0.44/lz-bot
npm start
```

O más fácil, si ya usaste el script de instalación:
```bash
lzbot
```

---

## 🔁 Actualizar el bot

```bash
cd ~/Lz-Bot-v0.44 && git pull origin main && lzbot
```

> Si ya tenías el bot instalado y el `.env` tiene `PREFIX=.`, cámbialo a `BOT_PREFIX=.`:
> ```bash
> nano ~/Lz-Bot-v0.44/lz-bot/.env
> # Cambia:  PREFIX=.
> # Por:     BOT_PREFIX=.
> ```
> Esto es necesario porque Termux ya usa `$PREFIX` como variable del sistema.

---

## ❌ Solución de problemas comunes

| Error | Solución |
|---|---|
| `node: not found` | `pkg install nodejs` |
| `npm: command not found` | `pkg install nodejs` |
| `ffmpeg: not found` | `pkg install ffmpeg` |
| `Error: Cannot find module` | Ejecuta `npm install` de nuevo |
| QR no aparece / no escanea | Usa la opción [2] con código de vinculación |
| Bot desconectado al cerrar Termux | Usa `screen` (ver sección arriba) |
| `ENOSPC: no space left` | Libera espacio en el teléfono |

---

## 📂 Archivos importantes

```
~/Lz-Bot-v0.44/lz-bot/
├── .env          ← Tu configuración (número, APIs, etc.)
├── session/      ← Sesión de WhatsApp guardada
└── database/     ← Base de datos del bot (coins, usuarios, etc.)
```

> 💾 **Haz backup de `session/` y `.env`** si cambias de dispositivo.
