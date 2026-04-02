import { readFile } from "node:fs/promises";
import { prisma } from "../db/prisma";

type BackupShape = {
  matara_project_briefs?: unknown;
};

type LegacyBrief = Record<string, unknown> & {
  id?: unknown;
  projectId?: unknown;
  briefTitle?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asDate(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

async function loadLegacyBriefs(backupPath: string, ids: string[]): Promise<LegacyBrief[]> {
  const raw = await readFile(backupPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) throw new Error("Backup JSON must be an object");
  const backup = parsed as BackupShape;
  if (!Array.isArray(backup.matara_project_briefs)) {
    throw new Error("Expected `matara_project_briefs` to be an array in the backup JSON");
  }
  const rows = (backup.matara_project_briefs as unknown[]).filter(isRecord) as LegacyBrief[];
  const want = new Set(ids);
  return rows.filter((b) => want.has(asString(b.id).trim()));
}

async function requireUniqueProject(where: Parameters<typeof prisma.project.findMany>[0]["where"]) {
  const rows = await prisma.project.findMany({
    where,
    select: { id: true, projectName: true, clientId: true, clientName: true },
  });
  if (rows.length === 0) throw new Error("Project not found for mapping");
  if (rows.length > 1) {
    throw new Error(
      `Project mapping is ambiguous. Candidates: ${rows
        .map((p) => `${p.id} (${p.projectName})`)
        .join(", ")}`,
    );
  }
  return rows[0];
}

async function upsertBriefForProject(opts: { legacy: LegacyBrief; projectId: string }) {
  const legacyId = asString(opts.legacy.id).trim();
  const legacyTitle = asString(opts.legacy.briefTitle).trim();

  const existingForProject = await prisma.projectBrief.findUnique({
    where: { projectId: opts.projectId },
    select: { id: true },
  });

  if (existingForProject) {
    return {
      action: "skipped_project_already_has_brief" as const,
      legacyId,
      legacyTitle,
      projectId: opts.projectId,
      existingBriefId: existingForProject.id,
    };
  }

  const createdAt = asDate(opts.legacy.createdAt);
  const updatedAt = asDate(opts.legacy.updatedAt);

  const data = {
    ...opts.legacy,
    projectId: opts.projectId,
  };

  try {
    const created = await prisma.projectBrief.create({
      data: {
        id: legacyId || undefined,
        projectId: opts.projectId,
        data,
        createdAt,
        updatedAt,
      },
      select: { id: true },
    });
    return {
      action: "inserted" as const,
      legacyId,
      legacyTitle,
      projectId: opts.projectId,
      briefId: created.id,
    };
  } catch (err: unknown) {
    // If the legacy id already exists, update that row to point to the mapped project.
    const msg = err instanceof Error ? err.message : String(err);
    if (legacyId && msg.toLowerCase().includes("unique")) {
      const updated = await prisma.projectBrief.update({
        where: { id: legacyId },
        data: {
          projectId: opts.projectId,
          data,
          createdAt,
          updatedAt,
        },
        select: { id: true },
      });
      return {
        action: "updated_existing_id" as const,
        legacyId,
        legacyTitle,
        projectId: opts.projectId,
        briefId: updated.id,
      };
    }
    throw err;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const backupPath = args[0];
  if (!backupPath) {
    throw new Error("Usage: tsx src/scripts/importManuallyMappedBriefs.ts <path-to-backup.json>");
  }

  // Manual mappings requested by user (no guessing):
  // 1) legacy brief 1774405255696 ("Simple AI") -> current Simple AI project
  // 2) legacy brief 1774746945664 ("איילון מעודה") -> current Ayalon project
  const legacyIds = ["1774405255696", "1774746945664"];
  const legacyBriefs = await loadLegacyBriefs(backupPath, legacyIds);

  const byId = new Map(legacyBriefs.map((b) => [asString(b.id).trim(), b]));
  for (const id of legacyIds) {
    if (!byId.has(id)) throw new Error(`Legacy brief id ${id} not found in backup`);
  }

  const simpleAiLegacyProjectId = "1774404490526";
  const simpleAiProject =
    (await prisma.project.findFirst({
      where: { id: simpleAiLegacyProjectId },
      select: { id: true, projectName: true, clientId: true, clientName: true },
    })) ??
    (await prisma.project.findFirst({
      where: { projectName: "Simple AI" },
      select: { id: true, projectName: true, clientId: true, clientName: true },
    })) ??
    (await prisma.project.findFirst({
      where: { projectName: { contains: "Simple", mode: "insensitive" } },
      select: { id: true, projectName: true, clientId: true, clientName: true },
    })) ??
    (await prisma.project.findFirst({
      where: { clientId: "1774403902163" },
      select: { id: true, projectName: true, clientId: true, clientName: true },
    }));

  // For Ayalon, match by clientId from legacy data import (no guessing by name).
  const ayalonProject = await requireUniqueProject({ clientId: "1774445505634" });

  const results = [];
  if (simpleAiProject) {
    results.push(
      await upsertBriefForProject({
        legacy: byId.get("1774405255696")!,
        projectId: simpleAiProject.id,
      }),
    );
  } else {
    results.push({
      action: "skipped_project_not_found" as const,
      legacyId: "1774405255696",
      legacyTitle: asString(byId.get("1774405255696")!.briefTitle).trim(),
      requestedMatch: {
        projectName: "Simple AI",
        legacyProjectId: simpleAiLegacyProjectId,
        legacyClientId: "1774403902163",
      },
    });
  }
  results.push(
    await upsertBriefForProject({
      legacy: byId.get("1774746945664")!,
      projectId: ayalonProject.id,
    }),
  );

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ mapping: { simpleAiProject, ayalonProject }, results }, null, 2));
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

