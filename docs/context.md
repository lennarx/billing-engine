# Product Context

## What the app does

Billing Engine helps **one user** validate medical invoices received from hospitals and providers.

## Invoice lifecycle

1. **Invoices arrive** as PDFs or scanned images from medical providers.
2. The user **uploads** the invoice file to attach it to a record.
3. The user **loads invoice practices** — the medical services listed on the invoice (e.g., Ergometría, Traslado, Radiografía) along with the nomenclator value and unit type assigned to each by the provider for that invoice.
4. The user **loads invoice items** — one row per patient per service, referencing an invoice practice.
5. The user **attaches supporting documentation** (Item Documents) where needed.
6. The user **validates manually** for each item:
   - **Affiliate number lookup** — looks up the affiliate number from an external system.
   - **Coverage status check** — marks the item as `active`, `inactive`, or `pending`.
7. Each item receives a **documentation status** (`pending`, `ok`, `observed`, `not_required`) and a **final status** (`pending`, `approved`, `observed`, `rejected`).
8. The invoice gets a **final status**: `draft`, `in_review`, `validated`, `observed`, or `rejected`.

## Scope

- Single user — **no authentication**.
- Documents are uploaded and reviewed manually — **no OCR**.
- Everything runs in one Next.js app — **no microservices**.

## Key domain rule: nomenclator values are per-practice per-invoice

A nomenclator value is **not global** and **not unique across invoices**. It is specific to an Invoice Practice within a single invoice.

Example:

```
Invoice 123 — Hospital Italiano
  Ergometría     value: 10 000   unit: unit
  Traslado       value:    500   unit: km
  Radiografía    value:  7 000   unit: unit

Invoice 456 — Clínica Santa Fe
  Ergometría     value:  9 500   ← different value for the same practice name
```

Many invoice items can reference the same invoice practice within one invoice:

```
Invoice 123
  InvoiceItem: dni 20123456  — Ergometría × 2 → expected $20 000
  InvoiceItem: dni 30111222  — Ergometría × 1 → expected $10 000
```
