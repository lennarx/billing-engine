import { supabase } from './supabase'
import { Invoice, InvoiceStatus } from './types'

export type InvoiceWithProvider = Invoice & {
  providers: { name: string }
}

export async function getInvoices(): Promise<InvoiceWithProvider[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, providers(name)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as InvoiceWithProvider[]
}

export async function getInvoiceById(id: string): Promise<InvoiceWithProvider | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, providers(name)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as InvoiceWithProvider
}

export interface CreateInvoiceInput {
  provider_id: string
  invoice_number: string
  invoice_date: string | null
  status: InvoiceStatus
  total_amount: string | null
  notes: string | null
  file_path?: string | null
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export interface UpdateInvoiceInput {
  provider_id?: string
  invoice_number?: string
  invoice_date?: string | null
  status?: InvoiceStatus
  total_amount?: string | null
  notes?: string | null
  file_path?: string | null
}

export async function updateInvoice(id: string, input: UpdateInvoiceInput): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
