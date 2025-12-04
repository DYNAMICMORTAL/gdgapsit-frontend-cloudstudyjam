import { getSupabaseServiceRole } from '../_lib/supabaseClient.js';
import { methodNotAllowed, serverError } from '../_lib/response.js';

export default async function handler(req, res) {
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
