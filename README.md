# Agente-Ads

**Autonomous Meta Ads + Google Ads automation.** 11 AI agents (CMO + 10 specialists), Telegram-controlled. Built for Roberts Agency, deployable per client.

> **Scope:** This product does one thing — plans, creates, launches, and optimizes paid ads on Meta and Google. It does **not** do cold outbound, SDR, email sequences, or meeting booking.

## What it does

Full paid-ads lifecycle without human authoring — strategy → copy → creative → brand-compliance review → launch → daily optimization → reporting.

- **Strategist** (GPT-4o) — daily 7am, drafts 1-3 campaigns based on recent performance
- **Copywriter** (GPT-4o) — generates 5 ad variants every 4h
- **Image Creator** (DALL-E 3) — square/vertical ad creatives every 4h
- **Video Creator** (Runway gen3) — 15s video ads weekly (Mondays 9am)
- **Supervisor** — brand compliance scoring (1-10, threshold 7) every hour
- **Meta Ads Agent** — Marketing API v19 campaign/ad-set/ad CRUD every 2h
- **Google Ads Agent** — campaigns + ad groups + keywords via API v17, auto-pause on waste
- **SEO Agent** (SEMrush) — keyword research + competitor tracking every 12h (informs ad keyword bids)
- **Analytics Agent** — pulls Meta + Google metrics every 6h, daily Telegram report
- **Developer Agent** — generates Tailwind HTML landing pages for ads on-demand
- **CMO Agent** — hourly orchestrator, unblocks stuck pipeline stages

## Quick start

```bash
git clone https://github.com/Thiagaoai/agente-ads.git /opt/agente-ads
cd /opt/agente-ads/FASE-5/CÓDIGO_FASE_5

cp .env.example .env
$EDITOR .env   # fill all keys (see .env.example comments for links)

npm install --omit=dev
node index.js
```

Validate: `curl http://localhost:3200/health` and `/start` on your Telegram bot.

## Deploy to new client

See **[guide.md](guide.md)** — per-client walkthrough covering prerequisites, VPS setup, Supabase schema, first Google + Meta campaign launch, daily ops, troubleshooting, costs.

## Architecture

```
Telegram operator
      │
      ▼
   CMO (port 3200) ───┬──> Strategist (7am)
   /health /metrics   ├──> Copywriter (every 4h)
   /webhooks/*        ├──> Image Creator (every 4h)
      │               ├──> Video Creator (Mon 9am)
      │               ├──> Supervisor (every 1h)
      │               ├──> Google Ads Agent (every 2h)
      │               ├──> Meta Ads Agent (every 2h)
      │               ├──> SEO Agent (every 12h)
      │               ├──> Analytics Agent (every 6h)
      │               └──> Developer Agent (on-demand)
      ▼
   Supabase (campaigns, campaign_assets, brand_guidelines, metrics,
             agent_runs, seo_rankings, seo_competitors, landing_pages,
             webhook_events)
      │
      ▼
   Meta Marketing API · Google Ads API · OpenAI (GPT-4o + DALL-E) ·
   Runway ML · SEMrush · Cloudinary
```

## Repo layout

```
.
├── guide.md                          # per-client deploy walkthrough
├── FASE-5/CÓDIGO_FASE_5/             # runnable code
│   ├── index.js                      # CMO bootstrap (port 3200 + scheduler + webhooks + /metrics)
│   ├── Dockerfile
│   ├── agente-ads.service            # systemd unit
│   ├── .env.example
│   └── src/
│       ├── agents/                   # 11 agents (cmo + 10 specialists)
│       ├── integrations/             # openai, meta-ads, google-ads, runway, semrush, cloudinary, supabase, langsmith
│       ├── telegram/                 # bot + command handlers
│       ├── webhooks/                 # meta + google callback handlers
│       ├── monitoring/               # prometheus metrics
│       ├── utils/                    # logger, brand-guidelines
│       └── tests/                    # node:test smoke suite
├── supabase/migrations/              # versioned schema (SQL)
├── scripts/                          # VPS bootstrap
└── roadmap.md
```

## Commands (Telegram)

| Command | Action |
|---|---|
| `/status` | State of all 11 agents |
| `/campaigns` | List recent campaigns |
| `/campaign <id>` | Campaign details + assets |
| `/approve <id>` | Release approved assets to ads |
| `/pause <id>` | Pause a campaign |
| `/budget <id> <amount>` | Adjust daily budget ($) |
| `/run <agent>` | Run any agent on-demand |

## Endpoints

| Path | Purpose |
|---|---|
| `GET /health` | Docker healthcheck · uptime + agent count |
| `GET /agents` | Status of each agent |
| `GET /metrics` | Prometheus scrape · counters + gauges |
| `GET /webhooks/meta` | Meta verify handshake |
| `POST /webhooks/meta` | Meta signed callbacks (HMAC-sha256) |
| `POST /webhooks/google` | Google Ads alerts (token header) |

## Requirements

- Node.js ≥ 20
- Supabase project (Pro recommended for prod)
- Ubuntu 22.04 VPS or Docker host
- API keys: OpenAI, Meta, Google Ads, Runway, SEMrush, Cloudinary, Telegram (see `.env.example`)

## License

MIT · Roberts Automation / DockplusAI
