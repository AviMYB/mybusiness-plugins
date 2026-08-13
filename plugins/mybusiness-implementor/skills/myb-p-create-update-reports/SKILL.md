---
name: myb-p-create-update-reports
description: "Create and manage reports and queries in MyBusiness CRM. Use this skill whenever the user wants to create a report, build a query, set up a dashboard view, add a data view to a page, create an aggregated/pivot report, or configure scheduled report delivery. Also use when the user mentions: reports page, dynamic queries, sales summary, leads report, cases breakdown, filtered table view, data export/CSV, cross-tab analysis, or any kind of data slicing/dicing in MyBusiness CRM. Trigger for both Hebrew and English requests."
---

# MyBusiness CRM - Reports & Queries Builder

Build reports (shown on the Reports page) and queries (filtered views on entity pages like Sales, Accounts, Cases) in the MyBusiness CRM platform.

## Two Types of Data Views

**Reports** live on `apps/mybusiness/reports` and show cross-cutting organizational data - like "all sales by month" or "open cases by type". They're standalone analytical views.

**Queries** live on entity pages (`apps/mybusiness/sales`, `apps/mybusiness/accounts`, etc.) and act as saved filters/views - like "my open tasks this week" or "active accounts by city". They appear in the query dropdown on that page.

Both are stored in the `_DynamicQueries` table and use the same `Create-or-Update-Report` tool. The difference is where they appear (PageName/PageId) and whether they have a FormName.

## Workflow

### Step 1: Understand What the User Needs

Ask (in Hebrew):
- What data do they want to see? (sales, cases, accounts, tasks, activities, etc.)
- Is this a report (Reports page) or a query (on a specific entity page)?
- Do they need raw data or aggregated summaries?
- What filters should be available?
- Who should have access?

### Step 2: Get Schema and Optional Fields

Before building any report, always run these two tools:

1. **Get-Schema** with the target className - understand the table structure, field types, and pointer relationships
2. **Get-Optional-Fields** with the target className - get the exact field/aggrField/type/text values the system expects

The Optional Fields response is critical because it gives you the exact `aggrField` format the system needs. For pointer fields, the aggrField includes the full path: `AccountId.Accounts.Name` (not just `AccountId.Name`).

### Step 3: Get Users and Roles (for permissions)

Run **Get-all-Users** and **Get-Roles** to know which users/roles to assign as permissions.

### Step 4: Build the Report

Use **Create-or-Update-Report** with the assembled configuration. See the reference file for detailed parameter documentation.

### Step 5: Verify

Run **Get-Reports** (with pageId if it's on a non-default page) to confirm the report was created correctly.

## Report Types & When to Use Each

### Regular Report (IsAggr: false)
Shows individual records in a table. Use for:
- Listing leads/accounts/sales with filters
- Detail views with per-record data
- Export-ready data dumps

### Aggregated Report (IsAggr: true)
Groups and summarizes data. Use for:
- Monthly/quarterly summaries
- Count of cases by type
- Sales totals by owner
- Any "how many" or "total of" questions

### Pivot Report (IsAggr: true + PivotInfo)
Cross-tabulation. Use for:
- Sales by owner AND by month (owner = rows, month = columns)
- Cases by type AND by quarter
- Any two-dimensional breakdown

### Report with Calculated Fields
Adds computed columns. Use for:
- Profit margins (revenue minus cost)
- Percentage calculations
- Any derived metric

### Compound Report (דוח מורכב)
Combines multiple sub-reports into a single view. Use for:
- Showing both a pivot and a detailed breakdown in one page
- Combining different perspectives on the same data (e.g., sales pivot + sales by status)
- Executive dashboards that need multiple views at once

A compound report is a **minimal record** — no ClassName, ShowFields, QueryElems, or IsAggr. It only references other reports via `SubqueriesInfo`. All referenced reports **must be aggregated** (IsAggr: true).

**To create a compound report:**

Compound reports (`SubqueriesInfo`) are **not yet exposed via an MCP tool** — the `Create-or-Update-Report` tool ignores `SubqueriesInfo`. This is a tracked tooling gap. From a session:

1. Create the individual sub-reports normally using Create-or-Update-Report — **all must be aggregated** (IsAggr: true). Note their objectIds.
2. Get the **PageId** and **FormName** from an existing report on the same page (use Get-Reports or Get-Data on `_DynamicQueries`).
3. Hand the compound assembly to the **MyBusiness team** (internal ops path; credentials are fetched at runtime via `get-secret` — never stored in files or pasted). Pass them the sub-report objectIds, PageId, and FormName; the record shape is documented in [references/report-building-guide.md](references/report-building-guide.md).
4. **Never read keys out of `.mcp.json` or paste them into commands.** If the assembly is blocked, mark the item blocked and escalate — do not go around the tool-permission layer.
5. All sub-reports (baseQuery + queries) must be **aggregated only** — compound reports don't work with regular reports.

### Scheduled Report
Automatic email delivery. Use for:
- Daily lead reports for managers
- Weekly sales summaries
- Monthly performance digests

**⚠️ Activation requires a UI save — a scheduled report created via tools does NOT send on its own.** The scheduler depends on a front-end component that is only initialized when the report is saved from the report generator UI. Writing the record (Create-or-Update-Report or a direct `_DynamicQueries` write) is not enough, even when all fields are correct. After creating or updating a scheduled report, **always instruct the user (in Hebrew) to open the report generator on that specific report and click Save (שמירה)** — that save activates the front-end component the schedule needs. Until it happens, no email is sent. See [references/report-building-guide.md](references/report-building-guide.md) §Scheduled Reports for the exact handoff instruction.

## Reference Files

For detailed parameter documentation, field format examples, and real-world report patterns:

- **[references/report-building-guide.md](references/report-building-guide.md)** - Complete parameter reference for Create-or-Update-Report, field format rules, QueryElems conditions, aggregation functions, pivot setup, calculated fields, permissions, common patterns and examples.

## Filter Layout Rules (GridDivider & QueryElems ordering)

The filter area above the report must look clean and compact. A report with filters stretched across the full page width looks unprofessional and wastes screen space.

### GridDivider — always use 3 or 4
- **Always set GridDivider to 3 (4 per row) or 4 (3 per row)**. The ideal default is **3** (4 filters per row).
- Never use GridDivider=12 (1 per row) or GridDivider=6 (2 per row) — these create ugly, stretched-out filter layouts.
- Even if a report has only 2 filters, keep GridDivider=3 or 4. The empty grid cells are fine — stretched filters are not.

### Boolean/Checkbox filter placement
Boolean filters (checkboxes like "לידים בלבד", "לקוחות בלבד", "פניות פתוחות") must be placed:
- **As far left as possible** in the row (in RTL layout, left = end of row)
- **As far down as possible** — on the last row of filters
- If there's only one row of filters: place the checkbox as the **last (leftmost) element**
- If there are multiple rows: place the checkbox on the **bottom row, leftmost position**

In practice, this means the Boolean QueryElem should be the **last item** in the QueryElems array, since the UI renders filters from right to left, top to bottom. The last filter in the array ends up at the bottom-left position.

### Filter ordering best practice
Order QueryElems like this (right-to-left, top-to-bottom):
1. Text search fields (Name contains, Phone contains)
2. Pointer multi-select filters (Status, Type, Owner)
3. Date range pairs (from date, to date)
4. Boolean checkboxes (IsAccount, IsClosed) — always last

## The Three-Field Trinity (Critical for Aggregate Reports)

For each column in an aggregate report, three values must align — get one wrong and the report fails silently or throws "Group object must contain values".

| Property | Format | Example for `AccountId.Name` column |
|----------|--------|-------------------------------------|
| `ShowFields[i]` | dot notation, no table name | `"AccountId.Name"` |
| `OptionalFields[i].field` | **same as `ShowFields[i]`** | `"AccountId.Name"` |
| `OptionalFields[i].aggrField` | full path with table name | `"AccountId.Accounts.Name"` |

**Common mistake** (causes empty results / wrong rendering): setting `field: "AccountId"` (the pointer object) instead of `field: "AccountId.Name"` (the displayed string).

**Same trinity for User pointers** (note lowercase `name`):
- `ShowFields`: `"OwnerId.name"`
- `field`: `"OwnerId.name"`
- `aggrField`: `"OwnerId._User.name"`

Always run `Get-Optional-Fields(className)` first and copy the exact `field` and `aggrField` values from its response.

## Key Rules

1. **Always Get-Optional-Fields first** - the aggrField format must match exactly what the system returns
2. **ShowFields use dot notation without table name**: `AccountId.Name` (not `AccountId.Accounts.Name`)
3. **OptionalFields aggrField uses full path with table**: `AccountId.Accounts.Name`
4. **OptionalFields `field` must match `ShowFields` entry** — see Three-Field Trinity above
5. **Aggregate reports must include `ShowFields`** — without it, columns may not render even when OptionalFields is correct
6. **Add `exists` filter on group-by field** to prevent "Group object must contain values" — see Troubleshooting
7. **Permissions are required on create** - use `role:RoleName` for roles, objectId for specific users
8. **editPermissions required when using master key** - set to a valid user objectId
9. **FormName is needed for entity page queries** - format is `dynamic-table-formP<number>` (get from existing queries on that page)
10. **GridDivider: always 3 (=4 per row) or 4 (=3 per row)**. Never 6 or 12. Default to 3.
11. **Sort with minus prefix** for descending: `-createdAt`
12. **Pointer QueryElems need P object** with targetClass (and multiple:true for containedIn)
13. **Date range filters come in pairs**: greaterThanOrEqualTo + lessThanOrEqualTo
14. **Boolean filters go last** in QueryElems array (renders bottom-left in RTL)
15. **Scheduled reports need a UI save to activate** — after any tool-side create/update of a scheduled report, instruct the user to open that report in the report generator and click Save; without it the schedule never fires

## Troubleshooting

### "Group object must contain values" Error

This error occurs when an aggregate report tries to group by a field that is NULL in some records. The Mongo aggregation pipeline can't generate a group key from a missing value.

**Fix**: add an `exists` filter on the group-by field as a default QueryElem:

```json
{
  "QueryElems": [
    {"F": "Industry", "C": "exists", "T": "String", "FText": "תעשייה קיימת"}
  ]
}
```

For pointer fields:
```json
{"F": "OwnerId", "C": "exists", "T": "Pointer", "P": {"targetClass": "_User"}, "FText": "אחראי קיים"}
```

This ensures only records with non-null group-by values reach the aggregator. The user can override the filter from the UI to see records without the field.

### Empty Aggregate Results

If the aggregate report runs without errors but shows no data:
1. Verify `field` matches what's in `ShowFields` (Three-Field Trinity)
2. Verify `aggrField` includes the className (e.g., `AccountId.Accounts.Name`, not `AccountId.Name`)
3. Check that records actually exist matching the QueryElems default values

### "Cannot create property 'Name' on string" (in tables, not reports)

If you see this error on a list page (not in a report), you have `data-type="Pointer"` on a column that displays `<Pointer>.Name` — change it to `data-type="String"`. See `myb-p-create-entity` Constraint 9.
