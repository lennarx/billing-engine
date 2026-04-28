'use client'

import { useState, useEffect } from 'react'
import {
  getInvoicePractices,
  createInvoicePractice,
  updateInvoicePractice,
  deleteInvoicePractice,
} from '@/lib/invoice-practices'
import { InvoicePractice, UnitType } from '@/lib/types'

const UNIT_TYPE_OPTIONS: UnitType[] = ['fixed', 'unit', 'km']

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  fixed: 'Fixed',
  unit: 'Unit',
  km: 'Km',
}

interface PracticeFormState {
  code: string
  name: string
  unit_type: UnitType
  nomenclator_value: string
  requires_documentation: boolean
  notes: string
}

const emptyForm = (): PracticeFormState => ({
  code: '',
  name: '',
  unit_type: 'unit',
  nomenclator_value: '',
  requires_documentation: true,
  notes: '',
})

function practiceToForm(p: InvoicePractice): PracticeFormState {
  return {
    code: p.code ?? '',
    name: p.name,
    unit_type: p.unit_type,
    nomenclator_value: p.nomenclator_value,
    requires_documentation: p.requires_documentation,
    notes: p.notes ?? '',
  }
}

interface PracticeFormProps {
  initialValues: PracticeFormState
  onSubmit: (values: PracticeFormState) => Promise<void>
  onCancel: () => void
  submitLabel: string
  error: string | null
  saving: boolean
}

function PracticeForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  error,
  saving,
}: PracticeFormProps) {
  const [form, setForm] = useState<PracticeFormState>(initialValues)

  function set<K extends keyof PracticeFormState>(key: K, value: PracticeFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 border border-gray-200 rounded-md p-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            placeholder="Optional"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Unit Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.unit_type}
            onChange={(e) => set('unit_type', e.target.value as UnitType)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {UNIT_TYPE_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {UNIT_TYPE_LABELS[u]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nomenclator Value <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.nomenclator_value}
            onChange={(e) => set('nomenclator_value', e.target.value)}
            required
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="requires_documentation"
          type="checkbox"
          checked={form.requires_documentation}
          onChange={(e) => set('requires_documentation', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="requires_documentation" className="text-sm text-gray-700">
          Requires documentation
        </label>
      </div>

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

export default function InvoicePracticesSection({ invoiceId }: { invoiceId: string }) {
  const [practices, setPractices] = useState<InvoicePractice[]>([])
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
    getInvoicePractices(invoiceId)
      .then(setPractices)
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : 'Failed to load practices.'),
      )
      .finally(() => setLoading(false))
  }, [invoiceId])

  async function handleCreate(values: PracticeFormState) {
    setCreateSaving(true)
    setCreateError(null)
    try {
      const created = await createInvoicePractice({
        invoice_id: invoiceId,
        code: values.code.trim() || null,
        name: values.name.trim(),
        unit_type: values.unit_type,
        nomenclator_value: values.nomenclator_value,
        requires_documentation: values.requires_documentation,
        notes: values.notes.trim() || null,
      })
      setPractices((prev) => [...prev, created])
      setShowCreateForm(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create practice.')
    } finally {
      setCreateSaving(false)
    }
  }

  async function handleUpdate(id: string, values: PracticeFormState) {
    setEditSaving(true)
    setEditError(null)
    try {
      const updated = await updateInvoicePractice(id, {
        code: values.code.trim() || null,
        name: values.name.trim(),
        unit_type: values.unit_type,
        nomenclator_value: values.nomenclator_value,
        requires_documentation: values.requires_documentation,
        notes: values.notes.trim() || null,
      })
      setPractices((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update practice.')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this practice? This cannot be undone.')) return
    setDeletingId(id)
    setDeleteError((prev) => ({ ...prev, [id]: '' }))
    try {
      await deleteInvoicePractice(id)
      setPractices((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes('foreign key')
          ? 'Cannot delete: this practice is referenced by existing invoice items.'
          : (err instanceof Error ? err.message : 'Failed to delete practice.')
      setDeleteError((prev) => ({ ...prev, [id]: msg }))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Invoice Practices</h2>
        {!showCreateForm && (
          <button
            onClick={() => {
              setShowCreateForm(true)
              setCreateError(null)
            }}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Practice
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-4">
          <PracticeForm
            initialValues={emptyForm()}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowCreateForm(false)
              setCreateError(null)
            }}
            submitLabel="Add Practice"
            error={createError}
            saving={createSaving}
          />
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-500">Loading practices…</p>
      )}

      {loadError && (
        <p className="text-sm text-red-600">{loadError}</p>
      )}

      {!loading && !loadError && practices.length === 0 && !showCreateForm && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
          <p className="text-sm">No practices added for this invoice yet.</p>
        </div>
      )}

      {!loading && !loadError && practices.length > 0 && (
        <div className="divide-y divide-gray-100">
          {practices.map((practice) => (
            <div key={practice.id} className="py-4 first:pt-0 last:pb-0">
              {editingId === practice.id ? (
                <PracticeForm
                  initialValues={practiceToForm(practice)}
                  onSubmit={(values) => handleUpdate(practice.id, values)}
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
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {practice.code && (
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {practice.code}
                        </span>
                      )}
                      <span className="font-medium text-sm text-gray-900">{practice.name}</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {UNIT_TYPE_LABELS[practice.unit_type]}
                      </span>
                      {practice.requires_documentation && (
                        <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
                          Docs required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">
                      Nomenclator value:{' '}
                      <span className="font-medium">
                        ${parseFloat(practice.nomenclator_value).toLocaleString()}
                      </span>
                    </p>
                    {practice.notes && (
                      <p className="text-xs text-gray-500">{practice.notes}</p>
                    )}
                    {deleteError[practice.id] && (
                      <p className="text-xs text-red-600 mt-1">{deleteError[practice.id]}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(practice.id)
                        setEditError(null)
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(practice.id)}
                      disabled={deletingId === practice.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === practice.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
