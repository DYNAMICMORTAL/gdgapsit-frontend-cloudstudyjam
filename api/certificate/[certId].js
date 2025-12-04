import { getSupabaseServiceRole } from '../_lib/supabaseClient.js';
import { methodNotAllowed, serverError } from '../_lib/response.js';

export default async function handler(req, res) {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
		return res.status(200).end();
	}

	// Set CORS headers for actual request
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method !== 'GET') {
		return methodNotAllowed(res);
	}

	const {
		query: { certId }
	} = req;

	if (!certId) {
		return res.status(400).json({ status: 'error', message: 'Certificate ID missing in path' });
	}

	try {
		const supabase = getSupabaseServiceRole();
		const { data, error } = await supabase
			.from('certificates')
			.select('*')
			.eq('cert_id', certId)
			.maybeSingle();

		if (error) throw error;
		if (!data) {
			return res.status(404).json({ status: 'error', message: 'Certificate not found' });
		}

		return res.status(200).json({ status: 'success', certificate: data });
	} catch (error) {
		return serverError(res, error);
	}
}
