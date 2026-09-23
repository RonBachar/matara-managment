/** Quote pages live at `<site>/quotes/<slug>` (with or without `.html` or a
 *  trailing slash). The slug is what ties a registered quote to the webhook
 *  that fires when the client signs it. */
export const QUOTE_SLUG_PATTERN = /^[a-z0-9-]+$/;

export function quoteSlugFromUrl(url: string): string | null {
  let path = url.trim();
  try {
    path = new URL(path).pathname;
  } catch {
    // Not an absolute URL; treat the whole string as a path.
    path = path.split(/[?#]/)[0] ?? "";
  }
  const segments = path.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return null;
  let slug = last;
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // Keep the raw segment.
  }
  slug = slug.replace(/\.html?$/i, "").toLowerCase();
  return QUOTE_SLUG_PATTERN.test(slug) ? slug : null;
}
