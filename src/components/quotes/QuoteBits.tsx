import { ExternalLink } from "lucide-react";
import type { Quote } from "@/types/quote";
import { QUOTE_STATUS_SENT, QUOTE_STATUS_SIGNED } from "@/types/quote";

export function QuoteStatusBadge({ status }: { status: string }) {
  const signed = status === QUOTE_STATUS_SIGNED;
  return (
    <span
      className={
        signed
          ? "rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400"
          : "rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
      }
    >
      {status || QUOTE_STATUS_SENT}
    </span>
  );
}

function QuoteLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-foreground underline-offset-2 hover:underline"
    >
      {label}
      <ExternalLink className="h-3 w-3 text-muted-foreground" />
    </a>
  );
}

/**
 * The quote page itself, and once it is signed the proof of that. The signed
 * copy is the document with the signature on it, so it stands in for the bare
 * signature image whenever both exist — one link, not two.
 */
export function QuoteLinks({ quote }: { quote: Quote }) {
  const signature = quote.signedCopyUrl || quote.signatureUrl;

  return (
    <div className="flex flex-wrap gap-3">
      {quote.url && <QuoteLink href={quote.url} label="פתיחת ההצעה" />}
      {signature && <QuoteLink href={signature} label="החתימה" />}
    </div>
  );
}
