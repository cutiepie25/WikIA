import { createClient } from '@supabase/supabase-js';
import { env } from 'cloudflare:workers';

// The runtime value wins: the Worker can read its own bindings/secrets, whereas
// `import.meta.env` is inlined at build time and is `undefined` on Cloudflare
// Builds (`.env` is gitignored). The build-time public values are only a
// fallback for local dev and preview, where the Worker env may not be set.
function runtimeValue(...candidates: unknown[]): string {
	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.trim() !== '' && candidate !== 'undefined') {
			return candidate;
		}
	}
	return '';
}

// Graceful degradation on purpose: this module is evaluated when the SSR entry
// is loaded, so throwing here would kill every request with an empty 500. If
// both sources are missing, let Supabase report the problem per request. Missing
// variables are `SUPABASE_URL` and `SUPABASE_ANON_KEY` (runtime), or
// `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (build time).
export const supabase = createClient(
	runtimeValue(env.SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_URL),
	runtimeValue(env.SUPABASE_ANON_KEY, import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY),
);
