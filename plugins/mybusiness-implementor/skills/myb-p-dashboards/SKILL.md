---
name: myb-p-dashboards
description: "Create, modify, and maintain analytical dashboards in MyBusiness CRM. Invoke whenever the user wants to build a dashboard for any entity (Sales, Leads, Cases, custom entities), redesign one, add KPI counters, charts (Bar/Line/Pie/Doughnut) or embedded data tables to a dashboard page, integrate it into the CRM 'Dashboard Menu', or troubleshoot a broken-looking dashboard (empty charts, page with no nav, missing menu entry, two elements in one slot). Strong triggers: דשבורד, דאשבורד, KPI, מד, ספירה, גרפים, simbla-counter, simbla-chart, DashboardSales, DashboardLeads, Dashboard Menu, Create-Table-View-Page with copyFromPageId, Add-Edit-Counter-Element, Add-Edit-Chart-Element, dashboard, analytics page, metrics page. Even 'תקים דאשבורד ל-X', 'בנה לי מבט-על על Y' or 'תוסיף KPI לדף הזה' is this skill. STATUS: DRAFT — MCP tooling gaps documented in references/tooling-gaps.md; revise once filled."
---

# MyBusiness CRM Dashboards

Build dashboards that look and behave like the existing `apps/mybusiness/DashboardSales` / `DashboardLeads` / `DashboardCaseManager` — full grid with date-filter header, KPI counters, charts, and an embedded data table — for any entity in the CRM.

> **DRAFT NOTICE.** This skill was authored on 2026-04-29 after a single end-to-end build (Affiliates + Suppliers dashboards) plus a follow-up extension exercise. Several MCP tools are missing today, requiring workarounds. See [references/tooling-gaps.md](references/tooling-gaps.md). When those tools land, the workflow below should be simplified — DO update this file at that point.

This skill covers two flows:
1. **Build a new dashboard** (clone an existing one, repoint elements in place via `elemId`) — the bulk of the workflow below.
2. **Extend an existing dashboard** (add fresh rows + elements at the bottom) — see "Extending an existing dashboard with a new section" further down.

## Architecture

A MyBusiness CRM dashboard is just a regular page with `masterPageId` = `CRMmaster` (the same master used by the entity LIST pages — Accounts, Cases, etc.). What makes it a dashboard is the *content*: a fixed grid containing a date-filter form, counter/chart elements, and an embedded `simbla-table`.

```
apps/mybusiness/DashboardX (masterPageId = CRMmaster)
└── Page content
    ├── Header row (P161): icon + title H2 + <form name="genericform"> with FromDate/ToDate inputs + 'הפעל' button + 'ערוך' button
    └── Main row P4 (col-md-7 left + col-md-5 right)
        ├── col-md-7 (LEFT in HTML, RIGHT in RTL):
        │   ├── form CounterForm: row of date inputs + filter btn
        │   ├── P5 row: 2× col-md-6 KPI cards (each card = container with row of 4 cols [empty, counter, icon, empty] + caption row)
        │   ├── form GraphForm1: row of date inputs + filter btn
        │   ├── P6 row: 2× col-md-6 chart containers (with title + simbla-chart)
        │   └── P8 row: 2× col-md-6 chart containers
        └── col-md-5 (RIGHT in HTML, LEFT in RTL):
            ├── form MapForm: row of date inputs + filter btn
            └── P10 row col-md-12: 3 stacked containers (chart + spacer + simbla-table)
```

The chart/counter elements reference the date filter via `data-criteria` containing `{"V": "genericform:FromDate", "T": "Date"}`. When the user picks a date and clicks 'הפעל', the criteria evaluate against the form values and the elements re-query.

**Key insight:** every existing dashboard (`DashboardSales`, `DashboardLeads`, `DashboardCaseManager`, `DashboardGenManager`, `DashboardSalesRep` …) shares this **same skeleton**. They differ only in what the counter/chart `data-simbla-class` points to and which fields they aggregate. So building a new dashboard is mostly **cloning + repointing**, not building from scratch.

## Picking the right source dashboard

| Need | Clone from | Why |
|---|---|---|
| Standard 2-KPI + 4-chart + 1-table layout | `DashboardSales` (`69bfd6ca45604bc0d3567557`) | Most balanced. Two counters, four chart slots, one Tasks-style table. |
| Funnel-heavy layout (e.g. Leads/Pipeline) | `DashboardLeads` (`69bfd6c945604bc0d356754f`) | Has lead-funnel boxes + counters by status |
| Manager view (rolled-up) | `DashboardSalesManager` / `DashboardCaseManager` | Aggregates by user/owner |
| Mobile dashboard | `Mobile-DashboardSales` (`69bfd6ca45604bc0d356755a`) | Rebuild with mobile master |

Run `Get-Site-Pages` and grep `Dashboard` to confirm IDs in the current site (they're stable but verify).

## Workflow

This is the verified end-to-end. Read it once before starting; the gotchas matter.

### 1. Clone the source dashboard

```
Create-Table-View-Page(
  tableName: "<TargetTable>",                       // e.g. "Affiliates"
  pageName: "apps/mybusiness/DashboardX",
  copyFromPageId: "<sourceDashboardId>",            // e.g. DashboardSales
  title: "<Hebrew title>",                          // replaces the H2 text
  searchFields: [{field:"Name", label:"מתאריך", type:"String", equesition:"contains"}],
  tableColumns: [{field:"Name", label:"שם", type:"String", aggrField:"Name"}],
  menuName: "<Hebrew menu label>",                  // ignored by Dashboard Menu but required
  editEntityPageName: "<Singular>",
  editEntityTitle: "עריכה", createNewEntityTitle: "חדש", mainSearchTitle: "חיפוש"
)
```

`searchFields` and `tableColumns` are **required** — pass minimal placeholders. The `searchFields[0]` will overwrite the `FromDate` input in `genericform` (we restore it in step 6). This is a documented gap; see references/tooling-gaps.md.

The result has the right `masterPageId` (CRMmaster), `loginOnly: true`, and inherits `dashboardSale.css` + `dashboardSales.js`.

Run `Set-Page-Settings(pageId, title: "<Hebrew title>")` afterwards — `Create-Table-View-Page` leaves `title` as the source's "DashboardSales".

### 2. Discover existing elements (CRITICAL — easy to miss)

The clone is a **deep copy**: every counter, chart, label, and the embedded table from the source are still in the new page, all pointing at the source class (Sales / Cases). They look "empty" in screenshots because their date-criteria evaluate to nothing, but they're there.

Run `Get-Page-Content(pageId, minimal: false)` and scan for:

- `simbla-counter` elements — their `id` (e.g. `P33`, `P37`) is what you'll pass as `elemId` later
- `simbla-chart` elements — same (`P52`, `P45`, `P51`, `P211`, `P42` on a DashboardSales clone)
- `simbla-table` element — usually `P217` on a DashboardSales clone
- text titles inside chart containers — `P71`, `P65`, `P70`, `P64`, `P130`, `P214`
- caption texts under counters — `P62`, `P55`

**Do not use `minimal: true` here** — it strips counter/chart/table elements from the YAML and makes empty containers look truly empty, leading you to add new elements alongside the originals (the failure mode the first iteration of this skill exhibited).

[references/dashboardsales-element-map.md](references/dashboardsales-element-map.md) has the slot-by-slot map for a fresh DashboardSales clone, including the IDs you'll target.

### 3. Repoint counters in-place via `elemId`

For each existing counter, call `Add-Edit-Counter-Element` with `elemId: "<existing>"` plus the new params. This **updates** the element rather than adding a sibling.

```
Add-Edit-Counter-Element(
  pageId, elemId: "P33",
  tableName: "Affiliates",
  counterFunction: "sum",  counterField: "TotalEarnings",
  format: "0,0",
  criteria: []      // EXPLICITLY pass [] to wipe inherited Sales criteria
)
```

If you omit `criteria`, the inherited `[ClosingDate range, SaleStatusId=הושלמה]` array stays — and any field reference like `SaleStatusId` against your new table breaks the query. Pass `criteria: []` every time unless you actually want filtering.

### 4. Repoint charts in-place via `elemId`

Same pattern as counters:

```
Add-Edit-Chart-Element(
  pageId, elemId: "P52",
  tableName: "Affiliates",
  chartType: "Doughnut", chartTheme: "icecream",
  chartLabel: "StatusId.AffiliateStatuses.Name",
  chartFunc: "sum-count",
  criteria: []
)
```

For Bar/Line charts add `chartValue` (numeric field) and optionally `chartLabelSort`. For date axes pass `chartLabelFormat: "mm/yy"` (or `dd/mm/yy`, `q/yy`, `yy`).

Themes: `icecream, rainyday, bluesky, grasshopper, partytime, simbla, romantic, heatwave, blooming, sunnysummer, underthesea, coldmountain, oldtown, daydream`.

### 5. Update text labels via `elemId`

Both the chart titles (`<p><font color="#333333">...</font></p>` inside the container's title row) and the counter captions (`<p><font color="#b5b5b5">...</font></p>` in the row below the counter) are addressable by `elemId`:

```
Add-Edit-Text-Element(
  pageId, elemId: "P71",
  elemType: "P",
  html: "<p><font color=\"#333333\">שותפים לפי סטטוס</font></p>"
)
```

For the small grey caption under a counter:
```
Add-Edit-Text-Element(
  pageId, elemId: "P62",
  elemType: "P",
  html: "<p style=\"text-align:center;\"><font style=\"font-size:12px;\" color=\"#b5b5b5\">סך עמלות שנצברו (₪)</font></p>"
)
```

### 6. Convert the embedded table

The cloned page has a Tasks `simbla-table` (`P217` on a DashboardSales clone). Convert it to a list of records from your target table via `Edit-Table-View`:

```
Edit-Table-View(
  pageId, tableId: "P217",
  tableClassName: "Affiliates",
  classPointers: { createdBy: "_User", updatedBy: "_User", StatusId: "AffiliateStatuses", AccountId: "Accounts", OwnerId: "_User" },
  columns: [
    { field: "Name",          label: "שם",      type: "String", aggrField: "Name" },
    { field: "StatusId.Name", label: "סטטוס",   type: "String", aggrField: "StatusId.AffiliateStatuses.Name" },
    { field: "TotalEarnings", label: "עמלות",   type: "Number", aggrField: "TotalEarnings", summary: "sum" },
    { field: "createdAt",     label: "תאריך",   type: "Date",   aggrField: "createdAt", dateFormat: "date" }
  ],
  filterAndSort: { sortBy: "createdAt", sortOrder: "descending", sortLimit: 50, criteria: [] },
  tablePermissions: { allowCreate: false, allowEdit: true, allowDelete: false },
  editView: { openFrom: "inline" },
  summaryOptions: { showSum: true, sumTitle: "סה\"כ" }
)
```

Always include `createdBy: "_User", updatedBy: "_User"` in `classPointers` — omitting them silently breaks sort by created/updated date (KI-8 from `myb-p-page-tables`).

### 7. Restore the date-filter form (workaround)

`Create-Table-View-Page` overwrote the `FromDate` input in `<form name="genericform">` with a String input named `Name`, and removed `ToDate` entirely. There's no MCP tool to edit inputs in non-main forms (gap documented in references/tooling-gaps.md). Workaround: inject JS via `Edit-Page-CSS-JS` that fixes the form on page load.

```
Edit-Page-CSS-JS(
  pageId,
  jsCode: `$(function(){
    var $form = $('form[name="genericform"]');
    if (!$form.length) return;
    var $cols = $form.find('.sDivider');
    var $col1 = $cols.eq(1), $nameInput = $col1.find('input[name="Name"]');
    if ($nameInput.length) {
      $col1.find('label').attr('for','P207').text('מתאריך');
      $nameInput.replaceWith('<input type="date" class="form-control" name="FromDate" id="P207">');
    }
    var $col2 = $cols.eq(2);
    if (!$col2.find('input[name="ToDate"]').length) {
      $col2.html('<div class="simblaEL form-group"><label for="P210">עד תאריך</label><input type="date" class="form-control" name="ToDate" id="P210" day-end="true"></div>');
    }
  });
  $('#SideModal .modal-header').contents().last()[0].textContent = 'עריכה';`
)
```

### 8. Add to the Dashboard Menu

```
Get-Menus()                                           // find "Dashboard Menu" — origin 5a2ceaae377ac4001aeb002d
Set-Menu-Items(menuId: "<dashMenuId>", items: [{
  type: "page",
  page: "<newPageId>",
  title: "<Hebrew>",
  icon: "fa-handshake-o",          // bare name — system prepends "fa "
  order: <next>,
  visibility: []                    // empty matches existing items
}])
```

**Icon caveat (verified):** if you pass `icon: "fa fa-truck"`, the system adds another `fa ` and you get `fa fa fa-truck` — broken icon. Pass only `fa-truck`.

**Visibility:** existing items use `[]`. Setting `["loggedIn"]` may filter the item out depending on context. Match what's already there.

## Putting it together

Sequence per dashboard, in order:

1. `Get-Site-Pages` → pick source dashboard ID
2. `Get-Schema(targetTable)` → confirm fields and pointer relationships
3. `Get-Data(targetTable, limit: 5)` → sanity-check data exists
4. `Create-Table-View-Page` → clone
5. `Set-Page-Settings(title)` → fix SEO title
6. `Get-Page-Content(minimal: false)` → enumerate `elemId`s
7. `Add-Edit-Counter-Element(elemId)` × N — counters
8. `Add-Edit-Chart-Element(elemId)` × M — charts
9. `Add-Edit-Text-Element(elemId)` × K — titles + captions
10. `Edit-Table-View(tableId)` — embedded table
11. `Edit-Page-CSS-JS(jsCode)` — restore date form, hide artifacts
12. `Get-Menus` + `Set-Menu-Items` — menu integration
13. Tell the user to hard-refresh (Ctrl+F5) — `dashboardSales.js` may be cached

## Extending an existing dashboard with a new section

When the user wants to **add** a new section (more counters / charts / a table) below an existing dashboard, the workflow is different from clone+repoint. Here you're not modifying inherited slots — you're creating fresh ones in fresh rows.

> 💡 **Fastest path — duplicate an existing card (`Duplicate-Element`, shipped 2026-06-24).** If the new element resembles one already on the page (a KPI counter card, a chart card), don't hand-build the container + nested rows below. `Duplicate-Element(pageId, elemId)` deep-clones the whole card (container ▸ rows ▸ icon + caption + counter) in one call, with new ids and all styling intact. Then `Get-Page-Content(minimal:false)` for the new ids and repoint the copy — `Add-Edit-Counter-Element(elemId, criteria:[])` / `Add-Edit-Chart-Element(elemId, …)` + `Add-Edit-Text-Element(elemId)` for the caption. This sidesteps the manual container/nested-row build entirely (and the B5 `toExistingColumn` bug) — it's exactly how three DashboardLeads counter cards were replicated on 2026-06-24. Keep the manual build below as the fallback for when no similar card exists yet. Full spec: `../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md`; gap impact in [references/tooling-gaps.md](references/tooling-gaps.md).

### Where to insert

Find the last "real" content row before the modal HTML (the page typically ends with an `htmlEditor` div containing `#SideModal` markup — don't insert after that). On a DashboardSales-cloned page that's `P4`. On other dashboards, run `Get-Page-Content(pageId, minimal: false)` and find the last `<div class="row simblaEL rDivider">` before any `htmlEditor` tail.

### Place each card inside a real Container (structural — no CSS)

Do **not** add charts/counters straight into the column (`rowId` + `columnNumber`): that leaves the element bare, with no `containerHolder`/`container` wrapper, so it has **no "Container" element in the Simbla page-builder** and looks/edits unlike the cloned cards.

Instead, create a real container per card, then drop the title + chart into it:
1. `Edit-Page(add-row newRowAfterRow=<lastRow>, columnSize=[6,6])` → note `newRowId`.
2. `Add-Container-to-Page(pageId, toExistingRow="<newRowId>", toExistingColumn=N)` → returns `{ newContainerId, innerContainerId }`.
3. `Add-Edit-Text-Element(pageId, intoExistingElemId="<innerContainerId>", elemType="P", html=<title>)`, then `Add-Edit-Chart-Element(pageId, intoExistingElemId="<innerContainerId>", …)` — title first, then chart.

This yields the native `Row → Column → containerHolder → container → [title, chart]` structure. (Verified 2026-06-20 on DashboardSales.) `rowId` + `columnNumber` is fine only for elements that aren't cards (e.g. a section-header `H2`).

> **Build the layout with real Simbla elements (containers + rows) — not page CSS.** Set any visual styling (card border, etc.) in the Simbla page-builder. Don't reach for `Edit-Page-CSS-JS` to fake cards or add gaps.

### Building a counter card (KPI) — two native layouts

A native KPI card is **not** a bare counter — it's a container with the number, an icon, and a caption laid out in row(s). Two layouts recur in the stock dashboards. **Both build the same way** — only the row split (and icon style) differ.

**Shared mechanics (both layouts):**
- `Add-Container-to-Page(pageId, toExistingRow=<row>, toExistingColumn=N)` → `{ innerContainerId }`.
- **Nest a row inside the container:** `Edit-Page(add-row, intoExistingElemId="<innerContainerId>", columnSize=[…])`. `intoExistingElemId` on `add-row` is the *only* way to put a row inside a container (`newRowAfterRow`/`toExistingColumn` won't target one).
- **Counter:** `Add-Edit-Counter-Element(rowId, columnNumber, …, css:"color:…;font-size:…;font-weight:…;")` — the `css=` param sets the number's inline style (element-inline, **not** page CSS).
- **Icon:** no icon MCP tool — use a text element with a FontAwesome `<i>` (`Add-Edit-Text-Element(rowId, columnNumber, elemType:"P", html:"…<i class=\"fa fa-…\" style=\"…\"></i>…")`).
- **Caption:** a text element (`Add-Edit-Text-Element`, grey `#b5b5b5`).
- **Border:** the container is *borderless*; the card border (`data-border-type="All"`) is a page-builder toggle — no MCP param, don't fake it with page CSS.

**Layout A — vertical** (DashboardSales / DashboardGenManager; number ~30px, plain icon). Two rows:
```
container
  ├─ Row [3,3,3,3]   empty | counter(col1) | icon(col2) | empty
  └─ Row [12]        caption (grey, centered)
```
Steps: add the `[3,3,3,3]` row → counter→col1 + icon→col2 → `add-row(newRowAfterRow=counterRow, columnSize=[12])` → caption→col0. Verified 2026-06-20 on DashboardGenManager.

**Layout B — horizontal** (DashboardLeads; number ~36px, icon = colored **circle badge**). One row:
```
container
  └─ Row [3,5,4]   icon-circle(col0) | caption(col1, 2-line right-aligned) | counter(col2)
```
Steps: add the `[3,5,4]` row → icon→col0, caption→col1, counter→col2 (all in the one row). The icon is a circle badge — `<i class="fa fa-user-plus" style="color:#fff;width:60px;height:60px;line-height:60px;text-align:center;display:inline-block;border-radius:50%;background-color:#51adf8;font-size:30px;">`; the caption is two grey `<p>` lines (`text-align:right`). Counter `css` uses `font-size:36px`. Verified 2026-06-20 on DashboardLeads.

### Order matters when batching `add-row`

`Edit-Page` with multiple `add-row` actions all having the same `newRowAfterRow` value inserts them in **reverse order** (each new one goes between the anchor and the previous insertion). So to get final order [Header → Card row 1 → Card row 2] after `P4`, batch them as:

```
Edit-Page(pageId, actions: [
  { actionType: "add-row", newRowAfterRow: "P4", columnSize: [6, 6] },     // Card row 2  (last)
  { actionType: "add-row", newRowAfterRow: "P4", columnSize: [6, 6] },     // Card row 1
  { actionType: "add-row", newRowAfterRow: "P4", columnSize: [12] }        // Header      (first)
])
```

The response gives `info[]` with each `newRowId` in the same order as your actions. Map them back: `info[0]` = Card row 2, `info[2]` = Header row. Then create a container in each card-row column and fill it; drop an empty spacer container between rows.

Alternative: chain by passing the previous insertion's id as the next anchor — sequential and obvious, but requires a separate call per row to read back the ID. For a single new card, one `add-row` + one `Add-Container-to-Page` — no batching needed.

### Standard new-section template (structural — containers + spacer, no CSS)

One container per card; an empty container for the gap between rows.

```
Header row [12]
└── Add-Edit-Text-Element(rowId, columnNumber: 0, elemType: "H2", html: "<h2 ...>מדדים נוספים</h2>")   // header needs no container

Card row [6,6]   (or [4,4,4] for three KPIs)
├── col 0:  Add-Container-to-Page(toExistingRow=<row>, toExistingColumn=0)  → innerContainerId₀
│           Add-Edit-Text-Element(intoExistingElemId=innerContainerId₀, elemType:"P", html: card title)
│           Add-Edit-Chart-Element(intoExistingElemId=innerContainerId₀, ...)        // title first, then chart
└── col 1:  Add-Container-to-Page(toExistingRow=<row>, toExistingColumn=1)  → innerContainerId₁
            Add-Edit-Text-Element(intoExistingElemId=innerContainerId₁, ...)
            Add-Edit-Chart-Element(intoExistingElemId=innerContainerId₁, ...)

Spacer (gap before the next row)
└── Add-Container-to-Page(afterElement=<row>)    // empty container = the native vertical gap (no CSS margins)
```

For a **counter (KPI)** card the inner structure differs — see **Building a counter card (KPI)** above (two native layouts: **vertical** `[3,3,3,3]`+caption row, or **horizontal** `[3,5,4]` icon-circle | caption | number).

### Spacing between charts — use an empty container (not CSS margins)

The native dashboards put the **vertical gap between chart rows into an empty spacer container**, not CSS. On a DashboardSales clone these are the empty containers `P159`, `P210`, `P116` — `<div class="container">` with no content (a little top/bottom padding) — sitting between the form/counter/chart rows. Reproduce them structurally:

- `Add-Container-to-Page(pageId, afterElement="<chartRowId>")` inserts an empty container right after a row → that's the gap before the next row.

The gap is the spacer container's padding (the native ones carry ~22px top). Keep everything structural — real containers for cards, empty containers for gaps — and adjust a spacer's padding in the Simbla page-builder if you need more/less room. **Never add card borders/backgrounds or row margins via `Edit-Page-CSS-JS`.**

### Color codes that match the existing dashboard

- Primary: `#013479` (deep blue) — neutral KPIs
- Success: `#28a745` (green) — counts, "active" KPIs
- Accent: `#d13f75` (magenta) — totals/balances
- Warning: `#ffc107` (yellow) — averages/ratings
- Subtle border: `#f0f0f0`
- Title divider line: `#b5b5b5`
- Caption text gray: `#b5b5b5`
- Chart-title text: `#333333`
- Background: `white` (cards) on `#f8f8f8`-ish (page)

### Why not just use the `css=` param on the counter?

You can — `Add-Edit-Counter-Element(css="...")` injects styling into the counter's inline `<h1>` style. But it only styles the H1, not the whole card. Put the counter inside a real container (`Add-Container-to-Page`) for the card structure; the `css=` param only touches the inner H1.

### Caption text style

```html
<p style="text-align:center;margin-top:-10px;"><font style="font-size:12px;" color="#b5b5b5">סך עמלות ששולמו (₪)</font></p>
```

`margin-top:-10px` pulls the caption closer to the counter.

### Chart title text style

```html
<p style="padding:5px 10px 5px 0;border-bottom:1px solid #b5b5b5;margin-top:20px;"><font color="#333333">כותרת הגרף</font></p>
```

This matches the title bar pattern of the cloned chart cards (small dark text with bottom border separator).

### Chart colors that have null bucket

When `chartLabel` points at a Boolean field (`Active`) or a String field with many null values (e.g. `CommissionType`), records with null show up as a "null" / "Unknown" segment in Pie/Doughnut. To exclude:

```
criteria: [
  { F: "Active", C: "exists", T: "Boolean" }
]
```

Or if `exists` isn't supported in your chart context, filter to known values via `containedIn`.

## Common pitfalls (from real attempts)

- **Using `Create-Form-Page` for a dashboard.** It assigns `NewMaster` (`69bfd6c945604bc0d356752b`), the master used for entity-edit modal popups — no nav chrome. The page appears "standalone". Always use `Create-Table-View-Page(copyFromPageId)` for dashboards.
- **Believing `Get-Page-Content(minimal: true)`.** It hides `simbla-counter`/`simbla-chart`/`simbla-table` from the YAML — empty containers look truly empty. Use `minimal: false` when discovering elements to repoint.
- **Adding instead of replacing.** Calling `Add-Edit-Counter-Element(rowId, columnNumber)` on a slot that already has an inherited counter creates a SECOND counter in the same slot. Use `elemId` to update.
- **Forgetting `criteria: []`.** Inherited Sales/Cases criteria stay and break the new query.
- **Not restoring the date form.** Charts that reference `genericform:FromDate` silently fall back to no-filter; the user clicks 'הפעל' and nothing changes.
- **Wrong icon format in menu.** `"fa fa-truck"` becomes `"fa fa fa-truck"` — broken.
- **Adding a chart/counter straight into a column (no container).** When *extending* a dashboard, `Add-Edit-*-Element(rowId, columnNumber)` drops the element bare into the `sDivider` — no `containerHolder`/`container`, so the Simbla page-builder shows **no "Container"** for it. Always `Add-Container-to-Page` first, then add into its `innerContainerId`.
- **Spacing rows with CSS margins.** Use an **empty spacer container** between chart rows (the native `P159`/`P210` pattern, via `Add-Container-to-Page(afterElement=…)`), not `Edit-Page-CSS-JS` margins.
- **Root-level rows render outside the page frame.** Adding a section as a row *after* the main content row (a sibling at the page root) can fall **outside** the dashboard's content frame ("floating below the page"). To place something **below the table**, add the row **inside the table's column**: `Edit-Page(add-row, toExistingRow=<mainRow>, toExistingColumn=<tableColIndex>)`. Confirm with div-depth — the new row should sit at the **same nesting depth as the table**, not at root.
- **Bare counter = crooked card.** A counter dropped straight into a container (no inner rows) renders left-aligned with no icon — unlike the native KPI cards. Use the two-row structure in **Building a counter card (KPI)**.

## Reference files

- [references/dashboardsales-element-map.md](references/dashboardsales-element-map.md) — slot-by-slot map of a fresh DashboardSales clone with the IDs to target
- [references/tooling-gaps.md](references/tooling-gaps.md) — what's missing from MCP today and how to recognize when it's filled (this is when this skill should be rewritten)
- [references/element-attributes.md](references/element-attributes.md) — `data-*` attributes for `simbla-counter` / `simbla-chart` and how the tool params map to them
