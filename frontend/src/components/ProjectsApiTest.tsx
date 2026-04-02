import { useEffect, useMemo, useState } from "react";

type ProjectRow = {
  id: string;
  createdAt?: string;
  projectName: string;
  clientName: string;
  projectType: string;
  status: string;
};

type FormState = {
  projectName: string;
  clientName: string;
  projectType: string;
  status: string;
};

const DEFAULT_FORM: FormState = {
  projectName: "",
  clientName: "",
  projectType: "",
  status: "",
};

export function ProjectsApiTest() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);

  const canSubmit = useMemo(() => {
    return (
      form.projectName.trim() &&
      form.clientName.trim() &&
      form.projectType.trim() &&
      form.status.trim()
    );
  }, [form]);

  async function loadProjects() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data)) throw new Error("Unexpected response");
      setProjects(data as ProjectRow[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Please fill all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: form.projectName.trim(),
          clientName: form.clientName.trim(),
          projectType: form.projectType.trim(),
          status: form.status.trim(),
        }),
      });

      if (!res.ok) {
        const maybeJson = await res
          .json()
          .catch(() => null as unknown as { error?: unknown } | null);
        const details =
          maybeJson && typeof maybeJson === "object" && "error" in maybeJson
            ? String((maybeJson as { error?: unknown }).error ?? "")
            : "";
        throw new Error(details ? `HTTP ${res.status}: ${details}` : `HTTP ${res.status}`);
      }

      setForm(DEFAULT_FORM);
      await loadProjects();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-4 rounded-md border border-border p-3">
      <p className="mb-2 text-xs text-muted-foreground">
        Temporary test: create/list projects via <code>/api/projects</code>
      </p>

      <form className="mb-3 grid gap-2 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-1 text-xs">
          <span className="text-muted-foreground">projectName</span>
          <input
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={form.projectName}
            onChange={(e) => setForm((s) => ({ ...s, projectName: e.target.value }))}
            placeholder="Website redesign"
          />
        </label>

        <label className="grid gap-1 text-xs">
          <span className="text-muted-foreground">clientName</span>
          <input
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={form.clientName}
            onChange={(e) => setForm((s) => ({ ...s, clientName: e.target.value }))}
            placeholder="Acme"
          />
        </label>

        <label className="grid gap-1 text-xs">
          <span className="text-muted-foreground">projectType</span>
          <input
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={form.projectType}
            onChange={(e) => setForm((s) => ({ ...s, projectType: e.target.value }))}
            placeholder="Website"
          />
        </label>

        <label className="grid gap-1 text-xs">
          <span className="text-muted-foreground">status</span>
          <input
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={form.status}
            onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            placeholder="New"
          />
        </label>

        <div className="sm:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create project"}
          </button>
          <button
            type="button"
            onClick={() => void loadProjects()}
            className="h-9 rounded-md border border-border px-3 text-sm"
          >
            Refresh
          </button>
        </div>
      </form>

      {error ? <p className="mb-2 text-xs text-destructive">Error: {error}</p> : null}
      {loading ? <p className="text-xs text-muted-foreground">Loading...</p> : null}

      {!loading && projects.length === 0 ? (
        <p className="text-xs text-muted-foreground">No projects yet.</p>
      ) : null}

      {!loading && projects.length > 0 ? (
        <ul className="space-y-1 text-xs">
          {projects.map((p) => (
            <li key={p.id} className="rounded border border-border px-2 py-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <strong className="text-foreground">{p.projectName}</strong>
                <span className="text-muted-foreground">({p.clientName})</span>
                <span className="text-muted-foreground">{p.projectType}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{p.status}</span>
                <span className="text-muted-foreground">•</span>
                <code className="text-muted-foreground">{p.id}</code>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

