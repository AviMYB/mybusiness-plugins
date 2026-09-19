# `simbla-table` Attribute Reference

Every `data-*` attribute on the `<div class="simbla-table">` (or `simbla-table dynamic-table`) element, with the `Edit-Table-View` parameter that controls it. Reverse-engineered from real Cases / Accounts / Affiliates pages plus my own tests on `apps/mybusiness/PlaygroundTables`.

## Top-level table attributes

| `data-*` attribute | Type | `Edit-Table-View` param | Notes |
|---|---|---|---|
| `data-simbla-class` | string | `tableClassName` | DB class name |
| `data-query` | string | `filterAndSort.queryType` (legacy) | Usually `"form"` |
| `data-query-form` | string | `filterAndSort.queryForm` | Name of the search form (`<form name="...">`). On list pages it's `dynamic-table-form{tableId}`. |
| `data-grid-size` | enum | `filterAndSort.queryGridSize` | `"12"`/`"6"`/`"4"`/`"3"`/`"2"` (this is **bootstrap col span per criterion**, NOT count of columns) |
| `data-criteria` | JSON array | `filterAndSort.criteria` | Default filter applied even before user submits the search form. Each item: `{F, C, T, V, FText?, P?, condOr?}` |
| `data-sort-by` | string | `filterAndSort.sortBy` | Field name (or `FieldName.PointerClass.SubField` for pointer sort) |
| `data-sort-order` | enum | `filterAndSort.sortOrder` | `"ascending"` or `"descending"` |
| `data-sort-limit` | number | `filterAndSort.sortLimit` | Page size for the table |
| `data-wait-for-sub` | bool | `filterAndSort.waitForFirstSubmit` | If true, table is empty until user clicks "Search" |
| `data-allow-edit` | bool | `tablePermissions.allowEdit` | Show edit pencil per row |
| `data-allow-create` | bool | `tablePermissions.allowCreate` | Show "Add new row" button |
| `data-allow-delete` | bool | `tablePermissions.allowDelete` | Show trashcan per row |
| `data-edit-view` | enum | `editView.openFrom` | `modal` / `modal-left` / `modal-right` / `newwindow` / `row` / `hidetable` / `inline` |
| `data-edit-view-page` | string | `editView.page` | Form-page name for `newwindow` and modal+iframe modes |
| `data-edit-iframe` | bool | `editView.useIframe` | Whether the modal modes embed an iframe of `editView.page` |
| `data-popup-width` | number | `editView.popupWidthPercent` | 0–100 |
| `data-popup-height` | number | `editView.popupHeightPercent` | 0–100 |
| `data-show-sum` | bool | `summaryOptions.showSum` | Show summary row at the bottom |
| `data-sum-text` | string | `summaryOptions.sumTitle` | Label for the summary row (escape `"` carefully) |
| `data-allow-csv` | bool | `advancedOptions.allowExportToExcel` | Show "Export to Excel" link |
| `data-export-to-csv-roles` | JSON array | `advancedOptions.exportToExcelRoles` | If set, only listed roles see the export button |
| `data-show-loader` | bool | `advancedOptions.showLoaderAnimation` | Spinner while rows load |
| `data-url-2-link` | bool | `advancedOptions.showUrlAsLink` | Auto-render http(s):// values as `<a>` |
| `data-no-results-image` | string (URL) | `advancedOptions.noResultsImageUrl` | Empty-state image |
| `data-enable-multi-rows-edit` | bool | `advancedOptions.enableMultiRowsEdit` | Bulk-edit checkboxes |
| `data-enable-multi-rows-roles` | JSON array | `advancedOptions.enableMultiRowsRoles` | If non-empty, multi-row edit is gated to listed roles |
| `data-class-pointers` | JSON object | `classPointers` | Maps each pointer field on this table to its target class. **MUST include `createdBy: "_User"` and `updatedBy: "_User"` plus all your own pointers.** |
| `data-conditions-format-rules` | JSON array | `conditionalFormattingRules` | See [conditional formatting schema](#conditional-formatting-rule-schema) |
| `data-optional-fields` | JSON array | `optionalFields` | Fields offered in the column-picker (per-column items use `field`, `text`, `type`, `aggrField`, optional `dateFormat`, `summary`, `inlineOptions`, `subclassPointers`) |

## Column attributes (one `<th>` per column)

| `data-*` attribute on `<th>` | `Edit-Table-View.columns[]` field | Notes |
|---|---|---|
| `data-field` | `field` | Display path. For pointers use `Field.SubField` (e.g., `AccountId.Name`) — single dot only |
| `data-aggr-field` | `aggrField` | Aggregation path. For pointers inserts the className: `AccountId.Accounts.Name`. Use `Get-Optional-Fields` to get the right value. **Required for sorting/aggregation to work.** |
| `data-type` | `type` | One of `String`, `Number`, `Boolean`, `Date`, `PrivateFile`, `File`, `HTML/XML`, `Pointer`, `Array`, `AutoIncrement` |
| `data-summary` | `summary` | `""`, `sum`, `avg`, `min`, `max`, `count` |
| `data-date-format` | `dateFormat` | `datetime`, `date`, `time`, `year`, `q/yy`, `mm/yy`, `month`, `quarter` |
| `data-inline-options` | `inlineOptions` (object) | Controls inline editor: `{type, info, placeholder, required, readonly, parentSelect}` |
| `data-subclass-pointers` | `subclassPointers` (array) | For inline pointer editing. List of `{field, targetClass}` for the row's other pointer fields |
| `<th><span>` text | `label` | Column header text |

The "actions" column (`<th data-field="action">`) is auto-managed by the platform — don't set it explicitly.

## Conditional-formatting rule schema

```json
{
  "name": "rule label (shown in the editor only)",
  "conditions": [
    { "field": "FieldName", "fieldType": "Boolean|String|Number|Date|Pointer|Array",
      "equesition": "equalTo|notEqualTo|greaterThan|lessThan|greaterThanOrEqualTo|lessThanOrEqualTo|containedIn|notContainedIn|empty",
      "value": true,
      "visibleVal": "label for pointer values" }
  ],
  "actions": [
    { "action": "row-color|cell-color|row-text-color|cell-text-color|row-font-weight|hide-row",
      "field": "TargetFieldName when action is cell-*",
      "value": "#hex or 'bold' etc." }
  ]
}
```

Multiple `conditions` on a rule are **AND**'d. Multiple `actions` all apply when the conditions match. Multiple rules are evaluated in order; later rules override earlier ones for the same property.

## Search form criteria item schema (`filterAndSort.criteria[]`)

```json
{
  "F": "FieldName",                    // field
  "FText": "label shown in saved-queries UI",
  "C": "equalTo|contains|...",         // operator (see SKILL.md for full list)
  "T": "String|Number|Boolean|Date|Pointer",
  "V": <default value>,
  "P": {                                // for pointer values only
    "targetClass": "Accounts",
    "multiple": false,
    "visibleVal": "Acme Corp"
  },
  "condOr": false                       // true = OR with previous criterion, false (default) = AND
}
```

## `optionalFields[]` item schema

```json
{
  "field": "Description",                       // path used in column UI
  "aggrField": "Description",                   // aggregation path (with className for pointers)
  "type": "String",
  "text": "תיאור",                               // user-visible label
  "dateFormat": "date",                         // optional, only for Date type
  "summary": "sum",                             // optional
  "inlineOptions": { ... },                     // optional, for inline editing widgets
  "subclassPointers": [ ... ]                    // optional, for pointer fields
}
```

Easiest source: copy items from `Get-Optional-Fields(className)` and trim to the ones you want exposed in the column-picker.

## `inlineOptions` recipes

```json
// Plain text input with email validation
{"type": "text", "info": "email", "placeholder": "", "required": false, "readonly": false}

// Read-only text
{"type": "text", "readonly": true}

// Autocomplete pointer (parentSelect filters by another pointer)
{"type": "autocomplete", "required": false, "readonly": false, "parentSelect": "Accounts"}

// Dependent select (e.g., SubType depends on Type)
{"type": "select", "required": false, "readonly": false, "parentSelect": "CaseTypes"}
```

## Embedded vs list-page tables — what differs

Embedded `data-table` (inserted by `Add-Table-View-to-Form-Page`) is structurally identical to a list-page `dynamic-data-table`, with these defaults:

- No `data-query-form` (no search form)
- `data-edit-view` defaults to `inline`
- `data-criteria="[]"` — but the platform auto-filters to records whose pointer field points at the current form's record (relies on the schema relationship — confirm with `Get-Schema`)
- The wrapping `<div class="row simblaEL rDivider">` makes it a full-width row in the form

To convert an embedded widget into a fancier table (sortable, filterable, with summary), call `Edit-Table-View` on its `tableId` and pass:

- proper `aggrField` per column (KI-1)
- `summaryOptions` if you want a totals row
- `conditionalFormattingRules` for color coding
- `filterAndSort.criteria` if you want a default filter on top of the auto-pointer filter

## How to find `tableId` for a given page

1. `Get-Page-Content(pageId, minimal: true)` (smaller output)
2. Search for `class: simblaEL simbla-table dynamic-table` (list page) or `class: simblaEL simbla-table` with `data-simbla-class="X"` (embedded)
3. The `id:` on that node is the `tableId`

For pages created by `Create-Table-View-Page`, the table id is always `"P113"` (inherited from the Cases template). For embedded tables added via `Add-Table-View-to-Form-Page`, the platform auto-assigns a fresh `Pxxx` id — find it in `Get-Page-Content` after the call.

## Cross-tool interactions

| Action | Right tool |
|---|---|
| Change which DB table a list points at | `Edit-Table-View(tableClassName: "...")` — but also need `Edit-Page` for the search form |
| Add a column | `Edit-Table-View(columns: [<full list including new one>])` |
| Remove all default filters | `Edit-Table-View(filterAndSort: {sortBy: ..., sortOrder: ..., criteria: []})` |
| Change SEO title or attach a JS file | `Set-Page-Settings` (NOT a table-view tool) |
| Add a new search criterion (input box) | `Edit-Page` — the search form is HTML, not part of `Edit-Table-View`'s scope |
| Bulk-update existing records | `Update-Data` / `Create-Many` — separate from UI |
