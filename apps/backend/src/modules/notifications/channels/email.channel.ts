import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import type { NotificationChannel, OutboundNotification } from './notification-channel';
import type { NotificationChannel as NotificationChannelName } from '@kore/shared';
import type { Transporter } from 'nodemailer';

/**
 * Canal de email (US#2). Construye el transporte desde `ConfigService`:
 * - Si hay `SMTP_HOST`, usa SMTP real.
 * - Si no (dev/CI/test), usa el transporte `jsonTransport` de nodemailer, que
 *   **no abre red**: compone el mensaje y lo devuelve serializado. Así los
 *   tests de integración y CI funcionan sin un servidor SMTP.
 */
@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly canal: NotificationChannelName = 'email';
  private readonly logger = new Logger(EmailChannel.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  readonly usesRealSmtp: boolean;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.from = config.get<string>('SMTP_FROM') ?? 'KoreAuto <no-reply@kore.dev>';

    if (host) {
      this.usesRealSmtp = true;
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(config.get<string>('SMTP_PORT') ?? 587),
        secure: Number(config.get<string>('SMTP_PORT') ?? 587) === 465,
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASSWORD'),
        },
      });
    } else {
      this.usesRealSmtp = false;
      // Sin red: compone el correo y lo devuelve como JSON.
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  async send(msg: OutboundNotification): Promise<void> {
    if (!msg.to) {
      throw new Error('EmailChannel requiere un destinatario (to)');
    }
    await this.transporter.sendMail({
      from: this.from,
      to: msg.to,
      subject: msg.titulo,
      text: msg.mensaje,
    });
    if (!this.usesRealSmtp) {
      this.logger.debug(`Email simulado (jsonTransport) → ${msg.to}: ${msg.titulo}`);
    }
  }
}
