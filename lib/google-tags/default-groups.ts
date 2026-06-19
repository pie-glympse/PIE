export const DEFAULT_GOOGLE_TAG_GROUPS = [
  { name: "Restauration", sortOrder: 1 },
  { name: "Afterwork", sortOrder: 2 },
  { name: "Team Building", sortOrder: 3 },
  { name: "Séminaire", sortOrder: 4 },
  { name: "Sport", sortOrder: 5 },
  { name: "Autre", sortOrder: 6 },
] as const;

export async function ensureDefaultGoogleTagGroups(prisma: {
  googleTagGroup: {
    count: () => Promise<number>;
    createMany: (args: {
      data: Array<{ name: string; sortOrder: number; isActive: boolean }>;
      skipDuplicates?: boolean;
    }) => Promise<{ count: number }>;
  };
}) {
  const count = await prisma.googleTagGroup.count();
  if (count > 0) return count;

  const result = await prisma.googleTagGroup.createMany({
    data: DEFAULT_GOOGLE_TAG_GROUPS.map((group) => ({
      name: group.name,
      sortOrder: group.sortOrder,
      isActive: true,
    })),
  });

  return result.count;
}
