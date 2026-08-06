#!/data/data/com.termux/files/usr/bin/bash
# ═══════════════════════════════════════════════
#   LZ BOT — Instalador automático para Termux
#   github.com/SolweyLegenDYT/Lz-Bot-v0.44
# ═══════════════════════════════════════════════

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # Sin color

clear
echo -e "${CYAN}"
echo "  ██╗     ███████╗    ██████╗  ██████╗ ████████╗"
echo "  ██║     ╚══███╔╝    ██╔══██╗██╔═══██╗╚══██╔══╝"
echo "  ██║       ███╔╝     ██████╔╝██║   ██║   ██║   "
echo "  ██║      ███╔╝      ██╔══██╗██║   ██║   ██║   "
echo "  ███████╗███████╗    ██████╔╝╚██████╔╝   ██║   "
echo "  ╚══════╝╚══════╝    ╚═════╝  ╚═════╝    ╚═╝   "
echo -e "${NC}"
echo -e "${WHITE}  ══════════════════════════════════════════${NC}"
echo -e "${WHITE}   Instalador automático para Termux${NC}"
echo -e "${WHITE}  ══════════════════════════════════════════${NC}"
echo ""

# ── Función para imprimir pasos ─────────────────
step() { echo -e "\n${CYAN}[${GREEN}•${CYAN}]${WHITE} $1${NC}"; }
ok()   { echo -e "   ${GREEN}✓ $1${NC}"; }
warn() { echo -e "   ${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "   ${RED}✗ $1${NC}"; }

# ── 1. Permisos de almacenamiento ───────────────
step "Solicitando permisos de almacenamiento..."
termux-setup-storage 2>/dev/null || warn "Permisos ya concedidos o no disponibles"
sleep 1

# ── 2. Actualizar repositorios ──────────────────
step "Actualizando paquetes de Termux..."
pkg update -y 2>/dev/null && pkg upgrade -y 2>/dev/null
ok "Paquetes actualizados"

# ── 3. Instalar dependencias del sistema ────────
step "Instalando dependencias del sistema..."

PACKAGES=("nodejs" "git" "ffmpeg" "python" "libjpeg-turbo" "libpng" "pkg-config")
for pkg_name in "${PACKAGES[@]}"; do
  if ! command -v "$pkg_name" &>/dev/null && ! dpkg -l "$pkg_name" &>/dev/null 2>&1; then
    echo -e "   Instalando ${pkg_name}..."
    pkg install -y "$pkg_name" 2>/dev/null || warn "No se pudo instalar $pkg_name (puede continuar)"
  else
    ok "$pkg_name ya instalado"
  fi
done

# Verificar Node.js
if ! command -v node &>/dev/null; then
  err "Node.js no se instaló correctamente. Intenta: pkg install nodejs"
  exit 1
fi
ok "Node.js $(node -v) listo"

# ── 4. Clonar o actualizar el repositorio ───────
REPO_URL="https://github.com/SolweyLegenDYT/Lz-Bot-v0.44.git"
BOT_DIR="$HOME/Lz-Bot-v0.44"

step "Configurando repositorio del bot..."

if [ -d "$BOT_DIR/.git" ]; then
  warn "El repositorio ya existe. Actualizando..."
  cd "$BOT_DIR" && git pull origin main
  ok "Repositorio actualizado"
else
  echo -e "   Clonando desde GitHub..."
  git clone "$REPO_URL" "$BOT_DIR"
  if [ $? -ne 0 ]; then
    err "No se pudo clonar el repositorio. Verifica tu conexión."
    exit 1
  fi
  ok "Repositorio clonado en $BOT_DIR"
fi

cd "$BOT_DIR/lz-bot" || { err "No se encontró la carpeta lz-bot"; exit 1; }

# ── 5. Instalar dependencias de Node.js ─────────
step "Instalando dependencias de Node.js (npm install)..."
echo -e "   ${YELLOW}Esto puede tardar varios minutos...${NC}"
npm install --legacy-peer-deps 2>/dev/null || npm install
if [ $? -ne 0 ]; then
  err "Error al instalar dependencias. Intenta ejecutar npm install manualmente."
  exit 1
fi
ok "Dependencias instaladas"

# ── 6. Configurar .env ──────────────────────────
step "Configurando el bot..."

if [ ! -f ".env" ]; then
  cp .env.example .env
  ok ".env creado desde .env.example"
fi

echo ""
echo -e "${WHITE}  ┌─────────────────────────────────────────┐${NC}"
echo -e "${WHITE}  │        CONFIGURACIÓN INICIAL            │${NC}"
echo -e "${WHITE}  └─────────────────────────────────────────┘${NC}"
echo ""

# Nombre del bot
echo -e "${CYAN}¿Nombre del bot?${NC} (presiona Enter para usar 'LZ BOT'): "
read -r bot_name
if [ -n "$bot_name" ]; then
  sed -i "s/BOT_NAME=.*/BOT_NAME=$bot_name/" .env
  ok "Nombre configurado: $bot_name"
fi

# Número del dueño
echo ""
echo -e "${CYAN}¿Tu número de WhatsApp?${NC}"
echo -e "   ${YELLOW}Formato: código de país + número, sin + ni espacios${NC}"
echo -e "   ${YELLOW}Ejemplo México: 521XXXXXXXXXX${NC}"
echo -e "   ${YELLOW}Ejemplo Colombia: 57XXXXXXXXXX${NC}"
read -r owner_number
if [ -n "$owner_number" ]; then
  sed -i "s/OWNER_NUMBER=.*/OWNER_NUMBER=$owner_number/" .env
  ok "Número configurado: $owner_number"
else
  warn "No configuraste tu número. Edita .env después con: nano .env"
fi

# Nombre del dueño
echo ""
echo -e "${CYAN}¿Tu nombre?${NC} (para mostrarse en .owner): "
read -r owner_name
if [ -n "$owner_name" ]; then
  sed -i "s/OWNER_NAME=.*/OWNER_NAME=$owner_name/" .env
  ok "Nombre del dueño: $owner_name"
fi

# ── 7. Resumen final ────────────────────────────
echo ""
echo -e "${GREEN}"
echo "  ════════════════════════════════════════════"
echo "   ✅  ¡INSTALACIÓN COMPLETADA!"
echo "  ════════════════════════════════════════════"
echo -e "${NC}"
echo -e "${WHITE}  📂 Ruta del bot:${NC} $BOT_DIR/lz-bot"
echo ""
echo -e "${WHITE}  ▶  Para iniciar el bot:${NC}"
echo -e "     ${CYAN}cd ~/Lz-Bot-v0.44/lz-bot && npm start${NC}"
echo ""
echo -e "${WHITE}  📷  Al iniciar, elige la opción [1] para QR${NC}"
echo -e "${WHITE}     y escanéalo desde WhatsApp →${NC}"
echo -e "${WHITE}     Dispositivos vinculados → Vincular dispositivo${NC}"
echo ""
echo -e "${WHITE}  ✏️  Para editar configuración:${NC}"
echo -e "     ${CYAN}nano ~/Lz-Bot-v0.44/lz-bot/.env${NC}"
echo ""
echo -e "${WHITE}  🔄  Para mantener el bot activo en segundo plano:${NC}"
echo -e "     ${CYAN}pkg install screen${NC}"
echo -e "     ${CYAN}screen -S lzbot${NC}"
echo -e "     ${CYAN}npm start${NC}"
echo -e "     ${YELLOW}(luego Ctrl+A y D para desconectarte del screen)${NC}"
echo ""

# ── 8. Preguntar si iniciar ahora ───────────────
echo -e "${CYAN}¿Iniciar el bot ahora para escanear el QR? [s/n]:${NC} "
read -r start_now
if [[ "$start_now" =~ ^[ssSy]$ ]]; then
  echo ""
  echo -e "${GREEN}  Iniciando LZ BOT...${NC}"
  echo -e "${YELLOW}  Selecciona [1] para escanear QR o [2] para código de vinculación${NC}"
  echo ""
  sleep 2
  npm start
fi
