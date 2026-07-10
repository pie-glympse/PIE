import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { sendEmailTemplate } from "@/lib/brevo";
import { getAppBaseUrl } from "@/lib/stripe";
import type { TeamMemberInput, TeamRegistrationPayload } from "@/lib/register-team";

export interface CreateTeamResult {
  usersCreated: number;
  companyId: string;
  errors?: string[];
}

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

function resolveRecipient(realEmail: string, isDevelopment: boolean): string {
  return isDevelopment
    ? process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com"
    : realEmail;
}

async function sendWelcomeEmailSafe(opts: {
  email: string;
  name: string;
  firstName: string;
  templateId: number;
  setPasswordLink: string;
  isDevelopment: boolean;
}): Promise<void> {
  try {
    await sendEmailTemplate({
      to: [{ email: resolveRecipient(opts.email, opts.isDevelopment), name: opts.name }],
      templateId: opts.templateId,
      params: {
        FIRSTNAME: opts.firstName,
        USER_EMAIL: opts.email,
        SET_PASSWORD_LINK: opts.setPasswordLink,
      },
    });
  } catch (error) {
    console.error(
      `Email de bienvenue non envoyé pour ${opts.email} (compte créé malgré tout):`,
      (error as Error).message,
    );
    if (opts.isDevelopment) {
      console.log(
        `[DEV] Lien de définition du mot de passe pour ${opts.email} : ${opts.setPasswordLink}`,
      );
    }
  }
}

async function issueSetPasswordLink(
  userId: bigint,
  email: string,
  baseUrl: string,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token, email, userId, expiresAt, used: false },
  });

  return `${baseUrl}/set-password?token=${token}&email=${encodeURIComponent(email)}`;
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

  const setPasswordLink = await issueSetPasswordLink(user.id, email, baseUrl);

  await sendWelcomeEmailSafe({
    email,
    name: `${employee.firstName} ${employee.lastName}`,
    firstName: employee.firstName || "",
    templateId: Number(process.env.BREVO_TEMPLATE_ID_WELCOME_COLLABORATEUR),
    setPasswordLink,
    isDevelopment,
  });
}

export async function createTeamFromPayload(
  payload: TeamRegistrationPayload,
): Promise<CreateTeamResult> {
  const baseUrl = getAppBaseUrl();
  const isDevelopment = process.env.NODE_ENV === "development";

  const ownerEmail = payload.owner.email.toLowerCase().trim();

  const ownerAlreadyExists = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });
  if (ownerAlreadyExists) {
    return {
      usersCreated: 0,
      companyId: ownerAlreadyExists.companyId?.toString() ?? "",
      errors: ["Inscription déjà finalisée pour ce responsable"],
    };
  }

  try {
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Company"', 'id'), COALESCE((SELECT MAX(id) FROM "Company"), 1), true);
      SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1), true);
      SELECT setval(pg_get_serial_sequence('"Team"', 'id'), COALESCE((SELECT MAX(id) FROM "Team"), 1), true);
    `);
  } catch (seqError) {
    console.warn("Impossible de réinitialiser les séquences:", seqError);
  }

  const company = await prisma.company.create({
    data: {
      name: payload.company.name,
      address: payload.company.address || null,
    },
  });

  const tempPassword = randomBytes(16).toString("hex");
  const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

  const owner = await prisma.user.create({
    data: {
      email: ownerEmail,
      password: hashedTempPassword,
      firstName: payload.owner.firstName,
      lastName: payload.owner.lastName,
      role: "ADMIN",
      companyId: company.id,
      photoUrl: "",
    },
  });

  const ownerSetPasswordLink = await issueSetPasswordLink(
    owner.id,
    ownerEmail,
    baseUrl,
  );

  await sendWelcomeEmailSafe({
    email: ownerEmail,
    name: `${payload.owner.firstName} ${payload.owner.lastName}`,
    firstName: payload.owner.firstName,
    templateId: Number(process.env.BREVO_TEMPLATE_ID_WELCOME_ENTREPRISE),
    setPasswordLink: ownerSetPasswordLink,
    isDevelopment,
  });

  const teamCache = new Map<string, bigint>();
  let usersCreated = 0;
  const errors: string[] = [];

  for (const employee of payload.members) {
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
      errors.push(`Erreur pour ${employee.email}: ${(error as Error).message}`);
    }
  }

  return {
    usersCreated,
    companyId: company.id.toString(),
    errors: errors.length > 0 ? errors : undefined,
  };
}
