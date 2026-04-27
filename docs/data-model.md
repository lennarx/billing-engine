# Data Model

## Entities

### Invoice

Represents a billing document received from a provider.

| Column          | Type      | Notes                                        |
|-----------------|-----------|----------------------------------------------|
| id              | uuid / text | Primary key                                |
| provider_name   | text      | Name of the hospital or provider             |
| invoice_number  | text      | Provider-assigned invoice number             |
| invoice_date    | date      | Date on the invoice                          |
| total_amount    | numeric   | Amount billed by the provider                |
| status          | text      | `pending` \| `validated` \| `rejected`       |
| file_url        | text?     | URL of the uploaded PDF/image in Supabase Storage |
| created_at      | timestamp |                                              |

---

### Practice

A medical service listed on an invoice. Nomenclator values are **per-practice per-invoice** — not global.

| Column             | Type    | Notes                                          |
|--------------------|---------|------------------------------------------------|
| id                 | uuid    | Primary key                                    |
| invoice_id         | uuid    | FK → Invoice                                   |
| name               | text    | Service name (e.g., "Ergometría", "Traslado")  |
| nomenclator_value  | numeric | Value assigned to this practice on this invoice |
| unit               | text    | e.g., "per session", "per km"                  |
| created_at         | timestamp |                                              |

> **Domain rule**: The same practice name can appear on multiple invoices with different nomenclator values. Do not treat nomenclator values as a global catalogue.

---

### AffiliateItem

One service rendered to one affiliate (patient), referencing a practice on the same invoice.

| Column           | Type    | Notes                                                  |
|------------------|---------|--------------------------------------------------------|
| id               | uuid    | Primary key                                            |
| invoice_id       | uuid    | FK → Invoice                                           |
| practice_id      | uuid    | FK → Practice (must belong to the same invoice)        |
| affiliate_name   | text    | Patient / affiliate name                               |
| quantity         | numeric | Number of sessions, km, etc.                           |
| expected_amount  | numeric | Computed: `quantity × practice.nomenclator_value`      |
| coverage_status  | text    | `covered` \| `not_covered` \| `partial`                |
| notes            | text    | Free-text notes from manual validation                 |
| created_at       | timestamp |                                                      |

---

### Document

A supporting file attached to an invoice (stored in Supabase Storage).

| Column     | Type      | Notes                      |
|------------|-----------|----------------------------|
| id         | uuid      | Primary key                |
| invoice_id | uuid      | FK → Invoice               |
| file_url   | text      | Supabase Storage URL       |
| label      | text      | Short description           |
| created_at | timestamp |                            |

---

## Relationships

```
Invoice 1 ──< Practice    (one invoice has many practices)
Invoice 1 ──< AffiliateItem
Invoice 1 ──< Document
Practice  1 ──< AffiliateItem  (one practice referenced by many items)
```

## Computed fields

`AffiliateItem.expected_amount = quantity × practice.nomenclator_value`

This can be stored as a column (for auditability) or computed on read.
