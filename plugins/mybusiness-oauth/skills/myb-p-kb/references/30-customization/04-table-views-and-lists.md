# Table Views & List Pages — Columns, Filters, Edit Modes, Formatting, Export

> **Purpose:** Spec-ready reference for every UI table in the product — standalone list pages (דף תצוגת טבלה) and embedded child-record tables (`simbla-table`): creation, the `Edit-Table-View` contract, columns & `aggrField`, default filters, sort/paging, edit modes (inline/modal/sidebar), Excel export, multi-row edit, summary rows, conditional formatting, and the `Get-Optional-Fields` workflow.
> **Last updated:** 2026-06-10 · **Status:** draft

## 1. The two flavors (one tooling)

| Flavor | Lives | Created by | Defaults |
|---|---|---|---|
| `dynamic-data-table` | Standalone list page (`apps/mybusiness/Cases`, `Suppliers`…) on `CRMmaster` | `Create-Table-View-Page` | Search form (`form.dbFormQuery dynamic-table-query`, name `dynamic-table-formP113`), paging, "New" button |
| Embedded `data-table` | A row inside a card page (Sales on the Account card) | `Add-Table-View-to-Form-Page` (see [03-pages-and-layouts.md](03-pages-and-layouts.md) §6) | No search form, `data-edit-view="inline"`, **auto-filtered to the open parent record** |

`Edit-Table-View(pageId, tableId, …)` configures both identically. In the Simbla editor this is the "Data table" widget (tabs: Database / Columns / Filter / Data options).

**Finding `tableId`:** pages created by `Create-Table-View-Page` always carry `P113` (inherited from the Cases template). Otherwise `Get-Page-Content(pageId, minimal:true)` → node with class `simblaEL simbla-table dynamic-table` (list) or `simblaEL simbla-table` (embedded); its `id` is the tableId. Note: `minimal:true` hides the table node itself on some pages (live Suppliers page shows the search form but not P113) — fall back to `minimal:false` if you can't find it.

## 2. Creating a list page — `Create-Table-View-Page`

```json
{
  "tableName": "Suppliers",
  "pageName": "apps/mybusiness/Suppliers",
  "copyFromPageId": "<Cases page _id from Get-Site-Pages>",
  "title": "ספקים",
  "menuName": "ספקים",
  "createNewEntityTitle": "ספק חדש",
  "editEntityPageName": "Supplier",
  "editEntityTitle": "עריכת ספק",
  "mainSearchTitle": "חיפוש ספקים",
  "searchFields": [
    { "field": "Name", "label": "שם הספק מכיל", "type": "String", "equesition": "contains" },
    { "field": "StatusId", "label": "סטטוס", "type": "Pointer", "equesition": "equalTo", "targetClass": "SupplierStatuses" }
  ],
  "tableColumns": [
    { "field": "Name", "label": "שם", "type": "String", "aggrField": "Name" },
    { "field": "StatusId.Name", "label": "סטטוס", "type": "String", "aggrField": "StatusId.SupplierStatuses.Name" },
    { "field": "AccountId.Name", "label": "לקוח", "type": "String", "aggrField": "AccountId.Accounts.Name" },
    { "field": "createdAt", "label": "נוצר", "type": "Date" }
  ]
}
```

| Param | Required | Notes |
|---|---|---|
| `tableName`, `pageName`, `copyFromPageId`, `title` | yes | The page is a **deep copy** of the source (use the Cases page); the master is inherited from it |
| `menuName` | no | auto-adds a main-menu item |
| `editEntityPageName`/`editEntityTitle`/`createNewEntityTitle`/`mainSearchTitle` | no | card-page wiring + labels |
| `searchFields[]` | for lists | `{field, label?, type: String\|Number\|Pointer, equesition (required), defaultValue?, targetClass?}` |
| `tableColumns[]` | for lists | `{field (required), label?, type: String\|Number\|Boolean\|Date\|PrivateFile\|File, aggrField?}` |

### Post-creation cleanup (NON-optional — the copy inherits Cases residue)

| Inherited junk | Fix |
|---|---|
| `optionalFields` from Cases (CaseTypeId etc. in the add-column picker) — KI-4 | `Edit-Table-View(optionalFields: [...])` |
| Cases-shaped `classPointers` → broken pointer sort | `Edit-Table-View(classPointers: {...})` |
| SEO/browser-tab title "Cases" | `Set-Page-Settings(pageId, title)` |
| Inline `jsCode` with Cases Hebrew overrides — KI-6 | `Edit-Page-CSS-JS(pageId, jsCode: "")` (or your own JS) |
| Search form `data-simbla-class="Cases"` — KI-5 | page JS / `Edit-Page` (Edit-Table-View can't touch the form) |
| "New" modal header "פנייה חדשה" + headphones icon — KI-7 | page JS |
| Leaked green "Add new row" button when `allowEdit` | CSS `.db-form-add{display:none !important;}` |

## 3. `Edit-Table-View` — the contract

**Whole-state writer:** each of `columns`, `optionalFields`, `classPointers`, `filterAndSort.criteria`, `conditionalFormattingRules` is replaced entirely by what you pass — anything omitted within a passed group is gone. It does NOT touch: the search form HTML, inline js/css, modal HTML, or page settings (different tools).

```json
{
  "pageId": "<listPageId>", "tableId": "P113",
  "tableClassName": "Suppliers",
  "classPointers": { "createdBy": "_User", "updatedBy": "_User",
                     "StatusId": "SupplierStatuses", "AccountId": "Accounts", "OwnerId": "_User" },
  "columns": [
    { "field": "Name", "label": "שם", "type": "String", "aggrField": "Name",
      "inlineOptions": { "type": "text", "required": true, "readonly": false } },
    { "field": "AccountId.Name", "label": "לקוח", "type": "String",
      "aggrField": "AccountId.Accounts.Name",
      "inlineOptions": { "type": "autocomplete", "required": false, "readonly": false } },
    { "field": "StatusId.Name", "label": "סטטוס", "type": "String",
      "aggrField": "StatusId.SupplierStatuses.Name",
      "inlineOptions": { "type": "select", "required": false, "readonly": false } },
    { "field": "Balance", "label": "יתרה", "type": "Number", "aggrField": "Balance", "summary": "sum" },
    { "field": "createdAt", "label": "נוצר", "type": "Date", "aggrField": "createdAt", "dateFormat": "date" }
  ],
  "editView": { "openFrom": "modal-left", "useIframe": true,
                "page": "apps/mybusiness/Supplier", "popupWidthPercent": 45 },
  "filterAndSort": { "sortBy": "Name", "sortOrder": "ascending", "sortLimit": 50,
                     "queryForm": "dynamic-table-formP113", "queryGridSize": "3",
                     "criteria": [ { "F": "Active", "C": "equalTo", "T": "Boolean", "V": true } ] },
  "tablePermissions": { "allowCreate": true, "allowEdit": true, "allowDelete": true },
  "summaryOptions": { "showSum": true, "sumTitle": "סה\"כ" },
  "advancedOptions": { "allowExportToExcel": true, "showLoaderAnimation": true }
}
```

### Parameter groups → rendered `data-*` attributes

| Group.param | data-attribute | Values / notes |
|---|---|---|
| `tableClassName` | `data-simbla-class` | DB class |
| `classPointers` | `data-class-pointers` | `{field: targetClass}` map. **ALWAYS include `createdBy:"_User"`, `updatedBy:"_User"`** + all your pointers — omitting silently breaks sort/filter on those fields (KI-8) |
| `columns[].field` | `data-field` | display path; pointer = single dot `AccountId.Name` |
| `columns[].aggrField` | `data-aggr-field` | aggregation path with class name in the middle — see §4 |
| `columns[].type` | `data-type` | `String· Number· Boolean· Date· PrivateFile· File· HTML/XML· Pointer· Array· AutoIncrement`. **Pointer-display columns (`X.Name`) must be `String`, not `Pointer`** — `Pointer` causes "Cannot create property 'Name' on string" and no rows render |
| `columns[].summary` | `data-summary` | `""·sum·avg·min·max·count` (Number columns; needs `summaryOptions.showSum`) |
| `columns[].dateFormat` | `data-date-format` | `datetime· date· time· year· q/yy· mm/yy· month· quarter` |
| `columns[].inlineOptions` | `data-inline-options` | inline editor: `{type: text\|number\|date\|select\|autocomplete, info?: "email", placeholder?, required?, readonly?, parentSelect?: "<class>"}` — `parentSelect` chains dependent selects (with `subclassPointers`) |
| `columns[].subclassPointers` | `data-subclass-pointers` | `[{field, targetClass}]` of the row's other pointers, for inline pointer editing |
| `optionalFields[]` | `data-optional-fields` | the add-column picker; items `{field, aggrField, type, text, dateFormat?, summary?, inlineOptions?, subclassPointers?}` — copy from `Get-Optional-Fields` and trim |
| `editView.openFrom` | `data-edit-view` | see §5 |
| `editView.page` / `useIframe` / `popupWidthPercent` / `popupHeightPercent` | `data-edit-view-page` / `data-edit-iframe` / `data-popup-width/height` | card-page wiring; width/height 0–100 |
| `filterAndSort.sortBy/sortOrder/sortLimit` | `data-sort-by/-order/-limit` | sortLimit = page size |
| `filterAndSort.criteria[]` | `data-criteria` | default filter (pre-search) — see §6 |
| `filterAndSort.queryForm` | `data-query-form` | search form name (`dynamic-table-formP113`) |
| `filterAndSort.queryGridSize` | `data-grid-size` | `"12"·"6"·"4"·"3"·"2"` = bootstrap col span **per criterion input** |
| `filterAndSort.waitForFirstSubmit` | `data-wait-for-sub` | table empty until first Search |
| `tablePermissions.allowCreate/Edit/Delete` | `data-allow-*` | per-row pencil/trash + New |
| `summaryOptions.showSum/sumTitle` | `data-show-sum`/`data-sum-text` | totals row; `sumTitle` may contain `"` here (escaped correctly) |
| `advancedOptions.allowExportToExcel` | `data-allow-csv` | "Export to Excel" link |
| `advancedOptions.exportToExcelRoles` | `data-export-to-csv-roles` | restrict export to roles |
| `advancedOptions.enableMultiRowsEdit` / `enableMultiRowsRoles` | `data-enable-multi-rows-*` | bulk-edit checkboxes (empty roles = all users) |
| `advancedOptions.showLoaderAnimation` / `showUrlAsLink` / `noResultsImageUrl` | `data-show-loader` / `data-url-2-link` / `data-no-results-image` | cosmetics |
| `conditionalFormattingRules` | `data-conditions-format-rules` | see §7 |

## 4. `aggrField` doctrine + `Get-Optional-Fields`

`field` controls display; `aggrField` is what the sort/filter/sum aggregation pipeline actually queries. For pointers the **target class name is interpolated in the middle** — and it must match the schema exactly:

| `field` | `aggrField` |
|---|---|
| `Name` | `Name` |
| `AccountId.Name` | `AccountId.Accounts.Name` |
| `StatusId.Name` | `StatusId.SupplierStatuses.Name` (the real lookup-table name) |
| `OwnerId.name` | `OwnerId._User.name` (⚠️ `_User` fields are lowercase: `name`, `email`, `phone`) |
| `createdBy.name` | `createdBy._User.name` |

**Never guess — run `Get-Optional-Fields(className)`** and copy `{field, aggrField, type, text}` verbatim. Live-verified output shape (Cases):

```json
[
  { "aggrField": "Name", "field": "Name", "type": "String", "text": "שם" },
  { "aggrField": "StatusId.CaseStatuses.Name", "field": "StatusId.Name", "type": "String", "text": "סטאטוס - שם סטטוס" },
  { "aggrField": "OwnerId._User.name", "field": "OwnerId.name", "type": "String", "text": "אחראי- שם" },
  { "aggrField": "AccountId.Accounts.Name", "field": "AccountId.Name", "type": "String", "text": "לקוח- שם" },
  { "aggrField": "Number", "field": "Number", "type": "AutoIncrement", "text": "מספר" }
]
```

It expands every pointer one level (incl. `createdBy`/`updatedBy`/custom pointers), uses the schema's Hebrew labels as `text`, and is the same source used by reports ([05-dashboards-and-reports.md](05-dashboards-and-reports.md)).

## 5. Edit modes (`editView.openFrom`)

| Value | Behavior | When |
|---|---|---|
| `inline` | pencil turns the row into editable inputs | quick-edit lists; **default when no working card page exists** |
| `modal` | centered popup (iframe of `page` when `useIframe`) | rich tabbed cards |
| `modal-left` / `modal-right` | sidebar slide-in (iframe) | the standard card UX (Cases uses `modal-left`); pair with `page:"apps/mybusiness/<Entity>"` + `useIframe:true` + `popupWidthPercent` |
| `newwindow` | navigate to `page` | flows needing their own URL — requires a MasterTicket-based card |
| `row` | edit form unfolds under the row | rare |
| `hidetable` | table swaps to the edit form | wizard flows |

If `useIframe:true` and `page` is missing/broken, the popup hangs on the spinner. NewMaster cards work in the iframe for authenticated users (see [03-pages-and-layouts.md](03-pages-and-layouts.md) §1).

## 6. Filters & search

### Default criteria (`filterAndSort.criteria[]`) — applied before any user search

```json
{ "F": "StatusId", "C": "containedIn", "T": "Pointer", "V": ["<objectId1>", "<objectId2>"],
  "FText": "סטטוס", "P": { "targetClass": "SupplierStatuses", "multiple": true, "visibleVal": "פעיל, בהקפאה" },
  "condOr": false }
```

`F` field · `C` operator · `T` value type · `V` value · `FText` label in saved-queries UI · `P` pointer metadata (required for Pointer values) · `condOr: true` = OR with the previous criterion. Clear all: `criteria: []`.

### Operators (`C`)

`contains · startsWith · endsWith · equalTo · notEqualTo · greaterThan · lessThan · greaterThanOrEqualTo · lessThanOrEqualTo · containedIn · notContainedIn · exists · doesNotExist` plus MyBusiness-specific: **`AuthorizedOn`** (records the current user is authorized for), **`underMyHierarchy`** / **`notUnderMyHierarchy`** (owner is the user or their reports — requires the customer's role hierarchy to be configured).

Special `V` values: `"currentUser"` (Pointer→`_User`); dates accept `"today"`, `"year ago"`, `"beginning of this month/year"`, `"30 days period"`, `"end of this month/next month/this year"`, `"year ahead"`, `YYYY-MM-DD`, or ±days as a number (per `Usage-Guide`).

The user-facing **search form** above the table is separate HTML (`form.dbFormQuery`, inputs named per field — live Suppliers page: Name/SupplierCode/City/Category inputs + StatusId `select-pointer`). `Edit-Table-View` cannot add/edit its inputs — that requires page JS or the Simbla editor (no MCP tool creates a Database Search form).

## 7. Conditional formatting (עיצוב מותנה)

```json
"conditionalFormattingRules": [
  { "name": "פעיל ירוק",
    "conditions": [ { "field": "StatusId.Name", "fieldType": "String",
                      "equesition": "equalTo", "value": "פעיל" } ],
    "actions":    [ { "action": "cell-color", "field": "StatusId.Name", "value": "#28a745" } ] },
  { "name": "חוב אדום מודגש",
    "conditions": [ { "field": "Balance", "fieldType": "Number", "equesition": "lessThan", "value": 0 } ],
    "actions":    [ { "action": "row-text-color", "value": "#dc3545" },
                    { "action": "row-font-weight", "value": "bold" } ] }
]
```

- `conditions[]` are AND-ed; `equesition` ∈ `equalTo·notEqualTo·greaterThan·lessThan·greaterThanOrEqualTo·lessThanOrEqualTo·containedIn·notContainedIn·empty`; pointer values use objectId + `visibleVal` label.
- `actions[].action`: `row-color` · `cell-color` (+`field`) · `row-text-color` · `cell-text-color` (+`field`) · `row-font-weight` · `hide-row`. Later rules override earlier ones on the same property.
- Scalable alternative for status colors: a `Color` field on the lookup table + page JS painting pills (the `myb-p-create-entity` template does this).

## 8. Recipes

- **Money column with totals:** column `{type:"Number", summary:"sum"}` + `summaryOptions:{showSum:true, sumTitle:"סה\"כ"}`.
- **Multi-row edit for managers only:** `advancedOptions:{enableMultiRowsEdit:true, enableMultiRowsRoles:["Admin","Manager"]}`.
- **Excel export for everyone / restricted:** `allowExportToExcel:true` (+ `exportToExcelRoles:["Admin"]` to gate). Export respects the current filter (report-level CSV export is `AllowCsv` — see 05).
- **Default "active only" view that users can still search over:** `filterAndSort.criteria:[{F:"Active",C:"equalTo",T:"Boolean",V:true}]`.
- **Dependent inline dropdown** (SubType filtered by Type): child column `inlineOptions:{type:"select", parentSelect:"CaseTypes"}` + `subclassPointers` listing the parent pointer.
- **Embedded child table on a card:** 3-step pattern — `Add-Table-View-to-Form-Page` (safe `insertAfterRow`!) → verify placement ancestors → `Edit-Table-View` to finalize (aggrFields, classPointers incl. the pointer to the form's class — that pointer drives the **auto-filter** to the open record; `criteria` only for additional filters). Full placement rules in [03-pages-and-layouts.md](03-pages-and-layouts.md) §6.

## 9. Known issues (platform behaviors, 2026-04 audit)

| # | Issue | Workaround |
|---|---|---|
| KI-1 | Missing `aggrField` per column on embed → `data-aggr-field="undefined"`, sort/aggregate broken | always pass it (from `Get-Optional-Fields`) |
| KI-2 | `Add-Table-View-to-Form-Page` mangles `showSummary` containing `"` | quote-free placeholder, then `Edit-Table-View(summaryOptions)` |
| KI-3 | `insertAfterRow` matches the FIRST row with that ID (IDs repeat across tabs) | verify with `Get-Page-Content` first |
| KI-4 | Cloned list inherits source-class `optionalFields` | override via `Edit-Table-View` |
| KI-5 | Search form stays bound to source class | page JS / `Edit-Page`; saved queries remain tied to the original class either way |
| KI-6 | Inherited inline `jsCode` runs Cases-specific overrides | clear via `Edit-Page-CSS-JS` |
| KI-7 | "New" modal header still "פנייה חדשה" | page JS |
| KI-8 | `classPointers` wholesale-replace silently kills created/updated sort | always re-pass full map incl. `createdBy`/`updatedBy` |
| KI-9 | Embed nests inside a tab/another widget when the next sibling is one → no auto-filter | choose a safe `insertAfterRow`; verify ancestors |
| KI-10 | `move-existing-object` on a widget row destroys the widget | delete + re-add instead |

## Limitations & gotchas

- **Whole-state semantics** are the #1 foot-gun: an `Edit-Table-View` call that "just adds a column" but omits `classPointers` breaks sorting elsewhere. Build the full desired state every call.
- **The search form is out of `Edit-Table-View` scope** — adding a search criterion input = `Edit-Page`/JS, not a table param.
- **Saved queries (queries dropdown)** on a page are `_DynamicQueries` records bound by `FormName` (e.g. `dynamic-table-formP113`) — manage via `Create-or-Update-Report` ([05-dashboards-and-reports.md](05-dashboards-and-reports.md) §Reports).
- `summary` on non-Number columns renders `data-summary="undefined"` (harmless noise). `AutoIncrement` type renders only when the DB field really is auto-increment.
- Hierarchy operators (`underMyHierarchy` etc.) no-op in systems without a configured role hierarchy.
- Inline edit of pointer columns needs both `inlineOptions` (`select`/`autocomplete`) and correct `classPointers`/`subclassPointers`; `autocomplete` for large targets (Accounts, _User), `select` for small lookups.
- Pages have ONE table-related search form by convention; multiple tables on one page each need their own `queryForm` wiring — uncommon, prefer separate pages.
- `sortLimit` is the page size; there is no server-side "max rows" guard on export — large exports can be slow. ⚠️ UNVERIFIED export row cap.
