#!/bin/bash
set -euo pipefail

LOG_FILE="fix-paperclip-service-$(date +%Y%m%d_%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
error_exit() { log "ERRO: $1"; log "SOLUCAO: $2"; exit 1; }

detect_home() {
    local candidate

    if [ -f "/home/paperclip/.paperclip/instances/default/config.json" ]; then
        echo "/home/paperclip"
        return
    fi

    if [ -f "$HOME/.paperclip/instances/default/config.json" ]; then
        echo "$HOME"
        return
    fi

    for candidate in /home/*; do
        [ -d "$candidate" ] || continue
        if [ -f "$candidate/.paperclip/instances/default/config.json" ]; then
            echo "$candidate"
            return
        fi
    done

    if [ -f "/root/.paperclip/instances/default/config.json" ]; then
        echo "/root"
        return
    fi

    return 1
}

detect_app_dir() {
    local home_dir="$1"

    if [ -d "$home_dir/paperclip-roberts" ]; then
        echo "$home_dir/paperclip-roberts"
        return
    fi

    if [ -f "$PWD/package.json" ]; then
        echo "$PWD"
        return
    fi

    return 1
}

read_port() {
    local config_file="$1"
    local port

    port="$(grep -o '"port":[[:space:]]*[0-9]\+' "$config_file" | head -n1 | grep -o '[0-9]\+' || true)"
    if [ -n "$port" ]; then
        echo "$port"
    else
        echo "3100"
    fi
}

INSTANCE_HOME="$(detect_home)" || \
    error_exit "Nao encontrei uma instancia valida do Paperclip" "rode o onboard com o usuario correto antes de usar este script"

APP_DIR="$(detect_app_dir "$INSTANCE_HOME")" || \
    error_exit "Nao encontrei o diretorio da aplicacao" "garanta que exista $INSTANCE_HOME/paperclip-roberts ou rode o script dentro do projeto"

RUN_USER="$(basename "$INSTANCE_HOME")"
CONFIG_FILE="$INSTANCE_HOME/.paperclip/instances/default/config.json"
ENV_FILE="$APP_DIR/.env"
PORT="$(read_port "$CONFIG_FILE")"

[ -f "$CONFIG_FILE" ] || \
    error_exit "Config do Paperclip nao encontrada" "verifique $CONFIG_FILE"

[ -f "$ENV_FILE" ] || \
    error_exit "Arquivo .env nao encontrado" "crie $ENV_FILE com as variaveis do Paperclip"

grep -q "PAPERCLIP_AGENT_JWT_SECRET" "$ENV_FILE" || \
    error_exit "PAPERCLIP_AGENT_JWT_SECRET nao esta no .env" "adicione a variavel no .env antes de continuar"

if grep -q "SUASENHA" "$ENV_FILE"; then
    error_exit "A senha do banco ainda nao foi preenchida no .env" "substitua SUASENHA pela senha real do banco"
fi

log "Instancia encontrada em $INSTANCE_HOME"
log "Aplicacao encontrada em $APP_DIR"
log "Usuario do service: $RUN_USER"
log "Porta detectada: $PORT"

sudo tee /etc/systemd/system/paperclip.service > /dev/null << EOF
[Unit]
Description=Paperclip AI Orchestration - roberts-automation
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$APP_DIR
Environment=HOME=$INSTANCE_HOME
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/npx paperclipai start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

log "paperclip.service recriado"

sudo systemctl daemon-reload
sudo systemctl enable paperclip.service
sudo systemctl restart paperclip.service

sleep 5

if ! sudo systemctl is-active --quiet paperclip.service; then
    sudo journalctl -u paperclip -n 60 --no-pager | tee -a "$LOG_FILE"
    error_exit "Paperclip ainda nao subiu" "revise os logs acima e corrija o erro reportado"
fi

log "Servico ativo"

if curl -fsS "http://localhost:$PORT" > /dev/null; then
    log "Dashboard respondendo em http://localhost:$PORT"
else
    log "Servico ativo, mas a porta ainda nao respondeu imediatamente"
fi

IP_ADDR="$(hostname -I | awk '{print $1}')"
if [ -n "$IP_ADDR" ]; then
    log "Acesso externo esperado: http://$IP_ADDR:$PORT"
fi

log "Concluido"
