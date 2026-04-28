import { supabase } from './supabase'
import {
  InvoiceItem,
  InvoicePractice,
  CoverageStatus,
  DocumentationStatus,
  FinalStatus,
} from './types'

export type InvoiceItemWithPractice = InvoiceItem & {
  invoice_practices: InvoicePractice
}

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItemWithPractice[]> {
  const { data, error } = await supabase
    .from('invoice_items')
    .select('*, invoice_practices(*)')
    .eq('invoice_id', invoiceId)
    .order('created_at')

  if (error) throw error
  return (data ?? []) as InvoiceItemWithPractice[]
}

export interface CreateInvoiceItemInput {
  invoice_id: string
  invoice_practice_id: string
  dni: string
  affiliate_number: string | null
  service_date: string | null
  quantity: string
  billed_amount: string
  expected_amount: string
  coverage_status: CoverageStatus
  documentation_status: DocumentationStatus
  final_status: FinalStatus
  notes: string | null
}

export async function createInvoiceItem(input: CreateInvoiceItemInput): Promise<InvoiceItemWithPractice> {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert(input)
    .select('*, invoice_practices(*)')
    .single()

  if (error) throw error
  return data as InvoiceItemWithPractice
}

export interface UpdateInvoiceItemInput {
  invoice_practice_id?: string
  dni?: string
  affiliate_number?: string | null
  service_date?: string | null
  quantity?: string
  billed_amount?: string
  expected_amount?: string
  coverage_status?: CoverageStatus
  documentation_status?: DocumentationStatus
  final_status?: FinalStatus
  notes?: string | null
}

export async function updateInvoiceItem(
  id: string,
  input: UpdateInvoiceItemInput,
): Promise<InvoiceItemWithPractice> {
  const { data, error } = await supabase
    .from('invoice_items')
    .update(input)
    .eq('id', id)
    .select('*, invoice_practices(*)')
    .single()

  if (error) throw error
  return data as InvoiceItemWithPractice
}

export async function deleteInvoiceItem(id: string): Promise<void> {
  const { error } = await supabase.from('invoice_items').delete().eq('id', id)
  if (error) throw error
}
