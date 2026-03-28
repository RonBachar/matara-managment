import type { Client } from "@/types/client";
import type { Lead } from "@/types/lead";
import { Button } from "@/components/ui/button";

type ConvertLeadDialogProps = {
  open: boolean;
  lead?: Lead;
  onClose: () => void;
  onConvert: (client: Client) => void;
};

function buildClientFromLead(lead: Lead): Client {
  const notesParts: string[] = [];
  if (lead.leadSource) notesParts.push(`מקור ליד: ${lead.leadSource}`);
  if (lead.notes) notesParts.push(lead.notes);
  const notes = notesParts.length > 0 ? notesParts.join("\n") : undefined;

  return {
    id: String(Date.now()),
    clientType: "Website Client",
    createdAt: lead.createdAt ?? new Date().toISOString(),
    businessName: "",
    clientName: lead.clientName,
    phone: lead.phone,
    email: lead.email?.trim() ?? "",
    website: undefined,
    notes,
    packageType: "None",
    renewalPrice: 0,
    renewalDate: "",
  };
}

export function ConvertLeadDialog({
  open,
  lead,
  onClose,
  onConvert,
}: ConvertLeadDialogProps) {
  if (!open || !lead) return null;

  function handleConfirm() {
    if (!lead) return;
    onConvert(buildClientFromLead(lead));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      dir="rtl"
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-background shadow-lg">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">המרה ללקוח</h2>
        </div>
        <div className="space-y-2 px-4 py-4 text-sm">
          <p>האם אתה בטוח שברצונך להפוך את הליד ללקוח?</p>
          <p className="font-medium">{lead.clientName}</p>
        </div>
        <div className="flex justify-between gap-3 px-4 pb-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            ביטול
          </Button>
          <Button
            size="sm"
            className="bg-[#10B981] px-4 text-white hover:bg-[#059669]"
            onClick={handleConfirm}
          >
            הפוך ללקוח
          </Button>
        </div>
      </div>
    </div>
  );
}
