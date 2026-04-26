import { Router } from "express";
import { prisma } from "../db/prisma";
import { readNonEmptyString, readOptionalString } from "../utils/validation";

export const leadsRouter = Router();

leadsRouter.get("/", async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: [{ createdAt: "asc" }],
    });
    return res.json(leads);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

leadsRouter.post("/", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const clientName = readNonEmptyString(body.clientName);
    if (!clientName) return res.status(400).json({ error: "clientName is required" });

    const phone = readOptionalString(body.phone) ?? "";
    const email = readOptionalString(body.email);
    const leadSource = readOptionalString(body.leadSource) ?? "";
    const status = readOptionalString(body.status) ?? "חדש";
    const notes = readOptionalString(body.notes);

    const created = await prisma.lead.create({
      data: {
        clientName,
        phone,
        email: email && email.length > 0 ? email : null,
        leadSource,
        status: status.length > 0 ? status : "חדש",
        notes: notes && notes.length > 0 ? notes : null,
        convertedClientId: readOptionalString(body.convertedClientId) ?? null,
        agreementFileId: readOptionalString(body.agreementFileId) ?? null,
        agreementFileName: readOptionalString(body.agreementFileName) ?? null,
        agreementFileType: readOptionalString(body.agreementFileType) ?? null,
      },
    });

    return res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

leadsRouter.patch("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing lead id" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    const clientName = readOptionalString(body.clientName);
    if (clientName !== undefined && clientName.length > 0) data.clientName = clientName;

    const phone = readOptionalString(body.phone);
    if (phone !== undefined) data.phone = phone;

    const email = readOptionalString(body.email);
    if (email !== undefined) data.email = email.length > 0 ? email : null;
    if (body.email === null) data.email = null;

    const leadSource = readOptionalString(body.leadSource);
    if (leadSource !== undefined) data.leadSource = leadSource;

    const status = readOptionalString(body.status);
    if (status !== undefined) data.status = status.length > 0 ? status : "חדש";

    const notes = readOptionalString(body.notes);
    if (notes !== undefined) data.notes = notes.length > 0 ? notes : null;
    if (body.notes === null) data.notes = null;

    const convertedClientId = readOptionalString(body.convertedClientId);
    if (convertedClientId !== undefined) {
      data.convertedClientId = convertedClientId.length > 0 ? convertedClientId : null;
    }
    if (body.convertedClientId === null) data.convertedClientId = null;

    const agreementFileId = readOptionalString(body.agreementFileId);
    if (agreementFileId !== undefined) {
      data.agreementFileId = agreementFileId.length > 0 ? agreementFileId : null;
    }
    if (body.agreementFileId === null) data.agreementFileId = null;

    const agreementFileName = readOptionalString(body.agreementFileName);
    if (agreementFileName !== undefined) {
      data.agreementFileName = agreementFileName.length > 0 ? agreementFileName : null;
    }
    if (body.agreementFileName === null) data.agreementFileName = null;

    const agreementFileType = readOptionalString(body.agreementFileType);
    if (agreementFileType !== undefined) {
      data.agreementFileType = agreementFileType.length > 0 ? agreementFileType : null;
    }
    if (body.agreementFileType === null) data.agreementFileType = null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updated = await prisma.lead.update({ where: { id }, data });
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Lead not found" });
    }
    return res.status(500).json({ error: message });
  }
});

leadsRouter.delete("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing lead id" });

    await prisma.lead.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Lead not found" });
    }
    return res.status(500).json({ error: message });
  }
});
