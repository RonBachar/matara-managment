-- Who the quote was made out to, taken from the document itself. Needed for
-- quotes sent to people who are not (yet) a lead or a client in the CRM.
ALTER TABLE "Quote" ADD COLUMN "recipientName" TEXT NOT NULL DEFAULT '';
