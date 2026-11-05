export type ExportFormat = 'png' | 'pdf';

const PAGE_MARGIN_MM = 10;

export function exportFileName(planName: string, format: ExportFormat): string {
  const safeName = planName.replace(/[\\/:*?"<>|]/g, '').trim() || 'plan';
  return `${safeName}-timetable.${format}`;
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

export async function exportNode(node: HTMLElement, planName: string, format: ExportFormat): Promise<void> {
  await document.fonts.ready;
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: getComputedStyle(node).backgroundColor });
  const fileName = exportFileName(planName, format);

  if (format === 'png') {
    downloadDataUrl(dataUrl, fileName);
    return;
  }

  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth() - PAGE_MARGIN_MM * 2;
  const pageHeight = pdf.internal.pageSize.getHeight() - PAGE_MARGIN_MM * 2;
  const scale = Math.min(pageWidth / node.offsetWidth, pageHeight / node.offsetHeight);
  const width = node.offsetWidth * scale;
  const height = node.offsetHeight * scale;
  pdf.addImage(dataUrl, 'PNG', PAGE_MARGIN_MM + (pageWidth - width) / 2, PAGE_MARGIN_MM, width, height, undefined, 'FAST');
  pdf.save(fileName);
}
