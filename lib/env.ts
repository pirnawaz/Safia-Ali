/**
 * Environment variable validation
 * Ensures all required environment variables are present
 */

const requiredEnvVars = {
  client: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  server: [
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
} as const

export function validateEnv() {
  const missing: string[] = []
  
  // Check client-side variables
  requiredEnvVars.client.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key)
    }
  })
  
  // Check server-side variables (only on server)
  if (typeof window === 'undefined') {
    requiredEnvVars.server.forEach((key) => {
      if (!process.env[key]) {
        missing.push(key)
      }
    })
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      `Please check your .env.local file and ensure all required variables are set.\n` +
      `See .env.example for reference.`
    )
  }
}

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  validateEnv()
}

// Export validated environment variables with type safety
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Safia Ali',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
} as const

// Client-safe environment variables (no service role key)
export const clientEnv = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Safia Ali',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
} as const

