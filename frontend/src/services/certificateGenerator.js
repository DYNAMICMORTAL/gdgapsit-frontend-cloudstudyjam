import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Captures the certificate DOM node and converts it into a PDF blob.
 * @param {Object} options
 * @param {string} [options.elementId='certificate'] - DOM element id to capture
 * @param {number} [options.scale=2] - Canvas scale for sharper output
 * @param {string} [options.fileName='certificate.pdf'] - Suggested download name
 * @returns {Promise<{ blob: Blob, pdf: jsPDF, dataUrl: string }>} PDF artifacts
 */
export async function generateCertificatePdf({ elementId = 'certificate', scale = 2, fileName = 'certificate.pdf' } = {}) {
	const target = document.getElementById(elementId);
	if (!target) {
		throw new Error(`Certificate element with id "${elementId}" not found`);
	}

	const canvas = await html2canvas(target, {
		scale,
		useCORS: true,
		logging: false,
		backgroundColor: null
	});

	const imgData = canvas.toDataURL('image/png');
	const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height]);
	pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
	const blob = pdf.output('blob');

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
