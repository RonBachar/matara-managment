import { readFile } from "node:fs/promises";
import { prisma } from "../db/prisma";

type BackupShape = {
  matara_project_briefs?: unknown;
};

type LegacyBrief = Record<string, unknown> & {
  id?: unknown;
  projectId?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function usageAndExit(): never {
  // eslint-disable-next-line no-console
  console.error(
    [
      "Usage:",
      "  npm run db:import-briefs -- <path-to-backup.json> [--dry-run]",
      "",
      "Rules:",
      "  - Reads `matara_project_briefs` from your exported backup JSON.",
      '  - Imports only briefs whose `projectId` matches an existing Project.id in the DB.',
      '  - Does NOT guess links for `legacy-...` project ids; those are reported as unmatched.',
      "  - Respects one-brief-per-project: if a Project already has a brief in DB, it is skipped.",
      "",
      "Examples:",
      "  npm run db:import-briefs -- ..\\backup.json --dry-run",
      "  npm run db:import-briefs -- ..\\backup.json",
    ].join("\n"),
  );
  process.exit(1);
}

function pickLatestPerProject(briefs: LegacyBrief[]): LegacyBrief[] {
  const map = new Map<string, LegacyBrief>();
  for (const b of briefs) {
    const projectId = asString(b.projectId).trim();
    if (!projectId) continue;
    const cur = map.get(projectId);
    if (!cur) {
      map.set(projectId, b);
      continue;
    }
    const curTs = asDate(cur.updatedAt)?.getTime() ?? asDate(cur.createdAt)?.getTime() ?? 0;
    const nextTs = asDate(b.updatedAt)?.getTime() ?? asDate(b.createdAt)?.getTime() ?? 0;
    if (nextTs >= curTs) map.set(projectId, b);
  }
  return [...map.values()];
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");

  if (!filePath) usageAndExit();

  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) throw new Error("Backup JSON must be an object");

  const backup = parsed as BackupShape;
  const rows = backup.matara_project_briefs;
  if (!Array.isArray(rows)) {
    throw new Error("Expected `matara_project_briefs` to be an array in the backup JSON");
  }

  const candidates = (rows as unknown[]).filter(isRecord) as LegacyBrief[];
  const deduped = pickLatestPerProject(candidates);

  const projectIds = deduped.map((b) => asString(b.projectId).trim()).filter(Boolean);
  const existingProjects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true },
  });
  const existingProjectIds = new Set(existingProjects.map((p) => p.id));

  const existingBriefs = await prisma.projectBrief.findMany({
    where: { projectId: { in: projectIds } },
    select: { projectId: true, id: true },
  });
  const existingBriefByProjectId = new Map(existingBriefs.map((b) => [b.projectId, b.id]));

  const importable: LegacyBrief[] = [];
  const unmatched: Array<{ id: string; projectId: string; briefTitle: string }> = [];
  const alreadyHasBrief: Array<{ id: string; projectId: string; existingBriefId: string }> = [];

  for (const b of deduped) {
    const id = asString(b.id).trim();
    const projectId = asString(b.projectId).trim();
    const briefTitle = asString(b.briefTitle).trim();

    if (!projectId || !existingProjectIds.has(projectId)) {
      unmatched.push({ id, projectId, briefTitle });
      continue;
    }

    const existingBriefId = existingBriefByProjectId.get(projectId);
    if (existingBriefId) {
      alreadyHasBrief.push({ id, projectId, existingBriefId });
      continue;
    }

    importable.push(b);
  }

  // eslint-disable-next-line no-console
  console.log(
    [
      `Found ${rows.length} raw rows, ${candidates.length} objects.`,
      `After de-dupe by projectId: ${deduped.length} briefs.`,
      `Importable (project exists + no brief yet): ${importable.length}`,
      `Unmatched (projectId missing/not found): ${unmatched.length}`,
      `Skipped (project already has brief): ${alreadyHasBrief.length}`,
    ].join("\n"),
  );

  if (unmatched.length > 0) {
    // eslint-disable-next-line no-console
    console.log("\nUnmatched briefs (NOT imported):");
    for (const u of unmatched) {
      // eslint-disable-next-line no-console
      console.log(`- id=${u.id || "(missing)"} projectId=${u.projectId || "(missing)"} title=${u.briefTitle || "(no title)"}`);
    }
  }

  if (alreadyHasBrief.length > 0) {
    // eslint-disable-next-line no-console
    console.log("\nSkipped because project already has a brief in DB:");
    for (const s of alreadyHasBrief) {
      // eslint-disable-next-line no-console
      console.log(`- legacyId=${s.id || "(missing)"} projectId=${s.projectId} existingBriefId=${s.existingBriefId}`);
    }
  }

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log("\nDry run enabled. No database writes performed.");
    return;
  }

  let inserted = 0;
  for (const b of importable) {
    const legacyId = asString(b.id).trim();
    const projectId = asString(b.projectId).trim();

    // Preserve payload as much as possible; DB is source of truth for the linkage.
    const data = {
      ...b,
      projectId,
    };

    // Keep timestamps if they look valid.
    const createdAt = asDate(b.createdAt);
    const updatedAt = asDate(b.updatedAt);

    await prisma.projectBrief.create({
      data: {
        id: legacyId || undefined,
        projectId,
        data,
        createdAt: createdAt ?? undefined,
        updatedAt: updatedAt ?? undefined,
      },
    });
    inserted += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`\nInserted ${inserted} project briefs.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

