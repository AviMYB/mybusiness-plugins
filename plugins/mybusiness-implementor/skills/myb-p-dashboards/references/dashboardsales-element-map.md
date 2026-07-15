# DashboardSales Element Map

When you clone `apps/mybusiness/DashboardSales` (`69bfd6ca45604bc0d3567557`) via `Create-Table-View-Page(copyFromPageId)`, the new page contains the IDs below. Use these as the `elemId` / `tableId` you pass back to the `Add-Edit-*-Element` and `Edit-Table-View` tools to **update in place**.

> Verify with `Get-Page-Content(pageId, minimal: false)` after cloning — IDs are stable across clones because they're copied verbatim, but a hand-edit by a customer might shift them.

## Header row (P161)

| Slot | Tag | ID | Original content | What to do |
|---|---|---|---|---|
| col-md-2 idx 0 | `<i>` icon | P165 | `fa fa-bar-chart` | Optionally swap icon class via JS |
| col-md-2 idx 0 | H2 textContainer | P3 | "דאשבורד" | `Set-Page-Settings(title)` rewrites this via `Create-Table-View-Page` `title` param at clone time |
| col-md-8 idx 1 | `<form name="genericform">` | P199 | FromDate / ToDate inputs | Inputs replaced by `searchFields` at clone — restore via JS in step 7 |
| col-md-2 idx 2 | "ערוך" button | P219 | edit-mode toggle | Leave alone |

## Main row P4 — col-md-7 LEFT (HTML index 0)

### CounterForm (P92) — date filter for KPI counters

3-column row P107 with date inputs in cols 0/1 and a 'סנן' button in col 2 (P110). Inputs strip on clone — leave; the genericform restore in step 7 is what matters.

### KPI Counters row P5 — two col-md-6 cards

| Card | Container | Counter row | Counter slot col 1 | Caption row | Original counter id | Original counter intent |
|---|---|---|---|---|---|---|
| Left | P59 | P41 | (col-md-3 idx 1) | P60 | **P33** | sum `Total` where ClosingDate in range AND SaleStatusId=הושלמה |
| Right | P57 | P40 | (col-md-3 idx 1) | P56 | **P37** | sum-count where same criteria |

Caption text elements (small grey text under counter):

| Slot | Caption text element ID | Original text |
|---|---|---|
| Under left counter (P60 col 0) | **P62** | "הכנסות מפרויקטים בתאריכים הנבחרים" |
| Under right counter (P56 col 0) | **P55** | "פרויקטים שנסגרו בתאריכים הנבחרים" |

### GraphForm1 (P133) — date filter for charts row P6

3-col row P144 with date inputs and 'סנן' button in P145.

### Chart row P6 — two col-md-6 chart cards

| Card | Container | Chart id | Title text id | Original chart |
|---|---|---|---|---|
| Left | P69 | **P52** | **P71** "פרויקטים לפי משתמש" | Bar `OwnerId._User.name` × `Total` sum, theme=icecream |
| Right | P67 | **P45** | **P65** "פרויקטים שנפתחו לפי חודש" | Line `createdAt` mm/yy × sum-count, theme=daydream |

### Chart row P8 — two col-md-6 chart cards

| Card | Container | Chart id | Title text id | Original chart |
|---|---|---|---|---|
| Left | P68 | **P51** | **P70** "פרויקטים לפי שלב פרויקט" | Pie `SaleStatusId.SaleStatuses.Name` × `Total` sum, theme=icecream |
| Right | P66 | **P211** | **P64** "פניות פתוחות לפי עדיפות" | Pie `Cases.PriorityId.CasePriorities.Name` sum-count — note this one queries the Cases table, not Sales |

## Main row P4 — col-md-5 RIGHT (HTML index 1)

### MapForm (P117) — date filter for the right column

3-col row P128 with date inputs and 'סנן' button in P129.

### Right-column content P10

A single col-md-12 with three stacked containers:

| Container | Element id | Title text id | Original content |
|---|---|---|---|
| P114 | Chart **P42** | **P130** "הכנסות מפרויקטים לפי חודש" | Line `ClosingDate` mm/yy × `Total` sum where SaleStatusId=הושלמה, theme=blooming |
| P131 | (spacer) | — | empty containerHolder |
| P212 | Table **P217** | **P214** "משימות בתאריכים נבחרים" | `simbla-table` of Tasks, sorted by Date, with criteria StatusId=פתוחה |

## At-a-glance ID list (most-used)

```
Counters:      P33, P37
Charts:        P52, P45, P51, P211, P42
Title texts:   P71, P65, P70, P64, P130, P214
Captions:      P62, P55
Table:         P217
Form (broken): P199 (genericform with FromDate/ToDate)
```

## What to also know

- The original Sales counters/charts have `data-criteria` referencing `SaleStatusId` (objectId `zrP1MSVBoq` = הושלמה, `xgQM6SyubN` = נכשלה). When repointing, **always pass `criteria: []`** to wipe these — otherwise the criterion-against-non-existent-field silently zeroes your query.
- The chart in P211 has `data-simbla-class="Cases"` (not Sales). When repointing, the `tableName` parameter on `Add-Edit-Chart-Element` overrides this correctly.
- Themes you can pick from on charts: `icecream, rainyday, bluesky, grasshopper, partytime, simbla, romantic, heatwave, blooming, sunnysummer, underthesea, coldmountain, oldtown, daydream`.
