# AGENTS.md

This file provides guidance for AI agents working in this repository.

## Purpose

Billing Engine is a small monolithic web app for validating medical invoices from hospitals and providers. One user operates the app — no authentication is required.

## Stack

| Layer      | Technology                      |
|------------|---------------------------------|
| Framework  | Next.js (App Router)            |
| Language   | TypeScript                      |
| Styling    | Tailwind CSS                    |
| Database   | Supabase (PostgreSQL + Storage) |

## Project Layout

```
app/                  # Next.js App Router pages and layout
  layout.tsx          # Root layout with nav bar
  page.tsx            # Home page
  invoices/
    page.tsx          # Invoice list
    [id]/page.tsx     # Invoice detail
lib/
  supabase.ts         # Supabase client (single instance)
  types.ts            # TypeScript domain types (aligned with DB schema)
  mock-data.ts        # Typed mock data used before DB integration
supabase/
  migrations/
    001_initial_schema.sql  # Full DB schema, indexes, triggers, seed
docs/
  context.md          # Product context and user workflow
  data-model.md       # Entity definitions and domain rules
```

## Key Domain Concepts

- **Provider** — a hospital or medical provider that issues invoices.
- **Invoice** — a billing document from a provider (PDF/image). Has a status lifecycle: `draft → in_review → validated / observed / rejected`.
- **Invoice Practice** — a medical service listed on a specific invoice (e.g., Ergometría, Traslado, Radiografía). Each practice has a `nomenclator_value` and a `unit_type` that are **specific to that invoice** — not global values.
- **Invoice Item** — one service performed for one affiliate (patient). References an Invoice Practice. `expected_amount = quantity × invoice_practice.nomenclator_value`.
- **Item Document** — a supporting file (PDF/image) attached to one Invoice Item, stored in Supabase Storage.

### Critical domain rule

> A nomenclator value belongs to an **Invoice Practice within a specific invoice**, not globally.
> The same practice name (e.g., "Ergometría") can have different nomenclator values across different invoices.
> Many Invoice Items can reference the same Invoice Practice within one invoice.

### Manual validations per Invoice Item

1. **Affiliate number lookup** — the user looks up the affiliate number from an external system and records it on the item.
2. **Coverage status check** — the user manually marks each item's `coverage_status` as `active`, `inactive`, or `pending`.

## Design Principles

- **Simple and readable** — no over-engineering.
- **No authentication** — single-user app.
- **No OCR** — documents are uploaded and reviewed manually.
- **No microservices** — everything lives in this Next.js app.
- **Ready for Supabase** — mock data mirrors the real DB schema so swapping is straightforward.

## Adding Features

1. Add new pages inside `app/`.
2. For DB reads/writes, use the `supabase` client from `lib/supabase.ts`.
3. Keep TypeScript types aligned with `lib/types.ts` and `docs/data-model.md`.
4. Do not introduce new external dependencies unless necessary.
