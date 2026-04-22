# 🛠️ COMO USAR IDEs — QUAL USAR + QUAL MODELO EM CADA FASE

**Resumo Executivo:**
```
FASE 1: Cursor (Terminal) + Claude 3.5 Sonnet
FASE 2-4: Cursor Max + Claude 3.5 Sonnet (ou Claude 4 para máxima qualidade)
```

---

## 🎯 RECOMENDAÇÕES FINAIS

| Fase | IDE | Modelo | Por quê? | Tempo |
|------|-----|--------|---------|-------|
| 1 | Cursor | Sonnet 3.5 | Scripts bash, simples, rápido | 50 min |
| 2 | Cursor Max | Sonnet 3.5 | Node.js multi-arquivo, @references | 4h |
| 2 | Cursor Max | Claude 4* | Se quiser máxima qualidade | 4h |
| 3 | Cursor Max | Sonnet 3.5 | Async/await, tiempo-based logic | 3h |
| 3 | Cursor Max | Claude 4* | Se quiser máxima qualidade | 3h |
| 4 | Cursor Max | Sonnet 3.5 | Dashboards, config files | 2h |
| 4 | Cursor Max | Claude 4* | Se quiser máxima qualidade | 2h |

**\* Claude 4 disponível com Cursor Max (precisa upgrade)**

---

## 📋 FASE 1: INFRAESTRUTURA

### IDE: Cursor (versão gratuita OK)

**Por quê Cursor?**
```
✅ Terminal integrado (rápido para bash)
✅ File explorer nativo
✅ Git integrado
✅ Output panel claro
✅ Sem overhead
```

**Não use:**
```
❌ VS Code puro (não otimizado para LLM)
❌ Codex (overkill para scripts)
❌ Cursor Max (não precisa, wastes memory)
```

### Modelo: Claude 3.5 Sonnet

**Por quê?**
```
✅ Scripts bash são simples
✅ Sonnet é rápido (50s vs 2min com 4)
✅ Confiável para instalação
✅ Debugging é straight-forward
```

### Como usar no Cursor

```
ABRA CURSOR:
├─ File → Open Folder → /home/user/paperclip-roberts
├─ View → Terminal (Ctrl+`)
├─ Abra: FASE-1/SDD_FASE_1.md (tab 1)
├─ Abra: FASE-1/CHECKLIST_FASE_1.md (tab 2)
├─ Terminal ativo (tab 3)

WORKFLOW:
├─ Leia checklist passo-a-passo
├─ Copy-paste comando do checklist → terminal
├─ Ctrl+` (toggle terminal visibility)
├─ Verifique output
├─ Próximo passo

EXEMPLO:
Checklist diz: "bash setup-vps.sh"
└─ Cola no terminal
└─ Aperta Enter
└─ Aguarda 15 min
└─ Checklist mostra: ✅ setup-vps concluído
└─ Próximo

TOTAL FASE 1: 50 minutos
```

### Setup Cursor para FASE 1

```bash
# Terminal no Cursor:

# 1. Vá para diretório
cd /home/user/paperclip-roberts

# 2. Crie arquivo de config
cat > .cursorignore << 'EOF'
node_modules
.git
.env
logs
EOF

# 3. Abra Cursor settings
# Cursor → Preferences → Settings
# Busque: "Terminal Font Size"
# Mude para: 13 (melhor leitura)

# 4. Pronto para FASE 1
```

---

## 📋 FASE 2: SDR AGENT

### IDE: Cursor Max (OBRIGATÓRIO)

**Por quê Cursor Max?**
```
✅ Multi-file composer (edita 5 arquivos ao mesmo tempo)
✅ @references (referencia arquivos para contexto)
✅ Code generation incrível
✅ Pode lidar com projetos complexos
✅ Built-in debugging tools

❌ Cursor regular (vai ficar lento com 5+ arquivos)
```

### Modelo: Claude 3.5 Sonnet (Recomendado) OU Claude 4

**Opção A: Claude 3.5 Sonnet** (RECOMENDADO)
```
✅ Rápido: 2-3 min por feature
✅ Confiável para Node.js
✅ Entende integrations bem
✅ Custo baixo ($0.003/1k tokens)
✅ Bom trade-off velocidade/qualidade

Use se:
├─ Quer terminar FASE 2 em 4 horas
├─ Budget limitado
├─ Confiante em testes (você valida)
```

**Opção B: Claude 4** (MÁXIMA QUALIDADE)
```
✅ Melhor entendimento de lógica complexa
✅ Melhor debugging de integrações
✅ Melhor performance optimization
✅ Menos bugs
✅ Tempo resposta similar (3-4 min)

Use se:
├─ Quer máxima qualidade
├─ Budget OK
├─ Pouco tempo para testar
```

### Setup Cursor Max para FASE 2

```bash
# Terminal no Cursor:

# 1. Vá para diretório FASE 2
cd /home/user/paperclip-roberts

# 2. Crie workspace.code-workspace
cat > workspace.code-workspace << 'EOF'
{
  "folders": [
    {
      "path": ".",
      "name": "Roberts Landscape SDR Agent"
    }
  ],
  "settings": {
    "editor.wordWrap": "on",
    "editor.fontSize": 13,
    "[javascript]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
}
EOF

# 3. Abra workspace
Cursor → File → Open Workspace from File → workspace.code-workspace

# 4. Configure Cursor Max
Cursor → Settings → Model Selection
├─ Selecione: Claude 3.5 Sonnet OU Claude 4
├─ Token limit: 8000 (default ok)
├─ Temperature: 0.7 (default ok)

# 5. Abra múltiplas abas
# File Explorer:
├─ FASE-2/SDD_FASE_2.md (aba 1)
├─ FASE-2/PRD_FASE_2.md (aba 2)
├─ FASE-2/CÓDIGO_FASE_2/main.js (aba 3)
├─ FASE-2/CÓDIGO_FASE_2/config.js (aba 4)
├─ FASE-2/CHECKLIST_FASE_2.md (aba 5)

# 6. Terminal
View → Terminal (Ctrl+`)
```

### Como usar Cursor Max (Composer Mode)

```
MODO COMPOSER (Melhor para multi-arquivo):

1. Ctrl+K (abre Composer)
2. Diga ao Cursor:
   "Implemente FR-2.1: Apollo.io integration
    
    Arquivos afetados:
    @src/integrations/apollo.js
    @src/config.js
    @src/utils/enrichment.js
    
    Requisitos:
    - Rate limit handling (max 200 req/min)
    - Cache de resultados
    - Error retry com exponential backoff
    
    Use @arquivo para referência"

3. Cursor Max vai:
   └─ Ler seus @referencias
   └─ Gerar código em 5 arquivos
   └─ Manter consistência
   └─ Incluir imports corretos

4. Você revisa:
   └─ Alt+Tab entre abas
   └─ Leia código gerado
   └─ Se OK: Accept (Cmd+Enter)
   └─ Se errado: Regenerate

PRÓXIMA FEATURE: Repita
```

### Workflow Típico FASE 2

```
DIA 1: Setup
├─ Ler SDD_FASE_2.md (10 min)
├─ Ler PRD_FASE_2.md (10 min)
└─ Setup Cursor Max (5 min)

DIA 2-4: Cursor implementa
├─ FR-2.1 Apollo integration (1h automático)
├─ FR-2.2 Google Ads connector (1h automático)
├─ FR-2.3 SDR agent main (1h automático)
├─ FR-2.4 Lead enrichment (0.5h automático)
└─ FR-2.5 Data validation (0.5h automático)

DIA 5: Testes
├─ npm run test (30 min automático)
├─ Você testa manualmente (30 min)
└─ Fix issues se houver (30 min)

DIA 6-7: Deploy + monitoring
├─ npm run deploy (5 min automático)
├─ Você valida em produção (30 min)
└─ Monitor logs (15 min)

TOTAL: 4 horas automático + 1.5h suas mãos
```

---

## 📋 FASE 3: EMAIL + CALENDAR

### IDE: Cursor Max (OBRIGATÓRIO)

**Por quê?**
```
✅ Async/await patterns (Cursor Max melhor)
✅ Webhook handling (múltiplos arquivos)
✅ Timezone logic (complexo)
✅ Template system (multi-arquivo)
```

### Modelo: Claude 3.5 Sonnet OU Claude 4

Mesma recomendação que FASE 2:
- **Sonnet:** Rápido, barato, confiável (recomendado)
- **Claude 4:** Máxima qualidade (opção premium)

### Setup Cursor Max para FASE 3

Mesmo que FASE 2, mas:
```
Mude workspace name:
├─ "Roberts Landscape Email + Calendar Agent"

Abra arquivo adicional:
├─ FASE-3/CÓDIGO_FASE_3/email-agent.js
├─ FASE-3/CÓDIGO_FASE_3/calendar-agent.js
├─ FASE-3/CÓDIGO_FASE_3/templates/
```

### Diferenças FASE 3 vs FASE 2

```
FASE 2 (Prospecting):
├─ Síncrono (fetch → transform → save)
├─ Rate-limited
└─ Iniciado por webhook Google Ads

FASE 3 (Email + Calendar):
├─ Assíncrono (queue-based)
├─ Time-dependent (follow-ups após X horas)
├─ Multiple integrations (SendGrid + Google Calendar)
├─ Webhook callbacks (delivery tracking)
└─ Timezone-aware scheduling

REQUER:
├─ Job queue (Bull ou similar)
├─ Cron scheduler
├─ Webhook handlers
├─ Template engine

CURSOR MAX EXCELENTE PARA ISTO:
├─ Pode gerar job queue em 30 min
├─ Pode gerar cron em 15 min
├─ Pode gerar webhooks em 20 min
└─ Tudo coordenado
```

---

## 📋 FASE 4: MONITORING

### IDE: Cursor Max (recomendado)

**Por quê?**
```
✅ Grafana JSON (múltiplos dashboards)
✅ Prometheus config (regras complexas)
✅ Docker Compose (múltiplos containers)
✅ Alert rules (múltiplos arquivos)

Pode fazer com Cursor regular?
├─ Sim, mas Cursor Max é mais fluido
└─ (gera 3+ arquivos de config)
```

### Modelo: Claude 3.5 Sonnet OU Claude 4

Mesma recomendação anterior:
- **Sonnet:** Rápido (RECOMENDADO para FASE 4, é mais configuração)
- **Claude 4:** Máxima qualidade (opcional)

### Setup Cursor Max para FASE 4

```
Workspace FASE 4:
├─ FASE-4/SDD_FASE_4.md (aba 1)
├─ FASE-4/PRD_FASE_4.md (aba 2)
├─ FASE-4/CÓDIGO_FASE_4/prometheus.yml (aba 3)
├─ FASE-4/CÓDIGO_FASE_4/grafana-dashboards/ (aba 4)
├─ FASE-4/CÓDIGO_FASE_4/docker-compose.yml (aba 5)
└─ FASE-4/CHECKLIST_FASE_4.md (aba 6)
```

---

## 🎯 RESUMO: IDE + MODELO

### **Para MÁXIMA VELOCIDADE:**
```
FASE 1: Cursor + Sonnet (50 min total)
FASE 2: Cursor Max + Sonnet (4h total)
FASE 3: Cursor Max + Sonnet (3h total)
FASE 4: Cursor Max + Sonnet (2h total)

TOTAL: ~9-10 horas trabalho automático
SUA MÃOS: ~2.5 horas
RESULTADO: Sistema produção-ready
```

### **Para MÁXIMA QUALIDADE:**
```
FASE 1: Cursor + Sonnet (50 min total)
FASE 2: Cursor Max + Claude 4 (5h total, +25% tempo)
FASE 3: Cursor Max + Claude 4 (4h total, +33% tempo)
FASE 4: Cursor Max + Claude 4 (2.5h total, +25% tempo)

TOTAL: ~12 horas trabalho automático
SUA MÃOS: ~2.5 horas
RESULTADO: Código premium, menos bugs, melhor performance
```

### **Recomendação pessoal:**
```
✅ USE SONNET para FASE 1-4

Por quê:
├─ Você valida tudo (seus testes)
├─ Debugger automático em cada fase
├─ Se algo errado: fácil ajustar
├─ Economia $$ significativa
├─ Mesma qualidade com testes

OPÇÃO: Upgrade para Claude 4 se:
├─ Encontrar bugs em FASE 2-3
├─ Quer melhor performance em FASE 4
├─ Budget OK
```

---

## 📦 QUAL IDE INSTALAR

### **Se não tem nada:**
```
INSTALE:
1. Cursor (https://cursor.com)
   └─ Download para seu OS
   └─ Instale como VSCode
   
2. Node.js 20+
   └─ https://nodejs.org/
   
3. Git
   └─ https://git-scm.com/

PRONTO: Tem tudo para FASE 1-4
```

### **Se tem VS Code:**
```
OPÇÃO A: Uninstall VS Code, instale Cursor
└─ Cursor é fork de VS Code
└─ Mesma interface + AI integrado
└─ Easier onboarding

OPÇÃO B: Use VS Code + extensão
└─ Instale: "Claude for VS Code"
└─ Funciona, mas menos integrado
└─ Recomendado: Cursor é melhor
```

### **Se tem Cursor regular:**
```
FASE 1: Use como está
FASE 2-4: Upgrade para Cursor Max
└─ Menu → Cursor → Subscription
└─ Ou: https://cursor.com/pricing
└─ $20/mês ou ilimitado

Ou use Cursor regular:
└─ Funciona, mas mais lento
└─ Composer mode não perfeito
└─ Recomendado: pague Max
```

---

## ⚙️ SETTINGS RECOMENDADOS

### Cursor Settings (todos as fases)

```json
{
  "editor.fontSize": 13,
  "editor.fontFamily": "Fira Code, Courier New, monospace",
  "editor.wordWrap": "on",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "terminal.integrated.fontSize": 13,
  "terminal.integrated.lineHeight": 1.3,
  "workbench.colorTheme": "One Dark Pro Darker",
  "workbench.editor.enablePreview": false
}
```

### Cursor AI Settings (FASE 2-4, Composer Mode)

```
Cursor → Preferences → Settings → Search "AI"

Claude Model Selection:
├─ FASE 1: Claude 3.5 Sonnet
├─ FASE 2-4: Claude 3.5 Sonnet ou Claude 4
└─ Claude 4 ativado via Cursor Max subscription

Temperature: 0.7 (default)
Max Tokens: 8000 (aumentar se precisar)
Context Window: Automático (deixe default)
```

---

## 🎓 DICAS PRO

### **Dica 1: Use @references**
```
Em Cursor Max, faça isto:

Ctrl+K (abre Composer)
@FASE-2/integrations/apollo.js
@FASE-2/config.js
@FASE-2/utils/enrichment.js

"Implemente rate limit handling com exponential backoff"

Cursor vai:
├─ Ler todos 3 arquivos
├─ Entender contexto
├─ Gerar código consistente
└─ Manter imports corretos
```

### **Dica 2: Divida em features pequenas**
```
Não faça:
❌ "Implemente tudo de FASE 2"

Faça:
✅ "Implemente FR-2.1: Apollo connection"
✅ "Implemente FR-2.2: Rate limiting"
✅ "Implemente FR-2.3: Caching"

Resultado:
├─ Código mais focado
├─ Mais fácil testar
├─ Menos bugs
└─ Você controla melhor
```

### **Dica 3: Sempre copie/teste primeiro**
```
Workflow correto:

1. Cursor gera code
2. Você copia → seu diretório
3. Você roda: npm test
4. Se OK: merge
5. Se erro: debug

Nunca:
❌ Use direto em produção
❌ Confie 100% sem testar
```

### **Dica 4: Mantenha debugger pronto**
```
Terminal sempre aberto:

npm run logs:sdr      (FASE 2)
npm run logs:email    (FASE 3)
npm run logs:monitor  (FASE 4)

Se algo errado:
├─ Veja logs em tempo real
├─ Copie erro
├─ Leia DEBUGGER_FASE_X.md
└─ Solucione
```

---

## 🚀 PRONTO?

```
IDE Setup:
☐ Instalar Cursor (free ok para FASE 1)
☐ Instalar Node.js 20+
☐ Instalar Git
☐ Fazer login Cursor (para Claude access)

Configuração:
☐ Abrir Cursor settings
☐ Copiar settings JSON acima
☐ Ativar formatação automática

Pronto? Vamos começar FASE 1!
```

---

**Próximo arquivo:** FASE-1/SDD_FASE_1.md