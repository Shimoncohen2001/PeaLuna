# ADR 001: Monorepo and Layered API

## Status

Accepted

## Context

PeaLuna requires a multi-sided marketplace with strict domain rules (order lifecycle), EU deployment, and future mobile clients.

## Decision

- **pnpm + Turborepo** monorepo with `apps/api`, `apps/web`, and shared `packages/*`.
- **Fastify API** as the sole backend for MVP; Next.js does not own business logic.
- **Layered modules**: routes → services → Prisma; domain rules in `@velure/domain`.
- **Product name**: PeaLuna (user-facing brand). Internal npm packages remain `@velure/*`.

## Consequences

- Clear extraction path to microservices per module folder.
- Single deployable API simplifies mobile integration later via REST `/api/v1`.
- Requires discipline to keep domain logic out of route handlers.
