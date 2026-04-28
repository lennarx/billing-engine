import { supabase } from './supabase'
import { InvoicePractice, UnitType } from './types'

export async function getInvoicePractices(invoiceId: string): Promise<InvoicePractice[]> {
  const { data, error } = await supabase
    .from('invoice_practices')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at')

  if (error) throw error
  return data ?? []
}

export interface CreateInvoicePracticeInput {
  invoice_id: string
  code: string | null
  name: string
  unit_type: UnitType
  nomenclator_value: string
  requires_documentation: boolean
  notes: string | null
}

export async function createInvoicePractice(
  input: CreateInvoicePracticeInput,
): Promise<InvoicePractice> {
  const { data, error } = await supabase
    .from('invoice_practices')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export interface UpdateInvoicePracticeInput {
  code?: string | null
  name?: string
  unit_type?: UnitType
  nomenclator_value?: string
  requires_documentation?: boolean
  notes?: string | null
}

export async function updateInvoicePractice(
  id: string,
  input: UpdateInvoicePracticeInput,
): Promise<InvoicePractice> {
  const { data, error } = await supabase
    .from('invoice_practices')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteInvoicePractice(id: string): Promise<void> {
  const { error } = await supabase.from('invoice_practices').delete().eq('id', id)
  if (error) throw error
}
