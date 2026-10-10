# System Tables & Logs

> **Purpose:** Reference for the platform's internal tables — audit timeline, automation logs, sessions/roles, configuration and SLA tables — including the exact query patterns used in support investigations.
> **Last updated:** 2026-08-23 (_Timeline §1.11 added: the display layer — the shared `apps/mybusiness/Timeline` page, its 6-class host whitelist, the query-form pointer contract, the `<li>` template, the CSS type palette, the history toggle and the Hebrew-gender heuristic, all read from `timeline4.7.js` + `unified-master.css` and measured on a vanilla tenant) · **Status:** draft

Underscore-prefixed classes are system classes (Parse reserves `_` for built-ins; MyBusiness adds its own `_Timeline`, `_syslog*`, etc. server-side). They are queryable through `Get-Data`/`Count-Data` like any table (master key bypasses CLP).

---

## 1. `_Timeline` — record-change audit (ציר זמן)

`_Timeline` is the platform's record-change audit log and the store behind the **ציר הזמן** feed on record cards (the card embeds an iframe of `apps/mybusiness/Timeline`). Recording and display are **two separate layers**: §1.1-1.10 cover what gets written, §1.11 covers what a user can actually see. Logging is **opt-in per table** and is driven by that table's *timeline settings*; a table whose settings are empty writes nothing at all.

`_Timeline` is **read-only** — `Create-Data` / `Create-Many` / `Update-Data` against it return `Error: Table _Timeline is for read only`. Rows can only be produced by writing to a tracked table.

### 1.1 Timeline settings — what turns logging on

Each table carries a settings object with two maps, read and written by `Get-Timeline-Settings` / `Set-Timeline-Settings`:

```json
{
  "index":         { "<sourceField>": "<_TimelineColumn>" },
  "displayFields": { "<sourceField>": "<_TimelineColumn>" }
}
```

| Map | Source fields allowed | What it produces | What it is for |
|---|---|---|---|
| `index` | **Pointer fields only** (plus the pseudo-field `objectId`) | Pointer columns on `_Timeline` | Decides **which record cards the entry appears on**. A Task entry mapped to `AccountId`, `ContactId` and `SaleId` shows up on all three cards. |
| `displayFields` | **non-Pointer fields only** (String / Number / Date / Boolean / PrivateFile) | Value columns on `_Timeline` | The **body text** of the feed entry. |

`objectId` is a pseudo-source that maps the changed row's own id to a self-pointer column (`Accounts.objectId → AccountId`). It is **optional for logging** — rows are still written without it — but the record's own card then has no pointer to filter on, and its history is reachable only via `objectClass` + `objectIdValue`. For anything that must render on a card it is in practice **mandatory** (§1.11.3).

**The shared-column convention is the whole design.** Every table that points at the same entity should map to the *same* `_Timeline` column, so that one column holds all history for that entity: `Accounts.objectId → AccountId`, `Tasks.AccountId → AccountId`, `Cases.AccountId → AccountId`. Because a `_Timeline` column carries one type for all tables, reusing a name with a different type is what breaks things (§1.7).

Settings are a **whole-object replace**, not a merge: what you send is what is stored. `{}` disables logging for that table. Changes take effect on the next write — there is no cache to wait out.

### 1.2 Tables tracked out of the box

Verified on a sandbox tenant with **all modules installed** (2026-08-20) — **11 tables come with timeline enabled**. Module-owned tables among them (`Conversations` = MyChat, `PriceQuotes`) only exist where that module is installed, so a tenant's actual tracked set is this list intersected with its installed modules:

`Accounts`, `Contacts`, `Sales`, `Cases`, `Tasks`, `Activities`, `Notes`, `Emails`, `SMS`, `Conversations`, `PriceQuotes`.

Everything else (122 of the 144 classes on that tenant — `SaleRows`, `Orders`, `AccountingHeaders`, `AccountingInvoiceLines`, `Retainers`, `Products`, `Projects`, `CourseEnrollment`, `TimeSheet`, `UsersAssignments`, `Campaigns`, and every custom table) logs **nothing** until it is switched on.

**Restricted — settings can be neither read nor written** (`Error: Table is restricted for Timeline Settings`): `_Timeline`, `_User`, `_GeneralLogs`, `_RequestLog`, `_syslogTriggers`, `_syslogSMS`, `_syslogCampaignEmails`, `_syslogCampaignSMS`, `_syslogCampaignWA`. Note the consequence: **`_User` cannot be audited through the timeline** — user, role and permission changes leave no `_Timeline` trail.

### 1.3 Row shape — `create` and `update`

| Field | Type | Meaning |
|---|---|---|
| `event` | String | `"create"`, `"update"` or `"delete"` — the full set, verified 2026-08-20 |
| `objectClass` | String | Class of the changed record |
| `objectIdValue` | String | objectId of the changed record |
| `data` | Object | **The write payload** — only the fields actually sent. `updatedAt` / `updatedBy` / `objectId` are stripped; on `create`, `createdAt` / `createdBy` too. Trigger-driven writes carry an `updatedByTrigger: "<triggerId>"` marker, so automation is distinguishable from a human edit. |
| `user` | Pointer→`_User` | **The actor.** The real user for UI/session writes; the `Master` pseudo-user for master-key (API/MCP) writes and for trigger writes. |
| `createdBy` / `updatedBy` | Pointer→`_User` | Always `Master` — they describe who wrote *the log row*, never who made the change. **Use `user` for attribution.** |
| `Last` | Boolean | Marks the newest row for that `objectIdValue`; the previous holder's flag is cleared. Absent (not `false`) on superseded rows — see the concurrency caveat in §1.8. |
| `Pinned` | Boolean | Card-feed affordance — pin the entry to the top. Set from the UI only. |
| `Color` | String | Card-feed display colour. Set from the UI only. |
| `Referer` | String | Origin URL of the page that made the change (verified 2026-08-20), e.g. `…/apps/mybusiness/Account?oid=…&cls=Accounts&Mode=Ticket`. **HTML-entity-escaped on write** (`https&#58;&#47;&#47;…`), like every String field. `null` for API / MCP / master-key writes — so a populated `Referer` is a reliable "a human did this in the browser" signal. |
| *(index columns)* | Pointer | The mapped `index` pointers for that write. |
| *(display columns)* | various | **Current snapshot** of every mapped `displayField`, not only the changed ones. Values absent from the write payload are fetched from the row in the DB — which is why keeping the maps small matters. |
| `<Display>_changed` | Boolean | See §1.5. |

### 1.4 `delete` rows are minimal — and invisible on the card

A delete writes a **stripped row** carrying only `event: "delete"`, `objectClass`, `objectIdValue`, `user` and timestamps. Verified on two differently-mapped tables (2026-08-20): **no `data`, no index pointers, no display fields, no `Last`, no `Pinned`, no `Referer`** — regardless of how richly the table is mapped.

Three consequences that matter for any audit or compliance use:

- **A deletion never appears on a record card's timeline**, because the card filters by an index pointer (`AccountId = …`) and the delete row has none. Deletes are findable only by `objectClass` + `objectIdValue`, or by scanning for `event: "delete"`.
- **The deleted record's identity is not preserved** — no name, no parent, no field values. The log says "someone deleted object `X` of class `Y` at time `T`". If a customer needs to know *what* was deleted, the timeline alone cannot answer it.
- A `create` / `update` row may still carry `Last: true` for an object that no longer exists — the delete does not clear it.

### 1.5 Snapshot vs delta, and what `_changed` really means

`data` is the **delta** (what was written); the display columns are the **current snapshot** (every mapped display value, fetched from the row when absent from the payload). An update that touches only an unmapped field still produces a row, with the full snapshot and that field alone in the delta.

Each display column has a companion `<Column>_changed:Boolean`, set **only when that source field was present in the write payload**. It is:

- **presence, not difference** — re-writing a field with the value it already had still sets `_changed: true` (the same semantics as `onSetFields`);
- **absent, not `false`**, when the field was not in the payload — consumers must read "missing" as "unchanged";
- **never present on `create` rows.**

### 1.6 Columns are created lazily, then their type is locked

Mapping to a `_Timeline` column that does not exist yet is allowed; the column is created on the **first write** and typed from the source field (`objectId` → `Pointer→<that table>`, a Number field → `Number`, and so on). From then on that type is fixed for **every** table mapping into it. The column set therefore grows as a tenant enables more features, and differs from tenant to tenant.

### 1.7 Failure modes — validated vs silent

`Set-Timeline-Settings` validates the **source side** and rejects the whole call atomically, leaving the previous settings untouched. Its error arrives as a plain string in the tool result, so **the return value must be read** — a caller that ignores it sees a no-op and assumes success:

| Rejected | Error |
|---|---|
| Pointer field in `displayFields` | `Field X not exists or is a Pointer field in table T` |
| non-Pointer field in `index` | `Field X is not a Pointer in table T` |
| source field does not exist | `Field X not found in table T` |
| table missing / restricted | `Class T does not exist.` / `Table is restricted for Timeline Settings` |

It does **not** validate the `_Timeline` target side. The following are accepted silently and cause real damage:

- **Type collision** — mapping a String source onto a column already typed `Number` is accepted; the write then succeeds but stores `null`. The display value is lost, with no error anywhere.
- **Cross-class pointer collision** — mapping `objectId` of table `T` onto a Pointer column targeting a different class (e.g. a custom table's `objectId` onto `AccountId`, which is `Pointer→Accounts`) is accepted. The source write succeeds and a **permanently corrupt log row** is written. Any subsequent *full-row* read whose result page contains that row fails outright with `Error: pointer to incorrect className …`. Filtered reads that exclude the row, and projections (`keys: [...]`) that omit the poisoned column, still work — so the card feed usually survives while table-wide reads break. **There is no repair path: `_Timeline` is read-only, so the row can be neither fixed nor deleted through the API.**
- **Reserved column names** — `data`, `event`, `objectId`, `Last` and their siblings are accepted as `displayFields` targets and **overwrite the audit fields themselves**. A mapping onto `event` was observed replacing `"create"` with the field's value, which in turn defeated the create-time stripping of `createdAt` / `createdBy`.

Because of those last two, always `Get-Schema` on `_Timeline` and `Get-Timeline-Settings` on the sibling tables before choosing a column name.

**Legacy settings may be un-resavable.** The shipped `SMS` configuration maps String fields (`From`, `To`, `Content`, `Status`) in `index`, which today's validator rejects — re-sending `SMS`'s own settings verbatim fails with `Field From is not a Pointer in table SMS`. A read-modify-write on such a table has to drop the illegal legacy entries first.

### 1.8 `Last` is not reliable under concurrency

Sequential writes maintain the invariant exactly — one `Last: true` per object. **Concurrent writes to the same record do not**: six parallel updates produced **three** rows flagged `Last: true` (verified 2026-08-20), and the same pattern appears in ordinary tenant data wherever two triggers write a record milliseconds apart. Anything querying `where Last = true` to obtain current state must expect duplicates and fall back to `order: "-createdAt"`.

### 1.9 Suppressing, and the absence of backfill

- `Create-Many` writes **one `_Timeline` row per record**. Its `skipTimeline: true` flag (master key only) suppresses logging entirely — the right switch for migrations and bulk seeding, and a deliberate audit gap anywhere else.
- **Enabling logging never backfills.** History starts at the moment the settings are saved; pre-existing rows have none. Disabling with `{}` stops new rows but keeps the existing ones.

### 1.10 Query patterns

Change history of one record (the pattern given by `Usage-Guide`):

```json
Get-Data {
  "table": "_Timeline",
  "where": { "objectClass": "Sales", "objectIdValue": "YEkT85jX3K" },
  "order": "-createdAt",
  "limit": 50
}
```

Everything that ever touched one account — the card-feed query — filters on the shared index pointer instead:

```json
Get-Data {
  "table": "_Timeline",
  "where": { "AccountId": {"__type":"Pointer","className":"Accounts","objectId":"…"} },
  "order": "-createdAt",
  "limit": 50
}
```

**Scale note:** even a small sandbox holds thousands of rows and customer apps orders of magnitude more — always filter and order, never table-scan. Where a tenant may contain a poisoned row (§1.7), prefer an explicit `keys` projection so that one broken column cannot fail the whole page.

### 1.11 The display layer — the shared `Timeline` page

Recording and display are **two independent layers**. `Set-Timeline-Settings` fills `_Timeline`; nothing about it makes an entry visible to a user. The feed is rendered by one page per tenant — `apps/mybusiness/Timeline` — which a record card embeds as an iframe:

```html
<iframe scrolling="no" id="timeLineFrame" style="width:100%; height:500px" src="Timeline"></iframe>
```

The frame takes no parameters: the renderer reads `cls` and `oid` from the **parent** card's query string (`window.parent.QueryString`). The parent auto-resizes it through `resizeIframe` once rows load, and hides the column entirely when the card is opened with `Mode=Modal`.

The page ships with its own `jsCode` and `cssCode` **empty** (verified on a vanilla tenant, 2026-08-23); all behaviour comes from the two files attached in its settings — `timeline4.7.js` and `unified-master.css`, whose URLs `Get-Page-Settings` returns. Everything in §1.11 is that stock behaviour, read from those two files. **One page serves every card in the tenant**, so an error in it is a tenant-wide outage of the feed: take a `Get-Page-Versions` anchor before editing — `Set-Page-Version` restores the whole page, or only the JS, or only the CSS.

#### 1.11.1 Host whitelist — which cards may show a feed at all

```js
var cls = window.timelineClasses || ['Contacts', 'Tasks', 'Accounts', 'Sales', 'Cases', 'Activities']
if (!ObjId || ObjId.length != 10 || cls.indexOf(ObjClass) === -1) {
    $(".simblaDynamicList").data("disable-load", true);
    console.log('timeline load disabled');
}
```

Only **6 classes can host a feed** out of the box — a smaller set than the 11 that are *tracked* (§1.2). `Notes`, `Emails`, `SMS`, `Conversations` and `PriceQuotes` are entry *types* that surface inside other entities' feeds; their own cards show nothing. `console.log('timeline load disabled')` is the diagnostic for a card outside the list.

`window.timelineClasses` is an **optional override**, declared in the page's `metaTags` — which `Get-Page-Content` does not return: read it with `Get-Page-Settings`, write it with `Set-Page-Settings { metaTags }`. On a vanilla tenant `metaTags` is **empty**, so adding a class means materialising the whole array, defaults included:

```html
<script>window.timelineClasses = ['Contacts','Tasks','Accounts','Sales','Cases','Activities','<NewClass>']</script>
```

Sending only the new class silently kills the feed on every built-in card in the tenant. `Set-Page-Settings` patches only the keys it is given (`jsFile`, `cssFile`, `loginOnly` survive) and **does not clear the page cache** — see limitation 80.

#### 1.11.2 Scoping — the hidden query form, and the pointer trap

The feed is a `simblaDynamicList` over `_Timeline` (`data-query-form="TimelineFilter"`, `data-sort-by="Pinned,createdAt"`, descending) driven by a hidden `dbFormQuery` named `TimelineFilter`. It ships **eight** fields, each a plain `<input type="text">` in its own `form-group`, named exactly like the `_Timeline` column it filters:

| Field | `data-criteria` |
|---|---|
| `ContactId`, `AccountId`, `SaleId`, `TaskId`, `CaseId`, `ActivityId` | `equalTo` |
| `objectClass` | `containedIn` |

Hidden inputs are collected: the serializer walks `input, select, textarea` and keys only off the presence of `data-criteria`, with no visibility test — which is why the platform simply `.hide()`s them. `add-new-field` cannot set attributes, so a new field's `data-criteria` must be written afterwards with `set-html-content`.

For each of the six host classes the renderer wires its field at load with **three** operations, not one:

```js
if (ObjClass == 'Accounts') {
    $("input[name='AccountId']").attr("targetclass", ObjClass);
    $("input[name='AccountId']").addClass("select-pointer");
    $("input[name='AccountId']").val(ObjId);
}
```

**All three are required.** The query serializer wraps a value as a Parse pointer only when the input carries *both* `select-pointer` and a `targetclass`:

```js
addCriteria(i.data('criteria'), i.attr('name'), val, i.is('.select-pointer') && i.attr('targetclass'), i.data('match-query'));
```

Without them the objectId is sent as a bare string, and a string never matches a Pointer column. Measured on a sandbox tenant (2026-08-23): `Count-Data` on `_Timeline` with `AccountId: "YhsfQBLLZ1"` returns **0**; the same filter expressed as `{"__type":"Pointer","className":"Accounts","objectId":"YhsfQBLLZ1"}` returns **27**. A wiring that sets only `.val()` therefore yields a permanently empty feed that presents as a data problem rather than a wiring one. (Adding the class to an `<input>` is safe — the platform's select-pointer initialisers only match `select.select-pointer`.)

One further guard: the `criteria-added-to-query` handler throws `"stop"` when the assembled query has no `_where` at all, so an unwired class fails closed instead of listing the whole tenant's history.

#### 1.11.3 Entry markup — one `<li>` per type

The list-item template is a single `htmlEditor` element (`P25` on a vanilla page) whose inner wrapper is `<div style="width: 100%;" class="htmlContent">`. **`set-html-content` drops that wrapper unless it is sent as part of the content** — losing it unstyles the feed for *every* type, not only the one being edited.

Inside it, `<div class="container timeline {{objectClass}}"><ul class="timelineUL">` holds **one `<li class="timeline-inverted <type>">` per entry type** — `conversation`, `note`, `activity`, `email`, `pricequote`, `sms`, `case`, `account`, `contact`, `task`, `sale`. Every `<li>` is emitted for every row; CSS alone decides which is visible (§1.11.4). `<type>` is lowercase singular by convention.

Placeholders resolve against the `_Timeline` row, so they are the **`_Timeline` column names from the mapping**, never the source table's field names. A pointer exposes `.Id` plus its own fields — `{{AccountId.Id}}`, `{{AccountId.Name}}`. Row-level bindings: `{{event}}`, `{{createdAt}}`, `{{user.name}}`, `{{user.profile_image._url}}`.

The shipped `account` block is the canonical shape:

```html
<li class="timeline-inverted account">
  <div class="timeline-badge"><i class="fa fa-building-o"></i></div>
  <div class="timeline-panel">
    <div class="timeline-heading row">
      <div class="col-xs-1"><img loading="lazy" src="{{user.profile_image._url}}"></div>
      <div class="col-xs-9">
        <h4 class="timeline-title"><a class="ticket" data-ticket="Account?oid={{AccountId.Id}}&amp;cls=Accounts&amp;Mode=Ticket">לקוח</a> {{event}}d</h4>
        <p><small class="text-muted"><i class="glyphicon glyphicon-time"></i> {{createdAt}}, על ידי {{user.name}}</small></p>
      </div>
      <div class="col-xs-1"><i class="fa fa-thumb-tack pinnedIcon"></i></div>
      <div class="col-xs-1">
        <div role="presentation" class="dropdown">
          <a class="dropdown-toggle" data-toggle="dropdown" role="button"><i class="fa fa-ellipsis-h"></i></a>
          <ul class="dropdown-menu">
            <li class="Edit"><a class="ticket" data-ticket="Account?oid={{AccountId.Id}}&amp;cls=Accounts&amp;Mode=Ticket"><i class="fa fa-pencil"></i>עריכה</a></li>
            <li class="Pinned"><a href="#"><i class="fa fa-thumb-tack"></i>הצמד</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="timeline-body">
      <p>{{AccountName}}</p>
    </div>
  </div>
</li>
```

Two details that are easy to misread:

- **`{{event}}d` is deliberate.** `event` holds `create` / `update`, so the rendered text is `created` / `updated` — the English words the renderer then translates (§1.11.6).
- **`class="ticket" data-ticket="<CardPage>?oid=…&cls=…&Mode=Ticket"` is what opens the record** from the entry; the click handler routes it to the side modal (email / SMS / price-quote variants) or to `#iframeModalTicket`. This is why mapping `objectId → <Class>Id` in `index` is effectively **mandatory** once a card feed is wanted, rather than the optional convenience §1.1 describes: the self-pointer supplies both the scoping value and `{{<Class>Id.Id}}` for the link.

#### 1.11.4 Type visibility and colour are pure CSS — and cover built-ins only

Every timeline rule lives inside `body.page-slug-timeline { … }` in `unified-master.css`. Visibility is one blanket hide listing the 11 shipped types, and one show rule pairing each type with the `objectClass` its container carries:

```css
.timeline .sale, .timeline .note, .timeline .task, … { display: none !important; }
.timeline.Sales .sale, .timeline.Notes .note, .timeline.Tasks .task, … { display: list-item !important; }
```

A type absent from the hide list renders **under every row**; one absent from the show list never renders. A new type therefore needs both rules of its own.

Colour is per-type too, and a new type inherits the neutral defaults: `.timelineUL>li>.timeline-badge .fa` is `background-color: #fff` — a white circle on a white panel — and the panel keeps only the generic 1px frame, with no coloured rail (`border-right: 3px solid <colour>` is what draws the continuous rail down the feed). The shipped palette, to check against before picking a new colour:

| Type | Colour | Type | Colour |
|---|---|---|---|
| `sale` | `#6336be` | `contact` | `#62a6ff` |
| `pricequote` | `#e26c97` | `note` | `#b1bbee` |
| `activity` | `#00e5a0` | `email` | `#f5ba6d` |
| `task` | `#ff8a3d` | `sms` | `#00e5a0` |
| `case` | `#22c1d8` | `conversation` | `#f18483` |
| `account` | `#3a45d3` | | |

#### 1.11.5 The type filter and the "היסטוריה" toggle

The **סינון** dropdown (`#dropdownfilter`) holds one checkbox per filterable type plus one named `history`. On change the handler joins the checked `value`s with commas into `input[name='objectClass']` — `containedIn`, which the serializer splits back into an array — and clicks `.submitTimelineFilter`. The handler selects `.checkbox input`, so a checkbox has to sit in that structure:

```html
<div class="control"><div class="checkbox"><label><input type="checkbox" name="TimelineFilter" value="<Class>">התווית</label></div></div>
```

Only 6 of the 11 tracked types ship with a checkbox — `Sales`, `Cases`, `Tasks`, `Notes`, `Activities`, `Conversations`; the rest are unfilterable by design.

**`history` is not a type filter.** Unchecked — the default — the query is narrowed to `Pinned = true OR Last = true`, i.e. the newest entry per record only. Checked, that constraint is dropped and every revision appears. This is the mechanism behind "the entries only show up when I tick היסטוריה".

#### 1.11.6 Hebrew verb gender is a heuristic in the renderer

On `data-loaded` the renderer rewrites each `.timeline-title`: `created` / `updated` become the **masculine** `נוצר` / `עודכן` only when the title text contains `לקוח` or `איש קשר`, and the **feminine** `נוצרה` / `עודכנה` otherwise (`Sent` → `נשלח` and `Error` → `תקלה` in both branches). The default therefore fits the mostly-feminine built-in entity names and reads wrong for a masculine one. The only lever is the **title wording** — `timeline4.7.js` is a shared static file served to every tenant and must not be patched per customer. Separately, when the parent card's `IsAccount` checkbox is unticked the renderer replaces `לקוח` with `ליד` throughout the title.

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
- `_syslogEvents.type` taxonomy and the `Triggers`-table vs Mongo-trigger-store relationship are ⚠️ UNVERIFIED — derived from samples, not from server code. (`_Timeline.event` is now verified: `create` / `update` / `delete`, §1.3.)
- Log tables are append-heavy: `Count-Data` before unbounded queries; default `Get-Data` limit is 5, max 2000 (see [05-field-types-and-conventions.md](05-field-types-and-conventions.md) §8).
- `_Timeline` snapshot columns are created lazily per tenant — do not assume a `<Field>_changed` flag exists until seen in that tenant's schema.
- Direct writes to `_AutoIncrementValues` or `_syslog*` corrupt audit/numbering integrity; those are read-only by convention, not enforced. `_Timeline` **is** enforced — any write returns `Error: Table _Timeline is for read only`, which also means a corrupt log row can never be repaired or removed (§1.7).
- The pseudo-user `objectId:"Master"` (a literal string, not a 10-char id) appears in `createdBy`/`user` of server-generated rows — filter it out when reporting "human" activity.
- Timeline logging is **opt-in per table** and never backfills — an audit question about an untracked table (or about the period before it was tracked) simply has no data (§1.2, §1.9).
- `delete` rows carry no index pointers and no display values, so deletions are invisible on record cards and preserve nothing about what was deleted (§1.4).
- `_User` is restricted from timeline settings — user/role/permission changes leave no `_Timeline` trail (§1.2).
- `Last: true` can appear on several rows of the same object when writes race (§1.8); use `order: "-createdAt"` rather than trusting the flag.
