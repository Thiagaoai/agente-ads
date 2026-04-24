# Agente-Ads

Autonomous marketing ops system — **CMO Agent + 11 specialized AI agents** running Google Ads and Meta Ads campaigns end-to-end, controlled via Telegram.

Built for Roberts Agency, reusable per client with 1 Supabase project + 1 Docker container per deployment.

## What it does

Handle the full ad lifecycle without human authoring: strategy → copy → creative → brand compliance → launch → optimization → reporting.

- **Copywriter** (GPT-4o) — generates 5 ad variants every 4h
- **Image Creator** (DALL-E 3) — feed/stories assets
- **Video Creator** (Runway ML gen3) — 15s video ads weekly
- **Supervisor** — brand compliance scoring (1-10, threshold 7)
- **Google Ads Agent** — campaign + ad group + keyword CRUD via API
- **Meta Ads Agent** — campaigns via Marketing API v19
- **SEO Agent** (SEMrush) — keyword tracking + competitor analysis
- **Analytics Agent** — performance rollup every 6h
- **Strategist / Developer / CMO** — orchestration + landing page gen

All 11 agents scheduled via `node-cron`, state in Supabase, operator control via Telegram.

## Quick start

```bash
# Clone
git clone https://github.com/Thiagaoai/agente-ads.git /opt/agente-ads
cd /opt/agente-ads/FASE-5/CÓDIGO_FASE_5

# Configure
cp .env.example .env
$EDITOR .env   # fill all keys (see .env.example comments for links)

# Install + run
npm install --omit=dev
node index.js
```

Validate: `curl http://localhost:3200/health` and `/start` on your Telegram bot.

## Deploy to new client

See **[guide.md](guide.md)** — 8-section walkthrough covering prerequisites, VPS setup, Supabase schema, launching first Google + Meta campaign, daily operations, troubleshooting, reference costs.

## Architecture

```
Telegram operator
      │
      ▼
   CMO (port 3200) ───┬──> Strategist (7am)
   health / agents    ├──> Copywriter (every 4h)
      │               ├──> Image Creator (every 4h)
      │               ├──> Video Creator (Mon 9am)
      │               ├──> Supervisor (every 1h)
      │               ├──> Google Ads Agent (every 2h)
      │               ├──> Meta Ads Agent (every 2h)
      │               ├──> SEO Agent (every 12h)
      │               └──> Analytics Agent (every 6h)
      ▼
   Supabase (campaigns, campaign_assets, brand_guidelines, metrics, agent_runs)
      │
      ▼
   Google Ads API · Meta Marketing API · DALL-E · Runway · SEMrush · Cloudinary
```

## Repo layout

```
.
├── guide.md                          # per-client deploy walkthrough
├── FASE-5/CÓDIGO_FASE_5/             # runnable Phase 5 code
│   ├── index.js                      # CMO bootstrap (port 3200 + scheduler)
│   ├── Dockerfile
│   ├── marketing-squad.service       # systemd unit
│   ├── .env.example
│   └── src/
│       ├── agents/                   # 11 agents (3 real, 8 stubs)
│       ├── integrations/             # openai, meta, google, runway, semrush, supabase, cloudinary
│       ├── telegram/                 # bot + command handlers
│       ├── utils/                    # logger, brand-guidelines
│       └── tests/                    # node:test smoke suite
├── supabase/migrations/              # versioned schema
├── scripts/                          # VPS bootstrap (Phase 1)
├── fase01.md / fase02.md / fase05.md # phase design docs
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

## Requirements

- Node.js ≥ 20
- Supabase project (free tier works; Pro for prod)
- Ubuntu 22.04 VPS or Docker host
- API keys: OpenAI, Meta, Google Ads, Runway, SEMrush, Cloudinary, Telegram (see `.env.example`)

## Phases

All phases have runnable code under `FASE-5/CÓDIGO_FASE_5/src/`:

- **Phase 2 · SDR** — `agents/sdr-agent.js` + `integrations/apollo.js`. Run: `npm run sdr:run`. Writes to `leads` table.
- **Phase 3 · Outreach + Calendar** — `agents/outreach-agent.js` + `integrations/sendgrid.js` + `integrations/google-calendar.js`. Run: `npm run outreach:run`. Enrolls leads via `email_sequences`.
- **Phase 4 · Monitoring** — `/metrics` endpoint (Prometheus format) + LangSmith tracer at `integrations/langsmith.js`. Scrape from Prometheus or hit `curl localhost:3200/metrics`.
- **Phase 5 · Marketing Squad** — 11 agents, scheduler, Telegram bot. The default `node index.js` runs Phase 5 only; Phase 2/3 run on-demand via `npm run`.

## Webhooks

Endpoints exposed by `index.js`:

- `GET /webhooks/meta?hub.mode=subscribe&...` — Meta verification handshake
- `POST /webhooks/meta` — Meta signed callbacks (ad review, insights alerts)
- `POST /webhooks/google` — Google Ads alerts (requires `X-Google-Webhook-Token` header)

Register both at the provider dashboards using your public URL.

## License

MIT · Roberts Automation / DockplusAI
