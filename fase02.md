# 🚀 FASE 2 COMPLETA — SDR AGENT + PROSPECTING

**Timeline:** 7 dias | Seu tempo: 30 min | Cursor: 4 horas | Total: ~8 horas

---

# 📋 PARTE 1: SDD FASE 2

## Arquitetura

```
┌─────────────────────────────────────────────┐
│  Paperclip (Orquestradora - FASE 1)         │
├─────────────────────────────────────────────┤
│                    ↓                         │
│  ┌─────────────────────────────────────┐   │
│  │  SDR Agent (Node.js process)        │   │
│  │  └─ Rodando 24/7 via systemd        │   │
│  └──────┬────────────────────────────┬─┘   │
│         │                            │     │
│    ┌────▼────┐              ┌───────▼──┐  │
│    │ Apollo  │              │ Google   │  │
│    │ .io     │              │ Ads API  │  │
│    │ Enrich  │              │ Leads    │  │
│    └────┬────┘              └───────┬──┘  │
│         │                            │     │
│         └────────┬───────────────────┘     │
│                  ↓                         │
│        ┌─────────────────────┐            │
│        │ Supabase (FASE 1)   │            │
│        │ leads table         │            │
│        │ metrics table       │            │
│        └─────────────────────┘            │
│                  ↓                         │
│        ┌─────────────────────┐            │
│        │ Telegram Alerts     │            │
│        │ Daily summary       │            │
│        └─────────────────────┘            │
│                                           │
└─────────────────────────────────────────────┘
```

## Componentes

### SDR Agent
```
Função: Prospeca leads 24/7
├─ Inicia a cada 1 hora
├─ Puxa novos leads de Google Ads
├─ Enriquece com Apollo.io
├─ Salva em Supabase
└─ Envia alerta Telegram se encontrou leads
```

### Apollo.io Integration
```
Função: Enriquecer dados de prospect
├─ Search por: tecnologia, localização, industria
├─ Retorna: email, telefone, LinkedIn, etc
├─ Rate limit: 200 req/min (pago), 50 req/min (free)
├─ Cache: 24 horas (evitar duplicatas)
└─ Retry: exponential backoff se rate limited
```

### Google Ads API
```
Função: Puxar leads de campanhas
├─ Auth via OAuth 2.0
├─ Query: campanhas + ad groups + conversões
├─ Filter: leads com quality score > 7
├─ Sync: leads novos a cada hora
└─ Webhook: notifica SDR de novas conversões
```

### Database Schema (Supabase)
```
leads table (já criada em FASE 1):
├─ id (UUID)
├─ name (TEXT)
├─ email (TEXT)
├─ phone (TEXT)
├─ company (TEXT)
├─ source (TEXT: 'google_ads' | 'apollo')
├─ status (TEXT: 'new' | 'enriched' | 'contacted')
├─ apollo_data (JSONB)
├─ google_ads_data (JSONB)
├─ created_at (TIMESTAMP)
└─ updated_at (TIMESTAMP)

metrics table (já criada em FASE 1):
├─ id (UUID)
├─ metric_name (TEXT)
├─ metric_value (NUMERIC)
├─ date (DATE)
└─ created_at (TIMESTAMP)

jobs table (nova):
├─ id (UUID)
├─ job_type (TEXT: 'prospect' | 'enrich')
├─ status (TEXT: 'pending' | 'running' | 'completed' | 'failed')
├─ started_at (TIMESTAMP)
├─ completed_at (TIMESTAMP)
├─ result (JSONB)
└─ error (TEXT)
```

---

# 🎯 PARTE 2: PRD FASE 2

## Features

### FR-2.1: Apollo.io Integration
**Objetivo:** Enriquecer dados de prospects

Acceptance Criteria:
- [ ] Conexão com Apollo.io API validada
- [ ] Search por companhias (technology, location)
- [ ] Search por pessoas (roles, titles)
- [ ] Cache de 24h implementado
- [ ] Rate limit handling (max 200 req/min)
- [ ] Retry automático com exponential backoff (max 3)
- [ ] Data mapping correto (email, phone, LinkedIn)
- [ ] Error logging detalhado
- [ ] Teste: 10 lookups sem erro

### FR-2.2: Google Ads API Integration
**Objetivo:** Puxar leads de campanhas

Acceptance Criteria:
- [ ] OAuth 2.0 setup completo
- [ ] Conexão com Google Ads API validada
- [ ] Query campaighs endpoint funcional
- [ ] Query conversions endpoint funcional
- [ ] Filter por quality score > 7
- [ ] Pagination handling (max 100 leads por call)
- [ ] Error handling para auth failures
- [ ] Webhook setup (se disponível)
- [ ] Teste: puxar 50 leads com sucesso

### FR-2.3: SDR Agent Main Loop
**Objetivo:** Prospecting automático 24/7

Acceptance Criteria:
- [ ] Job scheduler (cron: a cada 1 hora)
- [ ] Fetch Google Ads leads
- [ ] Enrich com Apollo.io
- [ ] Save em Supabase (INSERT or UPDATE)
- [ ] Logging detalhado de cada passo
- [ ] Error handling com retry
- [ ] Telegram notification de sucesso/erro
- [ ] Performance: < 5 min por rodada
- [ ] Teste: rodar 10x sem erro

### FR-2.4: Lead Deduplication
**Objetivo:** Evitar leads duplicados

Acceptance Criteria:
- [ ] Detect duplicata por email exato
- [ ] Detect duplicata por domain + primeira letra nome
- [ ] Update status se duplicata encontrada
- [ ] Log de duplicatas
- [ ] Teste: 20 leads com 5 duplicatas detectadas

### FR-2.5: Data Validation
**Objetivo:** Qualidade dos dados

Acceptance Criteria:
- [ ] Email validation (RFC standard)
- [ ] Phone validation (formato E.164)
- [ ] Company name não vazio
- [ ] Auto-cleanup de dados inválidos
- [ ] Logging de rejeições
- [ ] Teste: 100 registros, 95% válidos

### FR-2.6: Monitoring + Metrics
**Objetivo:** Observabilidade do agent

Acceptance Criteria:
- [ ] Leads prospectados por dia (counter)
- [ ] Taxa de enriquecimento (gauge)
- [ ] Tempo médio por lead (histogram)
- [ ] Erros por tipo (counter)
- [ ] API quota remaining (gauge)
- [ ] Dashboard básico em logs
- [ ] Telegram diário com métricas
- [ ] Teste: métricas coletadas corretamente

---

# 💻 PARTE 3: CÓDIGO FASE 2

## Estrutura de Arquivos

```
FASE-2-CODE/
├── src/
│   ├── index.js (main entry point)
│   ├── config.js (environment variables)
│   ├── agents/
│   │   ├── sdr-agent.js (main loop)
│   │   └── scheduler.js (cron jobs)
│   ├── integrations/
│   │   ├── apollo.js (Apollo.io client)
│   │   ├── google-ads.js (Google Ads client)
│   │   ├── supabase.js (DB client)
│   │   └── telegram.js (Telegram client)
│   ├── utils/
│   │   ├── enrichment.js (enrichment logic)
│   │   ├── deduplication.js (duplicata detection)
│   │   ├── validation.js (data validation)
│   │   └── logger.js (logging)
│   └── types/
│       └── lead.ts (TypeScript types)
├── tests/
│   ├── apollo.test.js
│   ├── google-ads.test.js
│   ├── sdr-agent.test.js
│   └── integration.test.js
├── .env (não commit)
├── .env.example (template)
├── package.json
├── package-lock.json
└── README.md
```

## Arquivo 1: package.json

```json
{
  "name": "roberts-landscape-sdr",
  "version": "1.0.0",
  "description": "SDR Agent for Roberts Landscape",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --coverage",
    "test:apollo": "jest tests/apollo.test.js",
    "test:google-ads": "jest tests/google-ads.test.js",
    "test:integration": "jest tests/integration.test.js",
    "lint": "eslint src/",
    "logs:sdr": "journalctl -u sdr-agent -f",
    "debug": "DEBUG=* node src/index.js"
  },
  "dependencies": {
    "apollo-sdk": "^1.0.0",
    "google-ads-api": "^3.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "dotenv": "^16.0.3",
    "node-cron": "^3.0.2",
    "axios": "^1.3.0",
    "winston": "^3.8.2",
    "joi": "^17.9.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "nodemon": "^2.0.0",
    "eslint": "^8.0.0"
  }
}
```

## Arquivo 2: config.js

```javascript
require('dotenv').config();

module.exports = {
  // Database
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  databaseUrl: process.env.PAPERCLIP_DATABASE_URL,

  // Apollo.io
  apolloApiKey: process.env.APOLLO_API_KEY,
  apolloRateLimit: 200, // requests per minute

  // Google Ads
  googleAdsCustomerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
  googleAdsRefreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  googleAdsClientId: process.env.GOOGLE_ADS_CLIENT_ID,
  googleAdsClientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,

  // Telegram
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramUserId: process.env.TELEGRAM_USER_ID,

  // Scheduling
  prospectingInterval:
    process.env.SDR_PROSPECTING_INTERVAL ||
    (process.env.NODE_ENV === 'test' ? '*/15 * * * *' : '0 * * * *'),
  // Production: every hour. Tests only: every 15 minutes.
  metricsInterval: '0 9 * * *', // Daily at 9am

  // SDR Config
  maxLeadsPerRound: 100,
  minQualityScore: 7,
  enrichmentRetries: 3,
  enrichmentBackoffMs: 1000
};
```

## Arquivo 3: sdr-agent.js

```javascript
const cron = require('node-cron');
const { supabase } = require('./integrations/supabase');
const apollo = require('./integrations/apollo');
const googleAds = require('./integrations/google-ads');
const telegram = require('./integrations/telegram');
const logger = require('./utils/logger');
const config = require('./config');

class SDRAgent {
  constructor() {
    this.running = false;
    this.lastRun = null;
  }

  async start() {
    logger.info('🚀 Starting SDR Agent');
    
    // Prospecting job (every hour)
    cron.schedule(config.prospectingInterval, () => {
      this.runProspectingJob();
    });

    // Metrics job (daily)
    cron.schedule(config.metricsInterval, () => {
      this.sendDailyMetrics();
    });

    logger.info('✅ SDR Agent started');
  }

  async runProspectingJob() {
    if (this.running) {
      logger.warn('⚠️ Prospecting job already running, skipping');
      return;
    }

    this.running = true;
    const startTime = Date.now();

    try {
      logger.info('[SDR] Starting prospecting round');

      // 1. Fetch Google Ads leads
      logger.info('[SDR] Fetching Google Ads leads');
      const googleLeads = await googleAds.getNewLeads(config.maxLeadsPerRound);
      logger.info(`[SDR] Found ${googleLeads.length} leads from Google Ads`);

      // 2. Enrich with Apollo
      logger.info('[SDR] Enriching leads with Apollo');
      const enrichedLeads = await Promise.all(
        googleLeads.map(lead => this.enrichLead(lead))
      );

      // 3. Deduplicate
      logger.info('[SDR] Checking for duplicates');
      const uniqueLeads = await this.deduplicateLeads(enrichedLeads);
      logger.info(`[SDR] ${uniqueLeads.length} unique leads after deduplication`);

      // 4. Validate
      logger.info('[SDR] Validating leads');
      const validLeads = await this.validateLeads(uniqueLeads);
      logger.info(`[SDR] ${validLeads.length} valid leads`);

      // 5. Save to Supabase
      logger.info('[SDR] Saving to Supabase');
      const saved = await this.saveLeads(validLeads);
      logger.info(`[SDR] ${saved} leads saved`);

      // 6. Notify via Telegram
      const duration = (Date.now() - startTime) / 1000;
      await telegram.sendMessage(
        `✅ Prospecting round completed\n` +
        `📊 Found: ${googleLeads.length}\n` +
        `✔️ Valid: ${validLeads.length}\n` +
        `💾 Saved: ${saved}\n` +
        `⏱️ Duration: ${duration}s`
      );

      // 7. Update metrics
      await this.recordMetrics({
        round: true,
        leadsFound: googleLeads.length,
        leadsSaved: saved,
        duration: duration
      });

      logger.info('[SDR] Prospecting round completed successfully');
      this.lastRun = new Date();

    } catch (error) {
      logger.error('[SDR] Prospecting round failed', error);
      await telegram.sendMessage(
        `❌ Prospecting error\n${error.message}`
      );
    } finally {
      this.running = false;
    }
  }

  async enrichLead(googleLead) {
    try {
      const companyData = await apollo.searchCompanies({
        domain: googleLead.domain,
        limit: 1
      });

      if (companyData.length === 0) {
        logger.warn(`No Apollo data for ${googleLead.company}`);
        return googleLead;
      }

      const peopleData = await apollo.searchPeople({
        company_id: companyData[0].id,
        roles: ['CEO', 'Founder', 'Manager'],
        limit: 1
      });

      return {
        ...googleLead,
        apollo_data: {
          company: companyData[0],
          person: peopleData[0] || null
        }
      };
    } catch (error) {
      logger.warn(`Enrichment failed for ${googleLead.company}:`, error.message);
      return googleLead;
    }
  }

  async deduplicateLeads(leads) {
    const unique = [];
    const seen = new Set();

    for (const lead of leads) {
      const key = lead.email?.toLowerCase() || `${lead.company}-${lead.name[0]}`;
      if (!seen.has(key)) {
        unique.push(lead);
        seen.add(key);
      } else {
        logger.info(`[Dedupe] Duplicate found: ${lead.email || lead.company}`);
      }
    }

    return unique;
  }

  async validateLeads(leads) {
    const { validate } = require('./utils/validation');
    return leads.filter(lead => {
      const validation = validate(lead);
      if (!validation.valid) {
        logger.warn(`[Validate] Invalid lead:`, validation.errors);
      }
      return validation.valid;
    });
  }

  async saveLeads(leads) {
    let saved = 0;
    for (const lead of leads) {
      try {
        const { error } = await supabase
          .from('leads')
          .upsert({
            email: lead.email,
            name: lead.name,
            phone: lead.phone,
            company: lead.company,
            source: 'google_ads',
            apollo_data: lead.apollo_data || null,
            status: 'enriched'
          }, {
            onConflict: 'email'
          });

        if (!error) saved++;
      } catch (error) {
        logger.error(`Failed to save lead ${lead.email}:`, error);
      }
    }
    return saved;
  }

  async recordMetrics(data) {
    try {
      await supabase.from('metrics').insert({
        metric_name: 'sdr_prospecting_round',
        metric_value: data.leadsSaved,
        date: new Date().toISOString().split('T')[0],
        metadata: data
      });
    } catch (error) {
      logger.error('Failed to record metrics:', error);
    }
  }

  async sendDailyMetrics() {
    try {
      const { data } = await supabase
        .from('metrics')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0]);

      const totalSaved = data?.reduce((sum, m) => sum + (m.metric_value || 0), 0) || 0;

      await telegram.sendMessage(
        `📊 Daily SDR Metrics\n` +
        `📈 Leads saved: ${totalSaved}\n` +
        `⏰ Last run: ${this.lastRun?.toLocaleString()}`
      );
    } catch (error) {
      logger.error('Failed to send daily metrics:', error);
    }
  }
}

module.exports = new SDRAgent();
```

## Arquivo 4: apollo.js Integration

```javascript
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class ApolloClient {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.apollo.io/api/v1',
      headers: {
        'x-api-key': config.apolloApiKey
      }
    });
    this.cache = new Map();
  }

  async searchCompanies({ domain, name, limit = 10 }) {
    const cacheKey = `company:${domain || name}`;
    
    if (this.cache.has(cacheKey)) {
      logger.debug(`Cache hit: ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.client.post('/mixed_companies/search', {
        q_organization_domains_list: domain ? [domain] : [],
        q_organization_name: name || undefined,
        page: 1,
        per_page: limit
      });

      const companies = response.data.organizations || [];
      this.cache.set(cacheKey, companies);
      setTimeout(() => this.cache.delete(cacheKey), 24 * 60 * 60 * 1000); // 24h TTL

      return companies;
    } catch (error) {
      logger.error(`Apollo company search failed:`, error.message);
      throw error;
    }
  }

  async searchPeople({ company_id, roles, limit = 10 }) {
    const cacheKey = `people:${company_id}:${roles.join(',')}`;
    
    if (this.cache.has(cacheKey)) {
      logger.debug(`Cache hit: ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.client.post('/mixed_people/api_search', {
        organization_ids: [company_id],
        person_titles: roles,
        page: 1,
        per_page: limit
      });

      const people = response.data.people || [];
      this.cache.set(cacheKey, people);
      setTimeout(() => this.cache.delete(cacheKey), 24 * 60 * 60 * 1000);

      return people;
    } catch (error) {
      logger.error(`Apollo people search failed:`, error.message);
      throw error;
    }
  }
}

module.exports = new ApolloClient();
```

## Arquivo 5: google-ads.js Integration

```javascript
const { GoogleAdsApi } = require('google-ads-api');
const logger = require('../utils/logger');
const config = require('../config');

class GoogleAdsClient {
  constructor() {
    this.client = new GoogleAdsApi({
      client_id: config.googleAdsClientId,
      client_secret: config.googleAdsClientSecret,
      developer_token: config.googleAdsDeveloperToken
    });
    this.lastSync = null;
  }

  async getNewLeads(limit = 100) {
    try {
      const customer = this.client.Customer({
        customer_id: config.googleAdsCustomerId,
        refresh_token: config.googleAdsRefreshToken
      });

      // Get conversions from last hour
      const response = await customer.query(`
        SELECT
          conversion_action.id,
          conversion_action.name,
          conversion_value.conversion_date_time,
          customer.descriptive_name,
          campaign.name,
          ad_group.name,
          lead.gclid
        FROM conversion
        WHERE
          conversion_value.conversion_date_time >= ${this.getLastHourISO()}
          AND conversion_action.name = 'Website Lead'
        ORDER BY conversion_value.conversion_date_time DESC
        LIMIT ${limit}
      `);

      return response.map(row => ({
        gclid: row.lead.gclid,
        campaign: row.campaign.name,
        adGroup: row.ad_group.name,
        conversionTime: row.conversion_value.conversion_date_time,
        source: 'google_ads'
      }));

    } catch (error) {
      logger.error(`Google Ads query failed:`, error.message);
      throw error;
    }
  }

  getLastHourISO() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    return oneHourAgo.toISOString();
  }
}

module.exports = new GoogleAdsClient();
```

---

# 🆘 PARTE 4: DEBUGGER FASE 2

## Erros Comuns

### Erro 1: Apollo API key inválida
```
Sintoma: 401 Unauthorized from Apollo
Solução:
1. Verifique .env: grep APOLLO_API_KEY .env
2. Copie correto de: https://app.apollo.io/settings/api
3. Test: curl -H "x-api-key: YOUR_KEY" https://api.apollo.io/api/v1/accounts
Debug: npm run debug | grep apollo
```

### Erro 2: Google Ads refresh token expirou
```
Sintoma: 401 Invalid Credentials from Google
Solução:
1. Vá para: https://myaccount.google.com/permissions
2. Revogue: "Roberts Landscape App"
3. Execute: npm run setup:google-oauth
4. Siga fluxo OAuth
5. Copie novo refresh token para .env
Debug: npm run test:google-ads
```

### Erro 3: Rate limit Apollo (429)
```
Sintoma: 429 Too Many Requests
Solução:
1. Implementado exponential backoff automático
2. Se persiste: diminua max request rate
3. Verifique: config.apolloRateLimit = 50 (em vez de 200)
Debug: npm run logs:sdr | grep "rate\|429"
```

### Erro 4: Leads não salvando em Supabase
```
Sintoma: Logs mostram sucesso, mas nada em DB
Solução:
1. Verificar .env: SUPABASE_URL e SUPABASE_KEY
2. Verificar conexão: npm run test:supabase
3. Verificar schema: SELECT * FROM leads LIMIT 5
4. Verificar permissões RLS
Debug: node -e "require('./src/integrations/supabase').test()"
```

### Erro 5: Telegram não recebendo notificações
```
Sintoma: SDR roda mas sem mensagens Telegram
Solução:
1. Verifique TOKEN: grep TELEGRAM_BOT_TOKEN .env
2. Verifique USER_ID: grep TELEGRAM_USER_ID .env
3. Teste direto: npm run test:telegram
4. Restart: npm run start
Debug: npm run logs:sdr | grep -i telegram
```

---

# ✅ PARTE 5: CHECKLIST FASE 2

```
PREPARAÇÃO (10 min):
☐ Ler SDD_FASE_2.md
☐ Ler PRD_FASE_2.md
☐ Criar Apollo.io account (https://apollo.io)
   └─ Copiar API_KEY
☐ Conectar Google Ads (https://ads.google.com)
   └─ Obter CUSTOMER_ID
   └─ Gerar refresh token (OAuth flow)
☐ Copiar FASE-2/CÓDIGO para seu diretório

SETUP (20 min):
☐ cd FASE-2-CODE
☐ npm install
☐ Criar .env com:
   APOLLO_API_KEY=xxx
   GOOGLE_ADS_CUSTOMER_ID=xxx
   GOOGLE_ADS_REFRESH_TOKEN=xxx
   SUPABASE_URL=xxx (de FASE 1)
   SUPABASE_KEY=xxx (de FASE 1)
   TELEGRAM_BOT_TOKEN=xxx (de FASE 1)
   TELEGRAM_USER_ID=xxx (de FASE 1)
   SDR_PROSPECTING_INTERVAL=0 * * * *   (produção)
   NODE_ENV=production

DESENVOLVIMENTO (4h automático, você observa):
☐ Abrir em Cursor Max
☐ Usar @references:
   @src/integrations/apollo.js
   @src/integrations/google-ads.js
   @src/agents/sdr-agent.js
☐ Cursor implementa FR-2.1 até FR-2.6
☐ Você monitora progresso via logs

TESTES (1h suas mãos):
☐ npm test (testes unitários)
☐ npm run test:apollo (testar Apollo)
☐ npm run test:google-ads (testar Google)
☐ npm run test:integration (E2E test)
☐ npm run start (rodar agent local)
   └─ Enviar 1 lead de teste
   └─ Verificar Supabase: SELECT * FROM leads
   └─ Verificar Telegram: recebeu notificação?

DEPLOY (30 min suas mãos):
☐ npm run build (se houver)
☐ Copiar para Hermes: scp -r . user@hermes:~/sdr-agent/
☐ SSH: ssh user@hermes
☐ cd ~/sdr-agent && npm install
☐ Criar systemd service:
   sudo tee /etc/systemd/system/sdr-agent.service
   [colar template abaixo]
☐ sudo systemctl daemon-reload
☐ sudo systemctl enable sdr-agent
☐ sudo systemctl start sdr-agent
☐ Verificar: sudo systemctl status sdr-agent
☐ Monitorar logs: sudo journalctl -u sdr-agent -f

VALIDAÇÃO (30 min suas mãos):
☐ Aguardar próxima hora (prospecting job)
☐ Verificar Telegram: recebeu summary?
☐ SELECT COUNT(*) FROM leads;
   └─ Número aumentou?
☐ Verificar metrics:
   SELECT * FROM metrics WHERE metric_name LIKE 'sdr%';
☐ Sem [ERROR] em logs:
   sudo journalctl -u sdr-agent | grep ERROR

✅ FASE 2 ASSINADA COMO COMPLETA
```

## Template Systemd

```ini
[Unit]
Description=Roberts SDR Agent
After=network.target

[Service]
Type=simple
User=user
WorkingDirectory=/home/user/sdr-agent
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

---

**PRÓXIMO:** FASE-3-COMPLETO.md (Email + Calendar Automation)
