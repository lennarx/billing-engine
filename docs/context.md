# Product Context

## What the app does

Billing Engine helps **one user** validate medical invoices received from hospitals and providers.

## Invoice lifecycle

1. **Invoices arrive** as PDFs or scanned images from medical providers.
2. The user **uploads** the invoice file to attach it to a record.
3. The user **loads practices** — the medical services listed on the invoice (e.g., Ergometría, Traslado, Radiografía) along with the nomenclator value assigned to each by the provider for that invoice.
4. The user **loads affiliate service items** — one row per patient per service, referencing a practice.
5. The user **attaches supporting documentation** where needed.
6. The user **validates coverage manually** for each item, marking it as `covered`, `not_covered`, or `partial`.
7. The invoice gets a **final status**: `pending`, `validated`, or `rejected`.

## Scope

- Single user — **no authentication**.
- Documents are uploaded and reviewed manually — **no OCR**.
- Everything runs in one Next.js app — **no microservices**.

## Key domain rule: nomenclator values are per-practice per-invoice

A nomenclator value is **not global** and **not unique across invoices**. It is specific to a practice within a single invoice.

Example:

```
Invoice 123 — Hospital Italiano
  Ergometría     value: 10 000
  Traslado       value:    500 per km
  Radiografía    value:  7 000

Invoice 456 — Clínica Santa Fe
  Ergometría     value:  9 500   ← different value for the same practice name
```

Many affiliate items can reference the same practice within one invoice:

```
Invoice 123
  AffiliateItem: Juan Pérez  — Ergometría × 2 → expected $20 000
  AffiliateItem: Carlos López — Ergometría × 1 → expected $10 000
```
