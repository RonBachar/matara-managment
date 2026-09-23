import type { Quote } from "@/types/quote";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { quoteDisplayTitle } from "@/lib/quoteFormat";

/** Confirms removing a quote's record here; the quote page itself stays. */
export function DeleteQuoteDialog({
  quote,
  onClose,
  onConfirm,
}: {
  quote: Quote | null;
  onClose: () => void;
  onConfirm: (quote: Quote) => void;
}) {
  return (
    <AlertDialog
      open={quote !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת הצעת מחיר</AlertDialogTitle>
          <AlertDialogDescription>
            {quote ? `למחוק את "${quoteDisplayTitle(quote)}"? ` : ""}
            ההצעה עצמה באתר ההצעות לא תימחק, רק הרישום כאן.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost" size="sm">
            ביטול
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="sm"
            onClick={() => {
              if (quote) onConfirm(quote);
            }}
          >
            מחיקה
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
