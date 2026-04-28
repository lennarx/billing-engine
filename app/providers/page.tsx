import { getProviders } from '@/lib/providers'
import ProvidersClient from './ProvidersClient'

export const dynamic = 'force-dynamic'

export default async function ProvidersPage() {
  const providers = await getProviders()
  return <ProvidersClient initialProviders={providers} />
}
