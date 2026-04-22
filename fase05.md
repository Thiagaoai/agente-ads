# FASE 5 — MARKETING SQUAD

**Resumo Executivo:** Equipe autônoma de 11 agentes de IA que gerencia campanhas de marketing, cria conteúdo, executa anúncios pagos e analisa performance em tempo real. Integra-se aos leads qualificados da Fase 2 (SDR) via sincronização de Supabase a cada 6 horas. Todas as decisões de aprovação são revisadas por um Supervisor centralizado. Stack: Node.js 20, Supabase PostgreSQL, OpenAI GPT-4o, DALL-E 3, Runway ML, Meta Marketing API v19, Google Ads API v17, SEMrush, systemd.

---

## PARTE 1: SDD — DESIGN DO SISTEMA

### 1.1 Arquitetura de Agentes

```
┌─────────────────────────────────────────────────────────────┐
│                    CMO Agent (porta 3200)                   │
│               Marketing Squad Orchestrator                    │
├─────────────────────────────────────────────────────────────┤
│  ├─ Strategist Agent      (7am diários)                      │
│  ├─ Copywriter Agent      (a cada 4h)                        │
│  ├─ Image Creator Agent   (a cada 4h) — DALL-E 3           │
│  ├─ Video Creator Agent   (Segundas 9am) — Runway ML       │
│  ├─ Google Ads Agent      (a cada 2h)                        │
│  ├─ Meta Ads Agent        (a cada 2h)                        │
│  ├─ SEO Agent             (a cada 12h) — SEMrush API        │
│  ├─ Analytics Agent       (a cada 6h)                        │
│  ├─ Developer Agent       (sob demanda)                      │
│  └─ Supervisor Agent      (a cada 1h) — QA / brand checks  │
└─────────────────────────────────────────────────────────────┘
              Integração com Paperclip (FASE 1)
                porta 3100, Supabase, Telegram
```

### 1.2 Fluxo de Dados

```
[Phase 2 SDR leads]
        ↓ (a cada 6h)
[CMO syncs → marketing_leads]
        ↓
[Strategist creates campaigns]
        ↓
[Copywriter generates copy]      [Image Creator generates images]
        ↓                                ↓
[content_pieces (pending_review)]
        ↓
[Supervisor reviews] → [aprovado/rejeitado]
        ↓ (aprovado)
[Google Ads Agent] + [Meta Ads Agent] → [ad_sets table]
        ↓
[Analytics (a cada 6h)] → [analytics_reports table]
        ↓
[CMO sends daily report via Telegram]
```

### 1.3 Tabelas Supabase

| Tabela | Propósito | Chaves Primárias |
|--------|-----------|-----------------|
| `campaigns` | Metadata de campanhas, goals, budget, status | `id`, `created_at` |
| `content_pieces` | Copy, imagens, vídeos gerados com status de aprovação | `id`, `campaign_id`, `type` |
| `ad_sets` | Conjuntos de anúncios vivos com CTR, CPC, ROAS | `id`, `campaign_id`, `platform` |
| `analytics_reports` | Relatórios diários/semanais com insights GPT-4o | `id`, `report_date` |
| `approvals` | Registros de revisão do Supervisor (score 1-10, violations) | `id`, `content_id` |
| `seo_keywords` | Rastreamento de keywords (volume, difficulty, rank) | `id`, `campaign_id` |
| `landing_pages` | Landing pages geradas com conversion tracking | `id`, `campaign_id` |
| `marketing_leads` | Bridge table: Phase 2 leads → públicos de retargeting | `id`, `lead_id`, `synced_at` |
| `brand_assets` | Logo, cores, fontes, diretrizes de brand | `id`, `updated_at` |

### 1.4 APIs Externas por Agente

| Agente | API Principal | NPM Package | Escopo |
|--------|---------------|-----------|----|
| Strategist | OpenAI GPT-4o | `openai` | Briefing, goals, segment targeting |
| Copywriter | OpenAI GPT-4o | `openai` | Ad copy, email, landing pages |
| Image Creator | OpenAI DALL-E 3 | `openai` | Social media, ad banners, hero images |
| Video Creator | Runway ML | `axios` | Short-form content (TikTok, Reels) |
| Supervisor | OpenAI GPT-4o | `openai` | Brand compliance, score, violations |
| Google Ads | Google Ads API v17 | `google-ads-api` | Campaign creation, bid management |
| Meta Ads | Meta Marketing API v19 | `axios` | Facebook, Instagram, Reels ads |
| Analytics | Google Ads + Meta | `google-ads-api`, `axios` | Performance metrics, attribution |
| SEO | SEMrush API | `axios` | Keyword research, rank tracking |
| Developer | OpenAI GPT-4o | `openai` | Code generation, landing page HTML |
| CMO | Supabase + Telegram | (reuse Phase 1) | Orchestração, relatórios |

### 1.5 Credenciais Novas Necessárias

```
OPENAI_API_KEY=sk-...
META_ACCESS_TOKEN=EAAB...
META_AD_ACCOUNT_ID=act_...
META_PIXEL_ID=...
RUNWAY_API_KEY=...
SEMRUSH_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## PARTE 2: PRD — REQUISITOS FUNCIONAIS

### FR-5.1: CMO Agent (Chief Marketing Officer)

**Responsabilidade:** Orquestrador central. Inicia todos os 10 agentes filhos, sincroniza leads da Fase 2, monitora status de conteúdo, dispara ciclos de aprovação e envia relatório diário ao Telegram.

**Requisitos:**
- `start()` inicializa todos os 10 agentes em paralelo com `Promise.all()`
- `runOrchestrationCycle()` a cada 6 horas verifica conteúdo pendente e dispara agentes apropriados
- `syncLeadsFromSDR()` puxa leads enriquecidos da tabela `leads` (Fase 2) → `marketing_leads`
- `sendDailyReport()` compõe resumo Telegram com métricas de campanhas, conteúdo aprovado, anúncios ativos
- Erros: registra e envia alerta Telegram, continua ciclo

---

### FR-5.2: Strategist Agent

**Responsabilidade:** Cria estratégias e briefings para campanhas com base nos leads sincronizados.

**Requisitos:**
- `processPendingRequests()` a cada 7am
- Consulta `marketing_leads` não atribuídos
- Usa GPT-4o para gerar briefs estratégicos (targeting, messaging, budget allocation)
- Insere campanhas em `campaigns` com `status='draft'`
- Alerta CMO via Telegram quando campanha está pronta

---

### FR-5.3: Copywriter Agent

**Responsabilidade:** Gera textos de publicidade, emails e landing pages.

**Requisitos:**
- `processPendingRequests()` a cada 4 horas
- Consulta `campaigns` com `status='ready_for_content'`
- Usa GPT-4o com prompt detalhado (tons, CTAs, ofertas)
- Cria múltiplas variações (3–5 versões por campanha)
- Insere em `content_pieces` com `type='copy'`, `status='pending_review'`
- Registra em logs com winston

---

### FR-5.4: Image Creator Agent

**Responsabilidade:** Gera imagens para anúncios, social media e landing pages com DALL-E 3.

**Requisitos:**
- `processPendingRequests()` a cada 4 horas
- Consulta campanhas com `status='ready_for_content'`
- Usa DALL-E 3 com prompt visual detalhado (dimensões, estilo, brand colors)
- Faz upload via Cloudinary (armazena URL na base)
- Insere em `content_pieces` com `type='image'`, `status='pending_review'`

---

### FR-5.5: Video Creator Agent

**Responsabilidade:** Gera vídeos curtos para TikTok, Instagram Reels, YouTube Shorts via Runway ML.

**Requisitos:**
- `processPendingRequests()` toda segunda-feira 9am
- Consulta campanhas com `status='ready_for_video'`
- Usa Runway ML API com scene descriptions do copy aprovado
- Polling com timeout de 30 minutos para conclusão
- Upload via Cloudinary
- Insere em `content_pieces` com `type='video'`, `status='approved'` (bypass de review)

---

### FR-5.6: Supervisor Agent

**Responsabilidade:** Revisa todo conteúdo pendente contra diretrizes de brand. Aprova ou rejeita com feedback.

**Requisitos:**
- `reviewPendingContent()` a cada 1 hora
- Consulta `content_pieces` com `status='pending_review'`
- Usa GPT-4o para validar contra brand guidelines (logotipo, cores, tom de voz)
- Retorna JSON: `{ score: 1-10, violations: [...], feedback: "..." }`
- Score ≥ 8 → aprovado; < 8 → rejeitado
- Insere em `approvals` table com timestamp e score
- Envia Telegram alert se rejeitado, com feedback

---

### FR-5.7: Google Ads Agent

**Responsabilidade:** Cria campanhas de Performance Max e Shopping ads, gerencia bids.

**Requisitos:**
- `processPendingRequests()` a cada 2 horas
- Consulta `content_pieces` com `status='approved'` e `campaign_id` ativo
- Usa Google Ads API v17 (reutiliza credenciais Phase 2)
- Cria `campaigns`, `ad_groups`, `ads` objetos
- Insere em `ad_sets` com `platform='google_ads'`, `status='live'`
- Registra métricas de início (impressions, clicks, spend)

---

### FR-5.8: Meta Ads Agent

**Responsabilidade:** Cria campanhas no Facebook, Instagram com lookalike audiences e retargeting.

**Requisitos:**
- `processPendingRequests()` a cada 2 horas
- Consulta `content_pieces` aprovado e `marketing_leads` para construir Custom Audiences
- Usa Meta Marketing API v19 com `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`
- Cria Pixel events para conversion tracking (reusa `META_PIXEL_ID`)
- Insere em `ad_sets` com `platform='meta'`, `status='live'`
- Monitora CPC e ROAS inicial

---

### FR-5.9: SEO Agent

**Responsabilidade:** Pesquisa keywords, otimiza landing pages, rastreia rankings.

**Requisitos:**
- `processKeywordResearch()` a cada 12 horas
- Usa SEMrush API para volume, difficulty, intent
- Consulta `landing_pages` ativas
- Atualiza `seo_keywords` com rank atual, trend
- Usa GPT-4o para sugerir otimizações (H1, meta tags, internal links)
- Registra recomendações em `seo_keywords.recommendations`

---

### FR-5.10: Analytics Agent

**Responsabilidade:** Agrega métricas de Google Ads e Meta, calcula ROAS, gera insights com GPT-4o.

**Requisitos:**
- `runAnalyticsCycle()` a cada 6 horas
- Puxa `metrics` de Google Ads API (impressions, clicks, conversions)
- Puxa `insights` de Meta API (reach, engagement, purchase value)
- Calcula KPIs: ROAS, CPA, CTR, conversion rate
- Usa GPT-4o para interpretar (e.g., "CTR caiu 15% — sugerir A/B test de criativos")
- Insere em `analytics_reports` com `report_date=TODAY`
- Envia resumo ao CMO via Telegram

---

### FR-5.11: Developer Agent

**Responsabilidade:** Gera landing pages HTML/CSS em resposta a briefings. Suporta A/B testing.

**Requisitos:**
- Acionado sob demanda por Strategist
- Usa GPT-4o com template de landing page (header, hero, CTA, footer)
- Gera HTML limpo com Tailwind CSS inline
- Integrações: Cloudinary para images, Zapier/webhook para form submissions
- Armazena HTML em `landing_pages.html_content`
- Suporta múltiplas variações (A/B) via `landing_pages.variant_id`

---

## PARTE 3: CÓDIGO

### 3.1 package.json

```json
{
  "name": "marketing-squad",
  "version": "1.0.0",
  "description": "FASE 5 — Marketing Squad: 11 agentes autônomos de IA",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "openai": "^4.28.0",
    "google-ads-api": "^3.3.0",
    "node-cron": "^3.0.3",
    "axios": "^1.6.7",
    "winston": "^3.11.0",
    "dotenv": "^16.4.2",
    "cloudinary": "^2.0.1",
    "joi": "^17.12.1",
    "telegram": "^2.17.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "eslint": "^8.56.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### 3.2 src/config.js

```javascript
require('dotenv').config();

module.exports = {
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    imageModel: 'dall-e-3',
  },

  // Meta Ads
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN,
    adAccountId: process.env.META_AD_ACCOUNT_ID,
    pixelId: process.env.META_PIXEL_ID,
    apiVersion: 'v19.0',
  },

  // Google Ads (reuse Phase 2)
  googleAds: {
    developerId: process.env.GOOGLE_DEVELOPER_ID,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    loginCustomerId: process.env.GOOGLE_LOGIN_CUSTOMER_ID,
  },

  // Runway ML
  runway: {
    apiKey: process.env.RUNWAY_API_KEY,
    apiBase: 'https://api.runwayml.com/v1',
  },

  // SEMrush
  semrush: {
    apiKey: process.env.SEMRUSH_API_KEY,
    apiBase: 'https://api.semrush.com',
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    operatorId: process.env.TELEGRAM_OPERATOR_ID,
  },

  // Cron schedules
  schedules: {
    cmo: '0 */6 * * *',              // a cada 6 horas
    strategist: '0 7 * * *',          // 7am diários
    copywriter: '0 */4 * * *',        // a cada 4 horas
    imageCreator: '0 */4 * * *',      // a cada 4 horas
    videoCreator: '0 9 * * 1',        // segunda-feira 9am
    googleAds: '0 */2 * * *',         // a cada 2 horas
    metaAds: '0 */2 * * *',           // a cada 2 horas
    analytics: '0 */6 * * *',         // a cada 6 horas
    seo: '0 */12 * * *',              // a cada 12 horas
    supervisor: '0 * * * *',          // a cada 1 hora
  },

  // Brand guidelines
  brand: {
    name: 'Roberts Landscape',
    voice: 'profissional, amigável, confiável',
    colors: ['#2D5016', '#FFA500', '#FFFFFF'],
    fonts: 'Arial, sans-serif',
  },
};
```

### 3.3 src/integrations/openai.js

```javascript
const { OpenAI } = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async generateText(prompt, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
      });
      return response.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI generateText error', { error: error.message });
      throw error;
    }
  }

  async generateImage(prompt, options = {}) {
    try {
      const response = await this.client.images.generate({
        model: config.openai.imageModel,
        prompt,
        n: options.count || 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
      });
      return response.data.map(img => img.url);
    } catch (error) {
      logger.error('OpenAI generateImage error', { error: error.message });
      throw error;
    }
  }

  async parseJSON(prompt) {
    const response = await this.generateText(
      `${prompt}\n\nResponda com JSON válido apenas.`,
      { temperature: 0.2 }
    );
    try {
      return JSON.parse(response);
    } catch (e) {
      logger.error('Failed to parse JSON response', { response });
      throw e;
    }
  }
}

module.exports = new OpenAIClient();
```

### 3.4 src/integrations/supabase.js

```javascript
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../utils/logger');

class SupabaseClient {
  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.key);
  }

  async upsert(table, data, onConflict = 'id') {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .upsert(data, { onConflict });
      if (error) throw error;
      return result;
    } catch (error) {
      logger.error(`Supabase upsert error on ${table}`, { error: error.message });
      throw error;
    }
  }

  async insert(table, data) {
    try {
      const { data: result, error } = await this.client.from(table).insert(data);
      if (error) throw error;
      return result;
    } catch (error) {
      logger.error(`Supabase insert error on ${table}`, { error: error.message });
      throw error;
    }
  }

  async query(table, filters = {}) {
    try {
      let query = this.client.from(table).select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(`Supabase query error on ${table}`, { error: error.message });
      throw error;
    }
  }

  async update(table, id, data) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .update(data)
        .eq('id', id);
      if (error) throw error;
      return result;
    } catch (error) {
      logger.error(`Supabase update error on ${table}`, { error: error.message });
      throw error;
    }
  }
}

module.exports = new SupabaseClient();
```

### 3.5 src/integrations/meta-ads.js

```javascript
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class MetaAdsClient {
  constructor() {
    this.baseURL = `https://graph.instagram.com/${config.meta.apiVersion}`;
    this.token = config.meta.accessToken;
    this.adAccountId = config.meta.adAccountId;
  }

  async createCampaign(name, budget, objective = 'OUTCOME_SALES') {
    try {
      const response = await axios.post(
        `${this.baseURL}/act_${this.adAccountId}/campaigns`,
        {
          name,
          objective,
          budget_remaining: budget,
          status: 'PAUSED',
        },
        { params: { access_token: this.token } }
      );
      logger.info('Meta campaign created', { campaignId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('Meta createCampaign error', { error: error.message });
      throw error;
    }
  }

  async createAdSet(campaignId, targetingAudience, dailyBudget) {
    try {
      const response = await axios.post(
        `${this.baseURL}/act_${this.adAccountId}/adsets`,
        {
          campaign_id: campaignId,
          name: `AdSet-${Date.now()}`,
          daily_budget: dailyBudget * 100, // cents
          targeting: targetingAudience,
          status: 'PAUSED',
        },
        { params: { access_token: this.token } }
      );
      return response.data;
    } catch (error) {
      logger.error('Meta createAdSet error', { error: error.message });
      throw error;
    }
  }

  async createAd(adSetId, copyText, imageUrl) {
    try {
      const response = await axios.post(
        `${this.baseURL}/act_${this.adAccountId}/ads`,
        {
          adset_id: adSetId,
          creative: {
            title: copyText.slice(0, 40),
            body: copyText,
            image_url: imageUrl,
          },
          status: 'PAUSED',
        },
        { params: { access_token: this.token } }
      );
      return response.data;
    } catch (error) {
      logger.error('Meta createAd error', { error: error.message });
      throw error;
    }
  }

  async getMetrics(campaignId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${campaignId}/insights`,
        {
          params: {
            fields: 'spend,impressions,clicks,actions',
            access_token: this.token,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      logger.error('Meta getMetrics error', { error: error.message });
      throw error;
    }
  }
}

module.exports = new MetaAdsClient();
```

### 3.6 src/utils/logger.js

```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

module.exports = logger;
```

### 3.7 src/agents/strategist-agent.js

```javascript
const cron = require('node-cron');
const openai = require('../integrations/openai');
const supabase = require('../integrations/supabase');
const logger = require('../utils/logger');

class StrategistAgent {
  constructor() {
    this.running = false;
    this.schedule = '0 7 * * *';
  }

  async start() {
    logger.info('Strategist Agent started');
    this.task = cron.schedule(this.schedule, () => this.runCycle());
  }

  async runCycle() {
    if (this.running) return;
    this.running = true;

    try {
      const leads = await supabase.query('marketing_leads', {
        campaign_assigned: false,
      });

      if (leads.length === 0) {
        logger.info('No unassigned leads for strategy');
        this.running = false;
        return;
      }

      const briefPrompt = `Você é um estrategista de marketing especializado.
      
      Leads a segmentar: ${JSON.stringify(leads.slice(0, 5))}
      
      Gere uma estratégia de campanha com:
      - Público-alvo detalhado
      - Mensagem principal
      - Orçamento recomendado
      - KPIs esperados
      
      Responda em JSON: { targetAudience, message, budget, expectedKpis }`;

      const strategy = await openai.parseJSON(briefPrompt);

      const campaign = {
        id: `camp_${Date.now()}`,
        name: `Campaign-${new Date().toISOString().split('T')[0]}`,
        target_audience: strategy.targetAudience,
        message: strategy.message,
        budget: strategy.budget,
        expected_kpis: strategy.expectedKpis,
        status: 'ready_for_content',
        created_at: new Date().toISOString(),
      };

      await supabase.insert('campaigns', [campaign]);
      logger.info('Campaign created', { campaignId: campaign.id });
    } catch (error) {
      logger.error('Strategist Agent error', { error: error.message });
    } finally {
      this.running = false;
    }
  }

  stop() {
    if (this.task) this.task.stop();
    logger.info('Strategist Agent stopped');
  }
}

module.exports = new StrategistAgent();
```

### 3.8 src/agents/supervisor-agent.js

```javascript
const cron = require('node-cron');
const openai = require('../integrations/openai');
const supabase = require('../integrations/supabase');
const logger = require('../utils/logger');

class SupervisorAgent {
  constructor() {
    this.running = false;
    this.schedule = '0 * * * *';
  }

  async start() {
    logger.info('Supervisor Agent started');
    this.task = cron.schedule(this.schedule, () => this.reviewPendingContent());
  }

  async reviewPendingContent() {
    if (this.running) return;
    this.running = true;

    try {
      const pending = await supabase.query('content_pieces', {
        status: 'pending_review',
      });

      for (const piece of pending) {
        const review = await this.reviewPiece(piece);
        await supabase.insert('approvals', [
          {
            content_id: piece.id,
            score: review.score,
            violations: review.violations,
            feedback: review.feedback,
            created_at: new Date().toISOString(),
          },
        ]);

        const newStatus = review.score >= 8 ? 'approved' : 'rejected';
        await supabase.update('content_pieces', piece.id, { status: newStatus });

        if (newStatus === 'rejected') {
          logger.warn('Content rejected', {
            contentId: piece.id,
            violations: review.violations,
          });
        }
      }
    } catch (error) {
      logger.error('Supervisor Agent error', { error: error.message });
    } finally {
      this.running = false;
    }
  }

  async reviewPiece(piece) {
    const prompt = `Você é um supervisor de brand compliance.
    
    Conteúdo a revisar: ${JSON.stringify(piece)}
    
    Brand guidelines: ${JSON.stringify(global.brandGuidelines)}
    
    Avalie em JSON: { score: 1-10, violations: [...], feedback: "..." }`;

    return openai.parseJSON(prompt);
  }

  stop() {
    if (this.task) this.task.stop();
    logger.info('Supervisor Agent stopped');
  }
}

module.exports = new SupervisorAgent();
```

### 3.9 index.js (Entry point)

```javascript
require('dotenv').config();
const logger = require('./src/utils/logger');
const config = require('./src/config');

// Import agents
const cmoAgent = require('./src/agents/cmo-agent');
const strategistAgent = require('./src/agents/strategist-agent');
const copywriterAgent = require('./src/agents/copywriter-agent');
const imageCreatorAgent = require('./src/agents/image-creator-agent');
const videoCreatorAgent = require('./src/agents/video-creator-agent');
const googleAdsAgent = require('./src/agents/google-ads-agent');
const metaAdsAgent = require('./src/agents/meta-ads-agent');
const analyticsAgent = require('./src/agents/analytics-agent');
const seoAgent = require('./src/agents/seo-agent');
const supervisorAgent = require('./src/agents/supervisor-agent');
const developerAgent = require('./src/agents/developer-agent');

async function bootstrap() {
  try {
    logger.info('Marketing Squad starting...');

    // Start all agents in parallel
    await Promise.all([
      cmoAgent.start(),
      strategistAgent.start(),
      copywriterAgent.start(),
      imageCreatorAgent.start(),
      videoCreatorAgent.start(),
      googleAdsAgent.start(),
      metaAdsAgent.start(),
      analyticsAgent.start(),
      seoAgent.start(),
      supervisorAgent.start(),
      developerAgent.start(),
    ]);

    logger.info('Marketing Squad online. All 11 agents active.');
  } catch (error) {
    logger.error('Failed to start Marketing Squad', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

bootstrap();
```

---

## PARTE 4: DEBUGGER

### Erro 1: "OpenAI API rate limit exceeded"

**Sintoma:** Agente para de responder após 100 requisições/min.

**Causa:** Limite de rate limite da API.

**Solução:**
```javascript
// Implementar retry com exponential backoff
async function callOpenAIWithRetry(prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await openai.generateText(prompt);
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
      } else throw error;
    }
  }
}
```

### Erro 2: "Supabase connection timeout"

**Sintoma:** Logs mostram "ECONNREFUSED" ou "timeout of 10000ms exceeded".

**Causa:** Conexão Supabase perdida ou credenciais inválidas.

**Solução:**
```javascript
// Verificar SUPABASE_URL e SUPABASE_KEY no .env
// Testar: curl -H "Authorization: Bearer KEY" https://URL/rest/v1/campaigns?select=*
// Reconectar: recriar cliente Supabase
const { createClient } = require('@supabase/supabase-js');
this.client = createClient(config.supabase.url, config.supabase.key);
```

### Erro 3: "Meta API invalid access token"

**Sintoma:** Status 400 com "Invalid OAuth access token".

**Causa:** Token expirado ou inválido.

**Solução:**
```bash
# Gerar novo token em https://developers.facebook.com/tools/explorer/
# Copiar para .env: META_ACCESS_TOKEN=novo_token
# Verificar escopo: ads_management, pages_manage_ads
```

### Erro 4: "DALL-E 3 image generation timeout"

**Sintoma:** Requisição fica pendente > 60 segundos.

**Causa:** Fila congestionada ou prompt muito complexo.

**Solução:**
```javascript
// Simplificar prompt, remover detalhes desnecessários
// Implementar timeout: { timeout: 30000 }
const response = await this.client.images.generate({
  prompt: simplifiedPrompt,
  timeout: 30000,
});
```

---

## PARTE 5: CHECKLIST DE IMPLEMENTAÇÃO

### Fase 0: Setup Inicial (Dia 0)

- [ ] Clonar repositório e criar branch `fase-5-marketing-squad`
- [ ] Instalar Node.js 20+ e pnpm
- [ ] Criar arquivo `.env` com todas as variáveis de Parte 2
- [ ] Testar conexão Supabase: `curl -H "Authorization: Bearer KEY" https://URL/rest/v1/campaigns`
- [ ] Testar API OpenAI: `curl -H "Authorization: Bearer sk-..." https://api.openai.com/v1/models`

**Tempo estimado:** 30 minutos

### Wave 1: Integrations & Config (Dias 1–3)

- [ ] Criar `src/config.js` com todas as variáveis de ambiente
- [ ] Criar `src/integrations/openai.js` com generateText, generateImage, parseJSON
- [ ] Criar `src/integrations/supabase.js` com query, insert, upsert, update
- [ ] Criar `src/integrations/meta-ads.js` com createCampaign, createAdSet, createAd, getMetrics
- [ ] Criar `src/integrations/runway.js` com requestVideoGeneration e pollStatus
- [ ] Criar `src/integrations/semrush.js` com getKeywordData
- [ ] Criar `src/utils/logger.js` com winston
- [ ] Criar `src/utils/brand-guidelines.js` com colors, fonts, voice
- [ ] Criar `package.json` com todas as dependências listadas
- [ ] Executar `npm install`
- [ ] Testar imports: `node -e "require('./src/integrations/openai')"`

**Tempo estimado:** 4 horas

### Wave 2: Database Migrations (Dia 3)

- [ ] Abrir Supabase SQL Editor
- [ ] Executar migrations para 9 tabelas (campaigns, content_pieces, ad_sets, analytics_reports, approvals, seo_keywords, landing_pages, marketing_leads, brand_assets)
- [ ] Verificar: `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` retorna 9 tabelas
- [ ] Criar índices em colunas frequentemente consultadas: `status`, `campaign_id`, `created_at`

**Tempo estimado:** 1 hora

### Wave 3: Core Agents — Supervisor, Strategist, Analytics (Dias 3–5)

- [ ] Criar `src/agents/supervisor-agent.js` com reviewPendingContent
- [ ] Criar `src/agents/strategist-agent.js` com runCycle
- [ ] Criar `src/agents/analytics-agent.js` com runAnalyticsCycle
- [ ] Testar cada agente isoladamente: `node -e "const agent = require('./src/agents/supervisor-agent'); agent.start()"`
- [ ] Verificar logs em `logs/combined.log`

**Tempo estimado:** 6 horas

### Wave 4: Content Generation — Copywriter, Image Creator (Dias 5–8)

- [ ] Criar `src/agents/copywriter-agent.js` com processPendingRequests
- [ ] Criar `src/agents/image-creator-agent.js` com generateForCampaign
- [ ] Testar geração de copy: criar entrada em `campaigns` com status='ready_for_content', rodar Copywriter
- [ ] Verificar `content_pieces` table: `SELECT * FROM content_pieces WHERE type='copy' ORDER BY created_at DESC LIMIT 5`
- [ ] Testar geração de imagens: verificar URLs em Cloudinary

**Tempo estimado:** 8 horas

### Wave 5: Ad Distribution — Google Ads, Meta Ads (Dias 8–12)

- [ ] Criar `src/agents/google-ads-agent.js` com createCampaign, createAdGroup
- [ ] Criar `src/agents/meta-ads-agent.js` com createCampaign, createAdSet, createAd
- [ ] Testar Google Ads: verificar campanhas em Google Ads interface (MCC)
- [ ] Testar Meta Ads: verificar campanhas em Ads Manager (Meta)
- [ ] Verificar `ad_sets` table: `SELECT * FROM ad_sets LIMIT 10`

**Tempo estimado:** 8 horas

### Wave 6: Enhancement Agents — SEO, Developer, Video Creator (Dias 12–16)

- [ ] Criar `src/agents/seo-agent.js` com processKeywordResearch
- [ ] Criar `src/agents/developer-agent.js` com generateLandingPage
- [ ] Criar `src/agents/video-creator-agent.js` com generateVideo
- [ ] Testar SEO: verificar keywords em `seo_keywords` table
- [ ] Testar Landing Page: verificar HTML em `landing_pages.html_content`
- [ ] Testar vídeo: verificar URL em `content_pieces` após Monday 9am

**Tempo estimado:** 10 horas

### Wave 7: Orchestration — CMO Agent e Entry Point (Dias 16–18)

- [ ] Criar `src/agents/cmo-agent.js` com start(), runOrchestrationCycle(), syncLeadsFromSDR(), sendDailyReport()
- [ ] Criar `index.js` com bootstrap e Promise.all para iniciar todos os 11 agentes
- [ ] Testar seleção de agentes: `node index.js` deve exibir "All 11 agents active"
- [ ] Verificar cronograma: cada agente deve rodar em seu horário definido

**Tempo estimado:** 6 horas

### Deployment (Dia 18+)

- [ ] Criar `marketing-squad.service` (arquivo systemd)
- [ ] Copiar código para VPS: `scp -r . user@hermes:/home/user/marketing-squad`
- [ ] Criar `.env` no VPS com credenciais reais
- [ ] Criar diretório `logs`: `mkdir -p /home/user/marketing-squad/logs`
- [ ] Carregar serviço: `sudo cp marketing-squad.service /etc/systemd/system/`
- [ ] Ativar: `sudo systemctl daemon-reload && sudo systemctl enable marketing-squad`
- [ ] Iniciar: `sudo systemctl start marketing-squad`
- [ ] Verificar: `sudo systemctl status marketing-squad` (deve estar verde "active (running)")

**Tempo estimado:** 2 horas

### End-to-End Testing (Dia 19+)

- [ ] Aguardar primeiro ciclo Strategist (7am): `SELECT COUNT(*) FROM campaigns` > 0
- [ ] Aguardar ciclo Copywriter (próximas 4h): `SELECT COUNT(*) FROM content_pieces WHERE type='copy'` > 0
- [ ] Verificar aprovações: `SELECT COUNT(*) FROM approvals WHERE score >= 8`
- [ ] Verificar anúncios ao vivo: `SELECT COUNT(*) FROM ad_sets WHERE status='live'`
- [ ] Verificar métricas: `SELECT COUNT(*) FROM analytics_reports` > 0
- [ ] Verificar logs: `journalctl -u marketing-squad -n 50` sem ERRORs

**Tempo estimado:** 4 horas

**Total:** 18–20 dias de trabalho efetivo

---

## Arquivo systemd: marketing-squad.service

```ini
[Unit]
Description=Marketing Squad — FASE 5 Agents
After=network.target

[Service]
Type=simple
User=user
WorkingDirectory=/home/user/marketing-squad
EnvironmentFile=/home/user/marketing-squad/.env
ExecStart=/usr/bin/node /home/user/marketing-squad/index.js
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

---

**Próximas Etapas:**
1. Executar Wave 1–2 completamente (integrations + database)
2. Executar Wave 3 (core agents)
3. Testar cada wave antes de prosseguir para a próxima
4. Fazer deploy em staging (VPS de teste) antes de produção
5. Executar full E2E test com dados reais

