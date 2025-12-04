const cache = {
	env: null
};

const REQUIRED_VARS = [
	'SUPABASE_URL',
	'SUPABASE_SERVICE_KEY',
	'GOOGLE_SERVICE_ACCOUNT',
	'DRIVE_FOLDER_ID',
	'ADMIN_API_KEY',
	'SITE_BASE_URL'
];

function ensureEnvLoaded() {
	if (cache.env) return cache.env;

	const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
	if (missing.length) {
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}

	let googleServiceAccount;
	try {
		googleServiceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
	} catch (error) {
		throw new Error('GOOGLE_SERVICE_ACCOUNT must contain the full JSON credentials string.');
	}

	cache.env = {
		supabaseUrl: process.env.SUPABASE_URL,
		supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
		driveFolderId: process.env.DRIVE_FOLDER_ID,
		adminApiKey: process.env.ADMIN_API_KEY,
		siteBaseUrl: process.env.SITE_BASE_URL,
		googleServiceAccount
	};

	return cache.env;
}

export function getEnv() {
	return ensureEnvLoaded();
}
