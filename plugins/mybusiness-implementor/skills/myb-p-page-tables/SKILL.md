---
name: myb-p-page-tables
description: "Build, edit, and embed table-view UI elements (data-table, dynamic-data-table, simbla-table) on MyBusiness CRM pages. Invoke whenever a user wants to touch ANY table on a page — add/remove/reorder columns, change filters/sort/paging, switch edit mode (inline/modal/sidebar), Excel export, multi-row edit, summary/totals row, conditional formatting (row/cell colors), embed a related-records widget on a card page, or build a new list page like Cases/Accounts. Strong triggers: data-table, simbla-table, list page, table view, רשימה, טבלה דינמית, להוסיף עמודה לטבלה, סינון בטבלה, שורת סיכום, צביעת שורות, עיצוב מותנה, conditional formatting, inline edit, multi-row edit, related table on card, Edit-Table-View, Create-Table-View-Page, Add-Table-View-to-Form-Page, Get-Optional-Fields. Even 'change the column order' or 'תוסיף לי שדה לטבלת לקוחות' is this skill — a page element, not schema. NOT for database schema work (DB tables/fields, CLP permissions) — other skills own those."
---

# UI Tables in MyBusiness CRM Pages

A "page table" is the `<div class="simbla-table">` element that renders database records on a page. It owns columns, search criteria, sorting, paging, edit mode, conditional formatting, summaries, multi-row edit and Excel export.

Two flavors share the same MCP tooling:

| Flavor | Where it lives | Created by | Typical use |
|---|---|---|---|
| `dynamic-data-table` | Standalone list pages (`apps/mybusiness/Accounts`, `apps/mybusiness/Cases`…) | `Create-Table-View-Page` | Searchable list with paging and "New" button |
| Embedded `data-table` | A row inside a form/card page (e.g., Sales table on the Account card) | `Add-Table-View-to-Form-Page` | Show child records of the open record |

`Edit-Table-View` operates on both — point it at a `tableId` and it doesn't care which flavor.

## Pick the right tool

```
Need a brand-new list page (with search form + table)
  → Create-Table-View-Page
    THEN Edit-Table-View to clean up Cases-inherited residue
    THEN Set-Page-Settings to fix the inherited "Cases" SEO title

Need to change columns/filters/sort/edit mode/formatting on an existing table
  → Edit-Table-View

Need to embed a related-records widget on a card page
  → Add-Table-View-to-Form-Page
    THEN Edit-Table-View to set aggrField on every column (the embed tool leaves them as "undefined")

Need to discover what fields are available for a given class
  → Get-Optional-Fields  (returns canonical {field, aggrField, type, text} for direct + pointer-expanded fields)
```

## Shortcut: clone a configured table, then repoint it

`Duplicate-Element(pageId, elemId)` deep-clones any `simblaEL` element — including a `simbla-table` — in place, with a brand-new id and every column / filter / conditional-formatting / edit-mode setting preserved. When you've already built a richly-configured table and want a similar one, this beats rebuilding from a Cases clone:

```
1. Duplicate-Element(pageId, elemId=<existing simbla-table id>)   → copy inserted next to the original, new id
2. Get-Page-Content(pageId, minimal=true)                         → read the copy's new id
3. Edit-Table-View(pageId, tableId=<copy id>, tableClassName=…, columns=…, classPointers=…)  → repoint at the new class
```

The copy inherits the source's `optionalFields`, `editView`, conditional formatting and summary — you only change what differs (class + columns). Re-pass `classPointers` in step 3 as always (KI-8), and reload the page after. Full spec: `../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md`.

## The core mental model

`Edit-Table-View` is a **whole-state writer** for these fields:

- `columns`
- `optionalFields`
- `classPointers`
- `criteria` (under `filterAndSort`)
- `conditionalFormattingRules`

Each call replaces the entire array/object. Anything you don't include is removed. This matters because forgetting `createdBy: "_User"` and `updatedBy: "_User"` in `classPointers` silently breaks "sort by created/updated" — the platform stops resolving those pointers.

`Edit-Table-View` does **not** touch:

- The `<form class="dbFormQuery">` search form (its `data-simbla-class`, the input fields themselves) — use `Edit-Page` or page JS
- Inline `jsCode` / `cssCode` — use `Edit-Page-CSS-JS`
- Modal HTML inside the page (`#SideModal` "פנייה חדשה" header etc.) — use `Edit-Page`
- The page's SEO title — use `Set-Page-Settings`

When something looks broken, that split is the first thing to check: is the issue on the table element (Edit-Table-View) or on the surrounding page (Edit-Page / Edit-Page-CSS-JS / Set-Page-Settings)?

## Workflows

### A. Build a new list page

```
1. Get-Site-Pages                                       → find a clean source pageId (Cases: 69bfd6c945604bc0d3567504)
2. Get-Optional-Fields(className)                       → see the fields available for the target class
3. Create-Table-View-Page(tableName, pageName, copyFromPageId, title, ...)  → returns newPageId
4. Edit-Table-View(pageId, tableId="P113", tableClassName, classPointers, columns, optionalFields, editView, filterAndSort, ...)  → replace inherited junk
5. Set-Page-Settings(pageId, title, jsFile, ...)        → fix SEO title; attach external JS if you uploaded one
```

Step 4 is non-optional. The new page is a deep copy of Cases, so it inherits Cases-specific `optional-fields` (including CaseTypeId, PriorityId, etc.), Cases-specific `editView` settings, and a Cases-shaped `class-pointers` map. Without an explicit Edit-Table-View call, the customer sees the wrong "add column" picker and broken sort.

What Edit-Table-View can't fix on the new page (handle separately):

- The search form still has `data-simbla-class="Cases"` → use `Edit-Page` or page JS if the customer relies on saved queries
- Inline `jsCode` has Cases-specific Hebrew term overrides → clear with `Edit-Page-CSS-JS(pageId, jsCode: "")`
- The "New" modal header HTML still says "פנייה חדשה" → override via page JS or `Edit-Page`

### B. Reconfigure an existing list page

```
1. Get-Page-Content(pageId, minimal=true)         → find the simbla-table id (usually "P113" on copied pages)
2. Get-Optional-Fields(className)                 → if you're adding a column, copy {aggrField, type, text} from here
3. Edit-Table-View(pageId, tableId, ...)          → pass the FULL desired state of every wholesale-replaced field
```

Always re-pass `classPointers` with at least `{createdBy: "_User", updatedBy: "_User"}` plus your own pointers. That single omission is the most common cause of "the table looks fine but sort by created date stopped working".

### C. Embed a related-records widget on a card page

The child class must have a Pointer field whose `targetClass` is the card's class. (Verify with `Get-Schema(className)` — look for a Pointer field pointing to the form's class.) When the widget is correctly placed at form level, the platform auto-filters it to only show child records linked to the open record — no `criteria` needed for the parent relationship. Placement is what determines whether this works (see KI-9 below).

```
1. Get-Schema(className: "ChildTable")            → confirm pointer relationship
2. Get-Page-Content(pageId)                       → pick a SAFE insertAfterRow (see "Picking a safe insertAfterRow" below)
3. Add-Table-View-to-Form-Page(pageId, tableName, insertAfterRow, fields=[{aggrField, ...}, ...], ...)
4. Verify placement: re-fetch and walk up the new widget's ancestors. None of them may be `simbla-nav` (a tab container) or another `simbla-table`. If any are, you got bitten by KI-9 — delete the new row via `Edit-Page(delete-row)` and retry with a different `insertAfterRow`.
5. Edit-Table-View(pageId, tableId=<new id>, columns=[...], classPointers, ...) → finalize sort, conditional formatting, edit mode, etc.
```

Pass `aggrField` on every column in step 3. The schema accepts it (despite some older docs saying otherwise). Without it, columns render `data-aggr-field="undefined"` and sort/aggregate breaks. The recipe in `references/operators-and-recipes.md` shows the full pattern.

Avoid `"` in the `showSummary` argument in step 3 — there's a quote-escaping bug. Pass a quote-free placeholder (`"Total"`, `"סהכ"`) and set the real label in step 5 via `Edit-Table-View(summaryOptions: {showSum: true, sumTitle: "סה\"כ"})` (which escapes correctly).

#### Picking a safe `insertAfterRow`

`Add-Table-View-to-Form-Page` decides the wrapping based on what's *immediately after* the target row in the rendered HTML. If the next sibling is a "complex" element (a tab container, another widget), the tool nests your new widget INSIDE that complex sibling instead of placing it as a true sibling at form level. This is the single most painful gotcha when working with card pages that have tabs.

Safe targets:
- The very FIRST row in the form (e.g., the page title row). Whatever comes after it is normal form content.
- Any row whose immediate next sibling in the form's containerHolder is also a plain field/section row.

Unsafe targets:
- The LAST form-level row before a tab container (`simbla-nav`). This is the one that bites you on Account-style cards with tabs — the new widget ends up inside one of the tab panels, hidden, and the auto-filter to the parent record stops working.
- Any row that's already inside another widget. (`Get-Page-Content` will misleadingly show such rows as if they're at form level when you skim, but their parent `<div>` is a `simbla-table`.)

Concrete: the demo Account card has tabs. Targeting the last form field row (`P3` — the comment textarea) puts the widget inside a tab pane and breaks it. Targeting the first row (`P127` — "פרטי הלקוח" header) puts it at form level and the auto-filter works. The cosmetic position is awkward (top of the form), but the widget is functional. Move it down later via the Simbla page-builder UI if cosmetics matter — DO NOT try `Edit-Page move-existing-object` on a row containing a `simbla-table`; it can wipe the widget (KI-10).

### D. Inspect / debug

When a table behaves wrong, classify the symptom first — it determines where to look:

| Symptom | First place to check |
|---|---|
| Embedded widget shows 0 records (and you know children exist for the open parent) | Widget placement (KI-9). Walk up the widget's ancestors via `Get-Page-Content`; reject if any is `simbla-nav` or `simbla-table`. |
| Embedded widget shows ALL records instead of just the parent's children | Same — placement issue. The auto-filter only fires when the widget is a true form-level sibling. |
| Sort/filter broken on a specific pointer column | `classPointers` likely missing that pointer. Re-call `Edit-Table-View` with the full map including `createdBy`/`updatedBy` plus all your own. |
| Sort works on the surface but returns wrong-order rows | `aggrField` on the column doesn't match the schema's class name (e.g., `aggrField: "AccountId.Name"` should be `"AccountId.Accounts.Name"`). Copy the correct value from `Get-Optional-Fields`. |
| Wrong fields appear in the column-picker | Inherited `optionalFields` from `Create-Table-View-Page` source. Override via `Edit-Table-View(optionalFields: [...])`. |
| Search form shows the wrong placeholder fields / saved queries from another class | `data-simbla-class` on the form is still the source class. Fix via `Edit-Page` (the form is HTML, not a table-view attribute). |

For attribute-level inspection, get the page content, find the `<div class="simbla-table">`, and cross-check its `data-*` attributes against [references/data-table-attributes.md](references/data-table-attributes.md).

## Discovering the `tableId` on a page

Pages from `Create-Table-View-Page` always carry the table id `P113` (inherited from the Cases template). For pages where you don't know the id:

- Run `Get-Page-Content(pageId, minimal=true)` (smaller output)
- In the YAML structure, look for a node with `class: simblaEL simbla-table dynamic-table` (list page) or `class: simblaEL simbla-table` with `data-simbla-class="X"` (embedded). Its `id:` is the `tableId`
- For embedded widgets you just inserted, the `Pxxx` is auto-assigned — re-fetch the page to find it

## `aggrField` is not optional

`field` controls the displayed path. `aggrField` controls what the aggregation pipeline behind sort/filter/sum actually queries. They're identical for direct fields, but for pointers `aggrField` interpolates the target class:

| `field` | `aggrField` |
|---|---|
| `Name` | `Name` |
| `AccountId.Name` | `AccountId.Accounts.Name` |
| `StatusId.Color` | `StatusId.AffiliateStatuses.Color` |
| `OwnerId.name` | `OwnerId._User.name` |
| `createdBy.name` | `createdBy._User.name` |

Don't build `aggrField` from intuition — copy the exact value from `Get-Optional-Fields(className)`. The class name in the middle has to match what the schema actually uses (e.g., `_User` for users, exact lookup-table name for status/type pointers).

## Known issues — what to expect and work around

These are platform behaviors, not Claude bugs. The first time each one bites is always a surprise; after that they're predictable.

| # | Issue | Workaround |
|---|---|---|
| KI-1 | If you forget to pass `aggrField` per column, `Add-Table-View-to-Form-Page` renders `data-aggr-field="undefined"` and sort/aggregate breaks | The schema DOES accept `aggrField` — pass it on every column. Copy the value from `Get-Optional-Fields(className)` |
| KI-2 | `Add-Table-View-to-Form-Page` mangles `showSummary` containing `"` (e.g., `סה"כ` becomes a broken attribute) | Pass a quote-free placeholder; set the real `sumTitle` afterwards via `Edit-Table-View(summaryOptions: {...})` |
| KI-3 | `Add-Table-View-to-Form-Page` targets the FIRST row matching `insertAfterRow`. Row IDs aren't unique across tabs | Verify with `Get-Page-Content` first to make sure the first match is the one you want |
| KI-4 | `Create-Table-View-Page` carries over the source class's `optionalFields` (e.g., a Suppliers list shows CaseTypeId in the picker) | Override via `Edit-Table-View(optionalFields: [...])` |
| KI-5 | `Create-Table-View-Page` leaves the search form bound to the source class (`data-simbla-class="Cases"`) | Most features still work; if saved queries break, fix via `Edit-Page` |
| KI-6 | Inherited `jsCode` runs Cases-specific Hebrew term overrides | Clear or replace with `Edit-Page-CSS-JS(pageId, jsCode: "...")` |
| KI-7 | The "New" modal header still says "פנייה חדשה" | Override via page JS (`$('#SideModal .modal-header')...`) or edit the page HTML |
| KI-8 | `Edit-Table-View` wholesale-replaces `classPointers`. Forgetting `createdBy`/`updatedBy` silently breaks sort/filter on those fields | Always include `{createdBy: "_User", updatedBy: "_User", ...}` in every call |
| KI-9 | `Add-Table-View-to-Form-Page` may nest the new widget INSIDE a tab container or another widget when the row immediately after `insertAfterRow` is one. The widget then doesn't auto-filter to the parent record (shows 0 records on a card with existing children). | Pick an `insertAfterRow` whose next sibling is a plain form field/section row, not a `simbla-nav` tab container or another `simbla-table`. After insertion, walk up the new widget's ancestors via `Get-Page-Content` to verify none are `simbla-nav` or `simbla-table`. The cause is *placement*, not a missing attribute — `data-query="hard-code"` is NOT required (SupplierOrders on the Supplier card filters correctly without it). |
| KI-10 | `Edit-Page move-existing-object` on a row containing a `simbla-table` widget destroys the widget entirely (the row gets removed but the new placement isn't created). | Don't move table-widget rows. If you need to relocate a widget, delete and re-add via `Add-Table-View-to-Form-Page` with a different `insertAfterRow`. |
| KI-11 | **Header-click sorting silently missing on tool-built tables.** The platform's native column sort (a table-level `click[th]` handler bound at init) only engages when the `<th>` contains an `<i class="fa fa-sort"></i>` icon — the pattern on platform-built pages like Accounts. `Edit-Table-View` writes `<th>`s WITHOUT the icon, so every table it (re)builds loses header sorting and nobody notices until a user clicks. Runtime levers don't help: `data-sort-by`/`data('sortBy')` are closure-captured at init — changing them + `trigger('refresh')` does NOT re-sort. (Discovered on the Integrations module page, 28.7.2026.) | Append the icon to every sortable header once per load, e.g. in a `data-loaded` hook: `$t.find('thead th[data-field]').not('[data-field="action"]').each(function(){ if(!$(this).find('[class*="fa-sort"]').length) $(this).append('<i class="fa fa-sort"></i>'); })` — the core then handles clicks, re-querying, and the fa-sort-asc/desc toggle natively. |

## Reference files

- [references/data-table-attributes.md](references/data-table-attributes.md) — every `data-*` attribute on a `simbla-table` element mapped to its `Edit-Table-View` parameter, with allowed values and the column/`<th>` attribute map. Read this when you're debugging a misbehaving table or trying to construct an exact attribute.
- [references/operators-and-recipes.md](references/operators-and-recipes.md) — enum reference (criteria operators, summary functions, date formats, edit modes, conditional-formatting actions, `inlineOptions` shapes) plus copy-paste recipes for common patterns (status color pill, default filter, multi-row edit, money column, embedded related table). Read this when you need a value for a parameter and aren't sure what's allowed, or when you want a working example of a common pattern.
