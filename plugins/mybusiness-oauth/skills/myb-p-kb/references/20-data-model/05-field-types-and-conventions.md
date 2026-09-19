# Field Types & Conventions

> **Purpose:** The type system (exact JSON wire formats), system fields, naming conventions, and the platform-specific field conventions (multi-select arrays, parent/child dropdowns, dot-notation, template bindings) every integration and customization must follow.
> **Last updated:** 2026-06-10 · **Status:** draft

---

## 1. Type system and exact wire formats

Parse encodes non-JSON-native types as objects with a reserved `__type` key. Never use `__type` for your own data.

| Schema type | Wire format (read & write) | Notes / where seen |
|---|---|---|
| `String` | `"text"` | Most fields. Hebrew content is plain UTF-8 |
| `Number` | `42`, `3.14` | Money fields are plain numbers, no currency type |
| `Boolean` | `true` / `false` | |
| `Object` | any JSON object | e.g. `Campaigns.WATemplateParams`, `_Timeline.data`, `Config.Value` |
| `Array` | any JSON array | participant lists, condition arrays, multi-select pointer arrays (§5) |
| `Date` | `{"__type":"Date","iso":"YYYY-MM-DDTHH:MM:SS.MSSZ"}` — UTC ISO 8601 with millisecond precision, e.g. `{"__type":"Date","iso":"2026-05-19T09:25:03.107Z"}` | All date/datetime fields. **Top-level** `createdAt`/`updatedAt` are returned as plain ISO strings, but in `where` filters they still take the `__type:Date` object |
| `Pointer` | `{"__type":"Pointer","className":"TableName","objectId":"id"}` | Foreign key. Read responses return exactly this shape (verified live). Write the same shape; equality filters take the same shape |
| `Relation` | `{"__type":"Relation","className":"TableName"}` | Many-to-many; only observed use: `_Role.users`, `_Role.roles`. Queried with `$relatedTo`, not returned inline |
| `File` | `{"__type":"File","name":"...profile.png","url":"..."}` | Public file (e.g. `_User.profile_image`, `Products.PreviewImage`) |
| `PrivateFile` | same `File`-style object; access via authenticated file endpoint | **MyBusiness extension** — non-public files: `PriceQuotes.SignedPdf`, `AccountingHeaders.File`, `Notes.File`, `ConversationMessages.File`. MCP returns them as `resource_link` with URI `file-storage:///api.mbapps.co.il/parse/files/APP_ID/FILE_NAME/TABLE_NAME/OBJECT_ID/PROPERTY_NAME` (fetch via `Get-File-Content`) |
| `HTML/XML` | string containing markup | **MyBusiness extension** of String for rich-text fields: `Accounts.Comment`, `Emails.Body`, `PDFTemplate.HTML`, `Campaigns.EmailContent` |
| `AutoIncrement` | number (read-only) | **MyBusiness extension**: server-assigned running number — `Cases.Number`/`CaseNum`, `Conversations.Number`. Counter state in `_AutoIncrementValues` (see [04-system-tables-and-logs.md](04-system-tables-and-logs.md) §5). Never write it |
| `GeoPoint` | `{"__type":"GeoPoint","latitude":31.77,"longitude":35.21}` | Rare — only observed on `Cities.Location` (demo) |
| `ACL` | `{"<userId|role:Name|*>":{"read":true,"write":true}}` | Per-row permissions; usually empty/unused — access control is class-level (CLP) |
| `Null` | `null` | Any field can be set to `null` regardless of type |

**Atomic update operators** (REST `PUT` body values; ParseDocs 05-counters, 06-arrays):

```json
{"score":   {"__op": "Increment", "amount": 1}}
{"skills":  {"__op": "AddUnique", "objects": ["a","b"]}}
{"skills":  {"__op": "Add",       "objects": ["a"]}}
{"skills":  {"__op": "Remove",    "objects": ["a"]}}
```

**Query operators** (`where` values; ParseDocs 02-query-constraints): `$lt`, `$lte`, `$gt`, `$gte`, `$ne`, `$in`, `$nin`, `$exists`, `$select`, `$dontSelect`, `$all`, `$regex`, `$text`. Example: `{"Total":{"$gte":1000,"$lte":3000}}`; date example: `{"createdAt":{"$gte":{"__type":"Date","iso":"2026-01-01T00:00:00.000Z"}}}`.

**Type lock-in** (ParseDocs 10-data/02): the first non-null value saved to a field fixes its type forever; saving another type errors. Combined with no-rename, this means **schema mistakes are permanent** — plan field names and types before creating (`buiding`, `TypeAccoint`, `CreaditCardNumber` in the demo schema are the cautionary tales).

## 2. System fields (every table)

| Field | Type | Set by | Notes |
|---|---|---|---|
| `objectId` | String | server | **10-character** alphanumeric id (the MCP `Get-Data.objectId` parameter enforces exactly 10 chars). Exception: the pseudo-user id `"Master"` appears in pointer values written by server processes |
| `createdAt` | Date | server | immutable; returned as plain ISO string |
| `updatedAt` | Date | server | bumped on every save |
| `ACL` | ACL | app | row-level permissions; rarely populated — class-level CLP is the real mechanism |
| `createdBy` | Pointer→`_User` | server | **MyBusiness extension** (not stock Parse): audit author |
| `updatedBy` | Pointer→`_User` | server | **MyBusiness extension**: last editor |

Plus the platform-convention field `updatedByTrigger:String` on automation-touched tables (loop guard — see [04-system-tables-and-logs.md](04-system-tables-and-logs.md) §3).

Page ids, menu-item ids and trigger ids are **24-hex MongoDB ids** (`69bfd6c945604bc0d35674fb`) — a different id space from Parse 10-char objectIds. Menu items must use the MongoDB format ids.

## 3. Naming conventions observed

| Convention | Pattern | Examples |
|---|---|---|
| Tables | PascalCase, plural for entities | `Accounts`, `SaleRows`, `CourseEnrollment` |
| System classes | `_` prefix (reserved) | `_User`, `_Timeline`, `_syslogTriggers` |
| Pointer fields | `<Entity>Id` | `AccountId`, `SaleStatusId`, `OwnerId` (assignee), `CurrentUserId` |
| Display field | every lookup/entity has `Name:String` — the default `data-view-key` for dropdowns | |
| Lookup tables | `<Entity>Statuses`, `<Entity>Types`, `<X>List` | `CaseStatuses`, `TaskTypes`, `CityList` |
| Meta-state | `StateId` on a status table → fixed `*States` table | `CaseStatuses.StateId→CaseStates` |
| Status-timestamp pairs | `<Stage>StatusUpdate:Date` + `<Stage>StatusUpdateName:Pointer→_User`, filled by triggers | `QuotationStatusUpdate(Name)` on demo Sales |
| Hebrew labels | not in field names — field names are English; the Hebrew UI label lives in `_Dictionary` (`tblName`,`field`,`value`) and surfaces as the `dictionary` property in `Get-Schema` and `data-dictionary` on forms | `Sales.OwnerSetDate` → "תאריך הגדרת אחראי" |
| Draft/final twins | `<X>Draft` tables for editable documents | `AccountingHeadersDraft` → `AccountingHeaders` |
| Hebrew-English duplicates | `<X>` + `<X>Heb` on settings | `AccountingSettings.Name`/`NameHeb`, `LogoEn`/`LogoHeb` |

## 4. Hebrew label mechanism

When a field is created with a `label`, the platform writes a `_Dictionary` row; `Get-Schema` then returns it inline:

```json
"StatusId": {"type": "Pointer", "targetClass": "AccountStatuses", "dictionary": "סטאטוס"}
```

Entity-level renames (מכירה→פרויקט etc.) use the terminology dictionary tools (`Get-Terminology-Dictionary` / `Set-Terminology-Dictionary` / `Replace-Terms`) — same underlying store.

## 5. Multi-select fields — the `array_<purpose>_Pointer_<TargetTable>` convention

Simbla has no dedicated multi-select type. Instead, **the field name is the metadata**. Source: `myb-p-multi-select-field` skill; verified live on `Accounts.array_languages_Pointer_Languages` and `Sales.array_tags_Pointer_Tags`.

```
array_<purpose>_Pointer_<TargetTable>
```

| Segment | Meaning |
|---|---|
| `array_` | lowercase prefix → render as `<select multiple>` |
| `<purpose>` | free snake_case, ignored by runtime (`languages`, `tags`) |
| `_Pointer_` | literal, **capital P** — array elements are pointers |
| `<TargetTable>` | exact, case-sensitive lookup class name; runtime sets `targetclass` and fetches options |

- Schema type must be `Array` (`Add-Field-to-Table {name:"array_tags_Pointer_Tags", type:"Array", label:"תגיות"}`).
- Rendered HTML: `<select multiple targetclass="Tags" data-view-key="Name" data-search-key="Name" data-search-type="String" data-dictionary="תגיות">` driven by Select2.
- **Stored wire shape (verified live):** an array of full Pointer objects:

```json
"array_tags_Pointer_Tags": [
  {"__type":"Pointer","className":"Tags","objectId":"zY2p6jpXqm"},
  {"__type":"Pointer","className":"Tags","objectId":"io3Z6YsMcG"}
]
```

(The skill doc describes reads returning bare objectId strings; live Playground data stores full Pointer objects. Handle both shapes defensively. ⚠️)
- Query with `containedIn`, never `equalTo`: report condition `{"F":"array_tags_Pointer_Tags","C":"containedIn","V":["<objectId>"],"T":"Array"}`. Display joined names via dot-notation `array_tags_Pointer_Tags.Tags.Name`.
- Known gaps: `Edit-Page` cannot fully place a working multi-select (manual page-editor binding needed); wrong casing (`array_x_pointer_Y`) or `type:"Pointer"` silently breaks it.
- A non-conforming name (e.g. Playground's `Array_Interests`, capital A) still stores pointer arrays but does **not** get the native multi-select rendering.

## 6. Parent/child (cascading) dropdowns — `Define Parent` / `subclassDepend`

Native cascading-dropdown mechanism; **no JS, no form rules**. Source: `myb-p-parent-child-fields` skill; live example on Playground `Sales` (`DepartmentId`→`SubDepartmentId`, `ChannelId`→`SubChannelId`) and demo `CaseSubTypes.TypeId→CaseTypes`, `ItemSubTypeList.ItemType→ItemTypeList`.

Three names, one mechanism: UI **"Define Parent"** = MCP `Edit-Page` param **`subclassDepend`** = rendered attribute **`data-subclass-depend="<ParentTable>"`**.

Data-layer recipe:
1. Child lookup table gets a single `Pointer` field back to the parent table (`SalesSubDepartments.SalesDepartmentId → SalesDepartments`). One parent per child row — overlap unsupported; duplicate the row per parent.
2. Host table (e.g. `Sales`) gets two Pointer fields: one to parent table, one to child table.
3. The child field **on the form page** is tagged `subclassDepend: "<ParentTableClassName>"` (table name, **not** the host field name). Runtime then filters child options where the child row's parent-pointer equals the form's current parent selection (equality semantics).
4. The activation lives on the **page element**, not the schema — same schema can cascade on one page and not on another.

Pitfalls: `Array` parent-pointers don't cascade; two host fields pointing at the same parent table confuse resolution; `subclassDepend` can only be set on `add-new-field` (retrofit = remove+re-add the page field); form rules cannot filter dropdown options at all.

## 7. Dynamic value access — dot-notation and placeholders

**Dot-notation through pointers** (reports, report columns, conditions, trigger configs):

```
<PointerField>.<TargetClass>.<TargetField>
```

e.g. `AccountId.Accounts.Email`, `SaleStatusId.SaleStatuses.Name`, `array_tags_Pointer_Tags.Tags.Name`. Aggregation `groupby` uses the same form: `{"category": "IntegrationType.IntegrationType.Name"}`.

**Template placeholders** (trigger messages, email/SMS templates — from `Usage-Guide`):

```
{{{Name}}}                       → field value
{{{AccountId.Name}}}             → one hop through a pointer
{{{SaleDate.format(date,he-IL,Asia/Jerusalem)}}}   → date formatting: kind ∈ {date, timehm, datetime}, locale, timezone
```

PDF templates ([03-module-tables.md](03-module-tables.md) §1) use double-brace `{{Sales.AccountId.Name}}` style. ⚠️ brace-count differs by subsystem — verify per feature.

**Condition object formats** (accepted across triggers, reports, groups — from `Usage-Guide`):

```json
{ "field": "StatusId", "equesition": "equalTo", "value": "<objectId>", "visibleVal": "פעיל" }
```
(note the platform's spelling `equesition`); operators: `equalTo, greaterThan, lessThan, greaterThanOrEqualTo, lessThanOrEqualTo, notEqualTo, containedIn, notContainedIn, exists, notExist, startsWith, endsWith, contains`. Pointer values = objectId; `_User` pointers accept the magic value `"currentUser"`; date values accept `YYYY-MM-DD`, day offsets (negative ok), or tokens like `"today"`, `"30 days period"`, `"beginning of this month"`, `"end of this year"`, `"year ago"`, `"year ahead"`.

Compact form: `{"F": field, "C": condition, "T": type, "V": value, "P": pointer}` — seen in `_DynamicQueries.QueryElems` and report tooling.

## 8. Platform limits & rules (project `CLAUDE.md` + tool schemas)

| Rule | Value |
|---|---|
| `Get-Data` page size | default **5**, max **2000** (`skip` for paging) |
| `Aggregate-Data` `groupby` | must be **String** (or object of labeled groupings) — not a raw Object; pointer grouping via dot-notation; date grouping tokens: `hour, dow, q, q/yy, mm, m/yy, yy` |
| `objectId` length | 10 chars (enforced by tool schema) |
| Trigger chain depth | max 3 levels |
| Password policy | min 8 chars, ≥1 lowercase, ≥1 uppercase, ≥1 digit |
| WhatsApp identity | use `Channels.Identity`, not `objectId` |
| `Set-Form-Rules` | replaces ALL rules; use `Edit-Form-Rules` for single changes |
| Form-rule actions | `readonly, required, hidden, fixed-value, dynamic-value, formula-value, show-message, value-from-url` — none can filter dropdown options (use §6) |
| Menu-item ids | MongoDB 24-hex format |

## 9. Template input write-back — `name="Table.Field"` (known issue)

Price-quote (PDF) templates support customer-fillable `<input>`/`<textarea>` elements on the public signing page (`PriceQuoteSign`); the `name` attribute binds the value back to the database:

```html
<input type="text" id="CompanyId" name="Accounts.CompanyId">
<textarea name="Sales.Comment"></textarea>
```

On signing, values save to the bound record (e.g. the quote's Account). **Known gotcha** (from a documented investigation): templates created **through the UI** save input values correctly, but in all 6 documented attempts (2026), templates whose HTML was written via the MCP tool `Create-Update-Price-Quote-Template`, via `Update-Data` on `PDFTemplate.HTML`, or via direct REST **render the inputs but do not persist the values** — neither to the signed PDF nor to the database. Structure variations (bodyContainer, `<style>` placement, self-closing tags, table layout) made no difference; dynamic `{{...}}` values worked except in one variant. Status: open question to dev (suspected server-side metadata/flag set only by the UI editor, or demo-app limitation). **Implementation guidance:** if a quote template needs fillable inputs, create/edit the template through the UI editor until this is resolved. ⚠️ UNVERIFIED root cause.

## 10. Practical checklists

**Before creating a field:** name in English following §3; pick the type knowing it is permanent (§1 lock-in); supply the Hebrew `label`; for multi-select follow §5 exactly; for cascading dropdowns plan both tables of §6; check the page actually displays the field you write to (duplicate-field gotcha, [02-core-tables.md](02-core-tables.md)).

**Before writing data:** `Get-Schema` the tenant's table; build Pointers/Dates in the exact wire shapes of §1; remember `IsAccount` semantics on `Accounts`; never set system fields or `AutoIncrement` fields.

## Limitations & gotchas

- `PrivateFile`, `HTML/XML`, `AutoIncrement`, `createdBy`/`updatedBy` are MyBusiness/Simbla extensions — generic Parse documentation does not cover them; their server-side behavior (e.g., file ACL enforcement) is ⚠️ UNVERIFIED beyond observed responses.
- Multi-select stored shape inconsistency (Pointer objects vs objectId strings) between the skill doc and live data — handle both on read.
- The `{{{...}}}` vs `{{...}}` placeholder brace-count differs between trigger/messaging contexts and PDF templates; mixing them produces literal text.
- `equesition` and other platform spellings are canonical — "correcting" them breaks the API contract.
- Date tokens ("today", "30 days period"…) are evaluated server-side in the system's timezone context; cross-timezone behavior ⚠️ UNVERIFIED — pass explicit ISO dates for precision.
- `$text`/full-text search requires indexed fields; which fields are indexed per tenant is not visible via `Get-Schema` (only via master-key `/schemas` with index info — not exposed through MCP).
