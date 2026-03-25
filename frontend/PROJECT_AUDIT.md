# Matara Management Frontend — Project Audit & Summary

**Date:** Current codebase state  
**Scope:** Full frontend application audit (structure, entities, logic, storage, technical debt).

---

## 1. Project Overview

**What this system is:**  
A local-first, RTL Hebrew internal management web app for a business that handles leads, clients, projects (website builds, hourly freelance, monthly retainer), and daily tasks. There is no backend; data lives in the browser (localStorage + IndexedDB for agreement files).

**Purpose:**  
- Manage leads and convert them to clients  
- Manage clients with service type (בניית אתרים / עבודת פרילנסר) and optional package/renewal  
- Manage projects linked to clients (by work type: בניית אתר, פרילנסר שעתי, ריטיינר חודשי)  
- Manage a personal daily task Kanban (no project linkage)  
- Store agreement files in IndexedDB and reference them from leads/clients  

**Major modules/pages:**  
- **Dashboard** — placeholder  
- **Projects** — project list and CRUD  
- **Tasks** — Kanban task board  
- **Clients** — client list, CRUD, bulk delete, detail page  
- **Leads** — lead list, CRUD, convert to client  
- **Project Briefs** — placeholder  
- **Client Details** — read-only client view + agreement download  
- **NotFound** — 404 with link back to dashboard  

---

## 2. Page Map / Route Map

| Page name        | Route path      | What it does |
|------------------|-----------------|--------------|
| Root redirect    | `/`             | Redirects to `/dashboard`. |
| Dashboard        | `/dashboard`    | Placeholder: title "דשבורד" and short message. |
| Projects         | `/projects`     | Lists projects in a table; add/edit via modal; delete with dialog; status inline select; reads clients from localStorage; can open "Add client" if no clients. |
| Tasks            | `/tasks`        | Kanban board (4 columns by status); add/edit task modal; delete dialog; drag-and-drop; tasks persisted in localStorage. |
| Clients          | `/clients`      | Client table with checkboxes, bulk delete, add/edit modal; delete blocked if client has linked projects; view link to details. |
| Client Details   | `/clients/:id`  | Read-only client info; agreement file open/download from IndexedDB; client from route state or localStorage. |
| Leads            | `/leads`        | Lead table; add/edit modal; delete; convert-to-client (opens client form with lead data); status and converted state protected. |
| Project Briefs   | `/project-briefs` | Placeholder: title "אפיון פרויקטים" and short message. |
| NotFound         | `*`             | "הדף לא נמצא" and link to dashboard. |

All main routes are wrapped in `AppLayout` (sidebar + main content). No route uses `AppHeader` in the current layout.

---

## 3. Layout Structure

- **Main layout:** `AppLayout` (`components/layout/AppLayout.tsx`): full-height container, `Sidebar` on the right (RTL), main content area with `pr-64` and `<main className="px-6 py-6">` containing `<Outlet />`. No global header in the layout.
- **Sidebar:** Fixed on the right (`fixed right-0`), dark theme (`bg-[#111827]`, `border-[#312E81]`). Shows "Matara Management" and "מערכת ניהול פנימית"; nav from `navItems` (dashboard, projects, tasks, clients, leads, project-briefs). Active state: `bg-[#312E81]`. Footer text: "v0 • RTL".
- **Shared layout components:** `Sidebar`, `AppLayout`. `AppHeader` exists (`components/layout/AppHeader.tsx`) but is **not used** anywhere in routes or layout.
- **RTL:** `index.html` has `<html lang="he" dir="rtl">`. Sidebar is on the right; tables use `text-right`; layout and spacing use RTL-friendly classes (e.g. `me-2`, `pe-`/`ps-`).

---

## 4. Modules / Entities

### Leads
- **What it does:** Lead pipeline: create, edit, delete, change status, convert to client.
- **CRUD:** Create (modal), Read (table), Update (modal + status change in table), Delete (dialog).
- **UI:** Table (`LeadsTable`), Add/Edit modal (`LeadFormModal`), Delete dialog (`DeleteLeadDialog`), Convert dialog (`ConvertLeadDialog` reuses `ClientFormModal`).
- **localStorage key:** `matara_leads`.
- **Business logic:** Status migration from legacy English/Hebrew; if `convertedClientId` is set, status forced to "הפך ללקוח"; edit of converted lead keeps status/convertedClientId; convert writes new client to `matara_clients` and updates lead with `convertedClientId` and status "הפך ללקוח"; status change disabled for converted leads; agreement file upload saved to IndexedDB and ref stored on lead.

### Clients
- **What it does:** Client base with service type (בניית אתרים / עבודת פרילנסר), optional package and renewal; link to projects.
- **CRUD:** Create, Read, Update (modal), Delete (single + bulk). View-only detail page.
- **UI:** Table (`ClientsTable` — sort by renewal date, checkboxes, bulk delete), Add/Edit modal (`ClientFormModal`), Delete dialog (`DeleteClientDialog`), Bulk delete dialog (`BulkDeleteClientsDialog`), Client details page. Service type and package type selects show Hebrew labels; renewal date uses single active inline editor (click-to-edit) for stability.
- **localStorage key:** `matara_clients`. Migration flag: `matara_clients_clean_v1` (once set, clients load; otherwise storage cleared and flag set).
- **Business logic:** Service type "עבודת פרילנסר" (Service Client) hides package/renewal and clears them; "בניית אתרים" (Website Client) shows package (optional, including "ללא חבילה"); when package is "ללא חבילה" (None), renewal price/date cleared and shown as "—". Delete (single or bulk) blocked if client has linked projects (by `clientId` in `matara_projects`).

### Projects
- **What it does:** Projects tied to a client; work type (בניית אתר / פרילנסר שעתי / ריטיינר חודשי) drives status set and financial fields.
- **CRUD:** Create, Read, Update (modal + inline status change), Delete.
- **UI:** Table (`ProjectsTable` — work type read-only, status dropdown with colored dots), Add/Edit modal (`ProjectFormModal`); delete dialog. Modal can open "Add client" and append to clients + localStorage.
- **localStorage key:** `matara_projects`. Also reads `matara_clients` for client list and for append on "Add client" from Projects.
- **Business logic:** Work type determines status options and default status (website / freelance / retainer). Website and retainer use total + paid; freelance hourly uses hourly rate + worked hours → billable total. `getRemainingAmount` and `getBillableTotal` from `project-calculations`. Legacy project type values normalized on load (e.g. "בניית אתרים" → "בניית אתר").

### Tasks
- **What it does:** Personal daily task board; no project or client link.
- **CRUD:** Create, Read, Update (modal + status change + drag-between columns), Delete.
- **UI:** Kanban (`TaskBoard` + `TaskColumn` + `TaskCard`), Add/Edit modal (`TaskFormModal`), Delete dialog. Four columns: לביצוע, בתהליך, ממתין, הושלם.
- **localStorage key:** `matara_tasks`.
- **Business logic:** Tasks normalized on load (strip legacy fields like projectId, dueDate, notes); only id, title, description, status, priority persisted.

### Dashboard
- **What it does:** Placeholder only (title + short text). No data, no widgets.

### Project Briefs
- **What it does:** Placeholder only. No data, no integration with projects.

### Client Details
- **What it does:** Read-only view of one client; agreement file loaded from IndexedDB by `agreementFileId`; open in new tab / download. Client resolved from `location.state` or from `matara_clients` by `:id`.

---

## 5. Data Model Summary (from actual types)

### Lead (`types/lead.ts`)
| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| convertedClientId | string (optional) | Set when converted to client |
| createdAt | string (optional) | |
| contactPerson | string | |
| phone | string | |
| email | string | |
| requestedService | string (optional) | |
| leadSource | string | |
| notes | string (optional) | |
| status | LeadStatus | |
| agreementFileId | string (optional) | |
| agreementFileName | string (optional) | |
| agreementFileType | string (optional) | |

### Client (`types/client.ts`)
| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| clientType | ClientType | "Website Client" \| "Service Client" (UI: בניית אתרים / עבודת פרילנסר) |
| createdAt | string (optional) | |
| businessName | string | |
| contactPerson | string | |
| phone | string | |
| email | string | |
| website | string (optional) | |
| notes | string (optional) | |
| packageType | PackageType (optional) | Internal: Hosting + Elementor Pro, Hosting Only, Elementor Pro Only, None |
| renewalPrice | number (optional) | |
| renewalDate | string (optional) | |
| workContractFileName | string (optional) | Display-only (file name only) |
| agreementFileId | string (optional) | |
| agreementFileName | string (optional) | |
| agreementFileType | string (optional) | |

### Project (`types/project.ts`)
| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| projectName | string | |
| clientId | string | |
| clientName | string | Denormalized |
| projectType | ProjectType | בניית אתר \| פרילנסר שעתי \| ריטיינר חודשי |
| status | ProjectStatus | |
| totalAmount | number | |
| paidAmount | number | |
| remainingAmount | number | |
| hourlyRate | number | |
| workedHours | number | |
| billableTotal | number | |
| notes | string (optional) | |

### Task (`types/task.ts`)
| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| title | string | |
| description | string (optional) | |
| status | TaskStatus | |
| priority | TaskPriority | |

---

## 6. Business Logic Summary

- **Lead → client conversion:** Convert opens `ClientFormModal` with lead data prefilled (contactPerson as business name too); notes built from requestedService, leadSource, notes. New client is created and written to `matara_clients`; lead is updated with `convertedClientId` and status "הפך ללקוח". Agreement file ref is copied from lead to client.
- **Converted lead protection:** Editing a converted lead keeps `convertedClientId` and status "הפך ללקוח". Status dropdown does not allow changing away from "הפך ללקוח" when converted. Convert button disabled for already-converted leads.
- **Client–project delete protection:** Before delete (single or bulk), projects in `matara_projects` with matching `clientId` are counted. If any exist, delete is blocked with a message; bulk delete only removes clients with no linked projects.
- **Project status logic:** Status options and default depend on work type (website / freelance / retainer). Changing work type in modal normalizes status to the new set. Table status dropdown shows only statuses for that project’s work type (plus current if legacy).
- **Task logic:** Pure local Kanban; no link to projects. Normalize on load to current shape (id, title, description, status, priority). Drag-and-drop updates status.
- **Package/renewal logic:** Only relevant when client is "Website Client". Package can be "None" (ללא חבילה); then renewal price/date cleared and not submitted. In table/details, when package is None or client is Service Client, renewal shows "—".
- **Client service type logic:** "Service Client" (עבודת פרילנסר) hides package block and clears package/renewal. "Website Client" (בניית אתרים) shows package (optional) and renewal; optional "ללא חבילה" supported.
- **Agreement files:** Stored in IndexedDB (`matara_files_v1`, store `agreement_files`) by `saveAgreementFile`; leads and clients store only id/name/type. Client details (and lead form) use `getAgreementFile` to load blob and open/download.

---

## 7. Status Systems

**Lead statuses** (`LeadStatus`):  
חדש, במעקב, הצעת מחיר נשלחה, נסגר, לא רלוונטי, הפך ללקוח.  
("הפך ללקוח" is set automatically on convert; not selectable manually for non-converted.)

**Project statuses (by work type):**
- **Website (בניית אתר):** שיחת אפיון, איסוף חומרים, שלב סקיצות, שלב פיתוח, שלב בדיקות והשקה, פרויקט הושלם.
- **Freelance hourly (פרילנסר שעתי):** בביצוע, ממתין לתשובה, הסתיים.
- **Retainer (ריטיינר חודשי):** פעיל, בהמתנה.

Legacy project statuses still in type (for old data): New, In Progress, Waiting for Client, Completed, On Hold; שלב שיחת אפיון, שלב איסוף חומרים, סקיצה 1, סקיצה 2, שלב פיתוח, שלב השקה, פרויקט הושלם.

**Task statuses** (`TaskStatus`):  
לביצוע, בתהליך, ממתין, הושלם.

---

## 8. Type / Value Options

- **Client service type (סוג שירות):** Internal: "Website Client", "Service Client". UI labels: בניית אתרים, עבודת פרילנסר. (`lib/client-type.ts`.)
- **Package type:** Internal: "Hosting + Elementor Pro", "Hosting Only", "Elementor Pro Only", "None". UI: אחסון + רישיון אלמנטור, אחסון בלבד, אלמנטור בלבד, ללא חבילה. (`types/client.ts` PACKAGE_TYPE_LABELS; options from `data/mockClients` PACKAGE_OPTIONS.)
- **Project work type (סוג עבודה):** בניית אתר, פרילנסר שעתי, ריטיינר חודשי. (Stored and displayed as Hebrew in `types/project`.)
- **Task priority:** נמוכה, בינונית, גבוהה.
- **Lead status (selectable in form):** חדש, במעקב, הצעת מחיר נשלחה, נסגר, לא רלוונטי. (הפך ללקוח not in STATUS_OPTIONS in LeadFormModal.)
- **Lead requested service:** דף נחיתה, אתר תדמית, אתר קטלוג, חנות אינטרנט, אתר קורסים, אתר מותאם אישית, מערכת מותאמת אישית, ניהול ותחזוקת אתרים, שירותי פרילנסר. (`LeadFormModal` REQUESTED_SERVICE_OPTIONS.)
- **Lead source:** פנייה מהאתר, גוגל Ads, פייסבוק, אינסטגרם, וואטסאפ, הפניה / מפה לאוזן, אחר. (`LeadFormModal` LEAD_SOURCE_OPTIONS.)

---

## 9. Component Structure

**Layout:**  
`AppLayout`, `Sidebar`, `AppHeader` (unused).

**Module components:**
- **Leads:** `LeadsTable`, `LeadFormModal`, `DeleteLeadDialog`, `ConvertLeadDialog`.
- **Clients:** `ClientsTable`, `ClientFormModal`, `DeleteClientDialog`, `BulkDeleteClientsDialog`.
- **Projects:** `ProjectsTable`, `ProjectFormModal`, `DeleteProjectDialog`.
- **Tasks:** `TaskBoard`, `TaskColumn`, `TaskCard`, `TaskFormModal`, `DeleteTaskDialog`.

**Shared UI:**  
`Button`, `Input`, `Label`, `Select` (SelectContent, SelectItem, SelectTrigger, SelectValue), `Textarea` — under `components/ui/`, using Base UI primitives.

**Helpers/libs:**  
`lib/utils` (cn), `lib/nav` (navItems, routeTitlesByPath), `lib/client-type` (getClientTypeLabel), `lib/project-calculations` (getBillableTotal, getRemainingAmount), `lib/agreementFiles` (IndexedDB: saveAgreementFile, getAgreementFile, deleteAgreementFile).

**Data/options:**  
`data/mockClients`: PACKAGE_OPTIONS, mockClients (empty array).

**Types:**  
`types/lead`, `types/client`, `types/project`, `types/task`.

---

## 10. Current Storage / Persistence

- **localStorage keys:**
  - `matara_leads` — array of leads.
  - `matara_clients` — array of clients.
  - `matara_clients_clean_v1` — flag; if missing, clients storage is cleared once and flag set.
  - `matara_projects` — array of projects.
  - `matara_tasks` — array of tasks.

- **Seeding:** No seed data in code. `mockClients` is an empty array. Initial state is empty unless user or migration left data.

- **IndexedDB:** `matara_files_v1`, object store `agreement_files` (keyPath `id`). Used for agreement file blobs; leads/clients store only id/name/type. Used in LeadFormModal (save/delete), ClientDetails (get), ConvertLeadDialog (pass-through refs).

- **Backend:** None. All persistence is local (localStorage + IndexedDB).

---

## 11. Inconsistencies / Technical Debt / Open Issues

- **AppHeader** is implemented but never used; layout has no global page title/header.
- **Dashboard and Project Briefs** are placeholders with no functionality.
- **Client `workContractFileName`** is name-only (file input in form does not persist file); agreement files are a separate flow (IndexedDB) and not used for work contract.
- **Duplicate client load/migration:** Client migration/defaults repeated in `Clients.tsx`, `ClientDetails.tsx`, and `Leads.tsx` (loadStoredClients / getStoredClients). Any change to client shape or defaults must be updated in multiple places.
- **ConvertLeadDialog** prefills `clientType: 'Website Client'`; service type selector in modal can still be changed. No special "converted from lead" flag on client beyond agreement ref copy.
- **Project type migration** in `Projects.tsx` maps legacy strings (e.g. "בניית אתרים") to current Hebrew work types; same mapping is not centralized with a single constant set.
- **Lead status migration** in `Leads.tsx` (migrateLeadStatus) handles legacy English and Hebrew; status list in LeadFormModal does not include "הפך ללקוח" in the dropdown (intentional).
- **Naming:** "סוג שירות" in UI vs internal `clientType` (ClientType); "סוג עבודה" vs `projectType`. Package types stored in English, displayed in Hebrew — consistent but worth documenting.
- **Bulk delete clients:** Writes only to in-memory state; clients are then synced to localStorage by existing effect. No separate "bulk update storage" call.
- **RTL:** Handled at document level and in components; no central RTL hook or theme toggle.

---

## 12. Suggested Next Steps (priority order)

1. **Use or remove AppHeader** — Either add a page title (e.g. from route) in the layout with `AppHeader`, or delete the component to avoid dead code.
2. **Centralize client loading/migration** — Single `loadStoredClients()` (and optional `normalizeClient()`) in one module (e.g. `lib/clients-storage` or similar), used by Clients, ClientDetails, and Leads to avoid drift.
3. **Dashboard content** — Add at least summary counts or links (e.g. leads count, clients count, recent projects) if the product owner wants a real dashboard.
4. **Project Briefs** — Decide whether to implement (e.g. briefs linked to projects) or remove from nav/routes to reduce confusion.
5. **Work contract vs agreement** — Clarify whether work contract should remain name-only or use IndexedDB like agreements; align UX and data model.
6. **Project type/status constants** — Consider a single `projectTypes` and status-per-type map (and legacy type mapping) in `types/project` or `lib/project-constants` to avoid duplication between ProjectsTable, ProjectFormModal, and Projects page.
7. **E2E or integration tests** — For critical flows (e.g. lead convert, client delete blocked when projects exist, task normalize on load) to protect refactors.
8. **Error boundaries and loading** — No global error boundary or loading states for IndexedDB; add if agreement loading or file save failures should be surfaced.

---

*End of audit. All content is based on the current codebase as of the audit date.*
