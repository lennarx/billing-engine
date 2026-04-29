import { InvoiceWithProvider } from './invoices'
import { InvoiceItemWithPractice } from './invoice-items'
import { ItemDocument } from './types'

// ---------------------------------------------------------------------------
// Cell helpers
// ---------------------------------------------------------------------------

/**
 * Wrap a value in double-quotes, escape internal double-quotes, and neutralize
 * spreadsheet formula injection (values starting with =, +, -, or @).
 */
export function escapeCell(value: string | null | undefined): string {
  const str = value ?? ''
  const safe = /^[=+\-@]/.test(str.trimStart()) ? `'${str}` : str
  return `"${safe.replace(/"/g, '""')}"`
}

/**
 * Format a DbNumeric string (e.g. "1234.50") to a plain decimal number string
 * suitable for Excel (no currency symbols, locale-independent decimal point).
 * Returns "0.00" for null/empty values.
 */
export function formatAmount(value: string | null | undefined): string {
  const n = parseFloat(value ?? '')
  if (isNaN(n)) return '0.00'
  return n.toFixed(2)
}

/** Strip characters that are unsafe in filenames, collapse runs to a single hyphen. */
export function sanitizeFilename(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_\-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// CSV builder
// ---------------------------------------------------------------------------

const HEADERS = [
  'provider_name',
  'invoice_number',
  'invoice_date',
  'invoice_status',
  'invoice_total_amount',
  'dni',
  'affiliate_number',
  'service_date',
  'practice_code',
  'practice_name',
  'unit_type',
  'quantity',
  'nomenclator_value',
  'billed_amount',
  'expected_amount',
  'amount_difference',
  'amount_matches',
  'coverage_status',
  'documentation_status',
  'final_status',
  'notes',
  'documents_count',
  'document_types',
  'document_validation_statuses',
]

/**
 * Build a UTF-8 BOM CSV string for a single invoice.
 *
 * @param invoice  Invoice with joined provider name.
 * @param items    All invoice items for this invoice (with joined practice).
 * @param documents  All item documents for this invoice, keyed by invoice_item_id.
 */
export function buildInvoiceCsv(
  invoice: InvoiceWithProvider,
  items: InvoiceItemWithPractice[],
  documentsByItem: Map<string, ItemDocument[]>,
): string {
  const providerName = invoice.providers?.name ?? ''
  const rows: string[] = []

  // Header row
  rows.push(HEADERS.map(escapeCell).join(','))

  for (const item of items) {
    const practice = item.invoice_practices
    const docs = documentsByItem.get(item.id) ?? []

    const billedAmount = formatAmount(item.billed_amount)
    const expectedAmount = formatAmount(item.expected_amount)
    const billedNum = parseFloat(billedAmount)
    const expectedNum = parseFloat(expectedAmount)
    const amountDifference = (billedNum - expectedNum).toFixed(2)
    const amountMatches = billedNum === expectedNum ? 'true' : 'false'

    const documentsCount = String(docs.length)
    const documentTypes = docs.map((d) => d.document_type).join(', ')
    const documentValidationStatuses = docs.map((d) => d.validation_status).join(', ')

    const cells = [
      escapeCell(providerName),
      escapeCell(invoice.invoice_number),
      escapeCell(invoice.invoice_date),
      escapeCell(invoice.status),
      formatAmount(invoice.total_amount),
      escapeCell(item.dni),
      escapeCell(item.affiliate_number),
      escapeCell(item.service_date),
      escapeCell(practice?.code),
      escapeCell(practice?.name),
      escapeCell(practice?.unit_type),
      formatAmount(item.quantity),
      formatAmount(practice?.nomenclator_value),
      billedAmount,
      expectedAmount,
      amountDifference,
      amountMatches,
      escapeCell(item.coverage_status),
      escapeCell(item.documentation_status),
      escapeCell(item.final_status),
      escapeCell(item.notes),
      escapeCell(documentsCount),
      escapeCell(documentTypes),
      escapeCell(documentValidationStatuses),
    ]

    rows.push(cells.join(','))
  }

  // UTF-8 BOM so Excel opens accents correctly
  return '\uFEFF' + rows.join('\r\n')
}

// ---------------------------------------------------------------------------
// Download trigger
// ---------------------------------------------------------------------------

/** Trigger a CSV file download in the browser. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
