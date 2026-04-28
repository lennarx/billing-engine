# Billing Engine

A small monolithic web app for validating medical invoices from hospitals and providers.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- TypeScript
- Tailwind CSS
- [Supabase](https://supabase.com/) (PostgreSQL + Storage)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (for DB integration; mock data works without it)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/lennarx/billing-engine.git
   cd billing-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   | Variable | Description |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
   | `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_INVOICES` | Storage bucket name for invoice files (defaults to `invoice-files`) |
   | `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_DOCUMENTS` | Storage bucket name for item document files (defaults to `item-documents`) |

   **Supabase Storage setup:** Create two buckets in your Supabase project (Storage → New bucket):
   - `invoice-files` — for uploaded invoice PDFs/images.
   - `item-documents` — for supporting documents attached to invoice items (e.g. transfer receipts, study results).

   During MVP/dev, both buckets can be set to **public** so that files are accessible via public URL. In production, apply appropriate RLS policies.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  layout.tsx          # Root layout with nav bar
  page.tsx            # Home page
  invoices/
    page.tsx          # Invoices list (Supabase)
    new/
      page.tsx        # Create invoice form
    [id]/
      page.tsx        # Invoice detail (server shell)
      InvoiceDetailClient.tsx  # View/edit invoice (client)
  providers/
    page.tsx          # Providers list (server shell)
    ProvidersClient.tsx        # Providers CRUD (client)
lib/
  supabase.ts         # Supabase client (single instance)
  providers.ts        # Provider CRUD helpers
  invoices.ts         # Invoice CRUD helpers (with provider join)
  invoice-items.ts    # Invoice item CRUD helpers
  invoice-practices.ts# Invoice practice CRUD helpers
  item-documents.ts   # Item document CRUD helpers
  storage.ts          # Supabase Storage helpers (invoice files + item documents)
  validation.ts       # Pure validation helper for invoice items
  types.ts            # TypeScript domain types (aligned with DB schema)
  mock-data.ts        # Mock data (kept for reference)
docs/
  context.md          # Product context and user workflow
  data-model.md       # Entity definitions and domain rules
AGENTS.md             # Guidance for AI agents working in this repo
```

## Item Documents & Validation

Each invoice item can have supporting documents attached (e.g. transfer receipts, study results, consultation records). Documents are uploaded and reviewed **manually** — there is no OCR.

### Document types
- **Traslado** — transfer/transport. Requires origin, destination, and kilometers (> 0).
- **Estudio** — medical study.
- **Consulta** — consultation.
- **Otro** — other.

### Validation rules (`lib/validation.ts`)

`validateInvoiceItem(item, practice, documents)` returns derived `documentation_status`, `final_status`, and per-document `validation_status` updates:

1. `coverage_status === inactive` → `final_status = rejected`
2. `coverage_status === pending` → `final_status = pending`
3. Practice does not require documentation → `documentation_status = not_required`
4. Documentation required but no documents → `documentation_status = pending`, `final_status = observed`
5. Traslado document missing origin/destination/km → `validation_status = observed`
6. All required document checks pass → `documentation_status = ok`
7. Billed amount ≠ expected amount → `final_status = observed`
8. Coverage active + documentation ok/not_required + amounts match → `final_status = approved`

Validation only runs when the user clicks **Recalculate status** (per item) or **Recalculate all item statuses** (all items in the invoice). It does not run automatically on every edit.

## Domain Overview

See [docs/context.md](docs/context.md) and [docs/data-model.md](docs/data-model.md) for full documentation.

**Key rule:** A nomenclator value belongs to a *practice within an invoice*, not globally. Each practice inside an invoice has its own value. Many affiliate items can reference the same practice.