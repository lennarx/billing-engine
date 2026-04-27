# Data Model

## Entities

### Provider

A hospital or medical provider that issues invoices.

| Column     | Type        | Notes                                  |
|------------|-------------|----------------------------------------|
| id         | uuid        | Primary key                            |
| name       | text        | Provider name                          |
| cuit       | text?       | Tax ID (optional)                      |
| notes      | text?       | Free-text notes                        |
| created_at | timestamptz |                                        |

---

### Invoice

A billing document received from a provider.

| Column         | Type          | Notes                                                                 |
|----------------|---------------|-----------------------------------------------------------------------|
| id             | uuid          | Primary key                                                           |
| provider_id    | uuid          | FK → Provider                                                         |
| invoice_number | text          | Provider-assigned invoice number (unique per provider)                |
| invoice_date   | date?         | Date on the invoice                                                   |
| status         | text          | `draft` \| `in_review` \| `validated` \| `observed` \| `rejected`    |
| total_amount   | numeric(12,2)?| Amount billed by the provider                                         |
| file_path      | text?         | Path of the uploaded PDF/image in Supabase Storage                    |
| notes          | text?         | Free-text notes                                                       |
| created_at     | timestamptz   |                                                                       |
| updated_at     | timestamptz   | Auto-updated on every write                                           |

---

### Invoice Practice

A medical service listed on a specific invoice. Nomenclator values are **per-practice per-invoice** — not global.

| Column                  | Type          | Notes                                                    |
|-------------------------|---------------|----------------------------------------------------------|
| id                      | uuid          | Primary key                                              |
| invoice_id              | uuid          | FK → Invoice (cascades on delete)                        |
| code                    | text?         | Optional service code                                    |
| name                    | text          | Service name (e.g., "Ergometría", "Traslado")            |
| unit_type               | text          | `fixed` \| `unit` \| `km`                               |
| nomenclator_value       | numeric(12,2) | Value assigned to this practice **for this invoice only**|
| requires_documentation  | boolean       | Whether supporting docs are mandatory                    |
| notes                   | text?         | Free-text notes                                          |
| created_at              | timestamptz   |                                                          |

> **Domain rule**: The same practice name (e.g., "Ergometría") can appear on multiple invoices with different `nomenclator_value`s. Do not treat nomenclator values as a global catalogue.

---

### Invoice Item

One service performed for one affiliate (patient), referencing an Invoice Practice on the same invoice.

| Column               | Type          | Notes                                                        |
|----------------------|---------------|--------------------------------------------------------------|
| id                   | uuid          | Primary key                                                  |
| invoice_id           | uuid          | FK → Invoice (cascades on delete)                            |
| invoice_practice_id  | uuid          | FK → Invoice Practice                                        |
| dni                  | text          | Patient national ID                                          |
| affiliate_number     | text?         | Affiliate / plan number (looked up manually)                 |
| service_date         | date?         | Date the service was rendered                                |
| quantity             | numeric(12,2) | Units, sessions, km, etc. (≥ 0)                             |
| billed_amount        | numeric(12,2) | Amount billed by the provider (≥ 0)                         |
| expected_amount      | numeric(12,2) | `quantity × invoice_practice.nomenclator_value` (≥ 0)       |
| coverage_status      | text          | `pending` \| `active` \| `inactive` — set by manual lookup  |
| documentation_status | text          | `pending` \| `ok` \| `observed` \| `not_required`           |
| final_status         | text          | `pending` \| `approved` \| `observed` \| `rejected`         |
| notes                | text?         | Free-text notes                                              |
| created_at           | timestamptz   |                                                              |
| updated_at           | timestamptz   | Auto-updated on every write                                  |

---

### Item Document

Supporting documentation attached to one Invoice Item (stored in Supabase Storage).

| Column           | Type          | Notes                                                  |
|------------------|---------------|--------------------------------------------------------|
| id               | uuid          | Primary key                                            |
| invoice_item_id  | uuid          | FK → Invoice Item (cascades on delete)                 |
| document_type    | text          | `traslado` \| `estudio` \| `consulta` \| `otro`        |
| file_path        | text?         | Path in Supabase Storage                               |
| origin           | text?         | Transfer origin (traslado only)                        |
| destination      | text?         | Transfer destination (traslado only)                   |
| kilometers       | numeric(12,2)?| Distance (traslado only)                               |
| document_date    | date?         | Date on the document                                   |
| validation_status| text          | `pending` \| `ok` \| `observed`                        |
| notes            | text?         | Free-text notes                                        |
| created_at       | timestamptz   |                                                        |

---

## Relationships

```
Provider        1 ──< Invoice
Invoice         1 ──< InvoicePractice
Invoice         1 ──< InvoiceItem
InvoicePractice 1 ──< InvoiceItem      (one practice referenced by many items)
InvoiceItem     1 ──< ItemDocument
```

## Computed fields

`InvoiceItem.expected_amount = quantity × invoice_practice.nomenclator_value`

Stored as a column for auditability rather than computed on read.

## Manual validations

1. **Affiliate number lookup** — the user looks up the affiliate number from an external system and records it in `invoice_item.affiliate_number`.
2. **Coverage status check** — the user manually marks each item's `coverage_status` as `active`, `inactive`, or `pending`.
