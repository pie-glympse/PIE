import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  mergeTeamMembers,
  parseTeamCSV,
  type TeamMemberInput,
  type TeamRegistrationPayload,
} from "@/lib/register-team";
import {
  createPendingRegistration,
  pendingRegistrationCookieOptions,
} from "@/lib/pending-registration.server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const firstName = ((formData.get("firstName") as string) || "").trim();
    const lastName = ((formData.get("lastName") as string) || "").trim();
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    const companyName = ((formData.get("companyName") as string) || "").trim();
    const companyAddress =
      ((formData.get("companyAddress") as string) || "").trim() || null;
    const csvFile = formData.get("csvFile") as File | null;
    const membersJson = formData.get("members") as string | null;

    if (!firstName || !lastName || !email || !companyName) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(email)) {
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
          .filter((member) => EMAIL_REGEX.test(member.email));
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

    const filteredEmployees = employees.filter(
      (e) => e.email.toLowerCase().trim() !== email,
    );

    const employeeEmails = filteredEmployees.map((e) =>
      e.email.toLowerCase().trim(),
    );
    const allEmails = [email, ...employeeEmails];

    const existingUsers = await prisma.user.findMany({
      where: { email: { in: allEmails } },
      select: { email: true },
    });

    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map((u) => u.email).join(", ");
      return NextResponse.json(
        { error: `Les emails suivants sont déjà utilisés: ${existingEmails}` },
        { status: 400 },
      );
    }

    const payload: TeamRegistrationPayload = {
      owner: { firstName, lastName, email },
      company: { name: companyName, address: companyAddress },
      members: filteredEmployees,
    };

    const pendingId = await createPendingRegistration(payload);

    const response = NextResponse.json({
      pendingId,
      memberCount: filteredEmployees.length,
    });

    const cookie = pendingRegistrationCookieOptions(pendingId);
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    });

    return response;
  } catch (error) {
    console.error("Erreur register-team/prepare:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
