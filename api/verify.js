import { getSupabaseServiceRole } from './_lib/supabaseClient.js';
import { badRequest, methodNotAllowed, ok, serverError } from './_lib/response.js';

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return methodNotAllowed(res);
	}

	const certId = req.query.certId || req.query.id;
	if (!certId) {
		return badRequest(res, 'certId query parameter is required');
	}

	try {
		const supabase = getSupabaseServiceRole();
		const { data, error } = await supabase
			.from('certificates')
			.select('*')
			.eq('cert_id', certId)
			.eq('verified', true)
			.maybeSingle();

		if (error) throw error;
		if (!data) {
			return res.status(404).json({ status: 'error', message: 'Certificate not found' });
		}

		return ok(res, {
			valid: true,
			certificate: data
		});
	} catch (error) {
		return serverError(res, error);
	}
}
