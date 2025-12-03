import { google } from 'googleapis';
import fs from 'node:fs';

const creds = JSON.parse(fs.readFileSync('service-account.json', 'utf8')); // save JSON from GCP

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/drive']
});
const drive = google.drive({ version: 'v3', auth });

const folderId = '1YalnoethRRpsxK-xxwCIvTTnrj89bOSA';

const res = await drive.files.list({
  q: `'${folderId}' in parents`,
  fields: 'files(id,name)'
});
console.log(res.data.files);