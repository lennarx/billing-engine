'use client'

import { useState } from 'react'
import {
  createProvider,
  updateProvider,
  deleteProvider,
} from '@/lib/providers'
import { Provider } from '@/lib/types'

export default function ProvidersClient({
  initialProviders,
}: {
  initialProviders: Provider[]
}) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders)

  // New provider form
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCuit, setNewCuit] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newError, setNewError] = useState<string | null>(null)
  const [newLoading, setNewLoading] = useState(false)

  // Editing
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCuit, setEditCuit] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // Delete
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function startEdit(p: Provider) {
    setEditId(p.id)
    setEditName(p.name)
    setEditCuit(p.cuit ?? '')
    setEditNotes(p.notes ?? '')
    setEditError(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) {
      setNewError('Name is required.')
      return
    }
    setNewLoading(true)
    setNewError(null)
    try {
      const created = await createProvider({
        name: newName.trim(),
        cuit: newCuit.trim() || null,
        notes: newNotes.trim() || null,
      })
      setProviders((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewCuit('')
      setNewNotes('')
      setShowNew(false)
    } catch (err) {
      setNewError(err instanceof Error ? err.message : 'Failed to create provider.')
    } finally {
      setNewLoading(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    if (!editName.trim()) {
      setEditError('Name is required.')
      return
    }
    setEditLoading(true)
    setEditError(null)
    try {
      const updated = await updateProvider(editId, {
        name: editName.trim(),
        cuit: editCuit.trim() || null,
        notes: editNotes.trim() || null,
      })
      setProviders((prev) =>
        prev
          .map((p) => (p.id === editId ? updated : p))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      setEditId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update provider.')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this provider? This will fail if the provider has invoices.')) return
    setDeleteError(null)
    try {
      await deleteProvider(id)
      setProviders((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete provider.'
      setDeleteError(
        msg.includes('foreign key') || msg.includes('violates')
          ? 'Cannot delete: this provider has existing invoices.'
          : msg,
      )
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
        {!showNew && (
          <button
            onClick={() => {
              setShowNew(true)
              setNewError(null)
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            New Provider
          </button>
        )}
      </div>

      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {deleteError}
        </div>
      )}

      {/* New provider form */}
      {showNew && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">New Provider</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            {newError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
                {newError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CUIT</label>
                <input
                  type="text"
                  value={newCuit}
                  onChange={(e) => setNewCuit(e.target.value)}
                  placeholder="30-99999999-1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={newLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {newLoading ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="px-4 py-2 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {providers.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
          <p className="text-sm">No providers yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUIT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.map((p) =>
                editId === p.id ? (
                  <tr key={p.id}>
                    <td colSpan={4} className="px-4 py-3">
                      <form onSubmit={handleUpdate} className="flex flex-wrap gap-2 items-start">
                        {editError && (
                          <div className="w-full bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
                            {editError}
                          </div>
                        )}
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Name *"
                          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[140px]"
                          required
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editCuit}
                          onChange={(e) => setEditCuit(e.target.value)}
                          placeholder="CUIT"
                          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[120px]"
                        />
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notes"
                          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[140px]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={editLoading}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {editLoading ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditId(null)}
                            className="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.cuit ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.notes ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
