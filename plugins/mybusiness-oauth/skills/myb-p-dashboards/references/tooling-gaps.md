# MCP Tooling Gaps for MyBusiness Dashboards

**Last revised:** 2026-06-24 (`Duplicate-Element` shipped — element-level clone-then-edit; see the Scenario A note + the B5/X4 workarounds below). Prior: 2026-06-20 (B1 closed — `Add-Container-to-Page` shipped; cards + empty spacer containers built structurally), 2026-04-29 (built Affiliates+Suppliers via clone, then extended Affiliates).

This doc is organized by **scenario** — what you're trying to do — because the gaps that bite you depend on which workflow you're in. Each gap is named, includes a quick "symptom that confirms it's still open" check, and a workaround.

This is a curated summary of a fuller gaps analysis kept with the maintainers.

## Scenarios at a glance

| Scenario | What it means | Severity today |
|---|---|---|
| **A. Clone & repoint** | Take an existing dashboard (e.g., DashboardSales), repoint its charts/counters/table to a different table | 🟡 Workable — most painful: see Clone gaps below |
| **B. Edit / extend** | Add a new section to an existing dashboard, remove an element, change layout | 🟡 Workable — card wrapping + row spacing now done with real/empty containers (B1 closed); element-level deletion still missing |
| **C. From scratch** | Build a dashboard with no source page to clone | 🔴 Effectively blocked — too much manual HTML/CSS reconstruction needed |

The further you move from "clone what exists" toward "build something new", the more gaps stack up.

---

## Scenario A — Clone & repoint an existing dashboard

**Workflow:** `Create-Table-View-Page(copyFromPageId)` → `Get-Page-Content(minimal=false)` to discover element IDs → `Add-Edit-*-Element(elemId=…)` to repoint each chart/counter/text/table.

**New (2026-06-24) — element-level clone with `Duplicate-Element`:** to add ONE more element like an existing one (e.g. a 4th KPI counter card next to three), call `Duplicate-Element(pageId, elemId)` instead of rebuilding it. It deep-clones that single element (and all its children) in place, with brand-new ids and every binding/style preserved; then `Get-Page-Content(minimal=false)` for the new ids and repoint the copy with `Add-Edit-*-Element(elemId=…, criteria:[…])`. The whole-page clone above is still how you stand up a NEW dashboard from a template; `Duplicate-Element` is for replicating elements WITHIN a page. Live-verified 2026-06-24 (cloned three DashboardLeads counter cards, then repointed each).

**Gaps that bite:**

### A1 — Clone is a deep copy, not a shell
`Create-Table-View-Page(copyFromPageId)` copies every chart/counter/table from the source verbatim, with `data-simbla-class` still pointing at the source class (Sales/Cases). You can't get just the grid structure.

→ *Symptom:* after clone, `Get-Page-Content(minimal=false)` shows full `simbla-counter`/`simbla-chart` elements with the source's `data-criteria`.
→ *Workaround:* iterate every inherited element and update via `elemId`. Always pass `criteria: []` to wipe the source criteria.
→ *Wish:* a `cleanContent: true` flag on `Create-Table-View-Page`, or a separate `Clone-Page-Shell` tool.

### A2 — `searchFields` injection overrides `genericform`
`Create-Table-View-Page` requires non-empty `searchFields`, and the first entry's input replaces the `FromDate` input in the dashboard's `<form name="genericform">`. The `ToDate` is removed entirely. Date filtering is broken until restored.

→ *Symptom:* the cloned page's `<form name="genericform">` has `<input name="Name" type="string">` instead of `<input name="FromDate" type="date">`.
→ *Workaround:* JS injection via `Edit-Page-CSS-JS` that rewrites the inputs at page load.
→ *Wish:* a `preserveSourceForms: true` flag, or fixing the override behavior.

### A3 — `minimal=true` hides chart/counter/table elements
`Get-Page-Content(minimal=true)` returns YAML that strips `simbla-counter`/`simbla-chart`/`simbla-table` from inside containers. The clone looks "empty" until you read full HTML.

→ *Symptom:* counter elements don't appear under their `containerHolder` in the YAML.
→ *Workaround:* always use `minimal=false` for discovery on a cloned dashboard.
→ *Wish:* a discovery mode that lists `{id, type, dataSimbleClass, dataChartType?}` for each interactive element without the giant style payload.

---

## Scenario B — Edit / extend an existing dashboard

**Workflow:** Add new rows after the last main row → `Add-Edit-*-Element(rowId, columnNumber)` to fill them. Or: delete a chart/counter, change layout, swap an embedded table.

**Gaps that bite:**

### B1 — ~~No `containerHolder`/`container` creation tool~~ ✅ CLOSED (2026-06-20)
Existing dashboards wrap each chart/counter in `<div class="containerHolder"><div class="container">` (the "card") and put the vertical gap between rows into **empty** containers (`P159`, `P210`, …). `Add-Edit-*-Element` still doesn't create a wrapper on its own, **but `Add-Container-to-Page` does** — so this gap is closed.

→ *Resolution (card):* `Add-Container-to-Page(pageId, toExistingRow, toExistingColumn)` creates a real `containerHolder`/`container` and returns `{ newContainerId, innerContainerId }`; add the title + chart with `Add-Edit-*-Element(intoExistingElemId="<innerContainerId>")`. Native `Row → Column → containerHolder → container → [title, chart]`.
→ *Resolution (spacing):* `Add-Container-to-Page(pageId, afterElement="<rowId>")` drops an **empty** container between rows — the native spacer pattern. Use it for gaps instead of CSS margins.
→ *Resolution (nested rows for KPI cards):* `Edit-Page(add-row, intoExistingElemId="<innerContainerId>")` nests a row **inside** a container — the only way to build the native counter-card structure (container ▸ row[empty,counter,icon,empty] ▸ row[caption]). `newRowAfterRow`/`toExistingColumn` cannot target a container. Verified 2026-06-20 on DashboardGenManager.
→ *Styling:* the tool doesn't set border/background; set those in the Simbla page-builder (keep injected page CSS out of the layout).
→ *Verified:* 2026-06-20, container card built on DashboardSales.

### B2 — No `Delete-Element`
Only `Edit-Page` `delete-row` exists. Can't remove an individual chart/counter/text element without taking down its whole row.

→ *Symptom:* `Edit-Page actionType` enum has no `delete-element`.
→ *Workaround:* hide via CSS (`#elemId { display: none !important; }`). Element still exists in the DB and shows in the page-builder.
→ *Wish:* `Delete-Element(pageId, elemId)`.

### B3 — No way to create or edit a "Database Search form" (`dbFormQuery`) widget
This is the widget called **"Database Search form"** in the Simbla page-builder UI. In HTML it renders as `<form class="dbFormQuery">`. Dashboards use it for `genericform` (top-level date filter), `CounterForm`, `GraphForm1`, `MapForm`. It's the bridge that links date/select inputs to counter/chart criteria via `data-criteria` references like `"V":"genericform:FromDate"`.

There is **no MCP tool to add a Database Search form widget** to a page, and no tool to add/remove/edit `<input>` or `<select>` elements inside an existing one. `Edit-Page add-new-field` only writes to the page's main `dbForm`, not to a named sub-form.

→ *Symptom:* No tool returned by ToolSearch for "search form" / "dbFormQuery" / "Database Search form" / "add form widget" that creates a `<form class="dbFormQuery">`. `Edit-Page actionType` enum has no `add-form` or `add-form-input` value.
→ *Workaround:* clone a page that already has a working `dbFormQuery` and reuse it; for individual input changes inside one, JS injection via `Edit-Page-CSS-JS`.
→ *Wish:* `Add-Database-Search-Form(pageId, rowId, columnNumber, name, formClass?)` to create the widget, plus `Edit-Form-Inputs(pageId, formName, inputs[])` to manage its fields. Together these would unblock B3, A2, and C2.

### B4 — Same as A3 (minimal=true)
When editing, you need to know what's already there. Same workaround applies.

### B5 — `Edit-Page add-row toExistingColumn` is broken when adding to multiple columns of the same outer row
The cloned dashboard cards have **nested rows**: each col-md-N has a row [3,3,3,3] for counter+icon + a row [12] for caption inside. To replicate this via MCP, you'd call `add-row toExistingRow=<outer> toExistingColumn=N` repeatedly for N=0,1,2.

This works **only for col 0 of the first outer row touched**. As soon as you switch to col 1 or call again on a different outer row's col 0, the new nested row goes into the WRONG place — typically nested deep inside the most-recently-created nested row, instead of into the requested column of the requested outer row. Sequential single-action calls don't fix it; it's not a batching issue.

→ *Symptom:* After `add-row toExistingRow=Pouter toExistingColumn=1`, the new row's id is not a child of `Pouter`'s col 1. It's nested inside `Pouter > col0 > <last_added_nested_row> > col0`. Verify by reading the page and tracing the row's parents.
→ *Workaround (current):* Don't nest rows. For each card, create one container in the target column with `Add-Container-to-Page(toExistingRow, toExistingColumn)` (B1, now shipped) and put the title + chart/counter inside it via `intoExistingElemId`. Native structure, no nested-row gymnastics.
→ *Simplest (2026-06-24):* if a finished card already exists, `Duplicate-Element(pageId, <containerHolderId>)` clones the ENTIRE card — container ▸ nested rows ▸ icon + caption + counter — in one call, with new ids; then re-fetch and repoint the copy's counter/text by id. No container-building and no nested-row calls at all — this sidesteps the bug rather than working around it.
→ *Wish:* Fix `toExistingColumn` to honor the explicit column index when looking up the target row (the container route sidesteps it, but the bug still exists for genuine nested rows).

---

## Scenario C — Create a dashboard from scratch

**Workflow today:** Effectively impossible without scaffolding from a clone. You'd need to manually construct the grid + forms + each card wrapping + each chart.

**Gaps that bite (in addition to all of B):**

### C1 — No way to create a blank page with a chosen master
`Create-Form-Page` always assigns NewMaster (modal popup master, no nav chrome). `Create-Table-View-Page` uses the source page's master, but requires `copyFromPageId` so you can't really "create blank".

→ *Symptom:* `Set-Page-Settings` schema does not accept `masterPageId`. `Create-Form-Page` produces a page with `masterPageId = NewMaster` only.
→ *Workaround:* always start from `Create-Table-View-Page(copyFromPageId=DashboardSales)`. You can't truly start from scratch — you start from a clone and accept the deep-copy.
→ *Wish:* `Create-Page(masterPageId, name, title)` with no forced content.

### C2 — Can't construct a `genericform` (Database Search form) from scratch
This is the same root gap as B3, just hits harder in the from-scratch scenario. The dashboard date-filter is a `<form name="genericform" class="dbFormQuery">` — a "Database Search form" widget. Without a tool to create one, the only way to get a working dashboard date filter is to clone a page that already has one.

→ *Symptom:* same as B3.
→ *Workaround:* always clone — Scenario C falls back to Scenario A.
→ *Wish:* same wishlist as B3 (`Add-Database-Search-Form` + `Edit-Form-Inputs`).

### C3 — No `Set-Page-Settings(masterPageId)`
If you start from `Create-Form-Page` (NewMaster) you can't migrate the page to CRMmaster afterward.

→ *Workaround:* don't go down this path. Always clone.
→ *Wish:* `Set-Page-Settings` accepts `masterPageId`.

---

## Cross-cutting gaps (apply to multiple scenarios)

### X1 — No `Delete-Page`
Can't remove pages that should not exist. Pile up as `_old_*` / `_v2_*`.
→ *Workaround:* rename via `Set-Page-Settings(name=…)`.

### X2 — `Set-Menu-Items` icon double-prefix bug
Passing `icon: "fa fa-truck"` stores `fa fa fa-truck`. Real bug, not gap.
→ *Workaround:* always pass bare icon name (no `fa ` prefix) — system prepends.

### X3 — Discovery for menu items is partial
Existing menu items have `visibility:[]` and no `page` field. New items work with explicit `page` and `visibility:[]`, but the resolution model is undocumented.
→ *Workaround:* match the shape of working items.

### X4 — No icon-element tool
There's no MCP tool to add the `iconElm` element the native KPI cards use for their FontAwesome icon.
→ *Symptom:* `Add-Edit-*-Element` has no icon variant; ToolSearch returns nothing for "icon element".
→ *Workaround:* add a **text element** holding the `<i>`: `Add-Edit-Text-Element(elemType="P", html="<p style=\"text-align:center;\"><i class=\"fa fa-users\" style=\"color:rgb(1,52,121);font-size:26px;\"></i></p>")`. Renders identically; lacks the native `data-border="circle"` badge option.
→ *Wish:* `Add-Icon-Element(pageId, rowId/intoExistingElemId, icon, color, border?)`.
→ *Better (2026-06-24):* if a KPI card with the icon already exists, `Duplicate-Element` the whole card (`containerHolder`) — its native `iconElm` (with the `data-border="circle"` badge) comes along for free — then edit only the copy's counter/caption.

---

## Wishlist of new tools, prioritized

A single wishlist item can unblock multiple scenarios. Here's the order I'd add tools:

| Priority | Tool | Unblocks |
|---|---|---|
| ~~1~~ ✅ | **`Add-Container-to-Page`** shipped — fill via `intoExistingElemId`; `afterElement` makes empty spacer containers | B1 closed; makes C reachable |
| 2 | **`Delete-Element(pageId, elemId)`** | B2, recovery from mistakes in A and B |
| 3 | **`Add-Database-Search-Form(pageId, rowId, columnNumber, name)`** + **`Edit-Form-Inputs(pageId, formName, inputs[])`** (the "Database Search form" widget — `<form class="dbFormQuery">`) | B3, C2, A2 |
| 4 | **`Clone-Page-Shell(sourcePageId, name)`** or `cleanContent` flag on `Create-Table-View-Page` | A1, simplifies B and C |
| 5 | **`Get-Page-Content(includeInteractiveElements=true)`** in minimal mode, or a dedicated `List-Page-Elements(pageId)` | A3, B4 |
| 6 | `masterPageId` on `Set-Page-Settings`, `Create-Page(masterPageId)`, `Delete-Page` | C1, C3, X1 |

Items 1+3 together would make Scenario C feasible. Item 1 alone makes Scenario B's "extend" use case look right visually.

---

## Re-verification log

To know when a gap has been closed, re-run its symptom check after MCP tooling changes. As of 2026-04-29:

- A1 (deep copy): open
- A2 (genericform override): open
- A3 (minimal hides elements): open
- B1 (no container creation): ✅ CLOSED 2026-06-20 — `Add-Container-to-Page` (`toExistingRow`+`toExistingColumn` for cards, `afterElement` for empty spacers; returns `innerContainerId`). Verified on DashboardSales.
- Element clone: ✅ NEW 2026-06-24 — `Duplicate-Element(pageId, elemId)` deep-clones any `simblaEL` element in place with fresh ids; repoint the copy via `Add-Edit-*-Element(elemId)`. Sidesteps B5 (no nested-row calls) and the X4 icon workaround. NB: this is the CLONE half only — B2 (`Delete-Element`) is still open; Duplicate shipped, Delete has not.
- B2 (no delete-element): open
- B3 (no edit-form-inputs): open
- B5 (toExistingColumn broken on multi-col nested rows): NEW — discovered during nested-row experiment 2026-04-30. Open.
- C1 (no blank+master): open
- C2 (no form creation): open
- C3 (no set masterPageId): open
- X1 (no delete-page): open
- X2 (icon double-prefix): open (workaround stable)
- X3 (menu discovery): partially closed (visibility:[] verified working)

When a symptom no longer reproduces, mark the gap closed here, remove the corresponding workaround from `SKILL.md`, and update the skill's STATUS line if all gaps in a scenario are closed.
