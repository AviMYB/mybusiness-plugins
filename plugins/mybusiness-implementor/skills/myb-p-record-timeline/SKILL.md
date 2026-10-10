---
name: myb-p-record-timeline
description: "Configure the record timeline / change-audit log (ציר הזמן) in MyBusiness CRM end to end — both halves: WHICH tables log create/update/delete into _Timeline (Get-/Set-Timeline-Settings), and WHETHER anyone can see it (the shared Timeline page wiring + the feed on the record card). Use whenever the ask is tracking or auditing record changes, or the card feed: 'להפעיל ציר זמן לטבלה', 'ציר הזמן ריק', 'היסטוריית שינויים', 'מי שינה/מחק את הרשומה', 'מעקב שינויים בטבלה מותאמת', 'להוסיף ציר זמן לכרטיס', 'העיגול/הפס חסרים', 'audit trail', 'change history', 'who changed this record', 'track changes on a custom table', 'show the timeline on the card'. ALSO before answering a customer question on audit coverage — logging is opt-in, only 11 tables ship with it on and only 6 cards can display it, so 'the system logs everything' is wrong by default. Prefer over myb-p-trigger-setup for a passive change log, not an automation. NOT for querying an existing history, NOT for _syslogTriggers, NOT for approval workflows."
---

# Record timeline / ציר הזמן

Switches the platform's change-audit log on or off **per table**, shapes what each entry says, and — for a table the product does not ship support for — wires the entry so a user actually sees it on a record card.

**The one thing to internalise: recording and display are two independent layers.**

| Layer | What it does | Where it lives | If missing |
|---|---|---|---|
| **Recording** | writes a `_Timeline` row on every create/update/delete | the table's timeline settings (Part A) | nothing is captured, ever — and it is not retroactive |
| **Display** | renders those rows as the ציר הזמן feed | the shared `Timeline` page + the frame on the card (Part B) | rows pile up correctly and **no user sees a thing** |

Turning on recording and reporting "done" is the single most common failure here: the settings verify green, the customer opens the card, and nothing changed. **Part A alone is never the whole job for a table outside the built-in set.**

Three facts drive almost every decision:

- **Logging is opt-in.** Only 11 tables come tracked (and the module-owned ones only where that module is installed). A custom table, `SaleRows`, `Orders`, accounting documents, `Retainers` — none of them log anything until you switch them on. Never confirm "the system keeps an audit trail" without checking.
- **Display is narrower still.** Only **6** classes can host a feed out of the box. Enabling a 7th is a change to a page that serves **every card in the tenant**.
- **`_Timeline` is read-only and shared.** One column carries one type for *all* tables, and a bad mapping writes a row that can never be repaired or deleted. That is why Step 1 is a read, not a write.

## Knowledge sources (binding)

- `../myb-p-kb/references/20-data-model/04-system-tables-and-logs.md` — **the authoritative mechanics.** §1.1-1.10 = recording: settings shape, row shape per event, the delete-row limitation, `_changed` semantics, lazy column typing, every failure mode, query patterns. Read §1.7 before choosing any column name. **§1.11 = display**: the host whitelist, the query-form pointer contract, the `<li>` template and its bindings, the CSS type palette, the history toggle, the Hebrew-gender heuristic. Read §1.11 in full before touching the page — it carries the verbatim stock markup this skill tells you to copy.
- `../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md` §8a — the two settings tools' parameters and R/W classification; `skipTimeline` on `Create-Many` is in §2.
- `../myb-p-kb/references/80-capability-matrix/02-known-limitations.md` §15 (items 67-73, recording) and §17 (items 82-86, display) — the customer-facing limits to quote in fit-gap.
- `../myb-p-kb/references/30-customization/03-pages-and-layouts.md` §10 — native-before-code, incl. H-06 (never hand-roll a change log); §7 for the page-cache rule.
- MCP tools: `Get-Timeline-Settings`, `Set-Timeline-Settings`, `Get-Schema`, `Get-Data`, `Count-Data`; for Part B also `Get-Page-Settings`, `Set-Page-Settings`, `Get-Page-Content`, `Edit-Page`, `Edit-Page-CSS-JS`, `Get-Page-Versions`, `Set-Page-Version`.

## When to use / not to use

**Use it when:**
- A table's changes need to be tracked, or a customer asks for a change/audit log on anything.
- **Someone is about to build a change log by hand.** A home-grown tracker — page JS diffing old-vs-new on save, a custom "history" table written from the browser — is the standing anti-pattern here: it is client-side, so it misses every API/trigger/import write; it is a second source of truth; and this platform already has a server-side one. Route the requirement here first. A dedicated *business* journal (event types, ranges, links to other records) is legitimate where the timeline genuinely cannot express it — but its rows are written **server-side**, by a trigger or a cloud function, never by diffing in the browser.
- The ציר הזמן on a card is empty, missing entries, or shows entries with no useful text.
- **An entry renders with no coloured circle and no connecting rail** — that is a missing CSS pair (B4), not a styling accident.
- An entry should also appear on a *related* record's card (a Task's entry on the Account).
- Scoping or fit-gap touches "audit trail", "history", "who changed what" — answer from the limitations, not from optimism.

**Not for:**
- Reading an existing history to investigate an incident — that is a query, not a configuration change; the patterns are in the reference §1.10.
- Automations that *react* to a change → `myb-p-trigger-setup`. A timeline is passive.
- The trigger execution log (`_syslogTriggers`) or request log — different tables, same reference doc §2.
- Field-level "who changed this one field, and from what to what" with old-and-new values — the timeline records the new payload only. See Known limitations.

---

# Part A — Recording

## A1 — Read the current state (never skip)

Three reads, in this order:

1. `Get-Timeline-Settings { tableName }` on the **target** table. `{}` (empty) means it logs nothing today. An error `Table is restricted for Timeline Settings` means it can never be tracked — `_Timeline`, `_User`, `_GeneralLogs`, `_RequestLog`, `_syslog*`. If the target is `_User`, stop: user/role/permission auditing is a product gap, say so.
2. `Get-Schema { className: "_Timeline" }` — the existing shared columns **and their types**. This is the collision list.
3. `Get-Timeline-Settings` on the **sibling** tables that point at the same entities (typically `Accounts`, `Tasks`, `Cases`, `Sales`, `Notes`) — to learn which column name the tenant already uses for each entity.

Then `Get-Schema { className: <target> }` to classify each candidate field as Pointer vs non-Pointer. The maps are type-segregated and the tool rejects a wrong-side entry.

## A2 — Choose the mapping

Build `index` from **Pointer fields only**, `displayFields` from **non-Pointer fields only**.

- **Reuse the tenant's existing column name for every entity.** If `Tasks.AccountId → AccountId`, then your table's customer pointer also maps to `AccountId`. This is what makes one card show the whole history of that account. Inventing `MyTableAccountId` instead silently splits the history into a column nothing reads.
- **Map `objectId` → a self-pointer column** (e.g. `Orders.objectId → OrderId`). The reference calls this optional for logging; **for Part B it is mandatory** — it is both the value the card's scoping filter matches on and the source of the `{{OrderId.Id}}` link that opens the record from the entry.
- **When two pointers on your table target the same class** (a payer account and a recipient account, say), only one can own the shared column. Pick the one whose card should carry the history, and **write the choice down** — the other entity's card will not show these entries.
- **New column names must not collide with a different type.** Check the A1 schema. A String mapped onto an existing `Number` column stores `null` forever, and a self-`objectId` mapped onto a Pointer column of another class writes an unrepairable row that breaks full-table reads. Both are accepted without error — the tool does not validate the target side.
- **Never target a system column** — `data`, `event`, `objectId`, `Last`, `Pinned`, `Color`, `user`, `Referer`. They are accepted and they overwrite the audit fields themselves.
- **Keep both maps as small as the UI actually needs.** Any mapped field absent from a write payload is fetched from the DB on every single write — the maps are a per-write cost, not free metadata.

Sanity check: 2-6 index entries and 1-4 displayFields is the shape of every shipped table. A dozen displayFields is a design smell.

**Automate the collision check.** Before writing, assert for every mapping: the source side is the right kind (Pointer for `index`, non-Pointer for `displayFields`); the target column either does not exist, or exists with the identical type *and* — for pointers — the identical `targetClass`; and the target is not a system column. Print a verdict, then write.

## A3 — Write the settings

`Set-Timeline-Settings { tableName, timeline: { index, displayFields } }`.

This is a **whole-object replace, not a merge** — send the complete map every time, including the entries you are not changing, or they are dropped. `{ }` disables logging for the table.

**Read the return value.** A successful call echoes the full settings object. Source-side violations reject the *entire* call atomically and leave the old settings in place, returning a plain string:

| You will see | It means |
|---|---|
| `Field X is not a Pointer in table T` | non-Pointer in `index` — move it to `displayFields` |
| `Field X not exists or is a Pointer field in table T` | Pointer in `displayFields` — move it to `index` |
| `Field X not found in table T` | typo, or the field was never added to the table |
| `Class T does not exist.` | wrong table name |
| `Table is restricted for Timeline Settings` | system table — not trackable |

A caller that ignores the result sees no exception and assumes success. It is not success; nothing changed.

Editing an existing table's settings is read-modify-write on the A1 output. One caveat: some **shipped settings are no longer re-savable** — `SMS` maps String fields in `index`, which the validator does not accept, so a verbatim re-send fails. Strip the illegal legacy entries before writing.

## A4 — Verify with a real write

A successful `Set` proves the settings were stored, not that logging works — the columns do not exist until the first write creates them.

1. Create or update one record on the target table. **Use a throwaway/test record, never customer data.** If the tenant has live outbound integrations on that table, pass `dontRunSimblaTriggers` — it suppresses the triggers and **still writes the timeline row** (the flag that suppresses the timeline is `skipTimeline` on `Create-Many`, a different mechanism).
2. `Get-Data { table: "_Timeline", where: { objectClass: "<Table>", objectIdValue: "<id>" }, order: "-createdAt", limit: 5 }`.
3. Check, in order: the row exists; every `index` column is populated (a `null` means the pointer was empty **on that write** — confirm against the source record before treating it as a fault); every `displayFields` column carries the value (a `null` on a non-empty field is the **type-collision** signature — fix the mapping before more writes land); `data` holds the payload.
4. Confirm a full-row `Get-Data` on `_Timeline` still succeeds — that proves no poisoned row was written.

Prefer an explicit `keys: [...]` projection on `_Timeline` reads: it keeps a pre-existing poisoned column in some other tenant row from failing your whole query.

**Stop here only for the 11 built-in tables.** For anything else, Part A has produced an invisible log.

---

# Part B — Display

The product does not know your table exists, so every point below is missing at once. Symptoms map one-to-one:

| Symptom | Missing piece |
|---|---|
| Card shows no timeline area at all | B6 — no frame on the card |
| Frame is there but always empty, console says `timeline load disabled` | B1 — class not in the host whitelist |
| Feed loads but shows **nothing**, with no console complaint | B2 — filter field missing, or wired without `select-pointer` + `targetclass` |
| Feed shows **other** records' entries | B2 — the filter field carries no `data-criteria` |
| Entries appear as blank/rawly-formatted rows | B3 — no `<li>` template for the type |
| Your block appears under entries of **every** class | B4 — no hide rule for the new type |
| Entries appear but with **no coloured circle and no rail** | B4 — the master stylesheet paints built-ins only |
| Type cannot be toggled in the "סינון" dropdown | B5 — no checkbox |
| Entries only appear when "היסטוריה" is ticked | nothing missing — by design, see B5 |

**Before touching the shared Timeline page: take a version anchor.** `Get-Page-Versions { pageName: "apps/mybusiness/Timeline" }`, note the newest `_id`, and keep it in the task record. `Set-Page-Version` restores it — whole page, or only JS, or only CSS. This page serves every card in the tenant; work with the restore path in hand, and save the page's current `content`, `cssCode`, `jsCode` **and** `metaTags` to files first.

Read reference §1.11 before starting: B1-B5 are each "copy the stock pattern and substitute", and the stock patterns are quoted verbatim there.

## B1 — The host whitelist (`window.timelineClasses`)

The renderer refuses to load unless the parent card's class is whitelisted; the default list is 6 classes and **the override lives in the page's `metaTags`**, which `Get-Page-Content` does not return.

```
Get-Page-Settings { pageId }   → metaTags
```

**On a vanilla tenant `metaTags` is empty.** That does not mean "no whitelist" — it means the renderer is using its built-in default, and your job is to materialise that default plus your class:

```html
<script>window.timelineClasses = ['Contacts','Tasks','Accounts','Sales','Cases','Activities','<Class>']</script>
```

**Trap:** writing only `['<Class>']` silently disables the feed on every built-in card in the tenant. If `metaTags` is *not* empty, read what is there and extend it — never replace it.

Write it back with `Set-Page-Settings { pageId, metaTags: "<the full script tag>" }`. The tool patches only the keys you send (`jsFile`, `cssFile`, `loginOnly` survive) — but **verify by reading back**, and confirm both your class and all the originals are present.

**Trap:** `Set-Page-Settings` does not clear the page cache. Follow it with a no-op `Edit-Page-CSS-JS` write (identical `cssCode`) or the page keeps serving the old snapshot and a correct change looks like a silent failure.

## B2 — The scoping filter field

The page carries one hidden filter input per supported entity, each named exactly like its `_Timeline` column and each carrying `data-criteria="equalTo"`. The card passes its identity through the parent query string; page JS copies it into the matching input.

**Add the field:** `Edit-Page` → `add-new-field` into the query-form row, `fieldType: "String"`.

> **Declare it String, never Pointer — even though the `_Timeline` column is a Pointer.** A Pointer renders a `select-pointer` `<select>`, and the JS assignment does not take on an empty select. Every built-in entity's filter is a plain `<input type="text">`; the pointer-ness is added at runtime by JS, not by the field type. Verify the rendered tag after adding.

`add-new-field` does not set `data-criteria`, and no Edit-Page action sets attributes. Fix it with `set-html-content` on the new form-group, matching the shape of the existing ones:

```
Edit-Page { actions: [{ actionType: "set-html-content",
                        intoExistingElemId: "<the new form-group id>",
                        htmlContent: "<label for=\"<Col>\" style=\"display: none;\"></label><input name=\"<Col>\" id=\"<Col>\" type=\"text\" placeholder=\"\" class=\"form-control\" data-criteria=\"equalTo\">" }] }
```

(The parameter names are `intoExistingElemId` + `htmlContent`; `elemId`/`html` are rejected.)

**Then wire it** in the page's `jsCode`, copying the platform's own per-class pattern — **all three lines**:

```js
if (window.parent.QueryString.cls === '<Class>') {
    $("input[name='<Col>']").attr("targetclass", "<Class>");
    $("input[name='<Col>']").addClass("select-pointer");
    $("input[name='<Col>']").val(window.parent.QueryString.oid);
}
$("input[name='<Col>']").hide();
```

> **The `targetclass` + `select-pointer` pair is not decoration.** The query form serializes a value as a Parse pointer *only* when both are present; without them the objectId goes out as a bare string, which never matches a Pointer column — a permanently empty feed that looks like a data problem. This is the single most expensive mistake in Part B. (Reference §1.11.2 carries the measurement.) The `.hide()` is separate and unconditional: the platform hides only its own six fields.

`Edit-Page-CSS-JS` **overwrites** — read the current `jsCode`, append, send the whole thing, and afterwards assert the old content is still a prefix of the new.

## B3 — The `<li>` template block

The feed template holds one `<li class="timeline-inverted <type>">` per entry type, all inside one html element whose container carries `{{objectClass}}`; CSS decides which block is visible for a given row. A type with no block has nothing to render.

Build yours by **copying a shipped block** — the `account` block in reference §1.11.3 is the canonical shape — and substituting: the type class (lowercase singular), the icon, the title text, the `data-ticket` link, and the `{{...}}` placeholders. The placeholders must be the **`_Timeline` column names from your A2 mapping**, not your source field names; a pointer column exposes `{{<Col>.Id}}` and `{{<Col>.Name}}`.

Keep `{{event}}d` exactly as written — `event` is `create`/`update`, so the text renders as `created`/`updated`, which the renderer then translates to Hebrew.

Then write the whole element back with `set-html-content`.

> **Trap: `set-html-content` drops the element's inner `.htmlContent` wrapper.** Include it yourself — send `<div style="width: 100%;" class="htmlContent">` + the full template + `</div>` — then read back and assert the wrapper exists exactly once. Getting this wrong leaves the feed unstyled for **every** type, not just yours.

Scrub the copy before inserting: assert that no identifier of the source type survives anywhere in the block, that every pre-existing `<li>` is still present, and that `<div>`/`<li>` tags balance.

## B4 — Visibility and colour (CSS)

The master stylesheet gates visibility and paints the badge circle and rail **for the shipped types only**. A new type with no rules of its own renders under *every* row, with a white badge (invisible on white) and no rail. Four rules — two for gating, two for colour:

```css
.timeline .<type> { display: none; }
.timeline.<Class> .<type> { display: list-item !important; }

body.page-slug-timeline .timelineUL>li.<type> .timeline-panel {
    border-right: 3px solid <colour> !important;   /* the rail */
}
body.page-slug-timeline .timelineUL>li.<type> .timeline-badge .fa {
    background-color: <colour> !important;          /* the circle */
    color: #fff !important;
}
```

Pick a colour that is **unique against the shipped palette** (listed in reference §1.11.4) *and* against types already added in that tenant — read the existing `cssCode` first. Leave a dated comment saying what the colour is and why. Append to the existing `cssCode`; never replace it.

## B5 — The filter checkbox (optional but expected)

The "סינון" dropdown builds a comma-joined class list from the checked boxes and pushes it into the `objectClass` input (`data-criteria="containedIn"`). Adding a type without a checkbox means users cannot isolate it. The handler selects `.checkbox input`, so the structure matters:

```html
<div class="control"><div class="checkbox"><label><input type="checkbox" name="TimelineFilter" value="<Class>">התווית</label></div></div>
```

Insert it into the dropdown container with `set-html-content`, mirroring the existing form-groups.

> The **היסטוריה** checkbox is *not* a type filter. Unchecked, the query is constrained to `Pinned = true OR Last = true` — only the newest entry per record. Checked, that constraint is dropped and every revision appears. Explain this when a customer reports "entries only show under היסטוריה"; it is behaving as designed.

## B6 — The frame on the record card

The card hosts the feed as a frame onto the shared page:

```html
<iframe scrolling="no" id="timeLineFrame" style="width:100%; height:500px" src="Timeline"></iframe>
```

Add a row, then `set-html-content` into it. On a card with a tabs element, anchor the row **in the form body or in a dedicated tab** — anchoring "at the end" can bury it inside the last tab. The frame needs no parameters: the page reads the card's `cls`/`oid` from the parent query string, which is what B1 and B2 consume, and the parent resizes the frame once rows load.

## B7 — Verify like a user, not like an API

`success: true` proves storage, not behaviour, and a DOM count proves neither.

- `Get-Page-Content` — your `<li>` present, **all pre-existing types still present**, the `.htmlContent` wrapper intact, other filter fields untouched.
- `Get-Page-Settings` — the whitelist contains your class **and all six defaults**; `jsFile`/`cssFile`/`loginOnly` unchanged.
- A real write on a test record → the entry appears on the card **in a browser**, with its circle and rail, correctly scoped to that record, and the title link opens the record.
- Open **two other entity cards** that use this page and confirm their timelines still render. This page is shared; a mistake here takes the feed down on every card in the tenant.

---

## Gotchas verified in the field

- **`Get-Data` and `Count-Data` take a `fieldName` key** in both the top level and inside `where` — pass `"fieldName": null`, which is accepted and dropped. `_Timeline` reads are no exception.
- **`dontRunSimblaTriggers` does not suppress the timeline.** Use it freely for test writes on tables with live outbound integrations.
- **Hebrew verb gender is a heuristic in the renderer**, not something the template controls: the masculine form (`נוצר` / `עודכן`) is used only when the title text contains `לקוח` or `איש קשר`; everything else gets the feminine (`נוצרה` / `עודכנה`), which fits the mostly-feminine built-in entities. For a masculine entity name the fix is in the **title wording** — phrase it so it reads correctly. Do not patch the shared renderer file: it is served to every tenant.
- **`Last: true` is not unique under concurrency** — parallel writes (two triggers milliseconds apart is enough) leave several rows flagged. Order by `-createdAt` instead.
- **A corrupt row cannot be removed.** `_Timeline` rejects all writes, so a cross-class pointer mapping is permanent. Rehearse an unfamiliar mapping on a sandbox tenant.
- **`Pinned` and `Color` are UI-only** — no MCP tool sets them, and the table is read-only, so an agent cannot pin or colour an entry.
- **No custom entries.** An agent cannot write a timeline row directly; entries only arise from writes to a tracked table. A manual note belongs in `Notes` (which is itself tracked).
- **The column set is per-tenant** — created lazily on first write, so never assume a column or a `_changed` flag exists in a tenant until seen in that tenant's `_Timeline` schema.
- **`<Field>_changed` is presence, not difference** — re-saving a field with its existing value sets it, and it is absent rather than `false` when unchanged. Do not build "what actually changed" reporting on it.
- **No old value.** `data` is the new write payload; the previous value is not recorded.
- Attribution is `user`, never `createdBy`/`updatedBy` (always `Master` on the log row). MCP/API writes are attributed to `Master`, so agent-made changes are not distinguishable by person; trigger writes carry `updatedByTrigger` in `data`, and a populated `Referer` marks a browser edit.

## Tell the customer what it does and does not cover

Whenever this is done for a real customer, state the gaps explicitly — they are the ones that surface later as complaints:

- **No backfill.** History starts now; everything before today is not recoverable. Say this *before* they ask, because it is the argument for enabling it early.
- **Deletes record almost nothing** — who and when, never *what*. The entry does not appear on the record card at all. If "what was deleted" matters, add a soft-delete/archive flag instead of relying on the timeline.
- **User, role and permission changes are not auditable** at all (`_User` is restricted).
- **Bulk imports may be invisible** if they ran with `Create-Many(skipTimeline: true)`.
- **The feed lives on the cards you wired, and nowhere else.** If a second table gets tracked later, the display work repeats.

## How to present the result

Lead with the table and what is now tracked, then the mapping as a small table (source field → timeline column → where it shows / what it says), then whether the feed is visible on a card and where, then the coverage gaps in the customer's language. If anything was left off deliberately (a noisy field, a fat text column, a second pointer to the same class), say so and why. If the tenant already contained a poisoned `_Timeline` row, report it as unrepairable and note which queries it breaks — do not imply it can be cleaned up. If Part B was done, record the page version anchor you took, so the change is reversible by whoever reads the report next.
