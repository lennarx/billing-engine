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

   **Supabase Storage setup:** Create a bucket named `invoice-files` in your Supabase project (Storage → New bucket). During MVP/dev, the bucket can be set to **public** so that invoice files are accessible via public URL. In production, apply appropriate RLS policies.

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
  storage.ts          # Supabase Storage helpers
  types.ts            # TypeScript domain types (aligned with DB schema)
  mock-data.ts        # Mock data (kept for reference)
docs/
  context.md          # Product context and user workflow
  data-model.md       # Entity definitions and domain rules
AGENTS.md             # Guidance for AI agents working in this repo
```

## Domain Overview

See [docs/context.md](docs/context.md) and [docs/data-model.md](docs/data-model.md) for full documentation.

**Key rule:** A nomenclator value belongs to a *practice within an invoice*, not globally. Each practice inside an invoice has its own value. Many affiliate items can reference the same practice.