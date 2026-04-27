-- =============================================================================
-- Billing Engine — Initial Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- providers
-- ---------------------------------------------------------------------------
create table providers (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  cuit        text        null,
  notes       text        null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
create table invoices (
  id              uuid          primary key default gen_random_uuid(),
  provider_id     uuid          not null references providers(id),
  invoice_number  text          not null,
  invoice_date    date          null,
  status          text          not null default 'draft',
  total_amount    numeric(12,2) null,
  file_path       text          null,
  notes           text          null,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),

  constraint invoices_status_check check (
    status in ('draft', 'in_review', 'validated', 'observed', 'rejected')
  ),
  constraint invoices_total_amount_check check (
    total_amount is null or total_amount >= 0
  ),
  constraint invoices_unique_provider_number unique (provider_id, invoice_number)
);

-- ---------------------------------------------------------------------------
-- invoice_practices
-- ---------------------------------------------------------------------------
create table invoice_practices (
  id                    uuid          primary key default gen_random_uuid(),
  invoice_id            uuid          not null references invoices(id) on delete cascade,
  code                  text          null,
  name                  text          not null,
  unit_type             text          not null default 'unit',
  nomenclator_value     numeric(12,2) not null,
  requires_documentation boolean      not null default true,
  notes                 text          null,
  created_at            timestamptz   not null default now(),

  constraint invoice_practices_unit_type_check check (
    unit_type in ('fixed', 'unit', 'km')
  ),
  constraint invoice_practices_nomenclator_value_check check (
    nomenclator_value >= 0
  )
);

-- ---------------------------------------------------------------------------
-- invoice_items
-- ---------------------------------------------------------------------------
create table invoice_items (
  id                    uuid          primary key default gen_random_uuid(),
  invoice_id            uuid          not null references invoices(id) on delete cascade,
  invoice_practice_id   uuid          not null references invoice_practices(id),
  dni                   text          not null,
  affiliate_number      text          null,
  service_date          date          null,
  quantity              numeric(12,2) not null default 1,
  billed_amount         numeric(12,2) not null default 0,
  expected_amount       numeric(12,2) not null default 0,
  coverage_status       text          not null default 'pending',
  documentation_status  text          not null default 'pending',
  final_status          text          not null default 'pending',
  notes                 text          null,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now(),

  constraint invoice_items_quantity_check check (quantity >= 0),
  constraint invoice_items_billed_amount_check check (billed_amount >= 0),
  constraint invoice_items_expected_amount_check check (expected_amount >= 0),
  constraint invoice_items_coverage_status_check check (
    coverage_status in ('pending', 'active', 'inactive')
  ),
  constraint invoice_items_documentation_status_check check (
    documentation_status in ('pending', 'ok', 'observed', 'not_required')
  ),
  constraint invoice_items_final_status_check check (
    final_status in ('pending', 'approved', 'observed', 'rejected')
  )
);

-- ---------------------------------------------------------------------------
-- item_documents
-- ---------------------------------------------------------------------------
create table item_documents (
  id                uuid          primary key default gen_random_uuid(),
  invoice_item_id   uuid          not null references invoice_items(id) on delete cascade,
  document_type     text          not null default 'otro',
  file_path         text          null,
  origin            text          null,
  destination       text          null,
  kilometers        numeric(12,2) null,
  document_date     date          null,
  validation_status text          not null default 'pending',
  notes             text          null,
  created_at        timestamptz   not null default now(),

  constraint item_documents_document_type_check check (
    document_type in ('traslado', 'estudio', 'consulta', 'otro')
  ),
  constraint item_documents_validation_status_check check (
    validation_status in ('pending', 'ok', 'observed')
  )
);

-- =============================================================================
-- Indexes
-- =============================================================================
create index idx_invoices_provider_id           on invoices(provider_id);
create index idx_invoice_practices_invoice_id   on invoice_practices(invoice_id);
create index idx_invoice_items_invoice_id        on invoice_items(invoice_id);
create index idx_invoice_items_practice_id       on invoice_items(invoice_practice_id);
create index idx_invoice_items_dni               on invoice_items(dni);
create index idx_item_documents_invoice_item_id  on item_documents(invoice_item_id);

-- =============================================================================
-- updated_at trigger
-- =============================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger invoices_set_updated_at
  before update on invoices
  for each row execute procedure set_updated_at();

create trigger invoice_items_set_updated_at
  before update on invoice_items
  for each row execute procedure set_updated_at();

-- =============================================================================
-- Seed data (commented out — uncomment to load example data)
-- =============================================================================
/*
-- Provider
insert into providers (id, name, cuit, notes)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Hospital Italiano',
  '30-99999999-1',
  'Main testing provider'
);

-- Invoice
insert into invoices (id, provider_id, invoice_number, invoice_date, status, total_amount)
values (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'INV-2024-001',
  '2024-01-15',
  'in_review',
  185000.00
);

-- Invoice practices
insert into invoice_practices (id, invoice_id, name, unit_type, nomenclator_value)
values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ergometría',  'unit',  10000.00),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Traslado',    'km',      500.00),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Radiografía', 'unit',   7000.00);

-- Invoice items
insert into invoice_items (
  invoice_id, invoice_practice_id, dni, affiliate_number,
  service_date, quantity, billed_amount, expected_amount,
  coverage_status, documentation_status, final_status, notes
)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    '20123456', 'AF-001', '2024-01-10',
    2, 20000.00, 20000.00,
    'active', 'ok', 'approved', 'Juan Pérez — Ergometría x2'
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    '20123456', 'AF-001', '2024-01-10',
    30, 15000.00, 15000.00,
    'active', 'ok', 'approved', 'Juan Pérez — Traslado 30 km'
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    '27654321', 'AF-002', '2024-01-12',
    1, 7000.00, 7000.00,
    'pending', 'observed', 'observed', 'María González — Radiografía, pending doc review'
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    '30111222', 'AF-003', '2024-01-14',
    1, 10000.00, 10000.00,
    'inactive', 'not_required', 'rejected', 'Carlos López — outside coverage period'
  );
*/
