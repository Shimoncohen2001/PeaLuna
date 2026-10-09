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

class ResendMailer implements Mailer {
  constructor(
    private readonly env: Env,
    private readonly apiKey: string,
  ) {}

  async send(message: MailMessage): Promise<void> {
    const from = this.env.EMAIL_FROM ?? 'PeaLuna <beth.t@example.com>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html ?? message.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend failed (${res.status}): ${body}`);
    }
  }
}

export function createMailer(env: Env): Mailer {
  if (env.RESEND_API_KEY) {
    return new ResendMailer(env, env.RESEND_API_KEY);
  }
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
    subject: 'PeaLuna — confirm your email / confirme ton email / אימות אימייל',
    text: [
      `Hi ${params.firstName},`,
      '',
      'Confirm your PeaLuna account (link valid 24 hours):',
      params.verifyUrl,
      '',
      `Bonjour ${params.firstName},`,
      'Confirme ton compte PeaLuna (lien valable 24 h) :',
      params.verifyUrl,
      '',
      `שלום ${params.firstName},`,
      'אשרי את חשבון PeaLuna (הקישור תקף ל-24 שעות):',
      params.verifyUrl,
    ].join('\n'),
    html: `<p>Hi ${params.firstName},</p>
<p><a href="${params.verifyUrl}">Confirm your PeaLuna account</a> — this link expires in 24 hours.</p>
<p>Bonjour ${params.firstName},</p>
<p><a href="${params.verifyUrl}">Confirme ton compte PeaLuna</a> — lien valable 24 h.</p>
<p dir="rtl">שלום ${params.firstName},</p>
<p dir="rtl"><a href="${params.verifyUrl}">אשרי את חשבון PeaLuna</a> — הקישור תקף ל-24 שעות.</p>`,
  };
}
