# Public Forms — anonymous visitors writing to the CRM

> **Purpose:** The fact source for every way an **unauthenticated visitor** (no login, no session) can put data into a MyBusiness tenant — survey, feedback, registration, request, lead form, one-click rating. Covers the security model that decides which path is possible, the native Database form on a public site page (the "open intake table"), the `simbla-capture-data` save mode, how these compare with `web2table` / `getlead`, the email-only form, and the anonymous-update path. Procedure lives in the `myb-p-public-forms` skill; this file holds the facts it points at.
> **Sources:** live lab on a test tenant (2026-10-09, scratch tables and root-level public pages — every claim marked *measured* was exercised end-to-end from an anonymous browser context or a tokenless HTTP call); the platform's server write pipeline (CAPTCHA validation order, type coercion, per-function captcha and master-key handling), the `simbla-capture-data` and lead-intake server functions, the site renderer (reCAPTCHA script injection, email form), and the live page runtime (`simbla.js`: form save, reCAPTCHA rendering, form rules, file upload); the field write-up of a production public feedback form (several hundred anonymous submissions).
> **Last updated:** 2026-10-09 (created — replaces the "web2table is the only anonymous door" model of [../40-integrations-api/03-web2lead-web2table.md](../40-integrations-api/03-web2lead-web2table.md) §11) · **Status:** verified (live lab)

---

## 1. The mechanisms at a glance

| # | Mechanism | Where the form lives | How the row is written | Bot gate | Target table CLP | Row stamped as |
|---|---|---|---|---|---|---|
| A | **Native Database form** on a public site page — "open intake table" | a page of the tenant's own CRM site | `createSimblaObj` → `obj.save()` as the anonymous visitor | platform reCAPTCHA (visible or invisible), verified server-side | `create` must include `"*"` | `createdBy = updatedBy = _User "Public"` |
| B | **Database form + `data-use-caputure-data="true"`** | same | `Simbla.Cloud.run('run_function',{functionName:'simbla-capture-data',…})` → server function saves **with the master key** | **invisible** reCAPTCHA only (visible fails) | anything — stays closed | `Master` |
| C | **`web2table` / `getlead`** cloud functions | anywhere — external site, landing page, server | HTTP POST → server function (master key) — [40/03](../40-integrations-api/03-web2lead-web2table.md) | none built in (bring your own) | anything — stays closed | `Master` |
| D | **Email form** (`simblaFormSubmit`) | a CRM site page | `$.post('/')` → the site server **mails** the fields; no record is created | reCAPTCHA only when the form is flagged | n/a | n/a |
| E | **Portal** (identified visitor, OTP / password) | CRM site pages behind login | regular authenticated writes | session | role + ACL | the portal user — [13-customer-portals.md](13-customer-portals.md) |
| F | **Anonymous update by id** | a CRM site page (or any HTTP client) | `PUT` on an existing row | **none** — updates are not CAPTCHA-gated | `update` must include `"*"` | `updatedBy = Public` |

A, B and C are the three real "anonymous create" paths; F exists but is a deliberate exposure (§2.4). Choosing between them is procedure — see the skill's decision table; the facts that drive the choice follow.

## 2. The anonymous-write security model (*measured* 2026-10-09)

### 2.1 Order of checks on every write

The server's write pipeline runs **`validateCaptcha` first**, then `getUserAndRoleACL`, then the CLP / schema checks . `validateCaptcha` returns immediately when the request carries a session user, uses the master key, **or is an update** (`this.query` set); otherwise it reads the token from the field `g-recaptcha-response` or `grecaptchainvisible` on the object, deletes the field, and verifies it with Google . Verification requires `success:true` **and a challenge younger than 120 seconds**.

Consequences, each measured with a tokenless `curl` (App ID header only):

| Probe | Result |
|---|---|
| `POST /parse/classes/<T>` on a table with `create:{"*":true}`, no token | `{"code":119,"error":"This action is not allowed without a valid CAPTCHA"}` |
| same with a fake `g-recaptcha-response` / `grecaptchainvisible` | same 119 |
| `POST` on a table whose `create` is Admin-only, no token | **the CAPTCHA message**, not "permission denied" — the gate runs before the CLP |
| native form **without** a reCAPTCHA element, `create:"*"` | the form shows "This action is not allowed without a valid CAPTCHA" |
| native form **with** the element, ticked, `create:"*"` | row created, `createdBy = Public` |

- **`code 119` is Parse's generic `OPERATION_FORBIDDEN`** — it is returned for the CAPTCHA gate *and* for CLP denials ("Permission denied for action find on class X"). Diagnose by the message, never by the code.
- A visitor who ticks the box and waits more than **2 minutes** before pressing Send is rejected; the form resets the widget (`grecaptcha.reset`) and shows the error.
- Opening `create:"*"` on a table does **not** make tokenless REST calls work — the gate stops them. What `create:"*"` does is let a request that *carries a valid platform token* through the CLP. That is the whole mechanism of path A.

### 2.2 Who carries a valid token

Only pages that render the **platform's** reCAPTCHA (site keys belong to the platform, verified with the platform's secrets). A page outside the tenant's CRM site cannot obtain one, so path A and B are for CRM-hosted pages only; an external site uses path C.

### 2.3 Reads

- `get:{"*":true}` **without** `find` = anonymous read **by objectId only**; ids cannot be listed. A `find` whose `where` is only `{objectId: "<id>"}` is treated as a `get` and also succeeds — still id-only.
- The read returns **every column** of the row. `protectedFields` cannot be set through MCP (`Set-Table-Permissions` silently drops the key; the read-back shows it gone, the column is still served). → A table opened for public `get` must contain nothing sensitive. Use a dedicated "invite" table, not the business table.
- A `select-pointer` on a public form loads its options with an anonymous `find` on the target table → that table needs `find`+`get` `"*"`, and **its whole content is public**.

### 2.4 Updates — not CAPTCHA-gated (F)

Because the gate is skipped for updates, an anonymous `PUT /parse/classes/<T>/<id>` is decided by CLP (and row ACL) alone. *Measured:* with `update:{…,"*":true}` a tokenless `PUT` returned 200 and wrote the row (`updatedBy = Public`); a non-existent id returned `101 Object not found`. Default CLPs keep `update` closed, so this path exists only if someone opens it. It means: **anyone who holds a row's objectId can overwrite any field of it, with no bot check.** The earlier documentation line "there is no anonymous update path" was wrong in principle; the safe practical rule (never open `update` to `"*"` on a business table) stands.

### 2.5 Schema and CLP defaults

- `Create-Table` creates a class with `find/get: requiresAuthentication`, `create/update/delete: role:Admin` and **no `addField` key** — not "deny-all".
- `Set-Table-Permissions` always writes `addField: {}` (the tool schema allows only the empty object).
- With `addField:{}` an unknown field name in an anonymous payload is **silently dropped** — 200, no column, no value. A misspelled `name=` attribute on a public form therefore loses that answer without any error.
- `"*"` **alongside** the staff roles on `create` (`{"role:Admin":true,"role:CRM":true,"*":true}`) keeps the staff screens working; the CRM-UI trouble documented for `"*"` concerns `"*"` *instead of* roles.

### 2.6 Server-side functions

Every server function is invoked with the tenant's master key in its body, so anything a function writes ignores CLP. Each function record carries `loginOnly` and `requireCaptcha`; for an anonymous caller with `requireCaptcha` the token is verified **with the invisible-key secret**. Measured: `simbla-capture-data` requires a token (`"missing captcha"` without one); `web2table` and `getlead` do not.

### 2.7 Triggers

Anonymous creates fire data-change triggers like any other write (*measured:* a `create` trigger on the intake table projected the rating onto a record in an Admin-only table via `update-object` + `connection:"source.<Pointer>"`). Server-side triggers are therefore the way to touch closed business tables after a public submission.

## 3. Path A — native Database form on a public page

### 3.1 The page

| Property | Value | Why |
|---|---|---|
| Name | at the site **root** (`Feedback`, not `apps/mybusiness/Feedback`) | clean URL `https://<tenant-host>/<Page>`; no CRM page conventions |
| Master page | **none** | a master such as `NewMaster` redirects anonymous visitors to login (302) |
| `loginOnly` / `allowedRoles` | `false` / `"any"` | public |
| reCAPTCHA script | injected by the renderer whenever the page HTML **or** page JS contains the substring `captcha` | nothing to add by hand |

**Building it through MCP (*measured*):**
- `Create-Form-Page` is **not** usable: it clones `apps/mybusiness/NewPage`, whose master `NewMaster` 302-redirects anonymous visitors to the login page wherever the clone is named.
- `Create-Table-View-Page(copyFromPageId=<a master-less public page>, pageName:"<RootName>")` produces a verbatim, master-less, public clone. On a vanilla tenant the source is `apps/mybusiness/PortalLogin` (no master, no jsFile/cssFile, `loginOnly:false`). The clone inherits the source's `<title>` ("PortalLogin") and its `cssCode` — overwrite both (`Set-Page-Settings(title)` applies immediately; `Edit-Page-CSS-JS(cssCode)`). It also inherits the source's app flag, so the CRM app script loads; it does not interfere with anonymous use.
- `Edit-Page` → `set-html-content` on the page container (`P185` in the `PortalLogin` clone) **replaces its inner HTML, including a complete `<form class="dbForm">`** — the form element survives intact (unlike a form inherited from a master, which `set-html-content` cannot address — [03-pages-and-layouts.md](03-pages-and-layouts.md) §2a).
- Inside that form, `add-row` and `add-new-field` generate the editor's markup for every schema type (text, number, date, checkbox, `select.select-pointer[targetclass]`, `select.select-pointer[multiple]` for `array_*_Pointer_*`). Inputs the tool cannot generate — a radio scale, a file input, a textarea — are made by `set-html-content` on the field's `.form-group` id.
- The edge WAF rejected one `set-html-content` payload that carried an **absolute URL** in `data-success-redirect`; the same markup with a relative path (`/Thanks`) and split into smaller payloads passed. Keep payloads small; prefer relative paths.
- The site editor's "Database form" element + reCAPTCHA element produces the same structure (production public forms are often built that way); the MCP path above needs no UI.

### 3.2 Form attributes

| Attribute | Meaning |
|---|---|
| `class="dbForm create-simbla-obj"` (current) or `onsubmit="return createSimblaObj(this)"` (legacy) | wires the form to `createSimblaObj`; both work |
| `data-simbla-class` | **the only thing that decides the target table** — not `name`, not the URL. A cloned page keeps the source's value |
| `data-success` / `data-failure` | text appended on success / appended to the error |
| `data-success-redirect` | after save, navigate to the URL + `?oid=<newId>&cls=<Class>`; relative paths work |
| `data-use-caputure-data` (misspelled on purpose) | `true` switches the save to path B (§4) |
| `data-rules` | form rules (§3.6), written by `Set-Form-Rules` |

### 3.3 reCAPTCHA variants

| Variant | Markup inside the form | Behaviour |
|---|---|---|
| Visible (checkbox) | `<div class="simblaRecaptcha"><div class="captcha"></div></div>` | visitor ticks; token rides as `g-recaptcha-response`. In the lab Google served an image challenge on 1 of 3 automated ticks |
| Invisible | `<div class="g-recaptcha-invisible"></div>` | on submit the form calls `grecaptcha.execute()` and re-submits itself when the token arrives; token rides as `grecaptchainvisible`. Passed silently on 6 of 6 lab submissions (a flagged visitor may still get a challenge) |

`onloadRecaptcha()` renders every widget after the script loads and stores its id on the form (`$(form).data('captcha')`). Code that submits programmatically must wait until that id exists, or the save goes out without a token.

### 3.4 Field types (*measured* read-back)

| HTML | Stored as |
|---|---|
| `input type=text` / `textarea` | String |
| `input type=number` | Number (empty → unset) |
| `input type=date` | Date at 12:00 local (`2026-10-09` → `09:00Z`) |
| `input type=checkbox` | Boolean |
| `input type=radio` / plain `select` / `input type=hidden` with a numeric value → Number column | Number — the client sends a string, the server coerces String→Number (and Number→String) for the column's declared type |
| `select.select-pointer[targetclass]` | Pointer |
| `select.select-pointer[multiple]` on an `array_*_Pointer_*` field | array of **Pointer objects** (renders as chips in the CRM) |
| `input type=file` | **fails for an anonymous visitor** — §3.9 |
| a pointer set in `simbla-object-before-save` with `Simbla.Object.extend(<Class>).createWithoutData(<id>)` | Pointer — accepted even when the target table is closed to the public (no read of the target happens) |

### 3.5 What the page can know without code

`value-from-url` (§3.6) fills any field from a query parameter of the same name — text, number, date, hidden input, and a `select-pointer` whose lookup table is public. A link such as `/<Page>?Rating=5&Email=a@b.c` prefills without JS.

### 3.6 Form rules on a public page

Rules run for anonymous visitors exactly as on staff pages ([07-form-rules.md](07-form-rules.md)). Facts that matter on public forms (*measured*):
- `value-from-url` uses the URL parameter **named like the field** (or its lowercase form); the rule's `value` is ignored. It sets `.val()` without a change event.
- **A radio group can never be a rule condition** — the evaluator requires exactly one element with the field's name and silently skips the condition otherwise. A rating that drives a rule must be a `select` or `input type=number`.
- On a plain `select` / text field only `equalTo` / `notEqualTo` work, as **strict string** comparison — pass rule values as strings (`"1"`, not `1`). Numeric operators (`lessThan`, `greaterThan`…) work on `input type=number` only.
- `show-message` opens the platform modal (`showAlert`), not an inline hint.
- `hidden` hides the `.form-group` but leaves `required` in force — a required hidden empty field blocks submission with no visible message.

### 3.7 Page JS that the native path still needs (and nothing more)

- **A context gate** — read one record to decide whether to show the form (expiry, prefill). Use a dedicated table with `get:"*"` only (an "invite"); never open `get` on the business table. *Measured:* `?invite=<id>` → `new Simbla.Query('<Invite>').get(id)` → expired / missing / no id → the form stays hidden and a "link expired" block shows.
- **Linking the answer to a record** — set the pointer in `simbla-object-before-save`. The target may be completely closed (e.g. `Cases`); nothing is read.
- **Auto-submit for one-click** — §3.10.
- WAF signatures to avoid in page JS: the byte sequence `cls=`, `window.open(`, the regex class `[\/.]`; large code → `Upload-Public-File` + a loader.

### 3.8 After the save

- Success: the form appends the `data-success` text, calls `form.reset()` (select2 multi-select chips stay visible although the values were saved and cleared), and resets the reCAPTCHA. A second submit therefore creates a **new** row and needs a new token. With `.dont-reset` the saved object stays on the form and a second submit becomes an **update** — refused unless `update` is open (§2.4).
- Redirect (if set) lands on `<redirect>?oid=<newId>&cls=<Class>`; the thank-you page is another public page. The `oid` is harmless while the intake table's `get` stays closed.

### 3.9 File inputs do not work for anonymous visitors (*measured*)

For a visitor with no session the SDK's file upload sends the header `X-Parse-Session-Token: undefined` (a literal string); the server answers `209 invalid session token`, and the runtime then **reloads the page — everything the visitor typed is lost**. The same upload without that header (tokenless REST `POST /parse/files/<name>`) succeeds (201), so the server accepts anonymous files; the defect is client-side. Until it is fixed: no `input type=file` on a public native form. `web2table` can attach a file that was uploaded separately ([40/03](../40-integrations-api/03-web2lead-web2table.md)).

### 3.10 One-click over the native path (*measured*)

Hidden `Rating` input + `value-from-url` rule + invisible reCAPTCHA + a page script that waits for `$(form).data('captcha')` and then triggers `submit` → the link `/<Page>?Rating=5&c=<recordId>` records the rating with **zero clicks**; `simbla-object-before-save` sets the pointer to the closed business record; a projection trigger copies the rating onto it. No phone number in the URL, no Config flag, no injected columns. Caveats: a visitor Google flags gets a challenge before the save; a reload submits again unless the page guards it (sessionStorage).

## 4. Path B — `simbla-capture-data`

Turned on per form with `data-use-caputure-data="true"`. Instead of `obj.save()` the form calls `run_function` → `simbla-capture-data` with `{dataTable: <data-simbla-class>, captcha: <token>, …fields}`; the function saves with the master key and returns the full new object, which replaces the form's object (re-read `data.obj` in `simbla-object-saved` — new id, possibly a different class).

**Gate:** `requireCaptcha` with the **invisible** secret → only the invisible widget works. *Measured:* visible widget → "using invalid captcha keys"; no token → "missing captcha"; invisible → saved.

**Configuration — one `Config` row per target table** (MCP `Create-Data` on `Config` works):

| `Config.Name` | `Config.Value` (Object) |
|---|---|
| `CaptureData<Table>` (e.g. `CaptureDataLeadsIntake`) | `{ requiredFields:[…], checkForDuplicateFields:[…], setOnDuplicate:{field, value}, duplicatePointerField:"…", defaultValues:[{field, value}] }` — every key optional |

| Key | Behaviour (*measured*) |
|---|---|
| no row for the table | `"missing config for table <T>"` — the function refuses tables without a row (except `Leads`, which has a built-in default) |
| `requiredFields` | missing field → `"Missing <Field>"`, nothing saved |
| `checkForDuplicateFields` | finds an existing row in the **same table** by exact value; `PhoneNumber` is matched by its digits regardless of formatting (`050-111-2222` = `0501112222`) |
| `setOnDuplicate` | on a duplicate, sets `{field: value}` on the **new** row (it still inserts) |
| `duplicatePointerField` | on a duplicate, points the new row at the existing one |
| `defaultValues` | applied only when the submission did not carry the field |

Empty strings are dropped before save; rows are stamped `createdBy = Master` (filter public submissions by a default such as `Source`, not by `createdBy`). It never updates.

## 5. Path C — `web2table` / `getlead`

Full contract in [../40-integrations-api/03-web2lead-web2table.md](../40-integrations-api/03-web2lead-web2table.md). Compared with A/B: callable from **any origin**, no bot gate, `web2table` requires `phone` and auto-matches/creates an Account, injects 7 columns into the target table, and always inserts.

## 6. Path D — the email form

`simblaFormSubmit` posts the fields to the site server, which mails them to an address stored in the site's key-value store (set by the site editor; not reachable from MCP) and creates **no CRM record**. It refuses sites on a free plan and checks reCAPTCHA only when the form is flagged by the editor (token valid 10 minutes there). (Read in code; not exercised in the lab.) For a CRM it is almost never the right choice — a record plus a notification trigger does the same and keeps the data.

## 7. Fit summary (for fit-gap)

| Need | Classification | Path |
|---|---|---|
| Multi-question survey / feedback / request form on a link we send | **Native** (S) | A |
| Form on the customer's own website or another system | **Native** (S) | C |
| Lead form on a CRM page with server-side dedup / required fields, table kept closed | **Config** (S) | B |
| One-click rating from an email / SMS | **Native** (S–M) | A one-click, or C |
| Public form that "updates" an existing record | **Config** (M) — intake row + projection trigger | A/B/C + trigger |
| Public link that lets the visitor reopen and edit their own submission | **Config** with exposure (§2.4) or portal | F or E |
| Public form with a file attachment | **Gap** for A (§3.9) / **Custom-JS** for C | C |

## Limitations & gotchas

1. **Tokenless REST is always refused for creates** — the gate is a CAPTCHA, not a closed door; only CRM-site pages with the platform widget carry tokens (§2.1–2.2).
2. **`code 119` means two different things** — read the message (§2.1).
3. **A token lives 120 s** — slow visitors are rejected after ticking (§2.1).
4. **Updates are not CAPTCHA-gated** — never open `update` to `"*"` on anything that matters (§2.4).
5. **A public `get` serves every column**; `protectedFields` is not settable via MCP (§2.3).
6. **Public lookups are fully public** (§2.3).
7. **Misspelled field names are dropped silently** (§2.5).
8. **`Create-Form-Page` cannot make a public page**; clone a master-less page (§3.1).
9. **Cloning keeps `data-simbla-class`, title and CSS of the source** (§3.1–3.2).
10. **Radio groups cannot drive form rules**; selects compare as strings (§3.6).
11. **No file inputs on anonymous native forms** — upload fails and the page reloads (§3.9).
12. **capture-data needs the invisible widget and a `Config` row per table** (§4).
13. **capture-data / web2table rows are stamped `Master`**, native rows `Public` (§2, §4).
