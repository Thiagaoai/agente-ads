#!/bin/bash
LOG_FILE="final-verification-$(date +%Y%m%d_%H%M%S).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

TOTAL=0; PASSED=0
check() {
    TOTAL=$((TOTAL+1))
    if eval "$1" &>/dev/null; then log "✅ $2"; PASSED=$((PASSED+1))
    else log "❌ $2"; fi
}

log "=========================================="
log "VERIFICAÇÃO FINAL — FASE 1"
log "=========================================="

log "=== SISTEMA ==="
check "[ -d ~/paperclip-roberts ]" "Diretório existe"
check "command -v node" "Node.js instalado"
check "command -v pnpm" "pnpm instalado"

log "=== PAPERCLIP ==="
check "sudo systemctl is-active paperclip.service" "Serviço ativo"
check "curl -sf http://localhost:3100" "Dashboard respondendo (porta 3100)"

log "=== CONFIGURAÇÃO ==="
check "[ -f ~/paperclip-roberts/.env ]" ".env existe"
check "grep -q SUPABASE_URL ~/paperclip-roberts/.env" "SUPABASE_URL configurada"
check "grep -q TELEGRAM_BOT_TOKEN ~/paperclip-roberts/.env" "BOT_TOKEN configurada"
check "! grep -q 'SUASENHA' ~/paperclip-roberts/.env" "DB password preenchida"

log "=== LOGS ==="
check "! sudo journalctl -u paperclip -n 30 | grep -i 'fatal\|uncaught'" "Sem erros fatais"

log ""
log "=========================================="
if [ "$PASSED" -eq "$TOTAL" ]; then
    log "🎉 FASE 1 COMPLETA! ($PASSED/$TOTAL checks)"
    log "   Dashboard: http://31.97.102.161:3100"
else
    log "⚠️  $PASSED/$TOTAL checks OK — corrija os ❌ acima"
fi
log "=========================================="
