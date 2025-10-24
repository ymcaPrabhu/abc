import { createClient } from "@supabase/supabase-js";

// Use dummy values during build if env vars are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15IiByb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQyNjI0MCwiZXhwIjoxOTMxOTAyNDQwfQ.dummy";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
