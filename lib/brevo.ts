import * as Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

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
  return apiInstance.sendTransacEmail({
    sender: BREVO_SENDER,
    to,
    subject,
    htmlContent: html,
  });
}
