"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type GoogleTagRow = {
  id: string;
  techName: string;
  displayName: string | null;
  isActive: boolean;
  source: string;
  updatedAt: string;
};

type SyncSummary = {
  fetched: number;
  created: number;
  reactivated: number;
  inactivated: number;
};

export default function OfficeTagsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<GoogleTagRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);

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
        throw new Error("Impossible de charger les tags");
      }
      const data = (await response.json()) as GoogleTagRow[];
      setRows(data);
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
    if (!term) return rows;
    return rows.filter((row) => {
      const techName = row.techName.toLowerCase();
      const displayName = (row.displayName || "").toLowerCase();
      return techName.includes(term) || displayName.includes(term);
    });
  }, [rows, search]);

  const updateRow = (id: string, patch: Partial<GoogleTagRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/office/google-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: rows.map((row) => ({
            techName: row.techName,
            displayName: row.displayName || "",
            isActive: row.isActive,
          })),
        }),
      });

      if (response.status === 401) {
        router.push("/office/login");
        return;
      }
      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({ message: "Sauvegarde impossible" }));
        throw new Error(data.message || "Sauvegarde impossible");
      }

      setMessage("Mappings sauvegardés.");
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

  const handleLogout = async () => {
    await fetch("/api/office/logout", { method: "POST" });
    router.push("/office/login");
  };

  return (
    <main className="min-h-screen pt-32 bg-gray-50 p-6">
      <section className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Office - Google Tags</h1>
            <p className="text-sm text-gray-600">
              Associez les noms techniques Google (`techName`) aux noms
              affichés.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {syncing ? "Sync..." : "Sync depuis Google docs"}
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
          <label htmlFor="tags-search" className="text-sm font-medium">
            Rechercher un tag
          </label>
          <input
            id="tags-search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex: golf_course ou Golf"
            className="w-full border rounded px-3 py-2"
          />

          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {syncSummary && (
            <p className="text-sm text-gray-700">
              Sync: {syncSummary.fetched} récupérés, {syncSummary.created}{" "}
              créés, {syncSummary.reactivated} réactivés,{" "}
              {syncSummary.inactivated} désactivés.
            </p>
          )}
        </div>

        <div className="bg-white border rounded overflow-auto max-h-[70vh]">
          {loading ? (
            <p className="p-4 text-sm">Chargement...</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Tech name</th>
                  <th className="text-left px-3 py-2 border-b">Display name</th>
                  <th className="text-left px-3 py-2 border-b">Actif</th>
                  <th className="text-left px-3 py-2 border-b">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 border-b font-mono">
                      {row.techName}
                    </td>
                    <td className="px-3 py-2 border-b">
                      <input
                        type="text"
                        value={row.displayName || ""}
                        onChange={(event) =>
                          updateRow(row.id, { displayName: event.target.value })
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <input
                        type="checkbox"
                        checked={row.isActive}
                        onChange={(event) =>
                          updateRow(row.id, { isActive: event.target.checked })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 border-b text-gray-600">
                      {row.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
