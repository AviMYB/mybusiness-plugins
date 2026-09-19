# Counter & Chart Element Attributes

What the `Add-Edit-Counter-Element` and `Add-Edit-Chart-Element` MCP tool params translate into on the rendered page. Useful for diagnosing a misbehaving dashboard element by reading the HTML directly.

## simbla-counter

Rendered as `<div class="simblaEL simbla-counter">` with these `data-*` attributes:

| Tool param | HTML attribute | Allowed values | Notes |
|---|---|---|---|
| `tableName` | `data-simbla-class` | any DB class | Required when adding new |
| `counterFunction` | `data-counter-function` | `sum-count`, `sum`, `avg`, `min`, `max` | `sum-count` ignores `counterField` |
| `counterField` | `data-counter-field` | numeric field name | Required for sum/avg/min/max |
| `format` | `data-format` | numeral.js format string | e.g. `0,0`, `0,0.00`, `0%` |
| `criteria` | `data-criteria` | JSON array | Each entry `{F, C, V, T, P?, FText?}` |
| `queryForm` | `data-query` + `data-query-form` | form name | Links the counter to a form on the page; date inputs in the form become live filters |
| `css` | `style` on the inner `<h1>` | CSS string | Use for color, font-size, padding |

Render-time: the platform reads these attributes, runs the equivalent Parse query, and writes the formatted number into the `<h1>` child.

### Criteria entry shape

```json
{
  "F": "ClosingDate",
  "C": "greaterThan",
  "V": "genericform:FromDate",
  "T": "Date"
}
```

For pointer fields:
```json
{
  "F": "StatusId",
  "C": "equalTo",
  "V": "0tUCvSNBSV",
  "T": "Pointer",
  "P": { "targetClass": "AffiliateStatuses", "visibleVal": "פעיל", "multiple": false }
}
```

For form-linked values, `V` uses `<formName>:<fieldName>`. The platform reads the input value at query time. If the field doesn't exist on the form, the criterion silently no-ops.

Operators (`C`): `contains, startsWith, equalTo, greaterThan, lessThan, greaterThanOrEqualTo, lessThanOrEqualTo, notEqualTo, containedIn, notContainedIn`.

## simbla-chart

Rendered as `<div class="simblaEL simbla-chart"><canvas></canvas></div>` with these `data-*` attributes:

| Tool param | HTML attribute | Allowed values | Notes |
|---|---|---|---|
| `tableName` | `data-simbla-class` | any DB class | |
| `chartType` | `data-chart-type` | `Bar, Line, Pie, Doughnut` | |
| `chartTheme` | `data-chart-theme` | see themes below | Affects default colors |
| `chartLabel` | `data-chart-label` | field name (or pointer with dot notation) | x-axis category. For pointers use `.<TargetClass>.<field>` |
| `chartLabelFormat` | `data-chart-label-format` | `dow, q, q/yy, mm, mm/yy, yy, dd/mm/yy, mm/dd/yy` | Required when label is a Date |
| `chartLabelSort` | `data-chart-label-sort` | `ascending, descending` | |
| `chartCategory` | `data-chart-category` | field name (pointer dot notation OK) | Bar/Line only — adds a series dimension |
| `chartCategoryFormat` | `data-chart-category-format` | same as labelFormat | |
| `chartValue` | `data-chart-value` | numeric field | Skip for `sum-count` |
| `chartFunc` | `data-chart-func` | `sum-count, sum, avg, min, max` | |
| `chartDataset` | `data-chart-dataset` | Chart.js dataset JSON | Override colors/style |
| `chartOptions` | `data-chart-options` | Chart.js options JSON | Axes, legend, etc. |
| `criteria` | `data-criteria` | same shape as counter | |

### Themes

`icecream, rainyday, bluesky, grasshopper, partytime, simbla, romantic, heatwave, blooming, sunnysummer, underthesea, coldmountain, oldtown, daydream`.

### Pointer dot notation for `chartLabel`

`AccountId._User.name` → for User pointers
`StatusId.AffiliateStatuses.Name` → for Status pointer to AffiliateStatuses
`OwnerId._User.name`

The middle segment is the **target class name** the schema expects, not what you'd guess from the field name. For users it's always `_User`. For status/type pointers, it's the lookup-table name (e.g., `AffiliateStatuses`, `SaleStatuses`, `CaseStatuses`).

## simbla-table

Configured via the `Edit-Table-View` tool — see `myb-p-page-tables` skill for full reference. The relevant params for an embedded dashboard table:

| Tool param | HTML attribute |
|---|---|
| `tableClassName` | `data-simbla-class` |
| `classPointers` | `data-class-pointers` (JSON map) |
| `columns[]` | `<thead><th data-field="X" data-aggr-field="Y" data-type="Z">...` |
| `filterAndSort.criteria` | `data-criteria` |
| `filterAndSort.sortBy/Order/Limit` | `data-sort-by`, `data-sort-order`, `data-sort-limit` |
| `tablePermissions.allowEdit/Create/Delete` | `data-allow-edit`, `data-allow-create`, `data-allow-delete` |
| `editView.openFrom` | `data-edit-view` (`inline` for in-row editing) |
| `summaryOptions.showSum`+`sumTitle` | `data-show-sum`, `data-sum-text` |

### Critical: `classPointers`

Always include `createdBy: "_User"` and `updatedBy: "_User"` plus all your own pointer fields. Forgetting them silently breaks sort/filter on those columns.

```js
classPointers: {
  createdBy: "_User",
  updatedBy: "_User",
  StatusId: "AffiliateStatuses",
  OwnerId: "_User",
  AccountId: "Accounts"
}
```

## Counter / chart criteria patterns

### "All time, no filter"

```js
criteria: []
```

### "Last 30 days from form"

```js
criteria: [
  { F: "createdAt", C: "greaterThan", V: "genericform:FromDate", T: "Date" },
  { F: "createdAt", C: "lessThan",    V: "genericform:ToDate",   T: "Date" }
]
```

### "Active records only"

```js
criteria: [
  { F: "Active", C: "equalTo", V: true, T: "Boolean", FText: "פעילים" }
]
```

### "Status equals X"

```js
criteria: [
  { F: "StatusId", C: "equalTo", V: "0tUCvSNBSV", T: "Pointer",
    P: { targetClass: "AffiliateStatuses", visibleVal: "פעיל", multiple: false } }
]
```

`visibleVal` is descriptive only; the actual filter uses `V` (the objectId).

## Reading the page to debug

```
Get-Page-Content(pageId, minimal: false)
```

Search the HTML for the element id (e.g., `data-drag="P52"` or `id="P52"`). The full attribute set is right there. Common debug patterns:

| Symptom | Likely cause | Fix |
|---|---|---|
| Counter shows blank or "C" | `data-criteria` references a form field that doesn't exist | Pass `criteria: []` and verify form name + field name |
| Counter shows 0 when data exists | `data-counter-field` is wrong, or criteria is too restrictive | Read the field name from `Get-Schema` |
| Chart shows axes but no bars/points | Same — criteria mismatch, or `data-chart-value` field missing on records | Check raw data via `Get-Data(table, limit: 10)` |
| Bar chart shows one giant bar | `chartLabel` is a free-text field (different value per record); switch to a category field |
| Pie shows "Unknown" segment | Many records have null in the `chartLabel` field; expected unless you add criteria to exclude nulls |
| Two charts stacked in same column | Old (cloned) chart + new chart added as siblings; use `elemId` to update in place |
