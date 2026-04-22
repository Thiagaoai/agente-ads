#!/bin/bash
set -e
LOG_FILE="setup-paperclip-$(date +%Y%m%d_%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
error_exit() { log "ERRO: $1"; log "SOLUCAO: $2"; exit 1; }

RUN_USER="${SUDO_USER:-$USER}"
RUN_HOME="$(getent passwd "$RUN_USER" | cut -d: -f6)"
APP_DIR="$RUN_HOME/paperclip-roberts"

[ -n "$RUN_HOME" ] && [ -d "$RUN_HOME" ] || \
    error_exit "Nao foi possivel resolver o home do usuario $RUN_USER" "verifique o usuario atual e getent passwd"

cd "$APP_DIR"

log "=========================================="
log "SETUP PAPERCLIP"
log "=========================================="

log "[1/4] Instalando Paperclip..."
npx paperclipai onboard --yes --bind lan 2>&1 | tee -a "$LOG_FILE" || \
    error_exit "Paperclip install falhou" "npm install -g npm@latest e tente novamente"
log "Paperclip instalado"

log "[2/4] Criando systemd service..."
sudo tee /etc/systemd/system/paperclip.service > /dev/null << EOF
[Unit]
Description=Paperclip AI Orchestration - roberts-automation
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$APP_DIR
Environment=HOME=$RUN_HOME
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/npx paperclipai start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
log "Service file criado"

log "[3/4] Ativando servico..."
sudo systemctl daemon-reload
sudo systemctl enable paperclip.service || error_exit "systemctl enable falhou" "cheque permissoes sudo"
log "Servico habilitado (aguardando .env para iniciar)"

log ""
log "=========================================="
log "SETUP PAPERCLIP CONCLUIDO"
log "=========================================="
log "Proximo: bash setup-env.sh"
