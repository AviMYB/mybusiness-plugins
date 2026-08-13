# Report Building Guide - Complete Reference

## Table of Contents
1. [Create-or-Update-Report Parameters](#parameters)
2. [ShowFields Format](#showfields)
3. [OptionalFields Format](#optionalfields)
4. [QueryElems Format](#queryelems)
5. [Aggregation & Grouping](#aggregation)
6. [Pivot Tables](#pivot)
7. [Calculated Fields](#calculated-fields)
8. [Scheduled Reports](#scheduled-reports)
9. [Permissions](#permissions)
10. [Entity Page Queries](#entity-page-queries)
11. [Common Patterns & Examples](#examples)

---

## Parameters

### Required on Create
| Parameter | Type | Description |
|-----------|------|-------------|
| Name | String | Display name of the report (Hebrew) |
| ClassName | String | Target table: Sales, Accounts, Cases, Tasks, Activities, Contacts, SaleRows, PriceQuotes, Emails, AccountingHeaders, etc. |
| permissions | Array | Who can view: `["role:Admin", "role:Sales", "2b0QVKoigE"]` |
| editPermissions | String | User objectId who can edit (required when using master key) |

### Location
| Parameter | Type | Description |
|-----------|------|-------------|
| PageName | String | Page path, e.g., `apps/mybusiness/reports` or `apps/mybusiness/sales` |
| PageId | String | Page ID (optional, system resolves from PageName) |
| FormName | String | Form element name - needed for entity page queries, e.g., `dynamic-table-formP144` |

### Display
| Parameter | Type | Description |
|-----------|------|-------------|
| ShowFields | Array | Fields to display as columns: `["Name", "AccountId.Name", "Total"]` |
| OptionalFields | Array | Field configuration with display names and summary functions |
| Sort | String | Sort field. Prefix `-` for descending: `-createdAt`, `Total` |
| ShowSum | String | Summary row title, e.g., `"סה\"כ"`. Activates summary row. |
| GridDivider | Number | Filter layout: **always use 3 (=4/row, ideal) or 4 (=3/row)**. Never 6 or 12. |
| AllowCsv | Boolean | Enable CSV export button |
| Url2Link | Boolean | Render URLs as clickable links |
| Default | Boolean | Set as default query on entity page |

### Data Shape
| Parameter | Type | Description |
|-----------|------|-------------|
| IsAggr | Boolean | Aggregated report (grouped/summarized) vs raw data |
| PivotInfo | Object | Pivot configuration: `{col, row, value}` |
| CalculatedFields | Array | Computed columns |
| QueryElems | Array | Filter/query controls |

### Scheduling
| Parameter | Type | Description |
|-----------|------|-------------|
| ScheduleSendAt | Object | `{interval: "daily"|"weekly"|"monthly", hour: 8, occurrence: []}` |
| ScheduleSendTo | String | Email addresses, comma-separated |

---

## ShowFields

ShowFields determines which columns appear in the results table. Use dot notation for pointer fields, but **without the intermediate table name**:

```
Direct field:     "Name", "Total", "createdAt", "Email"
Pointer field:    "AccountId.Name"     (NOT "AccountId.Accounts.Name")
Pointer chain:    "OwnerId.name"       (User table uses lowercase 'name')
Status pointer:   "SaleStatusId.Name"
Deep pointer:     "SaleId.AccountId"   (shows the pointer reference)
```

### Important: User table field is lowercase
The `_User` table has `name` (lowercase), not `Name`:
- `OwnerId.name` (correct)
- `createdBy.name` (correct)

---

## OptionalFields

OptionalFields configures how each column behaves - display name, summary function, and aggregation. Each entry needs at minimum `field` and `summary`.

### For Regular Reports (IsAggr: false)

```json
{
  "field": "AccountId.Name",
  "summary": "",
  "text": "לקוח"
}
```

Summary options for the bottom summary row:
- `""` - no summary
- `"count"` - count of values (works for any field type)
- `"sum"` - sum (Number fields only)
- `"avg"` - average (Number fields only)
- `"min"` / `"max"` - min/max (Number or Date fields)

### For Aggregated Reports (IsAggr: true)

Must include `aggrField` and `aggrFunc`:

```json
{
  "field": "createdAt",
  "summary": "",
  "text": "חודש",
  "aggrField": "createdAt",
  "aggrFunc": "mm/yy"
}
```

The `aggrField` format uses the **full path with table name** (as returned by Get-Optional-Fields):
- Direct: `"createdAt"`, `"Total"`, `"Name"`
- Pointer: `"AccountId.Accounts.Name"`, `"OwnerId._User.name"`, `"SaleStatusId.SaleStatuses.Name"`

### aggrFunc Values

**For grouping (no aggrFunc = group by this field):**
| aggrFunc | Description | Use for |
|----------|-------------|---------|
| `""` or omitted | Group by this field | String fields used as row labels |
| `"dow"` | Day of week | Date fields |
| `"q"` | Quarter (1-4) | Date fields |
| `"q/yy"` | Quarter/Year (Q1/24) | Date fields |
| `"mm"` | Month (01-12) | Date fields |
| `"mm/yy"` | Month/Year (03/24) | Date fields - most common |
| `"yy"` | Year (2024) | Date fields |
| `"dd/mm/yy"` | Full date | Date fields |
| `"mm/dd/yy"` | US date format | Date fields |

**For aggregation:**
| aggrFunc | Description | Use for |
|----------|-------------|---------|
| `"count"` | Count records | Any field - counts non-null values |
| `"sum"` | Sum values | Number fields |
| `"avg"` | Average | Number fields |
| `"min"` | Minimum | Number fields |
| `"max"` | Maximum | Number fields |

### Date Display Formats (dateFormat)

For non-aggregated date fields, control display format:
- `"DateTime"` - Full date and time
- `"Date"` - Date only
- `"Time"` - Time only
- `"Year"` - Year only
- `"Q/YY"` - Quarter/Year
- `"MM/YY"` - Month/Year
- `"Month"` - Month name
- `"Quarter"` - Quarter name

---

## QueryElems

QueryElems define the filter controls users see above the report. Each filter has:

```json
{
  "F": "fieldName",
  "FText": "Display label in Hebrew",
  "C": "condition",
  "T": "fieldType",
  "V": "defaultValue",
  "P": { "targetClass": "TableName", "multiple": true }
}
```

### Conditions (C)

| Condition | Use with | Description |
|-----------|----------|-------------|
| `"equalTo"` | All types | Exact match |
| `"notEqualTo"` | All types | Not equal |
| `"contains"` | String | Substring search |
| `"startsWith"` | String | Starts with |
| `"greaterThan"` | Number, Date | Greater than |
| `"greaterThanOrEqualTo"` | Number, Date | Greater than or equal |
| `"lessThan"` | Number, Date | Less than |
| `"lessThanOrEqualTo"` | Number, Date | Less than or equal |
| `"containedIn"` | Pointer | Multi-select from list |
| `"exists"` | All types | Field has value |
| `"doesNotExist"` | All types | Field is empty |

### Field Types (T)

`"String"`, `"Number"`, `"Date"`, `"Boolean"`, `"Pointer"`, `"AutoIncrement"`

### Pointer Filters

For Pointer type, add the `P` object:

```json
{
  "F": "SaleStatusId",
  "FText": "סטטוס מכירה",
  "C": "containedIn",
  "T": "Pointer",
  "V": [],
  "P": { "targetClass": "SaleStatuses", "multiple": true }
}
```

- `containedIn` + `multiple: true` = multi-select dropdown
- `equalTo` without `multiple` = single-select dropdown
- For current user filter: `"V": "currentUser"`

### Deep Pointer Filters

Filter by a field on a related table:

```json
{
  "F": "AccountId.Accounts.Name",
  "C": "contains",
  "T": "String",
  "FText": "שם לקוח"
}
```

### QueryElems Ordering (critical for layout)

The UI renders filters right-to-left, top-to-bottom. The order of items in the QueryElems array determines their position on screen. Follow this order:

1. **Text search fields** first (Name, Phone, Email — these go top-right)
2. **Pointer multi-select** next (Status, Type, Owner dropdowns)
3. **Date range pairs** (from date + to date)
4. **Boolean checkboxes last** (IsAccount, IsClosed — these end up bottom-left)

Boolean filters as the last element in the array ensures they render at the bottom-left corner of the filter grid — which is the natural position for a small checkbox control.

### Common Filter Patterns

**Date range (always in pairs):**
```json
{"F": "createdAt", "C": "greaterThanOrEqualTo", "T": "Date", "FText": "מתאריך"},
{"F": "createdAt", "C": "lessThanOrEqualTo", "T": "Date", "FText": "עד תאריך"}
```

**Status multi-select:**
```json
{"F": "StatusId", "C": "containedIn", "T": "Pointer", "V": [], "P": {"targetClass": "CaseStatuses", "multiple": true}, "FText": "סטטוס"}
```

**Owner = current user:**
```json
{"F": "OwnerId", "C": "equalTo", "T": "Pointer", "V": "currentUser", "P": {"targetClass": "_User"}, "FText": "אחראי"}
```

**Boolean filter (e.g., leads only):**
```json
{"F": "IsAccount", "C": "equalTo", "T": "Boolean", "V": false, "FText": "לידים בלבד"}
```

**Text search:**
```json
{"F": "Name", "C": "contains", "T": "String", "V": "", "FText": "חיפוש שם"}
```

---

## Aggregation

When `IsAggr: true`, the report groups and summarizes data instead of showing individual records.

### How It Works

In OptionalFields:
- Fields **without** aggrFunc (or with `""`) act as **group-by** dimensions
- Fields **with** aggrFunc act as **measures** (count, sum, avg, min, max)
- Date fields with time-based aggrFunc (mm/yy, q/yy, etc.) are grouped by that time period

### Example: Sales by Owner by Month

```json
{
  "IsAggr": true,
  "ShowFields": ["OwnerId.name", "Total", "createdAt"],
  "OptionalFields": [
    {"field": "OwnerId.name", "summary": "", "text": "אחראי", "aggrField": "OwnerId._User.name"},
    {"field": "createdAt", "summary": "", "text": "חודש", "aggrField": "createdAt", "aggrFunc": "mm/yy"},
    {"field": "Total", "summary": "sum", "text": "סה\"כ מכירות", "aggrField": "Total", "aggrFunc": "sum"}
  ]
}
```

This produces a table with one row per owner per month, showing the sum of Total.

---

## Pivot

Pivot tables create a cross-tabulation matrix. Requires `IsAggr: true`.

```json
{
  "PivotInfo": {
    "row": "OwnerId.name",
    "col": "createdAt",
    "value": "Total"
  }
}
```

- **row**: The field that becomes row headers (must be a group-by field in OptionalFields)
- **col**: The field that becomes column headers (usually a date with aggrFunc)
- **value**: The field whose aggregated value fills the cells

### Example: Sales Pivot - Owners x Months

Rows = sales owners, Columns = months, Values = sum of sales total.

The OptionalFields must have matching aggrFunc configuration:
- row field: no aggrFunc (group-by)
- col field: aggrFunc like `mm/yy`
- value field: aggrFunc like `sum`

---

## Calculated Fields

Add computed columns that derive from other columns in the report.

```json
{
  "CalculatedFields": [
    {
      "name": "מחיר לפני הנחה",
      "fieldA": "PricePerUnit",
      "fieldB": "Quantity",
      "action": "Times"
    },
    {
      "name": "שיעור הנחה",
      "fieldA": "מחיר לפני הנחה",
      "fieldB": "Total",
      "action": "Divide (%)"
    }
  ]
}
```

### Actions
| Action | Operation |
|--------|-----------|
| `"Plus"` | fieldA + fieldB |
| `"Minus"` | fieldA - fieldB |
| `"Times"` | fieldA * fieldB |
| `"Divide"` | fieldA / fieldB |
| `"Divide (%)"` | (fieldA / fieldB) * 100 |

You can chain calculated fields - use the `name` of a previous calculated field as `fieldA` or `fieldB` in a subsequent one.

---

## Scheduled Reports

Automatic email delivery of report results.

```json
{
  "ScheduleSendAt": {
    "interval": "daily",
    "hour": 8,
    "occurrence": []
  },
  "ScheduleSendTo": "manager@company.com,team@company.com"
}
```

### Intervals
| Interval | occurrence | Description |
|----------|-----------|-------------|
| `"daily"` | `[]` | Every day at specified hour |
| `"weekly"` | `[0,1,2,3,4,5,6]` | Specific days (0=Sunday) |
| `"monthly"` | `[1,15]` | Specific days of month |

### ⚠️ Activation requires a UI save (critical)

**A scheduled report will NOT send if it was only created by writing the record** — via `Create-or-Update-Report` or a direct write to `_DynamicQueries`. Alongside the record there is a front-end component that must be updated from the UI; it is only initialized/refreshed when the report is saved from the report generator. Until that happens the schedule never fires, even when `ScheduleSendAt`, `ScheduleSendTo`, `PageId`, and `FormName` are all correct.

**Mandatory handoff step** — after any tool-side create or update of a scheduled report, instruct the user:

> היכנס/י למחולל הדוחות, פתח/י את הדוח "&lt;שם הדוח&gt;" לעריכה, ולחץ/י **שמירה** — בלי לשנות דבר. השמירה מה-UI מאקטבת את הרכיב שנדרש להפעלת התזמון; בלעדיה הדוח המתוזמן לא יישלח.

Treat the report as "scheduled" only after the user confirms the UI save was done. Verifying the record exists in `_DynamicQueries` (Get-Reports) is NOT sufficient verification for scheduling.

**Known issue**: The scheduling feature (`ScheduleSendAt` + `ScheduleSendTo`) causes a `Simbla is not defined` error in some environments (especially the demo environment). This is a platform-level bug, not a syntax issue. If you encounter this error:
1. Create the report first **without** ScheduleSendAt/ScheduleSendTo
2. The scheduling can be configured manually through the CRM UI after report creation
3. Always ensure ScheduleSendTo has a valid email when ScheduleSendAt is set

---

## Compound Reports (דוח מורכב)

A compound report combines multiple sub-reports into a single view. It acts as a container — it doesn't have its own data, columns, or filters. Instead, it references existing reports by their objectIds.

### Structure

The compound report record in `_DynamicQueries` is minimal — no ClassName, ShowFields, OptionalFields, etc:

### Important: MCP tool does NOT support compound reports

The `Create-or-Update-Report` MCP tool ignores `SubqueriesInfo` and creates a regular report instead. Compound assembly is **not yet exposed via an MCP tool** — this is a tracked tooling gap. From a session, mark the compound step as blocked and hand it to the MyBusiness team (internal ops path); never go around the tool-permission layer.

### How to create step by step

1. **Get PageId and FormName** from an existing report on the target page (use `Get-Data` on `_DynamicQueries` with a `where` filter, or `Get-Reports`).
2. **Hand the assembly to the MyBusiness team** (internal ops path) with the sub-report objectIds, PageId, and FormName. The team writes the record to `_DynamicQueries`; credentials are fetched at runtime via the `get-secret` CLI (secrets-manager skill) — never stored in files or pasted. Never read keys out of `.mcp.json` or paste them into commands.
3. **Record payload shape** (what the executing team writes to `_DynamicQueries`):

```json
{
  "Name": "\u05d3\u05d5\u05d7 \u05de\u05d5\u05e8\u05db\u05d1",
  "PageId": "<from existing report>",
  "PageName": "apps/mybusiness/reports",
  "FormName": "<from existing report>",
  "Default": false,
  "SubqueriesInfo": {
    "baseQuery": "<baseReportObjectId>",
    "queries": ["<report2Id>", "<report3Id>"]
  },
  "ACL": {"role:Admin": {"read": true}, "<userId>": {"read": true, "write": true}}
}
```

### Rules

- **baseQuery** (required): objectId of the main report. **Must be aggregated** (IsAggr: true).
- **queries** (optional): Array of objectIds of additional reports. Up to 3 secondary reports. **All must be aggregated**.
- **Required fields**: Name, PageId, PageName, FormName, Default (false), SubqueriesInfo, ACL
- **Do NOT include** ClassName, ShowFields, OptionalFields, QueryElems, IsAggr, Sort, ShowSum, GridDivider, AllowCsv, PivotInfo, or CalculatedFields.
- The compound report inherits the filters (QueryElems) from the baseQuery report.
- In the UI, each sub-report appears as a clickable link. Clicking shows that sub-report's results.
- The record uses **ACL format** (not permissions/editPermissions) because it is written directly to `_DynamicQueries`, not through the report tool.
- **Use Hebrew in Name via unicode escapes** (`\u05d3\u05d5\u05d7`) if the executing environment has UTF-8 encoding issues.
- **Credentials**: held only by the MyBusiness team's internal ops path, fetched at runtime via the `get-secret` CLI (secrets-manager skill) — never stored in files, never read from `.mcp.json`, never pasted into commands.

### How to Create

1. Create the base report via MCP tool (must be aggregated) — note its objectId
2. Create additional sub-reports via MCP tool (all must be aggregated) — note their objectIds
3. Get PageId and FormName from an existing report (use Get-Data on `_DynamicQueries`)
4. Hand the compound assembly (the payload shape above, with the collected objectIds/PageId/FormName) to the MyBusiness team — internal ops path; credentials only via `get-secret` at runtime

### Example: Sales Dashboard Compound

```json
// Step 1: Already have these reports:
// - "פיבוט מכירות" (objectId: "abc123", IsAggr: true, pivot)
// - "סיכום מכירות לפי רבעון" (objectId: "def456", IsAggr: true)
// - "דוח מכירות מפורט" (objectId: "ghi789", IsAggr: false)

// Step 2: Create compound report
{
  "Name": "דשבורד מכירות מורכב",
  "PageName": "apps/mybusiness/reports",
  "SubqueriesInfo": {
    "baseQuery": "abc123",
    "queries": ["def456", "ghi789"]
  },
  "permissions": ["role:Admin", "role:Sales"],
  "editPermissions": "<userId>"
}
```

---

## Permissions

### View Permissions (permissions array)
Who can see and use the report:
- By role: `"role:Admin"`, `"role:Sales"`, `"role:CRM"`, `"role:Support"`
- By user: `"2b0QVKoigE"` (user objectId)
- Mix both: `["role:Admin", "role:Sales", "2b0QVKoigE"]`

### Edit Permissions (editPermissions string)
Who can modify the report. Single user objectId. Required when creating via master key.

### Common Role Names
Run `Get-Roles` to get actual roles for the customer. Common defaults:
- `Admin` - Full access
- `Sales` - Sales team
- `CRM` - CRM users
- `Support` - Support team
- `Lead Admin` - Lead management
- `Report Admin` - Report management
- `MyBooks Admin` - Accounting
- `Campaign Manager` - Marketing
- `MyChatUser` / `MyChatAdmin` - Chat

---

## Entity Page Queries

Queries on entity pages need PageName/PageId and typically a FormName.

### Key Pages and IDs

| Page | PageName | Common FormName |
|------|----------|----------------|
| Sales | apps/mybusiness/sales | dynamic-table-formP144 |
| Accounts | apps/mybusiness/accounts | dynamic-table-formP98 |
| Leads | apps/mybusiness/leads | dynamic-table-formP98 |
| Cases | apps/mybusiness/cases | *(get from existing)* |
| Tasks | apps/mybusiness/tasks | *(get from existing)* |
| Contacts | apps/mybusiness/contacts | *(get from existing)* |
| Activities | apps/mybusiness/activities | *(get from existing)* |

### Getting the FormName

If you don't know the FormName for a page:
1. Run `Get-Reports` with the pageId
2. Look at existing queries on that page
3. Copy their FormName value

### Entity Query Differences from Reports

- `ClassName` can be omitted (defaults to the page's entity)
- `Default: true` sets this as the default view when the page loads
- `FormName` must match the table element on the page
- Usually fewer filter controls (3-5) than reports
- Sort by relevance to the entity context

---

## Examples

### Example 1: Simple Sales Report

```json
{
  "Name": "דוח מכירות מפורט",
  "ClassName": "Sales",
  "PageName": "apps/mybusiness/reports",
  "IsAggr": false,
  "AllowCsv": true,
  "ShowFields": ["AccountId.Name", "Name", "SaleStatusId.Name", "OwnerId.name", "Total", "ClosingDate", "createdAt"],
  "OptionalFields": [
    {"field": "AccountId.Name", "summary": "", "text": "לקוח"},
    {"field": "Name", "summary": "", "text": "שם מכירה"},
    {"field": "SaleStatusId.Name", "summary": "", "text": "סטטוס"},
    {"field": "OwnerId.name", "summary": "", "text": "אחראי"},
    {"field": "Total", "summary": "sum", "text": "סכום"},
    {"field": "ClosingDate", "summary": "", "text": "תאריך סגירה"},
    {"field": "createdAt", "summary": "", "text": "תאריך יצירה"}
  ],
  "QueryElems": [
    {"F": "createdAt", "C": "greaterThanOrEqualTo", "T": "Date", "FText": "מתאריך"},
    {"F": "createdAt", "C": "lessThanOrEqualTo", "T": "Date", "FText": "עד תאריך"},
    {"F": "SaleStatusId", "C": "containedIn", "T": "Pointer", "V": [], "P": {"targetClass": "SaleStatuses", "multiple": true}, "FText": "סטטוס"},
    {"F": "OwnerId", "C": "containedIn", "T": "Pointer", "V": [], "P": {"targetClass": "_User", "multiple": true}, "FText": "אחראי"},
    {"F": "AccountId.Accounts.Name", "C": "contains", "T": "String", "FText": "שם לקוח"}
  ],
  "Sort": "-createdAt",
  "ShowSum": "סה\"כ",
  "GridDivider": 4,
  "permissions": ["role:Admin", "role:Sales"],
  "editPermissions": "<userId>"
}
```

### Example 2: Aggregated Pivot - Sales by Owner by Month

```json
{
  "Name": "סיכום מכירות לפי חודש ואחראי",
  "ClassName": "Sales",
  "PageName": "apps/mybusiness/reports",
  "IsAggr": true,
  "AllowCsv": true,
  "ShowFields": ["OwnerId.name", "Total", "createdAt"],
  "OptionalFields": [
    {"field": "OwnerId.name", "summary": "", "text": "אחראי", "aggrField": "OwnerId._User.name"},
    {"field": "createdAt", "summary": "", "text": "חודש", "aggrField": "createdAt", "aggrFunc": "mm/yy"},
    {"field": "Total", "summary": "sum", "text": "סה\"כ מכירות", "aggrField": "Total", "aggrFunc": "sum"}
  ],
  "PivotInfo": {"col": "createdAt", "row": "OwnerId.name", "value": "Total"},
  "QueryElems": [
    {"F": "createdAt", "C": "greaterThanOrEqualTo", "T": "Date", "FText": "מתאריך"},
    {"F": "createdAt", "C": "lessThanOrEqualTo", "T": "Date", "FText": "עד תאריך"}
  ],
  "GridDivider": 6,
  "ShowSum": "סה\"כ",
  "permissions": ["role:Admin", "role:Sales"],
  "editPermissions": "<userId>"
}
```

### Example 3: Entity Page Query - My Open Tasks

```json
{
  "Name": "המשימות שלי השבוע",
  "ClassName": "Tasks",
  "PageName": "apps/mybusiness/tasks",
  "FormName": "dynamic-table-formP<number>",
  "IsAggr": false,
  "ShowFields": ["Name", "AccountId.Name", "TypeId.Name", "StatusId.Name", "OwnerId.name", "Date"],
  "OptionalFields": [
    {"field": "Name", "summary": "count", "text": "שם"},
    {"field": "AccountId.Name", "summary": "", "text": "לקוח"},
    {"field": "TypeId.Name", "summary": "", "text": "סוג"},
    {"field": "StatusId.Name", "summary": "", "text": "סטטוס"},
    {"field": "OwnerId.name", "summary": "", "text": "אחראי"},
    {"field": "Date", "summary": "", "text": "תאריך יעד"}
  ],
  "QueryElems": [
    {"F": "OwnerId", "C": "equalTo", "T": "Pointer", "V": "currentUser", "P": {"targetClass": "_User"}, "FText": "אחראי"},
    {"F": "Date", "C": "lessThanOrEqualTo", "T": "Date", "V": "today", "FText": "עד תאריך"},
    {"F": "StatusId", "C": "containedIn", "T": "Pointer", "V": [], "P": {"targetClass": "TaskStatuses", "multiple": true}, "FText": "סטטוס"}
  ],
  "Sort": "Date",
  "Default": false,
  "permissions": ["role:Admin", "role:CRM"],
  "editPermissions": "<userId>"
}
```

### Example 4: Report with Calculated Fields

```json
{
  "Name": "דוח שורות מכירה עם הנחות",
  "ClassName": "SaleRows",
  "PageName": "apps/mybusiness/reports",
  "IsAggr": false,
  "ShowFields": ["SaleId.Name", "ProductId.Name", "Quantity", "PricePerUnit", "Discount", "Total"],
  "OptionalFields": [
    {"field": "SaleId.Name", "summary": "", "text": "מכירה"},
    {"field": "ProductId.Name", "summary": "", "text": "מוצר"},
    {"field": "Quantity", "summary": "sum", "text": "כמות"},
    {"field": "PricePerUnit", "summary": "", "text": "מחיר ליחידה"},
    {"field": "Discount", "summary": "avg", "text": "הנחה %"},
    {"field": "Total", "summary": "sum", "text": "סה\"כ"}
  ],
  "CalculatedFields": [
    {"name": "מחיר לפני הנחה", "fieldA": "PricePerUnit", "fieldB": "Quantity", "action": "Times"},
    {"name": "שיעור הנחה", "fieldA": "מחיר לפני הנחה", "fieldB": "Total", "action": "Minus"}
  ],
  "QueryElems": [
    {"F": "SaleId.Sales.createdAt", "C": "greaterThanOrEqualTo", "T": "Date", "FText": "מתאריך"},
    {"F": "SaleId.Sales.createdAt", "C": "lessThanOrEqualTo", "T": "Date", "FText": "עד תאריך"},
    {"F": "ProductId", "C": "containedIn", "T": "Pointer", "V": [], "P": {"targetClass": "Products", "multiple": true}, "FText": "מוצר"}
  ],
  "Sort": "-Total",
  "ShowSum": "סה\"כ",
  "permissions": ["role:Admin", "role:Sales"],
  "editPermissions": "<userId>"
}
```

### Example 5: Cases Count by Type - Aggregated

```json
{
  "Name": "ספירת פניות לפי סוג וחודש",
  "ClassName": "Cases",
  "PageName": "apps/mybusiness/reports",
  "IsAggr": true,
  "ShowFields": ["CaseTypeId.Name", "Number", "createdAt"],
  "OptionalFields": [
    {"field": "CaseTypeId.Name", "summary": "", "text": "סוג פנייה", "aggrField": "CaseTypeId.CaseTypes.Name"},
    {"field": "createdAt", "summary": "", "text": "חודש", "aggrField": "createdAt", "aggrFunc": "mm/yy"},
    {"field": "Number", "summary": "", "text": "כמות פניות", "aggrField": "Number", "aggrFunc": "count"}
  ],
  "PivotInfo": {"col": "createdAt", "row": "CaseTypeId.Name", "value": "Number"},
  "QueryElems": [
    {"F": "createdAt", "C": "greaterThanOrEqualTo", "T": "Date", "FText": "מתאריך"},
    {"F": "createdAt", "C": "lessThanOrEqualTo", "T": "Date", "FText": "עד תאריך"}
  ],
  "GridDivider": 6,
  "permissions": ["role:Admin", "role:Support"],
  "editPermissions": "<userId>"
}
```

### Example 6: Aggregate by Pointer (avoids "Group object must contain values")

The pattern that's most commonly broken — sales pipeline grouped by sale status. Read the Three-Field Trinity in the SKILL.md before configuring.

```json
{
  "Name": "Pipeline מכירות לפי שלב",
  "ClassName": "Sales",
  "PageName": "apps/mybusiness/reports",
  "IsAggr": true,
  "AllowCsv": true,
  "ShowFields": ["SaleStatusId.Name", "Total"],
  "OptionalFields": [
    {
      "field": "SaleStatusId.Name",
      "aggrField": "SaleStatusId.SaleStatuses.Name",
      "aggrFunc": "",
      "type": "String",
      "summary": "",
      "text": "שלב"
    },
    {
      "field": "Total",
      "aggrField": "Total",
      "aggrFunc": "sum",
      "type": "Number",
      "summary": "sum",
      "text": "סה\"כ"
    }
  ],
  "QueryElems": [
    {"F": "SaleStatusId", "C": "exists", "T": "Pointer",
     "P": {"targetClass": "SaleStatuses"}, "FText": "שלב קיים"}
  ],
  "Sort": "-Total",
  "ShowSum": "סה\"כ",
  "GridDivider": 3,
  "permissions": ["role:CRM", "role:Admin"],
  "editPermissions": "<userId>"
}
```

Three things to notice:
1. `field` is `"SaleStatusId.Name"` (the displayed string), NOT `"SaleStatusId"` (the pointer object).
2. `ShowFields` includes the same path as `field` — these MUST match.
3. `QueryElems` includes an `exists` filter on the group-by pointer — this prevents the "Group object must contain values" error when some records have NULL `SaleStatusId`.

The same pattern applies to grouping by:
- User pointer: `field: "OwnerId.name"` + `aggrField: "OwnerId._User.name"` + `{F: "OwnerId", C: "exists", T: "Pointer", P: {targetClass: "_User"}}`
- Status pointer: `field: "StatusId.Name"` + `aggrField: "StatusId.<StatusTable>.Name"` + exists filter
- Direct string field: `field: "Industry"` + `aggrField: "Industry"` + `{F: "Industry", C: "exists", T: "String"}`

## Updating a Report

To update an existing report, pass `reportId` alongside the `report` object:

```json
{
  "reportId": "existingObjectId",
  "report": {
    "Name": "שם חדש",
    "ShowFields": ["updated", "fields"]
  }
}
```

Only include the fields you want to change. Use `Get-Reports` first to find the report's objectId.

## Troubleshooting

### "Simbla is not defined" Error
This can happen with ScheduleSendAt when ScheduleSendTo is empty. Always provide a valid email when using scheduling.

### Scheduled report never sends
The record exists in `_DynamicQueries` with correct ScheduleSendAt/ScheduleSendTo, but no email arrives:
1. **Was the report saved from the report generator UI?** This is the #1 cause — a tool-created schedule stays inactive until the user opens that report in the report generator and clicks Save (see §Scheduled Reports → Activation requires a UI save).
2. Verify `PageId` and `FormName` are present on the record (copy from a working report on the same page).
3. Verify `ScheduleSendTo` holds a valid, comma-separated email list.

### Report shows no data
- Check QueryElems default values - a Boolean filter with `V: true` might be filtering everything out
- Verify ClassName is correct
- Check permissions - the viewing user must have the right role

### Pivot shows empty
- Ensure all three PivotInfo fields (col, row, value) match fields in ShowFields
- The col field must have a date aggrFunc for time-based pivots
- The value field must have an aggregation aggrFunc (sum, count, etc.)

### Columns appear but with wrong names
- Check OptionalFields `text` values - they control the column headers
- Make sure each ShowFields entry has a corresponding OptionalFields entry
