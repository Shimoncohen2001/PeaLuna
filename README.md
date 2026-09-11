# PeaLuna

Production-grade monorepo for a wig repair & care marketplace — customers, technicians, admin operations, payments, and full order lifecycle tracking.

## Stack

| Layer | Technology |
|-------|------------|
| Web | Next.js 15, Tailwind 4, TanStack Query, Framer Motion |
| API | Fastify 5, Zod, Prisma |
| Data | PostgreSQL 16, Redis 7 |
| Storage | S3-compatible (MinIO local) |
| Auth | JWT access + HttpOnly refresh cookies, RBAC |
| Payments | Stripe Connect (Sprint 5) |

**Business defaults:** 20% platform commission · EU region `eu-central-1` · multi-region-ready schema

## Quick start

### Prerequisites

- Node.js 20.11+
- pnpm 9+
- Docker Desktop

### 1. Install

```bash
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Generate secrets:

```bash
openssl rand -base64 48
```

Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (min 32 chars) in `.env` and `apps/api/.env`.

### 3. Infrastructure

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 4. Database

```bash
pnpm db:generate
pnpm db:migrate:dev
```

### 5. Run

```bash
pnpm dev
```

- Web: http://localhost:3000  
- API: http://localhost:4000  
- Health: http://localhost:4000/health/ready  

## Project structure

```
apps/
  api/          Fastify REST API
  web/          Next.js App Router
packages/
  database/     Prisma schema & client
  domain/       Order state machine, RBAC, commission math
  contracts/    Shared Zod schemas & API types
  auth/         JWT, passwords, cookies
  logger/       Pino logging
docs/adr/       Architecture decision records
infrastructure/ Docker Compose, Dockerfiles
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health/live` | Liveness |
| GET | `/health/ready` | DB + Redis readiness |
| POST | `/api/v1/auth/register` | Register + set refresh cookie |
| POST | `/api/v1/auth/login` | Login + set refresh cookie |
| POST | `/api/v1/auth/refresh` | Rotate refresh (cookie or body) |
| POST | `/api/v1/auth/logout` | Revoke family + clear cookie |
| GET | `/api/v1/auth/me` | Current user (Bearer token) |
| GET | `/api/v1/services` | Catalogue services FR |
| GET | `/api/v1/technicians` | Recherche expertes (CP / ville / service) |
| POST | `/api/v1/technicians/apply` | Onboarding prestataire |
| GET | `/api/v1/technicians/me/dashboard` | Stats espace pro |
| POST | `/api/v1/bookings` | RDV (services + expert + créneau + escrow meta) |
| POST | `/api/v1/orders/:id/payments/intent` | Créer PaymentIntent (capture manuelle) |
| POST | `/api/v1/orders/:id/payments/simulate-authorize` | Escrow simu (dev sans clé Stripe) |
| POST | `/api/v1/orders/:id/payments/release` | Valider service → capture 80/20 |
| POST | `/api/v1/webhooks/stripe` | Webhooks Stripe |
| POST | `/api/v1/technicians/me/stripe/onboard` | Onboarding Stripe Connect |
| GET/POST | `/api/v1/wigs` | Customer wig profiles |
| GET/POST | `/api/v1/orders` | Create / list repair orders |
| POST | `/api/v1/orders/:id/actions` | State-machine actions |
| POST | `/api/v1/media/upload-url` | Presigned MinIO/S3 upload |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + web |
| `pnpm build` | Production build |
| `pnpm test` | Run unit tests |
| `pnpm lint` | ESLint |
| `pnpm db:migrate:dev` | Create/apply migrations |
| `pnpm db:studio` | Prisma Studio |

## Documentation

- [ADR 001 — Monorepo & layered API](docs/adr/001-monorepo-and-layered-api.md)
- [ADR 002 — Hybrid auth](docs/adr/002-auth-hybrid-jwt-cookies.md)
- [ADR 003 — EU-primary, multi-region ready](docs/adr/003-eu-primary-multi-region-ready.md)

## License

Proprietary — All rights reserved.
