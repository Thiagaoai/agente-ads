# Guide — Implantação do Agente-Ads em Novas Empresas

Guia operacional passo a passo para subir o fluxo completo de automação de ads (Google + Meta) em uma nova empresa, reaproveitando o stack do Roberts Agency.

> **Pré-requisito:** Fases 1–4 (infraestrutura, SDR, email, monitoring) já implantadas, ou o cliente aceita rodar apenas a Fase 5 (Marketing Squad autônomo).

---

## 1. Checklist Pré-Implantação (por cliente)

Antes de tocar em código, colete do cliente:

### 1.1 Credenciais e contas

| Serviço | O que pedir | Onde obtém |
|---|---|---|
| Google Ads | Customer ID, Developer Token, OAuth (Client ID / Secret / Refresh Token) | ads.google.com → API Center |
| Meta Ads | Access Token (long-lived), Ad Account ID, Pixel ID | business.facebook.com → System Users |
| OpenAI | API Key com acesso GPT-4o e DALL-E 3 | platform.openai.com |
| Runway ML | API Key (plano Enterprise p/ gen3) | runwayml.com |
| SEMrush | API Key (plano Business+) | semrush.com |
| Cloudinary | Cloud Name, API Key, Secret | cloudinary.com |
| Supabase | URL do projeto, Anon Key, Service Role Key | supabase.com (projeto dedicado por cliente) |
| Telegram | Bot Token (@BotFather), Operator User ID, Channel ID | telegram |

### 1.2 Ativos de marca (obrigatório)

- Logo em alta resolução (PNG transparente)
- Paleta de cores (hex)
- Guia de voz/tom (1 página)
- URL do site/landing page
- Lista de 20 keywords-semente (Google Ads) + audiências iniciais (Meta)
- Orçamento diário aprovado (Google e Meta, separados)

### 1.3 Infra

- VPS Ubuntu 22.04 (mín. 4GB RAM / 2 vCPU) **ou** host Docker — o servidor será renomeado por cliente (ex: `hermes-[cliente]`)
- Domínio do cliente apontado (para landing pages geradas pelo Developer Agent)

---

## 2. Deploy — Passo a Passo

### 2.1 Provisionar infraestrutura (VPS)

```bash
ssh root@[ip-do-cliente]

# Clonar repo
git clone https://github.com/Thiagaoai/agente-ads.git /opt/agente-ads
cd /opt/agente-ads

# Rodar scripts de infra (sequencial — NÃO paralelizar)
bash scripts/setup-vps.sh
bash scripts/setup-paperclip.sh
bash scripts/setup-env.sh
bash scripts/final-verification.sh
```

### 2.2 Configurar Supabase do cliente

No projeto Supabase dedicado do cliente, rode as migrações das Fases 1–4 (tabelas `leads`, `metrics`, `tasks`) e adicione o schema da Fase 5:

```sql
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  platform text check (platform in ('google_ads','meta_ads')),
  objective text,
  status text default 'draft',
  daily_budget_cents int,
  created_at timestamptz default now()
);

create table campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id),
  type text check (type in ('copy','image','video')),
  asset_url text,
  supervisor_score int,
  approved boolean default false
);
```

### 2.3 Preencher `.env` da Fase 5

```bash
cd /opt/agente-ads/FASE-5/CÓDIGO_FASE_5
cp .env.example .env
nano .env
```

Campos obrigatórios (referência: `src/config.js`):

```
NODE_ENV=production
CMO_PORT=3200

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=

META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=act_xxxxxxxxxx
META_PIXEL_ID=

GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=

RUNWAY_API_KEY=
SEMRUSH_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

TELEGRAM_BOT_TOKEN=
TELEGRAM_OPERATOR_ID=
TELEGRAM_CHANNEL_ID=
```

### 2.4 Subir o Marketing Squad (Docker)

```bash
cd FASE-5/CÓDIGO_FASE_5
docker build -t marketing-squad:[cliente] .
docker run -d \
  --name marketing-squad-[cliente] \
  --env-file .env \
  -p 3200:3200 \
  --restart unless-stopped \
  marketing-squad:[cliente]

docker logs -f marketing-squad-[cliente]
```

Validação — o CMO Agent deve logar:
```
[CMO] Port 3200 up · 11 agents registered · scheduler armed
```

### 2.5 Validar via Telegram

No bot do cliente, envie:
```
/status
```
Esperado: lista dos 11 agentes com `✅ idle` ou `⏳ running`.

---

## 3. Subir a Primeira Campanha Google Ads

O fluxo é orquestrado pelo **Strategist → Copywriter → Image Creator → Supervisor → Google Ads Agent**. Você dispara via Telegram, os agentes fazem o resto.

### Passo a passo

1. **Telegram → CMO:**
   ```
   /campaign new
   platform: google_ads
   objective: lead_gen
   audience: [descrição curta em 1 linha]
   budget_daily: 200
   landing_url: https://site.com/oferta
   keywords: keyword1, keyword2, keyword3
   ```

2. **Strategist Agent** (automático, 7am ou sob demanda) gera briefing e grava em `campaigns`.

3. **Copywriter Agent** (a cada 4h ou imediato) gera 5 variantes (headline + description + display URL) via GPT-4o. Grava em `campaign_assets` com `type=copy`.

4. **Image Creator Agent** gera 3 imagens 1024x1024 via DALL-E 3, faz upload no Cloudinary.

5. **Supervisor Agent** avalia cada asset contra `src/utils/brand-guidelines.js`. Score < 7 → rejeita e pede nova geração. Score ≥ 7 → marca `approved=true`.

6. **Google Ads Agent** (a cada 2h) pega assets aprovados e cria:
   - Campaign (status `PAUSED`, `MAXIMIZE_CONVERSIONS`)
   - Ad Group com as keywords
   - Responsive Search Ads com as variantes aprovadas

7. **Telegram recebe:**
   ```
   📢 Campanha [nome] criada · status PAUSED
   Aprovar? /approve [campaign_id]
   ```

8. Você responde `/approve [id]` → agente muda status para `ENABLED`. Campanha **no ar**.

### Primeiras 24h — monitoramento

- Analytics Agent (a cada 6h) puxa impressions/CTR/CPA e manda resumo no Telegram.
- Supervisor Agent (a cada 1h) checa se CPA está dentro do esperado; se estourar, pausa e alerta.

---

## 4. Subir a Primeira Campanha Meta Ads

Fluxo idêntico ao Google, com o **Meta Ads Agent** no lugar do Google Ads Agent.

### Passo a passo

1. **Telegram → CMO:**
   ```
   /campaign new
   platform: meta_ads
   objective: CONVERSIONS
   audience: custom_audience_id:[id] OR lookalike:[seed_audience_id]
   budget_daily: 200
   landing_url: https://site.com/oferta
   creative_type: carousel  # ou single_image / video
   ```

2. **Strategist** gera briefing com target audience + placements (feed, stories, reels).

3. **Copywriter** gera 5 variantes (primary text + headline + description) — formato Meta, mais curto que Google.

4. **Image Creator** gera 3 imagens (feed: 1080x1080, stories: 1080x1920).

5. **Video Creator Agent** (Segundas 9am ou sob demanda) gera vídeo 15s 24fps via Runway ML (`gen3`).

6. **Supervisor** valida contra brand guidelines **e** políticas Meta (no texto imagem <20%, claims proibidos etc).

7. **Meta Ads Agent** (a cada 2h) cria via Marketing API v19:
   - Campaign (`objective: CONVERSIONS`, status `PAUSED`, `LOWEST_COST`)
   - Ad Set com audiência + pixel event + budget
   - Ads com assets aprovados

8. **Telegram:**
   ```
   📢 Campanha Meta [nome] · 3 ads · status PAUSED
   /approve [campaign_id]
   ```

9. Aprovou → vai pra `ACTIVE`. No ar.

### Observações Meta

- O Pixel ID no `.env` precisa estar instalado no site do cliente **antes** de subir qualquer campanha de conversão.
- Custom Audiences devem ser criadas manualmente no Business Manager antes; o agente só consome por ID.
- Primeiras 48h a campanha entra em fase de aprendizado do Meta — não otimize/pause nesse período.

---

## 5. Operação Diária (o que o cliente vê)

| Horário | Evento automático |
|---|---|
| 07:00 | Strategist gera plano do dia |
| 07:30 | Telegram: resumo "O que vamos rodar hoje" |
| A cada 4h | Copy + Imagens geradas e aprovadas |
| A cada 2h | Ads criados/atualizados em Google + Meta |
| A cada 6h | Analytics envia métricas (CTR, CPA, ROAS) |
| A cada 1h | Supervisor audita gastos vs budget |
| Segunda 09:00 | Video Creator gera vídeos da semana |
| 20:00 | Telegram: relatório diário consolidado |

### Comandos operador (Telegram)

```
/status                      # estado dos 11 agentes
/campaigns                   # lista ativas
/campaign [id]               # detalhes + métricas
/pause [campaign_id]         # pausa no Google OU Meta
/approve [campaign_id]       # libera assets aprovados
/reject [asset_id] [reason]  # força Supervisor a refazer
/budget [campaign_id] [$]    # ajusta orçamento diário
/report daily                # força relatório agora
```

---

## 6. Replicar Para Novo Cliente — Resumo Express

1. Clonar repo em VPS nova (`/opt/agente-ads`)
2. Criar projeto Supabase dedicado → rodar SQL do item 2.2
3. Gerar credenciais (OpenAI, Meta, Google, Runway, SEMrush, Cloudinary, Telegram) **do cliente** — **nunca reutilizar do Roberts Agency**
4. Preencher `.env` (item 2.3)
5. `docker build` + `docker run` com tag `[cliente]` (item 2.4)
6. Subir brand guidelines em `src/utils/brand-guidelines.js` (editar por cliente)
7. Teste smoke: `/status` no Telegram → 11 agentes idle
8. Disparar 1 campanha de teste com budget baixo (R$50/dia) em cada plataforma
9. Observar 48h → só então escalar budget

**Tempo estimado:** 4–6h de setup + 48h de validação = cliente no ar em ~3 dias úteis.

---

## 7. Troubleshooting rápido

| Sintoma | Causa provável | Fix |
|---|---|---|
| CMO não sobe, log "ECONNREFUSED 3100" | Paperclip caiu | `bash scripts/fix-paperclip-service.sh` |
| Supervisor rejeita tudo | brand-guidelines.js muito restritivo | Baixar `approvalThreshold` em `config.js` de 7 para 6 temporariamente |
| Meta retorna erro 190 | Access Token expirou | Gerar novo long-lived token no Business Manager |
| Google Ads "PERMISSION_DENIED" | Developer Token em modo teste | Solicitar aprovação Basic Access no Ads API Center |
| DALL-E retorna "content_policy_violation" | Prompt do Copywriter com termo flagged | Ajustar `brand-guidelines.js` para evitar categorias proibidas |
| Telegram silencioso | Bot não está no grupo/canal | Readicionar bot + enviar `/start` |

---

## 8. Custos de Referência (mensal, por cliente)

- OpenAI (GPT-4o + DALL-E): ~US$ 200–400
- Runway ML: US$ 95 (plano Standard)
- SEMrush: US$ 250 (plano Business)
- Cloudinary: US$ 0–99 (free tier aguenta ~10GB)
- Supabase: US$ 0–25 (free tier / Pro)
- VPS: US$ 20–40
- **Total infra:** ~US$ 600–900/mês por cliente

Acima disso vai o **ad spend** (Google + Meta), que é repassado direto.
