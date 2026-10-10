# CSAT — post-case satisfaction survey

Part of `myb-p-public-forms`. Builds the loop: a case closes → the customer gets a mail (or SMS) with one link per rating → **one click records the answer** → a projection trigger puts it on the case → a bad rating creates work → the score reaches a report.

Works on any business object with a closing event and a reachable contact — `Cases` is the common one; `Sales`, `Tasks` or a custom entity work identically. This guide says "case"; substitute your object. Also use it to **diagnose** an existing survey nobody answers or a rating that never reaches the record.

## The one rule that decides whether this survives

**The rating must be captured by the click in the message.** Not by a form the recipient lands on and submits. Every extra action collapses the response rate, and a survey nobody answers is worse than no survey — it produces a dashboard that lies. The comment box is a bonus offered *after* the thank-you screen, never a precondition.

The second rule is organizational and gets skipped constantly: **a negative rating must create work, and the score must enter a report someone already opens.** Without both you have built a metric, not a process.

## The architecture — two variants of the same four layers

The responder is anonymous, and an anonymous visitor never writes to the case (`../SKILL.md` rule 2). So both variants share the shape:

```
message · one link per rating          →  carries the case id + the rating
public page                            →  records the rating ON LOAD into an INTAKE row (one click, nothing to press)
projection trigger (intake, create)    →  copies rating / comment / date onto the CASE
response trigger (intake, create)      →  negative rating → task or notification to the owner
```

They differ only in how the public page writes the intake row:

| | **Native variant** (default for new builds) | **web2table variant** |
|---|---|---|
| Link | `…/<page>?<RatingField>=<n>&c={{{objectId}}}` | `…/<page>?c={{{objectId}}}&p={{{PhoneNumber}}}&r=<n>` |
| Personal data in the URL | none | the customer's phone |
| How the row is written | native Database form, invisible reCAPTCHA, auto-submitted (`assets/survey-page-native.js`) | `web2table` POST on load (`assets/survey-page-web2table.js`) |
| Intake CLP | `create` = staff roles + `"*"`, nothing else public | stays closed |
| Config flag | none | `AcceptWebToTable` |
| Schema side effects | none | 7 columns injected into the intake table |
| Risk | a visitor Google flags sees a CAPTCHA challenge before the answer is saved | none on the visitor side |
| Verified | live end to end 2026-10-09 (KB `30-customization/15-public-forms.md` §3.10) | production build 2026-08 |

**Choose native** unless the customer already runs the web2table version (keep it — do not rebuild a working survey) or must have zero visitor-side dependency. Both variants record the comment as a **second** intake row, because the intake stays create-only.

**Why project onto the case instead of reporting off the intake table:** once the rating sits on the business object, every existing report works immediately — per agent, per product, per period. The intake table stays the raw journal.

## Step 0 — close the decisions before you build

| Decision | Why it matters |
|---|---|
| **Which closing statuses justify a survey?** | The trap. "Closed — no answer" and "transferred to another department" are closing statuses that must **not** send. Ask for the list; never assume "all closed". |
| **How many levels?** | 3 (good / ok / bad) gives a usable distribution; 2 is sharper. More than one question lowers the response rate — say so out loud. |
| **The exact wording** in each level and in the message | Customer-facing Hebrew, from the process owner in writing. |
| **Timing** — immediately on close, or delayed | A scheduled trigger can delay it; immediate is the default. |
| **A cap per customer?** | Without one, a heavy customer gets surveyed on every case. |
| **What happens on a negative rating** — task or notification | A task enters a work queue, a notification does not. Pick deliberately. |
| **Variant** — native or web2table | Table above. If web2table: the phone in the URL is a privacy decision for the customer, not for you. |
| **Channel** — email, SMS, WhatsApp | The same link works in any of them; the native link carries no personal data, which makes SMS easier to approve. |

## Step 1 — read the tenant before writing anything

1. `Get-Schema(<business table>)` — the pointer to the contact, the owner field, the status field, a phone mirror if any.
2. `Get-Data(<statuses table>)` — the closing statuses and their objectIds, to ask Step 0's first question with real names.
3. `Get-Schema("SatisfactionSurveys")` — **may already exist**; it is the product's documented intake shape (`../../myb-p-kb/references/20-data-model/03-module-tables.md`). Reuse it.
4. `Get-Triggers(<business table>)` — a closing-mail trigger often already exists, sometimes disabled, sometimes sending on the wrong statuses. Fix it rather than adding a second sender.
5. `Get-Site-Pages` — an existing survey page (which variant?) or a master-less public page to clone.
6. `Get-Table-Permissions("SatisfactionSurveys")` — what is already open.
7. Email templates — is there a "case closed" template whose CTA points at a placeholder that resolves to nothing?

Report what exists before proposing to build. In most service tenants over half of this is already in place.

## Step 2 — intake table

Use `SatisfactionSurveys` if present. Otherwise `Create-Table` + `Add-Field-to-Table`:

| Field | Type | Why |
|---|---|---|
| `CaseId` | Pointer → business table | the record being rated |
| `OverallRating` | **Number** | **not String** — a report cannot average text |
| `AdditionalComments` | String | the free word, when written |
| `RespondedAt` | Date | response timing |
| `AccountId`, `OwnerId` | Pointers | only if reports slice the intake table directly; the projection makes them optional |

**Permissions** (`Set-Table-Permissions`, read back with `Get-Table-Permissions`):
- **Native:** `create` = staff roles + `"*"`; `find`/`get`/`update` staff; `delete` Admin; `addField: {}` (template: `../native-form/GUIDE.md` Step 3).
- **web2table:** leave it staff-only — the function writes regardless. A table made by `Create-Table` already is (`find/get` require login, writes Admin-only).

## Step 3 — fields on the business object

`CsatRating` (Number), `CsatComment` (String), `CsatAt` (Date), plus a read-only section on the card (`myb-p-card-design`). Add `CsatSentAt` (Date) if response rate matters — it is the denominator, it is stamped by the send trigger (Step 6), and it **cannot be backfilled**.

## Step 4 — the public page

**Native variant.** Build the page as `../native-form/GUIDE.md` Steps 4–5 (clone a master-less public page to a root name; `set-html-content` into its container), with this content instead of the generic skeleton:
- `<p id="csatStatus"></p>`;
- `form#csatRate` — `class="dbForm create-simbla-obj"`, `data-simbla-class="<Intake>"`, `data-success=""`, containing `<input type="hidden" name="<RatingField>">` and `<div class="g-recaptcha-invisible"></div>`;
- `form#csatComment` — same attributes, containing the comment `textarea` (`name="<CommentField>"`), its own `<div class="g-recaptcha-invisible"></div>` and a Send button.

Then: `Set-Form-Rules(formId:"csatRate")` with one `value-from-url` action on `<RatingField>`; `cssCode` `#csatComment { display:none; }`; `jsCode` = `assets/survey-page-native.js` with its four constants and the approved wording. The script waits for the reCAPTCHA, submits the rating once, links the row to the case, offers the comment, and refuses to submit twice on reload.

**web2table variant.** Enable the `Config` flag `AcceptWebToTable` (`../web2/GUIDE.md` Pre-setup). Clone a public page, give it an empty container `<div id="csat-root"></div>` (without it the script renders into `<body>` and replaces the whole page), attach `assets/survey-page-web2table.js` (replace its placeholders). It posts to `web2table` on load, shows the thank-you, offers the comment, and strips the phone from the address bar.

Either way: ⚠ if saving page JS returns an HTML 403, the edge WAF rejected the payload — move the script to `Upload-Public-File` + a two-line loader rather than fighting the filter.

## Step 5 — the message

`assets/email-faces.html` is the three-face block, table-based for mail clients; it replaces the CTA of the closing template. Its `href`s carry the **native** link by default; the web2table link is in its header comment.

The link contract, which placeholders actually resolve, and how to verify a rendered mail **without sending to anyone** are in `url-contract.md`. A template that renders `{{{SomePlaceholder}}}` literally is the most common failure here, and the three faces must differ by **glyph**, not only colour.

## Step 6 — the send trigger  ⚠ outward-facing

`Set-Trigger` on the business table, `type:"data change"`, `events:["update"]`, `onSetFields:["<status field>"]`, `criterias` = **only** the statuses agreed in Step 0, `oneachupdate:false` + an email (or SMS) action. If response rate matters, a second `update-object` action stamps `CsatSentAt` (`reports.md` §R6).

**Safety procedure — this trigger messages real customers.** Follow it exactly:
- Build it `active:false`. Enable only for a controlled window, against test records whose contact is internal.
- **Divert every mail/SMS action, not just one.** A real person once received a test mail because one of two actions was left pointing at production.
- Disable it in a `finally` and **verify the disable** with `Get-Triggers`.
- Leave it off until the process owner has approved the copy.
- Before enabling for real, check the contact table for placeholder addresses — those are live mailboxes.

`oneachupdate:false` also means a reopened-and-closed case produces **no second survey**. Usually right; one survey per closure needs `true` plus a cap.

## Step 7 — projection trigger

On the **intake** table, `type:"data change"`, `events:["create"]`, `onSetFields:["<RatingField>"]`, `criterias` `CaseId exists`, then `Set-Trigger-Action` `update-object`:

```json
{ "targetClass": "<business table>",
  "connection": "source.CaseId",
  "fieldsValue": [
    { "field": "CsatRating",  "type": "dynamic", "value": "OverallRating" },
    { "field": "CsatComment", "type": "dynamic", "value": "AdditionalComments" },
    { "field": "CsatAt",      "type": "dynamic", "value": "updatedAt" }
  ]}
```

A dynamic value that is empty on the source row is skipped, so the rating row does not blank an earlier comment and the comment row (rating repeated) fills `CsatComment`. A freshly created trigger can take about a minute before it fires. Grammar: `myb-p-trigger-setup`.

## Step 8 — the response trigger (the half that makes it a process)

On the intake table (`type:"data change"`, `events:["create"]`), `criterias` `OverallRating lessThanOrEqualTo <negative threshold>` (`T:"Number"`) → `create-object` (a task for the process owner, linked to the case) or `notification`, per Step 0.

**The ordering trap.** The rating and the comment arrive as **two rows**, seconds apart. A trigger on the rating runs **before** the comment exists, so a task whose description embeds the comment is born empty. Point the reader at the record instead. The comment row repeats the rating — scope the trigger so it does not fire twice (`AdditionalComments doesNotExist`).

## Step 9 — reports

`reports.md` carries six specs — detail · average per agent · trend by month × agent · rating distribution · negative-rating queue · response rate. Build the first two, show them, let the owner's reaction shape the rest. Always ship the **response count** next to the average.

## Step 10 — acceptance

Run `acceptance-tests.md` — 11 tests, five negative. Report `n/11`, naming the ones you could not run.

## Traps that cost an hour each

- **Two rows per response** is correct and intended. Write it down or someone "fixes" it.
- **Native variant: submitting before the reCAPTCHA renders** sends no token and the save is refused — the shipped script waits; hand-written code must too.
- **Native variant: a radio scale on the page** — the link fills a hidden field; there is nothing to click and nothing for a rule to read. Keep it hidden.
- **You cannot change a trigger action's type in place.** `Set-Trigger-Action` reports success and leaves the old action. Build a clean trigger and disable the old one.
- **A rating stored as String** kills averaging.
- **`Number` criteria need `T:"Number"`** — a stringified value never matches.
- **A closing status that means "we failed to reach them"** will happily send a survey unless excluded.

## Knowledge sources

- `../../myb-p-kb/references/30-customization/15-public-forms.md` — the anonymous-write model, the native form, one-click (§3.10).
- `../../myb-p-kb/references/40-integrations-api/03-web2lead-web2table.md` — the `web2table` contract (web2table variant).
- `../../myb-p-kb/references/20-data-model/03-module-tables.md` — the `SatisfactionSurveys` shape.
- `../../myb-p-kb/references/30-customization/12-solution-blueprints.md` — blueprint 12 (this pattern, for scoping).
- `../../myb-p-kb/references/30-customization/06-triggers-and-automations.md` — trigger semantics, `_syslogTriggers`.
- `../../myb-p-kb/references/30-customization/05-dashboards-and-reports.md` + `myb-p-create-update-reports` — the report grammar behind `reports.md`.
- MCP tools: `Get-Schema`, `Get-Data`, `Get-Triggers`, `Get-Table-Permissions`, `Set-Table-Permissions`, `Get-Site-Pages`, `Create-Table`, `Add-Field-to-Table`, `Create-Table-View-Page`, `Edit-Page`, `Edit-Page-CSS-JS`, `Set-Form-Rules`, `Upload-Public-File`, `Set-Trigger`, `Set-Trigger-Action`, `Create-or-Update-Report`, `Update-Data`.

## Related

`../native-form/GUIDE.md` (the page mechanics of the native variant) · `../web2/GUIDE.md` (the `web2table` contract) · `myb-p-trigger-setup` · `myb-p-create-update-reports` · `myb-p-card-design`. The closest neighbour is a customer portal — an identified visitor with a session, so none of the anonymous constraints apply there.

## Known limitations

- **One rating question in the message.** More questions belong on the page after the click (the comment form can grow into a full native form) — never before it.
- **Response rate is opt-in and cannot be backfilled** (`CsatSentAt`, Steps 3 + 6).
- **No de-duplication across devices.** The reload guard works per browser tab session; a recipient who clicks on two devices creates two rating rows and the later projection wins. Acceptable for CSAT; not if the score has commercial consequences.
- **Native variant: a flagged visitor is challenged** by the CAPTCHA before the answer is saved. Rare; the answer is still recorded once solved.
- **One row per response** would need either an open `update` on the intake (anyone holding a row id could overwrite it — not recommended) or a server function.
