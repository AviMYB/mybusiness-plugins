# SLA Prerequisites — Case Types, Sub-Types, Statuses, States

The SLA engine depends on four taxonomy tables being populated and wired together correctly. If any one of them is incomplete, the SLA clock will either fail to start or fail to stop, and the customer will report "wrong remaining time" without a clear root cause.

## The dependency chain

```
CaseTypes ─┐
            ├─── SLASettings (one row per rule)
CaseSubTypes (TypeId → CaseTypes) ─┤
            │
CaseStatuses (StateId → CaseStates) ─── tells the engine when the clock pauses
```

`CaseStates` is the critical piece. It groups statuses into **open** (clock runs) or **closed/paused** (clock stops). The seed data ships with at least `פתוח` and `סגור`. Every row in `CaseStatuses` must point to one of them via `StateId`.

## Table schemas

| Table | Key fields |
|-------|------------|
| `CaseTypes` | `Name` (String) |
| `CaseSubTypes` | `Name` (String), `TypeId` → `CaseTypes` |
| `CaseStatuses` | `Name` (String), `StateId` → `CaseStates` |
| `CaseStates` | `Name` (String) — typically `פתוח` / `סגור` / optionally `בהמתנה` |

## Where the user manages this in the UI

- הגדרות מערכת → הגדרות פניות → **סוגי קריאות שירות** (`apps/mybusiness/System-Tables-Cases-Types`)
- הגדרות מערכת → הגדרות פניות → **תת סוגי קריאות שירות** (`apps/mybusiness/System-Tables-Cases-Sub-Types`)
- הגדרות מערכת → הגדרות פניות → **סטטוסי קריאות שירות** (`apps/mybusiness/System-Tables-Case-Statuses`) — this screen is where the customer maps each status to a `CaseState`.

The status configuration screen exposes the `StateId` as a required dropdown. If the customer set up statuses *before* the SLA feature shipped, those legacy rows may have a NULL `StateId` and need to be backfilled before SLA will behave.

## Audit calls

Run these first whenever a customer reports an SLA issue. They take seconds and rule out the most common root cause.

```
Get-Data(table: "CaseStates", limit: 20, keys: ["objectId", "Name"])
Get-Data(table: "CaseStatuses", limit: 100, keys: ["objectId", "Name", "StateId"])
Get-Data(table: "CaseTypes", limit: 50, keys: ["objectId", "Name"])
Get-Data(table: "CaseSubTypes", limit: 100, keys: ["objectId", "Name", "TypeId"])
```

What to look for:

- Any `CaseStatuses` row where `StateId` is missing → the engine will treat that status as "open" forever, and cases that land in it will appear to run over their SLA indefinitely.
- Any `CaseSubTypes` row with `TypeId` missing → the customer's "type+sub-type" SLA rules will silently miss those sub-types.
- A `CaseStates` table with only one row → there is nothing the engine can use to detect a closed state. Add at least a "closed" state and map the closure statuses to it.

## Fixing a missing StateId

```
Update-Data(
  table: "CaseStatuses",
  objectId: "<status row id>",
  data: { StateId: { __type: "Pointer", className: "CaseStates", objectId: "<closed-state id>" } }
)
```

The next time the engine evaluates that case, it will see the case is in a closed-state status and stop the clock. Existing overdue counters typically clear on the next scheduled SLA tick (or immediately on the next case update, depending on environment).

## Adding a new "paused" state (optional)

Some customers want a third state for statuses like "ממתין ללקוח" / "מושהה". Create it:

```
Create-Data(table: "CaseStates", data: { Name: "בהמתנה" })
```

Then map the relevant statuses' `StateId` to it. The engine treats anything that isn't the open state as not-counting, so a "paused" state behaves like a closed state for clock purposes. (If the customer wants the case to *reappear* as overdue when it goes back to open, that's the engine's default behavior — no extra work.)
