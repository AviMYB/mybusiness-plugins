# Verifying and Troubleshooting SLA

After configuring SLA, verify it actually runs on real cases. When a customer reports "the SLA is wrong," use this as a triage checklist — most issues fall into one of the buckets below.

## Verification flow after fresh setup

1. **Pick a case type that has at least one SLA rule.** `Get-Data(table: "SLASettings", limit: 5)` to confirm what's configured.
2. **Confirm the Step-5 triggers exist.** `Get-Triggers(tableName: "Cases")` should show triggers named like "SLA: הגדרת דד-ליין בפתיחת פניה", "SLA: רישום ResponseTime...", "SLA: רישום ResolutionTime...". Without these, the SLA fields will stay null — see `sla-triggers.md`.
4. **Create a test case** for that type via `Create-Data(table: "Cases", data: { Name, CaseTypeId, StatusId: <open-status> })` and capture the returned `objectId`.
5. **Re-read the case** immediately and confirm `SLADeadline` is populated. If it's null, the create-trigger didn't fire — check criteria and `active`.
6. **Move the case to a non-open status** (`Update-Data(... StatusId: <in-progress-id>)`) and re-read. `ResponseTime` should now be set, `ResolutionTime` still null.
7. **Move the case to a closed-state status** and re-read. `ResolutionTime` and `IsClosed=true` should now be set.
8. **Confirm the case shows up in each of the three reports.** Open report #1 (general) and search by case `Number` — should appear. Then report #2 (open breaches) → shouldn't appear (since we closed it). Then report #3 (closed breaches) → should appear.

If any step fails, work through the troubleshooting matrix below.

## Troubleshooting matrix

### Symptom: "I configured SLA but no SLA fields show up on any case"

**This is the most common situation.** The customer authored `SLASettings` rows expecting them to drive automatic computation. They don't — the platform has no built-in engine that reads `SLASettings` and writes to `Cases` (a known platform gap).

**Fix:** wire up the Step-5 triggers from `sla-triggers.md`. After that, *new* cases will populate. To backfill *existing* cases, run a one-time update script that nudges each case (or run the cloud function the dev team builds for the server-side variant).

Quick check:
```
Count-Data(table: "Cases", where: { SLADeadline: { $exists: true } })
```
If this returns 0 (or very low compared to total `Cases` count), the trigger pipeline isn't running.

### Symptom: "Case is in 'סגור' but SLADeadline still shows in red / appears overdue"

This isn't a bug — `SLADeadline` is a static date set at creation time. It doesn't "clear" on close. The reports correctly hide already-closed cases via the `IsClosed = true/false` filter, but on the Case card itself the date is still there.

If the customer wants the card to *visually* soften on close, that's CSS/JS on the Case page (page `apps/mybusiness/Case`) — see the existing `checkSLA()` JS hook to add a "this case is closed" branch. Not a database fix.

### Symptom: "Case in 'סגור' but the SLA reports show it as open"

The Step-5 close-trigger didn't fire on this case (the case was closed before the trigger was authored, or via a path that skipped triggers like a bulk-update with `skipTriggers: true`).

Fix the case manually:
```
Update-Data(
  table: "Cases",
  objectId: "<case id>",
  data: {
    IsClosed: true,
    ResolutionTime: { __type: "Date", iso: "<date when it was actually closed>" }
  }
)
```

To prevent recurrence, walk the customer's process — are they using bulk operations that bypass triggers? Are they importing legacy cases?

### Symptom: "Scheduled escalation triggers are not firing"

Order of investigation:

1. **`SLADeadline` exists on the case?** No deadline → no firing time. Run `Get-Data(table: "Cases", objectId: "<id>", keys: ["SLADeadline"])`. If null, the create-trigger isn't running on new cases either — start there.
2. **Criteria still match at fire time?** The scheduled trigger only fires if `StatusId` is still in the opening status at the moment the scheduler ticks. If the case moved out of opening before deadline, no notification — that's correct behavior.
3. **Trigger active?** `Get-Triggers(tableName: "Cases")` and confirm `active: true` on the scheduled trigger.
4. **Notification visibility.** Notifications go to the user specified by `userType`/`user`. Check the receiving user is logged in and able to see notifications in their CRM UI.

### Symptom: "Remaining time / breach calculation is wrong"

Usually one of:

1. **Wall clock vs business days.** The simple trigger pattern stamps `SLADeadline = createdAt + N` (calendar days). If the customer wrote "2 business days" and the case was created Thursday morning, `SLADeadline` lands Saturday — which is "wrong" for a Sunday-Thursday business week. To fix properly, switch to the `server-side-code` variant in `sla-triggers.md`.
2. **`SLASettings` row not actually matching.** The simple trigger uses a *fixed* `timeGap`, not a lookup. If the customer has different SLAs per type and the trigger only has one value, every case gets the same deadline regardless of `SLASettings`. Either author multiple triggers (one per type) or move to the server-side variant.
3. **Israeli holidays not subtracted.** Same root cause — the simple trigger ignores `BusinessHours.ConsiderIsraeliHolidays`. Only the server-side variant honors it.

### Symptom: "SLA fields are not on the Case card"

Two possibilities:

1. **The card page predates the SLA UI section.** Some legacy customers' Case page doesn't have the "SLA ומעקב" section. Use the `myb-p-page-builder` skill to add it.
2. **The fields are on the page but empty.** That means the Step-5 triggers aren't running — see the first symptom in this matrix.

## When to escalate to product / dev

- **Customer needs true business-day computation.** The simple trigger pattern uses calendar days. Building the proper server-side `computeSLADeadline` function is dev work — escalate.
- **Customer needs multiple parallel working windows** (e.g., morning shift + evening shift on different schedules). Not supported by `BusinessHours`. Feature request, not config.
- **Customer needs SLA on tables other than Cases** (Sales, Tasks, Activities). The platform mechanism is Cases-only. Build a custom equivalent via `myb-p-timestamp-field` + `myb-p-trigger-setup` + a calculated date field, scoped to the target table.

## Diagnostic snippet — full SLA audit for a customer

Run this sequence whenever you start working on an SLA support ticket. Takes under a minute, surfaces 90% of issues.

```
Get-Data(table: "CaseStates",   limit: 20, keys: ["objectId", "Name"])
Get-Data(table: "CaseStatuses", limit: 100, keys: ["objectId", "Name", "StateId"])
Get-Data(table: "CaseTypes",    limit: 50, keys: ["objectId", "Name"])
Get-Data(table: "CaseSubTypes", limit: 100, keys: ["objectId", "Name", "TypeId"])
Get-Data(table: "BusinessHours", limit: 5)
Get-Data(table: "SLASettings",   limit: 100)
Get-Triggers(tableName: "Cases")
Get-Reports()
Count-Data(table: "Cases", where: { IsClosed: false })
Count-Data(table: "Cases", where: { SLADeadline: { $exists: true } })
```

Read each and look for:
- Empty `BusinessHours` or `SLASettings` → no SLA configured at all.
- Missing `StateId` pointers on `CaseStatuses` → clock can't pause on close.
- No SLA-named triggers in `Get-Triggers` → the most common root cause; the engine isn't running.
- `Count-Data` with `SLADeadline $exists` returning 0 or near-0 → confirms triggers aren't populating.
- No SLA-named reports in `Get-Reports` → customer has no surface to monitor SLA.

Most "SLA is broken" tickets resolve at this stage without ever inspecting a specific case.
