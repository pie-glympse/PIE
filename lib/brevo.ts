import { BrevoClient } from "@getbrevo/brevo";

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY! });

export const BREVO_SENDER = {
  name: "Glyms",
  email: process.env.BREVO_FROM_EMAIL || "contact@glyms-app.fr",
};

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
}) {
  return client.transactionalEmails.sendTransacEmail({
    sender: BREVO_SENDER,
    to,
    subject,
    htmlContent: html,
  });
}

export async function sendEmailTemplate({
  to,
  templateId,
  params,
}: {
  to: { email: string; name?: string }[];
  templateId: number;
  params?: Record<string, string>;
}) {
  return client.transactionalEmails.sendTransacEmail({
    sender: BREVO_SENDER,
    to,
    templateId,
    params,
  });
}
