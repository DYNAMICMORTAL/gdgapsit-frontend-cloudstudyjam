import { getEnv } from './env.js';

export function assertAdminKey(req) {
	const env = getEnv();
	const providedKey = req.headers['x-admin-key'] || req.headers['X-ADMIN-KEY'];
	if (!providedKey || providedKey !== env.adminApiKey) {
		return false;
	}
	return true;
}
