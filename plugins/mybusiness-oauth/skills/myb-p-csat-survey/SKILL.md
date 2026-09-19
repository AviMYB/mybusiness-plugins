---
name: myb-p-csat-survey
description: "Build a post-case satisfaction survey (CSAT) in a MyBusiness CRM tenant — a one-click rating from the closing email that lands on the case itself, a negative rating that becomes actual work, and a score wired into a report the manager already reads. Use whenever a customer asks for a satisfaction survey, service rating, smiley feedback, NPS-style score, or 'send the customer a survey when we close the ticket': סקר שביעות רצון, משוב לקוח, דירוג שירות, סמיילים במייל, דירוג בסגירת פנייה, שאלון שביעות רצון, מדידת שביעות רצון, CSAT, happiness rating, satisfaction survey, post-case feedback, customer rating email. Also use to DIAGNOSE an existing survey nobody answers or a rating that never reaches the record. It composes myb-p-web2lead-web2table + myb-p-trigger-setup and adds what neither has: the anonymous-write architecture the naive build gets wrong, the email link contract, the ordering trap, and an acceptance pack with negative cases. NOT for logged-in portal feedback and NOT for internal employee surveys."
---

# Post-case satisfaction survey (CSAT)

Builds the loop: a case closes → the customer gets a mail with one link per rating → **one click records the answer on the case** → a bad rating creates work → the score reaches a report.

Works on any business object with a closing event and a reachable contact — `Cases` is the common one; `Sales`, `Tasks` or a custom entity work identically. This document says "case"; substitute your object.

## The one rule that decides whether this survives

**The rating must be captured by the click in the email.** Not by a form the recipient lands on and submits. Every extra action collapses the response rate, and a survey nobody answers is worse than no survey — it produces a dashboard that lies. The comment box is a bonus offered *after* the thank-you screen, never a precondition.

The second rule is organizational and gets skipped constantly: **a negative rating must create work, and the score must enter a report someone already opens.** Without both you have built a metric, not a process. Field evidence is unambiguous here — teams that own a working survey mechanism and get zero value from it are almost always missing exactly these two things.

## Why the architecture looks the way it does

The responder is anonymous, and an anonymous caller **cannot write to the case**. Three measured platform facts force the shape — full detail in `../myb-p-kb/references/40-integrations-api/03-web2lead-web2table.md` §11, read it before designing anything:

1. Direct anonymous Parse REST writes are **CAPTCHA-gated** (`code 119`) — **even with `create:{"*":true}`**. Widening a CLP does not unblock a public page; it only widens exposure. If you catch yourself opening a CLP to make a public page work, stop.
2. `web2table` is the only approved anonymous write path, it **bypasses CLP** (so the intake table stays closed), and it **hard-requires `phone`**.
3. `web2table` **creates, never updates**. Nothing anonymous can update an existing row.

Hence four layers:

```
email · one link per rating   →  ?c={{{objectId}}}&p={{{PhoneNumber}}}&r=1|2|3
public page                   →  web2table  →  a row in the INTAKE table
projection trigger            →  copies rating / comment / date onto the CASE
response trigger              →  negative rating  →  task or notification to the owner
```

**Why project onto the case instead of reporting off the intake table:** once the rating sits on the business object, every existing report works immediately — per agent, per product, per period — because it travels with the fields those reports already group by. The intake table stays the raw journal.

## Step 0 — Close the decisions before you build

These change the build, so ask before touching the tenant. Every one of them has burned a real implementation:

| Decision | Why it matters |
|---|---|
| **Which closing statuses justify a survey?** | The trap. "Closed — no answer" (never reached the customer) and "transferred to another department" (this team solved nothing) are closing statuses that must **not** send. Send only where the customer actually received service. Ask for the list; never assume "all closed". |
| **How many levels?** | 3 (good / ok / bad) gives a usable distribution; 2 is sharper for decisions. More than one question lowers the response rate — say so out loud. |
| **The exact wording** in each level and in the mail | Customer-facing Hebrew. Get it from the process owner in writing; placeholder copy has a way of going live. |
| **Timing** — immediately on close, or delayed | A scheduled trigger can delay it; immediate is the default. |
| **A cap per customer?** | Without one, a heavy customer gets surveyed on every case. |
| **What happens on a negative rating** — task or notification | Both are supported; a task enters a work queue, a notification does not. Pick deliberately. |
| **The phone in the URL** (below) | A privacy decision that belongs to the customer, not to you. |

**The phone question.** `web2table` requires `phone`, so the link carries the customer's own phone number to the customer's own inbox — but it also lands in server logs, and whoever holds the link can submit a rating. The exposure is small (no read, no update, only an added rating) but it is real. Present it; if the customer refuses, the alternative is an opaque one-time token column on the case, looked up server-side — which needs a cloud function and moves the effort class up.

## Step 1 — Read the tenant before writing anything

Nothing here is guessable per tenant. Pull it live:

1. `Get-Schema(<business table>)` — the pointer to the contact, the owner field, the status field, and whether a phone/email mirror already exists on the record.
2. `Get-Data(<statuses table>)` — the closing statuses and their objectIds, to ask Step 0's first question with real names.
3. `Get-Schema("SatisfactionSurveys")` — **may already exist**; it is the product's documented intake shape (`../myb-p-kb/references/20-data-model/03-module-tables.md`). Reuse it rather than inventing a table.
4. `Get-Triggers(<business table>)` — a closing-mail trigger often already exists, sometimes disabled, sometimes sending on the wrong statuses. Fix it rather than adding a second sender.
5. `Get-Site-Pages` — an existing public page (landing page / web2table page) proves the intake path already works in this tenant and is the best thing to clone.
6. Email templates — is there already a "case closed" template, and does its CTA point at a placeholder that resolves to nothing?

Report what exists before proposing to build. In most service tenants over half of this is already in place.

## Step 2 — Intake table

Use `SatisfactionSurveys` if present. Otherwise `Create-Table` + `Add-Field-to-Table` with the documented shape, minimized to what was actually asked for:

| Field | Type | Why |
|---|---|---|
| `CaseId` | Pointer → business table | the record being rated; also the dedup key |
| `AccountId` | Pointer → Accounts | slice by customer |
| `OverallRating` | **Number** | **not String** — a report cannot average text |
| `AdditionalComments` | String | the free word, when written |
| `OwnerId` | Pointer → `_User` | copied from the record — this is what makes per-agent CSAT possible |
| `RespondedAt` | Date | response-rate math |

Copy owner/category onto the intake row (or let the projection trigger do it) so reports don't traverse pointers.

**Leave the CLP closed.** A new table is born deny-all and should stay that way — `web2table` writes regardless. Verify with `Get-Table-Permissions` that you did not loosen it while debugging.

## Step 3 — Fields on the business object

Three fields, plus a read-only section on the card so a human can see the answer where they work: `CsatRating` (Number), `CsatComment` (String), `CsatAt` (Date). These are what the projection trigger writes and what every report reads.

Add a fourth, `CsatSentAt` (Date), if response rate matters to this customer — it is the denominator, it is stamped by the send trigger (Step 6), and it **cannot be backfilled**. See Step 9.

## Step 4 — The public page

Clone an existing public page in the tenant if there is one (`Create-Table-View-Page` with `copyFromPageId`) — it already carries the tenant's public-page configuration. Attach the JS from `assets/survey-page.js` and replace its five placeholders.

The page: reads `c`/`p`/`r` from the query string → posts to `web2table` **on load, with no interaction** → shows the thank-you screen → offers the comment box → strips the query string from the address bar so the phone doesn't sit in the URL.

⚠ **If saving the page JS returns 403**, the platform WAF rejected the payload, not your code — some URL and regex patterns in page JS are blocked and the rules tighten over time. Upload the script with `Upload-Public-File` and load it from a two-line loader in the page instead. Don't try to defeat the filter by rewriting the code.

## Step 5 — The email

`assets/email-faces.html` is the three-face block, table-based for mail clients. It replaces the CTA of the existing closing template.

The link contract, which placeholders actually resolve, and how to verify a rendered mail **without sending to anyone** are in `references/url-contract.md`. Read it — a template that renders `{{{SomePlaceholder}}}` literally is the single most common failure here, and the three faces must differ by **glyph**, not only colour (colours drop in plain-text and in some clients).

## Step 6 — The send trigger  ⚠ outward-facing

`Set-Trigger` on the business table, `events:["update"]`, `onSetFields:["<status field>"]`, criteria = **only** the statuses agreed in Step 0, `oneachupdate:false` + an email action pointing at the template. If response rate matters, a second `update-object` action stamps `CsatSentAt` on the record (`references/reports.md` §R6) — one trigger, two actions, which is exactly the shape the safety rule below is written for.

**Safety procedure — this trigger mails real customers.** Follow it exactly:
- Build it `active:false`. Enable only for a controlled window, against test records whose contact address is an internal one.
- **Divert every mail action, not just one.** A trigger may carry several email actions; a real person once received a test mail because one of two was left pointing at production.
- Disable it in a `finally` and **verify the disable** with `Get-Triggers` — don't trust the success response.
- Leave it off until the process owner has approved the copy.
- Before enabling for real, check the contact table for placeholder addresses (`…@gmail.com` filler rows are common) — those are live mailboxes in the world.

`oneachupdate:false` also means a case that is reopened and closed again produces **no second survey**. That is usually what you want; if the customer wants one survey per closure, they need `true` plus a cap decision.

## Step 7 — Projection trigger

On the **intake** table, `events:["create"]`, action `update-object`:

```json
{ "targetClass": "<business table>",
  "connection": "source.CaseId",
  "fieldsValue": [
    { "field": "CsatRating",  "type": "dynamic", "value": "OverallRating" },
    { "field": "CsatComment", "type": "dynamic", "value": "AdditionalComments" },
    { "field": "CsatAt",      "type": "dynamic", "value": "updatedAt" }
  ]}
```

`source.<Pointer>` = "the record this row points at". Full grammar: `myb-p-trigger-setup` → `references/trigger-reference.md`.

## Step 8 — The response trigger (the half that makes it a process)

On the intake table, criteria `OverallRating <= <negative threshold>` → `create-object` (a task for the process owner, linked to the case and the customer) or `notification`, per Step 0.

**The ordering trap — read this before writing the body.** The rating and the comment arrive in **two separate calls**, seconds apart, as two intake rows. A trigger that fires on the rating runs **before** the comment exists, so a task whose description embeds the comment is born empty. Don't embed it: point the reader at the record, where the comment always appears. The same trap recurs in any mechanism reacting to data that arrives in stages.

## Step 9 — Reports

**`references/reports.md` carries the six specs, ready to build** — detail · average per agent · trend by month × agent · rating distribution · the negative-rating work queue · response rate. Build the first two, show them to the process owner, and let their reaction shape the rest; six reports delivered blind is how you end up with six reports nobody opens.

Two things from that file that change earlier steps, so decide them now rather than retrofitting:

- **Response rate needs a denominator that this recipe does not create by default.** Add `CsatSentAt` (Date) in Step 3 and a second `update-object` action on the send trigger in Step 6 that stamps it. **It cannot be backfilled** — the field starts existing the day you add it. If the customer will be judged on response rate, add it before the trigger goes live.
- **Always ship the response count next to the average.** An average over two responses is noise, and a manager who takes it into a feedback conversation with an agent burns the mechanism's credibility in one meeting.

## Step 10 — Acceptance

Run `references/acceptance-tests.md` — 11 tests, four of them negative. The negatives are the ones that separate "I built it" from "it works": a positive rating must **not** open a task; a non-qualifying closing status must send **nothing**; anonymous read of the intake table, anonymous update of an intake row, and anonymous write to the business object must all be **rejected**. Report the count honestly (`n/11`), including which ones you could not run.

## Traps that cost an hour each

- **Two rows per response** is correct, not a bug — the business object holds the answer, the intake table is the journal. Write it down or someone "fixes" it.
- **You cannot change an action's type in place.** `Set-Trigger-Action` reports success and leaves the old action; `deleteAction` is unreliable through the proxy. To swap a task action for a notification: build a clean new trigger and disable the old one.
- **A rating stored as String** kills averaging, and nobody notices until the report is due.
- **`Number` criteria in a trigger need `T:"Number"`** — a stringified value quietly never matches.
- **A closing status that means "we failed to reach them"** will happily mail a survey unless you excluded it.

## Knowledge sources

- `../myb-p-kb/references/40-integrations-api/03-web2lead-web2table.md` — §11 anonymous-write model (mandatory), §4 the `web2table` contract, §5 type mapping.
- `../myb-p-kb/references/20-data-model/03-module-tables.md` — the `SatisfactionSurveys` documented shape.
- `../myb-p-kb/references/30-customization/12-solution-blueprints.md` — blueprint 12 (this pattern, for scoping/fit-gap) and 10 (status-change automation).
- `../myb-p-kb/references/30-customization/06-triggers-and-automations.md` — trigger semantics and debugging via `_syslogTriggers`.
- `../myb-p-kb/references/30-customization/05-dashboards-and-reports.md` + `myb-p-create-update-reports/references/report-building-guide.md` — the report grammar this skill's `references/reports.md` builds on, including the scheduling activation gotcha.
- MCP tools: `Get-Schema`, `Get-Data`, `Get-Triggers`, `Get-Table-Permissions`, `Get-Site-Pages`, `Create-Table`, `Add-Field-to-Table`, `Create-Table-View-Page`, `Edit-Page-CSS-JS`, `Upload-Public-File`, `Set-Trigger`, `Set-Trigger-Action`, `Create-or-Update-Report`, `Update-Data`.

## Related skills

`myb-p-web2lead-web2table` (the intake contract) · `myb-p-trigger-setup` (trigger grammar and action reference) · `myb-p-create-update-reports` (Step 9) · `myb-p-page-builder` (the read-only results section on the card). The closest neighbour is a customer portal — same public-page infrastructure, but an identified visitor with a session, so none of the anonymous constraints above apply there.

## Known limitations

- **One rating question.** More questions fit the intake table but need a real form, which forfeits the one-click rule — treat as a different build.
- **Response rate is opt-in and cannot be backfilled.** The denominator is the `CsatSentAt` stamp (Step 3 + Step 6); records closed before you add it are unrecoverable. Decide at build time, not when the first monthly report is due.
- **No de-duplication of ratings.** A recipient who clicks twice creates two intake rows and the later projection wins. Acceptable for CSAT; not acceptable if the score has commercial consequences.
- **Email only.** The same link works in a WhatsApp closing message and typically answers far better, but this recipe does not build that leg.
- **The comment path needs the page's second call.** If the customer insists on one row per response, that is the one place a small cloud function (create-or-update by case id) is genuinely required.
