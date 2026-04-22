#!/bin/bash
set -e
LOG_FILE="setup-vps-$(date +%Y%m%d_%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
error_exit() { log "❌ ERRO: $1"; log "💡 SOLUÇÃO: $2"; exit 1; }

log "=========================================="
log "SETUP VPS HERMES — roberts-automation"
log "=========================================="

log "[1/5] Atualizando sistema..."
sudo apt update -qq && sudo apt upgrade -y -qq || error_exit "apt update/upgrade falhou" "ping 8.8.8.8 para checar internet"
log "✅ Sistema atualizado"

log "[2/5] Instalando Node.js 20..."
if command -v node &>/dev/null && [ "$(node -v | cut -dv -f2 | cut -d. -f1)" -ge 20 ]; then
    log "✅ Node.js $(node -v) já instalado"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -qq
    sudo apt-get install -y nodejs -qq || error_exit "Node install falhou" "sudo apt install -y nodejs --fix-broken"
    log "✅ Node.js $(node -v) instalado"
fi

log "[3/5] Instalando pnpm..."
if ! command -v pnpm &>/dev/null; then
    npm install -g pnpm -q || error_exit "pnpm install falhou" "npm cache clean --force && npm install -g pnpm"
fi
log "✅ pnpm $(pnpm -v)"

log "[4/5] Criando diretório..."
mkdir -p ~/paperclip-roberts && cd ~/paperclip-roberts
log "✅ Diretório: $(pwd)"

log "[5/5] Verificação..."
node --version && pnpm --version
log ""
log "=========================================="
log "✅ SETUP VPS CONCLUÍDO"
log "=========================================="
log "⏭️  Próximo: bash setup-paperclip.sh"
