export function ok(res, data = {}) {
	return res.status(200).json({ status: 'success', ...data });
}

export function created(res, data = {}) {
	return res.status(201).json({ status: 'success', ...data });
}

export function badRequest(res, message = 'Bad request') {
	return res.status(400).json({ status: 'error', message });
}

export function unauthorized(res, message = 'Unauthorized') {
	return res.status(401).json({ status: 'error', message });
}

export function methodNotAllowed(res) {
	return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}

export function serverError(res, error) {
	console.error('[API] Unhandled error', error);
	return res.status(500).json({ status: 'error', message: 'Internal server error' });
}
