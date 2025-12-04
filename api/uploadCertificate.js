import fs from 'node:fs/promises';
import formidable from 'formidable';
import { nanoid } from 'nanoid';
import { getSupabaseServiceRole } from './_lib/supabaseClient.js';
import { getEnv } from './_lib/env.js';
import { uploadPdfToDrive } from './_lib/driveClient.js';
import { assertAdminKey } from './_lib/auth.js';
import { badRequest, created, methodNotAllowed, serverError, unauthorized } from './_lib/response.js';

export const config = {
	api: {
		bodyParser: false
	}
};

async function parseForm(req) {
	const form = formidable({ multiples: false, maxFileSize: 25 * 1024 * 1024 });
	return new Promise((resolve, reject) => {
		form.parse(req, (err, fields, files) => {
			if (err) return reject(err);
			resolve({ fields, files });
		});
	});
}

export default async function handler(req, res) {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'X-ADMIN-KEY, Content-Type');
		return res.status(200).end();
	}

	// Set CORS headers for actual request
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'X-ADMIN-KEY, Content-Type');

	if (req.method !== 'POST') {
		return methodNotAllowed(res);
	}

	if (!assertAdminKey(req)) {
		return unauthorized(res, 'Missing or invalid X-ADMIN-KEY header');
	}

	try {
		const { fields, files } = await parseForm(req);
		const pdf = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
		if (!pdf) {
			return badRequest(res, 'PDF upload is required');
		}

		const studentName = Array.isArray(fields.studentName) ? fields.studentName[0] : fields.studentName;
		const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
		const certIdField = Array.isArray(fields.certId) ? fields.certId[0] : fields.certId;
		const event = Array.isArray(fields.event) ? fields.event[0] : fields.event;
		const issuedAt = Array.isArray(fields.issuedAt) ? fields.issuedAt[0] : fields.issuedAt;

		if (!studentName || !email || !event) {
			return badRequest(res, 'studentName, email, and event fields are required');
		}

		const certId = certIdField || `APSIT-${nanoid(6)}`;
		const pdfBuffer = await fs.readFile(pdf.filepath);

		const drive = await uploadPdfToDrive({ buffer: pdfBuffer, certId });
		const env = getEnv();
		const publicUrl = `${env.siteBaseUrl.replace(/\/$/, '')}/certificate/${certId}`;

		const supabase = getSupabaseServiceRole();
		const { error } = await supabase.from('certificates').upsert(
			{
				student_name: studentName,
				email,
				cert_id: certId,
				event,
				issued_at: issuedAt || new Date().toISOString(),
				drive_file_id: drive.fileId,
				drive_url: drive.viewUrl,
				download_url: drive.downloadUrl,
				verified: true,
				metadata: { source: 'admin-dashboard', publicUrl }
			},
			{ onConflict: 'cert_id' }
		);

		if (error) {
			throw error;
		}

		return created(res, {
			certId,
			viewUrl: drive.viewUrl,
			downloadUrl: drive.downloadUrl,
			publicUrl
		});
	} catch (error) {
		return serverError(res, error);
	}
}
