import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

let client;

export function getSupabaseServiceRole() {
	if (client) return client;
	const env = getEnv();
	client = createClient(env.supabaseUrl, env.supabaseServiceKey, {
		auth: {
			persistSession: false
		}
	});
	return client;
}
