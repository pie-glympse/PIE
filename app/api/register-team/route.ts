import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { SetPasswordEmailTemplate } from "@/components/set-password-email-template";
import {
    mergeTeamMembers,
    parseTeamCSV,
    type TeamMemberInput,
} from "@/lib/register-team";
import {
    REGISTRATION_ACCESS_COOKIE,
    verifyRegistrationAccessToken,
} from "@/lib/registration-access";

const resend = new Resend(process.env.RESEND_API_KEY);

async function getOrCreateTeam(
  teamCache: Map<string, bigint>,
  companyId: bigint,
  teamName: string,
): Promise<bigint> {
  const key = teamName.trim();
  const cached = teamCache.get(key);
  if (cached) return cached;

  const existing = await prisma.team.findFirst({
    where: { companyId, name: key },
  });

  if (existing) {
    teamCache.set(key, existing.id);
    return existing.id;
  }

  const team = await prisma.team.create({
    data: { name: key, companyId },
  });
  teamCache.set(key, team.id);
  return team.id;
}

async function createEmployeeAccount(
  employee: TeamMemberInput,
  companyId: bigint,
  teamCache: Map<string, bigint>,
  baseUrl: string,
  isDevelopment: boolean,
): Promise<void> {
  const email = employee.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`Email ${email} déjà utilisé`);
  }

  let teamId: bigint | undefined;
  if (employee.teamName?.trim()) {
    teamId = await getOrCreateTeam(teamCache, companyId, employee.teamName);
  }

  const tempPwd = randomBytes(16).toString("hex");
  const hashedPwd = await bcrypt.hash(tempPwd, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPwd,
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      role: "STANDARD",
      companyId,
      teamId,
      photoUrl: "",
    },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token,
      email,
      userId: user.id,
      expiresAt,
      used: false,
    },
  });

  const setPasswordLink = `${baseUrl}/set-password?token=${token}&email=${encodeURIComponent(email)}`;
  const recipientEmail = isDevelopment
    ? process.env.RESEND_TEST_EMAIL || "glyms.app@gmail.com"
    : email;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Glyms <onboarding@resend.dev>",
    to: [recipientEmail],
    subject: isDevelopment
      ? `[TEST] Créez votre mot de passe Glyms - ${email}`
      : "Créez votre mot de passe - Glyms",
    react: SetPasswordEmailTemplate({
      setPasswordLink,
      userEmail: email,
      firstName: employee.firstName || "",
      isOwner: false,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const registrationToken = cookieStore.get(
      REGISTRATION_ACCESS_COOKIE,
    )?.value;
    const hasRegistrationAccess =
      await verifyRegistrationAccessToken(registrationToken);

    if (!hasRegistrationAccess) {
      return NextResponse.json(
        { error: "Abonnement requis avant l'inscription de l'équipe" },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const companyName = formData.get("companyName") as string;
    const companyAddress = formData.get("companyAddress") as string | null;
    const csvFile = formData.get("csvFile") as File | null;
    const membersJson = formData.get("members") as string | null;

    if (!firstName || !lastName || !email || !companyName) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 },
      );
    }

    let csvMembers: TeamMemberInput[] = [];
    if (csvFile && csvFile.size > 0) {
      csvMembers = parseTeamCSV(await csvFile.text());
    }

    let manualMembers: TeamMemberInput[] = [];
    if (membersJson) {
      try {
        const parsed = JSON.parse(membersJson);
        if (!Array.isArray(parsed)) {
          return NextResponse.json(
            { error: "Format des membres manuels invalide" },
            { status: 400 },
          );
        }
        manualMembers = parsed
          .filter(
            (member): member is TeamMemberInput =>
              typeof member === "object" &&
              member !== null &&
              typeof member.email === "string" &&
              typeof member.firstName === "string" &&
              typeof member.lastName === "string",
          )
          .map((member) => ({
            email: member.email.trim(),
            firstName: member.firstName.trim(),
            lastName: member.lastName.trim(),
            teamName: member.teamName?.trim() || "",
          }))
          .filter((member) => emailRegex.test(member.email));
      } catch {
        return NextResponse.json(
          { error: "Format des membres manuels invalide" },
          { status: 400 },
        );
      }
    }

    const employees = mergeTeamMembers(csvMembers, manualMembers);

    if (employees.length === 0) {
      return NextResponse.json(
        {
          error:
            "Ajoutez au moins un membre via le CSV ou le formulaire manuel",
        },
        { status: 400 },
      );
    }

    const ownerEmail = email.toLowerCase().trim();
    const employeeEmails = employees.map((e) => e.email.toLowerCase().trim());
    const allEmails = [ownerEmail, ...employeeEmails];

    const existingUsers = await prisma.user.findMany({
      where: { email: { in: allEmails } },
    });

    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map((u) => u.email).join(", ");
      return NextResponse.json(
        { error: `Les emails suivants sont déjà utilisés: ${existingEmails}` },
        { status: 400 },
      );
    }

    try {
      await prisma.$executeRawUnsafe(`
                SELECT setval(
                    pg_get_serial_sequence('"Company"', 'id'),
                    COALESCE((SELECT MAX(id) FROM "Company"), 1),
                    true
                );
                SELECT setval(
                    pg_get_serial_sequence('"User"', 'id'),
                    COALESCE((SELECT MAX(id) FROM "User"), 1),
                    true
                );
                SELECT setval(
                    pg_get_serial_sequence('"Team"', 'id'),
                    COALESCE((SELECT MAX(id) FROM "Team"), 1),
                    true
                );
            `);
    } catch (seqError) {
      console.warn("Impossible de réinitialiser les séquences:", seqError);
    }

    const company = await prisma.company.create({
      data: {
        name: companyName,
        address: companyAddress || null,
      },
    });

    const tempPassword = randomBytes(16).toString("hex");
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: hashedTempPassword,
        firstName,
        lastName,
        role: "ADMIN",
        companyId: company.id,
        photoUrl: "",
      },
    });

    const ownerToken = randomBytes(32).toString("hex");
    const ownerExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token: ownerToken,
        email: ownerEmail,
        userId: owner.id,
        expiresAt: ownerExpiresAt,
        used: false,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const ownerSetPasswordLink = `${baseUrl}/set-password?token=${ownerToken}&email=${encodeURIComponent(ownerEmail)}`;
    const isDevelopment = process.env.NODE_ENV === "development";
    const ownerRecipientEmail = isDevelopment
      ? process.env.RESEND_TEST_EMAIL || "glyms.app@gmail.com"
      : ownerEmail;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Glyms <onboarding@resend.dev>",
      to: [ownerRecipientEmail],
      subject: isDevelopment
        ? `[TEST] Créez votre mot de passe Glyms - ${ownerEmail}`
        : "Créez votre mot de passe - Glyms",
      react: SetPasswordEmailTemplate({
        setPasswordLink: ownerSetPasswordLink,
        userEmail: ownerEmail,
        firstName,
        isOwner: true,
      }),
    });

    const teamCache = new Map<string, bigint>();
    let usersCreated = 0;
    const errors: string[] = [];

    for (const employee of employees) {
      try {
        await createEmployeeAccount(
          employee,
          company.id,
          teamCache,
          baseUrl,
          isDevelopment,
        );
        usersCreated++;
      } catch (error) {
        console.error(
          `Erreur lors de la création de l'utilisateur ${employee.email}:`,
          error,
        );
        errors.push(
          `Erreur pour ${employee.email}: ${(error as Error).message}`,
        );
      }
    }

    return NextResponse.json(
      {
        message: "Inscription réussie",
        usersCreated,
        companyId: company.id.toString(),
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur dans register-team:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
