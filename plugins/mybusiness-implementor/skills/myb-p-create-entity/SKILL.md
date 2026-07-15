---
name: myb-p-create-entity
description: "Create a complete new custom entity (module) in MyBusiness CRM -- tables, fields, sample data, list page with inline edit, custom JS, and menu integration. Use this skill whenever the user wants to create a new entity, new module, new object type, add a new business concept to the CRM, or build a full CRUD workflow for a custom table. Examples: creating an Affiliates module, a Suppliers entity, a Projects entity, a Vehicles table, an Inventory system, a Courses module, or any custom entity with its own list page. Also use when the user mentions: ישות חדשה, מודול חדש, טבלה חדשה עם דפים, יצירת ישות, בניית מודול, create entity, create module, new entity, new table with pages, custom object, new CRUD module. This skill orchestrates multiple tools together -- it is the right choice when the user needs the full package (tables + list page + data + menu)."
---

# Create Entity / יצירת ישות חדשה

Build a complete custom entity in MyBusiness CRM -- from database tables through a fully functional list page with inline editing.

## CRITICAL READ FIRST — Known Platform Bugs

These bugs affect EVERY run of this skill. Design around them from the start:

### Constraint 1: `Create-Form-Page` produces NewMaster-based pages — works in iframe, NOT via direct URL

`Create-Form-Page` MCP always assigns `NewMaster` as the masterPage. The actual `NewMaster.js` source has the relevant logic gated on `if (!Simbla.User.current()) {...}` — i.e., it only matters for **anonymous** users (public landing forms). For authenticated CRM users:

- The `console.error("missing uuidVal")` line is just a log, not a fatal error.
- Standard form load via iframe + `data-edit-view="modal-left"` / `"modal-right"` works.
- Opening a NewMaster-based page via direct URL (`apps/mybusiness/Entity?oid=X`) shows empty fields — NewMaster doesn't fall back to URL params.

There is **NO MCP tool or Parse API** to change `masterPageId` of an existing page. Pages are in a Simbla-private collection, not in Parse classes.

**→ Decision tree:**

- User wants click-to-edit on a list row, opening a full card view? → **Build the form page (Phase 4) and link via `modal-left` + `useIframe: true`** (this is the default workflow now).
- User wants the **Name cell itself** (not just the pencil) to open the card? → Same mechanism, wired by the template: the Name is wrapped in `a.entity-link`, whose click triggers the row's edit pencil (opening the 5c sidebar) — with a direct `Mode=Modal` fallback. See the mechanisms table below.
- User wants quick-edit only without leaving the list? → Skip Phase 4, use `data-edit-view="inline"` on the table.
- User wants standalone clickable URLs to entity records (e.g., links from emails)? → Out of scope for MCP — requires manually cloning the Account card with MasterTicket in the Simbla page-builder UI.

**The three card-open mechanisms** — know which one you're wiring; mixing them is the #1 source of "empty card" / "click does nothing" bugs:

| Mechanism | Path | When it applies |
|---|---|---|
| MasterTicket card | `Mode=Ticket` → `#SideModalTicket` | Built-in entities only (Account/Task/Case). MCP cannot create cards on this master. |
| **NewMaster card** | **`Mode=Modal` → `#SideModal` + `#iframeModal` src** | **Every card from `Create-Form-Page` — this skill's path.** Both the pencil (`modal-left` + `useIframe`) and a direct name-click use it. |
| Inline edit | `editView: {openFrom: "inline"}` | Quick-edit in the row, no card. |

⚠️ **Known red herring:** the inherited list JS (`cases.js` / `accounts2.7.js`) wraps names in `<a class="ticket">` targeting `#SideModalTicket`, guarded by `if (window._hasTicketListener) return` — a guard the master switches ON in `modal-left`, which silently kills name-clicks. Do not debug or patch that path (it can only open MasterTicket cards); replace the file with the template (Bug 6).

### Bug 2: `Create-Table` MCP returned `"missing user"` — unverified as of 2026-07, re-test before relying

**Probe first:** attempt the `Create-Table` MCP tool normally. This bug claim is undated, and sibling bugs in this list (Bug 3, Bug 8) have since been fixed — it may be gone too. Only if the call fails with the exact documented `"missing user"` error: mark the step blocked and escalate to the MyBusiness team (see [references/rest-api-patterns.md](references/rest-api-patterns.md)). Never work around the tool-permission layer with direct API calls.

### Bug 3: ~~`Set-Page-JS-and-CSS-files` returns `"missing user"`~~ — FIXED

Use `Set-Page-Settings` MCP with `jsFile` / `cssFile` parameters to set the URLs programmatically. (Inspect the current values first with `Get-Page-Settings`.) The old `Set-Page-JS-and-CSS-files` tool is gone — `Get-Page-Settings` and `Set-Page-Settings` replace it and also expose `title`, `description`, `keywords`, `metaTags`, `loginOnly`, `allowedRoles`, `dynamicTable`, `dynamicFields`.

### Bug 4: `Create-Data` MCP failed on complex nested objects — unverified as of 2026-07, re-test before relying

**Probe first:** attempt the MCP tools normally — `Create-Many` already handles Pointers and Dates via `__type` (see Phase 3b), and this undated claim may be fixed like its sibling bugs (Bug 3, Bug 8). Simple records (String/Number/Boolean) work via MCP either way. Only on the exact documented error: mark the step blocked and escalate to the MyBusiness team (see [references/rest-api-patterns.md](references/rest-api-patterns.md)).

### Bug 5: CLP with `"*": true` is NOT enough for CRM UI access

Parse-level permission `{"*": true}` passes API calls but the CRM front-end checks role membership. After `Set-Table-Permissions` with `*`, users see "no permissions" errors in the UI.

**→ Always use `Set-Table-Permissions` MCP with roles matching the existing Cases/Accounts pattern:**

```
{
  "find":   {"role:CRM": true, "role:Admin": true, "role:Support": true},
  "get":    {"role:CRM": true, "role:Admin": true, "role:Support": true},
  "create": {"role:CRM": true, "role:Admin": true, "role:Support": true},
  "update": {"role:CRM": true, "role:Admin": true, "role:Support": true},
  "delete": {"role:CRM": true, "role:Admin": true, "role:Support": true},
  "addField": {}
}
```

A newly created table can start with an empty CLP. Call `Set-Table-Permissions` on every new table.

### Bug 6: `Create-Table-View-Page` copies from Cases and inherits broken code

The copied page carries over:
- External JS file pointing to `cases.js` (contains hardcoded Case-specific modal/navigation logic)
- Inline `data-simbla-class="Cases"` on the form query element
- Modal HTML with "פנייה חדשה" and headphones icon
- A hidden `Add new row` button (`.db-form-add`) that leaks visible when `allowEdit=true`

**Replace the inherited file — never patch it.** Its card-open path (`Mode=Ticket` → `#SideModalTicket`) only works for MasterTicket cards, so a patched copy keeps silently breaking NewMaster entities. Upload the template as a NEW file (5d) and point the page's `jsFile` at it. See [references/table-view-js-template.md](references/table-view-js-template.md).

### Bug 7: Relative URLs on the list page — do NOT prefix with `apps/mybusiness/`

The list page is already at `apps/mybusiness/Suppliers`. A relative link `apps/mybusiness/Supplier?oid=X` resolves to `apps/mybusiness/apps/mybusiness/Supplier?oid=X` (404). Use just `Supplier?oid=X`.

This applies to every URL you build toward the card page — the "New" button and the direct name-click path both construct one. The template's `cardUrl()` derives the base from `window.location.pathname` for exactly this reason; reuse it instead of hand-building paths.

### Bug 8: ~~Browser tab title shows "Cases"~~ — FIXED

When `Create-Table-View-Page` copies from Cases, the **Page Title (SEO)** field is also copied as "Cases". Fix it programmatically with `Set-Page-Settings(pageId, title: "{{ENTITY_NAME_HEB}}")`. Do the same for any other page copied from a template (e.g., a form page, if one was created).

Always run `Get-Page-Settings` after `Create-Table-View-Page` to confirm `title` matches the entity, and call `Set-Page-Settings` if it doesn't.

### Constraint 9: Pointer-display columns must use `type: "String"`, NOT `type: "Pointer"`

When a column shows a string field through a pointer (e.g., `AccountId.Name` showing the customer's name), the column's `type` is the type of the **displayed value**, not the type of the relationship.

✓ Correct:
```json
{
  "field": "AccountId.Name",
  "type": "String",
  "aggrField": "AccountId.Accounts.Name",
  "inlineOptions": {"type": "autocomplete", "required": false, "readonly": false}
}
```

✗ Wrong (causes `Cannot create property 'Name' on string` runtime error — table won't render rows):
```json
{"field": "AccountId.Name", "type": "Pointer", ...}
```

`type: "Pointer"` is reserved for columns that show the entire pointer object (rare). For 99% of cases — including any column displaying `<PointerField>.Name` or `<PointerField>.<anyStringField>` — use `String`.

For the inline-edit dropdown to work properly:
- Pointer to a large reference table (Accounts, _User): `inlineOptions: {type: "autocomplete"}`
- Pointer to a small lookup table (Statuses, Types): `inlineOptions: {type: "select"}`

**Junction entities** (enrollments, order-lines, memberships, payments): the primary display column is itself a pointer-display column (e.g. `AccountId.Name`) — such entities often have **no plain `Name` field at all**. Point the template's clickable-column placeholder `{{PRIMARY_COL}}` at that column; a `Name`-based lookup fails **silently** (jQuery index -1 → nothing becomes clickable, no error anywhere).

### Recovery: Edit-Table-View fails with "page.savedContent[key].includes" error

This happens when a previous edit cleared the page's `_MPID0` content (empty string). Recovery:

1. `Get-Page-Versions(pageId)` — list all saved versions
2. Find the earliest version (same timestamp as page creation — has the original Cases-template HTML with the proper table structure)
3. `Set-Page-Version(pageId, versionId, overrideHTML: true)` — restores HTML without touching jsCode/cssCode
4. Re-run `Edit-Table-View`

---

## What Gets Created (with fixes)

```
New Entity Package
├── Database Layer
│   ├── Main table (e.g., Suppliers)
│   ├── Status lookup table (e.g., SupplierStatuses)
│   ├── Related tables (e.g., SupplierOrders)
│   ├── CLP with ROLE-BASED permissions (CRM/Admin/Support)
│   └── Record ACLs verified accessible (escalate if not — see Phase 3d)
├── UI Layer
│   ├── Form (card) page -- single-record view (apps/mybusiness/EntityName, singular)
│   │   ├── Fields organized in [6,6] / [12] rows
│   │   ├── Pointers to related entities
│   │   └── Loaded inside an iframe sidebar from the list (NewMaster works here)
│   ├── Table view page -- list view (apps/mybusiness/EntityNames, plural)
│   │   ├── Search form with filters
│   │   ├── Sortable columns (with type:"String" for pointer-Name display)
│   │   ├── data-edit-view="modal-left" + iframe → opens form page in left sidebar
│   │   ├── Conditional formatting (status colors)
│   │   └── Hidden "Add new row" button (via CSS)
│   └── Menu item linking to the list page
├── Behavior Layer
│   ├── Custom external JS file uploaded to S3
│   ├── Cleared inline jsCode on the page (avoids conflicts)
│   └── JS file URL set programmatically via Set-Page-Settings
└── Sample Data
    ├── Status records with colors (via Create-Data MCP)
    ├── Sample entity records (via Create-Many MCP with `__type: "Pointer"`)
    └── Sample related records
```

---

## Workflow

### Phase 1: Planning

Before creating anything, align on:

1. **Entity name** — singular (`Supplier`) and plural (`Suppliers`)
2. **Fields** — list with types, Hebrew labels, pointer targets
3. **Status values** — names + colors (default set below)
4. **Related tables** — child tables pointing back to main entity
5. **Icon** — FontAwesome 4 class (see table-view-js-template.md)

Ask about business context if the entity purpose is unclear.

Standard status set (Hebrew):
- פעיל — `#28a745`
- ממתין לאישור — `#ffc107`
- מושהה — `#dc3545`
- לא פעיל — `#6c757d`

Standard fields most entities need:
| Field | Type | Notes |
|-------|------|-------|
| Name | String | Auto, primary identifier |
| Email | String | |
| Phone | String | |
| StatusId | Pointer → EntityStatuses | Required for color-coding |
| OwnerId | Pointer → _User | Responsible user |
| AccountId | Pointer → Accounts | Only if entity links to customers |
| Active | Boolean | Active flag |
| Comment | String | Free-text notes |

### Phase 2: Create Tables (via Create-Table MCP)

Use the `Create-Table` MCP tool — the only sanctioned path (probe first per Bug 2; if it fails with the exact documented `"missing user"` error, mark the step blocked and escalate — see [references/rest-api-patterns.md](references/rest-api-patterns.md)). Create in this order:

#### 2a. Status/lookup tables first
`Create-Table` with the lookup fields, e.g. `Name` (String) and `Color` (String).

#### 2b. Main entity table
Include all fields plus all pointers (to status, _User, Accounts, etc.).

#### 2c. Related child tables
Each needs a `Pointer` field back to the main entity.

#### 2d. Set role-based CLP on ALL new tables
Use `Set-Table-Permissions` MCP (matches Cases/Accounts pattern — see Bug 5 above). **Do NOT use `*: true`** — it fails at the CRM UI layer.

Run for every new table in parallel.

### Phase 3: Create Sample Data

#### 3a. Status records (simple — use MCP)
```
Create-Many(table: "EntityStatuses", data: [
  {Name: "פעיל", Color: "#28a745"},
  {Name: "ממתין לאישור", Color: "#ffc107"},
  ...
])
```

#### 3b. Main entity records (Pointers — use MCP Create-Many with `__type: "Pointer"`)
`Create-Many` handles Pointers correctly. If it errors, apply the Bug 4 probe-first rule — capture the exact error, mark the step blocked, and escalate; never fall back to raw API calls.

#### 3c. Related table records
Same as 3b — reference main entity records by their returned objectIds.

#### 3d. Verify record ACLs
Records created via the MCP tools are expected to be accessible to logged-in users. If records turn out inaccessible even though the table CLP is role-based (Bug 5 handled), mark the step blocked and escalate — the bulk-ACL repair is an internal ops procedure (see [references/rest-api-patterns.md](references/rest-api-patterns.md)).

### Phase 4: Create the Card (Form) Page

The form page is the entity's full record view, opened in a left sidebar from the list. This is the natural UX expected by users — it matches how Account and Sale cards behave.

(Skip Phase 4 only if the user explicitly prefers inline edit over a sidebar — in that case go straight to Phase 5 with `editView: {openFrom: "inline"}`.)

#### 4a. Create the form page

```
Create-Form-Page(
  tableName: "EntityNames",
  pageName: "apps/mybusiness/EntityName",       // SINGULAR — the page is for one record
  title: "פרטי [ישות]"
)
```

The page is created with `NewMaster` as masterPage. Per Constraint 1 above, this works fine inside an iframe for authenticated CRM users — the `console.error("missing uuidVal")` is just a log.

#### 4b. Add fields to the form page

Use `Edit-Page` to add fields. The default page has an empty row `P272` (col-md-6 / col-md-6) ready for the first two fields.

Pattern (sequential calls — each new row's ID is returned in `info[0].newRowId` and used in the next call):

```
// Call 1: fill P272 + create new row
Edit-Page(pageId, actions: [
  {actionType: "add-new-field", fieldName: "Name", fieldType: "String",
   toExistingRow: "P272", toExistingColumn: 0, isRequired: true},
  {actionType: "add-new-field", fieldName: "AccountId", fieldType: "Pointer",
   targetClass: "Accounts", toExistingRow: "P272", toExistingColumn: 1},
  {actionType: "add-row", columnSize: [6, 6], newRowAfterRow: "P272"}
])
// Response → newRowId: "P276"

// Call 2: fill P276 + create next row
Edit-Page(pageId, actions: [
  {actionType: "add-new-field", fieldName: "StatusField", ...,
   toExistingRow: "P276", toExistingColumn: 0},
  {actionType: "add-new-field", fieldName: "OwnerField", ...,
   toExistingRow: "P276", toExistingColumn: 1},
  {actionType: "add-row", columnSize: [6, 6], newRowAfterRow: "P276"}
])
// ...continue for all field rows
```

For Notes / Description / Comment — use a full-width row `[12]`. Standard structure for most entities:

| Row | Layout | Fields |
|-----|--------|--------|
| P272 (existing) | `[6,6]` | Primary name, AccountId |
| Row 2 | `[6,6]` | Status, Owner |
| Row 3 | `[6,6]` | Important date 1, Important date 2 |
| Row 4 | `[12]` | Description / Notes (single textarea field) |

#### 4c. Verify the form page

`Get-Page-Content(pageId, minimal: true)` — confirm fields are placed correctly in their rows. The form is now ready to be opened in a sidebar from the list (see Phase 5).

### Phase 5: Create Table View Page (List)

#### 5a. Create the page (copies from Cases)
```
Create-Table-View-Page(
  tableName: "EntityNames",
  pageName: "apps/mybusiness/EntityNames",
  copyFromPageId: "<Cases page ID from Get-Site-Pages>",
  title: "שם הישות ברבים",
  menuName: "שם לתפריט",
  editEntityPageName: "apps/mybusiness/EntityName",  // the Phase 4 card page (singular) — wired to the list by editView in 5c
  editEntityTitle: "עריכת [ישות]",
  createNewEntityTitle: "[ישות] חדש/ה",
  mainSearchTitle: "חיפוש [ישויות]",
  searchFields: [...],
  tableColumns: [...]
)
```

#### 5b. Clean up inherited inline JS
```
Edit-Page-CSS-JS(pageId, jsCode: "", cssCode: ".db-form-add{display:none !important;}")
```
- Empty `jsCode` — let the external JS file (uploaded in 5d) be the single source.
- CSS hides the leaked `Add new row` button.

#### 5c. Configure table view — link to the card page

```
Edit-Table-View(
  pageId, tableId: "P113",
  tableClassName: "EntityNames",
  classPointers: {correct pointers},          // {AccountId: "Accounts", OwnerId: "_User", ...}
  columns: [
    // For pointer-display columns: type MUST be "String" (NOT "Pointer") — see Constraint 9
    {field: "Name", type: "String", aggrField: "Name", label: "...",
     inlineOptions: {type: "text", required: true, readonly: false}},
    {field: "AccountId.Name", type: "String", aggrField: "AccountId.Accounts.Name",
     label: "לקוח", inlineOptions: {type: "autocomplete", required: false, readonly: false}},
    // ... more columns
  ],
  editView: {
    openFrom: "modal-left",                   // sidebar from the left (or "modal-right")
    useIframe: true,
    page: "apps/mybusiness/EntityName",       // form page from Phase 4 (singular!)
    popupWidthPercent: 45                      // optional sidebar width
  },
  tablePermissions: {allowCreate: true, allowEdit: true, allowDelete: true},
  filterAndSort: {sortBy: "Name", sortOrder: "ascending", sortLimit: 50},
  advancedOptions: {allowExportToExcel: true, showLoaderAnimation: true},
  summaryOptions: {showSum: true, sumTitle: "סה\"כ"},
  conditionalFormattingRules: [status-based rules]
)
```

This is the recommended setup — clicking a row's pencil opens the form (Phase 4) in a left sidebar. NewMaster.js works inside the iframe for authenticated CRM users.

**Alternative: inline edit only** (skip Phase 4, no separate card page):

```
editView: {openFrom: "inline"}    // cells become editable inputs in the row
```

Use this only when the user explicitly prefers quick-edit over a sidebar.

#### 5d. Create and upload the custom JS file
Use the template in [references/table-view-js-template.md](references/table-view-js-template.md). It is specifically written for this skill's constraints:

- All handlers wrapped in `$(function(){...})` so the table div exists before `.on('data-loaded', ...)` is attached.
- Polling fallback (every 500ms, 15s timeout) in case `data-loaded` already fired.
- Name click triggers the row's edit pencil — which opens the sidebar (per editView config in 5c) or inline edit, depending on what you set — with a direct `Mode=Modal` card-open fallback when no pencil is present.
- **`{{PRIMARY_COL}}` placeholder** controls which column becomes clickable. Plain entities: `Name`. **Junction entities have no `Name` — set it to the pointer-display column** (e.g. `AccountId.Name`), or nothing becomes clickable (silent failure).
- **"New" button opens an empty card via `Mode=Modal`** — the handler sets `#iframeModal`'s `src` itself and then shows `#SideModal`. The inherited `data-toggle` attribute alone opens an **empty** panel (the classic «"New" does nothing» bug). An inline-mode alternative handler is included as a comment.
- Status column colored by `StatusId.Color`.
- Hides `.db-form-add` button via injected `<style>` tag.
- Fixes `data-simbla-class="Cases"` → your entity name.
- Fixes "New" button Hebrew label.
- Fixes headphones icon → your entity icon.

Upload:
```
Upload-Public-File(file: {
  name: "entity-list.js",
  mimeType: "text/javascript",
  data: "<base64 of file content>"
})
```

Base64 on Windows (no `/dev/stdin`):
```
node -e "console.log(require('fs').readFileSync('entity-list.js').toString('base64'))"
```

#### 5e. Set the JS file URL and fix the SEO title (programmatic)
Use `Set-Page-Settings` to wire up the uploaded JS file and overwrite the inherited "Cases" title in one call:

```
Set-Page-Settings(
  pageId: <listPageId>,
  jsFile: "<URL returned by Upload-Public-File in 5d>",
  title: "{{ENTITY_NAME_HEB}}"   // fixes Bug 8 — browser tab title
)
```

Verify with `Get-Page-Settings(pageId)` — confirm `jsFile` matches the uploaded URL and `title` is the entity name (not "Cases").

### Phase 6: Final user step — hard-reload

After (and only after) you verified the wiring yourself (Phase 7), ask the user to:

> **Hard-reload** the list page (Ctrl+F5) to flush the browser cache and load the new JS file and SEO title.

### Phase 7: Verify

**Verify yourself first.** If a browser-automation channel is available in the session (chrome-devtools / claude-in-chrome / playwright-cli), do not hand an unverified build to the user: open the list page, confirm data renders, click a record's Name — the card must open **populated** in the sidebar — and click "New" — an empty card must open. Rolling "try it and tell me" onto the user, round after round, is how single bugs turn into multi-day sagas.

One console line reveals the column map instantly (the junction-entity trap):

```js
$('.simbla-table thead th').map((i,e)=>e.getAttribute('data-field')).get()
// no 'Name' in the result? → {{PRIMARY_COL}} must be the pointer-display column (e.g. 'AccountId.Name')
```

Checklist:

1. Browser tab shows the correct entity name (not "Cases").
2. List page — data loads, columns display, search works.
3. Clicking a record's Name opens the entity card **populated** in the sidebar (or inline edit, if that's the configured mode).
4. "New" button opens an **empty** card for creation (not an empty gray panel).
5. Saving (card or inline) persists.
6. Status column shows colored pills.
7. Menu item appears with the correct icon.
8. No `Add new row` green button visible above the table.

### Troubleshooting — when the list/card misbehaves

**First move: compare against a known-good entity.** Fastest diagnosis there is — before touching any code:

1. `Get-Page-Settings` on YOUR list page vs a built-in list (e.g. Tasks): compare `jsFile` (still the inherited `cases.js`/`accounts2.7.js`? → Bug 6 was never fixed) and `title`.
2. `Get-Page-Settings` on YOUR card page vs a built-in card (e.g. Task): the built-in is **MasterTicket**, yours is **NewMaster** (expected) — which means the built-in's click mechanics do NOT transfer to your entity.
3. Pull the working entity's `jsFile` from its URL and compare its card-open mechanism to yours. **The deviation is the bug.**

**Symptom → cause → check → fix:**

| Symptom | Cause | Check | Fix |
|---|---|---|---|
| Nothing in the list is clickable (silently) | Decoration targets a column that doesn't exist — junction entity with no `Name` | The console line above | Set `{{PRIMARY_COL}}` to the real display column |
| "New" opens an empty panel / does nothing | `#iframeModal` never received a `src` — inherited `data-toggle` alone opens an empty modal | Inspect `.addNewBtn` attributes; iframe `src` empty | The template's New-handler: `cardUrl('', true)` → `modal('show')` |
| Click → "Page not found" | Hand-built relative URL doubled the `apps/mybusiness/` prefix (Bug 7) | The iframe `src` URL | Derive the base from `window.location.pathname` (template `cardUrl()`) |
| Card opens EMPTY on an existing record | NewMaster card opened via `Mode=Ticket` or direct URL | Card's master (`Get-Page-Settings`) + the opening path | Open via `Mode=Modal` through `#SideModal`/`#iframeModal` (or pencil + `modal-left`) |
| Click opens the WRONG entity's card | Inherited jsFile with hardcoded target still wired | `Get-Page-Settings` → `jsFile` | Replace with the template file (Bug 6 — replace, don't patch) |
| Name-click stopped working after switching to `modal-left` | Inherited `ticket` handler silenced by the `window._hasTicketListener` guard | jsFile is still the inherited one | Same — replace with the template |
| UI says "no permissions" | CLP uses `*` instead of roles (Bug 5), or record ACLs missing | `Get-Table-Permissions` | Role-based CLP; if records are still inaccessible, mark blocked + escalate (bulk-ACL repair is an internal ops procedure) |

**Cache & publishing — check LAST, not first.** App pages are served live from the working copy: `publishedAt`, `Get-Page-Versions` and `Set-Page-Version` belong to the public-site flow and are **not** why your change doesn't show. If an incognito window still shows the old behavior, it is **not** cache — it's the jsFile/master. Only once `Get-Page-Settings` confirms the new `jsFile` is wired and incognito behaves correctly, have the user hard-reload (Ctrl+F5).

---

## Reference Files

- [references/rest-api-patterns.md](references/rest-api-patterns.md) — MCP-first policy + escalation path (with background on what the REST layer historically covered), role-based CLP, Create-Many pointer patterns, record-ACL escalation, file upload
- [references/table-view-js-template.md](references/table-view-js-template.md) — JS template for the list page, correctly handling all 7 platform bugs above
