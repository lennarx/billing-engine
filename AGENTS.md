# AGENTS.md

This file provides guidance for AI agents working in this repository.

## Purpose

Billing Engine is a small monolithic web app for validating medical invoices from hospitals and providers. One user operates the app — no authentication is required.

## Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Framework  | Next.js (App Router)          |
| Language   | TypeScript                    |
| Styling    | Tailwind CSS                  |
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
  mock-data.ts        # Typed mock data used before DB integration
docs/
  context.md          # Product context and user workflow
  data-model.md       # Entity definitions and domain rules
```

## Key Domain Concepts

- **Invoice** — a billing document from a hospital or provider (PDF/image).
- **Practice** — a medical service listed on an invoice (e.g., Ergometría, Traslado, Radiografía). Each practice has a `nomenclator_value` that is **specific to that invoice** — not a global value.
- **AffiliateItem** — one service performed for one affiliate (patient). References a practice. `expected_amount = quantity × practice.nomenclator_value`.
- **CoverageStatus** — result of manual validation: `covered`, `not_covered`, or `partial`.
- **Document** — a supporting file (PDF/image) attached to an invoice, stored in Supabase Storage.

### Critical domain rule

> A nomenclator value belongs to a **practice within an invoice**, not globally.
> The same practice name (e.g., "Ergometría") can have different nomenclator values across different invoices.
> Many affiliate items can reference the same practice within one invoice.

## Design Principles

- **Simple and readable** — no over-engineering.
- **No authentication** — single-user app.
- **No OCR** — documents are uploaded and reviewed manually.
- **No microservices** — everything lives in this Next.js app.
- **Ready for Supabase** — mock data mirrors the real DB schema so swapping is straightforward.

## Adding Features

1. Add new pages inside `app/`.
2. For DB reads/writes, use the `supabase` client from `lib/supabase.ts`.
3. Keep TypeScript types aligned with `docs/data-model.md`.
4. Do not introduce new external dependencies unless necessary.
