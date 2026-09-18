/**
 * Recognising a repeat enquiry.
 *
 * The same person reaches us through several forms — a quick one with just a
 * phone, a full one with an email and a message — and writes their number
 * differently each time (0541234567, 972541234567, "054-123-4567"). Matching on
 * the raw string would file each of those as a new lead, so both identifiers
 * are reduced to a stable key before they are stored or compared.
 */

/** Last 9 digits of the number, which is the part that identifies an Israeli
 *  subscriber whether the prefix was written as 0 or 972. Null when there is
 *  no usable number. */
export function phoneKeyOf(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : null;
}

export function emailKeyOf(email: string | null | undefined): string | null {
  const trimmed = (email ?? "").trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/** A lead the visitor has already given up on should not absorb a fresh
 *  enquiry — that really is a new conversation. */
export const CLOSED_LEAD_STATUS = "לא מעוניין";

function formatStamp(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

/**
 * Keeps every message the person has sent, newest last, each under a dated
 * heading so the history reads in order rather than overwriting itself.
 */
export function appendRepeatNote(
  existingNotes: string | null,
  incoming: string | null,
  now = new Date(),
): string | null {
  const addition = incoming?.trim();
  if (!addition) return existingNotes;

  const previous = existingNotes?.trim();
  if (!previous) return addition;
  if (previous.includes(addition)) return existingNotes;

  return `${previous}\n\n--- פנייה חוזרת ${formatStamp(now)} ---\n${addition}`;
}
