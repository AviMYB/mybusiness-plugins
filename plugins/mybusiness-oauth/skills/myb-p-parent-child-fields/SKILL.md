---
name: myb-p-parent-child-fields
description: "Configure parent/child (cascading) Pointer fields in MyBusiness CRM so a child dropdown shows only the values matching a parent dropdown's current selection on the same form. Uses Simbla's native `Define Parent` / `subclassDepend` convention — no custom JavaScript. Use this skill whenever the customer wants conditional/cascading dropdowns, dependent picklists, parent-child Pointer relationships, or restricting status/category options by another field on the card. Strong triggers in Hebrew: 'שדה אב ושדה בן', 'שדה תלוי', 'סינון לפי שדה', 'הצגת ערכים לפי בחירה', 'סטטוסים לפי סוג', 'דרופ-דאון מותנה', 'תלות בין שדות', 'Define Parent', 'הגדרת אב', 'תת-קטגוריה', 'תת-מחלקה'. In English: 'parent-child fields', 'cascading dropdown', 'dependent select', 'conditional pointer', 'filtered lookup', 'show statuses by type', 'subclass dependency'. Use this BEFORE trying form rules, multi-select arrays, or custom JS — Define Parent is the native mechanism; the other approaches do not filter dropdown options."
---

# Parent/Child Fields (Simbla `Define Parent` / `subclassDepend` convention)

Configure a child `Pointer` field so its dropdown shows only the records whose own Pointer-to-parent matches the parent field's currently selected value on the same form.

## The model — two Pointers, one declaration

Think of three pieces:

| Piece | Where it lives | Role |
|---|---|---|
| **Parent table** | e.g., `AccountTypes`, `SalesDepartments` | Source of the parent values |
| **Child table** | e.g., `AccountStatuses`, `SalesSubDepartments` | Source of the child values; each row gets a Pointer back to the parent table identifying which parent it belongs to |
| **Define Parent** (UI name) / **`subclassDepend`** (MCP name) / **`data-subclass-depend`** (rendered HTML attribute) | A page-element attribute on the child field in the **form page** | Tells Simbla's runtime: "filter this child Pointer's options where `<child-table>.<some-pointer-field>` equals the value of the form's pointer to the named parent table" |

So the child table needs to know "which parent do I belong to" (a single Pointer to the parent table), and the child field on the page needs to be told **the name of the parent table** — Simbla figures out which pointer-field on the child table to filter by (via `data-subclass-pointers`, computed automatically from the child table's schema).

**Important nuance about the `subclassDepend` value**: It is the **class name of the parent table** (e.g., `"SalesDepartments"`), **not** the field name of the parent on the form (e.g., not `"DepartmentId"`). Simbla resolves it by looking at the current form for a Pointer field whose `targetClass` matches `subclassDepend`, then filters the child by that field's current value.

**Why a single Pointer, not Array**: Simbla's filter uses `equalTo` semantics — it matches child rows whose parent-Pointer field equals the currently selected parent objectId. An `Array` of parent Pointers does not register as a parent-pointer field for this purpose. Overlap (one child shown for multiple parents) is **not supported** by this mechanism; if you need overlap, duplicate the child row, one per parent.

## What works through MCP vs what doesn't

| Step | MCP-supported? | Tool |
|---|---|---|
| Create/inspect the parent table | ✓ | `Create-Table`, `Get-Schema`, `Get-Data` |
| Create/inspect the child table | ✓ | `Create-Table`, `Get-Schema`, `Get-Data` |
| Add a Pointer field on the child table → parent table | ✓ | `Add-Field-to-Table` (type=`Pointer`, `targetClass`) — or include it in `Create-Table` `fields` |
| Tag each child record with its parent (single objectId) | ✓ | `Update-Data`, `Create-Many` |
| Add the parent Pointer field to the form page | ✓ | `Edit-Page` (`add-new-field` with `fieldType: "Pointer"`, `targetClass: "<ParentTable>"`) |
| **Add the child Pointer field to the form page WITH `Define Parent` already wired** | ✓ — **supported as of 2026-05-19** | `Edit-Page` (`add-new-field` with `fieldType: "Pointer"`, `targetClass: "<ChildTable>"`, **`subclassDepend: "<ParentTable>"`**) |
| Set `Define Parent` on a child field that **already exists** on the page | ✗ — not directly supported | Workaround: `remove-existing-field` then `add-new-field` with `subclassDepend` (the schema field is untouched; only the page element is removed and re-added). Or set manually in the Simbla page editor. |
| Read whether `Define Parent` is currently set on an existing page field | ✗ — not via structured MCP | Workaround: `Get-Page-Content(minimal: false)` and grep the rendered HTML for `data-subclass-depend="..."`. Brittle. |

The page-editor UI label for this attribute is **"Define Parent"**. The MCP parameter name is **`subclassDepend`**. The HTML attribute Simbla renders is **`data-subclass-depend="<ParentTable>"`** (alongside an auto-computed `data-subclass-pointers="[...]"` listing every Pointer field on the child table). The three names refer to the same mechanism — easy to confuse, so when reading docs/screenshots vs MCP code, keep the mapping in mind.

## Operational recipe (MCP-end-to-end, no editor needed)

### 1. Confirm or create the parent table

```
Get-Schema(className: "<ParentTable>")
```

If new:

```
Create-Table(name: "<ParentTable>")
Create-Many(table: "<ParentTable>", data: [{Name: "A"}, {Name: "B"}, ...])
```

### 2. Create the child table with a Pointer field back to the parent table

```
Create-Table(
  name: "<ChildTable>",
  fields: [{
    name: "<ParentPointerFieldName>",    // e.g., SalesDepartmentId
    type: "Pointer",
    targetClass: "<ParentTable>",
    label: "<label>"
  }]
)
```

Or, on an existing child table:

```
Add-Field-to-Table(
  table: "<ChildTable>",
  fields: [{
    name: "<ParentPointerFieldName>",
    type: "Pointer",
    targetClass: "<ParentTable>",
    label: "<label>"
  }]
)
```

Naming convention: `<EntityId>` (e.g., `SalesDepartmentId`, `CategoryId`, `AccountTypeId`). Not strictly required by the mechanism — Simbla resolves the binding by `targetClass`, not by field name — but it matches every native pointer in the system and makes the data layer self-documenting.

### 3. Tag each child record with its parent

```
Create-Many(table: "<ChildTable>", data: [
  { Name: "B2B-Enterprise", "<ParentPointerFieldName>": {
      "__type": "Pointer", "className": "<ParentTable>", "objectId": "<B2BparentId>"
  }},
  { Name: "B2B-SMB", "<ParentPointerFieldName>": {
      "__type": "Pointer", "className": "<ParentTable>", "objectId": "<B2BparentId>"
  }},
  ...
])
```

For existing rows, use `Update-Data` with the same Pointer payload. Every child must point to exactly one parent — overlap is not supported, duplicate the row if needed.

### 4. Add the schema fields on the **host table** (the form's table — e.g., `Sales`)

The form's table needs two new Pointer fields: one to the parent table, one to the child table. These are the fields the form will display.

```
Add-Field-to-Table(table: "<HostTable>", fields: [
  { name: "<ParentFieldOnHost>",  type: "Pointer", targetClass: "<ParentTable>", label: "..." },
  { name: "<ChildFieldOnHost>",   type: "Pointer", targetClass: "<ChildTable>",  label: "..." }
])
```

Field-name note: the form field (e.g., `DepartmentId` on `Sales`) and the child-table's parent-pointer field (e.g., `SalesDepartmentId` on `SalesSubDepartments`) are usually **different**. The host field stores which parent this record has; the child-table field tags each lookup option with which parent it's scoped to. They both point to the same `<ParentTable>`, but they live in different tables and play different roles.

### 5. Place the parent field on the page (plain Pointer)

```
Edit-Page(pageId: "<formPageId>", actions: [
  { actionType: "add-new-field",
    fieldName: "<ParentFieldOnHost>",
    fieldType: "Pointer",
    targetClass: "<ParentTable>",
    label: "...",
    toExistingRow: "<rowId>", toExistingColumn: 0
  }
])
```

### 6. Place the child field on the page with `subclassDepend` — this is the binding step

```
Edit-Page(pageId: "<formPageId>", actions: [
  { actionType: "add-new-field",
    fieldName: "<ChildFieldOnHost>",
    fieldType: "Pointer",
    targetClass: "<ChildTable>",
    subclassDepend: "<ParentTable>",    // ← the magic word: name of the PARENT TABLE
    label: "...",
    toExistingRow: "<rowId>", toExistingColumn: 1
  }
])
```

That's it. Reload the form — the child dropdown is now driven by the parent's selection.

## Fixing an existing page field (no `subclassDepend` was set when added)

`Edit-Page` only honors `subclassDepend` on `add-new-field`. To retrofit an existing page field:

```
Edit-Page(pageId: "<formPageId>", actions: [
  { actionType: "remove-existing-field", fieldName: "<ChildFieldOnHost>" },
  { actionType: "add-new-field",
    fieldName: "<ChildFieldOnHost>", fieldType: "Pointer",
    targetClass: "<ChildTable>", subclassDepend: "<ParentTable>",
    label: "...", toExistingRow: "<rowId>", toExistingColumn: <col>
  }
])
```

Removing a field from the page does **not** remove it from the schema — record data is untouched. Only the `<select>` on the form is replaced. Two actions in one call is fine; they execute in order.

## Manual alternative (Simbla page editor)

If MCP is not available, or if you prefer the editor:

1. Open the form page in the Simbla editor (CRM → page settings → edit page).
2. Click the **child** Pointer field to select it.
3. In the field's properties panel, find **Define Parent**.
4. Pick the **parent table** from the dropdown (it will show the table label).
5. Apply, Save, Publish.

The editor writes the same `data-subclass-depend` attribute on the rendered `<select>`.

## Verifying the wiring is in place

Two ways, both via MCP:

**a. By querying the data layer** — confirms the per-option scoping is correct:

```
Get-Data(
  table: "<ChildTable>",
  keys: ["Name", "<ParentPointerFieldName>"],
  where: {"<ParentPointerFieldName>": {
    "__type": "Pointer", "className": "<ParentTable>", "objectId": "<parentObjectId>"
  }}
)
```

Should return only the children scoped to that parent.

**b. By inspecting the rendered HTML** — confirms `subclassDepend` is set on the page:

```
Get-Page-Content(pageId: "<formPageId>", minimal: false)
```

Then grep the dump for `data-subclass-depend="<ParentTable>"` on the child field's `<select>` (the dump is large; slice by character offset around the field's id). If present, the binding is live.

## Working examples currently live in the Playground

### Example 1 — Account card (UI editor was used for the Define Parent step)

- **Parent table**: `AccountTypes` (לקוח `JrEvbcNOCY`, ספק `Be4EgW3xqU`, שותף עסקי `6eWLP42rk0`)
- **Child table**: `AccountStatuses` with `AccountTypeId` → `AccountTypes`
- Tagged rows: פעיל/נכשל-מאגר/ליד/לקוח → לקוח; מאושר/ממתין-לחתימה/בתהליך-בדיקה/ארכיון/מושעה → שותף עסקי
- **Form page**: `apps/mybusiness/Account` (pageId `69bfd6c945604bc0d35674fb`)
- Form fields: `TypeId` (parent), `StatusId` (child). `data-subclass-depend="AccountTypes"` was set via the Simbla page editor (the MCP `subclassDepend` parameter did not exist when this was wired).

### Example 2 — Sale card (MCP `subclassDepend` was used end-to-end)

- **Parent tables**: `SalesDepartments` (B2B, B2C, ממשלתי), `SalesChannels` (אונליין, פרונטלי, שיווק)
- **Child tables**: `SalesSubDepartments` with `SalesDepartmentId` → `SalesDepartments`; `SalesSubChannels` with `SalesChannelId` → `SalesChannels`
- **Form page**: `apps/mybusiness/Sale` (pageId `69bfd6c945604bc0d356753e`)
- Form fields on `Sales`: `DepartmentId`+`SubDepartmentId` (pair 1), `ChannelId`+`SubChannelId` (pair 2)
- `subclassDepend` set via MCP `Edit-Page(add-new-field, ...)` — see the HTML for `data-subclass-depend="SalesDepartments"` and `data-subclass-depend="SalesChannels"`.

## Common Pitfalls

- **Setting `subclassDepend` to the form field name instead of the parent table name.** It's the **table class name** (e.g., `"SalesDepartments"`), not the form's Pointer field name (e.g., `"DepartmentId"`). Simbla figures out which form field by scanning for a Pointer with `targetClass === subclassDepend`.

- **Forgetting `subclassDepend` on `add-new-field` and discovering later.** The MCP call returns `success: true` either way; the difference shows up only at runtime when the child dropdown ignores the parent. Either re-add via remove-then-add (see "Fixing an existing page field" above) or set Define Parent in the page editor.

- **Using `Array` of parent pointers for the child table's parent column.** Tempting if you want overlap, but the filter is single-pointer equality. The child dropdown will be empty (or misbehave). If you need overlap, duplicate the child row, one per parent.

- **Using a form rule (`hidden`, `fixed-value`, etc.) to "filter" the child dropdown.** Form rules in MyBusiness CRM support only `readonly, required, hidden, fixed-value, dynamic-value, formula-value, show-message, value-from-url` — none filter Pointer options. Use `subclassDepend` instead.

- **Forgetting to tag every child row.** Untagged children (parent-pointer is null) never appear under any parent selection. If a child should appear under all parents, that's overlap → duplicate per parent.

- **Mismatching the host field's `targetClass` and the child table's parent-pointer `targetClass`.** They must both point to the **same parent table**. If `Sales.DepartmentId` → `SalesDepartments` but `SalesSubDepartments.SalesDepartmentId` accidentally → some other table, the filter resolves to nothing.

- **Two Pointer fields on the host form pointing to the same parent table.** If the form has two Pointers both with `targetClass = "SalesDepartments"`, Simbla's runtime can't tell which one drives the child filter. Avoid this, or be aware that the editor will let you disambiguate by picking the specific source field.

## MCP Gaps (remaining as of 2026-05-19)

1. ~~No way to set `Define Parent` via MCP~~ — **closed**: use `subclassDepend` on `Edit-Page(add-new-field, ...)`.

2. **No way to set `subclassDepend` on a field that already exists on the page.** Workaround is remove + add, which is fine but clobbers any position/styling tweaks made manually. A `set-field-subclass-depend` action (or generic `set-field-attribute`) would be cleaner.

3. **No structured way to read `subclassDepend` from a page.** Must dump the rendered HTML and parse. A field-level read in `Get-Page-Content` would help.

4. **No MCP support for setting other field-level attributes** flagged in the same period — e.g., the `RA` (read-only/always) attribute. Same shape as the `subclassDepend` gap was, before it was closed.

When recommending this skill, mention these remaining gaps if the user asks to modify an existing field's binding without re-adding it.

## Why this matters / design rationale

Simbla's form runtime needs a per-page, per-field hint to perform cascading filtering. Schema alone isn't enough — a child table could participate in multiple parent relationships across different pages. So the activating switch lives on the page element, not in the schema. The schema (`Add-Field-to-Table`) sets up the *capability*; `subclassDepend` on the page activates it *here, for this form*. Until 2026-05-19 the activation switch was editor-only; now it's available end-to-end via MCP for newly-added fields, which means a full parent/child wiring can be scripted without leaving the API.
