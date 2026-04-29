'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { InvoiceWithProvider } from '@/lib/invoices'
import { InvoiceItemWithPractice } from '@/lib/invoice-items'
import { ItemDocument } from '@/lib/types'
import { buildInvoiceCsv, downloadCsv, sanitizeFilename } from '@/lib/export'

interface ExportCsvButtonProps {
  invoice: InvoiceWithProvider
  items: InvoiceItemWithPractice[]
}

export default function ExportCsvButton({ invoice, items }: ExportCsvButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmpty = items.length === 0

  async function handleExport() {
    setLoading(true)
    setError(null)
    try {
      // Fetch all item documents for this invoice via a join on invoice_items,
      // filtering by invoice_id — avoids building a large IN(...) list of item IDs.
      const { data, error: fetchError } = await supabase
        .from('invoice_items')
        .select('item_documents(*)')
        .eq('invoice_id', invoice.id)
        .order('created_at', { ascending: true, referencedTable: 'item_documents' })

      if (fetchError) throw fetchError

      const docs = ((data ?? []) as Array<{ item_documents: ItemDocument[] | null }>)
        .flatMap((row) => row.item_documents ?? [])

      // Group documents by invoice_item_id
      const documentsByItem = new Map<string, ItemDocument[]>()
      for (const doc of docs) {
        const existing = documentsByItem.get(doc.invoice_item_id) ?? []
        existing.push(doc)
        documentsByItem.set(doc.invoice_item_id, existing)
      }

      const csv = buildInvoiceCsv(invoice, items, documentsByItem)

      // Use local date so the filename matches the user's timezone
      const now = new Date()
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-')
      const safeNumber = sanitizeFilename(invoice.invoice_number)
      const filename = `billing-engine-${safeNumber}-${today}.csv`

      downloadCsv(filename, csv)
    } catch (err) {
      // PostgrestError is not an Error instance but always has a message property
      const msg =
        err instanceof Error
          ? err.message
          : typeof (err as { message?: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Failed to export CSV.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => void handleExport()}
        disabled={isEmpty || loading}
        title={isEmpty ? 'No invoice items to export.' : undefined}
        className="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Exporting…' : 'Export CSV'}
      </button>
      {isEmpty && (
        <span className="text-xs text-gray-400">No invoice items to export.</span>
      )}
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
