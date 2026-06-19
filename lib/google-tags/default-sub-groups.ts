export const DEFAULT_SUB_GROUPS_BY_GROUP: Record<string, string[]> = {
  Restauration: [
    "Restaurant",
    "Café & bar",
    "Boulangerie & pâtisserie",
    "Traiteur & buffet",
  ],
  Afterwork: ["Bar & pub", "Brasserie", "Nightlife"],
  "Team Building": ["Loisirs & jeux", "Culture & visites", "Nature & outdoor"],
  Séminaire: ["Salles & conférences", "Coworking & bureaux"],
  Sport: ["Fitness & gym", "Sports collectifs", "Outdoor & nature"],
  Autre: ["Divers"],
};

export async function ensureDefaultGoogleTagSubGroups(prisma: {
  googleTagGroup: {
    findMany: (args: {
      select: { id: true; name: true };
    }) => Promise<Array<{ id: bigint; name: string }>>;
  };
  googleTagSubGroup: {
    count: () => Promise<number>;
    createMany: (args: {
      data: Array<{
        name: string;
        groupId: bigint;
        sortOrder: number;
        isActive: boolean;
      }>;
      skipDuplicates?: boolean;
    }) => Promise<{ count: number }>;
  };
}) {
  const count = await prisma.googleTagSubGroup.count();
  if (count > 0) return count;

  const groups = await prisma.googleTagGroup.findMany({
    select: { id: true, name: true },
  });

  const data = groups.flatMap((group) => {
    const subGroupNames =
      DEFAULT_SUB_GROUPS_BY_GROUP[group.name] ??
      DEFAULT_SUB_GROUPS_BY_GROUP.Autre;
    return subGroupNames.map((name, index) => ({
      name,
      groupId: group.id,
      sortOrder: index + 1,
      isActive: true,
    }));
  });

  if (data.length === 0) return 0;

  const result = await prisma.googleTagSubGroup.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
}
