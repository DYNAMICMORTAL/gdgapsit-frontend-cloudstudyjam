function formatDisplayDate(dateInput) {
	if (!dateInput) return '';
	const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
	if (Number.isNaN(date)) return '';
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export default function CertificatePreview({ studentName, certId, eventTitle, issuedOn, qrCodeDataUrl }) {
	return (
		<div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4">
			<div className="overflow-auto">
				<div
					id="certificate"
					className="relative mx-auto"
					style={{
						width: '1123px',
						height: '794px',
						backgroundImage: "url('/cert.png')",
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)'
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: '540px',
							width: '100%',
							textAlign: 'center',
							fontSize: '22px',
							color: '#1f2937',
							fontWeight: 500,
							letterSpacing: '0.1em'
						}}
					>
						{eventTitle || 'APSIT Cloud Study Jam 2025'}
					</div>

					<div
						style={{
							position: 'absolute',
							top: '340px',
							width: '100%',
							textAlign: 'center',
							fontSize: '48px',
							fontWeight: 700,
							color: '#0f172a'
						}}
					>
						{studentName || 'Student Name'}
					</div>

					<div
						style={{
							position: 'absolute',
							top: '600px',
							width: '100%',
							textAlign: 'center',
							fontSize: '20px',
							color: '#0f172a'
						}}
					>
						Certificate ID: {certId || 'APSIT-CSJ-25-XXXX'}
					</div>

					<div
						style={{
							position: 'absolute',
							top: '645px',
							width: '100%',
							textAlign: 'center',
							fontSize: '16px',
							color: '#475569',
							letterSpacing: '0.2em'
						}}
					>
						Issued on {formatDisplayDate(issuedOn) || 'TBD'}
					</div>

					<div
						style={{
							position: 'absolute',
							right: '64px',
							bottom: '64px',
							width: '120px',
							height: '120px',
							backgroundColor: '#fff',
							borderRadius: '16px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
							padding: '12px'
						}}
					>
						{qrCodeDataUrl ? (
							<img src={qrCodeDataUrl} alt="QR code" className="w-full h-full object-contain" />
						) : (
							<span className="text-xs text-gray-500 text-center">QR preview</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
