import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ygfpluxqolacgzgocfms.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZnBsdXhxb2xhY2d6Z29jZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMzNTksImV4cCI6MjA2MzM5OTM1OX0.krZk-hSA-Z6vbxDrx7AGvOzdllwEawEn8cDSv5jVzQE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabase } 