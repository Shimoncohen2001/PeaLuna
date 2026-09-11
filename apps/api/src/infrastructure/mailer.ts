import nodemailer from 'nodemailer';
import type { Env } from '../config/env.js';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

const captured: MailMessage[] = [];

export function getCapturedMail(): MailMessage[] {
  return [...captured];
}

export function clearCapturedMail() {
  captured.length = 0;
}

class LoggingMailer implements Mailer {
  constructor(private readonly capture: boolean) {}

  async send(message: MailMessage): Promise<void> {
    if (this.capture) {
      captured.push(message);
    }
    console.info(`[mail] to=${message.to} subject=${message.subject}\n${message.text}`);
  }
}

class SmtpMailer implements Mailer {
  constructor(
    private readonly env: Env,
    private readonly transport: nodemailer.Transporter,
  ) {}

  async send(message: MailMessage): Promise<void> {
    await this.transport.sendMail({
      from: this.env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html ?? message.text,
    });
  }
}

export function createMailer(env: Env): Mailer {
  if (env.SMTP_URL) {
    return new SmtpMailer(env, nodemailer.createTransport(env.SMTP_URL));
  }
  return new LoggingMailer(env.NODE_ENV === 'test');
}

export function verificationEmail(params: {
  to: string;
  firstName: string;
  verifyUrl: string;
}): MailMessage {
  return {
    to: params.to,
    subject: 'PeaLuna — verify your email',
    text: `Hi ${params.firstName},\n\nConfirm your PeaLuna account:\n${params.verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `<p>Hi ${params.firstName},</p><p><a href="${params.verifyUrl}">Confirm your PeaLuna account</a></p><p>This link expires in 24 hours.</p>`,
  };
}
