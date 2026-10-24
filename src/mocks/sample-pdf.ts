// A minimal one-page PDF, so demo downloads (invoices, receipts, prescriptions) open as real PDFs.
// The backend generates the real documents (FR-BIL-07, FR-EMR-05). Latin text only: the standard PDF
// fonts have no Arabic glyphs.

const escape = (text: string) => text.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1');

export function samplePdf(title: string, lines: string[]): Blob {
  const content = [
    'BT /F1 18 Tf 56 780 Td',
    `(${escape(title)}) Tj`,
    '/F1 11 Tf 0 -28 Td',
    ...lines.flatMap((line) => [`(${escape(line)}) Tj`, '0 -16 Td']),
    '0 -16 Td (Sample document from the ClinicFlow demo data.) Tj',
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: 'application/pdf' });
}
