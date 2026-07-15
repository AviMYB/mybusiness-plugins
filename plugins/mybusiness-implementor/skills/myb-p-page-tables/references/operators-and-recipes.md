# Operators, Enums, and Recipes

Lookup reference for parameter values plus copy-paste examples. Pair this with `data-table-attributes.md` (the structural map).

## Table of contents

- [Edit modes (`editView.openFrom`)](#edit-modes)
- [Search criteria operators](#search-criteria-operators)
- [Conditional-formatting actions](#conditional-formatting-actions)
- [Aggregate `summary` values](#aggregate-summary-values)
- [Date column formats](#date-column-formats)
- [Field types](#field-types)
- [`inlineOptions` shapes](#inlineoptions-shapes)
- [Recipes](#recipes)

## Edit modes

`editView.openFrom` controls how the row's edit form opens. Pick based on the customer's existing setup:

| Value | Behavior | Best for |
|---|---|---|
| `inline` | Click pencil → row turns into editable inputs in place. No separate page needed. | Simple entities. **Default choice** when there's no working form/card page — avoids the NewMaster issue from `Create-Form-Page`. |
| `modal` | Centered popup. Loads `editView.page` via iframe if `useIframe: true`. | Rich card pages with tabs (Account-style cards). |
| `modal-left` | Left sidebar slide-in. Iframe-based. | Same as `modal` but as a sidebar — what `apps/mybusiness/Cases` uses. |
| `modal-right` | Right sidebar slide-in. Iframe-based. | Sidebar style, mirror of `modal-left`. |
| `newwindow` | Navigates to `editView.page` in a new window. | Long edit flows that need their own URL. |
| `row` | Edit form unfolds **under** the row inline. | Rare — used when you want all rows visible plus an inline form. |
| `hidetable` | Hides the table and shows the edit form in its place. | Wizard-style flows. |

When `useIframe: true` and `editView.page` doesn't exist (or is broken), the popup gets stuck on the loading spinner. If the page was created by `Create-Form-Page`, it uses `NewMaster` and won't load correctly via iframe — switch to `inline` or fix the form page first.

## Search criteria operators

Used in two places:
- `data-criteria` attribute on a search form input (controls how a user-typed value is interpreted)
- `filterAndSort.criteria[].C` on `Edit-Table-View` (controls a default filter applied even before the user submits the search form)

Operators:

| Operator | Meaning |
|---|---|
| `contains` | substring match (default for free-text inputs) |
| `startsWith` | prefix match |
| `endsWith` | suffix match |
| `equalTo` | exact match |
| `notEqualTo` | not equal |
| `greaterThan` | `>` |
| `lessThan` | `<` |
| `greaterThanOrEqualTo` | `>=` |
| `lessThanOrEqualTo` | `<=` |
| `containedIn` | value is in an array (multi-select) |
| `notContainedIn` | value is NOT in an array |
| `exists` | field has any value |
| `doesNotExist` | field is null/missing |
| `AuthorizedOn` | MyBusiness-specific: only records the current user is authorized for |
| `underMyHierarchy` | MyBusiness-specific: records owned by the current user or their reports |
| `notUnderMyHierarchy` | inverse of `underMyHierarchy` |

The hierarchy operators rely on the role/user hierarchy configured in the customer's system; they don't work in environments where roles aren't structured.

## Conditional-formatting actions

Each rule under `conditionalFormattingRules` has `conditions[]` (AND'd) and `actions[]` (all applied when conditions match):

| `actions[].action` | Effect | `value` | `field`? |
|---|---|---|---|
| `row-color` | Row background color | hex (`"#f8d7da"`) | no |
| `cell-color` | One cell's background color | hex | yes — the column's `data-field` |
| `row-text-color` | Row text color | hex | no |
| `cell-text-color` | One cell's text color | hex | yes |
| `row-font-weight` | Row font weight | `"bold"`, `"normal"`, etc. | no |
| `hide-row` | Removes the row from the rendered table | (no `value`) | no |

`conditions[].equesition` accepts the same operator set as search criteria (`equalTo`, `greaterThan`, `containedIn`, `empty`, etc.). When multiple rules match the same row, later rules override earlier ones for the same property — order matters for cascading.

## Aggregate `summary` values

`columns[].summary` enables a per-column summary cell at the bottom (when `summaryOptions.showSum: true` is set on the table). Allowed values:

`""` (none), `sum`, `avg`, `min`, `max`, `count`.

Only meaningful on `Number` columns. Setting `summary` on a `String`/`Boolean` column produces `data-summary="undefined"` in the rendered HTML (harmless but noisy).

## Date column formats

`columns[].dateFormat` (and `optionalFields[].dateFormat`):

| Value | Renders as | Example |
|---|---|---|
| `datetime` | full date + time | `28/04/2026 13:46` |
| `date` | date only | `28/04/2026` |
| `time` | time only | `13:46` |
| `year` | 4-digit year | `2026` |
| `q/yy` | quarter / 2-digit year | `Q2/26` |
| `mm/yy` | month / 2-digit year | `04/26` |
| `month` | month name | `April` |
| `quarter` | quarter only | `Q2` |

## Field types

`columns[].type` and `optionalFields[].type`:

`String`, `Number`, `Boolean`, `Date`, `PrivateFile`, `File`, `HTML/XML`, `Pointer`, `Array`, `AutoIncrement`.

`AutoIncrement` only renders correctly when the database field is actually configured as auto-increment (set up via the schema, not this skill).

## `inlineOptions` shapes

`columns[].inlineOptions` controls the inline-edit input. Common shapes:

```json
// Plain text with email validation
{"type": "text", "info": "email", "placeholder": "", "required": false, "readonly": false}

// Read-only text (display only, no editing)
{"type": "text", "readonly": true}

// Autocomplete for a Pointer field (with parent-record filtering)
{"type": "autocomplete", "required": false, "readonly": false, "parentSelect": "Accounts"}

// Dependent select — narrows by another pointer (e.g., SubType depends on Type)
{"type": "select", "required": false, "readonly": false, "parentSelect": "CaseTypes"}

// Date picker
{"type": "date", "required": false, "readonly": false}

// Number input
{"type": "number", "required": false, "readonly": false}
```

`parentSelect` chains pointer selects so the user can only pick child records that belong to a parent already chosen on the same row. Pair it with `subclassPointers` on the column so the platform knows which other column drives the parent.

## Recipes

### Status color pill via conditional formatting

Color the StatusId.Name cell based on the status name. Add one rule per status value:

```
Edit-Table-View(
  pageId, tableId,
  conditionalFormattingRules: [
    {
      name: "פעיל ירוק",
      conditions: [{field: "StatusId.Name", fieldType: "String", equesition: "equalTo", value: "פעיל"}],
      actions: [{action: "cell-color", field: "StatusId.Name", value: "#28a745"}]
    },
    {
      name: "מבוטל אדום",
      conditions: [{field: "StatusId.Name", fieldType: "String", equesition: "equalTo", value: "מבוטל"}],
      actions: [{action: "cell-color", field: "StatusId.Name", value: "#dc3545"}]
    }
  ]
)
```

A more scalable approach: add a `Color` field to your status lookup table, populate it with hex values, and have the template's external JS read `data-color` per status row at render time. That keeps the rules out of the page config.

### Default-filter on table load (e.g., Active = true)

Pass `criteria` under `filterAndSort`. The user's search form still works on top:

```
Edit-Table-View(
  pageId, tableId,
  filterAndSort: {
    sortBy: "Name", sortOrder: "ascending", sortLimit: 50,
    queryForm: "dynamic-table-formP113", queryGridSize: "3",
    criteria: [{F: "Active", C: "equalTo", T: "Boolean", V: true}]
  }
)
```

To clear all default filters, pass `criteria: []`.

### Multi-row edit gated to specific roles

```
Edit-Table-View(
  pageId, tableId,
  advancedOptions: {
    enableMultiRowsEdit: true,
    enableMultiRowsRoles: ["Admin", "Manager"]
  }
)
```

Empty `enableMultiRowsRoles` means every authenticated user gets the multi-row edit checkboxes.

### Number column with sum row

```
columns: [
  ...,
  {field: "Total", label: "Total", type: "Number", aggrField: "Total", summary: "sum"}
],
summaryOptions: {showSum: true, sumTitle: "Total"}
```

`sumTitle` can include `"`; the `Edit-Table-View` tool escapes correctly. Avoid `"` in `Add-Table-View-to-Form-Page`'s `showSummary` though (KI-2).

### Hide the "Add new row" green button

`Create-Table-View-Page` leaves a green "Add new row" button visible above the table. To hide it without giving up `allowCreate`:

```
Edit-Page-CSS-JS(
  pageId,
  cssCode: ".db-form-add{display:none !important;}",
  jsCode: ""  // omit if you want to keep existing JS
)
```

`Edit-Page-CSS-JS` replaces both fields wholesale — pass through any existing jsCode you want to preserve.

### Embed a related-records widget on a card page

Three-step pattern. Steps 2 and 3 exist because of KI-9 (placement) and KI-1/KI-2 (defaults from `Add-Table-View-to-Form-Page`):

```
// Step 1: insert. Pick insertAfterRow whose immediate next sibling is a normal field/section row,
//          NOT a tab container or another widget — see "verifying placement" below.
Add-Table-View-to-Form-Page(
  pageId: <card pageId>,
  tableName: "Affiliates",
  insertAfterRow: "P127",                // safe target on the demo Account card
  tableTitle: "שותפים של הלקוח",
  createBtnTitle: "הוסף שותף",
  showSummary: "Total",                  // quote-free placeholder; real label set in step 3
  allowCreate: true,
  allowInlineEdit: true,
  fields: [
    {fieldName: "Name", label: "שם", type: "String", aggrField: "Name"},
    {fieldName: "Email", label: "אימייל", type: "String", aggrField: "Email"},
    {fieldName: "CommissionRate", label: "אחוז עמלה", type: "Number", aggrField: "CommissionRate", summary: "avg"},
    {fieldName: "Balance", label: "יתרה", type: "Number", aggrField: "Balance", summary: "sum"},
    {fieldName: "Active", label: "פעיל", type: "Boolean", aggrField: "Active"}
  ]
)

// Step 2: VERIFY PLACEMENT. Re-fetch the page and walk up the new widget's ancestors.
//          None may be `simbla-nav` (tab container) or another `simbla-table`.
//          If they are, the widget is misplaced — delete the row via `Edit-Page(delete-row)`
//          and retry step 1 with a different `insertAfterRow`.
Get-Page-Content(pageId)
// Find <div class="simbla-table" ... data-simbla-class="Affiliates"> and walk up.
// Acceptable parent chain: row → row → col → simbla-table inside containerHolder.
// Bad: any `tab-pane fade` / `simbla-nav` / `simbla-table` ancestor.

// Step 3: finalize via Edit-Table-View — restore quoted sumTitle, set classPointers, conditional formatting, sort.
Edit-Table-View(
  pageId,
  tableId: <new table div id from step 2>,
  tableClassName: "Affiliates",
  classPointers: {
    createdBy: "_User",
    updatedBy: "_User",
    AccountId: "Accounts",                // matches the form's class — drives the auto-filter
    StatusId: "AffiliateStatuses",
    OwnerId: "_User"
  },
  columns: [
    {field: "Name", label: "שם", type: "String", aggrField: "Name"},
    {field: "Email", label: "אימייל", type: "String", aggrField: "Email"},
    {field: "CommissionRate", label: "אחוז עמלה", type: "Number", aggrField: "CommissionRate", summary: "avg"},
    {field: "Balance", label: "יתרה", type: "Number", aggrField: "Balance", summary: "sum"},
    {field: "StatusId.Name", label: "סטטוס", type: "String", aggrField: "StatusId.AffiliateStatuses.Name"},
    {field: "Active", label: "פעיל", type: "Boolean", aggrField: "Active"}
  ],
  summaryOptions: {showSum: true, sumTitle: "סה\"כ"},
  editView: {openFrom: "inline"}
)
```

**How the auto-filter works:** When a `simbla-table` widget is a true sibling at form level, the platform walks `data-class-pointers` to find the entry whose target class equals the form's `data-simbla-class`. It then auto-filters the widget to records where that pointer field equals the open record's `objectId`. No explicit `criteria` is needed.

The mechanism works on a flat form (Supplier card → SupplierOrders) and on a tabbed form (Account card → Contacts/Sales/etc.) — but ONLY when the widget is placed at form level. A widget that ended up nested inside a tab pane (KI-9) won't auto-filter even though all attributes look identical. That's why "verify placement" is a mandatory step, not a nice-to-have.

Add `criteria` to the call only for ADDITIONAL filters on top of the parent-record filter (e.g., only show `Active = true` affiliates: `criteria: [{F: "Active", C: "equalTo", T: "Boolean", V: true}]`).

### Saved-queries fix on a copied list page (KI-5)

The search form keeps `data-simbla-class="Cases"` after `Create-Table-View-Page`. If the customer relies on the saved-queries dropdown:

```
Edit-Page(pageId, ...)  // edit the form element to set data-simbla-class to the new class
```

Or override at runtime via page JS:

```js
$('form.dbFormQuery').attr('data-simbla-class', 'PlaygroundTables');
```

The latter only fixes the in-memory state for the current view; saved-query records are tied to the original class, so the customer won't see existing saved queries either way.
