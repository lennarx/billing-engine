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
      // Fetch all item documents for this invoice in a single query
      const itemIds = items.map((i) => i.id)
      const { data, error: fetchError } = await supabase
        .from('item_documents')
        .select('*')
        .in('invoice_item_id', itemIds)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      const docs = (data ?? []) as ItemDocument[]

      // Group documents by invoice_item_id
      const documentsByItem = new Map<string, ItemDocument[]>()
      for (const doc of docs) {
        const existing = documentsByItem.get(doc.invoice_item_id) ?? []
        existing.push(doc)
        documentsByItem.set(doc.invoice_item_id, existing)
      }

      const csv = buildInvoiceCsv(invoice, items, documentsByItem)

      const today = new Date().toISOString().slice(0, 10)
      const safeNumber = sanitizeFilename(invoice.invoice_number)
      const filename = `billing-engine-${safeNumber}-${today}.csv`

      downloadCsv(filename, csv)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV.')
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
