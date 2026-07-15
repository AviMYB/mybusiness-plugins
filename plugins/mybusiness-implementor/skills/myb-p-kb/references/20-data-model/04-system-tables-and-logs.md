# System Tables & Logs

> **Purpose:** Reference for the platform's internal tables — audit timeline, automation logs, sessions/roles, configuration and SLA tables — including the exact query patterns used in support investigations.
> **Last updated:** 2026-06-10 · **Status:** draft

Underscore-prefixed classes are system classes (Parse reserves `_` for built-ins; MyBusiness adds its own `_Timeline`, `_syslog*`, etc. server-side). They are queryable through `Get-Data`/`Count-Data` like any table (master key bypasses CLP).

---

## 1. `_Timeline` — record-change audit (ציר זמן)

The platform writes a `_Timeline` row for **every create/update event on the tracked business tables** plus feed events (notes, emails, SMS, conversations, price quotes). It powers the activity feed on entity cards and is the primary audit-investigation table.

**Official query pattern** (from `Usage-Guide`): find the change history of one record by `objectIdValue` + `objectClass`:

```json
Get-Data {
  "table": "_Timeline",
  "where": { "objectClass": "Sales", "objectIdValue": "YEkT85jX3K" },
  "order": "-createdAt",
  "limit": 50
}
```

### Core mechanism fields

| Field | Type | Meaning |
|---|---|---|
| `event` | String | Event type — observed: `"update"`; also create-type events ⚠️ exact value set UNVERIFIED |
| `objectClass` | String | Class of the changed record (e.g. `"Sales"`) |
| `objectIdValue` | String | objectId of the changed record |
| `data` | Object | **The changed fields with their new values**, in wire format (see live sample below) |
| `user` | Pointer→`_User` | Who made the change (`Master` pseudo-user for server/trigger writes) |
| `Last` | Boolean | Marks the most recent timeline row of that record |
| `Pinned` | Boolean | Pinned to top of the card feed |
| `Color` | String | Feed display color |
| `Referer` | String | Origin of the change ⚠️ UNVERIFIED semantics |

### Live sample (Playground, 2026-06-10)

```json
{
  "objectId": "XOoGQD2w8L",
  "event": "update",
  "objectClass": "Sales",
  "objectIdValue": "YEkT85jX3K",
  "data": {
    "DepartmentId": {"__type": "Pointer", "className": "SalesDepartments", "objectId": "L07ZV34Mqu"},
    "ChannelId":    {"__type": "Pointer", "className": "SalesChannels",    "objectId": "2hDAhp6G4o"},
    "AllExtraInfo": "",
    "DiscountType": "%"
  },
  "AccountId": {"__type": "Pointer", "className": "Accounts", "objectId": "XhUlzktDhd"},
  "user":      {"__type": "Pointer", "className": "_User",    "objectId": "2b0QVKoigE"},
  "createdAt": "2026-05-19T09:25:03.107Z"
}
```

### Denormalized display fields

Besides the generic mechanism, `_Timeline` carries **context pointers** (`AccountId`, `ContactId`, `SaleId`, `CaseId`, `TaskId`, `ActivityId`, `NoteId`, `EmailId`, `SMSId`, `ConversationId`, `PriceQuoteId`, `OwnerId`, `SaleOwner`, status/type pointers) and **snapshot copies** of display values so the feed renders without joins: `AccountName`, `ContactName`, `SaleName`, `SaleTotal`, `SaleClosingDate`, `SaleReasonForLost`, `TaskName`, `TaskDescription`, `TaskDueDate`, `CaseDescription`, `ActivityName`, `ActivityDate`, `ActivityLocation`, `NoteComment`, `NotePrivateFile:PrivateFile`, `EmailSubject`, `EmailSendAt`, `EmailSendStatus`, `SMSFrom`/`SMSTo`/`SMSContent`/`SMSStatus`, `ConversationTitle`, `PriceQuoteNumber`.
Paired `<Field>_changed:Boolean` flags (e.g. `SaleTotal_changed`, `TaskName_changed`, `CaseDescription_changed`) mark which snapshot changed in that event. The demo dump shows 74 fields; the live app 50 — the set grows as tenants use more features (columns are created lazily).

**Scale note:** 1,217 rows in the small Playground sandbox (`Count-Data`); customer apps hold orders of magnitude more — always filter and order, never table-scan.

---

## 2. Automation logs

### `_syslogTriggers` — trigger execution log

| Field | Type | Meaning |
|---|---|---|
| `triggerId` | String | The trigger definition id — observed as a **24-hex Mongo-style id** (`"69bfd6ca2964777cf7b24f38"`), matching ids returned by `Get-Triggers`, *not* a 10-char Parse objectId |
| `actionId` | String | Which action of the trigger ran — observed `"notification"` |
| `event` | String | Firing event — observed `"scheduler"`; also record events ⚠️ full value set UNVERIFIED |
| `objectIdValue` | String | The record the trigger ran on |
| `data` | String | Context payload (observed: an objectId string; can hold error/context data) |
| `error` | String | Error text when the action failed — **the first place to look when a customer says "the automation didn't run"** |

Live sample: trigger `69bfd6ca2964777cf7b24f38` / action `notification` / event `scheduler`, `createdBy` = pseudo-user `Master`.

Investigation pattern:

```json
Get-Data { "table": "_syslogTriggers",
  "where": { "objectIdValue": "<recordId>" }, "order": "-createdAt" }
Get-Data { "table": "_syslogTriggers",
  "where": { "error": { "$exists": true } }, "order": "-createdAt" }
```

### `_syslogEvents` — general platform event log

`type:String`, `data:Object`, `error:String`. Used for non-trigger server events (webhooks, integrations). ⚠️ Event taxonomy UNVERIFIED.

### Other logs

| Table | Fields | Role |
|---|---|---|
| `_syslogSMS` | `Uuid`, `State`, `ToNumber`, `FromNumber`, `Message`, `Method`, `Error`, `Price:Number`, `User:P→_User` | SMS provider log (cost per message) |
| `_syslogCampaignEmails` / `_syslogCampaignSMS` | system fields only | campaign batch markers |
| `_syslogCampaignWA` | `CampaignId:P→Campaigns`, `User:P→_User`, `Phones:Array`, `TotalPhones:Number` | WhatsApp campaign batches |
| `_RequestLog` | `path`, `method`, `ip`, `country`, `referer`, `userAgent`, `installationId`, `service:String`, `user:P→_User`, `usingMK:Boolean` (master key used), `internal`, `trustedIP:Boolean`, `duration`, `statusCode`, `contentLength:Number`, `retries:Number` | API request audit — answers "who/what hit the API" |
| `_GeneralLogs` | `Type`, `Name:String`, `Value:Object` | generic log bucket; referenced by `Emails.GeneralLogId` |
| `_WorkflowLogs` | `WorkflowId:P→_Workflow`, `TriggerId:String`, `guid`, `data:String`, `objectClass`, `objectIdValue`, `error`, `UserId:P→_User` | workflow run log (demo app) |

---

## 3. Automation definitions

| Table | Where seen | Fields | Notes |
|---|---|---|---|
| `Triggers` | Live Playground | `title:String`, `className:String` (watched table), `event:String`, `isNew:Boolean`, `isUpdate:Boolean`, `active:Boolean`, `conditions:Array` | Trigger definitions surfaced as a Parse class. ⚠️ The 24-hex `triggerId` in `_syslogTriggers` does **not** match this table's 10-char objectIds — the runtime definition store appears to be the Simbla/Mongo side (as returned by `Get-Triggers`); this class may be a projection. UNVERIFIED — prefer `Get-Triggers`/`Set-Trigger` MCP tools over direct table access. |
| `TriggerActions` | Live Playground | `triggerId:String`, `type:String`, `config:Object` | Actions per trigger (email/SMS/WhatsApp/create-record/update-record/webhook/code…) |
| `_Workflow` | Demo dump | `Name:String`, `Items:Array` | Older/parallel workflow construct ⚠️ UNVERIFIED relationship to Triggers |

Trigger behavior rules (project `CLAUDE.md`): chains max 3 levels deep; automations stamp `updatedByTrigger:String` on the records they modify (the field exists on `Accounts`, `Sales`, `Cases`, `Tasks`, `Products`, `CourseEnrollment`, `_Notification`, …) — used as a loop guard and as an audit hint that "a trigger touched this".

---

## 4. Identity, sessions, roles

### `_User`
See [02-core-tables.md](02-core-tables.md) §7.

### `_Session` (from `a production schema export`; not exposed by live Get-Schema)

| Field | Type |
|---|---|
| `user` | Pointer→`_User` |
| `sessionToken` | String |
| `expiresAt` | Date |
| `createdWith` | Object (login method) |
| `installationId` | String |
| `restricted` | Boolean |
| `loginWithMasterKey` | Boolean — MyBusiness extension |

CLP: empty `{}` on all operations = master-key only.

### `_Role` (from `a production schema export`)

| Field | Type |
|---|---|
| `name` | String — e.g. `Admin`, `CRM`, `Sales`, `Support`, `Campaign Manager`, `MyBooks Admin`, `Student Portal` (role names observed inside CLPs of demo classes) |
| `users` | **Relation→`_User`** — the only observed use of the Parse `Relation` type |
| `roles` | Relation→`_Role` (role nesting) |
| `description` | String |
| `color` | String — MyBusiness extension |

CLP: `find`/`get` require authentication; create/update/delete master-key only. Manage via `Get-Roles`, `Get-Role-Users`, `Add-Users-to-Role` MCP tools rather than raw queries. Class-level permissions of every business table reference these role names (e.g. `Cases` CLP grants find/get/create/update/delete to `role:CRM`, `role:Admin`, `role:Support`, plus create to `role:Student Portal` — `a production schema export`).

### User-related helper tables

| Table | Fields | Role |
|---|---|---|
| `UserStatuses` | `name`, `icon`, `color:String`, `state:Boolean` | presence/status values for `_User.status` |
| `UserParameters` | `UserId:P→_User`, `ParamName:String`, `ParamValue:HTML/XML` | per-user saved UI state/preferences |
| `UsersAssignments` | `Name`, `Users:Array`, `ActiveStatuses:Array`, `LastAssignmentUserId:P→_User` | round-robin assignment pools (used by chat `Channels`) |

---

## 5. Configuration & settings tables

| Table | Fields | Role |
|---|---|---|
| `Config` | `Name:String`, `Value:Object` | generic system config (key→object). CLP read: roles CRM/Admin/Support/Sales + auth; write: CRM/Admin |
| `SlaConfig` | `Name:String`, `Value:String` | SLA module config flags (demo app) |
| `AccountingSettings` | see [03-module-tables.md](03-module-tables.md) §2 | MyBooks company profile (singleton row) |
| `TimeSheetSettings` | `Sunday`…`Saturday:Number` | daily norm minutes |
| `_Dictionary` | `tblName:String`, `field:String`, `value:String` | **Hebrew label store**: maps table+field → UI label. Live sample: `{tblName:"Sales", field:"OwnerSetDate", value:"תאריך הגדרת אחראי"}`. This is the source of the `dictionary` property `Get-Schema` returns per field, and of `data-dictionary` attributes on rendered forms. Maintained via field "label" in `Add-Field-to-Table` / `Get-Terminology-Dictionary` & `Set-Terminology-Dictionary` tools |
| `_AutoIncrementValues` | `Table:String`, `Field:String`, `Count:Number` | counter state behind `AutoIncrement` fields (e.g. `Cases.Number`, `Conversations.Number`). Do not edit directly — duplicate numbers result |
| `_DynamicQueries` | `Name`, `ClassName:String` (queried table), `QueryElems:Array` (condition objects), `ShowFields:Array`, `OptionalFields:Array`, `Sort:String`, `Default:Boolean`, `PageId`/`PageName`/`FormName:String` (which page the query belongs to), aggregation (`IsAggr:Boolean`, `PivotInfo:Object`, `CalculatedFields:Array`, `ShowSum:String`), UX (`GridDivider:Number`, `AllowCsv:Boolean`, `Url2Link:Boolean`), subqueries (`SubqueriesInfo:Object`), scheduled delivery (`ScheduleSendAt:Object`, `ScheduleSendTo:HTML`) | **saved reports/queries** — what `Get-Reports`/`Create-or-Update-Report` manage. CLP: requires authentication |
| `_Notification` | `User:P→_User`, `Date:Date`, `Content:HTML`, `Icon`, `IconColor:String`, `objectClass`+`objectIdValue:String` (deep-link to the record), `updatedByTrigger` | in-app notification bell; trigger "notification" actions write here |
| `MB2P` | `Name:String`, `Value:Number`, `JOBID_COUNTER:Number` | internal job counters (demo) ⚠️ UNVERIFIED purpose |
| `MakeTable` | `Name`, `Email`, `Phone:String`, `Account:P→Accounts`, `Make:Boolean` | demo-app artifact ⚠️ not a platform table |

### Menus & pages — not in Parse

Site pages, page content, and menus are stored on the **Simbla site side (MongoDB documents)**, not as Parse classes — that is why page ids look like `69bfd6c945604bc0d35674fb` (24-hex) and why **menu items must use MongoDB-format ids** (project `CLAUDE.md` rule 8). Access them only through `Get-Site-Pages`, `Get-Page-Content`, `Get-Menus`, `Get-Menu-Items`. Parse-side traces of the page layer: `_DynamicQueries.PageId`, `LandingPages.PageId/OriginalPageId`, and `Triggers`-log `triggerId` formats.

---

## 6. SLA tables (Cases module)

| Table | Fields (with live Hebrew labels) | Role |
|---|---|---|
| `SLASettings` | `CaseTypeId:P→CaseTypes` (סוג פניה), `CaseSubTypeId:P→CaseSubTypes` (תת-סוג פניה), `CaseStatusId:P→CaseStatuses` (סטטוס פניה), `SLAHours:Number` (תקציב שעות), `SLADays:Number` (תקציב ימים) | SLA target matrix: budget per type/subtype/status combination |
| `CaseSLAProcess` (live) / `CasesSlaProcess` (dump — note different spelling per tenant!) | `CaseId:P→Cases` (פניה), `StatusId:P→CaseStatuses` (סטטוס), `StatusEnteredAt` (נכנס לסטטוס ב), `StatusExitedAt` (עזב את הסטטוס ב), `DeadlineForStatus:Date` (דד-ליין לסטטוס), `SLAHoursAllowed`/`SLADaysAllowed:Number`, `IsCurrent:Boolean` (פעיל), `IsBreached:Boolean` (חריגה), `IsPaused:Boolean` (מושהה), `updatedByTrigger` | per-status SLA tracking rows; one row per status the case passes through; rendered as a widget on the case card |
| `BusinessHours` | `Name`, `WeeklyHours:Array`, `SpecialDates:Array`, `ConsiderIsraeliHolidays:Boolean` | working-hours calendar for SLA clock |
| `Holidays` | `Name`, `FromTime`/`ToTime:Date`, `Remark` | explicit holiday rows |
| `CaseStates` | `Name` | open/closed semantics behind `CaseStatuses.StateId` — SLA clock typically stops on closed-state statuses |

SLA fields on `Cases` itself are listed in [02-core-tables.md](02-core-tables.md) §4. The whole mechanism is trigger-driven (scheduled + on-update triggers populate `CaseSLAProcess` and the Case fields) — configuration recipe lives in the `myb-p-sla-configuration` skill.

---

## 7. Standard investigation recipes

| Question | Query |
|---|---|
| "Who changed this record and what?" | `Get-Data {table:"_Timeline", where:{objectClass:"<Class>", objectIdValue:"<id>"}, order:"-createdAt"}` — read `data`, `user` |
| "Did the trigger fire? Did it fail?" | `Get-Data {table:"_syslogTriggers", where:{objectIdValue:"<id>"}, order:"-createdAt"}` — check `error`, correlate `triggerId` with `Get-Triggers` output |
| "What did the platform do around time X?" | `Get-Data {table:"_syslogEvents", where:{createdAt:{"$gte":{"__type":"Date","iso":"...Z"}}}, order:"-createdAt"}` |
| "Which API calls came from outside?" | `Get-Data {table:"_RequestLog", where:{internal:false}, order:"-createdAt"}` |
| "Why did the SMS not arrive?" | `_syslogSMS` by `ToNumber`; campaign sends → `CampaignSentLog` by `Destination`/`AccountId` |
| "Was the user notified?" | `_Notification` by `User` + `objectIdValue` |

## Limitations & gotchas

- `Get-Schema` returns `{}` for `_Role`/`_Session` on the live app — their shapes here come from the demo `a production schema export`; per-tenant verification needs master-key REST (`GET /parse/schemas`).
- `_Timeline.event` value taxonomy, `_syslogEvents.type` taxonomy, and `Triggers`-table vs Mongo-trigger-store relationship are ⚠️ UNVERIFIED — derived from samples, not from server code.
- Log tables are append-heavy: `Count-Data` before unbounded queries; default `Get-Data` limit is 5, max 2000 (see [05-field-types-and-conventions.md](05-field-types-and-conventions.md) §8).
- `_Timeline` snapshot columns are created lazily per tenant — do not assume a `<Field>_changed` flag exists until seen in that tenant's schema.
- Direct writes to `_AutoIncrementValues`, `_Timeline`, or `_syslog*` corrupt audit/numbering integrity; these tables are read-only for implementers by convention (not enforced by schema).
- The pseudo-user `objectId:"Master"` (a literal string, not a 10-char id) appears in `createdBy`/`user` of server-generated rows — filter it out when reporting "human" activity.
