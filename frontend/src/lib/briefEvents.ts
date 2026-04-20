/** Same-tab event bus for brief changes.
 *  localStorage does not fire the "storage" event in the same tab,
 *  so we dispatch a custom event after any create / update / delete. */

export const BRIEFS_CHANGED_EVENT = "matara-briefs-changed";

export function notifyBriefsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BRIEFS_CHANGED_EVENT));
}
