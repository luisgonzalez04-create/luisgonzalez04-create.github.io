import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://urneundvetbhnxcbnesh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybmV1bmR2ZXRiaG54Y2JuZXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzAyNzIsImV4cCI6MjA3ODEwNjI3Mn0.HBeCPZf32S8uroWSKR_n89WxoVhrVrWvN2Kl_khaZR4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
