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

export const RESEND_TEST_FROM = 'PeaLuna <onboarding@resend.dev>';

class ResendMailer implements Mailer {
  constructor(
    private readonly env: Env,
    private readonly apiKey: string,
  ) {}

  async send(message: MailMessage): Promise<void> {
    if (isUnmailableTestAddress(message.to)) {
      throw Object.assign(
        new Error(
          'That inbox cannot receive mail (example.com / test.com). Sign up with a real address, the same one as your Resend account.',
        ),
        { statusCode: 400, code: 'MAIL_BLOCKED_RECIPIENT' },
      );
    }

    const preferred = resolveResendFrom(this.env.EMAIL_FROM);
    const attempts = preferred === RESEND_TEST_FROM ? [preferred] : [preferred, RESEND_TEST_FROM];
    let lastStatus = 0;
    let lastBody = '';

    for (const from of attempts) {
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
      if (res.ok) {
        if (from !== preferred) {
          console.warn(`[mail] resend accepted fallback from=${from} (rejected ${preferred})`);
        }
        return;
      }
      lastStatus = res.status;
      lastBody = await res.text();
      console.error(`[mail] resend failed status=${lastStatus} from=${from} to=${message.to} body=${lastBody}`);
      if (!resendFromRejected(lastBody) || from === RESEND_TEST_FROM) {
        break;
      }
    }

    const interpreted = interpretResendError(message.to, lastStatus, lastBody);
    throw Object.assign(new Error(interpreted.message), {
      statusCode: 400,
      code: interpreted.code,
    });
  }
}

/** Strip quotes and map Resend's unusable test senders to the current sandbox address. */
export function resolveResendFrom(from: string | undefined) {
  let value = from?.trim() ?? '';
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  if (
    !value ||
    /localhost/i.test(value) ||
    /@(?:example\.com|resend\.dev)\b/i.test(value)
  ) {
    return RESEND_TEST_FROM;
  }
  return value;
}

export function isUnmailableTestAddress(to: string) {
  const domain = to.split('@')[1]?.toLowerCase() ?? '';
  return /^(example\.com|test\.com|invalid|localhost)$/.test(domain);
}

export function resendFromRejected(body: string) {
  return /invalid `from`|from field|not verified|unverified domain/i.test(body);
}

export function interpretResendError(to: string, status: number, body: string) {
  let detail = body.slice(0, 280);
  try {
    const parsed = JSON.parse(body) as { message?: unknown; name?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      detail = parsed.message.trim();
    }
  } catch {
    /* raw text */
  }

  if (isUnmailableTestAddress(to)) {
    return {
      code: 'MAIL_BLOCKED_RECIPIENT',
      message:
        'That inbox cannot receive mail (example.com / test.com). Sign up with a real address, the same one as your Resend account.',
    };
  }
  if (/testing emails|own email address/i.test(detail) || /testing emails|own email address/i.test(body)) {
    return {
      code: 'MAIL_TEST_MODE',
      message:
        'Resend is in test mode: it only delivers to the email on your Resend account. Sign up with that address, or verify your domain in Resend to email anyone.',
    };
  }
  if (resendFromRejected(body) || resendFromRejected(detail)) {
    return {
      code: 'MAIL_INVALID_FROM',
      message: `Resend rejected the sender. Set EMAIL_FROM to PeaLuna <onboarding@resend.dev>, or verify your domain. (${detail})`,
    };
  }
  return {
    code: 'MAIL_SEND_FAILED',
    message: `Could not send the confirmation email (${status}): ${detail}`,
  };
}

function smtpHost(smtpUrl: string | undefined) {
  if (!smtpUrl) return '';
  try {
    return new URL(smtpUrl).hostname;
  } catch {
    return '';
  }
}

export function createMailer(env: Env): Mailer {
  if (env.RESEND_API_KEY) {
    console.info('[mail] delivery=resend');
    return new ResendMailer(env, env.RESEND_API_KEY);
  }
  const host = smtpHost(env.SMTP_URL);
  const localSmtp = host === '127.0.0.1' || host === 'localhost';
  if (env.SMTP_URL && !(env.NODE_ENV === 'production' && localSmtp)) {
    console.info(`[mail] delivery=smtp host=${host}`);
    return new SmtpMailer(env, nodemailer.createTransport(env.SMTP_URL));
  }
  console.warn('[mail] delivery=log-only — emails will not reach a real inbox');
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
