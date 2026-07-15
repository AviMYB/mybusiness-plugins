# SLA Settings — Defining the Targets

`SLASettings` is the rule table. Each row says "for cases matching X, the SLA is Y hours/days." The matching dimensions are `CaseType`, `CaseSubType`, and `CaseStatus`. The duration is in either `SLAHours` or `SLADays` (pick one — see below).

> **Important:** `SLASettings` is *configuration only* — the platform does not currently auto-read these rows to compute deadlines on cases. To actually enforce SLA, you must also create the triggers documented in `sla-triggers.md`. Without them, the rules in this table are documentation of the customer's policy, but no runtime mechanism is acting on them.

## Schema

| Field | Type | Purpose |
|-------|------|---------|
| `CaseTypeId` | Pointer → `CaseTypes` | Always set on every rule |
| `CaseSubTypeId` | Pointer → `CaseSubTypes` | Optional — set to narrow the rule to one sub-type under the type |
| `CaseStatusId` | Pointer → `CaseStatuses` | Optional — set to narrow the rule to a specific status (e.g., "השלמת מסמכים") |
| `SLAHours` | Number | Duration in hours. Set this OR `SLADays`, not both |
| `SLADays` | Number | Duration in business days. Set this OR `SLAHours`, not both |

## Where the user manages this in the UI

הגדרות מערכת → הגדרות פניות → **הגדרות SLA** → page `apps/mybusiness/System-SLA-Settings`.

The UI has two top-level toggles that affect what fields appear in the form:
- **הגדר SLA עבור סטטוס פניות** — when on, the form exposes the Status dropdown (otherwise only Type + Sub-Type are visible).
- **הגדר SLA בימים** — switches the duration input from hours to days. The customer can toggle this per-rule by editing the row.

Below that there's an editable list of existing rules with the standard CRUD controls.

## The three granularity patterns

### Pattern 1 — Type only

"All technical-support cases get 24 hours."

```
Create-Data(
  table: "SLASettings",
  data: {
    CaseTypeId: { __type: "Pointer", className: "CaseTypes", objectId: "<type id>" },
    SLAHours: 24
  }
)
```

Applies to any case of that type that doesn't match a narrower rule.

### Pattern 2 — Type + Sub-Type

"Technical-support → hardware-failure: 48 hours. Technical-support → password-reset: 4 hours."

```
Create-Data(
  table: "SLASettings",
  data: {
    CaseTypeId:    { __type: "Pointer", className: "CaseTypes",    objectId: "<type id>" },
    CaseSubTypeId: { __type: "Pointer", className: "CaseSubTypes", objectId: "<sub-type id>" },
    SLAHours: 48
  }
)
```

### Pattern 3 — Type + Sub-Type + Status (per-stage SLA)

This is the most powerful pattern and what the Jira epic was primarily built for. Each stage of handling has its own budget. Example: "Service-request → installation: 1 day in 'awaiting documents', 2 days in 'awaiting technician', 4 hours in 'on-site work'."

```
Create-Data(
  table: "SLASettings",
  data: {
    CaseTypeId:    { __type: "Pointer", className: "CaseTypes",    objectId: "<type id>" },
    CaseSubTypeId: { __type: "Pointer", className: "CaseSubTypes", objectId: "<sub-type id>" },
    CaseStatusId:  { __type: "Pointer", className: "CaseStatuses", objectId: "<status id>" },
    SLADays: 1
  }
)
```

When the case moves to a different status, the engine looks up the rule for the new status and starts a new clock.

## Precedence when rules overlap

The engine prefers the most specific matching rule:

1. Type + Sub-Type + Status (most specific)
2. Type + Sub-Type
3. Type only (most general)

This means it's safe to author a Type-only "fallback" alongside narrower Type+SubType rules — the narrower rules will win for the sub-types they cover, and the fallback will catch everything else.

Avoid authoring two rules at the *same* level of specificity that match the same case (e.g., two Type-only rules for the same type). The system either rejects this on save or quietly picks one — either way the customer loses control. The settings UI is supposed to prevent this on save, but verify by querying `SLASettings` after a bulk import.

## Days vs hours

- `SLADays` is interpreted as **business days** against the `BusinessHours` row. "2 days" means 2 × (length of one configured working day), not 48 wall-clock hours.
- `SLAHours` is interpreted as **business hours**. "4 hours" means 4 hours of clock-time *inside* the working window, so a 4-hour SLA started at 16:00 on a 17:00-closing day continues at 09:00 the next morning.
- **Don't set both.** Pick one. If both are non-zero, behavior is undefined and varies by environment.

For mixed durations (e.g., "2 days and 4 hours"), convert to hours: `2 × <hours-per-business-day> + 4`. If the customer's working day is 8h, that's 20h.

## Editing and deleting rules

```
Update-Data(
  table: "SLASettings",
  objectId: "<row id>",
  data: { SLAHours: 8, SLADays: 0 }
)
```

When switching a row from days to hours (or vice versa), explicitly zero the other field — leaving stale data there can confuse the precedence logic and any reports the customer has built on top of the table.

```
Delete-Data(table: "SLASettings", objectId: "<row id>")
```

If a rule is deleted while cases are mid-flight against it, those cases fall back to the next-most-specific rule on the next status change or recalculation tick. Warn the customer before bulk-deleting.

## Bulk authoring pattern

When seeding SLA for a new customer, use `Create-Many` if available rather than one `Create-Data` per row — saves round-trips and keeps the rules consistent.

```
Create-Many(
  table: "SLASettings",
  rows: [
    { CaseTypeId: {...}, SLAHours: 24 },
    { CaseTypeId: {...}, CaseSubTypeId: {...}, SLAHours: 4 },
    ...
  ]
)
```

Always follow up with `Get-Data` to verify the rows actually landed with the pointer types intact — Parse can silently store malformed pointers as plain objects.
