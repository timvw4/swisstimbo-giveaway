import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ygfpluxqolacgzgocfms.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZnBsdXhxb2xhY2d6Z29jZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMzNTksImV4cCI6MjA2MzM5OTM1OX0.krZk-hSA-Z6vbxDrx7AGvOzdllwEawEn8cDSv5jVzQE'

// Vérification en mode développement
if (process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('⚠️ Variables d\'environnement Supabase manquantes')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabase } 