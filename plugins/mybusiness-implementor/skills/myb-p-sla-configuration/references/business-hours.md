# Business Hours — Working Window for SLA

`BusinessHours` is the table that defines the working-week window plus holiday calendar for SLA computations. There is no support for multiple parallel working windows on this table (this is different from MyChat, which does allow multiple windows).

> **Important:** `BusinessHours` is *configuration only* — the simple trigger pattern in `sla-triggers.md` adds calendar minutes via `timeGap` and does **not** consult this table. To honor weekends, holidays, and special dates, you need the `server-side-code` variant of the SLA-deadline trigger, which reads `BusinessHours` and walks forward business days. Document this with the customer when choosing between the simple and proper implementations.

## Schema

| Field | Type | Purpose |
|-------|------|---------|
| `Name` | String | Human-readable label (e.g., "שעות פעילות SLA") |
| `WeeklyHours` | Array | Per-day open/close ranges — one entry per weekday |
| `SpecialDates` | Array | Ad-hoc closure dates (holidays not covered by the Israeli-holidays flag, training days, company offsites) |
| `ConsiderIsraeliHolidays` | Boolean | If true, the engine subtracts Israeli legal holidays automatically — the customer doesn't have to list them in `SpecialDates` |

## Where the user manages this in the UI

הגדרות מערכת → הגדרות פניות → **שעות פעילות עבור SLA** → page `apps/mybusiness/System-SLA-BusinessHours`.

The UI exposes:
- A name field
- A weekly grid (one row per day of the week) with from/to times and an "active" toggle per day
- A checkbox for "התחשב במועדי וחגי ישראל" (this writes `ConsiderIsraeliHolidays`)
- A list of special dates the user can append to

## WeeklyHours array shape

Each entry represents one weekday. Day-of-week numbering follows the same convention as the MyChat working-hours table that this schema is reused from — verify the exact key names by reading an existing record with `Get-Data` before authoring new rows, since the array shape isn't surfaced in `Get-Schema` (it's stored as a free-form Array).

Typical pattern:

```json
[
  { "day": "Sunday",    "active": true,  "from": "09:00", "to": "17:00" },
  { "day": "Monday",    "active": true,  "from": "09:00", "to": "17:00" },
  { "day": "Tuesday",   "active": true,  "from": "09:00", "to": "17:00" },
  { "day": "Wednesday", "active": true,  "from": "09:00", "to": "17:00" },
  { "day": "Thursday",  "active": true,  "from": "09:00", "to": "17:00" },
  { "day": "Friday",    "active": false, "from": "",      "to": ""      },
  { "day": "Saturday",  "active": false, "from": "",      "to": ""      }
]
```

If the existing record uses different key names (e.g., `dayOfWeek`, `start`, `end`), match those — don't introduce new keys.

## Creating the row from scratch

If `Count-Data(table: "BusinessHours") == 0`, create one:

```
Create-Data(
  table: "BusinessHours",
  data: {
    Name: "שעות פעילות SLA",
    ConsiderIsraeliHolidays: true,
    WeeklyHours: [ /* array from above, adjusted to the customer's hours */ ],
    SpecialDates: []
  }
)
```

After saving, sanity-check with `Get-Data(table: "BusinessHours", limit: 1)` and make sure the array survived the round-trip — Parse can be picky about Array vs Object on first write.

## Updating the existing row

Always prefer `Update-Data` on the existing row to creating a second one. The engine reads the first row, so a second row would just sit there unused while the customer wonders why their edits don't apply.

```
Update-Data(
  table: "BusinessHours",
  objectId: "<row id>",
  data: { ConsiderIsraeliHolidays: true }
)
```

## Adding a special date

`SpecialDates` is an array — when adding a date, append to the existing array, don't overwrite it. Read the current array first, push the new entry, then write the full array back. Pattern for entries:

```json
{ "date": "2026-09-23", "name": "ערב ראש השנה (חצי יום)", "closed": true }
```

If the customer needs a partial-day closure (e.g., "ערב חג — סוגרים ב-13:00"), check whether the existing entries store a `from`/`to` pair as well. If so, match the schema. If the schema is closed-only, model the half-day in `WeeklyHours` for that specific date by adding a per-date override entry (some implementations support that, some don't — verify with the customer's existing data).

## Common gotchas

- **Customer is in a non-Israeli market.** Don't enable `ConsiderIsraeliHolidays` for them — instead list their local holidays in `SpecialDates`. Confirm the market before flipping this on; the holiday list is wired to Israeli legal holidays and there's no parameter to swap it out.
- **24/7 customer (no weekend).** Mark every day active, `from: "00:00"`, `to: "23:59"`. The engine will treat that as a continuously-running clock — which is what they want — and the SLA durations behave like wall-clock time instead of business time.
- **Multiple shifts** (e.g., morning team 09:00–13:00, evening team 17:00–21:00, closed in between). This requires two ranges in the same day. If `WeeklyHours` only allows one from/to per day in the customer's environment, escalate to product — it's a known limitation, and the workaround is to model it as 09:00–21:00 with the gap absorbed (which inflates the SLA budget) or to wait for a feature update.
