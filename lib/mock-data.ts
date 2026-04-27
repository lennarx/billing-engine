export type InvoiceStatus = 'pending' | 'validated' | 'rejected'
export type CoverageStatus = 'covered' | 'not_covered' | 'partial'

export interface Practice {
  id: string
  invoice_id: string
  name: string
  /** Nomenclator value for this practice within this invoice (not global) */
  nomenclator_value: number
  unit: string
}

export interface AffiliateItem {
  id: string
  invoice_id: string
  practice_id: string
  affiliate_name: string
  quantity: number
  /** quantity × practice.nomenclator_value */
  expected_amount: number
  coverage_status: CoverageStatus
  notes: string
}

export interface Invoice {
  id: string
  provider_name: string
  invoice_number: string
  invoice_date: string
  total_amount: number
  status: InvoiceStatus
  file_url: string | null
  created_at: string
  practices: Practice[]
  affiliate_items: AffiliateItem[]
}

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    provider_name: 'Hospital Italiano',
    invoice_number: 'INV-2024-001',
    invoice_date: '2024-01-15',
    total_amount: 185000,
    status: 'pending',
    file_url: null,
    created_at: '2024-01-15T10:00:00Z',
    practices: [
      { id: 'p1', invoice_id: '1', name: 'Ergometría', nomenclator_value: 10000, unit: 'per session' },
      { id: 'p2', invoice_id: '1', name: 'Traslado', nomenclator_value: 500, unit: 'per km' },
      { id: 'p3', invoice_id: '1', name: 'Radiografía', nomenclator_value: 7000, unit: 'per session' },
    ],
    affiliate_items: [
      {
        id: 'a1', invoice_id: '1', practice_id: 'p1',
        affiliate_name: 'Juan Pérez', quantity: 2, expected_amount: 20000,
        coverage_status: 'covered', notes: '',
      },
      {
        id: 'a2', invoice_id: '1', practice_id: 'p2',
        affiliate_name: 'Juan Pérez', quantity: 30, expected_amount: 15000,
        coverage_status: 'covered', notes: '30 km transfer',
      },
      {
        id: 'a3', invoice_id: '1', practice_id: 'p3',
        affiliate_name: 'María González', quantity: 1, expected_amount: 7000,
        coverage_status: 'partial', notes: 'Requires additional documentation',
      },
      {
        id: 'a4', invoice_id: '1', practice_id: 'p1',
        affiliate_name: 'Carlos López', quantity: 1, expected_amount: 10000,
        coverage_status: 'not_covered', notes: 'Outside coverage period',
      },
    ],
  },
  {
    id: '2',
    provider_name: 'Clínica Santa Fe',
    invoice_number: 'INV-2024-002',
    invoice_date: '2024-01-20',
    total_amount: 42000,
    status: 'validated',
    file_url: null,
    created_at: '2024-01-20T14:30:00Z',
    practices: [
      { id: 'p4', invoice_id: '2', name: 'Consulta médica', nomenclator_value: 6000, unit: 'per session' },
      { id: 'p5', invoice_id: '2', name: 'Análisis de sangre', nomenclator_value: 4500, unit: 'per session' },
    ],
    affiliate_items: [
      {
        id: 'a5', invoice_id: '2', practice_id: 'p4',
        affiliate_name: 'Ana Rodríguez', quantity: 3, expected_amount: 18000,
        coverage_status: 'covered', notes: '',
      },
      {
        id: 'a6', invoice_id: '2', practice_id: 'p5',
        affiliate_name: 'Ana Rodríguez', quantity: 2, expected_amount: 9000,
        coverage_status: 'covered', notes: '',
      },
      {
        id: 'a7', invoice_id: '2', practice_id: 'p4',
        affiliate_name: 'Luis Fernández', quantity: 2, expected_amount: 12000,
        coverage_status: 'covered', notes: '',
      },
      {
        id: 'a8', invoice_id: '2', practice_id: 'p5',
        affiliate_name: 'Luis Fernández', quantity: 1, expected_amount: 4500,
        coverage_status: 'covered', notes: '',
      },
    ],
  },
  {
    id: '3',
    provider_name: 'Centro Diagnóstico Belgrano',
    invoice_number: 'INV-2024-003',
    invoice_date: '2024-02-05',
    total_amount: 28000,
    status: 'rejected',
    file_url: null,
    created_at: '2024-02-05T09:15:00Z',
    practices: [
      { id: 'p6', invoice_id: '3', name: 'Tomografía', nomenclator_value: 28000, unit: 'per session' },
    ],
    affiliate_items: [
      {
        id: 'a9', invoice_id: '3', practice_id: 'p6',
        affiliate_name: 'Roberto Silva', quantity: 1, expected_amount: 28000,
        coverage_status: 'not_covered', notes: 'Not included in plan',
      },
    ],
  },
]

export function getInvoiceById(id: string): Invoice | undefined {
  return mockInvoices.find((inv) => inv.id === id)
}

export function getPracticeById(invoice: Invoice, practiceId: string): Practice | undefined {
  return invoice.practices.find((p) => p.id === practiceId)
}
