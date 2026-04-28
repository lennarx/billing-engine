'use client'

import { useState, useEffect } from 'react'
import {
  getInvoiceItems,
  createInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
  InvoiceItemWithPractice,
} from '@/lib/invoice-items'
import { getInvoicePractices } from '@/lib/invoice-practices'
import {
  InvoicePractice,
  CoverageStatus,
  DocumentationStatus,
  FinalStatus,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COVERAGE_STATUS_OPTIONS: CoverageStatus[] = ['pending', 'active', 'inactive']
const DOCUMENTATION_STATUS_OPTIONS: DocumentationStatus[] = ['pending', 'ok', 'observed', 'not_required']
const FINAL_STATUS_OPTIONS: FinalStatus[] = ['pending', 'approved', 'observed', 'rejected']

const COVERAGE_LABELS: Record<CoverageStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  inactive: 'Inactive',
}

const DOCUMENTATION_LABELS: Record<DocumentationStatus, string> = {
  pending: 'Pending',
  ok: 'OK',
  observed: 'Observed',
  not_required: 'Not required',
}

const FINAL_LABELS: Record<FinalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  observed: 'Observed',
  rejected: 'Rejected',
}

const COVERAGE_COLORS: Record<CoverageStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
}

const DOCUMENTATION_COLORS: Record<DocumentationStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  ok: 'bg-green-100 text-green-800',
  observed: 'bg-orange-100 text-orange-800',
  not_required: 'bg-blue-50 text-blue-700',
}

const FINAL_COLORS: Record<FinalStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-800',
  observed: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface ItemFormState {
  dni: string
  affiliate_number: string
  service_date: string
  invoice_practice_id: string
  quantity: string
  billed_amount: string
  coverage_status: CoverageStatus
  documentation_status: DocumentationStatus
  final_status: FinalStatus
  notes: string
}

const emptyForm = (): ItemFormState => ({
  dni: '',
  affiliate_number: '',
  service_date: '',
  invoice_practice_id: '',
  quantity: '1',
  billed_amount: '0',
  coverage_status: 'pending',
  documentation_status: 'pending',
  final_status: 'pending',
  notes: '',
})

function itemToForm(item: InvoiceItemWithPractice): ItemFormState {
  return {
    dni: item.dni,
    affiliate_number: item.affiliate_number ?? '',
    service_date: item.service_date ?? '',
    invoice_practice_id: item.invoice_practice_id,
    quantity: item.quantity,
    billed_amount: item.billed_amount,
    coverage_status: item.coverage_status,
    documentation_status: item.documentation_status,
    final_status: item.final_status,
    notes: item.notes ?? '',
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcExpectedAmount(quantity: string, nomenclator_value: string): string {
  const q = parseFloat(quantity)
  const v = parseFloat(nomenclator_value)
  if (isNaN(q) || isNaN(v)) return '0'
  return (q * v).toFixed(2)
}

function hasMismatch(billedAmount: string, expectedAmount: string): boolean {
  return parseFloat(billedAmount) !== parseFloat(expectedAmount)
}

function practiceLabel(p: InvoicePractice): string {
  return p.code ? `${p.code} — ${p.name}` : p.name
}

// ---------------------------------------------------------------------------
// Item form component
// ---------------------------------------------------------------------------

interface ItemFormProps {
  initialValues: ItemFormState
  practices: InvoicePractice[]
  onSubmit: (values: ItemFormState) => Promise<void>
  onCancel: () => void
  submitLabel: string
  error: string | null
  saving: boolean
}

function ItemForm({
  initialValues,
  practices,
  onSubmit,
  onCancel,
  submitLabel,
  error,
  saving,
}: ItemFormProps) {
  const [form, setForm] = useState<ItemFormState>(initialValues)

  function set<K extends keyof ItemFormState>(key: K, value: ItemFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const selectedPractice = practices.find((p) => p.id === form.invoice_practice_id) ?? null
  const expectedAmount = selectedPractice
    ? calcExpectedAmount(form.quantity, selectedPractice.nomenclator_value)
    : '0'
  const mismatch = hasMismatch(form.billed_amount, expectedAmount)

  // When practice changes, reset quantity to 1 for fixed unit types
  function handlePracticeChange(practiceId: string) {
    const practice = practices.find((p) => p.id === practiceId)
    setForm((prev) => ({
      ...prev,
      invoice_practice_id: practiceId,
      quantity: practice?.unit_type === 'fixed' ? '1' : prev.quantity,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({ ...form })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 border border-gray-200 rounded-md p-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* DNI + Affiliate */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            DNI <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.dni}
            onChange={(e) => set('dni', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Affiliate Number</label>
          <input
            type="text"
            value={form.affiliate_number}
            onChange={(e) => set('affiliate_number', e.target.value)}
            placeholder="Optional"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Service date + Practice */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Service Date</label>
          <input
            type="date"
            value={form.service_date}
            onChange={(e) => set('service_date', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Invoice Practice <span className="text-red-500">*</span>
          </label>
          <select
            value={form.invoice_practice_id}
            onChange={(e) => handlePracticeChange(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select practice —</option>
            {practices.map((p) => (
              <option key={p.id} value={p.id}>
                {practiceLabel(p)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Practice info */}
      {selectedPractice && (
        <div className="flex gap-4 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
          <span>
            Unit type: <span className="font-medium">{selectedPractice.unit_type}</span>
          </span>
          <span>
            Nomenclator value:{' '}
            <span className="font-medium">
              ${parseFloat(selectedPractice.nomenclator_value).toLocaleString()}
            </span>
          </span>
        </div>
      )}

      {/* Quantity + Billed amount + Expected amount */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Billed Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.billed_amount}
            onChange={(e) => set('billed_amount', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Expected Amount</label>
          <input
            type="text"
            value={`$${parseFloat(expectedAmount).toLocaleString()}`}
            readOnly
            className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>
      </div>

      {mismatch && form.invoice_practice_id && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
          ⚠ Billed amount does not match expected amount.
        </p>
      )}

      {/* Status fields */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Coverage Status</label>
          <select
            value={form.coverage_status}
            onChange={(e) => set('coverage_status', e.target.value as CoverageStatus)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COVERAGE_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{COVERAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Documentation Status</label>
          <select
            value={form.documentation_status}
            onChange={(e) => set('documentation_status', e.target.value as DocumentationStatus)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOCUMENTATION_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{DOCUMENTATION_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Final Status</label>
          <select
            value={form.final_status}
            onChange={(e) => set('final_status', e.target.value as FinalStatus)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FINAL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{FINAL_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          placeholder="Optional"
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main section component
// ---------------------------------------------------------------------------

export default function InvoiceItemsSection({ invoiceId }: { invoiceId: string }) {
  const [practices, setPractices] = useState<InvoicePractice[]>([])
  const [practicesLoading, setPracticesLoading] = useState(true)

  const [items, setItems] = useState<InvoiceItemWithPractice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false

    const loadData = async (background = false) => {
      if (!background) {
        setLoadError(null)
        setPracticesLoading(true)
        setLoading(true)
      }

      try {
        const [fetchedPractices, fetchedItems] = await Promise.all([
          getInvoicePractices(invoiceId),
          getInvoiceItems(invoiceId),
        ])

        if (cancelled) return

        setPractices(fetchedPractices)
        setItems(fetchedItems)
        setLoadError(null)
      } catch (err) {
        if (cancelled) return
        if (!background) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load invoice items.')
        }
      } finally {
        if (cancelled || background) return
        setPracticesLoading(false)
        setLoading(false)
      }
    }

    const refreshOnFocus = () => void loadData(true)
    const refreshOnVisibility = () => {
      if (document.visibilityState === 'visible') void loadData(true)
    }

    void loadData()

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnVisibility)
    const refreshInterval = window.setInterval(() => void loadData(true), 30_000)

    return () => {
      cancelled = true
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnVisibility)
      window.clearInterval(refreshInterval)
    }
  }, [invoiceId])

  async function handleCreate(values: ItemFormState) {
    const practice = practices.find((p) => p.id === values.invoice_practice_id)
    const expectedAmount = practice
      ? calcExpectedAmount(values.quantity, practice.nomenclator_value)
      : '0'

    setCreateSaving(true)
    setCreateError(null)
    try {
      const created = await createInvoiceItem({
        invoice_id: invoiceId,
        invoice_practice_id: values.invoice_practice_id,
        dni: values.dni.trim(),
        affiliate_number: values.affiliate_number.trim() || null,
        service_date: values.service_date || null,
        quantity: values.quantity,
        billed_amount: values.billed_amount,
        expected_amount: expectedAmount,
        coverage_status: values.coverage_status,
        documentation_status: values.documentation_status,
        final_status: values.final_status,
        notes: values.notes.trim() || null,
      })
      setItems((prev) => [...prev, created])
      setShowCreateForm(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create invoice item.')
    } finally {
      setCreateSaving(false)
    }
  }

  async function handleUpdate(id: string, values: ItemFormState) {
    const practice = practices.find((p) => p.id === values.invoice_practice_id)
    const expectedAmount = practice
      ? calcExpectedAmount(values.quantity, practice.nomenclator_value)
      : '0'

    setEditSaving(true)
    setEditError(null)
    try {
      const updated = await updateInvoiceItem(id, {
        invoice_practice_id: values.invoice_practice_id,
        dni: values.dni.trim(),
        affiliate_number: values.affiliate_number.trim() || null,
        service_date: values.service_date || null,
        quantity: values.quantity,
        billed_amount: values.billed_amount,
        expected_amount: expectedAmount,
        coverage_status: values.coverage_status,
        documentation_status: values.documentation_status,
        final_status: values.final_status,
        notes: values.notes.trim() || null,
      })
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update invoice item.')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this invoice item? This cannot be undone.')) return
    setDeletingId(id)
    setDeleteError((prev) => ({ ...prev, [id]: '' }))
    try {
      await deleteInvoiceItem(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes('foreign key')
          ? 'Cannot delete: this item is referenced by other records.'
          : (err instanceof Error ? err.message : 'Failed to delete invoice item.')
      setDeleteError((prev) => ({ ...prev, [id]: msg }))
    } finally {
      setDeletingId(null)
    }
  }

  const noPractices = !practicesLoading && practices.length === 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
        {!showCreateForm && (
          <button
            onClick={() => {
              setShowCreateForm(true)
              setCreateError(null)
            }}
            disabled={noPractices}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Item
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-4">
          <ItemForm
            initialValues={emptyForm()}
            practices={practices}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowCreateForm(false)
              setCreateError(null)
            }}
            submitLabel="Add Item"
            error={createError}
            saving={createSaving}
          />
        </div>
      )}

      {(loading || practicesLoading) && (
        <p className="text-sm text-gray-500">Loading items…</p>
      )}

      {loadError && (
        <p className="text-sm text-red-600">{loadError}</p>
      )}

      {!loading && !loadError && noPractices && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
          <p className="text-sm">Add invoice practices before adding invoice items.</p>
        </div>
      )}

      {!loading && !loadError && !noPractices && items.length === 0 && !showCreateForm && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
          <p className="text-sm">No invoice items loaded for this invoice yet.</p>
        </div>
      )}

      {!loading && !loadError && items.length > 0 && (
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const mismatch = hasMismatch(item.billed_amount, item.expected_amount)
            return (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                {editingId === item.id ? (
                  <ItemForm
                    initialValues={itemToForm(item)}
                    practices={practices}
                    onSubmit={(values) => handleUpdate(item.id, values)}
                    onCancel={() => {
                      setEditingId(null)
                      setEditError(null)
                    }}
                    submitLabel="Save Changes"
                    error={editError}
                    saving={editSaving}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      {/* Row 1: identifiers + practice */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">DNI {item.dni}</span>
                        {item.affiliate_number && (
                          <span className="text-xs text-gray-500">· Affiliate {item.affiliate_number}</span>
                        )}
                        {item.service_date && (
                          <span className="text-xs text-gray-500">· {item.service_date}</span>
                        )}
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {item.invoice_practices.name}
                        </span>
                      </div>

                      {/* Row 2: amounts */}
                      <div className="flex items-center gap-4 text-sm text-gray-700 flex-wrap">
                        <span>Qty: <span className="font-medium">{parseFloat(item.quantity).toLocaleString()}</span></span>
                        <span>
                          Billed:{' '}
                          <span className="font-medium">${parseFloat(item.billed_amount).toLocaleString()}</span>
                        </span>
                        <span>
                          Expected:{' '}
                          <span className="font-medium">${parseFloat(item.expected_amount).toLocaleString()}</span>
                        </span>
                      </div>

                      {mismatch && (
                        <p className="text-xs text-amber-700">
                          ⚠ Billed amount does not match expected amount.
                        </p>
                      )}

                      {/* Row 3: status badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${COVERAGE_COLORS[item.coverage_status]}`}>
                          {COVERAGE_LABELS[item.coverage_status]}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${DOCUMENTATION_COLORS[item.documentation_status]}`}>
                          {DOCUMENTATION_LABELS[item.documentation_status]}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${FINAL_COLORS[item.final_status]}`}>
                          {FINAL_LABELS[item.final_status]}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-gray-500">{item.notes}</p>
                      )}

                      {deleteError[item.id] && (
                        <p className="text-xs text-red-600 mt-1">{deleteError[item.id]}</p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(item.id)
                          setEditError(null)
                        }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === item.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
