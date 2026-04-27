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
    page.tsx          # Invoices list
    [id]/
      page.tsx        # Invoice detail
lib/
  supabase.ts         # Supabase client (single instance)
  mock-data.ts        # Mock data used before DB integration
docs/
  context.md          # Product context and user workflow
  data-model.md       # Entity definitions and domain rules
AGENTS.md             # Guidance for AI agents working in this repo
```

## Domain Overview

See [docs/context.md](docs/context.md) and [docs/data-model.md](docs/data-model.md) for full documentation.

**Key rule:** A nomenclator value belongs to a *practice within an invoice*, not globally. Each practice inside an invoice has its own value. Many affiliate items can reference the same practice.