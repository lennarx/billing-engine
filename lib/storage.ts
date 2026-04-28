import { supabase } from './supabase'

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_INVOICES ?? 'invoice-files'

const DOCUMENTS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_DOCUMENTS ?? 'item-documents'

export async function uploadInvoiceFile(file: File, invoiceId: string): Promise<string> {
  const nameParts = file.name.split('.')
  const ext = nameParts.length > 1 ? nameParts.pop() : 'bin'
  const path = `${invoiceId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error

  return path
}

/**
 * Returns the public URL for a stored invoice file.
 * Requires the bucket to be configured as public in Supabase Storage.
 * For production use with private buckets, switch to createSignedUrl().
 */
export function getInvoiceFileUrl(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

export async function uploadItemDocumentFile(file: File, itemId: string): Promise<string> {
  const nameParts = file.name.split('.')
  const ext = nameParts.length > 1 ? nameParts.pop() : 'bin'
  const path = `${itemId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file)
  if (error) throw error

  return path
}

/**
 * Returns the public URL for a stored item document file.
 * Requires the item-documents bucket to be configured as public.
 */
export function getItemDocumentFileUrl(filePath: string): string {
  const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}
