---
name: myb-p-multi-select-field
description: "Create a working multi-select (multi-pick) field in MyBusiness CRM that lets users choose multiple values from a lookup table. The field uses Simbla's special name-pattern convention (`array_<purpose>_Pointer_<TargetTable>`) so the runtime renders it as a true `<select multiple>` driven by Select2 without any custom JS. Use this skill whenever the customer wants a multi-select field, checklist-style field, tags field, multi-pick dropdown, or any field that should store an array of pointer objectIds. Triggers on requests like 'שדה בחירה מרובה', 'multi-select', 'multi-pick', 'תגיות', 'תחומי עניין', 'multiple categories', 'array of pointers', 'multi-value lookup', 'multi value field', 'multiple values per record', 'select many', 'pick several'. Use this BEFORE attempting any other approach to multi-select — the name-pattern convention is the only mechanism Simbla's runtime recognizes natively."
---

# Multi-Select Field (Simbla name-pattern convention)

Create a field that:
- Stores an **array of pointer objectIds** in the database (Parse `Array` type)
- Renders on the form as a **Select2 multi-pick dropdown** populated from a lookup table
- Works **without any custom JavaScript** — Simbla's runtime recognizes the field name and configures the rendering

## The core idea — name as metadata

Simbla's form runtime parses the field name to decide how to render it. The pattern is:

```
array_<purpose>_Pointer_<TargetTable>
```

Each part has meaning:

| Segment | Meaning |
|---------|---------|
| `array_` | Prefix → the field is a multi-pick array, render with `multiple="multiple"` |
| `<purpose>` | Free-form snake_case (e.g., `sector`, `interests`, `tags`). Just for human readability — runtime ignores it. |
| `_Pointer_` | Separator → the array elements are Parse pointers (objectIds), not raw values |
| `<TargetTable>` | **Exact** class name of the lookup table (case-sensitive). Runtime sets `targetclass="<TargetTable>"` on the `<select>` and fetches options from there. |

**Why this works**: When Simbla renders the form, it looks at each form-control's `name`. If the name matches `^array_.+_Pointer_(.+)$`, it knows to:
1. Make it `<select multiple>`
2. Set `targetclass` to the captured table name
3. Wire up Select2 with `data-criteria=containedIn`
4. Save selected values as a Parse `Array` of pointer objectIds

No other approach (renaming, post-load JS injection, plain `Array` field type) reliably produces a working multi-select. If you skip the name pattern, you'll get a broken `<input type="array">` or a single-select `<select>` instead of the multi-pick.

## What ends up on the rendered page

The final HTML inside the form (after Simbla rendering + Select2 init) looks like:

```html
<div class="simblaEL form-group" id="P334">
  <label for="array_sector_Pointer_AccountTypes">סקטור בחירה מרובה</label>
  <select class="select-pointer form-control"
          id="array_sector_Pointer_AccountTypes"
          name="array_sector_Pointer_AccountTypes"
          multiple="multiple"
          targetclass="AccountTypes"
          data-dictionary="סקטור בחירה מרובה"
          data-view-key="Name"
          data-search-key="Name"
          data-search-type="String"
          placeholder="">
  </select>
</div>
```

The `multiple`, `data-view-key`, `data-search-key`, `data-search-type`, and `targetclass` attributes are all derived from the **field name pattern and the schema dictionary label**. You don't set them by hand.

## Steps

### 1. Get-Schema — verify host table and check for naming conflicts

```
Get-Schema(className: "<HostTable>")
```

- Confirm the host table exists.
- Confirm no field already exists with the name you plan to use. The runtime resolves the first match it finds, and duplicate-purpose fields are confusing.

### 2. Confirm (or create) the lookup table

The lookup table must exist and have a user-facing `Name` field (the default created by `Create-Table`).

**If it already exists**: just note its exact class name (case-sensitive) — this becomes the `<TargetTable>` suffix.

**If it's new**:
```
Create-Table(name: "<TargetTable>")          // creates with Name:String
Create-Many(table: "<TargetTable>", data: [
  {Name: "Option 1"},
  {Name: "Option 2"},
  ...
])
```

Seed at least 2–3 values so the dropdown isn't empty on first use.

### 3. Add the field to the host-table schema

```
Add-Field-to-Table(
  table: "<HostTable>",
  fields: [{
    name: "array_<purpose>_Pointer_<TargetTable>",
    type: "Array",
    label: "<Hebrew or English label>"
  }]
)
```

**Critical**:
- `type` MUST be `Array` (not `Pointer`, not `String`)
- `name` MUST follow `array_<purpose>_Pointer_<TargetTable>` exactly
- `<TargetTable>` MUST match the lookup table's class name character-for-character
- The `label` becomes the `dictionary` value on the field and is used as `data-dictionary` on the rendered select

**Example**:
```
Add-Field-to-Table(
  table: "Accounts",
  fields: [{
    name: "array_sector_Pointer_AccountTypes",
    type: "Array",
    label: "סקטור בחירה מרובה"
  }]
)
```

### 4. Add the field to the form page

This is the step where the MCP `Edit-Page` tool **does not have full support** for the name-pattern convention. As of testing, calling `Edit-Page(action: "add-new-field", fieldType: "Array")` produces a broken `<input type="array">`, and `fieldType: "Pointer"` produces a single-select `<select>` missing `multiple`, `data-view-key`, etc.

**Reliable path — Simbla Page Editor UI (manual)**:
1. Open the form page in the Simbla page editor (CRM → page settings → edit page)
2. Drag a new form-field element onto the desired row/column
3. In the field's properties panel, bind it to the schema field `array_<purpose>_Pointer_<TargetTable>`
4. Save and publish the page

Once bound to a field whose name matches the pattern, Simbla's renderer applies all the multi-select attributes automatically.

**MCP path (use only if user explicitly wants pure-API workflow and accepts the limitation)**:
You can place a `<select>` skeleton via `Edit-Page` with `fieldType: "Pointer"` and `targetClass: <TargetTable>`. The field will render as a single-select and the user will need to convert it to multi-select via the Simbla page editor or browser DevTools (adding `multiple=""`, `data-view-key="Name"`, `data-search-key="Name"`, `data-search-type="String"`). This is a partial solution and should be flagged as such.

### 5. Verify

After publishing, open a record in the CRM and confirm:
- The field renders as a Select2 chip-style multi-pick (not a single dropdown, not a text input).
- The dropdown lists the lookup table's `Name` values.
- Picking 2+ options and saving stores correctly: `Get-Data(table: <HostTable>, objectId: <id>, keys: ["array_<purpose>_Pointer_<TargetTable>"])` returns an array of objectId strings, e.g. `["uNbbHuMGlK", "j17RjXmHdN"]`.

## Filtering in reports / queries

When filtering on this field in a `Get-Data` query, a report, or a `Count-Data`, the criterion must use **`containedIn`** (not `equalTo`), and `T: "Array"`:

```json
{ "F": "array_<purpose>_Pointer_<TargetTable>",
  "C": "containedIn",
  "V": ["<objectId1>", "<objectId2>"],
  "T": "Array" }
```

To display the joined `Name` values in a report column, use dot-notation:
```
array_<purpose>_Pointer_<TargetTable>.<TargetTable>.Name
```

## Examples

### Example 1 — Interests on Accounts (new lookup table)

```
Create-Table(name: "Interests")
Create-Many(table: "Interests", data: [
  {Name: "טכנולוגיה"}, {Name: "ספורט"}, {Name: "מוזיקה"},
  {Name: "נסיעות"}, {Name: "בישול"}, {Name: "ספרות"}
])
Add-Field-to-Table(table: "Accounts", fields: [{
  name: "array_interests_Pointer_Interests",
  type: "Array",
  label: "תחומי עניין"
}])
// Then bind a form field to array_interests_Pointer_Interests
// via the Simbla page editor.
```

### Example 2 — Multi-Sector on Accounts (reusing existing AccountTypes table)

```
// AccountTypes already exists with 17 values — no new table needed.
Add-Field-to-Table(table: "Accounts", fields: [{
  name: "array_sector_Pointer_AccountTypes",
  type: "Array",
  label: "סקטור בחירה מרובה"
}])
// Then bind via page editor.
```

### Example 3 — Tags on Sales (new "Tags" table)

```
Create-Table(name: "Tags")
Create-Many(table: "Tags", data: [
  {Name: "Hot"}, {Name: "Cold"}, {Name: "Follow-up"}, {Name: "Closed"}
])
Add-Field-to-Table(table: "Sales", fields: [{
  name: "array_tags_Pointer_Tags",
  type: "Array",
  label: "תגיות"
}])
```

## Common Pitfalls

- **Wrong prefix or separator** — `Array_AccountTypes`, `array_AccountTypes`, `array_sector_AccountTypes` (missing `_Pointer_`), or `array_sector_pointer_AccountTypes` (lowercase `pointer`) all fail. The pattern is **case-sensitive on `Pointer`** specifically; the prefix and purpose are lowercase.
- **TargetTable case mismatch** — `array_x_Pointer_accounttypes` will not resolve. Match the class name exactly.
- **Using `type: "Pointer"`** instead of `"Array"` in `Add-Field-to-Table` — the field will store only one objectId; the multi-pick will appear to work but only the last selection persists.
- **Using `equalTo` in queries** — Array fields require `containedIn`. `equalTo` returns nothing.
- **Empty lookup table** — the Select2 dropdown shows "no options". Always seed values before demoing.
- **Trying `Edit-Page` + `fieldType: "Array"`** — produces a plain `<input type="array">`. Not a working multi-select. Use the Simbla page editor UI instead, or accept the partial single-select path.
- **Renaming an existing array field after data was saved** — orphans the existing values, since Parse stores them under the old field name. If you must rename, migrate the data first.

## What this skill explicitly does NOT do

- It does not provide a 100% MCP-only path for **placing** the field on the page — that final binding step still needs the Simbla page editor UI (or DevTools). The MCP tools handle the schema and lookup table; the page binding is manual.
- It does not handle multi-select fields backed by `_Dictionary` (dictionary-based arrays, like the legacy `Sector_By_V` style). Those use a different mechanism — see `Set-Terminology-Dictionary` and the dictionary table pattern.

## Why this matters / why the name convention

Simbla generates form HTML server-side based on the schema. For most field types, the rendering is straightforward (Pointer → single `<select>`, String → `<input>`, Date → `<input type="date">`). Multi-select doesn't have a dedicated Parse type — it's just an `Array`. So Simbla needs a way to know "this Array stores pointers to TableX, render it as multi-pick". The name-pattern convention is that signal. It's a deliberate Simbla design choice that lets a no-code builder express the relationship without exposing a new schema concept to the user.
