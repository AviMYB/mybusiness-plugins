# Edit-Page Tool Reference / מדריך כלי עריכת דף

Complete parameter reference for all MCP tools used in page building.

## Table of Contents
1. [Create-Form-Page](#create-form-page)
2. [Edit-Page Actions](#edit-page-actions)
   - [add-row](#add-row)
   - [edit-row](#edit-row)
   - [delete-row](#delete-row)
   - [add-new-field](#add-new-field)
   - [move-existing-field](#move-existing-field)
   - [move-existing-object](#move-existing-object)
   - [change-existing-field-label](#change-existing-field-label)
   - [set-field-required](#set-field-required)
   - [remove-existing-field](#remove-existing-field)
3. [Add-Edit-Text-Element](#add-edit-text-element)
4. [Add-Table-View-to-Form-Page](#add-table-view-to-form-page)
5. [Edit-Page-CSS-JS](#edit-page-css-js)
6. [Execution Order Rules](#execution-order-rules)

---

## Create-Form-Page

Creates a new empty form page for a database table.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableName` | string | Yes | Database class name (e.g., `"Accounts"`, `"Sales"`, `"Cases"`) |
| `pageName` | string | Yes | Full page path (e.g., `"apps/mybusiness/Account"`) |
| `title` | string | Yes | Page title shown in the header (Hebrew) (e.g., `"כרטיס לקוח"`) |

**Example:**
```json
{
  "tableName": "Accounts",
  "pageName": "apps/mybusiness/Account",
  "title": "כרטיס לקוח"
}
```

**Notes:**
- The new page is **not** empty: it has a title row (a bare `<h2>` holding `title`) and an empty `[6,6]` placeholder row (`ai-placeHolder`). Use the title row as the first section heading (add `TicketHeadline`) and fill or re-grid the placeholder row first.
- The `pageName` convention is `apps/mybusiness/<SingularEntityName>` for form pages.
- After creating the form page, also create a table view page with `Create-Table-View-Page` for the list view.

---

## Edit-Page Actions

All actions are sent as an array in the `actions` parameter of `Edit-Page`. Multiple actions can be sent in one call **only if they don't depend on each other's results**.

**Common parameters for Edit-Page:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | The `_id` of the page (from `Get-Site-Pages` or `Get-Page-Content`) |
| `actions` | array | Yes | Array of action objects |

---

### add-row

Adds a new row to the page grid. Rows are the horizontal containers that hold columns, which in turn hold fields.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"add-row"` |
| `columnSize` | number[] | Yes | Column widths. Must sum to 12. E.g., `[4,4,4]`, `[6,6]`, `[12]` |
| `newRowAfterRow` | string | Conditional | ID of existing row to insert after. Required for positioning. |
| `toExistingRow` | string | Conditional | ID of existing row to nest inside (creates a row within a row's column) |
| `toExistingColumn` | number | Conditional | Column number when nesting with `toExistingRow` |

**Examples:**

Add a 3-column row after row P47:
```json
{ "actionType": "add-row", "columnSize": [4, 4, 4], "newRowAfterRow": "P47" }
```

Add a full-width row (for headers or textareas):
```json
{ "actionType": "add-row", "columnSize": [12], "newRowAfterRow": "P47" }
```

Add a nested row inside an existing row's column:
```json
{ "actionType": "add-row", "columnSize": [6, 6], "toExistingRow": "P47", "toExistingColumn": 0 }
```

**Response:** `{ success, info: [{ actionType: "add-row", newRowId: "P294", columnSize: [4,4,4] }] }` -- read the new row id from `info[].newRowId` (verified; no HTML in the response).

---

### edit-row

Modifies an existing row's column layout.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"edit-row"` |
| `toExistingRow` | string | Yes | ID of the row to edit |
| `columnSize` | number[] | Yes | New column widths |

**Example:** Change row P47 from 2 columns to 3 columns:
```json
{ "actionType": "edit-row", "toExistingRow": "P47", "columnSize": [4, 4, 4] }
```

**Warning (measured):** widening a row (`[6,6]` → `[4,4,4]`) keeps its fields. **Narrowing a row silently drops the fields in the removed columns from the page** — `[4,4,4]` → `[6,6]` with a field in column 2 answers success and the field is gone (still in the schema; re-add it). Move fields out of the columns that will disappear first.

---

### delete-row

Removes a row from the page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"delete-row"` |
| `toExistingRow` | string | Yes | ID of the row to delete |

**Warning:** Only delete rows without fields — deleting a populated row loses the fields. A row that holds only a heading may be deleted: the heading goes with it (measured) — the clean way to drop a stray heading.

---

### add-new-field

Adds a new form field to the page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"add-new-field"` |
| `fieldName` | string | Yes | Database field name (must match schema). Format: `/^[A-Za-z][A-Za-z0-9_]*$/` |
| `label` | string | Yes | Display label (Hebrew) |
| `fieldType` | string | Yes | One of: `"String"`, `"Number"`, `"Boolean"`, `"Date"`, `"Array"`, `"Object"`, `"Pointer"` |
| `targetClass` | string | Conditional | Required when `fieldType` is `"Pointer"`. The class the pointer references. |
| `toExistingRow` | string | Conditional | Row ID to place field in |
| `toExistingColumn` | number | Conditional | Column number (0-based) within the row |
| `newRowAfterRow` | string | Conditional | Creates a new row after this row and places the field there |
| `isRequired` | boolean | No | Mark field as required |
| `defaultValue` | string | No | Default value for the field |

**Examples:**

Add a text field to an existing row:
```json
{
  "actionType": "add-new-field",
  "fieldName": "Name",
  "label": "שם",
  "fieldType": "String",
  "toExistingRow": "P47",
  "toExistingColumn": 0
}
```

Add a pointer field:
```json
{
  "actionType": "add-new-field",
  "fieldName": "AccountId",
  "label": "לקוח",
  "fieldType": "Pointer",
  "targetClass": "Accounts",
  "toExistingRow": "P47",
  "toExistingColumn": 1
}
```

Add a date field in a new row:
```json
{
  "actionType": "add-new-field",
  "fieldName": "DueDate",
  "label": "תאריך יעד",
  "fieldType": "Date",
  "newRowAfterRow": "P47"
}
```

Add a required field:
```json
{
  "actionType": "add-new-field",
  "fieldName": "Name",
  "label": "שם",
  "fieldType": "String",
  "toExistingRow": "P47",
  "toExistingColumn": 0,
  "isRequired": true
}
```

**Field type mapping from schema to page:**

| Schema Type | fieldType | Renders As |
|-------------|-----------|------------|
| String | `"String"` | `<input type="text">` |
| Number | `"Number"` | `<input type="number">` |
| Boolean | `"Boolean"` | `<input type="checkbox">` |
| Date | `"Date"` | `<input type="date">` |
| Array | `"Array"` | Multi-select or tags |
| Pointer | `"Pointer"` | `<select>` dropdown with targetClass items |
| File | `"File"` | File upload widget |

**Special field rendering:**
- Fields named `Email` or with email schema → `<input type="email">`
- Fields named `PhoneNumber` or phone-like → `<input type="tel">`
- Fields named `Website` or URL-like → `<input type="url">`
- **No name produces a `<textarea>`** — `Comment`, `Description`, `Notes` included, every String is stored as a single-line `<input type="text">` (measured). For long text, store textarea markup with `set-html-content` (SKILL.md "Long-Text Fields").

---

### move-existing-field

Moves an existing field to a different position on the page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"move-existing-field"` |
| `fieldName` | string | Yes | Name of the field to move |
| `toExistingRow` | string | Conditional | Target row ID |
| `toExistingColumn` | number | Conditional | Target column number (0-based) |
| `newRowAfterRow` | string | Conditional | Creates new row and moves field there |

**Example:**
```json
{
  "actionType": "move-existing-field",
  "fieldName": "Email",
  "toExistingRow": "P56",
  "toExistingColumn": 1
}
```

No `fieldType` needed (measured). **Moving into a column that already holds a field stacks the moved field under it — success, no error** — which breaks one-field-per-column. In a re-layout, order the batch so every target column is emptied earlier in the same batch, then re-read (`card-aesthetics.md` §10).

---

### move-existing-object

Moves any page element (not just fields -- also rows, text elements, etc.).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"move-existing-object"` |
| `fieldName` | string | Yes | The **element ID** (e.g., `"P47"`) of the object to move |
| `toExistingRow` | string | Conditional | Target row ID |
| `toExistingColumn` | number | Conditional | Target column |
| `newRowAfterRow` | string | Conditional | Move to a new row after this row (useful for reordering rows) |

**Example:** Move row P47 to after row P56:
```json
{
  "actionType": "move-existing-object",
  "fieldName": "P47",
  "newRowAfterRow": "P56"
}
```

---

### change-existing-field-label

Changes the display label of a field.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"change-existing-field-label"` |
| `fieldName` | string | Yes | Field name |
| `label` | string | Yes | New label text |

**Example:**
```json
{
  "actionType": "change-existing-field-label",
  "fieldName": "Name",
  "label": "שם הלקוח"
}
```

---

### set-field-required

Sets or unsets a field as required.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"set-field-required"` |
| `fieldName` | string | Yes | Field name |
| `isRequired` | boolean | Yes | `true` to make required, `false` to make optional |

---

### remove-existing-field

Removes a field from the page. The field remains in the database -- only the page element is removed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"remove-existing-field"` |
| `fieldName` | string | Yes | Field name to remove |

---

## Add-Edit-Text-Element

Adds or edits a text/title element on the page. Used for section headers.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | Page ID |
| `elemType` | string | Yes | One of: `"H1"`, `"H2"`, `"H3"`, `"H4"`, `"P"` |
| `html` | string | Yes | HTML content for the element |
| `rowId` | string | For new | Row ID to place element in |
| `columnNumber` | number | For new | Column number (0-based) |
| `elemId` | string | For edit | ID of existing element to edit |

**Example -- Add section header (plain text; the response names the new id: `"text element with id P286 added"`):**
```json
{
  "pageId": "6571cb3cf9f5787b43b30697",
  "elemType": "H2",
  "html": "פרטי לקוח",
  "rowId": "P127",
  "columnNumber": 0
}
```
The element it creates is `<div class="simblaEL tcH" id="P286"><div class="textContainer H2"><h2>פרטי לקוח</h2></div></div>` -- a bare `<h2>`, **without** the `TicketHeadline` class the built-in headings carry. Add the class with `set-html-content` (below) right away.

**Example -- Edit existing header text (keeps the `<h2>`'s class; replaces everything inside it, so it also strips old `<font>` wrappers):**
```json
{
  "pageId": "6571cb3cf9f5787b43b30697",
  "elemType": "H2",
  "html": "פרטי חברה",
  "elemId": "P129"
}
```

Never put `<font>`, `style`, colour or size into a heading's `html` (`card-aesthetics.md` A13).

---

### set-html-content (an `Edit-Page` action)

Sets the inner HTML of an existing element. On a card its job is heading markup -- giving an MCP-created heading the built-in class:

```json
{ "pageId": "6571cb3cf9f5787b43b30697", "actions": [
  { "actionType": "set-html-content", "intoExistingElemId": "P286",
    "htmlContent": "<div class=\"textContainer H2\"><h2 class=\"TicketHeadline\">פרטי לקוח</h2></div>" } ] }
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | Yes | `"set-html-content"` |
| `intoExistingElemId` | string | Yes | The element whose inner HTML is replaced (for a heading: its `tcH` id) |
| `htmlContent` | string | Yes | The new inner HTML |

Verified: the class lands and the element keeps its id. Do not use it to build structure (rows, fields) -- that belongs to the other actions.

---

## Add-Table-View-to-Form-Page

Adds a related data table view inside a form page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | Page ID |
| `tableName` | string | Yes | Class name of the related table |
| `insertAfterRow` | string | Yes | Row ID to insert the table after |
| `fields` | array | Yes | Columns to show in the table |
| `tableTitle` | string | No | Title above the table |
| `allowCreate` | boolean | No | Enable create button (default: true) |
| `allowInlineEdit` | boolean | No | Enable inline editing (default: true) |
| `createBtnTitle` | string | No | Label for create button (e.g., "הוסף איש קשר") |
| `showSummary` | string | No | Summary row title. Omit to hide summary |

**Field object:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fieldName` | string | Yes | Field name. For pointers: `"PointerField.TargetField"` (read-only text display) or just `"PointerField"` (editable dropdown) |
| `label` | string | Yes | Column header label |
| `type` | string | Yes | One of: `"String"`, `"Number"`, `"Boolean"`, `"Date"`, `"PrivateFile"`, `"File"`. **Note: no Pointer type!** |
| `aggrField` | string | No | Aggregation field path (e.g., `"AccountId.Accounts.Name"`) |
| `summary` | string | No | Summary function: `"sum"`, `"avg"`, `"min"`, `"max"`, `"count"` |

**Pointer fields in table views -- important limitation:**
The `type` parameter does NOT support `"Pointer"`. Two approaches:
- **Read-only text:** Use `fieldName: "StatusId.Name"` with `type: "String"` -- displays the pointed-to record's Name as plain text. NOT editable as dropdown.
- **Editable dropdown:** Use `fieldName: "StatusId"` (without dot notation) with `type: "String"` -- the system auto-detects the pointer and renders an editable dropdown. Use this when users need to change the value inline.

**Example -- Contacts table on Account card:**
```json
{
  "pageId": "6571cb3cf9f5787b43b30697",
  "tableName": "Contacts",
  "insertAfterRow": "P146",
  "tableTitle": "אנשי קשר",
  "createBtnTitle": "הוסף איש קשר חדש",
  "allowCreate": true,
  "allowInlineEdit": true,
  "fields": [
    { "fieldName": "Name", "label": "שם", "type": "String" },
    { "fieldName": "PhoneNumber", "label": "טלפון", "type": "String" },
    { "fieldName": "Email", "label": "אימייל", "type": "String" },
    { "fieldName": "Role", "label": "תפקיד", "type": "String" }
  ]
}
```

**Example -- Sales table on Account card with summary:**
```json
{
  "pageId": "6571cb3cf9f5787b43b30697",
  "tableName": "Sales",
  "insertAfterRow": "P200",
  "tableTitle": "מכירות",
  "createBtnTitle": "מכירה חדשה",
  "showSummary": "סה\"כ",
  "fields": [
    { "fieldName": "Name", "label": "שם עסקה", "type": "String" },
    { "fieldName": "StatusId.Name", "label": "סטטוס", "type": "String" },
    { "fieldName": "Amount", "label": "סכום", "type": "Number", "summary": "sum" },
    { "fieldName": "createdAt", "label": "תאריך", "type": "Date" }
  ]
}
```

---

## Edit-Page-CSS-JS

Sets CSS and/or JavaScript for a page. **Overwrites** existing code entirely.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | Page ID |
| `cssCode` | string | No | CSS code (overwrites existing) |
| `jsCode` | string | No | JavaScript code (overwrites existing) |

**Always read current code first** with `Get-Page-Content` and merge your additions.

**Scope in this skill:** `cssCode` carries the standard aesthetics block only; `jsCode` is written only under the code policy (SKILL.md, "Native only — code is the last resort") — after the native options were ruled out and the user approved. Removing obsolete page JS that a native mechanism now covers is welcome.

---

## Execution Order Rules

When building a page, actions must be executed in the correct order because later actions depend on IDs created by earlier ones.

**Rule 1: Create space before filling it**
```
add-row  →  (get new row ID from response)  →  add-new-field to that row
```

**Rule 2: Create header row before text element**
```
Edit-Page: add-row [12]  →  (get row ID)  →  Add-Edit-Text-Element in that row
```

**Rule 3: Add all rows for a section before adding fields**
This minimizes API calls:
```
Call 1: Edit-Page(add-row for header, add-row for fields)
Call 2: Add-Edit-Text-Element in header row
Call 3: Edit-Page(add-new-field, add-new-field, add-new-field...)
```

**Rule 4: Delete after moving**
If you need to reorganize:
```
move-existing-field (move fields out of row)  →  delete-row (remove empty row)
```

**Rule 5: Multiple independent fields in one call**
Fields that go into the same **existing** row can be added in a single `Edit-Page` call:
```json
{
  "pageId": "...",
  "actions": [
    { "actionType": "add-new-field", "fieldName": "A", "toExistingRow": "P47", "toExistingColumn": 0, ... },
    { "actionType": "add-new-field", "fieldName": "B", "toExistingRow": "P47", "toExistingColumn": 1, ... },
    { "actionType": "add-new-field", "fieldName": "C", "toExistingRow": "P47", "toExistingColumn": 2, ... }
  ]
}
```
