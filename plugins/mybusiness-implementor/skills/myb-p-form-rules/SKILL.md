---
name: myb-p-form-rules
description: "Configure form rules (חוקי טופס) on MyBusiness CRM form/card pages — conditional hide/show, conditional required, readonly/lock, fixed/dynamic values, formulas, validation messages, URL-prefill. Form rules have NO admin UI — MCP is the only authoring path — so invoke this skill for ANY form-rule request and for WP7 (חוקי טופס) of the build work plan. Triggers: 'שדה חובה רק כשסטטוס = X', 'תסתיר את השדה עד שנבחר סוג', 'תנעל את הכרטיס אחרי סגירה', 'ערך ברירת מחדל בטופס', 'הצג הודעת אזהרה בטופס', 'חוקי טופס', 'שדה לקריאה בלבד', 'make this field required when', 'hide the field unless', 'lock fields after closing', 'readonly when status is', 'form rules', 'conditional mandatory field', 'auto-fill from another field'. NOT for server-side automations/emails on save — use myb-p-trigger-setup; NOT for page layout/sections — use myb-p-page-builder; NOT for access control/CLP — use myb-p-users-roles-permissions; NOT for table-view columns or row coloring — use myb-p-page-tables."
---

# Form Rules / חוקי טופס

Author client-side field behavior on MyBusiness CRM form (card) pages: conditional hide, conditional required, readonly/lock, fixed values, live field mirroring, formulas, warning messages, and URL-prefilled fields.

**Why this skill exists:** form rules are the only customization domain in the product with **no admin UI** — they are configured exclusively via MCP/API. The AI agent is the author of record; there is no "do it in the UI" fallback for the rules themselves.

**Canonical mechanism doc (read before any non-trivial rule):** `../myb-p-kb/references/30-customization/07-form-rules.md` — rule object shape, condition grammar, the full action list, tool semantics, worked patterns, and limitations. This skill is the procedure; that file owns the facts.

## Boundaries — what this skill is NOT

| The ask | Route to |
|---|---|
| Act on save / send email / create-update other records / server-side enforcement | `myb-p-trigger-setup` (form rules are client-side UX only — API writes bypass them; KB doc §1) |
| Add/move fields, sections, tabs, widgets on the card | `myb-p-page-builder` |
| Who may read/write a table or field (CLP, roles) | `myb-p-users-roles-permissions` |
| Table-view columns, filters, conditional row coloring | `myb-p-page-tables` |
| Filter a Pointer dropdown's options by another field | Not a rule action — native parent/child mechanism; `myb-p-parent-child-fields` (KB doc §6) |

## Pipeline placement — WP7

This skill executes **WP7 — חוקי טופס** of the build work plan (`the work-plan playbook` §2).

- **Consumes:** `RULE-*` items from the functional spec §6 (each item: ID, source REQ-IDs, rule spec, acceptance criteria, target page).
- **Prerequisites:** WP4 done (card pages exist — rules attach to a `pageId`, not a table) and WP3 lookup values final (condition values reference lookup objectIds; playbook §4 rule 3).
- **Emits:** per rule, a build-ledger evidence row — the `Get-Form-Rules` read-back JSON plus the behavior-probe result — per `build`'s ledger contract (`step-id · WP7 · disposition · mechanism+params · source RULE-IDs · AC + verify check · status · evidence · attempts`).

Standalone requests (no pipeline) follow the same workflow, minus the ledger row.

## Hard rules — before anything else

1. **`Get-Form-Rules` FIRST, always** — never write to a page whose current rule set you have not read this session.
2. **`Edit-Form-Rules` is the writer. `Set-Form-Rules` REPLACES ALL rules on the form** and is avoided (KB doc §4: "כלי זה דורס את כל הכללים הקיימים"). See "If you must use Set-Form-Rules" below.
3. **Rule `name` is the identity** — `edit`/`delete` match by name; duplicates break targeting. Unique, descriptive Hebrew names.
4. **Scope is per page + form** — desktop and `Mobile-*` pages of the same entity have independent rule sets; replicate deliberately (KB doc §1).
5. **Not a security boundary** — `hidden`/`readonly` do nothing against API writes, imports, or triggers. If the requirement is enforcement, say so and route to triggers/CLP.

## Workflow

### Step 0 — Resolve the target form page

`Get-Site-Pages` (no params) → match by path. Naming convention: singular page name = form page, plural = list view, `Mobile-*` = mobile variant (tools catalog, `Get-Site-Pages` entry).

- **0 matches:** the card page doesn't exist yet. Stop — build it first (WP4 / `myb-p-page-builder`), then return here.
- **1 match:** proceed; echo the resolved path + `_id` in the plan preview so the user confirms the right page.
- **Many matches** (desktop + mobile, or several cards over the same table): ask the user which pages are in scope. Each page needs its own copy of the rules.

`formId` defaults to the first form on the page (KB doc §1). If the page hosts more than one form, pass `formId` explicitly — locate the form's id via `Get-Page-Content` on the page (⚠️ UNVERIFIED discovery path — verify on the playground before relying).

### Step 1 — Read existing state

```
Get-Form-Rules(pageId)          → keep the returned JSON as backup + baseline count
Get-Schema(tableName)           → exact field names and types for conditions/actions
Get-Data(<lookup table>)        → resolve objectIds for Pointer condition values
```

Check the existing rules for: a name collision with your planned rule, and other rules acting on the same field (conflict resolution order is undocumented — ⚠️ UNVERIFIED; design conditions to be mutually exclusive, KB doc limitations).

### Step 2 — Author the rule

Translate the customer's ask into `conditions[]` + `actions[]` in the canonical rule shape (owned by KB doc §2):

```json
{
  "name": "<unique Hebrew name>",
  "conditions": [
    { "field": "StatusId", "equesition": "equalTo", "value": "<objectId>", "visibleVal": "<label>", "condOr": false }
  ],
  "actions": [
    { "field": "CancelReason", "action": "required", "value": "" }
  ]
}
```

- Operators (`equesition` — sic), condition-value forms per field type (Pointer objectId / `"currentUser"` / `"checked"`·`"unchecked"` / date keywords), and the full action list: KB doc §2–3. Write **canonical operators only** (stored legacy variants like `empty`/`equealTo` exist in the wild — don't copy them; KB doc §2).
- AND is the default; OR requires `condOr: true` on **≥2** conditions — a single flagged condition does nothing (KB doc §2).
- `conditions: []` = the rule always runs — the mirroring idiom, but an accidental always-on `fixed-value` overwrites user input on every form load (KB doc limitations).

**Common asks → rule sketches** (each row cites its owning KB section — read it before writing):

| Customer ask | Rule sketch | KB §5 |
|---|---|---|
| "שדה חובה רק כשסטטוס = X" | Pair: `hidden` when status `notEqualTo` X + `required` when `equalTo` X | 5.1 |
| "תסתיר את השדות עד שנבחר סוג" | `hidden` actions (one per field) while the type field `notEqualTo` the enabling value — §5.1 hide leg. Rules act on **fields**; a section *header* is page layout (`myb-p-page-builder`) | 5.1 |
| "תנעל את הכרטיס אחרי סגירה" | OR group of final statuses (`condOr: true` ×2+) → `readonly` per locked field | 5.3 |
| "העתק פרטים מהלקוח לטופס" | `conditions: []` + `dynamic-value` per field (e.g. `"AccountId.Email"` — one pointer hop) | 5.2 |
| "תאריך סיום אוטומטי בסגירה" | status `equalTo` done → `fixed-value` `"today"` (client-side; server-side stamp = `myb-p-timestamp-field`) | 5.4 |
| "חובה רק עבור סוגים מסוימים" | `containedIn` with an array of objectIds → `required` | 5.5 |
| "הצג אזהרה במצב רגיש" | condition on the state → `show-message` with the Hebrew message text | 5.6 |
| "אחראי ברירת מחדל = המשתמש" | `conditions: []` + `fixed-value` `"currentUser"` on the `_User` Pointer | 5.7 |
| "קישור שממלא שדות מראש" | `value-from-url` action (KB doc §3) | — |

⚠️ UNVERIFIED mechanics — verify on the playground before relying: `formula-value` syntax (undocumented — copy from a working rule only), checkbox `fixed-value` value naming (`"checkbox"/"uncheckbox"` vs `"checked"/"unchecked"` conflict between sources), `dynamic-value` beyond one pointer hop. All per KB doc §3/§6.

### Step 3 — Plan preview + confirmation (before the FIRST write)

Present to the user, in Hebrew, before touching the tenant:

1. Target page(s) — path + `pageId` (and mobile replication yes/no).
2. Each rule: name, condition in plain words ("כאשר סטטוס = בוטל"), actions, affected fields.
3. Any **existing** rule being edited or deleted (quote its current JSON).
4. Reversibility: `add` is undone by `delete`; `edit`/`delete` overwrite/remove the existing rule — the backup JSON from Step 1 is the restore path.
5. State explicitly that `Set-Form-Rules` will NOT be used.

Proceed only on explicit confirmation.

### Step 4 — Write with Edit-Form-Rules (one call per rule)

Call shapes owned by KB doc §4:

```json
{ "pageId": "<pageId>", "action": "add",    "rule": { "name": "...", "conditions": [...], "actions": [...] } }
{ "pageId": "<pageId>", "action": "edit",   "rule": { "name": "<existing>", "conditions": [...], "actions": [...] } }
{ "pageId": "<pageId>", "action": "delete", "rule": { "name": "<existing>", "conditions": [], "actions": [] } }
```

Notes: `edit` fully replaces the named rule's conditions+actions (not a merge); `delete` needs only the name. Repeat the calls per additional page (mobile variant) if in scope.

**If you must use Set-Form-Rules** (only for a from-scratch rule system or a deliberate full rewrite): it is a whole-state writer — a blind write destroys every rule you did not include. Read → merge → write, per KB doc §4:

```
1. backup = Get-Form-Rules(pageId)     // save the full JSON aside
2. newRules = backup.rules ± changes   // merge, never author from memory
3. Set-Form-Rules(pageId, rules: newRules)
4. Get-Form-Rules(pageId)              // verify nothing was lost
```

### Step 5 — Verify (after EVERY write)

1. **Read-back:** `Get-Form-Rules(pageId)` — the rule is present, conditions/actions match the plan exactly, and the total rule count = baseline ± your changes (nothing lost). Capture this JSON as the ledger evidence (WP7 builds).
2. **Behavior probe** — rules run in the browser only; there is no server log of rule evaluation (KB doc §7). Who probes: the agent via browser automation when a browser MCP is available in the session; otherwise ask the user to probe and report, and record their confirmation as the evidence. Either way: open the form page, **hard-refresh (Ctrl+F5)** — rule definitions load with the page — then flip the condition field(s) and watch the action apply and un-apply.
3. **If the rule does not fire, check in order:** wrong page (desktop vs `Mobile-*` — rules are per page); wrong `formId` (page has multiple forms); no hard refresh; condition `value` is a display label instead of the Pointer objectId; single `condOr` condition (no effect); another rule acting on the same field (no documented priority — ⚠️ UNVERIFIED resolution order); expecting a rule to fire on an API write (they never do — client-side only).

### Final verification checklist

- [ ] `Get-Form-Rules` read-back matches the plan on every touched page (desktop + mobile if in scope)
- [ ] Rule count = baseline + added − deleted (no collateral loss)
- [ ] Behavior probe passed in the browser (agent-observed, or user-confirmed and recorded)
- [ ] No rule silently duplicates an existing rule's name
- [ ] WP7 builds: ledger row per RULE item updated with read-back + probe evidence
- [ ] Enforcement-grade requirements were routed to triggers/CLP, not left as form rules

## Knowledge sources

Read on demand — never from memory:

- `../myb-p-kb/references/30-customization/07-form-rules.md` — THE mechanism doc: rule shape, operators, condition values, action list, Set-vs-Edit semantics, patterns §5, cannot-do list §6, limitations.
- `../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md` — §7 form-rules tools (exact params), `Get-Site-Pages` / `Get-Page-Content` entries.
- `../myb-p-kb/references/30-customization/06-triggers-and-automations.md` — condition-shape grammar; when the requirement is actually a trigger.
- `../myb-p-kb/references/30-customization/11-field-patterns.md` — parent/child dropdown filtering; form-rule stamp vs timestamp trigger.
- `the work-plan playbook` — WP7 contract and sequencing rules.

MCP tools used: `mcp__MyBusiness__Get-Site-Pages`, `mcp__MyBusiness__Get-Form-Rules`, `mcp__MyBusiness__Edit-Form-Rules`, `mcp__MyBusiness__Set-Form-Rules` (last resort, read-merge-write only), `mcp__MyBusiness__Get-Schema`, `mcp__MyBusiness__Get-Data`, `mcp__MyBusiness__Get-Page-Content` (multi-form pages), `mcp__MyBusiness__Usage-Guide` (when tool semantics are unclear).

## Known limitations

- **Client-side only.** Rules never run on API writes, imports, or trigger-driven updates — `required`/`readonly`/`hidden` are UX, not integrity. Anything that must hold server-side needs a trigger or CLP.
- **Per page+form duplication.** The same table on N pages needs N copies of each rule; they drift silently unless the ledger tracks all copies.
- **No role-conditioned rules** documented in any examined source (⚠️ UNVERIFIED absence) — per-audience behavior needs page-level role settings or separate pages (KB doc §6).
- **No documented rule ordering/priority** — conflicting actions on one field have undefined resolution (⚠️ UNVERIFIED); keep conditions mutually exclusive by design.
- **`formula-value` is a black box** — syntax undocumented; only safe move is copying a live working rule.
- **Behavior verification requires a browser** — `Get-Form-Rules` proves storage, not behavior; without a browser probe (agent or user), the rule is unverified.
- **Legacy operator strings** (`empty`, `equealTo`) exist in stored rules created via older paths; audits must tolerate them, writes must normalize to canonical operators.
