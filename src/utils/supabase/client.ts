import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Usamos placeholders para evitar que el build de Next.js falle si no detecta las variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  
  return createBrowserClient(url, key);
}
