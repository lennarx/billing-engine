import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceById, getPracticeById } from '@/lib/mock-data'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  validated: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const coverageColors: Record<string, string> = {
  covered: 'bg-green-100 text-green-800',
  not_covered: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = getInvoiceById(params.id)
  if (!invoice) notFound()

  const totalExpected = invoice.affiliate_items.reduce(
    (sum, item) => sum + item.expected_amount,
    0,
  )

  return (
    <div className="space-y-8">
      {/* Back link */}
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
          <span
            className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusColors[invoice.status]}`}
          >
            {invoice.status}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-gray-500 uppercase">Provider</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">{invoice.provider_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 uppercase">Invoice Date</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">{invoice.invoice_date}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 uppercase">Billed Total</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">${invoice.total_amount.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 uppercase">Expected Total</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">${totalExpected.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {/* Invoice file placeholder */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Document</h2>
        {invoice.file_url ? (
          <a
            href={invoice.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            View document
          </a>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
            <p className="text-sm">No document uploaded yet.</p>
            <p className="text-xs mt-1">
              PDF or image upload will be available after Supabase integration.
            </p>
          </div>
        )}
      </div>

      {/* Practices */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Practices</h2>
        <p className="text-xs text-gray-500 mb-4">
          Each practice has its own nomenclator value for this invoice — values are not global.
        </p>
        <div className="overflow-hidden border border-gray-100 rounded-lg">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nomenclator Value</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {invoice.practices.map((practice) => (
                <tr key={practice.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{practice.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">${practice.nomenclator_value.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{practice.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Affiliate items */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Affiliate Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Practice</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expected Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Coverage</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {invoice.affiliate_items.map((item) => {
                const practice = getPracticeById(invoice, item.practice_id)
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.affiliate_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{practice?.name ?? '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                      ${item.expected_amount.toLocaleString()}
                      <span className="text-xs text-gray-400 ml-1">
                        ({item.quantity} × ${practice?.nomenclator_value.toLocaleString()})
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${coverageColors[item.coverage_status]}`}
                      >
                        {item.coverage_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{item.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
