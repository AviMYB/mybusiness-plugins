---
name: myb-p-sla-configuration
description: "Configure and operate the SLA mechanism for the Cases module in MyBusiness CRM — terminology, case states, working hours / Israeli holidays / special dates, SLA targets, triggers that populate SLA fields, per-status SLA tracking table with a Case-card widget, scheduled escalation triggers, and the three standard SLA reports. Use whenever a customer wants deadlines for case handling, SLA in days/hours, per-status SLA progress on the case card, escalation alerts before/after breach, SLA reports, or troubleshooting SLA fields that don't update. Triggers: SLA, הגדרות SLA, זמן תקן לטיפול, זמן שנותר לטיפול, זמן מענה, יעדי טיפול, חלון שירות, שעות פעילות SLA, ימי עסקים, חגי ישראל בחישוב SLA, escalation על SLA, חריגת SLA, התראה לפני חריגה, התראה למנהל על חריגה, overdue case, deadline פניה, business hours, case SLA, case states פתוח סגור, SLASettings, BusinessHours, CaseStates, CaseSLAProcess, טבלת מעקב SLA בכרטיס פניה, דוח SLA, דוח חריגות, scheduled trigger, סקדול טריגר."
---

# SLA Configuration / הגדרת והפעלת מנגנון SLA

The SLA setup in MyBusiness CRM has seven moving parts that must all be configured for the mechanism to actually work end-to-end. Missing any one of them produces a system that *looks* configured but doesn't enforce anything.

1. **Terminology** (`_Dictionary`) — Hebrew labels for SLA fields so the customer's UI is readable.
2. **Case States** (`CaseStates` + `CaseStatuses.StateId`) — groups statuses into *open / closed / paused*. The SLA clock only runs while a case sits in an "open" state.
3. **Business Hours** (`BusinessHours`) — the working-week window plus Israeli holidays and special dates. Only minutes inside this window count.
4. **SLA Targets** (`SLASettings`) — the target itself, in hours or days, scoped to case type / type+sub-type / type+sub-type+status.
5. **Triggers that populate SLA fields on Cases** — `SLADeadline`, `ResponseTime`, `ResolutionTime` are **not** auto-populated by a built-in engine in most environments. Triggers are required.
6. **Per-status tracking table + Case-card widget** (`CaseSLAProcess` + triggers + UI widget) — gives the agent a row-per-status history of the SLA clock right on the case card.
7. **Escalation** (scheduled triggers + reports) — proactive notifications before/after breach + reports that surface breached cases.

## Important — what the platform does and doesn't do

The `SLASettings` and `BusinessHours` tables, plus the configuration pages under הגדרות מערכת → הגדרות פניות, are **configuration shells**. As of the current platform state (a known platform gap), there is **no runtime engine that automatically reads these tables and writes `SLADeadline` / `ResponseTime` / `ResolutionTime` onto cases**. Empirically (verified in the Playground demo), populating `SLASettings` and creating cases produces *no* SLA fields on those cases.

The practical implication: when implementing SLA for a customer, you must **also build the triggers** that populate the fields and that maintain the per-status tracking table. The `SLASettings` table then serves as the *documentation* of the SLA rules, plus a source for any reports that join against it, but it is the triggers that actually move the data.

The fields `SLADeadline`, `ResponseTime`, `ResolutionTime`, `EstimatedResolution`, `IsEscalated`, `EscalationLevel`, `EscalatedTo` are **platform fields** on the `Cases` schema — they exist on every app and have entries in `_Dictionary` for Hebrew labels. They're not custom-customer additions. The `dictionary` attribute that appears next to them in `Get-Schema` output is just their localized label, not a marker of "custom field." Don't be misled by that attribute.

---

## What you need from the user before configuring

1. **Granularity** — should the SLA target depend only on `CaseType`, on `CaseType + SubType`, or on `CaseType + SubType + Status`? Same row in `SLASettings`, you just pick which pointer fields you populate.
2. **Days or hours** — durations live in `SLADays` or `SLAHours`. Pick one per row.
3. **Working window** — single weekly window + Israeli holidays + ad-hoc special dates. Multiple parallel windows are not supported here.
4. **Status mapping** — confirm "closed" / "paused" statuses are mapped to non-open `CaseStates`.
5. **Escalation policy** — who gets notified, when (e.g., 2 hours before deadline; on breach). The default skill template notifies `OwnerId`; for "manager" notifications, the customer must provide a specific user objectId or a role to look up.
6. **Business-day computation depth** — the simple trigger pattern in this skill adds calendar days. True business-day computation (skipping weekends + Israeli holidays) requires a `server-side-code` action. Confirm with the customer whether calendar-day is acceptable for v1, or whether you need to involve a developer.

---

## End-to-end setup workflow

Each step has a reference file with full details. Follow them in order — earlier steps create the data and labels later steps depend on.

### Step 1 — Verify prerequisites
`references/prerequisites.md`

Confirm `CaseTypes`, `CaseSubTypes`, `CaseStatuses`, and `CaseStates` are populated and that every `CaseStatuses` row has a `StateId` pointer.

### Step 2 — Add Dictionary translations
`references/dictionary-setup.md`

Insert `_Dictionary` rows for every field across the SLA tables so the UI and reports show Hebrew labels.

### Step 3 — Configure Business Hours
`references/business-hours.md`

Create the single `BusinessHours` row describing the weekly schedule, Israeli holidays flag, and any special dates.

### Step 4 — Define SLA targets
`references/sla-settings.md`

Insert one row per SLA rule into `SLASettings`. Use the granularity decision from intake.

### Step 5 — Set up the SLA-population triggers
`references/sla-triggers.md`

Three data-change triggers that stamp `SLADeadline`, `ResponseTime`, `ResolutionTime` on the case at the right moments. Without these, the SLA fields stay empty forever.

### Step 6 — Build the per-status tracking table + Case-card widget
`references/case-sla-process-table.md`

This is the visible "where are we right now in the SLA process" view the agent sees on the case card. Three sub-steps:

a. **Create the `CaseSLAProcess` table** with fields for per-status tracking (status entered/exited, deadline, allowed budget, current/breached/paused flags).

b. **Two triggers** on `Cases` to populate it:
   - On case create → create initial tracking row for the opening status.
   - On status change → create a new tracking row for the new status.

c. **Embed a table widget on the Case form page** via the `myb-p-page-tables` skill. The widget shows `CaseSLAProcess` rows filtered automatically by the open case. **Always invoke `myb-p-page-tables` for this step** — it documents the `aggrField` requirement, placement gotchas (KI-9), and the `Edit-Table-View` finalization that this skill can't shortcut.

### Step 7 — Set up escalation (scheduled triggers)
`references/escalation-triggers.md`

Two scheduled triggers keyed off `SLADeadline`: 2-hour warning + breach escalation.

### Step 8 — Create the three standard SLA reports
`references/sla-reports.md`

1. **דוח SLA — כללי** — every case with all SLA fields, full filter palette.
2. **דוח SLA — חריגות פניות פתוחות** — defaults to `IsClosed = false`, sorted by `SLADeadline` ascending.
3. **דוח SLA — חריגות פניות סגורות** — defaults to `IsClosed = true`, sorted by `ResolutionTime` descending.

### Step 9 — Verify on a real case
`references/verify-and-troubleshoot.md`

Open a test case, confirm `SLADeadline` populates on creation, walk it through statuses, confirm `ResponseTime`/`ResolutionTime` populate, confirm `CaseSLAProcess` rows accumulate, and confirm the widget renders all rows on the card.

---

## How to know if a case met or breached SLA

Once Step 5 triggers are in place, the determination is straightforward from the Case row itself:

| Condition on the Case row | Meaning |
|----------------------------|---------|
| `ResponseTime` exists and `ResponseTime <= SLADeadline` | **Met** — first response landed before deadline |
| `ResponseTime` exists and `ResponseTime > SLADeadline` | **Breached** — response landed, but late |
| `ResponseTime` is null and `SLADeadline < now` and `IsClosed = false` | **Currently breaching** |
| `ResponseTime` is null and `SLADeadline >= now` | **Within budget** |

The per-status view comes from `CaseSLAProcess` (Step 6). Each row shows `StatusEnteredAt`, `StatusExitedAt`, `DeadlineForStatus`, and the `IsBreached` flag for that specific status, giving the agent the full handoff history with deadlines.

---

## Working with an existing customer setup

Before changing anything, audit:

```
Get-Data(table: "SLASettings", limit: 100)
Get-Data(table: "BusinessHours", limit: 5)
Get-Data(table: "CaseStates", limit: 20)
Get-Data(table: "CaseStatuses", keys: ["Name", "StateId"], limit: 50)
Get-Triggers(tableName: "Cases")     -- confirm SLA-population + tracking triggers exist
Get-Schema(className: "CaseSLAProcess")  -- confirm the tracking table exists
Get-Reports()                          -- confirm the 3 SLA reports exist
Count-Data(table: "Cases", where: { SLADeadline: { $exists: true } })  -- if 0, triggers aren't running
Count-Data(table: "CaseSLAProcess")    -- if 0 but cases have SLADeadline, the tracking triggers aren't running
```

A common situation: the customer "has SLA" because the admin pages exist and `SLASettings` has rows, but `Count-Data` for cases with `SLADeadline` returns 0. That means triggers are missing — they assumed the engine was wired up.

---

## Common requests and how to handle them

**"Add a per-case SLA history table on the case card"** — that's `CaseSLAProcess` + Step 6. Read `references/case-sla-process-table.md` and invoke `myb-p-page-tables` for the UI widget part.

**"Add an SLA of 4 hours for VIP cases"** — a row in `SLASettings` with `SLAHours = 4` and the matching `CaseTypeId`. Plus verify the Step 5 trigger covers that case type.

**"SLA should not run on weekends / holidays"** — that lives in `BusinessHours`, but the simple `createdAt + N days` trigger doesn't consult it. For weekend skipping you need a `server-side-code` action — see `references/sla-triggers.md`.

**"Case is in 'סגור' but SLADeadline keeps showing as overdue"** — `SLADeadline` is a static computed value, it doesn't "clear" on close. The reports filter on `IsClosed`. If the customer wants the visual to soften on close, that's a Case-card JS change, not a database thing.

**"Show me cases that breached SLA last month"** — open report #3 (closed breaches), filter `ResolutionTime` between dates.

**"I want manager alerts instead of owner alerts"** — edit the Step 7 scheduled triggers, change `userType` from `field`/`OwnerId` to `fixed`/`<manager-user-id>`.

---

## Things to be aware of

- **The engine is not auto-running.** Configuration alone (`SLASettings` + `BusinessHours`) doesn't compute anything. You need the triggers from Step 5 and Step 6. This is a known gap on the product side.
- **Calendar vs business days.** The simple trigger pattern adds calendar days. True business-day computation needs a server-side cloud function.
- **Granularity precedence.** Rules with more pointers are more specific. For full precedence behavior with type-based or status-based SLA durations, server-side-code is needed; the simple `timeGap` trigger uses one fixed value.
- **Only one Business Hours window is supported.** Don't try to model two shifts as two rows.
- **Don't set both `SLAHours` and `SLADays`** on the same row.
- **Always use `myb-p-page-tables` for the Case-card widget** — don't try to shortcut it from this skill. The page-tables skill documents the platform's `aggrField` requirement, placement gotchas, and `Edit-Table-View` finalization that this skill should not duplicate or contradict.
- **The design intent** covers case sub-types, working hours, the SLA settings screen, the computation + `CaseSLAProcess` design, and case states. A known product-side gap (`CaseSLAProcess` rows not auto-created) explains why nothing populates without the manual triggers this skill builds.

---

## Reference files

- `references/prerequisites.md` — `CaseTypes` / `CaseSubTypes` / `CaseStatuses` / `CaseStates` setup and `StateId` wiring.
- `references/dictionary-setup.md` — `_Dictionary` entries for all SLA-related tables and fields.
- `references/business-hours.md` — `BusinessHours` schema and weekly window shape.
- `references/sla-settings.md` — `SLASettings` schema, granularity patterns, precedence.
- `references/sla-triggers.md` — Three data-change triggers that populate `SLADeadline` / `ResponseTime` / `ResolutionTime` on the Case row.
- `references/case-sla-process-table.md` — The `CaseSLAProcess` table, its two population triggers, and the Case-card widget (hands off to `myb-p-page-tables` for the UI part).
- `references/escalation-triggers.md` — Scheduled triggers for pre-breach warnings and breach escalation.
- `references/sla-reports.md` — Spec for the three standard reports.
- `references/verify-and-troubleshoot.md` — End-to-end verification, common failure modes, and a fast diagnostic playbook.
