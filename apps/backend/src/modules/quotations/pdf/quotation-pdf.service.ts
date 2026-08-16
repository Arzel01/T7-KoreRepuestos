import path from 'node:path';

import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import type { QuotationResponse } from '@kore/shared';

const LOGO_PATH = path.join(__dirname, '../../../assets/logo.png');

/** Formatea un monto como dólares, coherente con el IVA aplicado. */
function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDate(iso: string): string {
  // YYYY-MM-DD → DD/MM/YYYY, sin dependencias de zona horaria del entorno.
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const COLORS = {
  primary: '#0f172a',
  accent: '#2563eb',
  muted: '#64748b',
  line: '#e2e8f0',
} as const;

/**
 * Generación del PDF de una cotización (US#22).
 *
 * Usa `pdfkit`, una librería JS pura (sin binarios nativos ni red), por lo que
 * funciona igual en dev, en el Postgres-nativo de CI y en producción —coherente
 * con [[project_postgres_native_infra]]—. Devuelve el documento como `Buffer`
 * para poder streamearlo por HTTP o adjuntarlo a un email.
 */
@Injectable()
export class QuotationPdfService {
  /** Renderiza la cotización y resuelve con el PDF completo en memoria. */
  render(quotation: QuotationResponse): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Cotización ${quotation.number}`,
          Author: 'KoreAuto',
          Subject: `Cotización para ${quotation.customer.name}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.drawHeader(doc, quotation);
        this.drawCustomer(doc, quotation);
        this.drawItemsTable(doc, quotation);
        this.drawTotals(doc, quotation);
        this.drawFooter(doc, quotation);
        doc.end();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, q: QuotationResponse): void {
    doc.image(LOGO_PATH, 50, 44, { width: 140 });
    doc
      .fillColor(COLORS.muted)
      .fontSize(9)
      .font('Helvetica')
      .text('Repuestos automotrices y planes de mantenimiento', 50, 88);

    doc
      .fillColor(COLORS.primary)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('COTIZACIÓN', 400, 50, { align: 'right', width: 145 });
    doc
      .fillColor(COLORS.muted)
      .fontSize(10)
      .font('Helvetica')
      .text(q.number, 400, 72, { align: 'right', width: 145 })
      .text(`Estado: ${q.status}`, 400, 86, { align: 'right', width: 145 });

    doc.moveTo(50, 108).lineTo(545, 108).strokeColor(COLORS.line).stroke();
  }

  private drawCustomer(doc: PDFKit.PDFDocument, q: QuotationResponse): void {
    const top = 124;
    doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica-Bold').text('CLIENTE', 50, top);
    doc
      .fillColor(COLORS.primary)
      .fontSize(10)
      .font('Helvetica')
      .text(q.customer.name, 50, top + 14)
      .text(q.customer.email, 50, top + 28);

    doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica-Bold').text('FECHAS', 350, top, {
      width: 195,
      align: 'right',
    });
    doc
      .fillColor(COLORS.primary)
      .fontSize(10)
      .font('Helvetica')
      .text(`Emisión: ${formatDate(q.issuedAt)}`, 350, top + 14, { width: 195, align: 'right' })
      .text(`Válida hasta: ${formatDate(q.validUntil)}`, 350, top + 28, {
        width: 195,
        align: 'right',
      });

    doc
      .moveTo(50, top + 52)
      .lineTo(545, top + 52)
      .strokeColor(COLORS.line)
      .stroke();
  }

  private drawItemsTable(doc: PDFKit.PDFDocument, q: QuotationResponse): void {
    let y = 200;
    const cols = { sku: 50, name: 130, qty: 360, unit: 410, total: 480 };

    // Cabecera de la tabla.
    doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica-Bold');
    doc.text('SKU', cols.sku, y);
    doc.text('DESCRIPCIÓN', cols.name, y);
    doc.text('CANT.', cols.qty, y, { width: 40, align: 'right' });
    doc.text('P. UNIT.', cols.unit, y, { width: 60, align: 'right' });
    doc.text('TOTAL', cols.total, y, { width: 65, align: 'right' });
    y += 16;
    doc.moveTo(50, y).lineTo(545, y).strokeColor(COLORS.line).stroke();
    y += 8;

    doc.font('Helvetica').fontSize(9).fillColor(COLORS.primary);
    for (const item of q.items) {
      // Salto de página si nos acercamos al pie.
      if (y > 720) {
        doc.addPage();
        y = 60;
      }
      const nameHeight = doc.heightOfString(item.name, { width: 220 });
      doc.fillColor(COLORS.muted).text(item.sku, cols.sku, y, { width: 75 });
      doc.fillColor(COLORS.primary).text(item.name, cols.name, y, { width: 220 });
      doc.text(String(item.quantity), cols.qty, y, { width: 40, align: 'right' });
      doc.text(money(item.unitPrice), cols.unit, y, { width: 60, align: 'right' });
      doc.text(money(item.lineTotal), cols.total, y, { width: 65, align: 'right' });
      y += Math.max(nameHeight, 12) + 8;
    }

    doc.moveTo(50, y).lineTo(545, y).strokeColor(COLORS.line).stroke();
    (doc as unknown as { _quotationTableBottom: number })._quotationTableBottom = y + 12;
  }

  private drawTotals(doc: PDFKit.PDFDocument, q: QuotationResponse): void {
    const y = (doc as unknown as { _quotationTableBottom: number })._quotationTableBottom ?? 500;
    const labelX = 360;
    const valueX = 480;
    const w = 65;

    const row = (label: string, value: string, offset: number, bold = false): void => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 12 : 10)
        .fillColor(bold ? COLORS.primary : COLORS.muted)
        .text(label, labelX, y + offset, { width: 110, align: 'right' })
        .fillColor(bold ? COLORS.accent : COLORS.primary)
        .text(value, valueX, y + offset, { width: w, align: 'right' });
    };

    row('Subtotal', money(q.subtotal), 0);
    row(`IVA (${Math.round(q.taxRate * 100)}%)`, money(q.tax), 16);
    row('TOTAL', money(q.total), 36, true);
  }

  private drawFooter(doc: PDFKit.PDFDocument, q: QuotationResponse): void {
    const note = q.expired
      ? 'Esta cotización ha expirado. Solicite una nueva para precios vigentes.'
      : `Precios sujetos a la validez indicada. Los montos incluyen IVA (${Math.round(
          q.taxRate * 100,
        )}%).`;
    doc
      .fontSize(8)
      .font('Helvetica-Oblique')
      .fillColor(COLORS.muted)
      .text(note, 50, 770, { width: 495, align: 'center' });
  }
}
