import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Captures the certificate DOM node and converts it into a PDF blob.
 * @param {Object} options
 * @param {string} [options.elementId='certificate'] - DOM element id to capture
 * @param {number} [options.scale=1.5] - Canvas scale (reduced from 2 to lower file size)
 * @param {string} [options.fileName='certificate.pdf'] - Suggested download name
 * @returns {Promise<{ blob: Blob, pdf: jsPDF, dataUrl: string }>} PDF artifacts
 */
export async function generateCertificatePdf({ elementId = 'certificate', scale = 1.5, fileName = 'certificate.pdf' } = {}) {
	const target = document.getElementById(elementId);
	if (!target) {
		throw new Error(`Certificate element with id "${elementId}" not found`);
	}

	// Capture with lower scale to reduce file size
	const canvas = await html2canvas(target, {
		scale,
		useCORS: true,
		logging: false,
		backgroundColor: '#ffffff',
		allowTaint: false,
		imageTimeout: 0
	});

	// Use JPEG with compression instead of PNG to reduce size
	const imgData = canvas.toDataURL('image/jpeg', 0.85); // 85% quality
	const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height]);
	pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height, undefined, 'FAST'); // Use FAST compression
	const blob = pdf.output('blob');

	console.log(`📄 PDF generated: ${(blob.size / 1024).toFixed(2)} KB`);

	return { blob, pdf, dataUrl: imgData, fileName };
}

/**
 * Generates and immediately triggers a download of the certificate PDF.
 * @param {Object} options - Same options as generateCertificatePdf plus fileName override.
 */
export async function downloadCertificatePdf(options = {}) {
	const { pdf, fileName } = await generateCertificatePdf(options);
	pdf.save(options?.fileName || fileName || 'certificate.pdf');
}
