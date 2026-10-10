---
name: myb-p-public-forms
description: "Build any form an anonymous visitor (no login) submits into a MyBusiness CRM tenant, and pick the right mechanism: a native Database form on a public CRM page writing to an open-create intake table (platform reCAPTCHA built in), the capture-data save mode (table stays closed, server-side dedup), or code for an external website through the web2table / getlead (web2lead) endpoints in JS, PHP, Python, C# or Node. Also builds the post-case satisfaction survey (CSAT, one-click rating from an email or SMS) and diagnoses public forms that fail (code 119, 400/403, answers that never arrive). Use for: public form, survey, feedback after an event, registration or request form without login, landing page or website form to CRM, lead capture, web2table, web2lead, getlead, web2sale, web2case, CSAT, NPS, smiley rating. Hebrew: טופס פומבי, טופס ציבורי, טופס בלי התחברות, סקר, סקר שביעות רצון, משוב, דירוג שירות, טופס רישום, קליטת לידים מטופס, חיבור טופס לאתר, דף נחיתה, טופס חיצוני. Not for logged-in portals."
---

# Public forms — an anonymous visitor writes to the CRM

Everything where someone **without a login** fills something in and it must land in the tenant: a survey, feedback after a visit, a registration or request form, a lead form on the customer's website, a one-click rating in a closing email.

There are **three real ways** to create a record anonymously, plus two neighbours. Each has its own folder in this skill with the full procedure, templates and tests. This file decides which one, and holds the rules that apply to all of them.

| Folder | Mechanism | One line |
|---|---|---|
| [`native-form/`](native-form/GUIDE.md) | **Native Database form** on a public page of the tenant's CRM site, writing to an **open intake table** (`create` open to the public, everything else closed) | The default for any form we host — multi-question, no code for the save, platform reCAPTCHA, no phone needed |
| [`capture-data/`](capture-data/GUIDE.md) | The same Database form with **`data-use-caputure-data`** → a server function saves it | The table stays closed; server-side required fields, duplicate detection and defaults from one `Config` row |
| [`web2/`](web2/GUIDE.md) | **`web2table` / `getlead`** cloud functions over HTTP | The only option for a form that lives **outside** the CRM (customer website, WordPress, another system); matches/creates the Account by phone |
| [`csat/`](csat/GUIDE.md) | **Post-case satisfaction survey** built on the above | One-click rating from the closing email/SMS, projection onto the case, negative rating → work, reports |

The neighbours, deliberately **not** built here: a **portal** (the visitor logs in and sees their own data — KB [`30-customization/13-customer-portals.md`](../myb-p-kb/references/30-customization/13-customer-portals.md)), and the site editor's **email form**, which only mails the fields and creates no record — almost never right in a CRM.

## Step 0 — choose the mechanism

Answer in order; the first match wins.

1. **Must the visitor log in again and again — see their own records, manage a profile, return to a half-done application — or upload sensitive documents (ID, medical, financial)?** → a **portal**, not a public form (identified user, session, `PrivateFile`). A one-off correction from a link we send ("update your address") is *not* this — it is a public form whose answer a trigger projects onto the record (rule 2), see 5.
2. **Does the form live outside the tenant's CRM site** (the customer's own website, Wix/WordPress/Elementor, a partner system, a server)? → **`web2/`**. Only those endpoints accept a call from another origin; the native paths need the platform's own reCAPTCHA, which only a CRM page can render.
3. **Is it a post-case satisfaction survey / rating from a closing message?** → **`csat/`** (it chooses between a native one-click page and the web2table page).
4. **Must the rows land in a table that stays closed** (a table the staff already work in — e.g. lead intake straight into `Accounts`, where a lead is an Account with `IsAccount:false`), or must the server enforce required fields, flag duplicates or apply defaults? → **`capture-data/`**.
5. **Everything else we host** — survey, feedback, registration, request, application, multi-question questionnaire, a one-off "correct your details" link → **`native-form/`** with an open intake table.

**Non-sensitive file attachments** (a photo of a faulty product, a CV): public native forms cannot take files today (`native-form/GUIDE.md` §Traps) — collect them through `web2/` (the page uploads the file first and sends a File object; small page JS) or a portal. Files stored this way sit at a public URL — never use it for documents that identify a person.

### "Open table" or web2table? — the comparison that usually decides it

| | Native form → open intake table | `web2table` |
|---|---|---|
| Where the form can be | a page of the tenant's CRM site | anywhere |
| Bot protection | platform reCAPTCHA, verified by the server — nothing to build | none — the caller brings its own |
| Phone required | no | **yes** (`missing "phone"` without it) |
| Account matching / creation | no (link a record yourself if needed) | automatic, by phone |
| Target table permissions | `create` includes `"*"` — on a **dedicated** intake table only | stays closed (the function writes with the master key) |
| Schema side effects | none | **adds 7 columns** to the target table |
| Code for the save | none | the HTTP call |
| One submission = | one row | one row (+ Account) |
| One-click from an email | yes (invisible reCAPTCHA + auto-submit) | yes (POST on page load) |
| File attachment | not for anonymous visitors today | yes, as a File object uploaded first |
| Row stamped as | `Public` | `Master` |

Rule of thumb: **we host it → native form. Someone else hosts it → web2. It must stay closed or be deduplicated → capture-data.**

## Rules for every method

These are the mistakes that recur across all four folders. Facts and evidence: KB [`30-customization/15-public-forms.md`](../myb-p-kb/references/30-customization/15-public-forms.md).

1. **Read the tenant before you design.** `Get-Site-Pages` (an existing public page to clone?), `Get-Schema` of every table involved, `Get-Table-Permissions` (what is already open?), the `Config` rows the method needs **by name** — `Get-Data(table:"Config", where:{"Name":{"$in":["AcceptWebLeads","AcceptWebToTable","CaptureData<Table>"]}})`, never the whole table (other rows hold provider credentials) — and `Get-Triggers` on the business table (a sender may already exist). Report what exists before proposing to build.
2. **An anonymous visitor never gets a permission on a business table.** On the native path, submissions land in a dedicated **intake** table and a server-side trigger projects what is needed onto the business record (`update-object`, `connection:"source.<Pointer>"`) — also when the visitor "updates" an existing record. The server-side paths (`capture-data`, `web2table`, `getlead`) write with the master key and may target a business table by design (a lead into `Accounts`, a sale) — that is what they are for; the table's permissions still stay closed.
3. **Open the minimum, and only where it is safe.** Native path: `"*"` on `create` of the intake table, next to the staff roles; `"*"` on `find`+`get` of the non-sensitive lookups the form shows; `"*"` on `get` (only) of an invite table if the link is gated. Never `"*"` on `find`/`get`/`update`/`delete` of the intake, and nothing at all on a business table. An open `update` lets anyone holding a row id overwrite it **with no bot check at all**.
4. **Tokenless calls never create anything.** A `POST /parse/classes/...` without the platform reCAPTCHA token is refused even when `create` is open. If you catch yourself "fixing" a public form by widening a CLP, stop and re-read Step 0.
5. **`code 119` has two meanings** — "not allowed without a valid CAPTCHA" and "Permission denied for action …". Read the message.
6. **Every lookup on a public form is a public table.** A dropdown loads its options as the anonymous visitor, so its whole content becomes readable. Only non-sensitive lookups (categories, regions); never users, accounts, cases. If the visitor must pick a person (an employee, a branch manager), give the form its own lookup table holding display names only, kept in sync by a trigger on the source table — or a plain `select` with fixed values.
7. **Field names must match the schema exactly.** An unknown name is silently dropped — the submission succeeds and the answer is gone. Compare the form's `name=` attributes with `Get-Schema` before going live.
8. **Ratings and scores are Number fields**, never String — reports cannot average text.
9. **Anything that sends a link to real people is outward-facing.** Build the sending trigger `active:false`, divert every mail/SMS action to an internal address for the test window, disable it in a `finally` and verify with `Get-Triggers` (full procedure: `csat/GUIDE.md` Step 6, `myb-p-trigger-setup`).
10. **Prove it from the outside.** A logged-out browser (private window / isolated context) for the positive path, a tokenless `curl` for the negative ones, and a read-back of every row you created. Report `n/N` tests honestly.

## Diagnosing a public form that does not work

| Symptom | Likely cause | Fix |
|---|---|---|
| `code 119` "…without a valid CAPTCHA" on a native form | no reCAPTCHA element in the form; or the page submitted before the widget rendered; or the visitor ticked more than 2 minutes before Send | add the element (`native-form/` Step 5); wait for `$(form).data('captcha')` before a programmatic submit; tick again |
| `code 119` "Permission denied for action create" | the intake's `create` does not include `"*"` | `native-form/` Step 3, read back with `Get-Table-Permissions` |
| `code 119` "…without a valid CAPTCHA" from `curl` / server code | tokenless calls are always refused — by design | use `web2/` for server-side or external callers |
| A dropdown is empty for logged-out visitors | the lookup's `find`/`get` are not public | open them (only for non-sensitive lookups) |
| capture-data: "using invalid captcha keys" | visible reCAPTCHA widget | switch to the invisible widget |
| capture-data: "missing config for table X" | no `Config` row `CaptureData<X>` | `capture-data/` Step 1 |
| web2: `missing "phone"` / `… is Disabled` (HTTP 400) | phone not sent / `Config` flag off | `web2/` Pre-setup |
| Saved, but an answer is missing | the field's `name=` is not a column — dropped silently | diff the form against `Get-Schema` |
| The page reloads on Send and everything is gone | a file input on an anonymous native form | remove it (§Step 0, attachments) |
| A rule never fires | the condition reads a radio group, or compares a number to a string | `native-form/` Step 7 |
| Rating saved but not on the record | projection trigger missing / just created (allow ~1 min) / pointer field empty | `csat/` Step 7, `_syslogTriggers` |

## Knowledge sources

- `../myb-p-kb/references/30-customization/15-public-forms.md` — **the fact source**: the security model (gate order, 119, token lifetime, reads, updates, defaults), the native form (page via MCP, markup, reCAPTCHA variants, field types, form-rule behaviour, file-upload constraint, one-click), capture-data (`Config` grammar), the email form, a fit summary.
- `../myb-p-kb/references/40-integrations-api/03-web2lead-web2table.md` — the `web2table` / `getlead` contract.
- `../myb-p-kb/references/30-customization/07-form-rules.md` — rule grammar (`value-from-url`, `hidden`, conditional `required`).
- `../myb-p-kb/references/30-customization/08-users-roles-permissions.md` — CLP grammar and the public patterns.
- `../myb-p-kb/references/30-customization/06-triggers-and-automations.md` — projection / follow-up triggers.
- `../myb-p-kb/references/30-customization/12-solution-blueprints.md` — blueprints 12 (CSAT) and 13 (public multi-question form), for scoping.
- `../myb-p-kb/references/30-customization/13-customer-portals.md` — when the visitor must be identified.

## Related skills

`myb-p-trigger-setup` (projection, notification and sending triggers) · `myb-p-form-rules` (rule grammar) · `myb-p-users-roles-permissions` (CLP) · `myb-p-create-update-reports` (reporting the answers) · `myb-p-multi-select-field` (multi-pick lookups) · `myb-p-card-design` (showing the answer on the staff card).
