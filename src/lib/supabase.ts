import { createClient } from '@supabase/supabase-js'

// Server-only module. `import.meta.env` is inlined at build time, which covers
// every static page. On-demand routes (see src/pages/players/[id].astro) also
// run inside a Netlify function, so fall back to the runtime environment there.
const url = import.meta.env.SUPABASE_URL ?? process.env.SUPABASE_URL
const anonKey = import.meta.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

export const supabase = createClient(url, anonKey)