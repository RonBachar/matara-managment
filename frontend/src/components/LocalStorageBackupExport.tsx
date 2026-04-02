import { downloadMataraLocalStorageBackup } from "@/lib/exportLocalStorageBackup";

/** Temporary: download all Matara `localStorage` collections as one JSON file. */
export function LocalStorageBackupExport() {
  return (
    <p className="mb-3 text-xs text-muted-foreground">
      <button
        type="button"
        className="underline underline-offset-2 hover:text-foreground"
        onClick={() => downloadMataraLocalStorageBackup()}
      >
        Download localStorage backup (JSON)
      </button>
    </p>
  );
}
