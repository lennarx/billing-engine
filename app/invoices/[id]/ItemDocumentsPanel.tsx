'use client'

import { useState } from 'react'
import {
  getItemDocuments,
  createItemDocument,
  updateItemDocument,
  deleteItemDocument,
  CreateItemDocumentInput,
  UpdateItemDocumentInput,
} from '@/lib/item-documents'
import { uploadItemDocumentFile, getItemDocumentFileUrl, deleteItemDocumentFile } from '@/lib/storage'
import { ItemDocument, DocumentType, ValidationStatus } from '@/lib/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOCUMENT_TYPE_OPTIONS: DocumentType[] = ['traslado', 'estudio', 'consulta', 'otro']

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  traslado: 'Traslado',
  estudio: 'Estudio',
  consulta: 'Consulta',
  otro: 'Otro',
}

const VALIDATION_STATUS_OPTIONS: ValidationStatus[] = ['pending', 'ok', 'observed']

const VALIDATION_COLORS: Record<ValidationStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  ok: 'bg-green-100 text-green-800',
  observed: 'bg-orange-100 text-orange-800',
}

const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  traslado: 'bg-purple-50 text-purple-700',
  estudio: 'bg-blue-50 text-blue-700',
  consulta: 'bg-teal-50 text-teal-700',
  otro: 'bg-gray-100 text-gray-600',
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface DocFormState {
  document_type: DocumentType
  document_date: string
  origin: string
  destination: string
  kilometers: string
  notes: string
  validation_status: ValidationStatus
}

const emptyDocForm = (): DocFormState => ({
  document_type: 'otro',
  document_date: '',
  origin: '',
  destination: '',
  kilometers: '',
  notes: '',
  validation_status: 'pending',
})

function docToForm(doc: ItemDocument): DocFormState {
  return {
    document_type: doc.document_type,
    document_date: doc.document_date ?? '',
    origin: doc.origin ?? '',
    destination: doc.destination ?? '',
    kilometers: doc.kilometers ?? '',
    notes: doc.notes ?? '',
    validation_status: doc.validation_status,
  }
}

// ---------------------------------------------------------------------------
// Doc form component
// ---------------------------------------------------------------------------

interface DocFormProps {
  initialValues: DocFormState
  onSubmit: (values: DocFormState, file: File | null) => Promise<void>
  onCancel: () => void
  submitLabel: string
  error: string | null
  saving: boolean
}

function DocForm({ initialValues, onSubmit, onCancel, submitLabel, error, saving }: DocFormProps) {
  const [form, setForm] = useState<DocFormState>(initialValues)
  const [file, setFile] = useState<File | null>(null)

  function set<K extends keyof DocFormState>(key: K, value: DocFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({ ...form }, file)
  }

  const isTraslado = form.document_type === 'traslado'

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 border border-gray-200 rounded-md p-3 mt-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.document_type}
            onChange={(e) => set('document_type', e.target.value as DocumentType)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOCUMENT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={form.document_date}
            onChange={(e) => set('document_date', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isTraslado && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Origin <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.origin}
              onChange={(e) => set('origin', e.target.value)}
              placeholder="e.g. Buenos Aires"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => set('destination', e.target.value)}
              placeholder="e.g. La Plata"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kilometers <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.kilometers}
              onChange={(e) => set('kilometers', e.target.value)}
              placeholder="e.g. 60"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Validation Status</label>
          <select
            value={form.validation_status}
            onChange={(e) => set('validation_status', e.target.value as ValidationStatus)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VALIDATION_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Optional"
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">File (PDF or image)</label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:border file:border-gray-300 file:rounded file:text-xs file:bg-gray-50 hover:file:bg-gray-100"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 text-xs rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main panel component
// ---------------------------------------------------------------------------

interface ItemDocumentsPanelProps {
  invoiceItemId: string
}

export default function ItemDocumentsPanel({ invoiceItemId }: ItemDocumentsPanelProps) {
  const [open, setOpen] = useState(false)
  const [documents, setDocuments] = useState<ItemDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<Record<string, string>>({})

  async function loadDocuments() {
    setLoading(true)
    setLoadError(null)
    try {
      const docs = await getItemDocuments(invoiceItemId)
      setDocuments(docs)
      setLoaded(true)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }

  function handleToggle() {
    const nextOpen = !open
    setOpen(nextOpen)
    if (nextOpen && !loaded) {
      void loadDocuments()
    }
  }

  async function handleCreate(values: DocFormState, file: File | null) {
    setCreateSaving(true)
    setCreateError(null)
    try {
      let filePath: string | null = null
      if (file) {
        filePath = await uploadItemDocumentFile(file, invoiceItemId)
      }

      const input: CreateItemDocumentInput = {
        invoice_item_id: invoiceItemId,
        document_type: values.document_type,
        document_date: values.document_date || null,
        origin: values.origin.trim() || null,
        destination: values.destination.trim() || null,
        kilometers: values.kilometers || null,
        validation_status: values.validation_status,
        notes: values.notes.trim() || null,
        file_path: filePath,
      }

      let created
      try {
        created = await createItemDocument(input)
      } catch (dbErr) {
        // Clean up the uploaded file so it doesn't become orphaned
        if (filePath) {
          await deleteItemDocumentFile(filePath).catch(() => undefined)
        }
        throw dbErr
      }

      setDocuments((prev) => [...prev, created])
      setShowCreateForm(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to add document.')
    } finally {
      setCreateSaving(false)
    }
  }

  async function handleUpdate(id: string, values: DocFormState, file: File | null) {
    setEditSaving(true)
    setEditError(null)
    try {
      const existing = documents.find((d) => d.id === id)
      const oldFilePath = existing?.file_path ?? null

      let filePath = oldFilePath
      if (file) {
        filePath = await uploadItemDocumentFile(file, invoiceItemId)
      }

      const input: UpdateItemDocumentInput = {
        document_type: values.document_type,
        document_date: values.document_date || null,
        origin: values.origin.trim() || null,
        destination: values.destination.trim() || null,
        kilometers: values.kilometers || null,
        validation_status: values.validation_status,
        notes: values.notes.trim() || null,
        file_path: filePath,
      }

      let updated
      try {
        updated = await updateItemDocument(id, input)
      } catch (dbErr) {
        // Clean up the newly uploaded file if the DB update failed
        if (file && filePath && filePath !== oldFilePath) {
          await deleteItemDocumentFile(filePath).catch(() => undefined)
        }
        throw dbErr
      }

      // Delete the old storage file now that the DB row points to the new one
      if (file && oldFilePath && oldFilePath !== filePath) {
        await deleteItemDocumentFile(oldFilePath).catch(() => undefined)
      }

      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)))
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update document.')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    setDeletingId(id)
    setDeleteError((prev) => ({ ...prev, [id]: '' }))
    try {
      const doc = documents.find((d) => d.id === id)
      await deleteItemDocument(id)
      // Best-effort: remove the storage file. If this fails the row is already
      // gone so we still update the UI — the orphaned file can be cleaned up manually.
      if (doc?.file_path) {
        await deleteItemDocumentFile(doc.file_path).catch(() => undefined)
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setDeleteError((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : 'Failed to delete document.',
      }))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleToggle}
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Documents {loaded ? `(${documents.length})` : ''}</span>
      </button>

      {open && (
        <div className="mt-2 pl-2 border-l-2 border-gray-100 space-y-2">
          {loading && <p className="text-xs text-gray-500">Loading documents…</p>}
          {loadError && <p className="text-xs text-red-600">{loadError}</p>}

          {!loading && !loadError && documents.length === 0 && (
            <p className="text-xs text-gray-400">No documents attached.</p>
          )}

          {documents.map((doc) => (
            <div key={doc.id} className="border border-gray-200 rounded-md p-2 bg-white text-xs">
              {editingId === doc.id ? (
                <DocForm
                  initialValues={docToForm(doc)}
                  onSubmit={(values, file) => handleUpdate(doc.id, values, file)}
                  onCancel={() => { setEditingId(null); setEditError(null) }}
                  submitLabel="Save"
                  error={editError}
                  saving={editSaving}
                />
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${DOCUMENT_TYPE_COLORS[doc.document_type]}`}>
                        {DOCUMENT_TYPE_LABELS[doc.document_type]}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${VALIDATION_COLORS[doc.validation_status]}`}>
                        {doc.validation_status}
                      </span>
                      {doc.document_date && (
                        <span className="text-gray-500">{doc.document_date}</span>
                      )}
                    </div>

                    {doc.document_type === 'traslado' && (
                      <div className="flex items-center gap-3 text-gray-600">
                        {doc.origin && <span>From: <span className="font-medium">{doc.origin}</span></span>}
                        {doc.destination && <span>To: <span className="font-medium">{doc.destination}</span></span>}
                        {doc.kilometers != null && (
                          <span>
                            <span className="font-medium">
                              {isNaN(parseFloat(doc.kilometers)) ? doc.kilometers : parseFloat(doc.kilometers).toLocaleString()}
                            </span> km
                          </span>
                        )}
                        {(!doc.origin || !doc.destination || !doc.kilometers || isNaN(parseFloat(doc.kilometers)) || parseFloat(doc.kilometers) <= 0) && (
                          <span className="text-amber-700">⚠ Missing traslado fields</span>
                        )}
                      </div>
                    )}

                    {doc.notes && <p className="text-gray-500">{doc.notes}</p>}

                    {doc.file_path && (
                      <a
                        href={getItemDocumentFileUrl(doc.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Open / Download file
                      </a>
                    )}

                    {deleteError[doc.id] && (
                      <p className="text-red-600">{deleteError[doc.id]}</p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingId(doc.id); setEditError(null) }}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === doc.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!showCreateForm && (
            <button
              type="button"
              onClick={() => { setShowCreateForm(true); setCreateError(null) }}
              className="text-xs text-blue-600 hover:underline"
            >
              + Add document
            </button>
          )}

          {showCreateForm && (
            <DocForm
              initialValues={emptyDocForm()}
              onSubmit={handleCreate}
              onCancel={() => { setShowCreateForm(false); setCreateError(null) }}
              submitLabel="Add"
              error={createError}
              saving={createSaving}
            />
          )}
        </div>
      )}
    </div>
  )
}
