# Naming and Business-Logic Alignment Refactor — Summary

This document summarizes the alignment refactor for **Clients/Services/Packages** and **Projects/Work Types/Statuses**. The codebase was already largely aligned from earlier refactors; this pass added documentation and confirmed consistency with minimal code change.

---

## PART 1 — CLIENTS / SERVICES / PACKAGES

### What was aligned

- **UI field label:** The client form, table, and details page use **"סוג שירות"** (not "סוג לקוח"). Placeholder: "בחר סוג שירות".
- **Visible service options:** All dropdowns and displays use the Hebrew labels **"בניית אתרים"** and **"עבודת פרילנסר"** via `getClientTypeLabel()` in `lib/client-type.ts`. Internal values remain `"Website Client"` and `"Service Client"` for storage.
- **Package logic:**
  - Package block (סוג חבילה, מחיר חידוש, תאריך חידוש) is shown **only** when service type is "בניית אתרים" (Website Client). For "עבודת פרילנסר" (Service Client) the block is hidden and package/renewal are cleared in form state.
  - For "בניית אתרים", package is **not** required: user can choose **"ללא חבילה"** (None).
  - When package is "ללא חבילה": renewal price and renewal date are cleared (in form and on submit), and in the table and client details they display as **"—"**.
- **Type documentation:** In `types/client.ts`, `ClientType` and `Client.clientType` are now documented as "service type (סוג שירות)" so the code reflects the business meaning. No property rename (would break localStorage).

### What remains internal only

- **Property name:** `clientType` on `Client` — kept for localStorage and API compatibility. Not renamed to `serviceType`.
- **Stored values:** `"Website Client"` and `"Service Client"` — all new and existing data use these. UI never shows them; only Hebrew labels are shown.
- **Package type values in storage:** English (`"None"`, `"Hosting + Elementor Pro"`, etc.). UI shows Hebrew via `getPackageTypeLabel()`.

### What was changed in UI

- No UI string changes were required in this pass. The UI already used "סוג שירות", "בניית אתרים", "עבודת פרילנסר", and the correct package/renewal visibility and "—" behavior. Only type-level comments were added.

### Technical debt still remaining (Part 1)

- **Duplicate client loading/migration:** Client normalization (e.g. `clientType ?? "Website Client"`, `packageType ?? "Hosting + Elementor Pro"`) exists in three places: `Clients.tsx` (`loadInitialClients`), `ClientDetails.tsx` (`getStoredClients`), and `Leads.tsx` (`loadStoredClients`). A future refactor could centralize this in a single `loadStoredClients()` / `normalizeClient()` helper.
- **Work contract field:** `workContractFileName` is name-only (no file persistence). Agreement files use IndexedDB separately. This is unchanged and may need product clarification later.

---

## PART 2 — PROJECTS / WORK TYPES / STATUSES

### What naming was aligned

- **UI label:** The projects table column and the project form field both use **"סוג עבודה"** (not "סוג פרויקט").
- **Visible work type options:** All project UI uses the Hebrew values stored on the entity: **"בניית אתר"**, **"פרילנסר שעתי"**, **"ריטיינר חודשי"** (from `types/project.ts` `ProjectType`). These are both stored and displayed as-is.
- **Type documentation:** In `types/project.ts`, the `ProjectType` type already had a "Work type (סוג עבודה)" comment. A short JSDoc was added on `Project.projectType` stating it is the work type and determines allowed status set and financial fields. In `Projects.tsx`, a comment was added above `mapType` that it normalizes legacy stored values for compatibility.

### What old legacy concepts still remain internally

- **Stored project type values:** Old data may still contain:
  - `"Full Project"` → normalized on load to `"בניית אתר"`.
  - `"Hourly Project"` → normalized to `"פרילנסר שעתי"`.
  - `"בניית אתרים"` (plural) → normalized to `"בניית אתר"`.
  - `"עבודת פרילנסר לפי שעה"` → normalized to `"פרילנסר שעתי"`.
  - `"ריטיינר חודשי"` → kept as-is.
- **ProjectStatus type:** Still includes legacy English and legacy Hebrew status strings (e.g. `"New"`, `"שלב שיחת אפיון"`, `"סקיצה 1"`) so that old saved projects continue to load and display. Status options in the UI are filtered by work type; legacy statuses can still appear if present on a project and are kept in the dropdown when `getStatusOptionsForProject` includes the current status.
- **Variable names in code:** The property name `projectType` on `Project` is unchanged (would require a broad rename and migration). Comments now clarify it represents work type (סוג עבודה).

### Whether the status system is fully tied to work type

- **Yes.** Status flow is driven by work type everywhere it matters:
  - **ProjectFormModal:** `getBaseStatusOptionsForType(projectType)` returns the correct list per work type (website / freelance / retainer). Changing work type in the form calls `normalizeStatusForType(prev.status, nextType)` so the status is valid for the new type. Default status per type: בניית אתר → "שיחת אפיון", פרילנסר שעתי → "בביצוע", ריטיינר חודשי → "פעיל".
  - **ProjectsTable:** `getStatusOptionsForProject(project)` uses `project.projectType` to choose the same three status sets. Colored dots and display are consistent.
  - **Stored data:** Status is stored per project; on load, status is not rewritten by work type (so legacy statuses remain until the user changes status or work type). When the user changes work type in the modal, status is normalized. This is intentional to avoid silent data change on load.

### Remaining technical debt / future refactor suggestions (Part 2)

- **Centralize status sets:** Website, freelance, and retainer status arrays (and default status per type) are defined in both `ProjectFormModal.tsx` and `ProjectsTable.tsx`. A single source of truth (e.g. `lib/project-status.ts` or constants in `types/project.ts`) would reduce drift.
- **Legacy status cleanup:** Over time, if all data is migrated or legacy statuses are no longer needed, the `ProjectStatus` union could be trimmed to only the current Hebrew statuses per work type. Not done in this refactor to avoid breaking existing stored projects.
- **Property name `projectType`:** If desired in a future major version, the API/storage could introduce `workType` and migrate; that would be a larger change and is not required for alignment.

---

## What was changed (code edits)

1. **`frontend/src/types/client.ts`**
   - Added JSDoc to `ClientType`: service type (סוג שירות); internal values kept for compatibility; UI labels via getClientTypeLabel.
   - Added JSDoc to `Client.clientType`: service type (סוג שירות) and mapping to Hebrew labels.

2. **`frontend/src/types/project.ts`**
   - Added JSDoc to `Project.projectType`: work type (סוג עבודה); determines allowed status set and financial fields.

3. **`frontend/src/pages/Projects.tsx`**
   - Added a one-line comment above `mapType` explaining that it normalizes legacy stored values to current work types for compatibility.

4. **`frontend/ALIGNMENT_SUMMARY.md`** (this file)
   - Created to document what was aligned, what is internal-only, what was changed in UI, and what technical debt remains.

---

## What was intentionally kept as-is

- **Client:** No rename of `clientType` to `serviceType`; no change to stored enum values; no change to client load/migration locations.
- **Project:** No rename of `projectType` to `workType`; no removal of legacy status strings from the `ProjectStatus` type; no centralization of status constants in this pass.
- **All UI copy** that was already correct (סוג שירות, סוג עבודה, Hebrew option labels) was left unchanged.
- **All business logic** (package visibility, renewal clearing when ללא חבילה, status-per–work-type, legacy project type mapping) was already correct and was not modified.
- **RTL, localStorage keys, and existing flows** (lead convert, client delete guard, etc.) were not changed.

---

## What still needs future refactor (optional)

- Centralize client loading and normalization (Clients, ClientDetails, Leads).
- Centralize project status sets and default-status logic (ProjectFormModal, ProjectsTable).
- Decide whether to keep or phase out legacy project status values in the type and in stored data.
- Use or remove the unused `AppHeader` component (unchanged in this refactor).

---

*Alignment refactor completed with minimal code change; behavior and storage format unchanged.*
