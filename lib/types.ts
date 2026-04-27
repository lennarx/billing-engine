// =============================================================================
// Domain types — aligned with the Supabase schema in
// supabase/migrations/001_initial_schema.sql
// =============================================================================

// ---------------------------------------------------------------------------
// Status enums
// ---------------------------------------------------------------------------

export type InvoiceStatus =
  | 'draft'
  | 'in_review'
  | 'validated'
  | 'observed'
  | 'rejected'

export type UnitType = 'fixed' | 'unit' | 'km'

export type CoverageStatus = 'pending' | 'active' | 'inactive'

export type DocumentationStatus = 'pending' | 'ok' | 'observed' | 'not_required'

export type FinalStatus = 'pending' | 'approved' | 'observed' | 'rejected'

export type DocumentType = 'traslado' | 'estudio' | 'consulta' | 'otro'

export type ValidationStatus = 'pending' | 'ok' | 'observed'

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export interface Provider {
  id: string
  name: string
  cuit: string | null
  notes: string | null
  created_at: string
}

export interface Invoice {
  id: string
  provider_id: string
  invoice_number: string
  invoice_date: string | null
  status: InvoiceStatus
  total_amount: number | null
  file_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * A medical service listed on a specific invoice.
 * The nomenclator_value is per-practice per-invoice — not a global catalogue value.
 */
export interface InvoicePractice {
  id: string
  invoice_id: string
  code: string | null
  name: string
  unit_type: UnitType
  /** Value assigned to this practice for this invoice only. */
  nomenclator_value: number
  requires_documentation: boolean
  notes: string | null
  created_at: string
}

/**
 * One service performed for one affiliate (patient),
 * referencing an InvoicePractice on the same invoice.
 *
 * expected_amount = quantity × invoice_practice.nomenclator_value
 */
export interface InvoiceItem {
  id: string
  invoice_id: string
  invoice_practice_id: string
  dni: string
  affiliate_number: string | null
  service_date: string | null
  quantity: number
  billed_amount: number
  expected_amount: number
  coverage_status: CoverageStatus
  documentation_status: DocumentationStatus
  final_status: FinalStatus
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Supporting documentation attached to one invoice item.
 * Used for manual validation (e.g. transfer receipts, study results).
 */
export interface ItemDocument {
  id: string
  invoice_item_id: string
  document_type: DocumentType
  file_path: string | null
  origin: string | null
  destination: string | null
  kilometers: number | null
  document_date: string | null
  validation_status: ValidationStatus
  notes: string | null
  created_at: string
}
