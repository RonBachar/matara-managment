import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

type LegacyClientServiceRow = {
  id: string;
  packageType: string | null;
  renewalPrice: Prisma.Decimal | number | string | null;
  renewalDate: string | null;
};

function normalizeLegacyPrice(value: Prisma.Decimal | number | string | null): number | null {
  if (value === null || value === undefined) return null;
  const numberValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number(value.toString());
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getLegacyServiceType(packageType: string): string {
  if (packageType === "Hosting Only") return "Hosting";
  if (packageType === "Elementor Pro Only") return "License";
  if (packageType === "Hosting + Elementor Pro") return "Custom service";
  return "Custom service";
}

function getLegacyServiceName(packageType: string): string {
  if (packageType === "Hosting Only") return "Hosting";
  if (packageType === "Elementor Pro Only") return "Elementor Pro";
  if (packageType === "Hosting + Elementor Pro") return "Hosting + Elementor Pro";
  return packageType;
}

function buildLegacyServiceData(row: LegacyClientServiceRow): Prisma.ClientServiceUncheckedCreateInput | null {
  const packageType = row.packageType?.trim();
  if (!packageType || packageType === "None") return null;

  return {
    clientId: row.id,
    type: getLegacyServiceType(packageType),
    name: getLegacyServiceName(packageType),
    renewalPrice: normalizeLegacyPrice(row.renewalPrice),
    renewalDate: row.renewalDate?.trim() || null,
    reminderDaysBefore: null,
    status: "Active",
    notes: "Migrated from legacy client package data.",
  };
}

export async function materializeLegacyClientServices(clientIds: string[]): Promise<void> {
  const ids = Array.from(new Set(clientIds.map((id) => id.trim()).filter(Boolean)));
  if (ids.length === 0) return;

  const existing = await prisma.clientService.findMany({
    where: { clientId: { in: ids } },
    select: { clientId: true },
  });
  const clientsWithServices = new Set(existing.map((row) => row.clientId));
  const missingIds = ids.filter((id) => !clientsWithServices.has(id));
  if (missingIds.length === 0) return;

  const rows = await prisma.$queryRaw<LegacyClientServiceRow[]>(Prisma.sql`
    SELECT "id", "packageType", "renewalPrice", "renewalDate"
    FROM "Client"
    WHERE "id" IN (${Prisma.join(missingIds)})
  `);

  const legacyServices = rows
    .map(buildLegacyServiceData)
    .filter((row): row is Prisma.ClientServiceUncheckedCreateInput => row !== null);

  if (legacyServices.length === 0) return;

  await prisma.clientService.createMany({
    data: legacyServices,
    skipDuplicates: false,
  });
}

export async function includeServicesForAllClients() {
  const ids = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  await materializeLegacyClientServices(ids.map((row) => row.id));

  return prisma.client.findMany({
    include: {
      services: {
        orderBy: [{ renewalDate: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function includeServicesForClient(id: string) {
  await materializeLegacyClientServices([id]);
  return prisma.client.findUnique({
    where: { id },
    include: {
      services: {
        orderBy: [{ renewalDate: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}
