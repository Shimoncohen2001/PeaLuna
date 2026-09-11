# ADR 003: EU-Primary, Multi-Region Ready

## Status

Accepted

## Context

Initial deployment targets a **single EU region** (eu-central-1). International expansion and data residency rules require foresight.

## Decision

- `DEPLOYMENT_REGION` / `AWS_REGION` default to `eu-central-1`.
- `users.home_region` and `repair_orders.fulfillment_region` stored on every record.
- `outbox_events` table prepared for future cross-region replication.
- No multi-region active-active in MVP — design only.

## Future migration path

1. Route users by `home_region` at edge (GeoDNS / CloudFront).
2. Shard Postgres per region; global IDs remain UUID.
3. Stripe EU entity; separate Connect accounts per country as needed.

## Consequences

- Slightly wider schema now; avoids painful migrations later.
- All PII processing documented for GDPR (DPA, retention policies — legal, not code).
