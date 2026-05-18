# Leads API

REST API for managing marketing leads with AI-powered executive summaries.
Built for the **One Million Copy SAS** backend technical assessment.

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Language | **TypeScript** | Static types catch errors before runtime and make the API surface self-documenting. |
| Framework | **NestJS 10** | Opinionated module/DI architecture, first-class DTO validation, batteries-included (Swagger, Throttler, guards). |
| Database | **PostgreSQL 16** + **TypeORM** | Relational model fits leads + future joins (campaigns, owners). TypeORM gives us a clean entity definition with timestamps, soft delete and unique indexes out of the box. |
| Validation | `class-validator` + `class-transformer` | Declarative rules on the DTOs, fully integrated with Nest's global `ValidationPipe`. |
| AI provider | **OpenAI SDK** behind a `LlmProvider` interface, with a **deterministic mock** fallback | The controller talks to an interface — swapping vendor (Anthropic, Bedrock, local model) is one line in the module. Without an API key the app still works for grading. |
| Docs | **Swagger / OpenAPI** at `/docs` | Generated from decorators, no extra YAML to keep in sync. |
| Security | API-key guard (optional) + **rate limiting** | Production-ready posture without overengineering. |
| Containerization | **Docker** multi-stage + **docker-compose** | One command to bring up Postgres + API together. |

## Project structure

```
src/
├── ai/                       # AI module — provider interface + OpenAI / Mock
│   ├── providers/
│   ├── ai.controller.ts      # POST /api/leads/ai/summary
│   ├── ai.service.ts
│   └── prompt.ts
├── common/
│   ├── filters/              # Global exception filter (uniform error envelope)
│   └── guards/               # Optional API-key guard
├── database/
│   ├── data-source.ts        # Stand-alone DataSource for seed / CLI
│   └── seed.ts               # 12 sample leads spanning every channel
├── leads/                    # Leads module — CRUD + stats + webhook
│   ├── dto/
│   ├── entities/lead.entity.ts
│   ├── leads.controller.ts
│   ├── leads.service.ts
│   └── webhook.controller.ts # POST /api/leads/webhook (Typeform-style)
├── app.module.ts
├── health.controller.ts
└── main.ts
```

## Getting started

### Option A — Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
# API: http://localhost:3000/api
# Swagger: http://localhost:3000/docs
```

Then, in another terminal, run the seed inside the API container:

```bash
docker compose exec api npx ts-node -r tsconfig-paths/register src/database/seed.ts
```

### Option B — Local Node

Requires Node 20+ and a reachable PostgreSQL 16 instance.

```bash
cp .env.example .env        # adjust DB_* if needed
npm install
npm run start:dev           # http://localhost:3000
npm run seed                # populates 12 sample leads
```

## Environment variables

See `.env.example` for the full list. The two interesting ones:

| Var | Effect |
| --- | --- |
| `OPENAI_API_KEY` | If present, `/leads/ai/summary` calls the real model. If absent, the deterministic mock provider is used — no external calls, no cost. |
| `API_KEY` | If set, every endpoint requires the `x-api-key` header. If empty (default for local dev), the guard is a no-op. |

## API reference

Base path: `/api`. Full interactive docs at `/docs`.

| Method | Path | Description |
| --- | --- | --- |
| POST   | `/leads` | Register a new lead |
| GET    | `/leads` | List with `page`, `limit`, `fuente`, `from`, `to` |
| GET    | `/leads/stats` | Aggregated stats |
| GET    | `/leads/:id` | Retrieve a single lead |
| PATCH  | `/leads/:id` | Update fields |
| DELETE | `/leads/:id` | Soft-delete |
| POST   | `/leads/ai/summary` | AI-generated executive summary |
| POST   | `/leads/webhook` | Typeform-style inbound webhook |
| GET    | `/health` | Liveness probe |

### Example: create a lead

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Laura Gómez",
    "email": "laura@example.com",
    "telefono": "+57 300 1112233",
    "fuente": "instagram",
    "productoInteres": "Curso de copywriting",
    "presupuesto": 350
  }'
```

### Example: list with filters

```bash
curl "http://localhost:3000/api/leads?fuente=instagram&page=1&limit=5"
curl "http://localhost:3000/api/leads?from=2026-01-01&to=2026-12-31"
```

### Example: stats

```bash
curl http://localhost:3000/api/leads/stats
```

```json
{
  "total": 12,
  "bySource": { "instagram": 4, "facebook": 2, "landing_page": 2, "referido": 2, "otro": 2 },
  "averageBudget": 754.78,
  "lastSevenDays": 6
}
```

### Example: AI summary

```bash
curl -X POST http://localhost:3000/api/leads/ai/summary \
  -H "Content-Type: application/json" \
  -d '{ "fuente": "instagram" }'
```

Response (mock provider, redacted):

```json
{
  "provider": "mock",
  "filter": { "fuente": "instagram" },
  "leadsAnalyzed": 4,
  "generatedAt": "2026-05-18T15:00:00.000Z",
  "summary": "## Executive summary\n\nAnalysed 4 lead(s)..."
}
```

### Example: Typeform webhook

```bash
curl -X POST http://localhost:3000/api/leads/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "form_response": {
      "answers": [
        { "field": { "ref": "nombre" },  "text":  "Mateo Vargas" },
        { "field": { "ref": "email" },   "email": "mateo@example.com" },
        { "field": { "ref": "telefono" },"phone_number": "+57 300 0000000" },
        { "field": { "ref": "fuente" },  "choice": { "label": "instagram" } },
        { "field": { "ref": "presupuesto" }, "number": 300 }
      ]
    }
  }'
```

## Data model

`leads` table — created automatically by TypeORM on first boot.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `nombre` | `varchar(120)` | min length 2 (validated at the DTO layer) |
| `email` | `varchar(180)` | Unique (partial index excluding soft-deleted rows) |
| `telefono` | `varchar(40)` | Nullable |
| `fuente` | `enum` | `instagram \| facebook \| landing_page \| referido \| otro` |
| `producto_interes` | `varchar(180)` | Nullable |
| `presupuesto` | `numeric(12,2)` | Nullable, USD |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Auto |
| `deleted_at` | `timestamptz` | Soft delete marker (TypeORM `@DeleteDateColumn`) |

## Tests

```bash
npm test
```

Coverage:
- Service business rules (duplicate email, not-found, soft delete, empty stats)
- Mock LLM provider (empty dataset + dominant-channel detection)

## Error format

Every error response follows the same shape (handled by a global filter):

```json
{
  "success": false,
  "statusCode": 409,
  "error": "ConflictException",
  "message": "A lead with email \"foo@bar.com\" already exists",
  "path": "/api/leads",
  "timestamp": "2026-05-18T15:00:00.000Z"
}
```

## Design notes / decisions

- **Soft delete by default.** `@DeleteDateColumn` makes TypeORM exclude
  removed leads from every query automatically. The unique email index is
  partial (`WHERE deleted_at IS NULL`) so re-registering a previously
  deleted email is allowed.
- **`synchronize: true`** is enabled because the assessment runs in 6 hours.
  In production we would disable it and ship migrations through
  `npm run migration:run` (the TypeORM CLI is already wired up).
- **Provider pattern for the LLM.** The controller depends on the
  `LlmProvider` interface; the module picks the real or mock implementation
  based on `OPENAI_API_KEY`. Swapping vendor or pointing to a local model is
  a one-line change.
- **Route ordering.** `/leads/stats` is declared before `/leads/:id` and
  `:id` uses `ParseUUIDPipe` so the static segment always wins.
- **Validation lives in DTOs.** Controllers stay thin and the global
  `ValidationPipe` enforces it everywhere, including `forbidNonWhitelisted`
  to reject unknown fields.
- **Webhook is forgiving.** Third-party providers add fields constantly;
  the webhook controller normalises a Typeform-shaped payload into our
  internal DTO without 4xx-ing on unknowns.

## Bonus features included

- Docker + docker-compose
- Unit tests (Jest)
- Optional API-key authentication (`API_KEY` env var)
- Rate limiting (`@nestjs/throttler`)
- Swagger / OpenAPI at `/docs`
- Webhook endpoint (`POST /leads/webhook`)
- **Frontend dashboard** (fullstack bonus — see below)

## Frontend (fullstack bonus)

The brief asked for a backend, but I'm a fullstack engineer and I enjoy
the frontend side too — so I shipped a small dashboard on top of the API.
It lives in [`web/`](./web) and is fully decoupled from the backend.

**Stack**

| | |
| --- | --- |
| Build tool | **Vite 6** |
| UI | **React 19** + **TypeScript** |
| Styling | **Tailwind CSS v4** (with `@theme` tokens, no PostCSS config) |
| Data | **TanStack Query 5** (caching, invalidation, mutations) |

**What it does**

- Lists leads with **source / from / to** filters and pagination
- Shows a **stats panel** (total, last 7 days, avg budget, by-source bars)
- Registers new leads through a modal form (uses `POST /api/leads`)
- Soft-deletes leads inline from the table
- Calls the **AI summary** endpoint with the same filters and renders the
  briefing — works out of the box thanks to the mock provider

**Run it**

```bash
# 1) start the API (port 3000) as documented above
# 2) in another terminal:
cd web
npm install
npm run dev   # http://localhost:5173
```

In development the Vite proxy forwards `/api/*` and `/docs` to
`http://localhost:3000`, so CORS is a non-issue. For production builds
point the frontend at any host with the `VITE_API_BASE` env var:

```bash
VITE_API_BASE=https://leads.example.com npm run build
```

The backend has `CORS` enabled (`app.enableCors`) so the built bundle can
be hosted anywhere — S3, Cloudflare Pages, Vercel — and still talk to the
API.
