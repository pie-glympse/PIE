"use client";

type SubGroupOption = {
  id: string;
  name: string;
  sortOrder?: number;
};

type SubGroupSection = {
  id: string;
  name: string;
  subGroups: SubGroupOption[];
};

type SubGroupPickerProps = {
  sections: SubGroupSection[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export default function SubGroupPicker({
  sections,
  selectedIds,
  onToggle,
}: SubGroupPickerProps) {
  if (sections.length === 0) {
    return (
      <p className="text-sm text-[var(--color-grey-three)] font-poppins">
        Aucun sous-groupe disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="text-body-large font-poppins font-medium text-[var(--color-text)] mb-2">
            {section.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            {section.subGroups.map((subGroup) => {
              const isSelected = selectedIds.includes(subGroup.id);
              return (
                <button
                  type="button"
                  key={subGroup.id}
                  onClick={() => onToggle(subGroup.id)}
                  className={`px-3 py-2 rounded border font-poppins text-body-small transition-all duration-200 hover:scale-105 hover:shadow-md ${
                    isSelected
                      ? "bg-[var(--color-main)] text-white border-[var(--color-main)] shadow-md scale-105"
                      : "bg-white text-[var(--color-text)] border-[var(--color-grey-two)] hover:border-[var(--color-main)]"
                  }`}
                >
                  {subGroup.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

type PrincipalGroup = {
  id: string;
  name: string;
};

type PrincipalGroupPickerProps = {
  groups: PrincipalGroup[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export function PrincipalGroupPicker({
  groups,
  selectedIds,
  onToggle,
}: PrincipalGroupPickerProps) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-[var(--color-grey-three)] font-poppins">
        Aucun groupe d&apos;activité disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((group) => {
        const isSelected = selectedIds.includes(group.id);
        return (
          <button
            type="button"
            key={group.id}
            onClick={() => onToggle(group.id)}
            className={`px-3 py-2 rounded border font-poppins text-body-small transition-all duration-200 hover:scale-105 hover:shadow-md ${
              isSelected
                ? "bg-[var(--color-main)] text-white border-[var(--color-main)] shadow-md scale-105"
                : "bg-white text-[var(--color-text)] border-[var(--color-grey-two)] hover:border-[var(--color-main)]"
            }`}
          >
            {group.name}
          </button>
        );
      })}
    </div>
  );
}

export function buildSubGroupSectionsFromEventGroups(
  groups: Array<{
    id: string | bigint;
    name: string;
    sortOrder?: number;
    subGroups?: Array<{
      id: string | bigint;
      name: string;
      sortOrder?: number;
    }>;
  }>,
): SubGroupSection[] {
  return groups
    .map((group) => ({
      id: String(group.id),
      name: group.name,
      sortOrder: group.sortOrder ?? 0,
      subGroups: (group.subGroups ?? []).map((subGroup) => ({
        id: String(subGroup.id),
        name: subGroup.name,
        sortOrder: subGroup.sortOrder,
      })),
    }))
    .filter((group) => group.subGroups.length > 0)
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );
}
