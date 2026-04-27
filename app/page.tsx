import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Medical Invoice Validator
      </h1>
      <p className="text-gray-600 mb-8">
        Validate medical invoices from hospitals and providers. Load practices,
        review affiliate service items, and determine coverage for each item.
      </p>
      <Link
        href="/invoices"
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        View Invoices
      </Link>
    </div>
  )
}
