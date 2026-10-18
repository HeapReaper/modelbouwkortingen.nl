import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/** Verstuurt mail via een willekeurige SMTP-provider (zie SMTP_* in .env.example). */

const globalForMail = globalThis as unknown as { mailer?: Transporter };

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

function getTransport(): Transporter {
  if (!globalForMail.mailer) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    globalForMail.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 = TLS vanaf de start; 587/25 = STARTTLS.
      secure: process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === "true"
        : port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      // Eén verbinding hergebruiken voor de dagelijkse mail aan alle abonnees.
      pool: true,
      maxConnections: 2,
    });
  }
  return globalForMail.mailer;
}

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export async function sendMail(mail: Mail): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("SMTP_HOST en MAIL_FROM zijn niet ingesteld");
  }
  await getTransport().sendMail({ from: process.env.MAIL_FROM, ...mail });
}

/** Maakt verbinding met de SMTP-server en logt in, zonder iets te versturen. */
export async function verifyMail(): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("SMTP_HOST en MAIL_FROM zijn niet ingesteld");
  }
  await getTransport().verify();
}
