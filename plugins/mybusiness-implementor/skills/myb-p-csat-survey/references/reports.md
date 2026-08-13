# The manager's report set

Six reports. Build them with `Create-or-Update-Report`; the parameter grammar, `aggrField` paths, QueryElems ordering and the scheduling gotchas all live in `myb-p-create-update-reports` → `references/report-building-guide.md` — this file only says *which* reports to build, why each one exists, and what breaks it.

Substitute throughout: `<TABLE>` = the business table (`Cases` in most service tenants), `<OWNER>` = its agent/owner pointer, `<CATEGORY>` = the slice the customer already reports by (product, department, case type). `<ADMIN_USER_ID>` = the objectId for `editPermissions` (required when writing with a master key).

**Build order matters.** R1 and R2 are the ones a process owner opens; build them first and show them, because a manager who sees one useful table will tell you what the other four should be. Do not build all six blind.

---

## R1 · פירוט משובים — the detail list

The one that answers "what did people actually say". Everything else is a summary of this.

```json
{ "Name": "שביעות רצון — פירוט", "ClassName": "<TABLE>",
  "PageName": "apps/mybusiness/reports",
  "permissions": ["role:Admin", "<manager role>"], "editPermissions": "<ADMIN_USER_ID>",
  "IsAggr": false,
  "ShowFields": ["Name", "AccountId.Name", "<OWNER>.name", "CsatRating", "CsatComment", "CsatAt"],
  "OptionalFields": [
    {"field": "Name",            "summary": "", "text": "פנייה"},
    {"field": "AccountId.Name",  "summary": "", "text": "לקוח"},
    {"field": "<OWNER>.name",    "summary": "", "text": "נציג"},
    {"field": "CsatRating",      "summary": "", "text": "דירוג"},
    {"field": "CsatComment",     "summary": "", "text": "הערת הלקוח"},
    {"field": "CsatAt",          "summary": "", "text": "מתי דורג", "dateFormat": "dd/mm/yy"}
  ],
  "QueryElems": [
    {"F": "CsatRating", "FText": "דירוג",   "C": "exists",              "T": "Number", "V": true},
    {"F": "<OWNER>",    "FText": "נציג",    "C": "containedIn",         "T": "Pointer", "V": [],
     "P": {"targetClass": "_User", "multiple": true}},
    {"F": "CsatAt",     "FText": "מתאריך",  "C": "greaterThanOrEqualTo","T": "Date", "V": ""},
    {"F": "CsatAt",     "FText": "עד תאריך","C": "lessThanOrEqualTo",   "T": "Date", "V": ""}
  ],
  "Sort": "-CsatAt", "AllowCsv": true, "GridDivider": 3 }
```

The `exists` filter on `CsatRating` is what keeps unrated records out. Without it the report shows every closed case and the manager concludes the survey is broken.

## R2 · ממוצע פר נציג — the quality metric

Usually the team's **first** quality measure; everything else the manager has is volume. Expect this one to be looked at more than any dashboard you build.

```json
{ "Name": "שביעות רצון — ממוצע פר נציג", "ClassName": "<TABLE>", "IsAggr": true,
  "ShowFields": ["<OWNER>.name", "CsatRating"],
  "OptionalFields": [
    {"field": "<OWNER>.name", "summary": "",    "text": "נציג",
     "aggrField": "<OWNER>._User.name"},
    {"field": "CsatRating",   "summary": "avg", "text": "ממוצע דירוג",
     "aggrField": "CsatRating", "aggrFunc": "avg"},
    {"field": "objectId",     "summary": "count","text": "כמות משובים",
     "aggrField": "objectId", "aggrFunc": "count"}
  ],
  "QueryElems": [
    {"F": "CsatRating", "FText": "דירוג",   "C": "exists",              "T": "Number", "V": true},
    {"F": "CsatAt",     "FText": "מתאריך",  "C": "greaterThanOrEqualTo","T": "Date", "V": ""},
    {"F": "CsatAt",     "FText": "עד תאריך","C": "lessThanOrEqualTo",   "T": "Date", "V": ""}
  ],
  "Sort": "-CsatAt", "AllowCsv": true, "GridDivider": 3 }
```

**Ship the count column with it, always.** An average over two responses is noise, and a manager who acts on it in a feedback conversation with an agent will burn the mechanism's credibility in one meeting. The count is what tells them when the number is worth using.

## R3 · מגמה לפי חודש ונציג — is it moving?

A pivot: agents down the side, months across the top. `IsAggr: true` plus:

```json
"PivotInfo": { "row": "<OWNER>.name", "col": "CsatAt", "value": "CsatRating" }
```

with `CsatAt` carrying `"aggrFunc": "mm/yy"` and `CsatRating` carrying `"aggrFunc": "avg"`. Check whether the tenant already has a monthly-trend report (volume by month is nearly universal) and copy its shape — a manager reads a familiar layout faster than a better one.

Before promising this report, verify the rated records actually carry **both** an owner and a date: a null in either drops the row from the cell silently rather than erroring, so the table looks complete and under-counts.

## R4 · התפלגות דירוגים — what the average is hiding

Group by `CsatRating`, count. Three rows. It exists because an average of 2 can be "everyone is lukewarm" or "half are delighted and half are furious", and those are different problems with different fixes. Cheap to build, and the first thing worth showing when someone challenges the average.

```json
{ "IsAggr": true, "ShowFields": ["CsatRating"],
  "OptionalFields": [
    {"field": "CsatRating", "summary": "",     "text": "דירוג",  "aggrField": "CsatRating"},
    {"field": "objectId",   "summary": "count","text": "כמות",   "aggrField": "objectId", "aggrFunc": "count"}
  ] }
```

## R5 · דירוגים שליליים — the work queue

Same shape as R1, but `CsatRating` filtered to the negative level(s) and sorted **oldest first** (`"Sort": "CsatAt"`). This is a queue, not a statistic: the oldest unhandled complaint is the one that matters, and a newest-first sort quietly buries it.

```json
{"F": "CsatRating", "FText": "דירוג", "C": "lessThanOrEqualTo", "T": "Number", "V": <negative threshold>}
```

If the build also opens a task or notification on a negative rating (SKILL.md Step 8), this report is the audit of that mechanism — a row here with no matching task means the response trigger is not firing.

## R6 · שיעור מענה — is the mechanism alive at all?

**The most important number and the one nobody builds**, because it needs a denominator the base recipe does not create. Response rate = surveys answered ÷ surveys sent. Without it, a mechanism that everyone ignores looks identical to one that works, and you find out a year later.

**Prerequisite — one extra action on the send trigger (Step 6).** Add a second action to the trigger that sends the mail:

```json
{ "actionType": "update-object",
  "actionData": { "update-object": {
      "targetClass": "<TABLE>", "connection": "current.objectId",
      "fieldsValue": [ { "field": "CsatSentAt", "type": "dynamic", "value": "updatedAt" } ] } } }
```

Add `CsatSentAt` (Date) alongside the other three fields in Step 3. ⚠ This is now a **second** mail-adjacent action on an outward-facing trigger — when you next test that trigger, the Step 6 safety rule about diverting *every* action still applies, and this one is the reason that rule is phrased that way.

Then the report is an aggregation over `CsatSentAt` by month:

```json
{ "IsAggr": true, "ShowFields": ["CsatSentAt", "CsatSentAt", "CsatRating"],
  "OptionalFields": [
    {"field": "CsatSentAt", "summary": "",      "text": "חודש",
     "aggrField": "CsatSentAt", "aggrFunc": "mm/yy"},
    {"field": "CsatSentAt", "summary": "count", "text": "נשלחו",
     "aggrField": "CsatSentAt", "aggrFunc": "count"},
    {"field": "CsatRating", "summary": "count", "text": "נענו",
     "aggrField": "CsatRating", "aggrFunc": "count"}
  ],
  "QueryElems": [
    {"F": "CsatSentAt", "FText": "מתאריך",   "C": "greaterThanOrEqualTo", "T": "Date", "V": ""},
    {"F": "CsatSentAt", "FText": "עד תאריך", "C": "lessThanOrEqualTo",    "T": "Date", "V": ""}
  ] }
```

The ratio is read off the two count columns. There is no computed-percentage column here on purpose — a `CalculatedFields` division needs a non-zero denominator on every row, and the first month of a rollout is exactly when a zero shows up.

**Backfill is impossible.** `CsatSentAt` starts existing the day you add it; earlier sends are not recoverable. If the customer will be judged on response rate, add the field **before** the trigger goes live, not after the first month.

---

## Delivering them to the manager

A report nobody opens is the same as no report. Two ways to close that, in order of how well they hold up:

1. **Fold the number into a report the manager already produces.** If there is a monthly service report, the CSAT average per agent belongs *in it*. This beats any new report you build, because it inherits an existing habit.
2. **Schedule R2 + R6 monthly** to the process owner (`ScheduleSendAt` `{interval:"monthly", hour:8, occurrence:[1]}` + `ScheduleSendTo`).

⚠ **A scheduled report created tool-side does not send.** The schedule needs a save from the report-generator UI to activate, and writing the record — even perfectly — is not enough. Hand the process owner the activation step explicitly and treat the schedule as **inactive** until they confirm they did it; `Get-Reports` showing the record is not verification. Full detail and the exact Hebrew handoff wording: `myb-p-create-update-reports` → `references/report-building-guide.md` §Scheduled Reports.

## Verification before handover

For each report: open it, confirm it returns rows, and confirm the row count matches a `Count-Data` on the same condition. A report that renders an empty table is indistinguishable to a manager from "nobody is answering" — and that misreading is how a working survey gets switched off.
