import type {
    GoogleTag,
    GoogleTagGroup,
    GoogleTagSubGroup,
} from "@prisma/client";

export type SerializedGoogleTagSubGroup = {
  id: string;
  name: string;
  groupId: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export type SerializedGoogleTag = {
  id: string;
  techName: string;
  displayName: string | null;
  isActive: boolean;
  source: string;
  subGroupId: string | null;
  sortOrder: number;
  updatedAt: string;
};

export type SerializedGoogleTagGroup = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export type SerializedPrincipalGroup = {
  id: string;
  name: string;
  sortOrder: number;
};

export type SerializedSubGroupOption = {
  id: string;
  name: string;
  sortOrder: number;
  groupId: string;
  groupName: string;
};

export type SerializedSubGroupSection = {
  id: string;
  name: string;
  sortOrder: number;
  subGroups: Array<{ id: string; name: string; sortOrder: number }>;
};

export function serializeGoogleTagSubGroup(
  subGroup: Pick<
    GoogleTagSubGroup,
    "id" | "name" | "groupId" | "sortOrder" | "isActive" | "updatedAt"
  >,
): SerializedGoogleTagSubGroup {
  return {
    id: subGroup.id.toString(),
    name: subGroup.name,
    groupId: subGroup.groupId.toString(),
    sortOrder: subGroup.sortOrder,
    isActive: subGroup.isActive,
    updatedAt: subGroup.updatedAt.toISOString(),
  };
}

export function serializeGoogleTag(
  tag: Pick<
    GoogleTag,
    | "id"
    | "techName"
    | "displayName"
    | "isActive"
    | "source"
    | "subGroupId"
    | "sortOrder"
    | "updatedAt"
  >,
): SerializedGoogleTag {
  return {
    id: tag.id.toString(),
    techName: tag.techName,
    displayName: tag.displayName,
    isActive: tag.isActive,
    source: tag.source,
    subGroupId: tag.subGroupId?.toString() ?? null,
    sortOrder: tag.sortOrder,
    updatedAt: tag.updatedAt.toISOString(),
  };
}

export function serializeGoogleTagGroup(
  group: Pick<
    GoogleTagGroup,
    "id" | "name" | "sortOrder" | "isActive" | "updatedAt"
  >,
): SerializedGoogleTagGroup {
  return {
    id: group.id.toString(),
    name: group.name,
    sortOrder: group.sortOrder,
    isActive: group.isActive,
    updatedAt: group.updatedAt.toISOString(),
  };
}

export function buildPrincipalGroups(
  groups: Array<Pick<GoogleTagGroup, "id" | "name" | "sortOrder" | "isActive">>,
): SerializedPrincipalGroup[] {
  return groups
    .filter((group) => group.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((group) => ({
      id: group.id.toString(),
      name: group.name,
      sortOrder: group.sortOrder,
    }));
}

export function buildSubGroupSections(
  groups: Array<
    Pick<GoogleTagGroup, "id" | "name" | "sortOrder" | "isActive"> & {
      subGroups: Array<
        Pick<GoogleTagSubGroup, "id" | "name" | "sortOrder" | "isActive">
      >;
    }
  >,
): SerializedSubGroupSection[] {
  return groups
    .filter((group) => group.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((group) => ({
      id: group.id.toString(),
      name: group.name,
      sortOrder: group.sortOrder,
      subGroups: group.subGroups
        .filter((subGroup) => subGroup.isActive)
        .sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        )
        .map((subGroup) => ({
          id: subGroup.id.toString(),
          name: subGroup.name,
          sortOrder: subGroup.sortOrder,
        })),
    }))
    .filter((group) => group.subGroups.length > 0);
}
