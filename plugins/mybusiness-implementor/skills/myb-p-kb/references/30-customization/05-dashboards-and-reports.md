# Dashboards & Reports — Counters, Charts, Tabs, Dynamic Queries, Pivots, Scheduling

> **Purpose:** Spec-ready reference for analytical surfaces: dashboard pages (דשבורד — KPI counters, Chart.js charts, embedded tables, date filters, Dashboard Menu integration, the clone-and-repoint pattern) and the reports engine (`_DynamicQueries` — flat/aggregated/pivot/compound reports, calculated fields, scheduled email delivery). Includes the dashboard tooling-gap register with live 2026-06 status.
> **Last updated:** 2026-07-21 · **Status:** draft

---

# Part A — Dashboards

## A1. Architecture

A dashboard is a **regular page on `CRMmaster`** (same master as list pages — that's what gives it nav chrome). The content is a fixed grid of: a header row with icon + H2 + a date-filter form, KPI counter cards, chart cards, and an embedded `simbla-table`.

```
apps/mybusiness/DashboardX  (masterPageId = CRMmaster, loginOnly)
├── Header row: icon + title + <form name="genericform"> (FromDate/ToDate) + הפעל + ערוך
└── Main row (col-md-7 + col-md-5)
    ├── col-md-7: CounterForm → 2× KPI counter cards → GraphForm1 → 2×2 chart cards
    └── col-md-5: MapForm → 1 chart + spacer + 1 simbla-table (stacked containers)
```

Elements reference the date filter via `data-criteria` entries like `{"F":"createdAt","C":"greaterThan","V":"genericform:FromDate","T":"Date"}` — the `formName:fieldName` syntax reads the input's value at query time; clicking הפעל re-queries. If the referenced input doesn't exist, the criterion **silently no-ops**.

**Every stock dashboard shares this skeleton** — they differ only in `data-simbla-class` and aggregated fields. The 8 stock dashboards: `DashboardSales`, `DashboardLeads` (funnel-heavy), `DashboardCaseManager`/`DashboardCaseRep`, `DashboardGenManager`/`DashboardGenRep`, `DashboardSalesManager`/`DashboardSalesRep` (+ `Mobile-DashboardSales`). Manager variants roll up by user; Rep variants filter to the current user. So **building a new dashboard = cloning + repointing**, not building from scratch.

## A2. Clone & repoint workflow (the proven path)

1. `Get-Site-Pages` → source dashboard `_id` (e.g. DashboardSales — on the Playground demo `69bfd6ca45604bc0d3567557`; IDs are per-environment).
2. `Get-Schema(target)` + `Get-Data(target, limit:5)` — confirm fields & data exist.
3. **Clone:** `Create-Table-View-Page(tableName, pageName:"apps/mybusiness/DashboardX", copyFromPageId, title, menuName, searchFields:[minimal placeholder], tableColumns:[minimal placeholder], editEntityPageName/editEntityTitle/createNewEntityTitle/mainSearchTitle)` — `searchFields`/`tableColumns` are required placeholders; the clone keeps CRMmaster, `loginOnly`, css/js inheritance.
4. `Set-Page-Settings(pageId, title)` — the SEO title stays "DashboardSales" otherwise.
5. **Discover elements:** `Get-Page-Content(pageId, minimal: false)` — the clone is a **deep copy**; every counter/chart/table is present, still pointing at the source class, looking "empty" only because its criteria evaluate to nothing. `minimal: true` HIDES these elements — never trust it here. On a DashboardSales clone the stable IDs are: counters `P33,P37`; charts `P52,P45,P51,P211,P42`; titles `P71,P65,P70,P64,P130,P214`; captions `P62,P55`; table `P217`; genericform `P199`.
6. **Repoint in place via `elemId`** (passing `rowId+columnNumber` on an occupied slot ADDS a second element — the classic failure): counters → `Add-Edit-Counter-Element(elemId,…)`, charts → `Add-Edit-Chart-Element(elemId,…)`, titles/captions → `Add-Edit-Text-Element(elemId,…)`. **Always pass `criteria: []`** to wipe inherited source criteria (e.g. `SaleStatusId=הושלמה`) — stale criteria against a non-existent field silently zero the query.
7. **Embedded table** → `Edit-Table-View(pageId, tableId:"P217", tableClassName, classPointers incl. createdBy/updatedBy, columns with aggrField, filterAndSort, editView:{openFrom:"inline"}, summaryOptions)` ([04-table-views-and-lists.md](04-table-views-and-lists.md)).
8. **Restore the date form:** the clone's required `searchFields[0]` OVERWRITES the `FromDate` input in `genericform` and drops `ToDate` (gap A2). No tool edits sub-form inputs — inject repair JS via `Edit-Page-CSS-JS` that rewrites the inputs on load (template in `myb-p-dashboards/SKILL.md` §7).
9. **Dashboard Menu:** see A6.
10. Hard-reload (Ctrl+F5) — `dashboardSales.js` caches.

## A3. Counter element — `Add-Edit-Counter-Element`

| Param | Req | Notes |
|---|---|---|
| `pageId` | yes | page (or search by name) |
| `counterFunction` | yes | `sum-count` (record count) · `sum` · `avg` · `min` · `max` |
| `counterField` | for sum/avg/min/max | numeric field |
| `tableName` | when adding | queried class (`data-simbla-class`) |
| `rowId`+`columnNumber` \| `intoExistingElemId` | when adding | position — `intoExistingElemId` places **inside a container** (never an `rDivider`) |
| `elemId` | when editing | update-in-place |
| `format` | no | Numeral.js: `0,0` · `0,0.00` · `0%` |
| `css` | no | inline style on the inner `<h1>` (color/size/padding only — not a card wrapper) |
| `criteria` | no | array of `{F,C,T,V,FText?,P?}`; `V` supports `"currentUser"` and `"formName:fieldName"` |
| `queryForm` | no | bind to a page form so its date/select inputs become live filters |

**Auto-filter on cards:** a counter/chart placed inside a record form whose query table has a Pointer to the form's class is filtered to the open record automatically (e.g. a Sales counter on an Account card) — no criteria needed. This makes per-record mini-dashboards on cards a pure-config feature.

```json
{ "pageId": "<id>", "elemId": "P33", "tableName": "Affiliates",
  "counterFunction": "sum", "counterField": "TotalEarnings", "format": "0,0", "criteria": [] }
```

## A4. Chart element — `Add-Edit-Chart-Element`

| Param | Req | Notes |
|---|---|---|
| `chartType` | yes | `Bar` · `Line` (support `chartCategory` series) · `Pie` · `Doughnut` |
| `chartTheme` | yes | `icecream rainyday bluesky grasshopper partytime simbla romantic heatwave blooming sunnysummer underthesea coldmountain oldtown daydream` |
| `chartLabel` | — | x-axis/grouping field; pointer = `Field.TargetClass.Field` (`StatusId.AffiliateStatuses.Name`, `OwnerId._User.name`) |
| `chartLabelFormat` | when label is Date | `dow· q· q/yy· mm· mm/yy· yy· dd/mm/yy· mm/dd/yy` |
| `chartLabelSort` | no | `ascending`/`descending` |
| `chartCategory`(+`chartCategoryFormat`) | no | second dimension → separate series (Bar/Line only) |
| `chartFunc` | — | `sum-count· sum· avg· min· max` |
| `chartValue` | when func ≠ sum-count | numeric field |
| `chartDataset` / `chartOptions` | no | raw Chart.js overrides |
| `criteria` / `queryForm` | no | same shapes as counter |
| positioning | | same as counter (`rowId`+`columnNumber` / `intoExistingElemId` / `elemId`) |

```json
{ "pageId": "<id>", "elemId": "P52", "tableName": "Affiliates",
  "chartType": "Doughnut", "chartTheme": "icecream",
  "chartLabel": "StatusId.AffiliateStatuses.Name", "chartFunc": "sum-count", "criteria": [] }
```

Debug table: counter blank/"C" → criteria references a missing form field; counter 0 with data → wrong `counterField`/over-restrictive criteria; chart axes without bars → criteria mismatch or null `chartValue`; one giant bar → `chartLabel` is free text, switch to a category field; "Unknown" pie segment → null labels (exclude via criteria); two charts stacked in one slot → you added instead of editing (`elemId`). Canvas chart text **cannot be recolored via CSS** (rasterized) — use `chartOptions`.

## A5. Adding new sections (extend, don't clone)

Insert rows after the last content row (before the trailing `#SideModal` htmlEditor): batch `Edit-Page add-row` with the same `newRowAfterRow` — they land in **reverse order**, so list actions bottom-up. Then fill: `Add-Edit-Text-Element` (header H2; chart-title `<p>` with `border-bottom:1px solid #b5b5b5`; caption grey `#b5b5b5` 12px), `Add-Edit-Counter-Element`/`Add-Edit-Chart-Element` per column.

**Card look:** stock dashboard slots are wrapped `containerHolder > container` (white bg, `border:1px solid #f0f0f0`, radius, padding). Today, create the wrapper with `Add-Container-to-Page(pageId, toExistingRow, toExistingColumn)` and pass the returned container as `intoExistingElemId` to the element tools (this closed gap B1 — the historic CSS-faking workaround in `myb-p-dashboards` SKILL is now optional). Match the existing palette: primary `#013479`, success `#28a745`, accent `#d13f75`, warning `#ffc107`, borders `#f0f0f0`, captions/dividers `#b5b5b5`. Site-wide dashboard styling (header strip, tile shadow `-4px 3px 13px rgba(76,76,76,.1)`) comes from `unified-master.css` — scope page CSS with `body.page-slug-dashboardx` ([03-pages-and-layouts.md](03-pages-and-layouts.md) §9).

Tabs on dashboards/pages: `Add-Edit-Tabs-Element(pageId, rowId, columnNumber, newTabs:[{label}], …)`; edit via `elemId` + `updateTabs`/`deleteTabs` ([03-pages-and-layouts.md](03-pages-and-layouts.md) §5).

## A6. Dashboard Menu integration

```json
// 1) Get-Menus → find "Dashboard Menu" (stable origin 5a2ceaae377ac4001aeb002d) → menuId
// 2) Set-Menu-Items
{ "menuId": "<dashMenuId>", "items": [ {
    "type": "page", "page": "<newDashboardPageId>", "title": "דשבורד שותפים",
    "icon": "fa-handshake-o", "order": 7, "visibility": [] } ] }
```

- `type` is REQUIRED even when updating an existing item (`_id`); delete = `{_id, removeThisItem: true}`; hierarchy via `parent`.
- **Icon bug (X2):** pass the bare class `fa-truck` — the system prepends `fa `; passing `"fa fa-truck"` yields broken `fa fa fa-truck`.
- `visibility: []` matches existing items; `["loggedIn"]`/role arrays may filter the item out — mirror what's already there. The same `Set-Menu-Items` contract (incl. `_id` updates, `removeThisItem`, `parent` hierarchy, MongoDB-format item IDs) applies to the main side menu.

## A7. Tooling-gap register (from `myb-p-dashboards/references/tooling-gaps.md`, re-checked 2026-06-10)

| Gap | Description | 2026-04 status | **Live 2026-06 status** |
|---|---|---|---|
| A1 | Clone is a deep copy (no shell clone / `cleanContent`) | open | open — repoint via `elemId`, `criteria: []` |
| A2 | `searchFields` injection overwrites `genericform` FromDate/ToDate | open | open — JS restore workaround |
| A3 | `Get-Page-Content(minimal:true)` hides counter/chart/table elements | open | open — use `minimal:false` for discovery |
| B1 ⭐ | No container-wrapper creation → new elements render bare | open | **CLOSED** — `Add-Container-to-Page` exists; element tools accept `intoExistingElemId` (exactly the wishlist item) |
| B2 | No `Delete-Element` (only `delete-row`) | open | open — hide via CSS `#elemId{display:none!important}` |
| B3/C2 | No tool to create/edit a Database Search form (`dbFormQuery`) or its inputs | open | open — clone a page that has one; JS for input fixes |
| B5 | `add-row toExistingColumn` mis-nests for columns ≥ 1 | open (bug report filed) | **reported FIXED** by platform (a nested-row fix) — ⚠️ re-verify on first use |
| C1/C3 | No blank-page-with-master creation; `Set-Page-Settings` has no `masterPageId` | open | open (confirmed: live `Set-Page-Settings` schema has no master param) — always start from a clone |
| X1 | No `Delete-Page` | open | open (no such tool in the live tool list) — rename `_old_*` |
| X2 | Menu icon double-prefix | open | open (workaround stable) |
| X3 | Menu-item visibility model undocumented | partially closed | unchanged — copy working shapes |

With B1 closed and tabs available, **from-scratch dashboards are now technically feasible**, but clone-and-repoint remains the fast, layout-faithful path (A1/A2/B3 still bite).

---

# Part B — Reports & queries

## B1. The model

Both live in the **`_DynamicQueries`** Parse class and are managed by `Create-or-Update-Report` / `Get-Reports`:

| Kind | Where it appears | Distinguishers |
|---|---|---|
| **Report** (דוח) | `apps/mybusiness/Reports` page | `PageName: "apps/mybusiness/reports"`; FormName e.g. `dynamic-table-reportP139` |
| **Query** (שאילתה / saved view) | The queries dropdown of an entity list page (Sales, Accounts…) | `PageName` = that page; `FormName` = the page's table form (`dynamic-table-formP113`-style); optional `Default: true` = the page's initial view |

Live demo verification (Get-Reports, 2026-06-10): 38 records — 31 aggregated, 11 pivots, 3 compound, 4 scheduled, plus SLA/flat reports; `FormName` present on page-bound ones. Get the right `FormName` by copying from an existing record on the same page (`Get-Reports(pageId)`).

## B2. `Create-or-Update-Report` — parameter map

Call shape: `{ "report": { …fields… } }` to create; `{ "reportId": "<objectId>", "report": { …changed fields… } }` to update.

| Group | Field | Notes |
|---|---|---|
| Identity | `Name` | Hebrew display name |
| | `ClassName` | source table (omit on entity-page queries to default to the page's class) |
| Location | `PageName` / `PageId` / `FormName` / `Default` | see B1 |
| Columns | `ShowFields` | array of display paths — dot notation **without** class name: `"AccountId.Name"`, `"OwnerId.name"` (lowercase `_User` fields) |
| | `OptionalFields` | per-column config `{field, text, summary, type?, aggrField?, aggrFunc?, dateFormat?}` |
| Filters | `QueryElems` | filter controls `{F, FText, C, T, V, P?}` — same operator set as table criteria; pointer multi-select = `C:"containedIn"` + `P:{targetClass, multiple:true}`; `V:"currentUser"` for "my records" |
| Shape | `IsAggr` | false = flat list of records; true = grouped/summarized |
| | `PivotInfo` | `{row, col, value}` cross-tab (requires IsAggr) |
| | `CalculatedFields` | `[{name, fieldA, fieldB, action: Plus·Minus·Times·Divide·"Divide (%)"}]`, chainable by `name` |
| | `SubqueriesInfo` | compound report `{baseQuery, queries:[…]}` — **REST-only**, see B6 |
| Display | `Sort` (`-createdAt` = desc), `ShowSum` (totals-row title), `GridDivider`, `AllowCsv`, `Url2Link` | |
| Schedule | `ScheduleSendAt` `{interval: daily·weekly·monthly, hour, occurrence:[days]}` + `ScheduleSendTo` (comma-sep emails) | see B7 |
| Access | `permissions` `["role:Admin","role:Sales","<userObjectId>"]` (view) · `editPermissions` `"<userObjectId>"` (required when creating with master key) | |

## B3. The Three-Field Trinity (aggregate reports' #1 failure mode)

For each column of an aggregated report, three values must align:

| Property | Format | Example |
|---|---|---|
| `ShowFields[i]` | dot path, **no class name** | `"SaleStatusId.Name"` |
| `OptionalFields[i].field` | **identical to ShowFields[i]** | `"SaleStatusId.Name"` |
| `OptionalFields[i].aggrField` | full path **with class name** | `"SaleStatusId.SaleStatuses.Name"` |

Copy `field`/`aggrField` verbatim from `Get-Optional-Fields(className)` ([04-table-views-and-lists.md](04-table-views-and-lists.md) §4). Setting `field: "SaleStatusId"` (the pointer object) instead of `"SaleStatusId.Name"` (the display string) → empty results or broken rendering.

**"Group-by must be a String"** — two related rules:
1. *Reports:* the group-by column must resolve to a string-typed display value (`X.Name`, not the Pointer object) — that's the Trinity above.
2. *`Aggregate-Data` MCP tool:* its `groupby` parameter must literally be a **String** path (`"SaleStatusId.SaleStatuses.Name"`), never an object — passing an object throws `groupby.includes is not a function`.

## B4. Aggregation semantics (`IsAggr: true`)

In `OptionalFields`: a field **without** `aggrFunc` (or `""`) is a **group-by dimension**; with `aggrFunc` it is a **measure**. Values:

| aggrFunc | Meaning |
|---|---|
| `""` / omitted | group by the field |
| `dow· q· q/yy· mm· mm/yy· yy· dd/mm/yy· mm/dd/yy` | group a Date field by that bucket (`mm/yy` is the workhorse) |
| `count· sum· avg· min· max` | aggregate measure |

Always include `ShowFields` on aggregate reports (columns may not render otherwise), and add an **`exists` filter on every group-by field** to prevent the `"Group object must contain values"` error on null values:

```json
"QueryElems": [
  { "F": "SaleStatusId", "C": "exists", "T": "Pointer",
    "P": { "targetClass": "SaleStatuses" }, "FText": "שלב קיים" } ]
```

Live-verified aggregated pivot (demo report `Z3pr2kQCLb` "פיבוט מכירות - אחראי x חודש"):

```json
{ "Name": "פיבוט מכירות - אחראי x חודש", "ClassName": "Sales", "IsAggr": true,
  "ShowFields": ["OwnerId.name", "createdAt", "Total"],
  "OptionalFields": [
    { "field": "OwnerId.name", "aggrField": "OwnerId._User.name", "text": "אחראי", "summary": "" },
    { "field": "createdAt", "aggrField": "createdAt", "text": "חודש", "aggrFunc": "mm/yy" },
    { "field": "Total", "aggrField": "Total", "text": "סה\"כ", "aggrFunc": "sum", "summary": "sum" } ],
  "PivotInfo": { "row": "OwnerId.name", "col": "createdAt", "value": "Total" } }
```

`PivotInfo`: `row` = a group-by field, `col` = usually a date with a time `aggrFunc`, `value` = a measure with `sum`/`count`; all three must appear in `ShowFields`/`OptionalFields`.

## B5. Filter layout rules (the UI renders QueryElems right-to-left, top-to-bottom)

- **`GridDivider`: always `3`** (4 filters/row, ideal) **or `4`** (3/row). Never 6 or 12 — stretched filters look broken, even with few filters.
- Order `QueryElems`: text searches → pointer multi-selects → date-range pairs (`greaterThanOrEqualTo` + `lessThanOrEqualTo`) → **Boolean checkboxes last** (ends bottom-left in RTL, the natural checkbox spot).

## B6. Compound reports (דוח מורכב) — REST only

A compound report is a minimal `_DynamicQueries` record that references other reports. The MCP tool **ignores `SubqueriesInfo`** — create via Parse REST:

```bash
curl -X POST https://api.mbapps.co.il/parse/classes/_DynamicQueries \
  -H "X-Parse-Application-Id: $APP_ID" -H "X-Parse-Master-Key: $MASTER_KEY" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-raw '{ "Name": "דשבורד מכירות מורכב",
    "PageId": "<reports pageId>", "PageName": "apps/mybusiness/reports",
    "FormName": "dynamic-table-reportP139", "Default": false,
    "SubqueriesInfo": { "baseQuery": "<baseReportId>", "queries": ["<id2>", "<id3>"] },
    "ACL": { "role:Admin": {"read": true}, "<userId>": {"read": true, "write": true} } }'
```

Rules: every referenced report (base + up to 3 secondary) **must be aggregated**; include ONLY `Name, PageId, PageName, FormName, Default, SubqueriesInfo, ACL` (no ClassName/ShowFields/IsAggr/etc.); filters inherit from the base; credentials from the project's `.env`/`.mcp.json`. Live-verified shape: demo `D1HqoVTnI3` → `{"baseQuery":"Z3pr2kQCLb","queries":["8MGPXrmaWu"]}`.

## B7. Scheduled delivery

```json
"ScheduleSendAt": { "interval": "daily", "hour": 8, "occurrence": [] },
"ScheduleSendTo": "manager@company.com,team@company.com"
```

`occurrence`: `[]` daily · `[0..6]` weekly days (0=Sunday) · `[1,15]` month days. Live-verified on the demo (4 scheduled reports). **Known bug:** creating with scheduling can throw `Simbla is not defined` in some environments (and when `ScheduleSendTo` is empty) — create the report without scheduling first, then add the schedule via the CRM UI; always provide a recipient.

**Activation requires a UI save (live-verified 2026-07-21):** the schedule depends on a front-end component that is only initialized when the report is saved from the report generator UI. A scheduled report created or updated tool-side (`Create-or-Update-Report` / direct `_DynamicQueries` write) never sends — even with correct `PageId`/`FormName`/recipients — until a user opens that specific report in the report generator and clicks Save. Always hand the user this activation step and treat the schedule as inactive until the save is confirmed.

## B8. Build workflow (reports)

1. `Get-Schema(class)` + **`Get-Optional-Fields(class)`** — copy exact `field`/`aggrField`/`type`/`text`.
2. `Get-all-Users` + `Get-Roles` → permission targets (typical roles: Admin, Sales, CRM, Support, Lead Admin, Report Admin).
3. `Create-or-Update-Report` (entity-page queries: fetch `FormName` from an existing query on that page).
4. Verify with `Get-Reports(pageId?)` — or `Get-Data("_DynamicQueries", where…)`.
5. **Scheduled reports only:** hand the user the activation step — open the report in the report generator and Save; a tool-side write alone never activates the schedule (B7).

## Limitations & gotchas

- **`Get-Reports` output is huge** (825KB on the 38-report demo) — prefer `objectId`/`pageId` params, or query `_DynamicQueries` with `keys`.
- **MCP cannot create compound reports** (B6) and cannot delete reports (no delete tool) — delete via REST `DELETE /parse/classes/_DynamicQueries/<id>` or the UI.
- **`editPermissions` is mandatory** when creating via master key, and `permissions` must list at least the viewing roles — otherwise the report is invisible to users.
- **Aggregate failure modes**: missing `exists` filter on group-by → "Group object must contain values"; Trinity mismatch → silent empty results; missing `ShowFields` → invisible columns; wrong `aggrField` class segment → wrong-order or empty data.
- **`Aggregate-Data` (ad-hoc MCP aggregation, not a saved report)** shares the same path grammar; `groupby` must be a String; `order` by the computed key (`-total`); `where` uses Parse operators with full Pointer objects.
- **Dashboards: trust the live tool list over docs** — the 2026-02 tool-guide export and the 2026-04 skill predate `Add-Container-to-Page`/`Add-Edit-Tabs-Element`. Re-run the gap symptom checks (A7 table) before relying on a workaround.
- **All element/table IDs (P33, P113, P217…) and page IDs are per-environment** — stable across clones of the same source, but always re-discover via `Get-Page-Content(minimal:false)` after a customer may have hand-edited.
- Counters/charts honor CLP — a user without `find` on the queried class sees empty widgets; test with a non-admin user.
- Chart text/colors beyond themes require `chartDataset`/`chartOptions` (Chart.js JSON), not CSS (canvas is rasterized).
