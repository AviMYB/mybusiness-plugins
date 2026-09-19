# Per-Status SLA Tracking — `CaseSLAProcess` Table + Case-Card Widget

While the `Cases` row holds the *summary* of SLA performance (`SLADeadline`, `ResponseTime`, `ResolutionTime`), the agent looking at a case usually wants to see **how the clock ran in each status** — entered when, left when, what was the budget for that status, did it breach. `CaseSLAProcess` is the per-status-handoff log that gives that view.

The platform's own design intended this table, but platform-side population is incomplete (a known gap). So we author it ourselves: define the schema, populate it via two triggers on `Cases`, and surface it as a related-records table on the Case form page.

## Schema

```
{
  Name              : String       (case Name copied in for quick identification)
  CaseId            : Pointer → Cases
  StatusId          : Pointer → CaseStatuses
  StatusEnteredAt   : Date         (when the case entered this status)
  StatusExitedAt    : Date         (when it left — null while still in this status)
  DeadlineForStatus : Date         (SLA deadline for THIS status's clock)
  SLAHoursAllowed   : Number
  SLADaysAllowed    : Number
  IsCurrent         : Boolean      (latest row for this case; see "limitation" below)
  IsBreached        : Boolean
  IsPaused          : Boolean
}
```

Create with `Create-Table` + `Add-Field-to-Table`. The pointer to `Cases` is what makes the Case-card widget auto-filter — the platform sees a child class with a pointer to the form's class and filters rows automatically.

## Population triggers on `Cases`

### Trigger A — Initial tracking row on case create

Fires on create when `StatusId == <OPEN_STATUS_ID>`. `create-object` action targets `CaseSLAProcess`.

```
Set-Trigger(
  tableName: "Cases",
  type: "data change",
  active: true,
  name: "SLA-Process: שורת מעקב ראשונית בפתיחת פניה",
  events: ["create"],
  onSetFields: ["Name"],
  criterias: [{
    F: "StatusId", FText: "StatusId", C: "equalTo", T: "Pointer",
    V: "<OPEN_STATUS_ID>",
    P: { targetClass: "CaseStatuses", visibleVal: "פתוח" }
  }]
)

Set-Trigger-Action(
  tableName: "Cases", triggerId: "<id>", triggerType: "data change",
  actionType: "create-object",
  actionData: { "create-object": {
    targetClass: "CaseSLAProcess",
    fieldsValue: [
      { field: "Name",              type: "dynamic", value: "Name",          visibleVal: "case Name" },
      { field: "CaseId",            type: "dynamic", value: "currentObject", targetClass: "Cases",         visibleVal: "Current Case" },
      { field: "StatusId",          type: "dynamic", value: "StatusId",      targetClass: "CaseStatuses",  visibleVal: "StatusId" },
      { field: "StatusEnteredAt",   type: "dynamic", value: "createdAt",     visibleVal: "createdAt" },
      { field: "DeadlineForStatus", type: "dynamic", value: "createdAt",     timeGap: 2880,                visibleVal: "createdAt + 2 ימים" },
      { field: "SLADaysAllowed",    type: "static",  value: 2,               visibleVal: "2" },
      { field: "IsCurrent",         type: "static",  value: true,            visibleVal: "true" },
      { field: "IsBreached",        type: "static",  value: false,           visibleVal: "false" },
      { field: "IsPaused",          type: "static",  value: false,           visibleVal: "false" }
    ]
  }}
)
```

### Trigger B — New tracking row on every status change

Fires on update whenever `StatusId` changes. `oneachupdate: true` because we want one row per transition, not just the first.

```
Set-Trigger(
  tableName: "Cases",
  type: "data change",
  active: true,
  name: "SLA-Process: שורת מעקב חדשה בשינוי סטטוס",
  events: ["update"],
  onSetFields: ["StatusId"],
  oneachupdate: true,
  criterias: []                  // fires on ANY StatusId change
)

Set-Trigger-Action(
  tableName: "Cases", triggerId: "<id>", triggerType: "data change",
  actionType: "create-object",
  actionData: { "create-object": {
    targetClass: "CaseSLAProcess",
    fieldsValue: [
      { field: "Name",              type: "dynamic", value: "Name",          visibleVal: "case Name" },
      { field: "CaseId",            type: "dynamic", value: "currentObject", targetClass: "Cases",         visibleVal: "Current Case" },
      { field: "StatusId",          type: "dynamic", value: "StatusId",      targetClass: "CaseStatuses",  visibleVal: "StatusId" },
      { field: "StatusEnteredAt",   type: "dynamic", value: "updatedAt",     visibleVal: "updatedAt" },
      { field: "DeadlineForStatus", type: "dynamic", value: "updatedAt",     timeGap: 2880,                visibleVal: "updatedAt + 2 ימים" },
      { field: "SLADaysAllowed",    type: "static",  value: 2,               visibleVal: "2" },
      { field: "IsCurrent",         type: "static",  value: true,            visibleVal: "true" },
      { field: "IsBreached",        type: "static",  value: false,           visibleVal: "false" },
      { field: "IsPaused",          type: "static",  value: false,           visibleVal: "false" }
    ]
  }}
)
```

### Known limitations of this simple pattern

- **All rows have `IsCurrent: true`.** The simple triggers only create rows — they don't update the previous row's `IsCurrent` to `false` or stamp its `StatusExitedAt`. In practice, the "current" row is the one with the latest `StatusEnteredAt`. The widget on the case card uses sort-by-date-ascending to give a chronological history; "current" is just "the last one." For accurate `IsCurrent`/`StatusExitedAt` maintenance, you need an additional `update-object` action that finds the previous row (by `CaseId` and `IsCurrent=true`) and updates it — easier with `server-side-code` than with raw trigger actions.

- **`IsBreached` is always `false` at row creation.** It would need a scheduled trigger or a server-side function to flip to `true` when `now > DeadlineForStatus AND StatusExitedAt is null`. Out of scope for the simple pattern; document the gap with the customer.

- **`SLADaysAllowed` is hardcoded at 2.** Same trade-off as the `SLADeadline` trigger — the simple pattern uses a fixed number; for per-type/per-status budgets, the action needs to look up `SLASettings`, which requires `server-side-code`.

## Adding the widget to the Case page

This is the step that **must use the `myb-p-page-tables` skill**. Don't try to call `Add-Table-View-to-Form-Page` directly from a high-level overview here — that skill documents three platform quirks that will silently break the widget if ignored:

1. **`aggrField` is required on every column** (`KI-1` in that skill). Without it, sort and filter break.
2. **`insertAfterRow` placement** (`KI-9`). The widget can get nested inside a `simbla-nav` (tab container) or another `simbla-table` if the next sibling after the target row is one of those. The widget then doesn't auto-filter to the parent record.
3. **`Edit-Table-View` finalization** is needed to set `classPointers` correctly (must include `createdBy`/`updatedBy` plus all custom pointers), set sort order, set permissions, and lock `editView`.

### Invocation

```
Skill("myb-p-page-tables",
  "Add a read-only related-records table widget on the Case form page (pageId 69bfd6c945604bc0d3567503).
   Table to embed: CaseSLAProcess. Insert after the SLA section row P365.
   Title: 'מעקב SLA לפי סטטוס'.
   Read-only — allowCreate:false, allowInlineEdit:false, editView:'hidetable'.
   Columns: StatusId.Name (status name, type String, aggrField StatusId.CaseStatuses.Name),
            StatusEnteredAt (Date datetime),
            StatusExitedAt (Date datetime),
            DeadlineForStatus (Date datetime),
            SLADaysAllowed (Number),
            IsCurrent (Boolean),
            IsBreached (Boolean).
   Sort by StatusEnteredAt ascending.
   classPointers: createdBy:_User, updatedBy:_User, CaseId:Cases, StatusId:CaseStatuses.")
```

### Picking the right `insertAfterRow` on the Case page

The standard Case page layout (from the platform template) places sections in this order: prerequisites, details, status fields, **SLA fields rows (P366, P365)**, **escalation heading (P368)**, escalation fields, description, resolution, technician notes, comments, related tabs.

The clean placement for the SLA tracking widget is **after `P365`**, which puts the widget between the SLA fields and the escalation section. The immediate next sibling after the widget is `P368` (אסקלציה heading) — a plain section heading row, not a `simbla-nav` or `simbla-table` — so `KI-9` doesn't bite.

If the customer's Case page has been customized and `P365`/`P368` don't exist, use `Get-Page-Content(pageId, minimal=true)` and pick a row whose next sibling is a plain field/section row.

### Verification after insertion

`Add-Table-View-to-Form-Page` returns `success: true` even when it only adds the row wrapper without an actual `simbla-table`. Always verify:

```
Get-Page-Content(pageId: 69bfd6c945604bc0d3567503, minimal: false)
```

In the resulting HTML, search for `data-simbla-class="CaseSLAProcess"`. If absent, the table wasn't really inserted — delete the empty row with `Edit-Page(actionType: "delete-row")` and retry, paying attention to the columns / fields format. (The most likely cause is missing `aggrField` on the `fields` array passed to `Add-Table-View-to-Form-Page`.)

`Get-Page-Content(minimal: true)` does *not* show the `simbla-table` element in its compact tree — it only shows the wrapping rows and the title `<h2>`. Don't use minimal mode to verify widget presence; only use it to find row IDs.

## Verification with a test case

```
Create-Data(table: "Cases", data: {
  Name: "test SLA tracking",
  CaseTypeId: { __type: "Pointer", className: "CaseTypes", objectId: "<type-id>" },
  StatusId: { __type: "Pointer", className: "CaseStatuses", objectId: "<OPEN_STATUS_ID>" }
})

Get-Data(table: "CaseSLAProcess",
         where: { CaseId: { __type: "Pointer", className: "Cases", objectId: "<case-id>" } },
         order: "createdAt")
//  ↑ should show 1 row for the opening status

Update-Data(table: "Cases", objectId: "<case-id>",
            data: { StatusId: { __type: "Pointer", className: "CaseStatuses", objectId: "<other-status>" } })

Get-Data(... same query ...)
//  ↑ should now show 2 rows
```

Then load the case in the CRM UI. The widget on the card should show both rows in chronological order.
