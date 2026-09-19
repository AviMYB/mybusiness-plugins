# Dictionary Setup — Hebrew Labels for SLA Tables

`_Dictionary` is the terminology table the platform uses to render Hebrew labels in admin screens, forms, and reports. The mechanism: rows like `{tblName: "SLASettings", field: "SLAHours", value: "תקציב שעות"}` cause the platform to display "תקציב שעות" wherever the raw field name `SLAHours` would otherwise appear.

When you configure SLA for a new customer, **always do this step before showing them anything**. Otherwise they see raw English schema field names (`CaseTypeId`, `SLAHours`, `WeeklyHours`) in the settings UI and reports, which looks unfinished and is a guaranteed support ticket.

## How the dictionary attribute appears

After a row is inserted into `_Dictionary`, calling `Get-Schema(className: "SLASettings")` will return the field decorated with a `dictionary` key:

```json
"SLAHours": { "type": "Number", "dictionary": "תקציב שעות" }
```

That `dictionary` attribute is **not** a marker for "custom field" — it's just the localized label. Many platform-shipped fields on `Cases` already have entries (SLADeadline, ResponseTime, etc.). Don't read the attribute as "this customer added this field manually" — that's wrong.

## Schema of `_Dictionary`

```
{
  tblName: String,    // e.g. "SLASettings"
  field:   String,    // e.g. "SLAHours"
  value:   String     // e.g. "תקציב שעות"
}
```

Standard MCP CRUD applies — `Create-Many` for bulk, `Update-Data` for edits, query by `(tblName, field)` to find an existing row before duplicating.

## Required entries for the SLA mechanism

Run this once per customer. Adjust the Hebrew strings if the customer prefers different terminology (e.g., "פניה" vs "קריאת שירות").

```
Create-Many(
  table: "_Dictionary",
  data: [
    { tblName: "SLASettings",   field: "CaseTypeId",              value: "סוג פניה" },
    { tblName: "SLASettings",   field: "CaseSubTypeId",           value: "תת-סוג פניה" },
    { tblName: "SLASettings",   field: "CaseStatusId",            value: "סטטוס פניה" },
    { tblName: "SLASettings",   field: "SLAHours",                value: "תקציב שעות" },
    { tblName: "SLASettings",   field: "SLADays",                 value: "תקציב ימים" },
    { tblName: "BusinessHours", field: "Name",                    value: "שם לוח הזמנים" },
    { tblName: "BusinessHours", field: "WeeklyHours",             value: "חלון שבועי" },
    { tblName: "BusinessHours", field: "SpecialDates",            value: "מועדים מיוחדים" },
    { tblName: "BusinessHours", field: "ConsiderIsraeliHolidays", value: "התחשבות בחגי ישראל" },
    { tblName: "CaseStates",    field: "Name",                    value: "שם מצב" },
    { tblName: "CaseStatuses",  field: "Name",                    value: "שם סטטוס" },
    { tblName: "CaseStatuses",  field: "StateId",                 value: "מצב פניה" }
  ]
)
```

The `Cases`-side fields (`SLADeadline`, `ResponseTime`, `ResolutionTime`, `IsEscalated`, `EscalationLevel`, `EscalatedTo`, `EstimatedResolution`) are typically already present in `_Dictionary` because they ship with the platform. Verify before adding duplicates:

```
Get-Data(
  table: "_Dictionary",
  where: { tblName: "Cases", field: { $in: ["SLADeadline", "ResponseTime", "ResolutionTime"] } },
  limit: 20
)
```

If a customer is using non-Hebrew labels (international customer), insert their language strings instead. The platform stores one entry per `(tblName, field)`; there's no built-in multi-language support on this table — so you pick one language per environment.

## When the customer wants to rename a term

Use `Replace-Terms` (the MCP tool) for terminology overrides — it operates at a higher level than raw `_Dictionary` writes. But for the small set of SLA fields documented here, a direct `Create-Many` + `Update-Data` is faster and more explicit.

## Verification

After running the create, sample a few schemas:

```
Get-Schema(className: "SLASettings")
Get-Schema(className: "BusinessHours")
```

Confirm each field shows the `dictionary:` attribute with the Hebrew value. If a row didn't take, `Get-Data(table: "_Dictionary", where: { tblName: "..." })` will show what's missing.
