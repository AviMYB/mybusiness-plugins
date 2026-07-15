# Field Patterns — Proven Field-Level Mechanisms

> **Purpose:** Spec-ready catalog of the four proven field-level patterns: multi-select arrays (`array_…_Pointer_…` naming convention), parent-child cascading dropdowns (Define Parent / `subclassDepend`), timestamp-on-change tracking fields, and dynamic dot-notation field paths — including when to use each.
> **Last updated:** 2026-06-10 · **Status:** draft

## 0. Decision table — which pattern solves which ask

| Customer ask (Hebrew trigger phrases) | Pattern | Section |
|---|---|---|
| "שדה בחירה מרובה" / tags / multiple categories per record | **Multi-select array field** | §1 |
| "שדה תלוי" / "סטטוסים לפי סוג" / cascading or filtered dropdown | **Parent-child (`subclassDepend`)** | §2 |
| "לתעד מתי שדה השתנה" / status-change date / assignment date | **Timestamp field + trigger** | §3 |
| Show/copy a related record's value (customer email on the sale) | **Dot-notation dynamic field** | §4 |
| Restrict who edits a field | Not a field pattern — form rules (`07-…`) for UX, CLP (`08-…`) for enforcement | — |

## 1. Multi-select field — the `array_<purpose>_Pointer_<TargetTable>` convention

**Problem:** Parse has no "multi-pick" type; a plain `Array` field renders as a broken `<input type="array">`, a `Pointer` keeps only one value.

**Mechanism — name as metadata.** Simbla's form runtime parses the **field name**. A name matching `^array_.+_Pointer_(.+)$` renders as a Select2 `<select multiple>` whose options come from the captured lookup table, storing a Parse `Array` of pointer objectIds.

| Name segment | Meaning |
|---|---|
| `array_` | Prefix → multi-pick array, rendered with `multiple="multiple"` |
| `<purpose>` | Free snake_case for humans (`sector`, `interests`, `tags`) — runtime ignores it |
| `_Pointer_` | Separator → elements are pointer objectIds. **Capital P, exactly** |
| `<TargetTable>` | **Exact, case-sensitive class name** of the lookup table → `targetclass` on the `<select>` |

### Spec shape

```
// 1. lookup table must exist with a Name field
Create-Table(name: "Interests")
Create-Many(table: "Interests", data: [{Name: "טכנולוגיה"}, {Name: "ספורט"}, {Name: "מוזיקה"}])

// 2. host field — type MUST be "Array"
Add-Field-to-Table(table: "Accounts", fields: [{
  "name": "array_interests_Pointer_Interests",
  "type": "Array",
  "label": "תחומי עניין"
}])

// 3. bind the field on the form page — via the Simbla page editor UI (see gap below)
```

Rendered result (attributes derive automatically from the name + label):

```html
<select class="select-pointer form-control" name="array_interests_Pointer_Interests"
        multiple="multiple" targetclass="Interests"
        data-dictionary="תחומי עניין" data-view-key="Name"
        data-search-key="Name" data-search-type="String"></select>
```

Stored value: `["uNbbHuMGlK", "j17RjXmHdN"]` (array of objectId strings).

### Querying / reporting on the field

- Filter criteria must use **`containedIn`** with `T: "Array"` — `equalTo` returns nothing:

```json
{ "F": "array_interests_Pointer_Interests", "C": "containedIn",
  "V": ["<objectId1>", "<objectId2>"], "T": "Array" }
```

- Display the joined names in a report/table column with the 3-segment path: `array_interests_Pointer_Interests.Interests.Name`.

### Known gap — page binding is not fully MCP-scriptable

`Edit-Page(add-new-field, fieldType: "Array")` produces a broken input; `fieldType: "Pointer"` produces a single-select missing `multiple`/`data-view-key`. **The form-page binding step requires the Simbla page editor UI** (drag a field, bind to the schema field; the renderer applies the multi-select attributes). MCP covers schema + lookup data only. Flag this in implementation plans (manual step, ~2 minutes per field).

### Pitfalls

Wrong prefix/separator case (`array_sector_pointer_X` fails), TargetTable case mismatch, `type: "Pointer"` instead of `"Array"` (keeps last pick only), empty lookup table (empty dropdown), renaming the field after data exists (orphans stored values — migrate first). Dictionary-backed legacy multi-selects (`_Dictionary`-style) are a different mechanism, out of scope.

## 2. Parent-child cascading dropdowns — Define Parent / `subclassDepend`

**Problem:** "When סוג = X, the סטטוס dropdown should offer only X's statuses." Form rules cannot filter options; custom JS is fragile. The native mechanism is the page-element attribute Simbla calls **Define Parent** (editor UI) = **`subclassDepend`** (MCP param) = **`data-subclass-depend`** (rendered HTML) — three names, one mechanism.

### The model — two Pointers + one page attribute

```mermaid
flowchart LR
    subgraph data layer
      P[("Parent table<br/>SalesDepartments")] 
      Ch[("Child table<br/>SalesSubDepartments<br/>+ SalesDepartmentId → parent")]
    end
    subgraph host form (Sales)
      F1["DepartmentId : Pointer → SalesDepartments"]
      F2["SubDepartmentId : Pointer → SalesSubDepartments<br/>page attr: subclassDepend='SalesDepartments'"]
    end
    Ch -->|each child row tagged with its parent| P
    F2 -.->|"runtime filters options where<br/>child.SalesDepartmentId == F1.value"| F1
```

Key nuance: **`subclassDepend`'s value is the parent TABLE class name** (`"SalesDepartments"`), *not* the host form's field name (`"DepartmentId"`). Simbla finds the form's Pointer whose `targetClass` matches and filters the child options by it (the auto-computed `data-subclass-pointers` lists the child table's pointer fields).

### Spec shape (full MCP path, supported since 2026-05-19)

```
// 1. parent + child tables (child has a single Pointer back to parent)
Create-Table(name: "SalesDepartments")
Create-Table(name: "SalesSubDepartments", fields: [{
  "name": "SalesDepartmentId", "type": "Pointer",
  "targetClass": "SalesDepartments", "label": "מחלקת אב" }])

// 2. tag every child row with exactly ONE parent
Create-Many(table: "SalesSubDepartments", data: [
  { "Name": "B2B-Enterprise", "SalesDepartmentId": {
      "__type": "Pointer", "className": "SalesDepartments", "objectId": "<B2BId>" } },
  { "Name": "B2B-SMB", "SalesDepartmentId": {
      "__type": "Pointer", "className": "SalesDepartments", "objectId": "<B2BId>" } }
])

// 3. host-table fields (the pair the form displays)
Add-Field-to-Table(table: "Sales", fields: [
  { "name": "DepartmentId",    "type": "Pointer", "targetClass": "SalesDepartments",    "label": "מחלקה" },
  { "name": "SubDepartmentId", "type": "Pointer", "targetClass": "SalesSubDepartments", "label": "תת-מחלקה" }
])

// 4. place parent field on the form page (plain pointer)
Edit-Page(pageId, actions: [{ "actionType": "add-new-field", "fieldName": "DepartmentId",
  "fieldType": "Pointer", "targetClass": "SalesDepartments", "toExistingRow": "<row>", "toExistingColumn": 0 }])

// 5. place child field WITH the binding — the magic parameter
Edit-Page(pageId, actions: [{ "actionType": "add-new-field", "fieldName": "SubDepartmentId",
  "fieldType": "Pointer", "targetClass": "SalesSubDepartments",
  "subclassDepend": "SalesDepartments",          // ← parent TABLE name
  "toExistingRow": "<row>", "toExistingColumn": 1 }])
```

Retrofitting a field already on the page: `Edit-Page` honors `subclassDepend` **only on `add-new-field`** → `remove-existing-field` then re-add with the attribute (schema/data untouched; manual styling tweaks on that element are lost). Alternatively set "Define Parent" in the page editor.

Verification: (a) data layer — `Get-Data` on the child table filtered by a parent pointer returns only that parent's children; (b) page layer — `Get-Page-Content(minimal: false)` and grep for `data-subclass-depend="<ParentTable>"`.

### Live examples (playground)

- Account card: `TypeId` (→`AccountTypes`) parent of `StatusId` (→`AccountStatuses` tagged via `AccountTypeId`), page `apps/mybusiness/Account`.
- Sale card: two independent pairs — `DepartmentId`/`SubDepartmentId` and `ChannelId`/`SubChannelId`, wired end-to-end via MCP, page `apps/mybusiness/Sale`.

### Pitfalls

`subclassDepend` set to the field name instead of the table name; missing the param (call still returns `success: true` — failure only visible at runtime); Array-of-parents on the child table (filter is single-pointer `equalTo` — overlap unsupported, duplicate child rows per parent instead); untagged child rows never appear; host field and child tag pointing at different parent tables; **two host-form Pointers to the same parent table** make the driver ambiguous.

## 3. Timestamp-on-change tracking fields

**Problem:** "מתי השתנה הסטטוס? מתי הוקצה אחראי?" — `updatedAt` only says when *anything* changed.

**Mechanism:** a Date field + a data-change trigger watching the source field via `onSetFields`, self-updating with `connection: "current.objectId"`.

### Spec shape

```
// 1. the field
Add-Field-to-Table(table: "Sales", fields: [{
  "name": "OwnerSetDate", "type": "Date", "label": "תאריך הקצאת אחראי" }])

// 2. the trigger (every change → oneachupdate: true; first time only → false)
Set-Trigger(tableName: "Sales", type: "data change", active: true,
  name: "תיעוד תאריך הגדרת אחראי",
  events: ["create", "update"], oneachupdate: true, onSetFields: ["OwnerId"])

// 3. the action — live-verified shape
Set-Trigger-Action(tableName: "Sales", triggerId: "<id>", triggerType: "data change",
  actionType: "update-object",
  actionData: { "update-object": {
    "targetClass": "Sales", "connection": "current.objectId",
    "fieldsValue": [{ "field": "OwnerSetDate", "type": "dynamic",
                      "value": "updatedAt", "visibleVal": "updatedAt" }] } })
```

### Variations

| Variation | Change |
|---|---|
| First-time-only stamp (e.g., lead-conversion date) | `oneachupdate: false` |
| Conditional stamp (only when status = X) | Add a `criterias` Pointer condition |
| Stamp the related record instead | `connection: "source.AccountId"` |
| Who changed it | Second `fieldsValue` entry: `{ "field": "OwnerSetBy", "type": "dynamic", "value": "updatedBy", "targetClass": "_User" }` |
| Multiple monitored fields | One trigger+field pair per monitored field; a single trigger with several `onSetFields` writes one date = generic "last modified" only |

### Rules (hands-on verified)

- `connection` must be exactly `"current.objectId"` — `self`/`objectId`/`target.objectId`/`source.objectId` fail with `"missing type or field"`.
- Date fields take `dynamic` values only (`updatedAt` = "now").
- **Triggers fire on API/Master-key writes too** (live-verified — an `Update-Data` setting `OwnerId` stamped `OwnerSetDate`); the exception is bulk imports run with `Create-Many(skipTriggers: true)`, which skip stamping — backfill timestamps inside such imports.
- Client-side cousin: a form rule `fixed-value: "today"` on status change (`07-form-rules.md` §5.4) stamps at edit time in the form — but only when edited through that form; the trigger pattern is the server-side, form-independent version. Prefer the trigger.

## 4. Dynamic dot-notation field paths

A cross-cutting convention — pulling values across a Pointer instead of duplicating fields. **Segment counts differ by surface** (the #1 implementation error):

| Surface | Path shape | Example | Source |
|---|---|---|---|
| Trigger placeholders (`{{{ }}}`) | `Pointer.Field` (2-seg) | `{{{AccountId.Name}}}`, `{{{OwnerId.name}}}` | `06-…` §7 |
| Trigger `fieldsValue` dynamic value | `Pointer.Class.Field` (3-seg) | `"value": "SaleId.Sales.AccountId"` (live, SaleRows) | `06-…` §5.5 |
| Trigger email target | `Pointer.Class.Field` or `Pointer.field` | `AccountId.Accounts.Email`, `OwnerId.email` (both verified) | `06-…` §5.1 |
| Form-rule `dynamic-value` | `Pointer.Field` (2-seg) | `"AccountId.Email"`, `"BrandId.Name"` | `07-…` §3 |
| Trigger criteria `F` | `Pointer._Class.field` | `OwnerId._User.name` | trigger skill |
| Report `ShowFields` / table column `field` | `Pointer.Field` (2-seg) | `AccountId.Name`, `OwnerId.name` | SLA reports ref |
| Table column `aggrField` | `Pointer.Class.Field` (3-seg) | `AccountId.Accounts.Name` | create-entity KI-9 |
| Multi-select display | `arrayField.Class.Field` | `array_x_Pointer_T.T.Name` | §1 |

Rules of thumb: `_User` subfields are lowercase (`name`, `email`); one pointer hop is the documented depth (project rule `AccountId.Accounts.Email` = the 3-segment form); table-view columns displaying a pointer's string field must declare `type: "String"` (the displayed value's type), never `type: "Pointer"` — wrong type breaks row rendering.

**When to use dot-notation vs a synced copy field:** display-only → dot-notation everywhere it's supported (zero maintenance). Need to *filter/sort heavily*, snapshot a value at a point in time (price at order time), or feed an external integration → copy the value with a trigger (`update-object`/`create-object` with a 3-segment dynamic value) and accept the sync burden.

## Limitations & gotchas

1. **Multi-select page binding requires the page-editor UI** — no full-MCP path; plan a manual step.
2. **Multi-select queries need `containedIn` (`T: "Array"`)** — `equalTo` silently returns nothing.
3. **`subclassDepend` takes the parent table name** (not the field name) and works **only on `add-new-field`** — retrofit = remove + re-add; no structured read-back (grep rendered HTML).
4. **Parent-child overlap unsupported** — single-pointer equality; duplicate child rows per parent if needed.
5. **Timestamp triggers fire on API writes (verified)** — they are skipped only when imports use `Create-Many(skipTriggers: true)`; backfill timestamps explicitly in suppressed imports.
6. **Self-update connection literal:** `current.objectId` only.
7. **Dot-notation segment counts differ per surface** (2-seg vs 3-seg) — copy the shape from the matching row in §4's table.
8. **Renaming any pattern field after data exists orphans values** — Parse stores by field name; migrate data first.
9. **`oneachupdate` choice is semantic:** `true` for ongoing tracking, `false` for first-time milestones — wrong choice silently records the wrong thing.
10. ⚠️ UNVERIFIED: dot-notation traversal beyond one pointer hop (e.g., `A.B.C.D`) on any surface — no examined source documents it; assume one hop.
