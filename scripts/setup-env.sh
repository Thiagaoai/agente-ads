#!/bin/bash
set -e
LOG_FILE="setup-env-$(date +%Y%m%d_%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
error_exit() { log "ERRO: $1"; log "SOLUCAO: $2"; exit 1; }

RUN_USER="${SUDO_USER:-$USER}"
RUN_HOME="$(getent passwd "$RUN_USER" | cut -d: -f6)"
APP_DIR="$RUN_HOME/paperclip-roberts"

[ -n "$RUN_HOME" ] && [ -d "$RUN_HOME" ] || \
    error_exit "Nao foi possivel resolver o home do usuario $RUN_USER" "verifique o usuario atual e getent passwd"

cd "$APP_DIR"

log "=========================================="
log "CRIANDO .ENV - roberts-automation"
log "=========================================="

cat > .env << 'EOF'
# Supabase
SUPABASE_URL="https://owhqsyfahdhsrlaobrza.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93aHFzeWZhaGRoc3JsYW9icnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjE5NzcsImV4cCI6MjA5MjI5Nzk3N30.4f_ZZkspkmkxcj58bcrqmvAWNGNdR7oRehWi9xvHnWU"
PAPERCLIP_DATABASE_URL="postgresql://postgres.owhqsyfahdhsrlaobrza:SUASENHA@aws-0-us-east-2.pooler.supabase.com:6543/postgres"

# Telegram
TELEGRAM_BOT_TOKEN="8616958337:AAE8Rwypb0ZT2s17sqUBzE9mGy1rH51MusE"
TELEGRAM_USER_ID="6730700689"

# Seguranca
PAPERCLIP_AGENT_JWT_SECRET="GERADO_ABAIXO"
PAPERCLIP_JWT_SECRET="GERADO_ABAIXO"
EOF

JWT=$(openssl rand -base64 32)
sed -i "s/GERADO_ABAIXO/$JWT/g" .env

chmod 600 .env
log ".env criado com permissoes 600"
log ""
log "ACAO NECESSARIA:"
log "   Edite o .env e substitua SUASENHA pela senha do banco Supabase"
log "   Supabase Dashboard -> Project Settings -> Database -> Database password"
log "   Comando: nano $APP_DIR/.env"
log ""

log "[2/2] Iniciando Paperclip..."
sudo systemctl start paperclip.service || error_exit "start falhou - edite a senha primeiro" "nano $APP_DIR/.env"
sleep 5
sudo systemctl is-active paperclip.service && log "Paperclip rodando" || log "Aguardando .env completo"

log ""
log "=========================================="
log "SETUP ENV CONCLUIDO"
log "=========================================="
log "Proximo: bash final-verification.sh"
