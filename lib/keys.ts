// API Keys and sensitive configuration
export const keys = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || ''
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || ''
  }
} as const; 