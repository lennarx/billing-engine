import { supabase } from './supabase'
import { ItemDocument, DocumentType, ValidationStatus } from './types'

export async function getItemDocuments(invoiceItemId: string): Promise<ItemDocument[]> {
  const { data, error } = await supabase
    .from('item_documents')
    .select('*')
    .eq('invoice_item_id', invoiceItemId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as ItemDocument[]
}

export interface CreateItemDocumentInput {
  invoice_item_id: string
  document_type: DocumentType
  file_path?: string | null
  origin?: string | null
  destination?: string | null
  kilometers?: string | null
  document_date?: string | null
  validation_status?: ValidationStatus
  notes?: string | null
}

export async function createItemDocument(input: CreateItemDocumentInput): Promise<ItemDocument> {
  const { data, error } = await supabase
    .from('item_documents')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as ItemDocument
}

export interface UpdateItemDocumentInput {
  document_type?: DocumentType
  file_path?: string | null
  origin?: string | null
  destination?: string | null
  kilometers?: string | null
  document_date?: string | null
  validation_status?: ValidationStatus
  notes?: string | null
}

export async function updateItemDocument(
  id: string,
  input: UpdateItemDocumentInput,
): Promise<ItemDocument> {
  const { data, error } = await supabase
    .from('item_documents')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ItemDocument
}

export async function deleteItemDocument(id: string): Promise<void> {
  const { error } = await supabase.from('item_documents').delete().eq('id', id)
  if (error) throw error
}
