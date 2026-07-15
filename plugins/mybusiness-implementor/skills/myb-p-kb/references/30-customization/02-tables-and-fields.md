# Tables & Fields — Creating and Extending the Data Schema

> **Purpose:** Spec-ready reference for creating tables (`Create-Table`), adding fields (`Add-Field-to-Table`), all field types and naming conventions, Hebrew label translations, the dropdown/lookup-table pattern, and what can(not) be edited or removed.
> **Last updated:** 2026-06-10 · **Status:** draft

## System vs custom tables

A stock install has ~196 tables / ~2,592 fields / 766 pointer relationships. Three families:

| Family | Examples | Implementer rule |
|---|---|---|
| **Core entities** | `Accounts` (central, referenced by 46+ tables), `Sales` (133 fields), `Cases`, `Tasks`, `Activities`, `Contacts`, `SaleRows`, `PriceQuotes`, `Emails`, `Files`, `Notes` | Never recreate; extend with custom fields |
| **System / infra** | `_User`, `_Role`, `_Session`, `_Timeline` (audit log), `_DynamicQueries` (reports), `_syslogTriggers`, `_syslogEvents`, `Channels` | Read-mostly; managed by dedicated tools |
| **Lookup tables** | `SaleStatuses`, `AccountTypes`, `LeadStatuses`, `CaseTypes`, `CaseSubTypes`, `CasePriorities`, `TaskStatuses`, `Brands`, `Products`… | Edit values freely (these ARE the dropdowns); add custom ones per entity (`<Entity>Statuses`) |

System lookup tables have dedicated admin pages (`apps/mybusiness/System-Tables-*`, e.g. System-Tables-Sale-Statuses סטטוסי מכירה). Custom tables are managed via the siteadmin Tables panel or MCP.

**Fields every record gets automatically:** `objectId` (10-char id), `createdAt`, `updatedAt`, `createdBy` (Pointer→`_User`), `updatedBy` (Pointer→`_User`), `ACL`. A `Name` String field is auto-created on every new table.

## Creating a table — `Create-Table`

```json
// mcp__MyBusiness__Create-Table
{
  "name": "Suppliers",
  "fields": [
    { "name": "SupplierCode", "type": "String",  "label": "קוד ספק" },
    { "name": "Rating",       "type": "Number",  "label": "דירוג (1-5)" },
    { "name": "Active",       "type": "Boolean", "label": "ספק פעיל" },
    { "name": "JoinDate",     "type": "Date",    "label": "תאריך הצטרפות" },
    { "name": "StatusId",     "type": "Pointer", "targetClass": "SupplierStatuses", "label": "סטטוס" },
    { "name": "AccountId",    "type": "Pointer", "targetClass": "Accounts",         "label": "לקוח" },
    { "name": "OwnerId",      "type": "Pointer", "targetClass": "_User",            "label": "אחראי" }
  ]
}
```

| Param | Type | Required | Notes |
|---|---|---|---|
| `name` | String | yes | Table name. Format `/^[A-Za-z][A-Za-z0-9_]*$/`. Convention: English PascalCase, **plural** (`Projects`, `SaleRows`, `ProjectStatuses`) |
| `fields` | Array | no | Field objects (below). Omit → table created with just the auto `Name` String field |

Field object (same shape for `Create-Table` and `Add-Field-to-Table`):

| Key | Type | Required | Notes |
|---|---|---|---|
| `name` | String | yes | `/^[A-Za-z][A-Za-z0-9_]*$/`, CamelCase (`PhoneNumber`, `ContractEndDate`). Pointer fields conventionally end in `Id` (`StatusId`, `OwnerId`) |
| `type` | enum | yes | `String` \| `Number` \| `Boolean` \| `Date` \| `Array` \| `Object` \| `Pointer` \| `PrivateFile` \| `File` \| `GeoPoint` |
| `label` | String | no | **Hebrew display translation** "to put in the html" — this is what users see on pages and in column pickers; the live `Get-Optional-Fields` `text` values come from it |
| `targetClass` | String | Pointer only | Class the pointer references (`Accounts`, `_User`, `SupplierStatuses`…) |

### Field types and what they become

| Schema type | Renders on a form as | Typical use | Notes |
|---|---|---|---|
| `String` | `<input type="text">` | names, free text | Fields named exactly `Comment` / `Description` / `Notes` auto-render as `<textarea>` at runtime; any other long-text name renders single-line (fix via page JS — see [03-pages-and-layouts.md](03-pages-and-layouts.md)). Fields named `Email`/`Website`/phone-like get matching HTML input types |
| `Number` | `<input type="number">` | amounts, ratings | Sum/avg/min/max in tables & reports work only on Number |
| `Boolean` | checkbox | flags (`Active`, `IsVIP`) | |
| `Date` | date picker | deadlines, events | Stored as Parse Date `{"__type":"Date","iso":"YYYY-MM-DDTHH:MM:SS.MSSZ"}` |
| `Array` | multi-value widget | tags, multi-select | See naming convention below |
| `Object` | (no standard widget) | structured blobs | Avoid for user-facing fields |
| `Pointer` | `<select class="select-pointer">` dropdown | all lookups & relationships | THE dropdown mechanism — see next section |
| `File` / `PrivateFile` | upload widget | public vs permission-gated files | `PrivateFile` requires authorization to download |
| `GeoPoint` | — | map locations | Rarely used in CRM modules |
| `AutoIncrement` | read-only number | record numbers (e.g. `Cases.Number` מספר) | ⚠️ Exists in the platform (visible in live schema/optional-fields) but **not** in the MCP field-type enum — configure via admin UI |

### Array field naming convention (multi-select)

The runtime infers an Array field's item type from its **name**. Two observed shapes (both live in the demo `Accounts` schema: `Array_Interests`, `array_languages_Pointer_Languages`):

- Tool-schema hint: `SalesId_Pointer_Sales` → "items are pointers to class `Sales`".
- The `myb-p-multi-select-field` skill convention: **`array_<purpose>_Pointer_<TargetTable>`** (e.g. `array_languages_Pointer_Languages`) — renders as a true `<select multiple>` (Select2) storing an array of pointer objectIds, with no custom JS. This is the only mechanism the runtime recognizes natively for multi-pick lookups; use it before any custom approach. Full recipe: [11-field-patterns.md](11-field-patterns.md).

## Adding fields to an existing table — `Add-Field-to-Table`

```json
// mcp__MyBusiness__Add-Field-to-Table — simple fields
{
  "table": "Accounts",
  "fields": [
    { "name": "Website",     "type": "String", "label": "אתר אינטרנט" },
    { "name": "FoundedYear", "type": "Number", "label": "שנת הקמה" }
  ]
}
```

| Param | Type | Required | Notes |
|---|---|---|---|
| `table` | String | yes | Existing table to extend |
| `fields` | Array | yes | Same field objects as `Create-Table` |
| `newTableName` | String | no | Create a **new lookup table** together with the pointer field |
| `newTableValues` | Array\<String\> | no | Seed `Name` values for that new lookup table |

### The one-call dropdown pattern (lookup table + pointer + values)

```json
// Creates TaskCategories with 5 records AND adds Tasks.CategoryId → TaskCategories
{
  "table": "Tasks",
  "fields": [
    { "name": "CategoryId", "type": "Pointer", "targetClass": "TaskCategories", "label": "קטגוריה" }
  ],
  "newTableName": "TaskCategories",
  "newTableValues": ["פיתוח", "תמיכה", "מכירות", "שיווק", "אחר"]
}
```

## The dropdown / lookup-table model

Every dropdown (רשימה נפתחת) in MyBusiness is **a separate table + a Pointer field** — never a static value list:

1. **Values table** — one record per option; the `Name` field is the display text. Optional conventional extra fields: `Color` (String hex — used for status pills and conditional formatting), `Order` (Number — sort via page JS `d.query.ascending("Order")`), `Active` (Boolean).
2. **Pointer field** on the main table (`SaleStatusId` → `SaleStatuses`).

Consequences for implementers:

- Adding/renaming/reordering options = editing **records** in the values table (admin UI "Add Row", `Create-Data`/`Create-Many`, or the System-Tables-* pages). Existing records keep pointing at the same objectId, so historical data survives renames.
- A standard status set with colors (from `myb-p-create-entity`): פעיל `#28a745` · ממתין לאישור `#ffc107` · מושהה `#dc3545` · לא פעיל `#6c757d`.
- **Cascading dropdowns** (parent/child — e.g. only sub-types of the chosen type) use Simbla's native `Define Parent` / `subclassDepend` convention on the child pointer — see [11-field-patterns.md](11-field-patterns.md) (and the `myb-p-parent-child-fields` skill); do not attempt this with form rules or custom JS.
- Pointer values in data operations always use the full Parse shape: `{"__type":"Pointer","className":"SaleStatuses","objectId":"zrP1MSVBoq"}`.

## Permissions on new tables (do this immediately)

Tables created via the REST `schemas` API start with an **empty CLP**; and Parse-level `{"*": true}` is NOT enough — the CRM front-end checks **role membership** and users get "no permissions" errors. Always apply the role-based pattern used by Cases/Accounts (shown as spec here; full detail in [08-users-roles-permissions.md](08-users-roles-permissions.md)):

```json
// mcp__MyBusiness__Set-Table-Permissions  (write tool — shown as spec)
{
  "table": "Suppliers",
  "classLevelPermissions": {
    "find":   {"role:CRM": true, "role:Admin": true, "role:Support": true},
    "get":    {"role:CRM": true, "role:Admin": true, "role:Support": true},
    "create": {"role:CRM": true, "role:Admin": true, "role:Support": true},
    "update": {"role:CRM": true, "role:Admin": true, "role:Support": true},
    "delete": {"role:CRM": true, "role:Admin": true, "role:Support": true},
    "addField": {}
  }
}
```

Records created via REST also lack a per-record **ACL** — set `{"*": {"read": true, "write": true}}` on them (bulk Node script in `myb-p-create-entity/references/rest-api-patterns.md`), otherwise logged-in users may not see the rows.

## REST fallback for table creation

The `myb-p-create-entity` skill (2026-04) documents `Create-Table` MCP returning `"missing user"` in some environments (⚠️ UNVERIFIED whether still current — re-test per environment; cannot be verified read-only). The equivalent REST call:

```bash
curl -s -X POST "https://api.mbapps.co.il/parse/schemas/Suppliers" \
  -H "X-Parse-Application-Id: $X_PARSE_APPLICATION_ID" \
  -H "X-Parse-Master-Key: $X_PARSE_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"className":"Suppliers","fields":{
        "SupplierCode":{"type":"String"},
        "StatusId":{"type":"Pointer","targetClass":"SupplierStatuses"},
        "OwnerId":{"type":"Pointer","targetClass":"_User"}}}'
```

(Credentials always from the customer folder's `.env` — never hardcode.) REST-created tables skip the `label` translations — add Hebrew labels later when placing fields on pages (`Edit-Page` `label` param) or via the admin UI.

## Editing & removing fields/tables

| Operation | MCP | Admin UI | REST (master key) |
|---|---|---|---|
| Add field | ✔ `Add-Field-to-Table` | ✔ Tables → Add Field | ✔ `PUT /parse/schemas/<Class>` |
| Change field **label** (translation) | partial — `Edit-Page change-existing-field-label` changes the page label only | ✔ | — |
| Rename field | ✖ | ✖ (Parse fields are not renameable — create new + migrate data) | ✖ |
| Change field type | ✖ | ✖ (same — Parse restriction) | ✖ |
| Delete field | ✖ no MCP tool | ✔ | ✔ `PUT /parse/schemas/<Class>` body `{"fields":{"FieldName":{"__op":"Delete"}}}` — deletes the column AND its data |
| Delete table | ✖ no MCP tool | ✔ | ✔ `DELETE /parse/schemas/<Class>` (only when empty) |
| Remove field from a page (keep in DB) | ✔ `Edit-Page remove-existing-field` | ✔ editor | — |

## Spec checklist for a new table (copy into implementation plans)

1. `Get-Schema` on related tables → confirm pointer targets and avoid name collisions.
2. Lookup tables first (`<Entity>Statuses` with `Name`+`Color`), then main table, then child tables (each child gets a Pointer back to the parent).
3. Hebrew `label` on every field at creation time (cheapest moment to do it).
4. `Set-Table-Permissions` role-based CLP on every new table (and record ACLs if created via REST).
5. Seed lookup values (`Create-Many`) before building pages.
6. Verify: `Get-Schema(<new table>)` shows fields + CLP with `role:` keys; `Count-Data` returns the seeded rows.

## Limitations & gotchas

- **No rename / no type change** for existing fields (Parse platform restriction). Migration = new field + data copy + page swap.
- **No MCP delete** for fields or tables; deletes go through admin UI or REST `schemas` with master key. Field delete destroys data irreversibly.
- **`label` is set-once via MCP** — there is no MCP tool to update a field's schema-level translation later; page labels can be changed per page with `Edit-Page change-existing-field-label`.
- **`AutoIncrement` is not creatable via MCP** — only via admin UI; in table views/reports its type string is `AutoIncrement` and it only renders if the DB field really is auto-increment.
- **Array fields without the name convention** behave as opaque arrays (no native multi-select widget).
- **`newTableValues` seeds only `Name`** — colors/order for the new lookup table need a follow-up `Create-Many`/`Update-Data` pass.
- **"missing user" on `Create-Table`** (Apr-2026 observation) — if hit, fall back to REST; remember CLP+ACL afterwards. ⚠️ Possibly fixed since; verify per environment.
- Schema changes are global and immediate — there is no draft/publish cycle on the data layer (unlike pages, which have versions).
