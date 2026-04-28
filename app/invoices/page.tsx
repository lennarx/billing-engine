import Link from 'next/link'
import { getInvoices } from '@/lib/invoices'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  in_review: 'bg-yellow-100 text-yellow-800',
  validated: 'bg-green-100 text-green-800',
  observed: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
}

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link
          href="/invoices/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          New Invoice
        </Link>
      </div>
      {invoices.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
          <p className="text-sm">No invoices yet.</p>
          <Link href="/invoices/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{invoice.providers?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{invoice.invoice_date ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {invoice.total_amount != null
                      ? `$${parseFloat(invoice.total_amount).toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[invoice.status] ?? ''}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
