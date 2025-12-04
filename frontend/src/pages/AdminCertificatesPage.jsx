import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import CertificatePreview from '../components/CertificatePreview';
import { generateCertificatePdf } from '../services/certificateGenerator';

import {
	AlertCircle,
	Award,
	CheckCircle2,
	Download,
	FileText,
	Loader2,
	Search,
	ShieldCheck,
	Users
} from 'lucide-react';

const STATUS_COLORS = {
	success: 'text-emerald-600',
	error: 'text-red-600',
	processing: 'text-blue-600'
};

export default function AdminCertificatesPage() {
	const [students, setStudents] = useState([]);
	const [certificates, setCertificates] = useState([]);
	const [loading, setLoading] = useState(true);
	const [certLoading, setCertLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedIds, setSelectedIds] = useState([]);
	const [eventName, setEventName] = useState('APSIT Cloud Study Jam 2025');
	const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
	const [certPrefix, setCertPrefix] = useState('APSIT-CSJ-25');
	const [generationStatus, setGenerationStatus] = useState({ state: 'idle', processed: 0, total: 0, message: '' });
	const [previewQr, setPreviewQr] = useState('');
	const [previewDownloading, setPreviewDownloading] = useState(false);

	useEffect(() => {
		loadStudents();
		loadCertificates();
	}, []);

	useEffect(() => {
		const firstSelected = students.find((student) => student.id === selectedIds[0]);
		const sampleCertId = `${certPrefix}-${generateSuffix(firstSelected?.id || 'XXXX')}`;
		const previewUrl = `${window.location.origin}/certificate/${sampleCertId}`;
		QRCode.toDataURL(previewUrl)
			.then(setPreviewQr)
			.catch(() => setPreviewQr(''));
	}, [selectedIds, students, certPrefix]);

	const loadStudents = async () => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from('temp_participants')
				.select('*')
				.order('total_badges', { ascending: false });
			if (error) throw error;
			// Map to match expected student structure
			const mapped = (data || []).map((p) => ({
				id: p.id,
				name: p.full_name,
				email: p.email,
				total_badges: p.total_badges
			}));
			setStudents(mapped);
		} catch (error) {
			console.error('Unable to load students', error);
		} finally {
			setLoading(false);
		}
	};

	const loadCertificates = async () => {
		try {
			setCertLoading(true);
			const { data, error } = await supabase.from('certificates').select('*').order('issued_at', { ascending: false });
			if (error) throw error;
			setCertificates(data || []);
		} catch (error) {
			console.error('Unable to load certificates', error);
		} finally {
			setCertLoading(false);
		}
	};

	const filteredStudents = useMemo(() => {
		if (!searchTerm) return students;
		const term = searchTerm.toLowerCase();
		return students.filter((student) => student.name?.toLowerCase().includes(term) || student.email?.toLowerCase().includes(term));
	}, [students, searchTerm]);

	const selectedStudents = useMemo(() => students.filter((student) => selectedIds.includes(student.id)), [students, selectedIds]);

	const toggleSelection = (studentId) => {
		setSelectedIds((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
	};

	const selectAllFiltered = () => {
		setSelectedIds(filteredStudents.map((student) => student.id));
	};

	const clearSelections = () => setSelectedIds([]);

	const progressPercent = generationStatus.total
		? Math.round((generationStatus.processed / generationStatus.total) * 100)
		: 0;

	const handleGenerate = async () => {
		if (!selectedStudents.length) {
			setGenerationStatus({ state: 'error', processed: 0, total: 0, message: 'Select at least one student.' });
			return;
		}

		const total = selectedStudents.length;
		setGenerationStatus({ state: 'processing', processed: 0, total, message: 'Generating certificates...' });

		const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
		const adminKey = import.meta.env.VITE_ADMIN_API_KEY || 'apsit-admin-2025';

		for (const student of selectedStudents) {
			const certId = `${certPrefix}-${generateSuffix(student.id)}`;
			const verifyUrl = `${window.location.origin}/certificate/${certId}`;

			try {
				// Generate QR for this student
				const qrDataUrl = await QRCode.toDataURL(verifyUrl);

				// Temporarily render certificate in DOM (hidden preview element)
				const previewEl = document.getElementById('certificate');
				if (!previewEl) {
					throw new Error('Certificate preview element not found. Ensure it has id="certificate".');
				}

				// Update preview to show current student before capture
				// (The preview component should already be rendering the first selected student)
				// Force a small delay to let React render
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Capture PDF with optimized settings
				const { blob } = await generateCertificatePdf({
					elementId: 'certificate',
					scale: 1.5 // Reduced from 2 to lower file size (still good quality)
				});

				// Check file size
				const sizeKB = blob.size / 1024;
				console.log(`📄 Generated PDF: ${sizeKB.toFixed(2)} KB`);
				if (sizeKB > 4000) {
					console.warn(`⚠️  PDF is large (${sizeKB.toFixed(2)} KB). May need further optimization.`);
				}

				// Upload to backend
				const formData = new FormData();
				formData.append('pdf', blob, `${certId}.pdf`);
				formData.append('studentName', student.name);
				formData.append('email', student.email);
				formData.append('certId', certId);
				formData.append('event', eventName);
				formData.append('issuedAt', new Date(issueDate).toISOString());

				const response = await fetch(`${backendUrl}/api/uploadCertificate`, {
					method: 'POST',
					headers: {
						'X-ADMIN-KEY': adminKey
					},
					body: formData
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
					throw new Error(errorData.message || `HTTP ${response.status}`);
				}

				const result = await response.json();
				console.log(`✅ Certificate uploaded for ${student.name}:`, result);
			} catch (error) {
				console.error(`❌ Generation failed for ${student.name}:`, error);
				setGenerationStatus({
					state: 'error',
					processed: 0,
					total,
					message: `Failed for ${student.name}: ${error.message}`
				});
				return;
			}

			setGenerationStatus((prev) => ({ ...prev, processed: prev.processed + 1 }));
		}

		setGenerationStatus({
			state: 'success',
			processed: total,
			total,
			message: `Successfully generated ${total} certificate${total > 1 ? 's' : ''} and uploaded to Google Drive.`
		});
		setSelectedIds([]);
		loadCertificates();
	};

	const handlePreviewDownload = async () => {
		if (!selectedStudents.length) {
			setGenerationStatus({ state: 'error', processed: 0, total: 0, message: 'Select a student to preview.' });
			return;
		}

		try {
			setPreviewDownloading(true);
			const { pdf } = await generateCertificatePdf({
				elementId: 'certificate',
				scale: 2
			});
			const fileName = `${certPrefix}-${generateSuffix(selectedStudents[0].id)}_PREVIEW.pdf`;
			pdf.save(fileName);
		} catch (error) {
			console.error('Unable to download preview PDF', error);
			setGenerationStatus({ state: 'error', processed: 0, total: 0, message: 'Preview download failed.' });
		} finally {
			setPreviewDownloading(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-50 py-10">
			<div className="max-w-6xl mx-auto px-4 space-y-8">
				<header className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Admin Console</p>
							<h1 className="text-3xl font-bold text-gray-900 mt-2">Generate certificates</h1>
							<p className="text-sm text-gray-600">Select learners, preview the template, and push PDFs to Drive via your backend.</p>
						</div>
						<div className="flex gap-3">
							<button
								onClick={loadStudents}
								className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold border border-blue-200"
							>
								<Users className="w-4 h-4" />
								Refresh students
							</button>
							<button
								onClick={loadCertificates}
								className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200"
							>
								<Award className="w-4 h-4" />
								Refresh certificates
							</button>
						</div>
					</div>
				</header>

				<section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
								<ShieldCheck className="w-5 h-5 text-blue-600" />
								Generation controls
							</h2>
							<span className="text-sm text-gray-500">{selectedIds.length} selected</span>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
								Event name
								<input
									type="text"
									value={eventName}
									onChange={(e) => setEventName(e.target.value)}
									className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
								/>
							</label>
							<label className="text-sm font-medium text-gray-700 flex flex-col gap-1">
								Issue date
								<input
									type="date"
									value={issueDate}
									onChange={(e) => setIssueDate(e.target.value)}
									className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
								/>
							</label>
							<label className="text-sm font-medium text-gray-700 flex flex-col gap-1 sm:col-span-2">
								Certificate prefix
								<input
									type="text"
									value={certPrefix}
									onChange={(e) => setCertPrefix(e.target.value.toUpperCase())}
									className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
								/>
							</label>
						</div>

						<div className="flex flex-wrap gap-3">
							<button
								onClick={selectAllFiltered}
								className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
							>
								Select filtered
							</button>
							<button
								onClick={clearSelections}
								className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
							>
								Clear selections
							</button>
						</div>

						<button
							onClick={handleGenerate}
							disabled={generationStatus.state === 'processing'}
							className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 disabled:opacity-60"
						>
							<FileText className="w-5 h-5" />
							{generationStatus.state === 'processing' ? 'Generating...' : 'Generate certificates'}
						</button>

						{generationStatus.state !== 'idle' && (
							<div className="space-y-2">
								<div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
									<div
										className="bg-blue-600 h-full transition-all duration-300"
										style={{ width: `${progressPercent}%` }}
									/>
								</div>
								<p className={`text-sm font-medium inline-flex items-center gap-2 ${STATUS_COLORS[generationStatus.state] || 'text-gray-600'}`}>
									{generationStatus.state === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
									{generationStatus.state === 'success' && <CheckCircle2 className="w-4 h-4" />}
									{generationStatus.state === 'error' && <AlertCircle className="w-4 h-4" />}
									{generationStatus.message}
								</p>
							</div>
						)}
					</div>

					<div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Certificate preview</h2>
						{selectedStudents.length === 0 ? (
							<div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500">
								Select a participant to preview their certificate
							</div>
						) : (
							<>
								<CertificatePreview
									studentName={selectedStudents[0].name}
									certId={`${certPrefix}-${generateSuffix(selectedStudents[0].id)}`}
									eventTitle={eventName}
									issuedOn={issueDate}
									qrCodeDataUrl={previewQr}
								/>
								<button
									onClick={handlePreviewDownload}
									disabled={previewDownloading}
									className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
								>
									<Download className="w-4 h-4" />
									{previewDownloading ? 'Preparing PDF...' : 'Download preview PDF'}
								</button>
							</>
						)}
					</div>
				</section>

				<section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Select learners</p>
							<h2 className="text-2xl font-bold text-gray-900 mt-2">{filteredStudents.length} available</h2>
						</div>
						<div className="relative w-full sm:w-80">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search by name or email"
								className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					<div className="mt-6 divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
						{loading ? (
							<div className="p-6 text-center text-gray-500">Loading students...</div>
						) : filteredStudents.length === 0 ? (
							<div className="p-6 text-center text-gray-500">No learners match your search.</div>
						) : (
							<ul className="max-h-96 overflow-auto">
								{filteredStudents.map((student) => (
									<li key={student.id} className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4">
										<div>
											<p className="font-semibold text-gray-900">{student.name}</p>
											<p className="text-sm text-gray-500">{student.email}</p>
										</div>
										<button
											onClick={() => toggleSelection(student.id)}
											className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
												selectedIds.includes(student.id)
													? 'bg-blue-600 text-white border-blue-600'
													: 'border-gray-200 text-gray-700'
											}`}
										>
											{selectedIds.includes(student.id) ? 'Selected' : 'Select'}
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</section>

				<section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
					<div className="flex flex-col gap-2 mb-6">
						<p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Issued certificates</p>
						<h2 className="text-2xl font-bold text-gray-900">{certificates.length} records</h2>
						<p className="text-sm text-gray-600">Entries stored in Supabase after uploads to Google Drive.</p>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full text-left">
							<thead>
								<tr className="text-xs uppercase tracking-widest text-gray-500">
									<th className="px-4 py-3">Student</th>
									<th className="px-4 py-3">Certificate ID</th>
									<th className="px-4 py-3">Event</th>
									<th className="px-4 py-3">Issued</th>
									<th className="px-4 py-3 text-right">Links</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 text-sm">
								{certLoading ? (
									<tr>
										<td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
											Loading certificates...
										</td>
									</tr>
								) : certificates.length === 0 ? (
									<tr>
										<td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
											No certificates stored yet.
										</td>
									</tr>
								) : (
									certificates.map((certificate) => (
										<tr key={certificate.cert_id}>
											<td className="px-4 py-4">
												<p className="font-semibold text-gray-900">{certificate.student_name}</p>
												<p className="text-gray-500">{certificate.email}</p>
											</td>
											<td className="px-4 py-4 font-mono text-xs text-gray-600">{certificate.cert_id}</td>
											<td className="px-4 py-4">{certificate.event}</td>
											<td className="px-4 py-4">{certificate.issued_at ? format(new Date(certificate.issued_at), 'MMM dd, yyyy') : '—'}</td>
											<td className="px-4 py-4 text-right space-x-2">
												{certificate.drive_url && (
													<a
														href={certificate.drive_url}
														target="_blank"
														rel="noreferrer"
														className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
													>
														<Award className="w-4 h-4" /> View
														</a>
												)}
												{certificate.drive_url && (
													<a
														href={certificate.drive_url}
														target="_blank"
														rel="noreferrer"
														className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
													>
														<Download className="w-4 h-4" /> Download
														</a>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</div>
	);
}

function generateSuffix(seed = '') {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	if (seed) {
		let hash = 0;
		for (let i = 0; i < seed.length; i += 1) {
			hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
		}
		let suffix = '';
		for (let j = 0; j < 5; j += 1) {
			hash = (hash * 31 + j) % 2147483647;
			suffix += alphabet[hash % alphabet.length];
		}
		return suffix;
	}

	let fallback = '';
	for (let k = 0; k < 5; k += 1) {
		const index = Math.floor(Math.random() * alphabet.length);
		fallback += alphabet[index];
	}
	return fallback;
}
