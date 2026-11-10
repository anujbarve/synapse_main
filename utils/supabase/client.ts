import { Database } from '@/types/supabase'
import { createBrowserClient } from '@supabase/ssr'
import { requirePublicEnv } from '@/lib/env'

export function createClient() {
  return createBrowserClient<Database>(
    requirePublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requirePublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}
