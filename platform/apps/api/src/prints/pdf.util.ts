import PDFDocument from 'pdfkit';

export type PdfLine = string | { text: string; bold?: boolean; size?: number };

export async function buildPdf(options: {
  title: string;
  subtitle?: string;
  lines: PdfLine[];
  footer?: string | null;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text(options.title, { align: 'left' });
    if (options.subtitle) {
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#444444').text(options.subtitle);
      doc.fillColor('#000000');
    }
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(1);

    for (const line of options.lines) {
      if (typeof line === 'string') {
        doc.fontSize(11).font('Helvetica').text(line || ' ');
      } else {
        doc
          .fontSize(line.size || 11)
          .font(line.bold ? 'Helvetica-Bold' : 'Helvetica')
          .text(line.text || ' ');
      }
      doc.moveDown(0.35);
    }

    if (options.footer) {
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#666666').text(options.footer, { align: 'center' });
    }

    doc.end();
  });
}
