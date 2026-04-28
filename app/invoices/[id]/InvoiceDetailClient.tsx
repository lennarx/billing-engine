'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getInvoiceById, updateInvoice, InvoiceWithProvider } from '@/lib/invoices'
import { uploadInvoiceFile, getInvoiceFileUrl } from '@/lib/storage'
import { Provider, InvoiceStatus } from '@/lib/types'

const STATUS_OPTIONS: InvoiceStatus[] = ['draft', 'in_review', 'validated', 'observed', 'rejected']

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  in_review: 'bg-yellow-100 text-yellow-800',
  validated: 'bg-green-100 text-green-800',
  observed: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function InvoiceDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<InvoiceWithProvider | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // edit form state
  const [providerId, setProviderId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [status, setStatus] = useState<InvoiceStatus>('draft')
  const [totalAmount, setTotalAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    Promise.all([
      getInvoiceById(id),
      supabase.from('providers').select('*').order('name'),
    ]).then(([inv, { data: prov }]) => {
      if (!inv) {
        setLoadError('Invoice not found.')
        return
      }
      setInvoice(inv)
      setProviders(prov ?? [])
    }).catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load invoice.'))
  }, [id])

  function startEditing() {
    if (!invoice) return
    setProviderId(invoice.provider_id)
    setInvoiceNumber(invoice.invoice_number)
    setInvoiceDate(invoice.invoice_date ?? '')
    setStatus(invoice.status)
    setTotalAmount(invoice.total_amount ?? '')
    setNotes(invoice.notes ?? '')
    setFile(null)
    setSaveError(null)
    setEditing(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!invoice) return
    setSaving(true)
    setSaveError(null)

    try {
      let filePath = invoice.file_path

      if (file) {
        filePath = await uploadInvoiceFile(file, invoice.id)
      }

      const updated = await updateInvoice(invoice.id, {
        provider_id: providerId,
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate || null,
        status,
        total_amount: totalAmount || null,
        notes: notes.trim() || null,
        file_path: filePath,
      })

      // Re-fetch to get provider name
      const fresh = await getInvoiceById(updated.id)
      setInvoice(fresh)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/invoices" className="text-sm text-blue-600 hover:underline">← Back to Invoices</Link>
        <p className="text-red-600 text-sm">{loadError}</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Link href="/invoices" className="text-sm text-blue-600 hover:underline">← Back to Invoices</Link>
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  const fileUrl = invoice.file_path ? getInvoiceFileUrl(invoice.file_path) : null
  const isImage = invoice.file_path
    ? /\.(png|jpe?g|gif|webp)$/i.test(invoice.file_path)
    : false

  return (
    <div className="space-y-8 max-w-3xl">
      <Link href="/invoices" className="text-sm text-blue-600 hover:underline">
        ← Back to Invoices
      </Link>

      {/* Invoice metadata */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Created {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusColors[invoice.status] ?? ''}`}>
              {invoice.status}
            </span>
            {!editing && (
              <button
                onClick={startEditing}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
                {saveError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider <span className="text-red-500">*</span>
              </label>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Replace Invoice File (PDF or image)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded-md file:text-sm file:bg-gray-50 hover:file:bg-gray-100"
              />
              {invoice.file_path && !file && (
                <p className="text-xs text-gray-400 mt-1">Current file will be kept unless you select a new one.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-gray-500 uppercase">Provider</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{invoice.providers?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase">Invoice Date</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{invoice.invoice_date ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase">Total Amount</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {invoice.total_amount != null
                  ? `$${parseFloat(invoice.total_amount).toLocaleString()}`
                  : '—'}
              </dd>
            </div>
            {invoice.notes && (
              <div className="col-span-2 sm:col-span-4">
                <dt className="text-xs text-gray-500 uppercase">Notes</dt>
                <dd className="mt-1 text-sm text-gray-700">{invoice.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Invoice file */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Document</h2>
        {fileUrl ? (
          <div className="space-y-3">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Open / Download invoice file
            </a>
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl}
                alt="Invoice preview"
                className="max-w-full max-h-96 rounded-md border border-gray-200 mt-3"
              />
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
            <p className="text-sm">No document uploaded yet.</p>
            <button
              onClick={startEditing}
              className="text-blue-600 hover:underline text-xs mt-1"
            >
              Edit invoice to upload a file.
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
