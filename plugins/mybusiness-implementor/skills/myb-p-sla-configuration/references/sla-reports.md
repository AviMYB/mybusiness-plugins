# SLA Reports — The Three Standard Reports Every SLA-Equipped CRM Needs

Whenever you configure SLA for a customer, also build these three reports. They're the standard surface a manager or team lead uses to monitor performance, find breaching cases, and review closed work for retrospective. Without them, the customer has SLA logic running invisibly and no way to see what's happening.

All three target the `Cases` class and use the same wide filter palette. They differ in default filters, default sort, and column emphasis.

## Common prerequisites

- The three Step-5 triggers (`SLADeadline`, `ResponseTime`, `ResolutionTime` populators) must be active. Otherwise the reports show empty SLA columns for every row.
- Dictionary entries (Step 2) should be in place so column headers and filter labels render in Hebrew.
- Permissions for the report — pick the same roles that have read access on `Cases` (typically `role:CRM`, `role:Admin`, `role:Support`, `role:Managers`). The `editPermissions` must be a specific user objectId (look up the CRM admin or manager via `Get-all-Users`).

## Standard filter palette

These filters appear on all three reports unless otherwise noted. Default values vary per report.

| Field | Label | Type | Operator |
|-------|-------|------|----------|
| `Name` | שם מכיל | String | contains |
| `Number` | מספר פניה | Number | equalTo |
| `CaseTypeId` | סוג פניה | Pointer → CaseTypes | equalTo |
| `SubTypeId` | תת-סוג | Pointer → CaseSubTypes | equalTo |
| `StatusId` | סטטוס | Pointer → CaseStatuses | equalTo |
| `OwnerId` | אחראי | Pointer → _User | equalTo |
| `AccountId` | לקוח | Pointer → Accounts | equalTo |
| `PriorityId` | עדיפות | Pointer → CasePriorities | equalTo |
| `createdAt` | נוצר מתאריך / עד תאריך | Date | greaterThanOrEqualTo / lessThanOrEqualTo |
| `SLADeadline` | דד-ליין עד | Date | lessThanOrEqualTo |
| `IsClosed` | סגור | Boolean | equalTo |
| `IsEscalated` | באסקלציה | Boolean | equalTo |
| `IsVIP` | VIP | Boolean | equalTo |

## Standard columns

| Field | Notes |
|-------|-------|
| `Number` | Auto-increment case number |
| `Name` | Case title |
| `CaseTypeId.Name`, `SubTypeId.Name`, `StatusId.Name` | Through the pointers |
| `OwnerId.name` | Lowercase `name` — that's the `_User` field |
| `AccountId.Name` | Account name |
| `createdAt` | Case open time |
| `SLADeadline`, `ResponseTime`, `ResolutionTime` | The SLA timeline |
| `IsClosed`, `IsEscalated`, `IsVIP` | Boolean flags |

---

## Report 1 — דוח SLA כללי (General)

Default report. No pre-filters. The customer uses this for ad-hoc analysis — pick any combination of filters.

```
Create-or-Update-Report(report: {
  Name: "דוח SLA - כללי",
  ClassName: "Cases",
  permissions: ["role:CRM", "role:Admin", "role:Support", "role:Managers"],
  editPermissions: "<crm-admin-user-id>",
  AllowCsv: true,
  Sort: "-createdAt",
  GridDivider: 4,
  ShowFields: [
    "Number", "Name",
    "CaseTypeId.Name", "SubTypeId.Name", "StatusId.Name",
    "OwnerId.name", "AccountId.Name",
    "createdAt", "SLADeadline", "ResponseTime", "ResolutionTime",
    "IsClosed", "IsEscalated", "IsVIP"
  ],
  QueryElems: [
    /* all 14 filters from the table above, no default values */
  ]
})
```

## Report 2 — דוח SLA חריגות פניות פתוחות (Open breaches)

Defaults: `IsClosed = false`. Sorted by `SLADeadline` ascending (most-urgent first). Don't show `ResolutionTime` (irrelevant for still-open cases).

```
Create-or-Update-Report(report: {
  Name: "דוח SLA - חריגות פניות פתוחות",
  ClassName: "Cases",
  permissions: ["role:CRM", "role:Admin", "role:Support", "role:Managers"],
  editPermissions: "<crm-admin-user-id>",
  AllowCsv: true,
  Sort: "SLADeadline",                              // ascending: most urgent first
  GridDivider: 4,
  ShowFields: [
    "Number", "Name",
    "CaseTypeId.Name", "SubTypeId.Name", "StatusId.Name",
    "OwnerId.name", "AccountId.Name",
    "createdAt", "SLADeadline", "ResponseTime",
    "IsEscalated", "IsVIP"
  ],
  QueryElems: [
    /* same as Report 1, except the IsClosed filter gets a default: */
    { F: "IsClosed", FText: "סגור", C: "equalTo", T: "Boolean", V: false }
  ]
})
```

A team lead opens this report at the start of the day to see what's at risk. With the default sort, the cases closest to (or past) their deadline appear at the top — natural priority order. Add `SLADeadline ≤ today` as a user-applied filter to narrow to actual breaches.

## Report 3 — דוח SLA חריגות פניות סגורות (Closed breaches)

Defaults: `IsClosed = true`. Sorted by `ResolutionTime` descending (most-recent first). Used for retrospective review — "how did we do last month?"

```
Create-or-Update-Report(report: {
  Name: "דוח SLA - חריגות פניות סגורות",
  ClassName: "Cases",
  permissions: ["role:CRM", "role:Admin", "role:Support", "role:Managers"],
  editPermissions: "<crm-admin-user-id>",
  AllowCsv: true,
  Sort: "-ResolutionTime",
  GridDivider: 4,
  ShowFields: [
    "Number", "Name",
    "CaseTypeId.Name", "SubTypeId.Name", "StatusId.Name",
    "OwnerId.name", "AccountId.Name",
    "createdAt", "SLADeadline", "ResponseTime", "ResolutionTime",
    "IsEscalated", "IsVIP"
  ],
  QueryElems: [
    /* same as Report 1, plus: */
    { F: "IsClosed",       FText: "סגור",                C: "equalTo", T: "Boolean", V: true  },
    { F: "ResolutionTime", FText: "נסגר מתאריך",         C: "greaterThanOrEqualTo", T: "Date" },
    { F: "ResolutionTime", FText: "נסגר עד תאריך",       C: "lessThanOrEqualTo",    T: "Date" }
  ]
})
```

The customer typically filters by `createdAt` or `ResolutionTime` for a specific month. To identify *only* the breach subset (cases where the response came after the deadline), the customer can sort by `ResponseTime` and visually compare to `SLADeadline`, or add a user filter `ResponseTime > SLADeadline` — the report supports the comparison via the standard filter palette.

For a true "breach-only" view that computes "did we miss?" automatically, you'd want a `CalculatedFields` column like `ResponseTime - SLADeadline` (negative = met, positive = breached). The `CalculatedFields` syntax: `{name: "פיגור", fieldA: "ResponseTime", fieldB: "SLADeadline", action: "Minus"}`. Adding it produces a numeric column. The customer can then sort/filter on it.

---

## Sending reports on a schedule

For the daily-digest pattern (manager wants Report 2 emailed at 9am every workday), set `ScheduleSendAt` and `ScheduleSendTo` when creating the report:

```
ScheduleSendAt: { interval: "weekly", hour: 9, occurrence: [0, 1, 2, 3, 4] }, // Sun-Thu, 9am
ScheduleSendTo: "manager@company.co.il"
```

`occurrence` is an array of weekday indices (0=Sunday … 6=Saturday) for weekly schedules, or day-of-month numbers for monthly. Confirm timezone matches the customer (the platform default is server timezone).

---

## Embedding a report on a page

The reports created above appear on the default reports page (`apps/mybusiness/Reports`). To embed one on a specific page (e.g., a dashboard), set `PageId` or `PageName` in the report payload, plus a `FormName`. Use `myb-p-page-tables` or `myb-p-dashboards` skill for the page-level work — this skill stops at report creation.

---

## Verifying the reports were created correctly

```
Get-Reports()                                  // lists all reports
Get-Reports(objectId: "<report-id>")           // inspects one
```

Walk through each report by opening the demo CRM and:
1. Run with no filters → see all cases / open / closed respectively.
2. Apply a single filter (e.g., specific CaseType) → see narrowed results.
3. Click Excel/CSV export → confirm it generates a clean file.
4. Confirm Hebrew labels appear (requires Step-2 dictionary entries to be in place).
