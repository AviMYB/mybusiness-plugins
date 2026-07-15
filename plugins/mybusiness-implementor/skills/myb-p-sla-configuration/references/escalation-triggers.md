# Escalation — Scheduled Triggers for Pre-Breach Warnings and Breach Alerts

Once `SLADeadline` is populated on cases (via the Step-5 triggers), you can wire scheduled triggers that fire **per-case, X hours before that case's deadline**, sending notifications, emails, or kicking off any other automation. This is the platform mechanism the Jira epic refers to as "הסלמה" — escalation.

## How scheduled triggers work in MyBusiness CRM

A scheduled trigger is keyed off a Date field on a record. The scheduler walks all records in the table, finds those whose `schedulerField` value is "X hours from now," matches against `criterias`, and runs the action.

- `schedulerField`: the Date field on the table that holds the firing time (for SLA, almost always `SLADeadline`).
- `shcedulerHours`: how many hours **before** that date the trigger fires. Positive = before; negative = after. Empirically `0` is rejected — use `-1` (one hour after) for "fire on / just-after the deadline."
- `criterias`: filters that decide whether the action runs at fire time. The action only runs if the criteria still match at trigger-fire time, not when the trigger was created.

You don't manage the cron yourself — the platform scheduler runs continuously and dispatches to each scheduled trigger.

## The two canonical escalation triggers

### Escalation 1 — Warning two hours before the deadline

Notify the case owner (or a manager) when the deadline is two hours away **and the case is still in the opening status** (i.e., the customer is about to breach).

```
Set-Trigger(
  tableName: "Cases",
  type: "scheduled",
  active: true,
  name: "SLA: התראה שעתיים לפני חריגה",
  schedulerField: "SLADeadline",
  shcedulerHours: 2,                              // fire 2 hours before
  criterias: [{
    F: "StatusId", FText: "StatusId",
    C: "equalTo", T: "Pointer",
    V: "<OPEN_STATUS_ID>",
    P: { targetClass: "CaseStatuses", visibleVal: "פתוח" }
  }]
)
```

Notification action:

```
Set-Trigger-Action(
  tableName: "Cases",
  triggerId: "<trigger id from above>",
  triggerType: "scheduled",
  actionType: "notification",
  actionData: {
    notification: {
      userType: "field",
      user: "OwnerId",                            // case owner gets the alert
      content: "<div>⚠️ <b>SLA עומד לחריגה בעוד שעתיים</b><br/>פניה #{{{Number}}}: {{{Name}}}<br/>לקוח: {{{AccountId.Name}}}<br/>דד-ליין: {{{SLADeadline.format(datetime,he-IL,Asia/Jerusalem)}}}</div>",
      icon: "fa-clock-o",
      iconColor: "#FF9800"
    }
  }
)
```

The `{{{...}}}` placeholders are dynamic field references; the `.format(datetime,he-IL,Asia/Jerusalem)` extension formats the date for human reading.

### Escalation 2 — Breach escalation (one hour after the deadline)

Same shape, but `shcedulerHours: -1` (fires *after* the deadline) and a stronger message intended for the manager.

```
Set-Trigger(
  tableName: "Cases",
  type: "scheduled",
  active: true,
  name: "SLA: חריגה בפועל - הסלמה",
  schedulerField: "SLADeadline",
  shcedulerHours: -1,                             // 1 hour after the deadline
  criterias: [{
    F: "StatusId", FText: "StatusId",
    C: "equalTo", T: "Pointer",
    V: "<OPEN_STATUS_ID>",
    P: { targetClass: "CaseStatuses", visibleVal: "פתוח" }
  }]
)
```

Action — same `notification` shape, more urgent copy and icon:

```
Set-Trigger-Action(
  tableName: "Cases",
  triggerId: "<trigger id>",
  triggerType: "scheduled",
  actionType: "notification",
  actionData: {
    notification: {
      userType: "field",
      user: "OwnerId",                            // or use userType:"fixed" + manager id
      content: "<div>🚨 <b>חריגת SLA - הסלמה למנהל</b><br/>פניה #{{{Number}}}: {{{Name}}}<br/>לקוח: {{{AccountId.Name}}}<br/>דד-ליין עבר: {{{SLADeadline.format(datetime,he-IL,Asia/Jerusalem)}}}</div>",
      icon: "fa-exclamation-triangle",
      iconColor: "#F44336"
    }
  }
)
```

---

## Notifying a manager instead of the owner

Two options:

**Option A — fixed user.** If there's one CRM manager who should get every breach alert:

```
notification: {
  userType: "fixed",
  user: "<manager-user-id>",                      // objectId from _User table
  content: "...",
  ...
}
```

**Option B — dynamic via a field on the case.** If different cases have different managers (e.g., based on case type or owner's team), add a custom pointer field like `ManagerId` on `Cases`, populate it on case create (via another trigger), and reference it:

```
notification: {
  userType: "field",
  user: "ManagerId",
  ...
}
```

For a cleaner approach without a new field: chain via owner. The `OwnerId.ManagerId` dotted path works if `_User` has a `ManagerId` self-pointer.

---

## Adding email and WhatsApp in parallel

A trigger can have multiple actions of different types. After creating the notification, call `Set-Trigger-Action` again with `actionType: "email"`, `"sms"`, or `"whatsapp-message"` on the same `triggerId`. Each will fire when the scheduled trigger runs.

Email example (replace template + SMTP IDs from your env):

```
Set-Trigger-Action(
  tableName: "Cases",
  triggerId: "<scheduled trigger id>",
  triggerType: "scheduled",
  actionType: "email",
  actionData: {
    email: {
      template: "<email-template-id>",
      emailAccount: "<smtp-account-id>",
      emailType: "field",
      emailTarget: "OwnerId.email",
      emailSubject: "חריגת SLA: פניה #{{{Number}}}",
      saveToEmailsTable: true,
      fieldsValue: [{
        field: "CaseId",
        targetClass: "Cases",
        type: "Pointer",
        value: "current",
        visibleVal: "Current Case"
      }]
    }
  }
)
```

You'll need a pre-existing email template (`EmailTemplate` table) and an SMTP account (`Get-SMTP-Accounts`) for that to work. Confirm both exist before authoring.

---

## Additional escalation patterns customers ask for

**"Daily digest of all breached open cases to the manager."** That's not a per-case scheduled trigger — it's a Report (`apps/mybusiness/Reports`) with `ScheduleSendAt` and `ScheduleSendTo` set. See `references/sla-reports.md`. The "open breaches" report can be scheduled to email at 9am daily to a manager.

**"Stop counting once the case moves to בהמתנה."** The simple `SLADeadline = createdAt + N` trigger can't pause — `SLADeadline` is a single static date. For pause behavior, either: (a) use the server-side-code variant which can recompute `SLADeadline` whenever the case moves in/out of paused state, or (b) accept that the clock keeps running visually and rely on the `StateId` filter in reports to filter out paused cases.

**"Auto-escalate to the next-level manager after second breach."** Add a `EscalationLevel` increment + `EscalatedTo` re-assignment as an `update-object` action on the breach scheduled trigger. After the second invocation increments past a threshold, do another action that picks the L2 manager.

---

## Things to be careful about

- **The criterion is evaluated at fire time, not at trigger-create time.** If the case has already moved out of the opening status before the deadline approaches, the criteria won't match and no notification fires. That's correct behavior — we don't want to alert on cases that have already been handled.
- **`shcedulerHours: 0` is rejected by the API** with "Scheduler hours is required for scheduled trigger". Use `-1` instead if you want "on / just-after deadline."
- **The scheduler runs on platform cadence**, not synchronously. Don't expect the notification at exactly minute T-120; expect it within the platform's scan window (typically a few minutes' resolution).
- **`SLADeadline` must be a real Date with a future value** for the schedule to be picked up. If your Step-5 trigger doesn't populate it, escalation will never fire.
- **Trigger chain depth still applies.** A scheduled trigger that updates another table that has its own trigger that updates a third table — that's the 3-level limit. Keep escalation actions to notifications/emails/SMS (which don't create further trigger chains) where possible.
