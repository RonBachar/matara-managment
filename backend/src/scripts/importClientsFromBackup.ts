import { readFile } from "node:fs/promises";
import { prisma } from "../db/prisma";

type BackupShape = {
  matara_clients?: unknown;
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
      "  npm run db:import-clients -- <path-to-backup.json> [--dry-run]",
      "",
      "Notes:",
      "  - Reads `matara_clients` from your exported backup JSON.",
      "  - Inserts into the Client table using the legacy `id` as the DB primary key.",
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
  const rows = backup.matara_clients;
  if (!Array.isArray(rows)) {
    throw new Error("Expected `matara_clients` to be an array in the backup JSON");
  }

  const candidates = (rows as unknown[]).filter(isRecord);

  const data = candidates
    .map((c) => {
      const id = asString(c.id).trim() || String(Date.now());
      const clientName =
        (asString(c.clientName).trim() || asString(c.contactPerson).trim() || "").trim();
      if (!clientName) return null;

      const businessName = asString(c.businessName).trim();
      const phone = asString(c.phone).trim();
      const email = asString(c.email).trim();
      const website = asString(c.website).trim();
      const notes = asString(c.notes).trim();

      const packageType = asString(c.packageType).trim();
      const renewalPrice = asNumber(c.renewalPrice, 0);
      const renewalDate = asString(c.renewalDate).trim();

      return {
        id,
        clientName,
        businessName,
        phone,
        email,
        website: website || null,
        notes: notes || null,
        packageType: packageType || null,
        renewalPrice: packageType && packageType !== "None" ? renewalPrice : null,
        renewalDate: packageType && packageType !== "None" ? (renewalDate || null) : null,
        contractFileId: asString(c.contractFileId).trim() || null,
        contractFileName: asString(c.contractFileName).trim() || null,
        contractFileType: asString(c.contractFileType).trim() || null,
        agreementFileId: asString(c.agreementFileId).trim() || null,
        agreementFileName: asString(c.agreementFileName).trim() || null,
        agreementFileType: asString(c.agreementFileType).trim() || null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // eslint-disable-next-line no-console
  console.log(
    `Found ${rows.length} raw rows, ${candidates.length} objects, ${data.length} importable clients.`,
  );

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log("Dry run enabled. No database writes performed.");
    return;
  }

  const result = await prisma.client.createMany({
    data,
    skipDuplicates: true,
  });

  // eslint-disable-next-line no-console
  console.log(`Inserted ${result.count} clients. (Duplicates skipped by id.)`);
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

