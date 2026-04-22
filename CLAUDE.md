# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

This is a **planning and documentation repository** (written in Portuguese) for a 4-phase sales automation system. It contains no runnable code — only architectural guides, scripts, and instructions intended to be implemented on a VPS using Cursor IDE.

## Repository Contents

| File | Purpose |
|------|---------|
| `index.md` | Master reading guide and navigation |
| `00-indice.md` | Master index for all 4 phases |
| `roadmap.md` | Timeline and deliverables per phase |
| `como_usar_ide.md` | IDE and model selection guidance |
| `guia.final.md` | Final workflow summary |
| `fase01.md` | Phase 1: Infrastructure (SDD + PRD + bash scripts) |
| `fase02.md` | Phase 2: SDR Agent (SDD + PRD + Node.js code) |

## System Architecture (When Implemented)

The target system runs on a VPS (Ubuntu 22.04, "Hermes") as a 4-phase build:

**Phase 1 — Infrastructure**
- Paperclip AI server (port 3100) managed by systemd
- Supabase (PostgreSQL) for persistence: `leads`, `metrics`, `tasks` tables
- Telegram bot for operator control
- Stack: Node.js 20, pnpm, systemd

**Phase 2 — SDR Agent**
- Apollo.io API for lead search and enrichment
- Google Ads API for intent signal capture
- Writes qualified leads to Supabase

**Phase 3 — Email + Calendar**
- SendGrid for automated outbound email sequences
- Google Calendar API for meeting scheduling

**Phase 4 — Monitoring**
- LangSmith for LLM observability
- Prometheus + Grafana dashboards

**Data flow:** `Telegram command → Paperclip → Supabase query → Telegram response + journalctl log`

## Implementation Approach

Each phase follows the same structure in its `.md` file:
1. **SDD** — system design with architecture diagrams
2. **PRD** — feature requirements
3. **Scripts/Code** — ready-to-paste bash scripts (Phase 1) or Node.js files (Phase 2+)
4. **Debugger** — documented solutions for expected errors
5. **Checklist** — step-by-step execution order

When implementing, read the full phase document before writing any code. The scripts are designed to be run sequentially (`setup-vps.sh` → `setup-paperclip.sh` → `setup-supabase.sh` → `setup-telegram.sh` → `final-verification.sh`).

## Key External Services Required

- **Supabase** — free tier sufficient; need `CONNECTION_STRING`
- **Telegram** — bot token from @BotFather + operator user ID
- **Apollo.io** — API key for Phase 2
- **Google Ads** — API credentials for Phase 2
- **SendGrid** — API key for Phase 3
- **Google Calendar** — OAuth credentials for Phase 3
- **LangSmith** — API key for Phase 4
