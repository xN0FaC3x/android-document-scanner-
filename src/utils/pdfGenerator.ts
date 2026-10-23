import { jsPDF } from 'jspdf';
import { ScannedPage } from '../types';

/**
 * Generates a real multi-page PDF document from scanned pages.
 * Handles A4 standard sizing, aspect ratio preservation, and returns both
 * the Blob and a triggerable download.
 */
export async function generatePdfFromPages(
  pages: ScannedPage[],
  documentTitle: string = 'Scanned_Document'
): Promise<{ blob: Blob; url: string; filename: string }> {
  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10; // 10mm margin
  const maxContentWidth = pageWidth - margin * 2;
  const maxContentHeight = pageHeight - margin * 2;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const imgData = page.processedImage;

    // Load image briefly to get dimensions
    const img = new Image();
    img.src = imgData;
    await new Promise((res) => {
      if (img.complete) res(null);
      else img.onload = () => res(null);
    });

    const imgWidth = img.naturalWidth || img.width || 800;
    const imgHeight = img.naturalHeight || img.height || 1100;
    const isLandscape = imgWidth > imgHeight;

    const pageOrientation = isLandscape ? 'landscape' : 'portrait';
    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;

    if (i === 0) {
      // First page orientation
      if (isLandscape) {
        // Re-orient initial page if landscape
        pdf.deletePage(1);
        pdf.addPage('a4', 'landscape');
      }
    } else {
      pdf.addPage('a4', pageOrientation);
    }

    const margin = 8; // 8mm margin
    const maxContentWidth = pageWidth - margin * 2;
    const maxContentHeight = pageHeight - margin * 2;

    const imgRatio = imgWidth / imgHeight;
    const containerRatio = maxContentWidth / maxContentHeight;

    let renderWidth = maxContentWidth;
    let renderHeight = maxContentHeight;
    let xOffset = margin;
    let yOffset = margin;

    if (imgRatio > containerRatio) {
      renderHeight = maxContentWidth / imgRatio;
      yOffset = margin + (maxContentHeight - renderHeight) / 2;
    } else {
      renderWidth = maxContentHeight * imgRatio;
      xOffset = margin + (maxContentWidth - renderWidth) / 2;
    }

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);

    // Subtle page number footer
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 140);
    pdf.text(
      `Page ${i + 1} of ${pages.length} · DocScan ML Kit`,
      pageWidth / 2,
      pageHeight - 3,
      { align: 'center' }
    );
  }

  const cleanFilename = `${documentTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);

  return { blob, url, filename: cleanFilename };
}

/**
 * Triggers browser download for a PDF
 */
export function downloadFile(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
