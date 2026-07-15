# Form Rules — Client-Side Field Behavior

> **Purpose:** Reference for כללי טופס (Form Rules) — the client-side rules engine that hides/requires/locks fields, fills values, and shows messages on form pages, including the canonical action list, condition structure, the Set-vs-Edit replace-all gotcha, and worked examples.
> **Last updated:** 2026-06-10 · **Status:** draft

## 1. What form rules are (and are not)

Form rules are **per-form-page, client-side** behaviors evaluated in the browser while a user views/edits a record on a form page (דף טופס). Each rule = `conditions[]` (when) + `actions[]` (what happens to which fields).

| Property | Form rules | Triggers (see `06-…`) |
|---|---|---|
| Runs | In the browser, live as the user edits | On the server, on save / on schedule |
| Scope | One form on one page (`pageId` + optional `formId`) | Whole table |
| Enforcement | UX only — **not** a security boundary; API writes bypass them entirely | Server-side |
| Typical use | Conditional visibility, conditional required, auto-fill, lock after close | Notifications, record creation, cross-table sync |

Scope detail: rules attach to a specific form on a specific page. `formId` defaults to the first form on the page. The same table shown on two different pages (e.g. desktop `Sale` and `Mobile-Sale`) has **two independent rule sets** — replicate rules on both pages if needed.

## 2. Rule object — canonical structure

```json
{
  "name": "סיבת ביטול (הסתרה)",
  "conditions": [
    {
      "field": "StatusId",
      "equesition": "notEqualTo",
      "value": "cancelled_id",
      "visibleVal": "בוטל",
      "condOr": false
    }
  ],
  "actions": [
    { "field": "CancelReason", "action": "hidden", "value": "" }
  ]
}
```

- **`name` is the rule's identity** — unique per form; `Edit-Form-Rules` `edit`/`delete` match by name.
- Conditions use the **long-key (`equesition`) condition shape** — see `06-triggers-and-automations.md` §2 for the canonical Usage-Guide quote covering both shapes. `visibleVal` is descriptive only.
- A rule with `conditions: []` **always runs** (idiom for permanent `dynamic-value` mirroring).
- AND by default; `condOr: true` on ≥2 conditions creates an OR group (a single `condOr` condition has no effect).

### Condition operators (`equesition`)

`equalTo`, `notEqualTo`, `greaterThan`, `lessThan`, `greaterThanOrEqualTo`, `lessThanOrEqualTo`, `containedIn` (array value), `notContainedIn` — per the tool guides. The Usage-Guide master condition spec additionally lists `exists`, `notExist`, `startsWith`, `endsWith`, `contains`.

⚠️ Live observed (playground Sale page, `Get-Form-Rules`): a stored rule uses `"equesition": "empty"` and a typo'd `"equealTo"` — both created via the UI and tolerated at runtime:

```json
{
  "name": "Closing date when status complete",
  "conditions": [
    { "field": "ClosingDate", "equesition": "empty", "value": "", "visibleVal": "" },
    { "field": "SaleStatusId", "equesition": "equealTo", "value": "zrP1MSVBoq", "visibleVal": "Complete" }
  ],
  "actions": [
    { "field": "ClosingDate", "action": "fixed-value", "value": "today", "visibleVal": "today" }
  ]
}
```

Lesson: when auditing customer systems expect non-canonical operator strings; when **writing** rules, use the canonical operators only.

### Condition values

| Field type | `value` |
|---|---|
| Pointer | objectId string; pointer to `_User` may use `"currentUser"` |
| Checkbox (Boolean) | `"checked"` / `"unchecked"` |
| Date | `"today"`, `"year ago"`, `YYYY-MM-DD`, day-offset number, plus the full keyword list in Usage-Guide (`"beginning of this year"`, `"30 days period"`, `"beginning of this month"`, `"end of this month"`, `"end of next month"`, `"end of this year"`, `"year ahead"`) |
| String / Number | literal |

## 3. Action types — CANONICAL (quoted from `Usage-Guide`)

Quoted verbatim from the live `Usage-Guide` call (2026-06-10):

> לגבי form rules actions:
> `"readonly"` - make the field readonly (no value is needed)
> `"required"` - make the field required (no value is needed)
> `"hidden"` - hide the field (no value is needed)
> `"fixed-value"` - set the value of the field to a fixed value. For pointer fields, the value is the objectId. When the pointer is to _User table, the value can be "currentUser". For checkbox field the value should be "checkbox" or "uncheckbox". For date fields, the value can be a string in format YYYY-MM-DD, a number of days to add (can be negative), "year ago", "beginning of this year", "30 days period", "beginning of this month", "today", "end of this month", "end of next month", "end of this year", "year ahead".
> `"dynamic-value"` - set the value of the field to a dynamic value (copy from another field). If the other field is a pointer, the value can be the objectId, or a property name from the object (for example "BrandId.Name").
> `"formula-value"` - set the value of the field to a formula value
> `"show-message"` - show a message (no field is needed). The value is the message to show.
> `"value-from-url"` - set the value of the field to a value from the URL (no value is needed).

### Action reference table

| `action` | `value` | Behavior / notes |
|---|---|---|
| `readonly` | `""` | Field locked for editing |
| `required` | `""` | Field must be filled before save |
| `hidden` | `""` | Field hidden from the form |
| `fixed-value` | literal / objectId / `"currentUser"` / date keyword / `"checkbox"`·`"uncheckbox"` | Sets a constant. ⚠️ Checkbox value naming conflict between sources: Usage-Guide (canonical) says `"checkbox"`/`"uncheckbox"` for **fixed-value actions**, while `mcp-tool-guides.md` lists `"checked"`/`"unchecked"` (which is the verified form for **condition** values). When writing a fixed-value on a checkbox, prefer the Usage-Guide form; if it doesn't take effect, try the other — ⚠️ UNVERIFIED which one the runtime accepts in every version |
| `dynamic-value` | source field path, e.g. `"AccountId.Email"`, `"BrandId.Name"` | Live-copies another field's value (including across one pointer hop). Note: in form rules the path is **2-segment** (`Pointer.Field`) — unlike 3-segment `aggrField` paths in table views (`AccountId.Accounts.Name`) |
| `formula-value` | formula string | Computed value. ⚠️ UNVERIFIED — formula syntax is not documented in any examined source; inspect an existing working rule before authoring |
| `show-message` | message text | Displays a message to the user when conditions match (attach to any field; "no field is needed" per Usage-Guide, though examples set `field` anyway) |
| `value-from-url` | URL parameter name (`""` per Usage-Guide; tool-guide examples pass the param name) | Fills the field from a query-string parameter — the standard trick for pre-filled links |

## 4. The three tools

| Tool | Mode | When |
|---|---|---|
| `Get-Form-Rules(pageId, formId?)` | Read | **Always first.** Returns `{ "rules": [...] }` |
| `Edit-Form-Rules(pageId, action, rule, formId?)` | Surgical — one rule | `action: "add"` / `"edit"` / `"delete"`; rule matched by `name` |
| `Set-Form-Rules(pageId, rules, formId?)` | **REPLACES ALL rules on the form** | Only for building a rule set from scratch or a deliberate full rewrite |

### ⚠️ THE critical gotcha — Set-Form-Rules replaces everything

Quoted from the tool guide: "כלי זה מחליף את **כל** הכללים הקיימים בעמוד ברשימת כללים חדשה … ⚠️ **אזהרה:** כלי זה **דורס** את כל הכללים הקיימים! תמיד הרץ `Get-Form-Rules` קודם ושמור גיבוי."

Decision table (from `mcp-tool-guides.md`):

| Situation | Tool |
|---|---|
| Define rules from scratch | `Set-Form-Rules` |
| Comprehensive rewrite of all rules | `Set-Form-Rules` |
| Add a single rule | `Edit-Form-Rules` (`add`) |
| Edit one existing rule | `Edit-Form-Rules` (`edit`) |
| Delete one rule | `Edit-Form-Rules` (`delete` — `name` only; `conditions`/`actions` may be `[]`) |

Safe workflow when you must use Set:

```
1. backup = Get-Form-Rules(pageId)            // save the JSON
2. newRules = backup.rules ± your changes
3. Set-Form-Rules(pageId, rules: newRules)
4. Get-Form-Rules(pageId)                      // verify
```

### Edit-Form-Rules call shapes

```json
// add
{ "pageId": "<pageId>", "action": "add",
  "rule": { "name": "...", "conditions": [...], "actions": [...] } }

// edit (name must match an existing rule; conditions+actions fully replace that rule's)
{ "pageId": "<pageId>", "action": "edit",
  "rule": { "name": "...", "conditions": [...], "actions": [...] } }

// delete (only the name matters)
{ "pageId": "<pageId>", "action": "delete",
  "rule": { "name": "...", "conditions": [], "actions": [] } }
```

## 5. Canonical patterns (from `mcp-tool-guides.md` examples)

### 5.1 The hide+require pair — conditional mandatory field

The most common composition: two complementary rules on the same field.

```json
[
  {
    "name": "סיבת ביטול (הסתרה)",
    "conditions": [{ "field": "StatusId", "equesition": "notEqualTo",
                     "value": "cancelled_id", "visibleVal": "בוטל" }],
    "actions": [{ "field": "CancelReason", "action": "hidden", "value": "" }]
  },
  {
    "name": "סיבת ביטול (חובה)",
    "conditions": [{ "field": "StatusId", "equesition": "equalTo",
                     "value": "cancelled_id", "visibleVal": "בוטל" }],
    "actions": [{ "field": "CancelReason", "action": "required", "value": "" }]
  }
]
```

### 5.2 Field mirroring (unconditional dynamic-value)

```json
{
  "name": "שיקוף פרטי לקוח",
  "conditions": [],
  "actions": [
    { "field": "Email",   "action": "dynamic-value", "value": "AccountId.Email" },
    { "field": "Phone",   "action": "dynamic-value", "value": "AccountId.PhoneNumber" },
    { "field": "Address", "action": "dynamic-value", "value": "AccountId.Address" }
  ]
}
```

### 5.3 Lock the record at final statuses (OR group + readonly)

```json
{
  "name": "סטטוסים סופיים - קריאה בלבד (OR)",
  "conditions": [
    { "field": "StatusId", "equesition": "equalTo", "value": "completed_id",
      "visibleVal": "הושלם", "condOr": true },
    { "field": "StatusId", "equesition": "equalTo", "value": "cancelled_id",
      "visibleVal": "בוטל", "condOr": true }
  ],
  "actions": [
    { "field": "Name",   "action": "readonly", "value": "" },
    { "field": "TypeId", "action": "readonly", "value": "" }
  ]
}
```

### 5.4 Auto-stamp a date on completion (fixed-value `today`)

```json
{
  "name": "תאריך סיום אוטומטי",
  "conditions": [{ "field": "StatusId", "equesition": "equalTo",
                   "value": "completed_id", "visibleVal": "הושלם" }],
  "actions": [{ "field": "CompletionDate", "action": "fixed-value", "value": "today" }]
}
```

(Client-side cousin of the server-side timestamp trigger pattern — see `11-field-patterns.md` § timestamp for choosing between them.)

### 5.5 Group-based requirements (containedIn)

```json
{
  "name": "מיקום פגישה - סוגי פגישה חיצונית",
  "conditions": [{ "field": "MeetingType", "equesition": "containedIn",
                   "value": ["external_id", "client_office_id", "restaurant_id"],
                   "visibleVal": "פגישות חיצוניות" }],
  "actions": [{ "field": "Location", "action": "required", "value": "" }]
}
```

### 5.6 Warning message on a sensitive state

```json
{
  "name": "התראה לפני מחיקה",
  "conditions": [{ "field": "StatusId", "equesition": "equalTo",
                   "value": "pending_delete_id", "visibleVal": "ממתין למחיקה" }],
  "actions": [{ "field": "StatusId", "action": "show-message",
                "value": "שים לב! לקוח זה יימחק תוך 7 ימים. האם אתה בטוח?" }]
}
```

### 5.7 Default owner = current user

```json
{
  "name": "אחראי ברירת מחדל",
  "conditions": [],
  "actions": [{ "field": "OwnerId", "action": "fixed-value", "value": "currentUser" }]
}
```

Recommended by `guide_advanced_permissions.md` to guarantee `OwnerId` is populated when row-level filtering (הרשאות מתקדמות) depends on it — see `08-users-roles-permissions.md` §7.

## 6. What form rules CANNOT do

| Requested behavior | Why not / use instead |
|---|---|
| Filter a Pointer dropdown's options by another field | Not a rule action. Use the native parent/child mechanism — `subclassDepend` ("Define Parent") — see `11-field-patterns.md` |
| Enforce data integrity against API writes | Client-side only. Use triggers or CLP (`08-users-roles-permissions.md`) |
| Cross-record actions (create/update other records, send messages) | Triggers (`06-triggers-and-automations.md`) |
| Per-role field visibility | Rules have no role conditions in any examined source — ⚠️ UNVERIFIED; achievable with page-level `allowedRoles` (page settings) or separate pages per audience |
| Multi-hop pointer copy (`A.B.C`) in dynamic-value | Only one pointer hop is documented (`"BrandId.Name"`) — ⚠️ UNVERIFIED beyond one hop |

## 7. Verification workflow

1. `Get-Form-Rules(pageId)` → confirm the rule JSON landed.
2. Open the form page in the CRM UI, manipulate the condition fields, watch the behavior (rules are client-side — there is no server log of rule evaluation).
3. Hard-refresh (Ctrl+F5) after rule changes — rule definitions are loaded with the page.

To find the right `pageId`: `Get-Site-Pages()` and match the form page path (e.g. `apps/mybusiness/Sale` for the Sale card). Form pages are the singular-named pages; the plural pages are table views without forms.

## Limitations & gotchas

1. **`Set-Form-Rules` replaces ALL rules** on the form — back up with `Get-Form-Rules` first; prefer `Edit-Form-Rules` for single changes.
2. **Rule `name` is the only identifier** — duplicate names break edit/delete targeting; keep them unique and descriptive.
3. **Client-side only** — zero enforcement for REST/MCP writes, imports, or triggers; never treat `readonly`/`hidden` as security.
4. **Per page+form scope** — desktop and mobile pages of the same entity each need their own copy of the rules.
5. **`equesition` spelling** is canonical; stored data may contain `empty` / `equealTo` variants created by the UI (live-observed) — normalize when rewriting.
6. **Checkbox fixed-value naming conflict** (`"checkbox"/"uncheckbox"` vs `"checked"/"unchecked"`) between Usage-Guide and tool guides — test on the target environment.
7. **`formula-value` syntax undocumented** — copy from a working example only.
8. **A single `condOr` condition does nothing** — OR needs at least two flagged conditions.
9. **Rules with empty conditions run always** — that's the mirroring idiom, but an accidental empty-condition `fixed-value` will overwrite user input on every form load.
10. **No rule ordering/priority documented** — ⚠️ UNVERIFIED how conflicting actions on the same field resolve (e.g., one rule hides, another requires); design rule sets to be mutually exclusive by condition.
