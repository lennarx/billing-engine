import { supabase } from './supabase'
import { Provider } from './types'

export async function getProviders(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function getProviderById(id: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export interface CreateProviderInput {
  name: string
  cuit: string | null
  notes: string | null
}

export async function createProvider(input: CreateProviderInput): Promise<Provider> {
  const { data, error } = await supabase
    .from('providers')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export interface UpdateProviderInput {
  name?: string
  cuit?: string | null
  notes?: string | null
}

export async function updateProvider(id: string, input: UpdateProviderInput): Promise<Provider> {
  const { data, error } = await supabase
    .from('providers')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProvider(id: string): Promise<void> {
  const { error } = await supabase.from('providers').delete().eq('id', id)
  if (error) throw error
}
