import { readFile } from "node:fs/promises";
import { prisma } from "../db/prisma";

type BackupShape = {
  matara_projects?: unknown;
};

type LegacyProject = {
  id?: unknown;
  projectName?: unknown;
  clientId?: unknown;
  clientName?: unknown;
  projectType?: unknown;
  status?: unknown;
  totalAmount?: unknown;
  paidAmount?: unknown;
  remainingAmount?: unknown;
  hourlyRate?: unknown;
  workedHours?: unknown;
  billableTotal?: unknown;
  notes?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function usageAndExit(): never {
  // eslint-disable-next-line no-console
  console.error(
    [
      "Usage:",
      "  npm run db:import-projects -- <path-to-backup.json> [--dry-run]",
      "",
      "Notes:",
      "  - Reads `matara_projects` from your exported backup JSON.",
      "  - Inserts into the Project table using the legacy `id` as the DB primary key.",
      "  - Re-running is safe: duplicates are skipped by primary key.",
    ].join("\n"),
  );
  process.exit(1);
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
  const rows = backup.matara_projects;
  if (!Array.isArray(rows)) {
    throw new Error("Expected `matara_projects` to be an array in the backup JSON");
  }

  const candidates = (rows as unknown[]).filter(isRecord) as LegacyProject[];

  const data = candidates
    .map((p) => {
      const id = asString(p.id).trim();
      const projectName = asString(p.projectName).trim();
      const clientId = asString(p.clientId).trim();
      const clientName = asString(p.clientName).trim();
      const projectType = asString(p.projectType).trim();
      const status = asString(p.status).trim();
      const notesRaw = p.notes;
      const notes = typeof notesRaw === "string" ? notesRaw.trim() : undefined;

      if (!id || !projectName || !clientId || !clientName || !projectType || !status) return null;

      return {
        id,
        projectName,
        clientId,
        clientName,
        projectType,
        status,
        totalAmount: asNumber(p.totalAmount),
        paidAmount: asNumber(p.paidAmount),
        remainingAmount: asNumber(p.remainingAmount),
        hourlyRate: asNumber(p.hourlyRate),
        workedHours: asNumber(p.workedHours),
        billableTotal: asNumber(p.billableTotal),
        notes: notes && notes.length > 0 ? notes : undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // eslint-disable-next-line no-console
  console.log(
    `Found ${rows.length} raw rows, ${candidates.length} objects, ${data.length} importable projects.`,
  );

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log("Dry run enabled. No database writes performed.");
    return;
  }

  const result = await prisma.project.createMany({
    data,
    skipDuplicates: true,
  });

  // eslint-disable-next-line no-console
  console.log(`Inserted ${result.count} projects. (Duplicates skipped by id.)`);
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

