// API Keys and sensitive configuration
export const keys = {
  supabase: {
    url: '',
    anonKey: '',
    serviceRoleKey: ''
  },
  openai: {
    apiKey: ''
  },
  gemini: {
    apiKey: ''
  },
  huggingface: {
    apiKey: 'hf_1234567890'
  }
} as const; 