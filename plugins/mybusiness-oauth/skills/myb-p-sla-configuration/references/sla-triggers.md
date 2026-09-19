# SLA-Population Triggers — Make the Mechanism Actually Run

Without these triggers, `SLADeadline`, `ResponseTime`, and `ResolutionTime` on `Cases` stay null no matter how many `SLASettings` rows you create. This is the step most people miss because the existence of the admin configuration pages suggests a runtime engine is doing the work — empirically it isn't.

Three data-change triggers are needed. Each fires on a specific moment in the case lifecycle and stamps a single date field. All three target the *same* record they fired on, using `connection: "current.objectId"` as a self-update.

## The opening status

These triggers reference whichever `CaseStatuses` row represents "newly opened" — usually `פתוח` ("Open") or `פניה חדשה` ("New case"). Throughout this doc that row's objectId is shown as `<OPEN_STATUS_ID>` and the matching closed-status row as `<CLOSED_STATUS_ID>`. Look them up before authoring:

```
Get-Data(table: "CaseStatuses", keys: ["objectId", "Name"], limit: 50)
```

---

## Trigger 1 — Set `SLADeadline` on case creation

Fires once per case at create time, when the case is created with the opening status. Stamps `SLADeadline = createdAt + N days` (calendar days; see business-days note at the end).

```
Set-Trigger(
  tableName: "Cases",
  type: "data change",
  active: true,
  name: "SLA: הגדרת דד-ליין בפתיחת פניה",
  events: ["create"],
  onSetFields: ["Name"],           // Name is always set on create → fires for every create
  criterias: [{
    F: "StatusId", FText: "StatusId", C: "equalTo", T: "Pointer",
    V: "<OPEN_STATUS_ID>",
    P: { targetClass: "CaseStatuses", visibleVal: "פתוח" }
  }]
)
```

Then attach the update action — `timeGap` is in **minutes** (2 days = 2880):

```
Set-Trigger-Action(
  tableName: "Cases",
  triggerId: "<trigger id from above>",
  triggerType: "data change",
  actionType: "update-object",
  actionData: {
    "update-object": {
      targetClass: "Cases",
      connection: "current.objectId",
      fieldsValue: [{
        field: "SLADeadline",
        type: "dynamic",
        value: "createdAt",
        timeGap: 2880,                       // 2 days × 24h × 60min
        visibleVal: "createdAt + 2 ימים"
      }]
    }
  }
)
```

To match the customer's actual SLA duration, change `timeGap`:

| SLA target | `timeGap` (minutes) |
|------------|---------------------|
| 4 hours    | 240 |
| 1 day      | 1440 |
| 2 days     | 2880 |
| 3 days     | 4320 |
| 5 days     | 7200 |

If the customer has different SLA durations per case type, you have two options: (1) one trigger per type with type-specific criteria + duration, or (2) a single server-side-code action that looks up `SLASettings` for the matching `(CaseTypeId, SubTypeId, StatusId)` and computes the deadline. Option (2) is correct but requires dev work — see the server-side variant at the bottom.

---

## Trigger 2 — Stamp `ResponseTime` on first move out of opening status

Fires once (`oneachupdate: false`) the first time the case's `StatusId` changes to anything that isn't the opening status. Stamps `ResponseTime = updatedAt`.

```
Set-Trigger(
  tableName: "Cases",
  type: "data change",
  active: true,
  name: "SLA: רישום ResponseTime במעבר ראשון מפתוח",
  events: ["update"],
  onSetFields: ["StatusId"],
  oneachupdate: false,                       // only on FIRST matching update
  criterias: [{
    F: "StatusId", FText: "StatusId", C: "notEqualTo", T: "Pointer",
    V: "<OPEN_STATUS_ID>",
    P: { targetClass: "CaseStatuses", visibleVal: "פתוח" }
  }]
)
```

Action:

```
Set-Trigger-Action(
  tableName: "Cases",
  triggerId: "<trigger id>",
  triggerType: "data change",
  actionType: "update-object",
  actionData: {
    "update-object": {
      targetClass: "Cases",
      connection: "current.objectId",
      fieldsValue: [{
        field: "ResponseTime",
        type: "dynamic",
        value: "updatedAt",
        visibleVal: "updatedAt"
      }]
    }
  }
)
```

The `oneachupdate: false` is critical. Without it, every subsequent status change would re-stamp `ResponseTime` and erase the original first-response time, breaking SLA reporting.

---

## Trigger 3 — Stamp `ResolutionTime` and `IsClosed` on close

Fires when `StatusId` changes to the closed status. Stamps `ResolutionTime = updatedAt` and `IsClosed = true`.

```
Set-Trigger(
  tableName: "Cases",
  type: "data change",
  active: true,
  name: "SLA: רישום ResolutionTime בסגירת פניה",
  events: ["update"],
  onSetFields: ["StatusId"],
  oneachupdate: false,
  criterias: [{
    F: "StatusId", FText: "StatusId", C: "equalTo", T: "Pointer",
    V: "<CLOSED_STATUS_ID>",
    P: { targetClass: "CaseStatuses", visibleVal: "סגור" }
  }]
)
```

Action — note `IsClosed` is a static `true`, while `ResolutionTime` is a dynamic copy of `updatedAt`:

```
Set-Trigger-Action(
  tableName: "Cases",
  triggerId: "<trigger id>",
  triggerType: "data change",
  actionType: "update-object",
  actionData: {
    "update-object": {
      targetClass: "Cases",
      connection: "current.objectId",
      fieldsValue: [
        { field: "ResolutionTime", type: "dynamic", value: "updatedAt", visibleVal: "updatedAt" },
        { field: "IsClosed",       type: "static",  value: true,        visibleVal: "true" }
      ]
    }
  }
)
```

If the customer has multiple "closed-state" statuses (e.g., `סגור`, `בוטל`), either author a trigger per closed status or use a `containedIn` condition with all the closed-status objectIds.

---

## Verifying the three triggers

Create one test case in the opening status and walk it through the lifecycle:

```
Create-Data(table: "Cases", data: {
  Name: "בדיקת SLA",
  CaseTypeId: { __type: "Pointer", className: "CaseTypes", objectId: "<type-id>" },
  StatusId:   { __type: "Pointer", className: "CaseStatuses", objectId: "<OPEN_STATUS_ID>" }
})
// then:
Get-Data(table: "Cases", objectId: "<case id>",
         keys: ["SLADeadline","ResponseTime","ResolutionTime","IsClosed"])
//  ↑ SLADeadline should already be populated (~2 days from now)
//    ResponseTime, ResolutionTime, IsClosed should still be empty

Update-Data(table: "Cases", objectId: "<case id>", data: {
  StatusId: { __type: "Pointer", className: "CaseStatuses", objectId: "<in-progress-status-id>" }
})
//  ↑ ResponseTime should now be populated with the timestamp of this update

Update-Data(table: "Cases", objectId: "<case id>", data: {
  StatusId: { __type: "Pointer", className: "CaseStatuses", objectId: "<CLOSED_STATUS_ID>" }
})
//  ↑ ResolutionTime and IsClosed=true should now be populated
```

If any of the three fields is still null after the matching step, the corresponding trigger isn't wired correctly. `Get-Triggers(tableName: "Cases")` to inspect.

---

## Business days vs calendar days

The `timeGap` approach adds wall-clock minutes — it doesn't skip weekends or holidays. That's fine for many customers but technically wrong if their SLA is expressed in "business days." For correct business-day computation you need a `server-side-code` action:

```
Set-Trigger-Action(
  tableName: "Cases",
  triggerId: "<trigger id>",
  triggerType: "data change",
  actionType: "server-side-code",
  actionData: {
    "server-side-code": {
      functionName: "computeSLADeadline",
      useQueue: true
    }
  }
)
```

The `computeSLADeadline` cloud function (which the customer's dev team must deploy) should:

1. Read `request.object` (the case being created or updated).
2. Look up the matching `SLASettings` row by `(CaseTypeId, CaseSubTypeId, CaseStatusId)`, preferring more specific matches.
3. Read the active `BusinessHours` row.
4. Compute the deadline by walking forward `SLADays` working days (skipping inactive `WeeklyHours` days, skipping `SpecialDates`, skipping Israeli holidays if `ConsiderIsraeliHolidays` is true).
5. `request.object.set("SLADeadline", deadline)`.

This is the proper implementation that aligns with the platform's original design intent. The simple `timeGap` triggers are the pragmatic v1 — document the trade-off with the customer when handing off.

---

## Things to be careful about

- **Trigger chain depth limit is 3.** These triggers cause `Cases` to self-update, which is one chain level. If the customer already has triggers on `Cases` updating other tables (which might trigger further triggers), watch for the 3-level cap.
- **Master key context.** Triggers that fire on a master-key write may behave differently than triggers on a user write. Test with both contexts before declaring "done."
- **Re-opening a closed case.** If the customer ever reopens a closed case (`IsClosed` flips back to false), the `ResolutionTime` stays — which may surprise them. If they want re-opening behavior, add a fourth trigger to clear `ResolutionTime` and `IsClosed` when status moves away from the closed status. Confirm the customer wants this before adding it.
- **Multiple opening statuses.** If "new case" can be either `פניה חדשה` or `נכנסת` or another label, use a `containedIn` criterion with all of them rather than authoring N triggers.
