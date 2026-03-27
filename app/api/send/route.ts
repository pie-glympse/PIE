import { EmailTemplate } from "@/components/email-template";
import { render } from "@react-email/render";
import { sendEmail } from "@/lib/brevo";

export async function POST() {
  try {
    const html = await render(EmailTemplate({ firstName: "John" }));

    await sendEmail({
      to: [{ email: "delivered@example.com", name: "John" }],
      subject: "Hello world",
      html,
    });

    return Response.json({ message: "Email envoyé" });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
