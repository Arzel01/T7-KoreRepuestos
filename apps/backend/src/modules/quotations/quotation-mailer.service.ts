import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import type { QuotationEmailResult, QuotationResponse } from '@kore/shared';
import type { Transporter } from 'nodemailer';

/**
 * Envío por email de una cotización con el PDF adjunto (US#22).
 *
 * Sigue el mismo patrón que [[EmailChannel]] de notificaciones: usa SMTP real
 * si hay `SMTP_HOST`, y en dev/CI cae a `jsonTransport` (sin red) para no
 * requerir un servidor de correo —coherente con [[project_postgres_native_infra]]—.
 */
@Injectable()
export class QuotationMailerService {
  private readonly logger = new Logger(QuotationMailerService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly usesRealSmtp: boolean;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.from = config.get<string>('SMTP_FROM') ?? 'Kore Repuestos <no-reply@kore.dev>';

    if (host) {
      this.usesRealSmtp = true;
      const port = Number(config.get<string>('SMTP_PORT') ?? 587);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASSWORD'),
        },
      });
    } else {
      this.usesRealSmtp = false;
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  /** Envía la cotización al cliente con el PDF adjunto. */
  async send(quotation: QuotationResponse, pdf: Buffer): Promise<QuotationEmailResult> {
    const to = quotation.customer.email;
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: `Tu cotización ${quotation.number} — Kore Repuestos`,
      text: this.buildBody(quotation),
      attachments: [
        {
          filename: `${quotation.number}.pdf`,
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
    });

    if (!this.usesRealSmtp) {
      this.logger.debug(
        `Email de cotización simulado (jsonTransport) → ${to}: ${quotation.number}`,
      );
    }
    return { to, delivered: this.usesRealSmtp };
  }

  private buildBody(q: QuotationResponse): string {
    return [
      `Hola ${q.customer.name},`,
      '',
      `Adjuntamos tu cotización ${q.number} por un total de S/ ${q.total.toFixed(2)} (IVA incluido).`,
      `Válida hasta el ${q.validUntil.slice(0, 10)}.`,
      '',
      'Gracias por confiar en Kore Repuestos.',
    ].join('\n');
  }
}
