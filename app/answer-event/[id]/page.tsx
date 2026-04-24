import { redirect } from "next/navigation";

export default async function AnswerEventRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/event-preferences/${id}`);
}
