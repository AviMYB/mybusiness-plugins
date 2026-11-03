# Business Hours — Working Window for SLA

`BusinessHours` is the table that defines the working-week window plus holiday calendar for SLA computations. The table can hold more than one schedule — MyChat's chatbot builder keeps its own schedules here, under their own names — but the SLA uses exactly one: the row named `SLA`. A schedule holds one open/close range per day, so a split shift can't be expressed (see the gotchas below).

> **Important:** `BusinessHours` is *configuration only* — the simple trigger pattern in `sla-triggers.md` adds calendar minutes via `timeGap` and does **not** consult this table. To honor weekends, holidays, and special dates, you need the `server-side-code` variant of the SLA-deadline trigger, which reads `BusinessHours` and walks forward business days. Document this with the customer when choosing between the simple and proper implementations.

## Schema

| Field | Type | Purpose |
|-------|------|---------|
| `Name` | String | Must be exactly `SLA`. The SLA hours screen finds its row by this name and always saves under it |
| `WeeklyHours` | Array | Seven elements, one per weekday — shape below |
| `SpecialDates` | Array | Dates whose hours differ from the weekly grid: closures (holidays not covered by the Israeli-holidays flag, training days, company offsites) or shorter days — shape below |
| `ConsiderIsraeliHolidays` | Boolean | If true, the engine subtracts Israeli legal holidays automatically — the customer doesn't have to list them in `SpecialDates` |
| `StartMaxTime` | String, optional | `"HH:MM"` cut-off for day-based SLA: cases opened after this time count from the next business day. The screen removes the field when its input is left empty |

`Get-Schema` shows `WeeklyHours` and `SpecialDates` only as `Array`, so nothing enforces the element shape: a row with other keys saves without an error, and the screen can't read it.

## Where the user manages this in the UI

הגדרות מערכת → הגדרות פניות → **שעות פעילות עבור SLA** → page `apps/mybusiness/System-SLA-BusinessHours`.

The screen shows one schedule, the row named `SLA`, or a **צור לוח זמנים SLA** button when there is none. Its form exposes:
- The name field, locked to `SLA`
- The cut-off time "פניות שיפתחו לאחר שעה זו ישוייכו ליום העסקים הבא (עבור SLA לפי ימים)" (this writes `StartMaxTime`)
- Tab **ימי השבוע** — one row per day with שעת פתיחה, שעת סגירה and זמינות המחלקה (מחלקה פתוחה / מחלקה סגורה כל היום) (this writes `WeeklyHours`)
- Tab **מועדים מיוחדים** — the "התחשב במועדי וחגי ישראל" toggle (this writes `ConsiderIsraeliHolidays`) and a list of special dates the user can append to, each with a name, a date, opening and closing times and the same availability choice (this writes `SpecialDates`)

## WeeklyHours array shape

Each element is one weekday. This is the shape the SLA hours screen reads and writes; MyChat's chatbot schedules in the same table use the same shape.

| Key | Value |
|-----|-------|
| `d` | Day number: `0` = Sunday (ראשון) … `6` = Saturday (שבת). The screen finds each day by `d`, so list each number once |
| `openTime` | `"HH:MM"`, 24-hour |
| `closeTime` | `"HH:MM"`, 24-hour |
| `isOpen` | Boolean. `false` = closed all day; the screen then stores both times as `"00:00"` |

Sunday to Thursday 09:00–17:00, closed on Friday and Saturday:

```json
[
  { "d": 0, "openTime": "09:00", "closeTime": "17:00", "isOpen": true  },
  { "d": 1, "openTime": "09:00", "closeTime": "17:00", "isOpen": true  },
  { "d": 2, "openTime": "09:00", "closeTime": "17:00", "isOpen": true  },
  { "d": 3, "openTime": "09:00", "closeTime": "17:00", "isOpen": true  },
  { "d": 4, "openTime": "09:00", "closeTime": "17:00", "isOpen": true  },
  { "d": 5, "openTime": "00:00", "closeTime": "00:00", "isOpen": false },
  { "d": 6, "openTime": "00:00", "closeTime": "00:00", "isOpen": false }
]
```

Elements the screen saved can also carry a Hebrew label (`"day": "ראשון"`). Nothing reads it; leave it as it is.

If an existing row uses other keys (for example `day` / `active` / `from` / `to`), the screen counts 0 active days and fills its form with its own defaults instead of the stored hours. Rewrite the whole array in the shape above — don't add new keys next to the old ones.

## Creating the row from scratch

Look for the SLA row by name, since the table may already hold MyChat schedules under other names:

```
Count-Data(table: "BusinessHours", where: { Name: "SLA" })
```

If it returns 0, create one:

```
Create-Data(
  table: "BusinessHours",
  data: {
    Name: "SLA",
    ConsiderIsraeliHolidays: true,
    WeeklyHours: [ /* array from above, adjusted to the customer's hours */ ],
    SpecialDates: []
  }
)
```

Use exactly `SLA` as the name. A row under any other name is invisible to the screen, and the first save on the screen then creates a second row named `SLA`.

After saving, sanity-check with `Get-Data(table: "BusinessHours", where: { Name: "SLA" })` and make sure the array survived the round-trip — Parse can be picky about Array vs Object on first write. Then open the screen: its list should show the schedule with the right number of active days.

## Updating the existing row

Always prefer `Update-Data` on the existing `SLA` row to creating a second one. The screen reads and saves one row, the first one named `SLA`, so a second row would just sit there unused while the customer wonders why their edits don't apply. Rows with other names may be MyChat chatbot schedules (a bot refers to its schedule by row id), so don't rename or reuse them for the SLA.

```
Update-Data(
  table: "BusinessHours",
  objectId: "<row id>",
  data: { ConsiderIsraeliHolidays: true }
)
```

An array is written whole: to change one day, read `WeeklyHours`, edit that element, and write all seven back.

## Adding a special date

`SpecialDates` is an array — when adding a date, append to the existing array, don't overwrite it. Read the current array first, push the new entry, then write the full array back. Each entry uses the same time keys as a weekday:

| Key | Value |
|-----|-------|
| `name` | The label shown on the screen |
| `date` | `"YYYY-MM-DD"` |
| `openTime` / `closeTime` | `"HH:MM"`; `"00:00"` when closed |
| `isOpen` | `false` = closed all day; `true` = open with the hours given |
| `id` | Optional. The screen adds a millisecond timestamp to the entries it creates |

A full-day closure, and a partial day (e.g., "סוגרים ב-13:00"), which is an open entry with shorter hours:

```json
[
  { "id": 1797292800000, "name": "יום גיבוש", "date": "2026-12-15", "openTime": "00:00", "closeTime": "00:00", "isOpen": false },
  { "id": 1797379200000, "name": "יום עיון (חצי יום)", "date": "2026-12-16", "openTime": "08:00", "closeTime": "13:00", "isOpen": true }
]
```

## Common gotchas

- **Customer is in a non-Israeli market.** Don't enable `ConsiderIsraeliHolidays` for them — instead list their local holidays in `SpecialDates`. Confirm the market before flipping this on; the holiday list is wired to Israeli legal holidays and there's no parameter to swap it out.
- **24/7 customer (no weekend).** Mark every day `isOpen: true`, `openTime: "00:00"`, `closeTime: "23:59"`. The engine will treat that as a continuously-running clock — which is what they want — and the SLA durations behave like wall-clock time instead of business time.
- **Multiple shifts** (e.g., morning team 09:00–13:00, evening team 17:00–21:00, closed in between). This requires two ranges in the same day. `WeeklyHours` holds one `openTime`/`closeTime` pair per day, so a split shift cannot be expressed directly. The options are to model it as 09:00–21:00 and accept that the gap inflates the SLA budget, or to raise the requirement with MyBusiness as a fit-gap item.
- **The screen says "אין לוח זמנים SLA מוגדר" although a row exists.** No row is named `SLA`. Create the `SLA` row, or rename the existing one if it was made for the SLA rather than as a MyChat schedule.
- **The screen lists the schedule with 0 active days.** The `WeeklyHours` elements use other keys. Rewrite the array in the shape above.
