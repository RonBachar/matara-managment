import type { Client } from "@prisma/client";
import { prisma } from "../db/prisma";

export type LeadConversion =
  | { status: "not_found" }
  | { status: "already_converted"; client: Client }
  | { status: "converted"; client: Client };

/**
 * Turn a lead into a client.
 *
 * The lead is kept and stamped rather than deleted, so a client can always be
 * traced back to the enquiry that produced them, and so the leads list still
 * reflects what actually came in. A lead that was already converted returns
 * its existing client instead of creating a second one. Shared by the leads
 * route and the signed-quote webhook.
 */
export async function convertLeadToClient(
  userId: string,
  leadId: string,
  options: { businessName?: string } = {},
): Promise<LeadConversion> {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
  if (!lead) return { status: "not_found" };

  if (lead.convertedClientId) {
    const existing = await prisma.client.findFirst({
      where: { id: lead.convertedClientId, userId },
    });
    // The client may have been deleted since; only block while it is there.
    if (existing) return { status: "already_converted", client: existing };
  }

  // One transaction: a client without its stamped lead, or the other way
  // round, would leave the two lists disagreeing about what happened.
  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        userId,
        clientName: lead.clientName,
        businessName: options.businessName ?? "",
        phone: lead.phone,
        email: lead.email ?? "",
        serviceType: lead.serviceType,
        leadSource: lead.leadSource,
        notes: lead.notes,
      },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: { convertedClientId: created.id, convertedAt: new Date() },
    });

    return created;
  });

  return { status: "converted", client };
}
