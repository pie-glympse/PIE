export interface TeamMemberInput {
  email: string;
  firstName: string;
  lastName: string;
  teamName?: string;
}

export interface TeamRegistrationPayload {
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  company: {
    name: string;
    address: string | null;
  };
  members: TeamMemberInput[];
}

type CsvColumnKey = "email" | "firstName" | "lastName" | "teamName";

function normalizeHeaderCell(raw: string): CsvColumnKey | null {
  const s = raw.toLowerCase().trim();
  if (!s) return null;
  if (s.includes("mail")) return "email";
  if (
    s.includes("prénom") ||
    s.includes("prenom") ||
    s.includes("firstname") ||
    s.includes("first name")
  ) {
    return "firstName";
  }
  if (s.includes("nom") || s.includes("lastname") || s.includes("last name")) {
    return "lastName";
  }
  if (s.includes("équipe") || s.includes("equipe") || s.includes("team")) {
    return "teamName";
  }
  return null;
}

function splitCsvLine(line: string): string[] {
  const parts = line.includes(";") ? line.split(";") : line.split(",");
  return parts.map((p) => p.trim().replace(/^"|"$/g, ""));
}

export function parseTeamCSV(text: string): TeamMemberInput[] {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return [];

  const firstCols = splitCsvLine(lines[0]);
  const looksLikeHeader =
    !lines[0].includes("@") &&
    firstCols.some((cell) => normalizeHeaderCell(cell) !== null);

  if (looksLikeHeader) {
    const indexByKey: Partial<Record<CsvColumnKey, number>> = {};
    firstCols.forEach((cell, idx) => {
      const key = normalizeHeaderCell(cell);
      if (key && indexByKey[key] === undefined) indexByKey[key] = idx;
    });

    const valueAt = (cols: string[], key: CsvColumnKey): string => {
      const idx = indexByKey[key];
      return idx !== undefined ? cols[idx] || "" : "";
    };

    return lines
      .slice(1)
      .map((line) => {
        const cols = splitCsvLine(line);
        return {
          email: valueAt(cols, "email"),
          firstName: valueAt(cols, "firstName"),
          lastName: valueAt(cols, "lastName"),
          teamName: valueAt(cols, "teamName"),
        };
      })
      .filter((row) => row.email && row.email.includes("@"));
  }

  return lines
    .map((line) => {
      const cols = splitCsvLine(line);
      return {
        email: cols[0] || "",
        firstName: cols[1] || "",
        lastName: cols[2] || "",
        teamName: cols[3] || "",
      };
    })
    .filter((row) => row.email && row.email.includes("@"));
}

export const TEAM_CSV_TEMPLATE_HEADERS = ["Nom", "Prénom", "Adresse mail", "Équipe"];

export function buildTeamCSVTemplate(): string {
  const example = ["Dupont", "Marie", "marie.dupont@entreprise.com", "Marketing"];
  const rows = [TEAM_CSV_TEMPLATE_HEADERS.join(";"), example.join(";")];
  return "﻿" + rows.join("\r\n") + "\r\n";
}

export function mergeTeamMembers(
  csvMembers: TeamMemberInput[],
  manualMembers: TeamMemberInput[],
): TeamMemberInput[] {
  const merged = new Map<string, TeamMemberInput>();

  for (const member of [...csvMembers, ...manualMembers]) {
    const email = member.email.toLowerCase().trim();
    if (!email) continue;
    merged.set(email, {
      email,
      firstName: member.firstName.trim(),
      lastName: member.lastName.trim(),
      teamName: member.teamName?.trim() || "",
    });
  }

  return Array.from(merged.values());
}
