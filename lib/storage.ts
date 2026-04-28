import { supabase } from './supabase'

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_INVOICES ?? 'invoice-files'

export async function uploadInvoiceFile(file: File, invoiceId: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${invoiceId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error

  return path
}

export function getInvoiceFileUrl(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}
