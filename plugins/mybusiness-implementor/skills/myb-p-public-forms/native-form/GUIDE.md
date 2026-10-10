# Native public form — Database form → open intake table

A public page on the tenant's CRM site carries a native **Database form** with the platform's **reCAPTCHA**. The visitor's browser saves the row itself; the server verifies the CAPTCHA token, then the table permission `create:"*"` lets the row in. No web2table, no phone, no code for the save.

Fact source for everything below: KB `30-customization/15-public-forms.md` §2–§3. Built and verified end to end through MCP only — no site-editor step is required.

```
link (email / SMS / QR / website button)
  └─► public page  /<RootPage>?<context>
        ├─ form rules        (prefill from URL, hide, conditional required)
        ├─ optional page JS  (gate on an invite, link to a record, one-click submit)
        └─ Database form + reCAPTCHA ──save as "Public"──► INTAKE table  (create: staff roles + "*")
                                                              └─ triggers ─► business record / task / notification
```

## Step 0 — decisions before building

| Decision | Options | Why it matters |
|---|---|---|
| Questions and their types | text / number / date / yes-no / one-of-N / many-of-N | each maps to one column (§Field types) |
| Scales | `select` or `input type=number` if a rule depends on them; radios only for scales no rule reads | **a radio group can never drive a form rule** |
| Context the page needs | none · values in the URL · an invite record · a link to a business record | decides whether any JS is needed (Step 7) |
| Anonymous or linked | anonymous statistics vs. linked to a case / sale / registration | a linked answer is no longer anonymous — fix the wording on the page |
| Link lifetime | open forever · expires | an expiry needs an invite record (Step 7) |
| CAPTCHA | visible checkbox (classic forms) · invisible (one-click, short forms) | invisible passed silently in every lab run; visible sometimes shows an image challenge |
| After submit | success text · redirect to a thank-you page | the redirect is another public page |
| Follow-up | none · projection onto the business record · task / notification on a bad answer | triggers on the intake table |
| Wording | in every language the page shows | from the process owner, in writing |

## Step 1 — read the tenant

`Get-Site-Pages` (a master-less public page to clone — `apps/mybusiness/PortalLogin` on a vanilla tenant — or an existing root-level public page) · `Get-Schema` of the business table and every lookup · `Get-Table-Permissions` of the same · `Get-Triggers` on the business table.

## Step 2 — the intake table

`Create-Table` + `Add-Field-to-Table`. One column per question, ratings as **Number**, plus as needed:
- a Pointer to the business record (`CaseId`, `SaleId`…) when the answer is linked;
- a Pointer to an invite table when a gate is used (Step 7);
- `Comments` (String) for free text — do not reuse `Name` for it.

Never point a public form at a business table (`Accounts`, `Cases`, `Sales`…).

## Step 3 — permissions

Intake table (`Set-Table-Permissions`, then **`Get-Table-Permissions` to read back** — the success response proves nothing):

```json
{ "table": "<Intake>",
  "classLevelPermissions": {
    "create":  { "role:Admin": true, "role:<staff role>": true, "*": true },
    "find":    { "role:Admin": true, "role:<staff role>": true },
    "get":     { "role:Admin": true, "role:<staff role>": true },
    "update":  { "role:Admin": true, "role:<staff role>": true },
    "delete":  { "role:Admin": true },
    "addField": {} } }
```

`"*"` sits **next to** the staff roles, on `create` only. Use the tenant's real staff roles (`Get-Roles`; read the CLP of `Cases` for the house pattern).

Every lookup used by a dropdown on the form: `find` and `get` must include `"*"` (the options load as the anonymous visitor). Confirm the table holds nothing sensitive — its full content becomes public.

## Step 4 — the page

1. `Create-Table-View-Page(copyFromPageId: <master-less public page>, pageName: "<RootName>", tableName: "<Intake>", title: "…")` — a root-level name (no `apps/…`) gives `https://<tenant-host>/<RootName>`. **Not `Create-Form-Page`**: it clones a page whose master redirects anonymous visitors to the login page.
2. `Get-Page-Settings` on the new page → it must show `loginOnly:false`, `allowedRoles:"any"`, no `masterPageId`.
3. `Set-Page-Settings(title)` — the clone inherits the source's title.
4. `Edit-Page-CSS-JS(cssCode)` — replace the inherited CSS (omit `jsCode` unless you are writing JS).
5. `Get-Page-Versions` — your restore point before structural edits.

## Step 5 — the form skeleton

`Get-Page-Content(minimal:true)` → find the page's main container id (`P185` in a `PortalLogin` clone) → `Edit-Page` `set-html-content` into it with `assets/form-skeleton.html` (replace the placeholders). It writes a heading, the `<form class="dbForm create-simbla-obj" data-simbla-class="<Intake>">`, one empty two-column row, and a final row with the reCAPTCHA element and the Send button.

- `data-simbla-class` is the **only** thing that decides the target table.
- Use a **relative** `data-success-redirect` (`/Thanks`). An absolute URL in the payload has tripped the edge WAF (HTTP 403 HTML page instead of an MCP answer); if a payload is rejected, split it.
- The reCAPTCHA script is injected by the platform when the page contains the word `captcha` — nothing to add.
- The skeleton carries a hidden "link expired" block (`#formClosed`, `display:none`). Keep it only if you add the invite gate (Step 7); otherwise delete it from the markup.

## Step 6 — the fields

- `Edit-Page` `add-new-field` into the skeleton's row (`toExistingRow` + `toExistingColumn`), `add-row` with `newRowAfterRow` for more rows. This produces the editor's own markup for String, Number, Date, Boolean, Pointer (`select.select-pointer`) and Array-of-Pointers (`select.select-pointer[multiple]`). Wait for each `add-row` response — you need its new row id.
- Inputs the tool does not generate — a **radio scale**, a **textarea**, a **hidden** input — : add the field normally, then `set-html-content` on its `.form-group` id with the markup you need. Keep `name=` exactly as in the schema.
- A Boolean added by `add-new-field` shows its caption twice — rewrite its `.form-group` (`myb-p-card-design` rule A9).
- **No `input type=file`** — anonymous uploads fail and reload the page (Traps).
- `required` on the inputs that must be filled; mark the scale required on its first radio.

## Step 7 — rules and the minimum of JS

**Form rules first** (`Get-Form-Rules`, then `Set-Form-Rules` with `formId` = the form's id — it replaces all rules):
- `value-from-url` on any field that should come from the link — the URL parameter must be **named like the field** (`?Rating=5&Email=…`). Works on text, number, date, hidden inputs and on a dropdown whose lookup is public.
- `hidden` for context fields the visitor should not see (a hidden field stays `required` if it was).
- Conditional `required` / `show-message` — conditions on a `select` compare as **strings** (`"value":"1"`); numeric operators only on `input type=number`; **never on a radio group** (silently ignored).

**Page JS only for what rules cannot do** (`Edit-Page-CSS-JS(jsCode)`):

| Need | Template | Notes |
|---|---|---|
| The link expires / the page greets by name / context the visitor should not see or easily change | `assets/invite-gate.js` | a dedicated invite table with `get:"*"` **only** — never `get` on the business table (a public read returns every column) |
| Link the answer to a business record | the `simbla-object-before-save` block in either template | `createWithoutData(id)` — the target table can stay completely closed |
| One click from an email / SMS, no Send button | `assets/one-click.js` | invisible reCAPTCHA; waits for the widget, submits once, guards reloads |

Hide the form in `cssCode` until the gate decides (`#<formId> { display:none; }`), so it never flashes.

**Building the invite gate** (verified end to end on the playground):
1. Invite table: `Create-Table` with only what the page may show — e.g. `FirstName` (String), `VisitDate` (Date), `ExpiresAt` (Date), a Pointer to the business record (`SaleId`). CLP: pattern 12 of `myb-p-users-roles-permissions` (`get` with `"*"`, nothing else public). A public `get` returns **every** column — no phone, no notes.
2. A trigger on the business table creates one invite per qualifying record: `create-object` → the invite table, `SaleId` = `currentObject`, `VisitDate` from the record, `ExpiresAt` = the same date with `timeGap` in minutes (2880 = 48 h).
3. A `create` trigger on the **invite** table sends the message; its link is `https://<tenant-host>/<Page>?invite={{{objectId}}}` — the invite's id, not the record's.
4. The intake table gets `InviteId` (Pointer → invite) and, if the answer must reach the record, `SaleId`; `invite-gate.js` sets both at save time (`RECORD_ON_INVITE`).
5. The expiry check runs in the browser. It keeps honest visitors out of a closed link; it does not stop someone who crafts a save by hand on the page. If late answers must be rejected, add a trigger on the intake that flags rows created after the invite's `ExpiresAt`. WAF signatures to keep out of `jsCode`: the sequence `cls=`, `window.open(`, the regex class `[\/.]`; long code → `Upload-Public-File` + a loader.

## Step 8 — thank-you page, follow-up

- A thank-you page is another clone (Step 4) with a heading only. It receives `?oid=<new id>&cls=<Class>` — harmless while the intake's `get` stays closed.
- Follow-up triggers on the intake table (`myb-p-trigger-setup`): projection onto the business record (`update-object`, `connection:"source.<Pointer>"`), a task or notification on a bad answer. Anonymous creates fire triggers normally; a freshly created trigger may need about a minute before it fires.
- The sending trigger (the one that mails/SMSes the link) follows the outward-facing safety procedure — `../csat/GUIDE.md` Step 6. The link carries `{{{objectId}}}` of the record — or of the invite, when the link is gated (Step 7).

## Step 9 — acceptance

Run `acceptance-tests.md` — 12 tests, 6 of them negative. Report `n/12`.

## Field types (read back after the first real submission)

| HTML | Column | Stored |
|---|---|---|
| `input type=text`, `textarea` | String | text (entity-escaped like every String write) |
| `input type=number` | Number | number; empty → unset |
| `input type=date` | Date | 12:00 local time of that day |
| `input type=checkbox` | Boolean | true / false |
| radio group / plain `select` / hidden input with numeric values | Number | coerced by the server |
| `select.select-pointer` | Pointer | pointer |
| `select.select-pointer[multiple]` | Array (`array_<x>_Pointer_<Table>`) | array of pointer objects |
| pointer set in `simbla-object-before-save` | Pointer | pointer — target may be closed |

## Traps

- **A clone keeps its source's `data-simbla-class`, title and CSS** — a copied public form silently keeps writing to the old table. Rebuild the form (Step 5) when the target changes.
- **The CAPTCHA token lives 2 minutes.** A visitor who ticks, wanders off and then presses Send is rejected; the widget resets and they tick again.
- **File inputs break anonymous submissions** — the upload fails and the page reloads with every answer lost. Non-sensitive attachments → `../web2/GUIDE.md` (File object); identity or other sensitive documents → a portal (`PrivateFile`), never a public URL.
- **A misspelled `name=` loses that answer silently.** Diff the form's field names against `Get-Schema` before go-live.
- **A radio scale cannot drive a rule.** Use a `select` when a rule reads it.
- **Hidden ≠ not required.** A hidden empty required field blocks Send with no visible message.
- **After a save the form resets** (multi-select chips stay drawn though the values are cleared) and the next Send creates a new row. With `.dont-reset` the next Send becomes an update — refused, because `update` is closed. Keep it that way.
- **`createdBy = Public`** on every anonymous row — use it to filter "came from the public form" in reports.
- **No de-duplication.** Opening the link twice can submit twice. If that matters: capture-data (`../capture-data/GUIDE.md`) or a trigger-side check.
- **Opening the business table to make the gate work** (`get:"*"` on `Sales`/`Cases`) exposes every column of every record to whoever holds a link. Use an invite table.
