import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const toJson = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );

const dayKey = (d: Date) => d.toISOString().split("T")[0];

async function loadEvent(eventId: bigint) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      state: true,
      dateKnown: true,
      startDate: true,
      endDate: true,
      isSpecificPlace: true,
      categoryId: true,
      createdById: true,
      category: { select: { id: true, name: true, slug: true } },
      users: { select: { id: true } },
    },
  });
}

function isParticipantOrCreator(
  event: { createdById: bigint | null; users: { id: bigint }[] },
  userId: bigint,
) {
  return (
    event.createdById === userId || event.users.some((u) => u.id === userId)
  );
}

// ─── GET : questionnaire de l'événement (questions de la catégorie + mes réponses)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const eventId = BigInt(id);
    const userIdStr = new URL(request.url).searchParams.get("userId");
    if (!userIdStr) {
      return NextResponse.json({ message: "userId manquant" }, { status: 400 });
    }
    const userId = BigInt(userIdStr);

    const event = await loadEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 },
      );
    }
    if (!isParticipantOrCreator(event, userId)) {
      return NextResponse.json(
        {
          message:
            "Vous devez participer à l'événement avant de répondre au questionnaire",
        },
        { status: 403 },
      );
    }

    // Questions de la catégorie (aucune pour un lieu précis)
    const questions = event.categoryId
      ? await prisma.categoryQuestion.findMany({
          where: { categoryId: event.categoryId, isActive: true },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          select: {
            id: true,
            text: true,
            sortOrder: true,
            multiSelect: true,
            maxChoices: true,
            options: {
              orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
              select: { id: true, label: true, sortOrder: true },
            },
          },
        })
      : [];

    const [myAnswers, myPreference] = await Promise.all([
      prisma.eventQuestionnaireAnswer.findMany({
        where: { eventId, userId },
        select: { optionId: true },
      }),
      prisma.eventUserPreference.findUnique({
        where: { userId_eventId: { userId, eventId } },
        select: { preferredDate: true },
      }),
    ]);

    return NextResponse.json(
      toJson({
        event: {
          id: event.id,
          title: event.title,
          state: event.state,
          dateKnown: event.dateKnown,
          startDate: event.startDate,
          endDate: event.endDate,
          isSpecificPlace: event.isSpecificPlace,
          category: event.category,
        },
        questions,
        myAnswerOptionIds: myAnswers.map((a) => a.optionId),
        myPreferredDate: myPreference?.preferredDate ?? null,
        hasAnswered: myPreference != null,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur récupération questionnaire:", error);
    return NextResponse.json(
      { message: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}

// ─── POST : enregistrer les réponses (date dans la plage + options des questions)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const eventId = BigInt(id);

    const { userId, optionIds = [], preferredDate } = await request.json();
    if (!userId) {
      return NextResponse.json({ message: "userId est requis" }, { status: 400 });
    }
    const userIdBigInt = BigInt(userId);
    const parsedOptionIds: bigint[] = Array.isArray(optionIds)
      ? optionIds.map((v: string | number) => BigInt(v))
      : [];

    const event = await loadEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 },
      );
    }
    if (["confirmed", "closed"].includes(event.state?.toLowerCase() ?? "")) {
      return NextResponse.json(
        { message: "Les votes sont clôturés pour cet événement" },
        { status: 400 },
      );
    }
    if (!isParticipantOrCreator(event, userIdBigInt)) {
      return NextResponse.json(
        {
          message:
            "Vous devez participer à l'événement avant de répondre au questionnaire",
        },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdBigInt },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // ── Date préférée
    let preferredDateValue: Date;
    if (event.dateKnown) {
      // Date déjà fixée par le créateur : elle sert de préférence
      preferredDateValue = event.startDate ?? new Date();
    } else {
      if (!preferredDate) {
        return NextResponse.json(
          { message: "Veuillez choisir une date dans la plage proposée" },
          { status: 400 },
        );
      }
      preferredDateValue = new Date(preferredDate);
      if (Number.isNaN(preferredDateValue.getTime())) {
        return NextResponse.json({ message: "Date invalide" }, { status: 400 });
      }
      if (
        (event.startDate && dayKey(preferredDateValue) < dayKey(event.startDate)) ||
        (event.endDate && dayKey(preferredDateValue) > dayKey(event.endDate))
      ) {
        return NextResponse.json(
          { message: "La date choisie doit être dans la plage proposée par l'organisateur" },
          { status: 400 },
        );
      }
    }

    // ── Réponses au questionnaire (branche catégorie uniquement)
    if (event.categoryId) {
      const questions = await prisma.categoryQuestion.findMany({
        where: { categoryId: event.categoryId, isActive: true },
        select: {
          id: true,
          multiSelect: true,
          maxChoices: true,
          options: { select: { id: true } },
        },
      });

      const questionByOptionId = new Map<string, (typeof questions)[number]>();
      for (const question of questions) {
        for (const option of question.options) {
          questionByOptionId.set(option.id.toString(), question);
        }
      }

      // Toutes les options doivent appartenir au questionnaire de la catégorie
      const invalid = parsedOptionIds.filter(
        (optionId) => !questionByOptionId.has(optionId.toString()),
      );
      if (invalid.length > 0) {
        return NextResponse.json(
          { message: "Une ou plusieurs réponses ne correspondent pas à ce questionnaire" },
          { status: 400 },
        );
      }

      // Chaque question doit être répondue en respectant son nombre de choix
      const countByQuestion = new Map<string, number>();
      for (const optionId of parsedOptionIds) {
        const question = questionByOptionId.get(optionId.toString())!;
        const key = question.id.toString();
        countByQuestion.set(key, (countByQuestion.get(key) ?? 0) + 1);
      }
      for (const question of questions) {
        const count = countByQuestion.get(question.id.toString()) ?? 0;
        const max = question.multiSelect ? question.maxChoices : 1;
        if (count === 0) {
          return NextResponse.json(
            { message: "Veuillez répondre à toutes les questions" },
            { status: 400 },
          );
        }
        if (count > max) {
          return NextResponse.json(
            { message: `Une question n'accepte que ${max} choix maximum` },
            { status: 400 },
          );
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventUserPreference.upsert({
        where: { userId_eventId: { userId: userIdBigInt, eventId } },
        update: { preferredDate: preferredDateValue },
        create: { userId: userIdBigInt, eventId, preferredDate: preferredDateValue },
      });

      await tx.eventQuestionnaireAnswer.deleteMany({
        where: { userId: userIdBigInt, eventId },
      });

      if (event.categoryId && parsedOptionIds.length > 0) {
        await tx.eventQuestionnaireAnswer.createMany({
          data: parsedOptionIds.map((optionId) => ({
            eventId,
            userId: userIdBigInt,
            optionId,
          })),
          skipDuplicates: true,
        });
      }
    });

    // Notifier le créateur (pas soi-même)
    if (event.createdById && event.createdById !== userIdBigInt) {
      await prisma.notification.create({
        data: {
          userId: event.createdById,
          message: `@${user.firstName} ${user.lastName} a répondu au questionnaire de "${event.title}"`,
          type: "QUESTIONNAIRE_RESPONSE",
          eventId,
        },
      });
    }

    return NextResponse.json(
      toJson({
        message: "Réponses enregistrées",
        eventId,
        userId: userIdBigInt,
        answeredOptions: parsedOptionIds.map((v) => v.toString()),
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur enregistrement questionnaire:", error);
    return NextResponse.json(
      { message: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
