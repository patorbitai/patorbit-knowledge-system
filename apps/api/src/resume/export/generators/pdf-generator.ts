import { Logger } from '@nestjs/common';

const logger = new Logger('PdfGenerator');

export async function generatePdf(resume: any): Promise<Buffer> {
  logger.log(`Generating PDF for resume: ${resume.id}`);

  try {
    // Try using pdfkit for production-grade PDF generation
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(resume.title || 'Resume', { align: 'center' });
      doc.moveDown(1.5);

      // Sections
      const sections = resume.sections || [];
      for (const section of sections) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text((section.title || section.type || 'Section').replace(/_/g, ' '), {
            underline: true,
          });
        doc.moveDown(0.5);

        if (section.content) {
          doc.fontSize(10).font('Helvetica');
          if (Array.isArray(section.content)) {
            for (const item of section.content) {
              if (typeof item === 'object' && item !== null) {
                const parts = [item.title, item.company, item.description]
                  .filter(Boolean)
                  .join(' — ');
                doc.text(`• ${parts}`);
              } else {
                doc.text(`• ${item}`);
              }
            }
          } else if (typeof section.content === 'string') {
            doc.text(section.content);
          } else {
            doc.text(JSON.stringify(section.content));
          }
        }

        doc.moveDown(1);
      }

      doc.end();
    });
  } catch (error) {
    logger.warn(`PDFKit unavailable, using text fallback: ${(error as Error).message}`);

    // Fallback: generate a basic text-based PDF representation
    const lines: string[] = [];
    lines.push(resume.title || 'Resume');
    lines.push('='.repeat(50));
    lines.push('');

    const sections = resume.sections || [];
    for (const section of sections) {
      const label = (section.title || section.type || 'Section').replace(/_/g, ' ');
      lines.push(label);
      lines.push('-'.repeat(label.length));
      if (section.content) {
        if (Array.isArray(section.content)) {
          for (const item of section.content) {
            if (typeof item === 'object' && item !== null) {
              lines.push(
                `  • ${[item.title, item.company, item.description].filter(Boolean).join(' — ')}`,
              );
            } else {
              lines.push(`  • ${item}`);
            }
          }
        } else if (typeof section.content === 'string') {
          lines.push(`  ${section.content}`);
        }
      }
      lines.push('');
    }

    return Buffer.from(lines.join('\n'), 'utf-8');
  }
}
