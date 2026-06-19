import { sendEmailTemplate } from "@/lib/brevo";

export async function POST() {
  try {
    const result = await sendEmailTemplate({
      to: [{ email: process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com", name: "Test" }],
      templateId: Number(process.env.BREVO_TEMPLATE_ID_TEST || 1),
      params: {
        FIRSTNAME: "Kevin",
      },
    });

    console.log("Brevo response:", JSON.stringify(result, null, 2));
    return Response.json({ message: "Email envoyé via template Brevo", result });
  } catch (error) {
    console.error("Brevo error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
