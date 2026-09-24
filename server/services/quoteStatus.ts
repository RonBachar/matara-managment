/**
 * The two states a quote can be in. Kept here rather than inline, because the
 * signing webhook writes them and the client-delete guard reads them, and a
 * typo in either place would silently stop matching the other.
 */
export const QUOTE_SENT = "נשלחה";
export const QUOTE_SIGNED = "נחתמה";
