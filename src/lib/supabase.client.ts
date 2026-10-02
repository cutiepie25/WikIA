import { createClient } from '@supabase/supabase-js';

// Browser-only: these values are baked into the bundle at build time, so
// Cloudflare Builds must have PUBLIC_SUPABASE_URL and
// PUBLIC_SUPABASE_PUBLISHABLE_KEY defined as build-time variables.
export const supabase = createClient(
	import.meta.env.PUBLIC_SUPABASE_URL,
	import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
