import { google } from 'googleapis';
import { getEnv } from './env.js';

let driveInstance;

function getDrive() {
	if (driveInstance) return driveInstance;
	const env = getEnv();
	const auth = new google.auth.GoogleAuth({
		credentials: env.googleServiceAccount,
		scopes: ['https://www.googleapis.com/auth/drive']
	});
	driveInstance = google.drive({ version: 'v3', auth });
	return driveInstance;
}

export async function uploadPdfToDrive({ buffer, certId }) {
	const env = getEnv();
	const drive = getDrive();

	const file = await drive.files.create({
		requestBody: {
			name: `${certId}.pdf`,
			parents: [env.driveFolderId]
		},
		media: {
			mimeType: 'application/pdf',
			body: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
		}
	});

	const fileId = file.data.id;

	await drive.permissions.create({
		fileId,
		requestBody: {
			role: 'reader',
			type: 'anyone'
		}
	});

	const { data } = await drive.files.get({
		fileId,
		fields: 'webViewLink, webContentLink'
	});

	return {
		fileId,
		viewUrl: data.webViewLink,
		downloadUrl: data.webContentLink
	};
}
