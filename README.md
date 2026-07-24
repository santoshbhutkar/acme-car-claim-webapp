# ACME — Car Insurance Claim Webapp (V1)

API-led Next.js modular monolith for filing, tracking, and lightly adjusting auto insurance claims.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite
- Zod validation
- Local disk uploads (`uploads/`)

## Quick start

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> If `registry.npmjs.org` is blocked on your network, use a working mirror, e.g.  
> `npm install --registry https://r.cnpmjs.org` (you may need `npm config set strict-ssl false` if the mirror cert is stale).

## Two portals (separate UIs)

| Audience | Entry | Nav |
|----------|-------|-----|
| Claimant | `/` | Home · File a claim · Track |
| Adjuster | `/adjuster` | Open claims only |

Claimant pages never show adjuster controls. Adjuster desk is its own chrome (`ACME · Adjuster`).

## Demo script

1. Open `/` → **File a claim** → use plate `ABC-1234` (or `XYZ-9876`, `DEF-4567`, `GHI-5555`) → submit → note the claim number.
2. **Track a claim** → claim number + the email from filing (seeded holder for `ABC-1234` is `jordan.lee@email.com`).
3. Open `/adjuster` in another tab → review the claim → Under Review → Approve / Needs Info / Deny.
4. Back on the claimant **Track** page → refresh to see the timeline update.

### Seeded sample claim

| Field | Value |
|-------|-------|
| Claim | `CLM-2026-0001` |
| Email | `jordan.lee@email.com` |
| Plate | `ABC-1234` |

## API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/policies/lookup?plate=` | Match seeded policy |
| POST | `/api/claims` | Create FNOL (multipart photos optional) |
| GET | `/api/claims/:claimNumber?email=` | Track lookup |
| POST | `/api/claims/:claimNumber/attachments?email=` | Extra evidence when Needs Info |
| GET | `/api/adjuster/claims` | Open claims queue |
| GET | `/api/adjuster/claims/:id` | Claim detail |
| PATCH | `/api/adjuster/claims/:id/status` | Status transition |
| GET | `/api/attachments/:id` | Serve uploaded image |

### Status machine

`SUBMITTED → UNDER_REVIEW → NEEDS_INFO | APPROVED | DENIED`  
(`NEEDS_INFO` can return to `UNDER_REVIEW`)

## Project layout

- `src/app/` — pages (landing, file-claim, track, adjuster)
- `src/app/api/` — REST handlers
- `src/lib/claims/` — status rules, claim numbers, uploads, Zod schemas
- `prisma/` — schema + seed

## Out of scope (V1)

Microservices, real auth/SSO, payments, email/SMS, PDF, ML/OCR, production cloud deploy.
