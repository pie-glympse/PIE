import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOfficeAuthenticated } from "@/lib/officeApiAuth";
import { techNameToDisplayName } from "@/lib/google-tags/display-name";
import { inferGroupNameFromTechName } from "@/lib/google-tags/group-assignment";
import { inferSubGroupNameFromTechName } from "@/lib/google-tags/sub-group-assignment";
import { ensureDefaultGoogleTagGroups } from "@/lib/google-tags/default-groups";
import { ensureDefaultGoogleTagSubGroups } from "@/lib/google-tags/default-sub-groups";

export async function POST(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const assignGroups = body?.assignGroups !== false;

    await ensureDefaultGoogleTagGroups(prisma);
    await ensureDefaultGoogleTagSubGroups(prisma);

    const [tags, groups, subGroups] = await Promise.all([
      prisma.googleTag.findMany({
        select: {
          id: true,
          techName: true,
          displayName: true,
          subGroupId: true,
        },
      }),
      prisma.googleTagGroup.findMany({
        select: { id: true, name: true },
      }),
      prisma.googleTagSubGroup.findMany({
        select: { id: true, name: true, groupId: true },
      }),
    ]);

    const groupByName = new Map(groups.map((group) => [group.name, group.id]));
    const subGroupByGroupAndName = new Map(
      subGroups.map((subGroup) => [
        `${subGroup.groupId.toString()}::${subGroup.name}`,
        subGroup.id,
      ]),
    );

    let labelsFilled = 0;
    let groupsAssigned = 0;

    await prisma.$transaction(
      tags.map((tag) => {
        const nextDisplayName = techNameToDisplayName(tag.techName);
        let nextSubGroupId = tag.subGroupId;

        if (assignGroups) {
          const inferredGroupName = inferGroupNameFromTechName(tag.techName);
          const groupId =
            groupByName.get(inferredGroupName) ??
            groupByName.get("Autre") ??
            null;

          if (groupId) {
            const inferredSubGroupName = inferSubGroupNameFromTechName(
              tag.techName,
              inferredGroupName,
            );
            nextSubGroupId =
              subGroupByGroupAndName.get(
                `${groupId.toString()}::${inferredSubGroupName}`,
              ) ??
              subGroups.find((subGroup) => subGroup.groupId === groupId)?.id ??
              null;

            if (nextSubGroupId && nextSubGroupId !== tag.subGroupId) {
              groupsAssigned += 1;
            }
          }
        }

        if (!tag.displayName?.trim() || tag.displayName !== nextDisplayName) {
          labelsFilled += 1;
        }

        return prisma.googleTag.update({
          where: { id: tag.id },
          data: {
            displayName: nextDisplayName,
            subGroupId: nextSubGroupId,
          },
        });
      }),
    );

    return NextResponse.json({
      message: "Labels et sous-groupes mis à jour",
      summary: {
        labelsFilled,
        groupsAssigned,
        totalTags: tags.length,
      },
    });
  } catch (error) {
    console.error("Erreur fill-labels google tags:", error);
    return NextResponse.json(
      { message: "Erreur lors du remplissage des labels" },
      { status: 500 },
    );
  }
}
