export interface TeamMemberInput {
  email: string;
  firstName: string;
  lastName: string;
  teamName?: string;
}

export function parseTeamCSV(text: string): TeamMemberInput[] {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes("email") &&
    (firstLine.includes("prenom") ||
      firstLine.includes("prénom") ||
      firstLine.includes("firstname") ||
      firstLine.includes("first name"));

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const parts = line.includes(";") ? line.split(";") : line.split(",");
      const trimmedParts = parts.map((p) => p.trim().replace(/^"|"$/g, ""));

      return {
        email: trimmedParts[0] || "",
        firstName: trimmedParts[1] || "",
        lastName: trimmedParts[2] || "",
        teamName: trimmedParts[3] || "",
      };
    })
    .filter((row) => row.email && row.email.includes("@"));
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
