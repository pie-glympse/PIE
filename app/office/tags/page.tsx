"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type GoogleTagGroupRow = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

type GoogleTagSubGroupRow = {
  id: string;
  name: string;
  groupId: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

type GoogleTagRow = {
  id: string;
  techName: string;
  displayName: string | null;
  isActive: boolean;
  source: string;
  subGroupId: string | null;
  sortOrder: number;
  updatedAt: string;
};

type SyncSummary = {
  fetched: number;
  created: number;
  reactivated: number;
  inactivated: number;
};

type FillSummary = {
  labelsFilled: number;
  groupsAssigned: number;
  totalTags: number;
};

export default function OfficeTagsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GoogleTagGroupRow[]>([]);
  const [subGroups, setSubGroups] = useState<GoogleTagSubGroupRow[]>([]);
  const [rows, setRows] = useState<GoogleTagRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [selectedSubGroupFilter, setSelectedSubGroupFilter] =
    useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filling, setFilling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [fillSummary, setFillSummary] = useState<FillSummary | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newSubGroupName, setNewSubGroupName] = useState("");
  const [newSubGroupParentId, setNewSubGroupParentId] = useState("");

  const loadTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/office/google-tags", {
        cache: "no-store",
      });
      if (response.status === 401) {
        router.push("/office/login");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          (data && typeof data.message === "string" && data.message) ||
            "Impossible de charger les tags",
        );
      }
      const data = await response.json();
      setGroups(Array.isArray(data.groups) ? data.groups : []);
      setSubGroups(Array.isArray(data.subGroups) ? data.subGroups : []);
      setRows(Array.isArray(data.tags) ? data.tags : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Erreur de chargement",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (selectedGroupFilter !== "all") {
        const subGroup = subGroups.find((item) => item.id === row.subGroupId);
        if (selectedGroupFilter === "ungrouped") {
          if (row.subGroupId) return false;
        } else if (subGroup?.groupId !== selectedGroupFilter) {
          return false;
        }
      }

      if (
        selectedSubGroupFilter !== "all" &&
        selectedSubGroupFilter !== "ungrouped" &&
        row.subGroupId !== selectedSubGroupFilter
      ) {
        return false;
      }

      if (selectedSubGroupFilter === "ungrouped" && row.subGroupId) {
        return false;
      }

      if (!term) return true;
      const techName = row.techName.toLowerCase();
      const displayName = (row.displayName || "").toLowerCase();
      return techName.includes(term) || displayName.includes(term);
    });
  }, [rows, search, selectedGroupFilter, selectedSubGroupFilter, subGroups]);

  const groupedRows = useMemo(() => {
    const bySubGroup = new Map<string, GoogleTagRow[]>();
    for (const row of filteredRows) {
      const key = row.subGroupId || "ungrouped";
      if (!bySubGroup.has(key)) bySubGroup.set(key, []);
      bySubGroup.get(key)?.push(row);
    }

    const sections: Array<{
      id: string;
      name: string;
      groupName: string;
      tags: GoogleTagRow[];
    }> = [];

    for (const group of groups.filter((item) => item.isActive)) {
      const groupSubGroups = subGroups
        .filter((item) => item.groupId === group.id && item.isActive)
        .sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        );

      for (const subGroup of groupSubGroups) {
        const tags = bySubGroup.get(subGroup.id) || [];
        if (tags.length > 0) {
          sections.push({
            id: subGroup.id,
            name: subGroup.name,
            groupName: group.name,
            tags,
          });
        }
      }
    }

    const ungrouped = bySubGroup.get("ungrouped") || [];
    if (ungrouped.length > 0) {
      sections.push({
        id: "ungrouped",
        name: "Sans sous-groupe",
        groupName: "—",
        tags: ungrouped,
      });
    }

    return sections;
  }, [filteredRows, groups, subGroups]);

  const updateRow = (id: string, patch: Partial<GoogleTagRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const updateGroup = (id: string, patch: Partial<GoogleTagGroupRow>) => {
    setGroups((prev) =>
      prev.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    );
  };

  const updateSubGroup = (id: string, patch: Partial<GoogleTagSubGroupRow>) => {
    setSubGroups((prev) =>
      prev.map((subGroup) =>
        subGroup.id === id ? { ...subGroup, ...patch } : subGroup,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const groupsResponse = await fetch("/api/office/google-tag-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groups: groups.map((group) => ({
            id: group.id.startsWith("new-") ? undefined : group.id,
            name: group.name,
            sortOrder: group.sortOrder,
            isActive: group.isActive,
          })),
        }),
      });

      if (groupsResponse.status === 401) {
        router.push("/office/login");
        return;
      }
      if (!groupsResponse.ok) {
        const data = await groupsResponse
          .json()
          .catch(() => ({ message: "Sauvegarde groupes impossible" }));
        throw new Error(data.message || "Sauvegarde groupes impossible");
      }

      const refreshedResponse = await fetch("/api/office/google-tags", {
        cache: "no-store",
      });
      if (!refreshedResponse.ok) {
        throw new Error("Impossible de recharger les groupes");
      }
      const refreshedData = await refreshedResponse.json();
      const refreshedGroups: GoogleTagGroupRow[] = Array.isArray(
        refreshedData.groups,
      )
        ? refreshedData.groups
        : [];
      const refreshedSubGroups: GoogleTagSubGroupRow[] = Array.isArray(
        refreshedData.subGroups,
      )
        ? refreshedData.subGroups
        : [];

      const subGroupNameByLocalId = new Map(
        subGroups.map((subGroup) => [subGroup.id, subGroup.name.trim()]),
      );
      const subGroupParentByLocalId = new Map(
        subGroups.map((subGroup) => [subGroup.id, subGroup.groupId]),
      );

      const subGroupsResponse = await fetch(
        "/api/office/google-tag-sub-groups",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subGroups: subGroups.map((subGroup) => ({
              id: subGroup.id.startsWith("new-") ? undefined : subGroup.id,
              name: subGroup.name,
              groupId: subGroup.groupId.startsWith("new-")
                ? refreshedGroups.find(
                    (group) =>
                      group.name ===
                      groups.find((item) => item.id === subGroup.groupId)?.name,
                  )?.id || subGroup.groupId
                : subGroup.groupId,
              sortOrder: subGroup.sortOrder,
              isActive: subGroup.isActive,
            })),
          }),
        },
      );

      if (subGroupsResponse.status === 401) {
        router.push("/office/login");
        return;
      }
      if (!subGroupsResponse.ok) {
        const data = await subGroupsResponse
          .json()
          .catch(() => ({ message: "Sauvegarde sous-groupes impossible" }));
        throw new Error(data.message || "Sauvegarde sous-groupes impossible");
      }

      const refreshedSubGroupsResponse = await fetch(
        "/api/office/google-tags",
        {
          cache: "no-store",
        },
      );
      if (!refreshedSubGroupsResponse.ok) {
        throw new Error("Impossible de recharger les sous-groupes");
      }
      const refreshedSubGroupsData = await refreshedSubGroupsResponse.json();
      const latestSubGroups: GoogleTagSubGroupRow[] = Array.isArray(
        refreshedSubGroupsData.subGroups,
      )
        ? refreshedSubGroupsData.subGroups
        : refreshedSubGroups;

      const subGroupIdByGroupAndName = new Map(
        latestSubGroups.map((subGroup) => [
          `${subGroup.groupId}::${subGroup.name}`,
          subGroup.id,
        ]),
      );

      const normalizedRows = rows.map((row) => {
        if (!row.subGroupId || !row.subGroupId.startsWith("new-")) {
          return row;
        }

        const subGroupName = subGroupNameByLocalId.get(row.subGroupId);
        const parentGroupId = subGroupParentByLocalId.get(row.subGroupId);
        if (!subGroupName || !parentGroupId) {
          return { ...row, subGroupId: null };
        }

        const resolvedParentGroupId = parentGroupId.startsWith("new-")
          ? refreshedGroups.find(
              (group) =>
                group.name ===
                groups.find((item) => item.id === parentGroupId)?.name,
            )?.id
          : parentGroupId;

        if (!resolvedParentGroupId) {
          return { ...row, subGroupId: null };
        }

        return {
          ...row,
          subGroupId:
            subGroupIdByGroupAndName.get(
              `${resolvedParentGroupId}::${subGroupName}`,
            ) || null,
        };
      });

      const tagsResponse = await fetch("/api/office/google-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: normalizedRows.map((row) => ({
            techName: row.techName,
            displayName: row.displayName || "",
            isActive: row.isActive,
            subGroupId: row.subGroupId,
            sortOrder: row.sortOrder,
          })),
        }),
      });

      if (tagsResponse.status === 401) {
        router.push("/office/login");
        return;
      }
      if (!tagsResponse.ok) {
        const data = await tagsResponse
          .json()
          .catch(() => ({ message: "Sauvegarde tags impossible" }));
        throw new Error(data.message || "Sauvegarde tags impossible");
      }

      setMessage("Groupes, sous-groupes et tags sauvegardés.");
      await loadTags();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Erreur de sauvegarde",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/office/google-tags/sync", {
        method: "POST",
      });
      if (response.status === 401) {
        router.push("/office/login");
        return;
      }
      const data = await response
        .json()
        .catch(() => ({ message: "Erreur sync" }));
      if (!response.ok) {
        throw new Error(data.message || "Erreur sync");
      }
      setSyncSummary(data.summary || null);
      setMessage("Synchronisation Google terminée.");
      await loadTags();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Erreur sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleFillLabels = async () => {
    setFilling(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/office/google-tags/fill-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignGroups: true }),
      });
      if (response.status === 401) {
        router.push("/office/login");
        return;
      }
      const data = await response
        .json()
        .catch(() => ({ message: "Erreur remplissage labels" }));
      if (!response.ok) {
        throw new Error(data.message || "Erreur remplissage labels");
      }
      setFillSummary(data.summary || null);
      setMessage("Labels remplis et tags regroupés.");
      await loadTags();
    } catch (fillError) {
      setError(
        fillError instanceof Error ? fillError.message : "Erreur remplissage",
      );
    } finally {
      setFilling(false);
    }
  };

  const handleAddGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    setGroups((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name,
        sortOrder: prev.length + 1,
        isActive: true,
        updatedAt: new Date().toISOString(),
      },
    ]);
    setNewGroupName("");
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (groupId.startsWith("new-")) {
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      setSubGroups((prev) =>
        prev.filter((subGroup) => subGroup.groupId !== groupId),
      );
      setRows((prev) =>
        prev.map((row) => {
          const linkedSubGroup = subGroups.find(
            (subGroup) => subGroup.id === row.subGroupId,
          );
          if (linkedSubGroup?.groupId === groupId) {
            return { ...row, subGroupId: null };
          }
          return row;
        }),
      );
      return;
    }

    if (!window.confirm("Supprimer ce groupe ? Les tags seront détachés.")) {
      return;
    }

    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/office/google-tag-groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: groupId }),
      });
      if (response.status === 401) {
        router.push("/office/login");
        return;
      }
      if (!response.ok) {
        throw new Error("Suppression impossible");
      }
      setMessage("Groupe supprimé.");
      await loadTags();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Erreur suppression",
      );
    }
  };

  const handleAddSubGroup = () => {
    const name = newSubGroupName.trim();
    if (!name || !newSubGroupParentId) return;
    setSubGroups((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name,
        groupId: newSubGroupParentId,
        sortOrder:
          prev.filter((item) => item.groupId === newSubGroupParentId).length +
          1,
        isActive: true,
        updatedAt: new Date().toISOString(),
      },
    ]);
    setNewSubGroupName("");
  };

  const handleDeleteSubGroup = async (subGroupId: string) => {
    if (subGroupId.startsWith("new-")) {
      setSubGroups((prev) =>
        prev.filter((subGroup) => subGroup.id !== subGroupId),
      );
      setRows((prev) =>
        prev.map((row) =>
          row.subGroupId === subGroupId ? { ...row, subGroupId: null } : row,
        ),
      );
      return;
    }

    if (
      !window.confirm("Supprimer ce sous-groupe ? Les tags seront détachés.")
    ) {
      return;
    }

    try {
      const response = await fetch("/api/office/google-tag-sub-groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subGroupId }),
      });
      if (!response.ok) throw new Error("Suppression impossible");
      setMessage("Sous-groupe supprimé.");
      await loadTags();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Erreur suppression",
      );
    }
  };

  const handleLogout = async () => {
    await fetch("/api/office/logout", { method: "POST" });
    router.push("/office/login");
  };

  return (
    <div className="min-h-screen pt-32 bg-gray-50 p-6">
      <section className="max-w-7xl mx-auto space-y-4">
        <header className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Office - Google Tags</h1>
            <p className="text-sm text-gray-600">
              Gérez les groupes d&apos;activités et les labels affichés dans
              l&apos;application.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {syncing ? "Sync..." : "Sync Google"}
            </button>
            <button
              type="button"
              onClick={handleFillLabels}
              disabled={filling || loading}
              className="px-4 py-2 rounded bg-violet-600 text-white disabled:opacity-60"
            >
              {filling ? "Traitement..." : "Traduire en français + grouper"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded border border-gray-300 bg-white"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <div className="bg-white border rounded p-4 space-y-3">
          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {syncSummary && (
            <p className="text-sm text-gray-700">
              Sync: {syncSummary.fetched} récupérés, {syncSummary.created}{" "}
              créés, {syncSummary.reactivated} réactivés,{" "}
              {syncSummary.inactivated} désactivés.
            </p>
          )}
          {fillSummary && (
            <p className="text-sm text-gray-700">
              Labels remplis: {fillSummary.labelsFilled}, groupes assignés:{" "}
              {fillSummary.groupsAssigned}, total tags: {fillSummary.totalTags}.
            </p>
          )}
        </div>

        <div className="bg-white border rounded p-4 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-lg font-semibold">Groupes d&apos;activités</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                placeholder="Nouveau groupe"
                className="border rounded px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleAddGroup}
                className="px-3 py-2 rounded border border-gray-300 bg-white text-sm"
              >
                Ajouter
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Nom</th>
                  <th className="text-left px-3 py-2 border-b">Ordre</th>
                  <th className="text-left px-3 py-2 border-b">Actif</th>
                  <th className="text-left px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-3 py-2 border-b">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(event) =>
                          updateGroup(group.id, { name: event.target.value })
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <input
                        type="number"
                        value={group.sortOrder}
                        onChange={(event) =>
                          updateGroup(group.id, {
                            sortOrder: Number(event.target.value) || 0,
                          })
                        }
                        className="w-20 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <input
                        type="checkbox"
                        checked={group.isActive}
                        onChange={(event) =>
                          updateGroup(group.id, {
                            isActive: event.target.checked,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border rounded p-4 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-lg font-semibold">Sous-groupes</h2>
            <div className="flex flex-wrap gap-2">
              <select
                value={newSubGroupParentId}
                onChange={(event) => setNewSubGroupParentId(event.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">Groupe parent</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newSubGroupName}
                onChange={(event) => setNewSubGroupName(event.target.value)}
                placeholder="Nouveau sous-groupe"
                className="border rounded px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleAddSubGroup}
                className="px-3 py-2 rounded border border-gray-300 bg-white text-sm"
              >
                Ajouter
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Nom</th>
                  <th className="text-left px-3 py-2 border-b">Groupe</th>
                  <th className="text-left px-3 py-2 border-b">Ordre</th>
                  <th className="text-left px-3 py-2 border-b">Actif</th>
                  <th className="text-left px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subGroups.map((subGroup) => (
                  <tr key={subGroup.id}>
                    <td className="px-3 py-2 border-b">
                      <input
                        type="text"
                        value={subGroup.name}
                        onChange={(event) =>
                          updateSubGroup(subGroup.id, {
                            name: event.target.value,
                          })
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <select
                        value={subGroup.groupId}
                        onChange={(event) =>
                          updateSubGroup(subGroup.id, {
                            groupId: event.target.value,
                          })
                        }
                        className="w-full border rounded px-2 py-1"
                      >
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 border-b">
                      <input
                        type="number"
                        value={subGroup.sortOrder}
                        onChange={(event) =>
                          updateSubGroup(subGroup.id, {
                            sortOrder: Number(event.target.value) || 0,
                          })
                        }
                        className="w-20 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <input
                        type="checkbox"
                        checked={subGroup.isActive}
                        onChange={(event) =>
                          updateSubGroup(subGroup.id, {
                            isActive: event.target.checked,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <button
                        type="button"
                        onClick={() => handleDeleteSubGroup(subGroup.id)}
                        className="text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border rounded p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="tags-search" className="text-sm font-medium">
                Rechercher un tag
              </label>
              <input
                id="tags-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex: golf_course ou Golf"
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label htmlFor="group-filter" className="text-sm font-medium">
                Filtrer par groupe
              </label>
              <select
                id="group-filter"
                value={selectedGroupFilter}
                onChange={(event) => setSelectedGroupFilter(event.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="all">Tous les groupes</option>
                <option value="ungrouped">Sans sous-groupe</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subgroup-filter" className="text-sm font-medium">
                Filtrer par sous-groupe
              </label>
              <select
                id="subgroup-filter"
                value={selectedSubGroupFilter}
                onChange={(event) =>
                  setSelectedSubGroupFilter(event.target.value)
                }
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="all">Tous les sous-groupes</option>
                <option value="ungrouped">Sans sous-groupe</option>
                {subGroups.map((subGroup) => (
                  <option key={subGroup.id} value={subGroup.id}>
                    {subGroup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="p-4 text-sm bg-white border rounded">Chargement...</p>
          ) : groupedRows.length === 0 ? (
            <p className="p-4 text-sm bg-white border rounded">
              Aucun tag trouvé.
            </p>
          ) : (
            groupedRows.map((section) => (
              <div
                key={section.id}
                className="bg-white border rounded overflow-auto"
              >
                <div className="px-4 py-3 border-b bg-gray-50">
                  <h3 className="font-medium">
                    {section.groupName} · {section.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {section.tags.length} tag(s)
                  </p>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2 border-b">
                        Tech name
                      </th>
                      <th className="text-left px-3 py-2 border-b">
                        Label affiché
                      </th>
                      <th className="text-left px-3 py-2 border-b">
                        Sous-groupe
                      </th>
                      <th className="text-left px-3 py-2 border-b">Ordre</th>
                      <th className="text-left px-3 py-2 border-b">Actif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.tags.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 border-b font-mono">
                          {row.techName}
                        </td>
                        <td className="px-3 py-2 border-b">
                          <input
                            type="text"
                            value={row.displayName || ""}
                            onChange={(event) =>
                              updateRow(row.id, {
                                displayName: event.target.value,
                              })
                            }
                            className="w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2 border-b">
                          <select
                            value={row.subGroupId || ""}
                            onChange={(event) =>
                              updateRow(row.id, {
                                subGroupId: event.target.value || null,
                              })
                            }
                            className="w-full border rounded px-2 py-1"
                          >
                            <option value="">Sans sous-groupe</option>
                            {subGroups.map((subGroup) => (
                              <option key={subGroup.id} value={subGroup.id}>
                                {groups.find(
                                  (group) => group.id === subGroup.groupId,
                                )?.name || "?"}{" "}
                                · {subGroup.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 border-b">
                          <input
                            type="number"
                            value={row.sortOrder}
                            onChange={(event) =>
                              updateRow(row.id, {
                                sortOrder: Number(event.target.value) || 0,
                              })
                            }
                            className="w-20 border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2 border-b">
                          <input
                            type="checkbox"
                            checked={row.isActive}
                            onChange={(event) =>
                              updateRow(row.id, {
                                isActive: event.target.checked,
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
