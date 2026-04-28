'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  getInvoiceItems,
  createInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
  InvoiceItemWithPractice,
} from '@/lib/invoice-items'
import { getInvoicePractices } from '@/lib/invoice-practices'
import { getItemDocuments, updateItemDocument } from '@/lib/item-documents'
import { validateInvoiceItem } from '@/lib/validation'
import { updateInvoice } from '@/lib/invoices'
import {
  InvoicePractice,
  InvoiceStatus,
  CoverageStatus,
  DocumentationStatus,
  FinalStatus,
} from '@/lib/types'
import ItemDocumentsPanel from './ItemDocumentsPanel'

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
  allItems: InvoiceItemWithPractice[]
  onSubmit: (values: ItemFormState) => Promise<void>
  onCancel: () => void
  submitLabel: string
  error: string | null
  saving: boolean
}

function ItemForm({
  initialValues,
  practices,
  allItems,
  onSubmit,
  onCancel,
  submitLabel,
  error,
  saving,
}: ItemFormProps) {
  const [form, setForm] = useState<ItemFormState>(initialValues)
  const [affiliateSuggested, setAffiliateSuggested] = useState(false)

  function set<K extends keyof ItemFormState>(key: K, value: ItemFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleDniChange(dni: string) {
    setForm((prev) => {
      const next = { ...prev, dni }
      // Auto-fill affiliate_number if blank and a previous entry exists for this DNI
      if (!prev.affiliate_number) {
        const match = [...allItems]
          .reverse()
          .find((i) => i.dni === dni.trim() && i.affiliate_number)
        if (match?.affiliate_number) {
          setAffiliateSuggested(true)
          return { ...next, affiliate_number: match.affiliate_number }
        }
      }
      setAffiliateSuggested(false)
      return next
    })
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
            onChange={(e) => handleDniChange(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Affiliate Number</label>
          <input
            type="text"
            value={form.affiliate_number}
            onChange={(e) => {
              setAffiliateSuggested(false)
              set('affiliate_number', e.target.value)
            }}
            placeholder="Optional"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {affiliateSuggested && (
            <p className="text-xs text-blue-600 mt-0.5">Auto-filled from previous entry</p>
          )}
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

export default function InvoiceItemsSection({
  invoiceId,
  onStatusUpdated,
}: {
  invoiceId: string
  onStatusUpdated?: (status: InvoiceStatus) => void
}) {
  const [practices, setPractices] = useState<InvoicePractice[]>([])
  const [practicesLoading, setPracticesLoading] = useState(true)

  const [items, setItems] = useState<InvoiceItemWithPractice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Create form — supports pre-filling for duplicate action
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createFormInitialValues, setCreateFormInitialValues] = useState<ItemFormState>(emptyForm)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const createFormRef = useRef<HTMLDivElement>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<Record<string, string>>({})

  const [recalcId, setRecalcId] = useState<string | null>(null)
  const [recalcError, setRecalcError] = useState<Record<string, string>>({})
  const [recalcAllRunning, setRecalcAllRunning] = useState(false)
  const [recalcAllError, setRecalcAllError] = useState<string | null>(null)

  const [applyingStatus, setApplyingStatus] = useState(false)
  const [applyStatusError, setApplyStatusError] = useState<string | null>(null)

  // Filters
  const [filterDni, setFilterDni] = useState('')
  const [filterFinalStatus, setFilterFinalStatus] = useState<FinalStatus | ''>('')
  const [filterCoverageStatus, setFilterCoverageStatus] = useState<CoverageStatus | ''>('')
  const [filterDocStatus, setFilterDocStatus] = useState<DocumentationStatus | ''>('')
  const [filterMismatchOnly, setFilterMismatchOnly] = useState(false)
  const [filterDocIssuesOnly, setFilterDocIssuesOnly] = useState(false)

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

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterDni && !item.dni.toLowerCase().includes(filterDni.toLowerCase())) return false
      if (filterFinalStatus && item.final_status !== filterFinalStatus) return false
      if (filterCoverageStatus && item.coverage_status !== filterCoverageStatus) return false
      if (filterDocStatus && item.documentation_status !== filterDocStatus) return false
      if (filterMismatchOnly && !hasMismatch(item.billed_amount, item.expected_amount)) return false
      if (filterDocIssuesOnly && item.documentation_status !== 'pending' && item.documentation_status !== 'observed') return false
      return true
    })
  }, [items, filterDni, filterFinalStatus, filterCoverageStatus, filterDocStatus, filterMismatchOnly, filterDocIssuesOnly])

  const hasActiveFilters = !!(filterDni || filterFinalStatus || filterCoverageStatus || filterDocStatus || filterMismatchOnly || filterDocIssuesOnly)

  const summary = useMemo(() => {
    const totalBilled = items.reduce((sum, i) => sum + parseFloat(i.billed_amount), 0)
    const totalExpected = items.reduce((sum, i) => sum + parseFloat(i.expected_amount), 0)
    return {
      total: items.length,
      approved: items.filter((i) => i.final_status === 'approved').length,
      observed: items.filter((i) => i.final_status === 'observed').length,
      rejected: items.filter((i) => i.final_status === 'rejected').length,
      pending: items.filter((i) => i.final_status === 'pending').length,
      inactiveCoverage: items.filter((i) => i.coverage_status === 'inactive').length,
      amountMismatch: items.filter((i) => hasMismatch(i.billed_amount, i.expected_amount)).length,
      pendingDocs: items.filter((i) => i.documentation_status === 'pending').length,
      observedDocs: items.filter((i) => i.documentation_status === 'observed').length,
      totalBilled,
      totalExpected,
      difference: totalBilled - totalExpected,
    }
  }, [items])

  const suggestedStatus = useMemo((): InvoiceStatus => {
    if (items.length === 0) return 'draft'
    if (items.some((i) => i.final_status === 'rejected')) return 'observed'
    if (items.some((i) => i.final_status === 'observed')) return 'observed'
    if (items.some((i) => i.final_status === 'pending')) return 'in_review'
    return 'validated'
  }, [items])

  function clearFilters() {
    setFilterDni('')
    setFilterFinalStatus('')
    setFilterCoverageStatus('')
    setFilterDocStatus('')
    setFilterMismatchOnly(false)
    setFilterDocIssuesOnly(false)
  }

  async function handleApplySuggestedStatus() {
    setApplyingStatus(true)
    setApplyStatusError(null)
    try {
      await updateInvoice(invoiceId, { status: suggestedStatus })
      onStatusUpdated?.(suggestedStatus)
    } catch (err) {
      setApplyStatusError(err instanceof Error ? err.message : 'Failed to update invoice status.')
    } finally {
      setApplyingStatus(false)
    }
  }

  function handleDuplicate(item: InvoiceItemWithPractice) {
    setCreateFormInitialValues({
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
    })
    setShowCreateForm(true)
    setCreateError(null)
    setTimeout(() => {
      createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

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
      setCreateFormInitialValues(emptyForm())
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

  async function recalculateItem(item: InvoiceItemWithPractice): Promise<InvoiceItemWithPractice> {
    const practice = item.invoice_practices
    const documents = await getItemDocuments(item.id)
    const result = validateInvoiceItem(item, practice, documents)

    // Update each document whose validation_status changed
    await Promise.all(
      result.documentUpdates
        .filter((u) => {
          const doc = documents.find((d) => d.id === u.id)
          return doc && doc.validation_status !== u.validation_status
        })
        .map((u) => updateItemDocument(u.id, { validation_status: u.validation_status })),
    )

    // Update the invoice item
    const updated = await updateInvoiceItem(item.id, {
      documentation_status: result.documentation_status,
      final_status: result.final_status,
    })

    return updated
  }

  async function handleRecalculate(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    setRecalcId(id)
    setRecalcError((prev) => ({ ...prev, [id]: '' }))
    try {
      const updated = await recalculateItem(item)
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
    } catch (err) {
      setRecalcError((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : 'Failed to recalculate status.',
      }))
    } finally {
      setRecalcId(null)
    }
  }

  async function handleRecalculateAll() {
    setRecalcAllRunning(true)
    setRecalcAllError(null)
    try {
      const updatedItems = [...items]
      for (let i = 0; i < updatedItems.length; i++) {
        const updated = await recalculateItem(updatedItems[i])
        updatedItems[i] = updated
      }
      setItems(updatedItems)
    } catch (err) {
      setRecalcAllError(err instanceof Error ? err.message : 'Failed to recalculate all items.')
    } finally {
      setRecalcAllRunning(false)
    }
  }

  const noPractices = !practicesLoading && practices.length === 0

  const STATUS_COLORS: Record<InvoiceStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    in_review: 'bg-yellow-100 text-yellow-800',
    validated: 'bg-green-100 text-green-800',
    observed: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => void handleRecalculateAll()}
              disabled={recalcAllRunning}
              className="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {recalcAllRunning ? 'Recalculating…' : 'Recalculate all item statuses'}
            </button>
          )}
          {!showCreateForm && (
            <button
              onClick={() => {
                setCreateFormInitialValues(emptyForm())
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
      </div>

      {recalcAllError && (
        <p className="text-sm text-red-600 mb-4">{recalcAllError}</p>
      )}

      {/* Summary counters */}
      {!loading && !loadError && (
        <div className="mb-6 space-y-3">
          {/* Item status counts */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {([
              { label: 'Total', value: summary.total, color: 'bg-gray-50 border-gray-200 text-gray-700' },
              { label: 'Approved', value: summary.approved, color: 'bg-green-50 border-green-200 text-green-800' },
              { label: 'Observed', value: summary.observed, color: 'bg-orange-50 border-orange-200 text-orange-800' },
              { label: 'Rejected', value: summary.rejected, color: 'bg-red-50 border-red-200 text-red-800' },
              { label: 'Pending', value: summary.pending, color: 'bg-gray-50 border-gray-200 text-gray-500' },
            ] as const).map(({ label, value, color }) => (
              <div key={label} className={`border rounded-md px-3 py-2 text-center ${color}`}>
                <div className="text-lg font-bold">{value}</div>
                <div className="text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Issue flags */}
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-red-200 rounded-md px-3 py-2 text-center bg-red-50">
              <div className="text-lg font-bold text-red-700">{summary.inactiveCoverage}</div>
              <div className="text-xs text-red-600 mt-0.5">Inactive coverage</div>
            </div>
            <div className="border border-amber-200 rounded-md px-3 py-2 text-center bg-amber-50">
              <div className="text-lg font-bold text-amber-700">{summary.amountMismatch}</div>
              <div className="text-xs text-amber-600 mt-0.5">Amount mismatch</div>
            </div>
            <div className="border border-gray-200 rounded-md px-3 py-2 text-center bg-gray-50">
              <div className="text-lg font-bold text-gray-700">{summary.pendingDocs}</div>
              <div className="text-xs text-gray-500 mt-0.5">Pending docs</div>
            </div>
          </div>

          {/* Amount summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
              <div className="text-xs text-gray-500 mb-0.5">Total billed</div>
              <div className="text-sm font-semibold text-gray-900">${summary.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
              <div className="text-xs text-gray-500 mb-0.5">Total expected</div>
              <div className="text-sm font-semibold text-gray-900">${summary.totalExpected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className={`border rounded-md px-3 py-2 ${summary.difference !== 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-xs text-gray-500 mb-0.5">Difference</div>
              <div className={`text-sm font-semibold ${summary.difference !== 0 ? 'text-amber-700' : 'text-gray-900'}`}>
                {summary.difference >= 0 ? '+' : ''}${summary.difference.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Suggested invoice status */}
          <div className="flex items-center gap-3 border border-gray-200 rounded-md px-4 py-2.5 bg-gray-50">
            <span className="text-xs text-gray-500 shrink-0">Suggested invoice status:</span>
            <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[suggestedStatus]}`}>
              {suggestedStatus}
            </span>
            <button
              onClick={() => void handleApplySuggestedStatus()}
              disabled={applyingStatus}
              className="ml-auto px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-white disabled:opacity-50 transition-colors"
            >
              {applyingStatus ? 'Applying…' : 'Apply suggested status'}
            </button>
            {applyStatusError && (
              <span className="text-xs text-red-600">{applyStatusError}</span>
            )}
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-4" ref={createFormRef}>
          <ItemForm
            initialValues={createFormInitialValues}
            practices={practices}
            allItems={items}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowCreateForm(false)
              setCreateError(null)
              setCreateFormInitialValues(emptyForm())
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

      {/* Filters */}
      {!loading && !loadError && items.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">DNI</label>
              <input
                type="text"
                value={filterDni}
                onChange={(e) => setFilterDni(e.target.value)}
                placeholder="Search DNI…"
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Final status</label>
              <select
                value={filterFinalStatus}
                onChange={(e) => setFilterFinalStatus(e.target.value as FinalStatus | '')}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {FINAL_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{FINAL_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Coverage</label>
              <select
                value={filterCoverageStatus}
                onChange={(e) => setFilterCoverageStatus(e.target.value as CoverageStatus | '')}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {COVERAGE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{COVERAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Docs</label>
              <select
                value={filterDocStatus}
                onChange={(e) => setFilterDocStatus(e.target.value as DocumentationStatus | '')}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {DOCUMENTATION_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{DOCUMENTATION_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterMismatchOnly}
                onChange={(e) => setFilterMismatchOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              Mismatch only
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterDocIssuesOnly}
                onChange={(e) => setFilterDocIssuesOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              Doc issues only
            </label>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          {(hasActiveFilters || filteredItems.length !== items.length) && (
            <p className="text-xs text-gray-500">
              Showing {filteredItems.length} of {items.length} items
            </p>
          )}
        </div>
      )}

      {/* Item list */}
      {!loading && !loadError && items.length > 0 && (
        <div className="divide-y divide-gray-100">
          {filteredItems.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No items match the current filters.</p>
          )}
          {filteredItems.map((item) => {
            const mismatch = hasMismatch(item.billed_amount, item.expected_amount)
            return (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                {editingId === item.id ? (
                  <ItemForm
                    initialValues={itemToForm(item)}
                    practices={practices}
                    allItems={items}
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

                      {item.coverage_status === 'inactive' && (
                        <p className="text-xs text-red-700">
                          ⚠ Inactive coverage.
                        </p>
                      )}

                      {item.documentation_status === 'pending' && item.invoice_practices.requires_documentation && (
                        <p className="text-xs text-amber-700">
                          ⚠ Documentation required but not yet attached.
                        </p>
                      )}

                      {/* Row 3: status badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${COVERAGE_COLORS[item.coverage_status]}`}>
                          {COVERAGE_LABELS[item.coverage_status]}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${DOCUMENTATION_COLORS[item.documentation_status]}`}>
                          {DOCUMENTATION_LABELS[item.documentation_status]}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${FINAL_COLORS[item.final_status]}`}>
                          {FINAL_LABELS[item.final_status]}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-gray-500">{item.notes}</p>
                      )}

                      {deleteError[item.id] && (
                        <p className="text-xs text-red-600 mt-1">{deleteError[item.id]}</p>
                      )}

                      {recalcError[item.id] && (
                        <p className="text-xs text-red-600 mt-1">{recalcError[item.id]}</p>
                      )}

                      <ItemDocumentsPanel invoiceItemId={item.id} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0 items-end">
                      <button
                        onClick={() => void handleRecalculate(item.id)}
                        disabled={recalcId === item.id || recalcAllRunning}
                        className="text-sm text-gray-600 hover:underline disabled:opacity-50 whitespace-nowrap"
                      >
                        {recalcId === item.id ? 'Recalculating…' : 'Recalculate status'}
                      </button>
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
                        onClick={() => handleDuplicate(item)}
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        Duplicate
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
