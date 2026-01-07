import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { clientEnv } from '@/lib/env'

export function createClientComponentClient() {
  return createBrowserClient(
    clientEnv.supabase.url,
    clientEnv.supabase.anonKey
  )
}

// For use in client components
export const supabase = createClient(
  clientEnv.supabase.url,
  clientEnv.supabase.anonKey
)

