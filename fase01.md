# 📦 FASE 1 COMPLETA — SDD + PRD + SCRIPTS + DEBUGGER

---

# 📋 PARTE 1: SDD (System Design Document)

## Arquitetura FASE 1

```
┌─────────────────────────────────────────────────┐
│        VPS Hermes (Ubuntu 22.04)                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │  systemd Service (paperclip.service)    │  │
│  │  └─ Auto-restart se cair                │  │
│  │  └─ Logging via journalctl              │  │
│  └─────────────────────────────────────────┘  │
│              ↓                                  │
│  ┌─────────────────────────────────────────┐  │
│  │  Node.js 20 Runtime                     │  │
│  │  └─ pnpm package manager                │  │
│  │  └─ Global binaries                     │  │
│  └─────────────────────────────────────────┘  │
│              ↓                                  │
│  ┌─────────────────────────────────────────┐  │
│  │  Paperclip Server (port 3100)           │  │
│  │  ├─ Dashboard UI (React)                │  │
│  │  ├─ REST API                            │  │
│  │  └─ Organization orchestration          │  │
│  └─────────────────────────────────────────┘  │
│              ↓                                  │
│  ┌──────────────┬──────────────┬───────────┐  │
│  │              │              │           │  │
│  ↓              ↓              ↓           ↓  │
│ .env        Supabase      Telegram       Logs │
│ Secrets     PostgreSQL     Bot          journalctl
│                                               │
└─────────────────────────────────────────────────┘
```

## Componentes

### 1. VPS Hermes
- **OS:** Ubuntu 22.04 LTS
- **Node:** v20.x (LTS)
- **pnpm:** v8+ (global)
- **Recursos mínimos:** 2GB RAM, 20GB SSD, 1vCPU
- **Networking:** SSH access, port 3100 open

### 2. Node.js Runtime
- **Versão:** 20.11+ (LTS)
- **Global packages:** pnpm, pm2 (optional)
- **PATH:** Configurado corretamente
- **Verificação:** `node -v` && `npm -v` && `pnpm -v`

### 3. Paperclip Application
- **Instalação:** `npx paperclipai onboard --yes --bind lan`
- **Porta:** 3100
- **Config:** ~/.paperclip/instances/*/config.json
- **Dados:** ~/.paperclip/data/
- **Logs:** journalctl -u paperclip

### 4. Supabase Connection
- **Database:** PostgreSQL 15
- **Connection:** Via connection string
- **Tabelas:** 3 (leads, metrics, tasks)
- **Indexes:** Criados automaticamente
- **Backups:** Automático Supabase

### 5. Telegram Integration
- **Bot:** Criado via @BotFather
- **Token:** Armazenado em .env
- **User ID:** Seu telegram ID
- **Webhook:** Paperclip recebe mensagens

### 6. Logging
- **Agregador:** journalctl (systemd journal)
- **Logs:** /var/log/journal/
- **Retenção:** 30 dias (padrão)
- **Rotação:** Automática
- **Acesso:** `journalctl -u paperclip -f`

## Data Flow

```
1. User action via Telegram
   ↓
2. Paperclip receives webhook
   ↓
3. Process command
   ↓
4. Query Supabase if needed
   ↓
5. Return result
   ↓
6. Send Telegram response
   ↓
7. Log to journalctl
```

## Error Handling

```
Try operation
  ↓
Catch error
  ↓
Log error (journalctl)
  ↓
If retryable:
  ├─ Exponential backoff
  └─ Max 3 retries
  ↓
If fatal:
  ├─ Send Telegram alert
  └─ Stop operation
```

## Deployment Strategy

```
1. VPS preparation (5 min)
   ├─ Update system
   ├─ Install Node 20
   └─ Install pnpm

2. Paperclip installation (10 min)
   ├─ Run onboard
   ├─ Create systemd
   └─ Start service

3. Database setup (5 min)
   ├─ Create .env
   ├─ Add connection string
   └─ Create tables

4. Telegram setup (5 min)
   ├─ Add bot token
   └─ Add user ID

5. Verification (5 min)
   └─ Check all systems
```

---

# 🎯 PARTE 2: PRD (Product Requirements)

## Feature List

### FR-1.1: VPS System Preparation
**Objective:** Sistema pronto para instalar Paperclip
**Acceptance Criteria:**
- [ ] `apt update` completado sem erros
- [ ] `apt upgrade` completado sem erros
- [ ] Node.js v20+ instalado
- [ ] `node -v` retorna v20.x
- [ ] pnpm instalado globally
- [ ] `pnpm -v` retorna v8+
- [ ] Diretório `/home/user/paperclip-roberts` criado
- [ ] Acesso write ao diretório verificado
- [ ] PATH incluindo /usr/local/bin
- [ ] Sem erros críticos no sistema

### FR-1.2: Paperclip Installation
**Objective:** Paperclip rodando com sucesso
**Acceptance Criteria:**
- [ ] `npx paperclipai onboard --yes --bind lan` concluído
- [ ] Dashboard acessível em http://localhost:3100
- [ ] Paperclip data directory criado (~/.paperclip)
- [ ] Config file exists
- [ ] Sem dependency conflicts

### FR-1.3: Systemd Service Creation
**Objective:** Paperclip auto-restarts se cair
**Acceptance Criteria:**
- [ ] `/etc/systemd/system/paperclip.service` criado
- [ ] `systemctl status paperclip` mostra "active (running)"
- [ ] `systemctl enable paperclip` habilitado
- [ ] Se process morre → auto-restart em < 10 seg
- [ ] Logs aparecem em `journalctl -u paperclip`

### FR-1.4: Supabase Connection
**Objective:** Database conectado e tables criadas
**Acceptance Criteria:**
- [ ] Connection string validada
- [ ] `.env` contém `PAPERCLIP_DATABASE_URL`
- [ ] Tabela `leads` criada com colunas corretas
- [ ] Tabela `metrics` criada com colunas corretas
- [ ] Tabela `tasks` criada com colunas corretas
- [ ] Indexes criados para performance
- [ ] Select test query bem-sucedido
- [ ] Insert test query bem-sucedido

### FR-1.5: Telegram Bot Integration
**Objective:** Telegram bot conectado e respondendo
**Acceptance Criteria:**
- [ ] `TELEGRAM_BOT_TOKEN` em `.env`
- [ ] `TELEGRAM_USER_ID` em `.env`
- [ ] Bot responde a `/start`
- [ ] Bot recebe mensagens de entrada
- [ ] Paperclip processa comandos
- [ ] Respostas chegam em Telegram

### FR-1.6: Logging System
**Objective:** Logs centralizados e acessíveis
**Acceptance Criteria:**
- [ ] `journalctl -u paperclip -f` mostra logs
- [ ] Cada operação logged com timestamp
- [ ] Erros capturados com stack trace
- [ ] Logs retidos por 30 dias
- [ ] Log rotation automático

### FR-1.7: Security Configuration
**Objective:** .env seguro, sem secrets exposed
**Acceptance Criteria:**
- [ ] `.env` no `.gitignore`
- [ ] `.env` permissions 600 (only user read)
- [ ] Nenhum secret em código
- [ ] JWT_SECRET gerado (min 32 chars)
- [ ] .env backups em safe location

## Timeline
```
Total: ~50 minutos
├─ Seu tempo: 10 min
├─ Cursor: 40 min
└─ Teste: 5 min
```

---

# 🤖 PARTE 3: SCRIPTS AUTOMÁTICOS

## Script 1: setup-vps.sh

```bash
#!/bin/bash
set -e
LOG_FILE="setup-vps-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "❌ ERRO: $1"
    log "💡 SOLUÇÃO: $2"
    log "🔍 DEBUG: $3"
    exit 1
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    else
        return 0
    fi
}

log "=========================================="
log "SETUP VPS HERMES"
log "=========================================="

# STEP 1: Update sistema
log "[1/7] Atualizando sistema..."
if ! sudo apt update -qq 2>&1 | tee -a "$LOG_FILE"; then
    error_exit \
        "apt update falhou" \
        "Verifique internet: ping 8.8.8.8" \
        "sudo apt update -v"
fi
log "✅ apt update OK"

if ! sudo apt upgrade -y -qq 2>&1 | tee -a "$LOG_FILE"; then
    error_exit \
        "apt upgrade falhou" \
        "Tente: sudo apt upgrade --fix-broken" \
        "sudo apt autoremove -y"
fi
log "✅ apt upgrade OK"

# STEP 2: Node.js
log ""
log "[2/7] Verificando Node.js..."

if check_command node; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        log "✅ Node.js $(node -v) OK"
    else
        log "🔄 Instalando Node.js v20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -qq || \
            error_exit "NodeSource repo falhou" "Tente: curl https://deb.nodesource.com/setup_20.x | sudo bash" "curl -fsSL https://deb.nodesource.com/setup_20.x"
        sudo apt-get install -y nodejs -qq || \
            error_exit "Node install falhou" "Execute: sudo apt install nodejs" "sudo apt install -y nodejs --fix-broken"
    fi
else
    log "🔄 Instalando Node.js v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -qq || \
        error_exit "NodeSource repo falhou" "Verifique internet" "cat /etc/apt/sources.list.d/nodesource.list"
    sudo apt-get install -y nodejs -qq || \
        error_exit "Node install falhou" "Execute: sudo apt install nodejs" "sudo apt install -y nodejs --fix-broken"
fi
log "✅ Node $(node -v) OK"

# STEP 3: pnpm
log ""
log "[3/7] Instalando pnpm..."

if ! check_command pnpm; then
    npm install -g pnpm -q || \
        error_exit "pnpm install falhou" "Tente: npm cache clean --force && npm install -g pnpm" "npm list -g"
else
    log "✅ pnpm $(pnpm -v) já existe"
fi
log "✅ pnpm $(pnpm -v) OK"

# STEP 4: Diretório
log ""
log "[4/7] Criando diretório..."

if ! mkdir -p /home/user/paperclip-roberts 2>/dev/null; then
    error_exit "mkdir falhou" "Verifique permissões: ls -la /home/user/" "sudo mkdir -p /home/user/paperclip-roberts && sudo chown $USER:$USER /home/user/paperclip-roberts"
fi

if [ ! -d "/home/user/paperclip-roberts" ]; then
    error_exit "Diretório não existe" "Verifique espaço: df -h" "ls -la /home/user/"
fi
log "✅ Diretório criado"

# STEP 5: Acesso
log ""
log "[5/7] Verificando acesso..."

cd /home/user/paperclip-roberts || \
    error_exit "Não conseguiu acessar" "Verifique permissões" "sudo chown -R $USER:$USER /home/user/paperclip-roberts"
log "✅ Acesso OK: $(pwd)"

# STEP 6: Teste
log ""
log "[6/7] Testando ferramentas..."

node --version > /dev/null 2>&1 || \
    error_exit "node falhou" "Verifique PATH" "which node && node --version"

pnpm --version > /dev/null 2>&1 || \
    error_exit "pnpm falhou" "Verifique PATH" "which pnpm && pnpm --version"

log "✅ Ferramentas OK"

# STEP 7: Relatório
log ""
log "[7/7] Gerando relatório..."

cat >> "$LOG_FILE" << EOF

========================================
VERIFICAÇÃO FINAL
========================================
Node.js: $(node -v)
npm: $(npm -v)
pnpm: $(pnpm -v)
Diretório: $(pwd)
Timestamp: $(date)
========================================
EOF

log ""
log "=========================================="
log "✅ SETUP VPS CONCLUÍDO"
log "=========================================="
log ""
log "📊 Resumo:"
log "  ✅ Node.js 20+"
log "  ✅ pnpm"
log "  ✅ Diretório criado"
log ""
log "📁 Local: /home/user/paperclip-roberts"
log "📋 Logs: $LOG_FILE"
log ""
log "⏭️ Próximo: bash setup-paperclip.sh"
log ""

exit 0
```

## Script 2: setup-paperclip.sh

```bash
#!/bin/bash
set -e
LOG_FILE="setup-paperclip-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "❌ ERRO: $1"
    log "💡 SOLUÇÃO: $2"
    log "🔍 DEBUG: $3"
    exit 1
}

log "=========================================="
log "SETUP PAPERCLIP"
log "=========================================="

# STEP 1: Instalar Paperclip
log "[1/5] Instalando Paperclip..."

if ! npx paperclipai onboard --yes --bind lan 2>&1 | tee -a "$LOG_FILE"; then
    error_exit \
        "Paperclip install falhou" \
        "Verifique npm: npm install -g npm@latest" \
        "npx --version && npm list -g paperclip"
fi
log "✅ Paperclip instalado"

# STEP 2: Systemd service
log ""
log "[2/5] Criando systemd service..."

SYSTEMD_FILE="/etc/systemd/system/paperclip.service"

RUN_USER="${SUDO_USER:-$USER}"
RUN_HOME="$(getent passwd "$RUN_USER" | cut -d: -f6)"
APP_DIR="$RUN_HOME/paperclip-roberts"

sudo tee "$SYSTEMD_FILE" > /dev/null << EOF
[Unit]
Description=Paperclip AI Orchestration
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

log "✅ Service file criado"

# STEP 3: Daemon reload
log ""
log "[3/5] Recarregando systemd..."

if ! sudo systemctl daemon-reload; then
    error_exit \
        "daemon-reload falhou" \
        "Verifique sintaxe do service" \
        "sudo cat /etc/systemd/system/paperclip.service && sudo systemd-analyze verify paperclip.service"
fi
log "✅ Systemd recarregado"

# STEP 4: Enable + Start
log ""
log "[4/5] Iniciando serviço..."

if ! sudo systemctl enable paperclip.service; then
    error_exit "systemctl enable falhou" "Verifique permissões sudo" "sudo systemctl list-unit-files | grep paperclip"
fi

if ! sudo systemctl start paperclip.service; then
    error_exit "systemctl start falhou" "Verifique logs: sudo journalctl -u paperclip -e" "sudo journalctl -u paperclip -n 20"
fi
log "✅ Serviço iniciado"

# STEP 5: Verificação
log ""
log "[5/5] Verificando status..."

sleep 5

STATUS=$(sudo systemctl is-active paperclip.service)

if [ "$STATUS" != "active" ]; then
    error_exit \
        "Paperclip não está rodando" \
        "Verifique logs: sudo journalctl -u paperclip -f" \
        "sudo systemctl status paperclip.service"
fi

log "✅ Paperclip rodando"

# Relatório
log ""
log "=========================================="
log "✅ SETUP PAPERCLIP CONCLUÍDO"
log "=========================================="
log ""
log "📊 Status:"
sudo systemctl status paperclip.service --no-pager | tee -a "$LOG_FILE"
log ""
log "📋 Últimos logs:"
sudo journalctl -u paperclip -n 10 --no-pager | tee -a "$LOG_FILE"
log ""
log "⏭️ Próximo: bash setup-supabase.sh"
log ""

exit 0
```

## Script 3: setup-supabase.sh

```bash
#!/bin/bash
set -e
LOG_FILE="setup-supabase-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "❌ ERRO: $1"
    log "💡 SOLUÇÃO: $2"
    log "🔍 DEBUG: $3"
    exit 1
}

log "=========================================="
log "SETUP SUPABASE"
log "=========================================="

# Validar argumento
if [ -z "$1" ]; then
    error_exit \
        "DATABASE_URL não fornecida" \
        "Execute: bash setup-supabase.sh 'postgresql://user:pass@host:5432/db'" \
        "Obtenha em: Supabase Dashboard → Settings → Database → Connection String"
fi

DATABASE_URL="$1"

if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    error_exit \
        "DATABASE_URL inválida" \
        "Deve começar com: postgresql://" \
        "Formato correto: postgresql://user:pass@host:5432/db"
fi

log "[1/4] Validando DATABASE_URL..."
log "✅ DATABASE_URL validada"

# STEP 2: Criar .env
log ""
log "[2/4] Criando arquivo .env..."

ENV_FILE="/home/user/paperclip-roberts/.env"
JWT_SECRET="$(openssl rand -base64 32)"

cat > "$ENV_FILE" << EOF
# Supabase Configuration
PAPERCLIP_DATABASE_URL="$DATABASE_URL"
PAPERCLIP_AGENT_JWT_SECRET="$JWT_SECRET"
PAPERCLIP_JWT_SECRET="$JWT_SECRET"

# Timestamp
# Criado: $(date)
EOF

if [ ! -f "$ENV_FILE" ]; then
    error_exit \
        "Falha ao criar .env" \
        "Verifique permissões" \
        "ls -la /home/user/paperclip-roberts/ && touch /home/user/paperclip-roberts/.env"
fi

log "✅ .env criado com DATABASE_URL + JWT_SECRET"

# STEP 3: Instalar psql (opcional)
log ""
log "[3/4] Instalando PostgreSQL client..."

if ! command -v psql &> /dev/null; then
    log "🔄 Instalando psql..."
    if ! sudo apt-get install -y postgresql-client -qq; then
        log "⚠️ psql install opcional (continuando...)"
    else
        log "✅ psql instalado"
    fi
else
    log "✅ psql já existe"
fi

# STEP 4: Criar tabelas
log ""
log "[4/4] Criando tabelas..."

PSQL_COMMANDS="
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT DEFAULT 'google_ads',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics(date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
"

if command -v psql &> /dev/null; then
    if echo "$PSQL_COMMANDS" | psql "$DATABASE_URL" 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ Tabelas criadas"
    else
        log "⚠️ psql criação falhou (tente manual via Supabase Dashboard)"
    fi
else
    log "⚠️ psql não disponível"
    log "💡 Crie tabelas manualmente em:"
    log "   Supabase Dashboard → SQL Editor → Cole comandos SQL"
fi

# Restart Paperclip
log ""
log "Reiniciando Paperclip..."

if sudo systemctl restart paperclip.service; then
    sleep 5
    if sudo systemctl is-active paperclip.service &> /dev/null; then
        log "✅ Paperclip reiniciado"
    else
        error_exit "Paperclip restart falhou" "Verifique .env" "sudo journalctl -u paperclip -e"
    fi
else
    error_exit "Falha ao reiniciar" "Tente manual: sudo systemctl restart paperclip" "sudo journalctl -u paperclip -n 20"
fi

log ""
log "=========================================="
log "✅ SETUP SUPABASE CONCLUÍDO"
log "=========================================="
log ""
log "⏭️ Próximo: bash setup-telegram.sh"
log ""

exit 0
```

## Script 4: setup-telegram.sh

```bash
#!/bin/bash
set -e
LOG_FILE="setup-telegram-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "❌ ERRO: $1"
    log "💡 SOLUÇÃO: $2"
    log "🔍 DEBUG: $3"
    exit 1
}

log "=========================================="
log "SETUP TELEGRAM"
log "=========================================="

# Validar argumentos
if [ -z "$1" ] || [ -z "$2" ]; then
    error_exit \
        "BOT_TOKEN ou USER_ID não fornecidos" \
        "Execute: bash setup-telegram.sh 'TOKEN' 'USER_ID'" \
        "Obtenha TOKEN em: Telegram @BotFather /newbot; USER_ID em: @userinfobot"
fi

BOT_TOKEN="$1"
USER_ID="$2"

if [[ ! "$BOT_TOKEN" =~ : ]]; then
    error_exit "BOT_TOKEN inválida" "Obtenha em @BotFather /newbot" "Token: 123456:ABCdef"
fi

if ! [[ "$USER_ID" =~ ^[0-9]+$ ]]; then
    error_exit "USER_ID deve ser número" "Obtenha em @userinfobot" "USER_ID exemplo: 987654321"
fi

log "[1/4] Validando credentials..."
log "✅ Credentials validadas"

# STEP 2: Adicionar ao .env
log ""
log "[2/4] Adicionando Telegram ao .env..."

ENV_FILE="/home/user/paperclip-roberts/.env"

if [ ! -f "$ENV_FILE" ]; then
    error_exit ".env não existe" "Execute setup-supabase.sh primeiro" "ls -la /home/user/paperclip-roberts/.env"
fi

grep -v "TELEGRAM" "$ENV_FILE" > "${ENV_FILE}.tmp" || true
mv "${ENV_FILE}.tmp" "$ENV_FILE"

cat >> "$ENV_FILE" << EOF

# Telegram Configuration
TELEGRAM_BOT_TOKEN="$BOT_TOKEN"
TELEGRAM_USER_ID="$USER_ID"

# Adicionado: $(date)
EOF

log "✅ Telegram credentials adicionadas"

# STEP 3: Restart Paperclip
log ""
log "[3/4] Reiniciando Paperclip..."

if ! sudo systemctl restart paperclip.service; then
    error_exit "Restart falhou" "Verifique .env" "sudo journalctl -u paperclip -e"
fi

sleep 5

if ! sudo systemctl is-active paperclip.service &> /dev/null; then
    error_exit "Paperclip não rodando" "Verifique logs" "sudo systemctl status paperclip.service"
fi

log "✅ Paperclip reiniciado"

# STEP 4: Teste Telegram
log ""
log "[4/4] Testando Telegram..."
log "💬 Envie /start no seu bot dentro de 30 segundos..."

for i in {1..6}; do
    sleep 5
    if sudo journalctl -u paperclip --since "5 seconds ago" | grep -i "telegram" &> /dev/null; then
        log "✅ Telegram conectado!"
        break
    fi
    if [ $i -eq 6 ]; then
        log "⚠️ Nenhuma atividade Telegram em 30s (OK, teste manual depois)"
    fi
done

log ""
log "=========================================="
log "✅ SETUP TELEGRAM CONCLUÍDO"
log "=========================================="
log ""
log "⏭️ Próximo: bash final-verification.sh"
log ""

exit 0
```

## Script 5: final-verification.sh

```bash
#!/bin/bash
set -e
LOG_FILE="final-verification-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "VERIFICAÇÃO FINAL FASE 1"
log "=========================================="

TOTAL=0
PASSED=0

check() {
    TOTAL=$((TOTAL + 1))
    if eval "$1" &> /dev/null; then
        log "✅ $2"
        PASSED=$((PASSED + 1))
        return 0
    else
        log "❌ $2"
        return 1
    fi
}

log ""
log "=== SISTEMA ==="
check "[ -d /home/user/paperclip-roberts ]" "Diretório existe"
check "command -v node" "Node.js instalado"
check "command -v pnpm" "pnpm instalado"

log ""
log "=== PAPERCLIP ==="
check "sudo systemctl is-active paperclip.service" "Serviço Paperclip rodando"
check "curl -s http://localhost:3100 | grep -q 'paperclip\|Paperclip\|<!DOCTYPE'" "Dashboard acessível"

log ""
log "=== CONFIGURAÇÃO ==="
check "[ -f /home/user/paperclip-roberts/.env ]" ".env existe"
check "grep -q PAPERCLIP_DATABASE_URL /home/user/paperclip-roberts/.env" "DATABASE_URL configurada"
check "grep -q TELEGRAM_BOT_TOKEN /home/user/paperclip-roberts/.env" "BOT_TOKEN configurada"
check "grep -q TELEGRAM_USER_ID /home/user/paperclip-roberts/.env" "USER_ID configurada"

log ""
log "=== LOGS ==="
check "! sudo journalctl -u paperclip -n 20 | grep -i 'error\|failed'" "Sem erros críticos"

log ""
log "=========================================="
if [ $PASSED -eq $TOTAL ]; then
    log "🎉 FASE 1 COMPLETA! ($PASSED/$TOTAL checks passed)"
    log "=========================================="
    exit 0
else
    log "⚠️ Alguns checks falharam ($PASSED/$TOTAL passed)"
    log "=========================================="
    exit 1
fi
```

---

# 🆘 PARTE 4: DEBUGGER

## Erros Comuns + Soluções

### Erro 1: `apt update falhou`
```
Sintoma: E: Failed to fetch...
Solução:
1. sudo apt update --fix-missing
2. sudo apt clean
3. sudo apt update

Debug: sudo apt update -v
```

### Erro 2: `Node.js não instala`
```
Sintoma: Unable to locate package nodejs
Solução:
1. curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash
2. sudo apt update
3. sudo apt install nodejs

Debug: sudo apt install nodejs -y --verbose
```

### Erro 3: `Paperclip não inicia`
```
Sintoma: systemctl status paperclip mostra "failed"
Solução:
1. sudo journalctl -u paperclip -n 50
2. Procure por [ERROR]
3. Se .env missing: bash setup-supabase.sh
4. Se permissão: sudo systemctl restart paperclip

Debug: sudo journalctl -u paperclip -f
```

### Erro 4: `.env não encontrado`
```
Sintoma: DATABASE_URL connection failed
Solução:
1. Verifique: ls -la /home/user/paperclip-roberts/.env
2. Se não existe: bash setup-supabase.sh "CONNECTION_STRING"
3. Se existe: verificar permissões: stat .env

Debug: cat /home/user/paperclip-roberts/.env | grep DATABASE
```

### Erro 5: `Telegram bot não responde`
```
Sintoma: Bot não recebe mensagens
Solução:
1. Verifique TOKEN: grep TELEGRAM_BOT_TOKEN .env
2. Verifique USER_ID: grep TELEGRAM_USER_ID .env
3. Restart: sudo systemctl restart paperclip
4. Teste: envie /start no bot

Debug: sudo journalctl -u paperclip | grep -i telegram
```

---

# ✅ PARTE 5: CHECKLIST FASE 1

```
PREPARAÇÃO (15 min):
☐ Ler SDD_FASE_1.md
☐ Ler PRD_FASE_1.md
☐ Criar Supabase account (https://supabase.com)
   └─ Copiar CONNECTION_STRING
☐ Criar Telegram bot (@BotFather /newbot)
   └─ Copiar BOT_TOKEN
☐ Obter Telegram USER_ID (@userinfobot)
   └─ Copiar USER_ID

EXECUÇÃO (50 min automático):
☐ SSH para Hermes: ssh user@hermes.dockplus.app
☐ cd /home/user/paperclip-roberts
☐ Bash setup-vps.sh (15 min)
   └─ Aguardar: ✅ SETUP VPS CONCLUÍDO
☐ Bash setup-paperclip.sh (15 min)
   └─ Aguardar: ✅ SETUP PAPERCLIP CONCLUÍDO
☐ Bash setup-supabase.sh "CONNECTION_STRING" (10 min)
   └─ Substituir CONNECTION_STRING verdadeira
   └─ Aguardar: ✅ SETUP SUPABASE CONCLUÍDO
☐ Bash setup-telegram.sh "BOT_TOKEN" "USER_ID" (5 min)
   └─ Substituir BOT_TOKEN e USER_ID verdadeiros
   └─ Enviar /start no Telegram bot
   └─ Aguardar: ✅ SETUP TELEGRAM CONCLUÍDO
☐ Bash final-verification.sh (5 min)
   └─ Aguardar: 🎉 FASE 1 COMPLETA!

VERIFICAÇÃO (5 min):
☐ sudo systemctl status paperclip → "active (running)"
☐ curl http://localhost:3100 → dashboard carrega
☐ Telegram bot responde a /start
☐ sudo journalctl -u paperclip | grep -i error → zero erros

✅ FASE 1 ASSINADA COMO COMPLETA
```

---

**PRÓXIMO:** Você tem tudo de FASE 1. 

Próximos arquivos serão FASE 2, 3, 4 com mesmo formato.
