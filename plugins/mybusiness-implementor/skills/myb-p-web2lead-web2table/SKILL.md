---
name: myb-p-web2lead-web2table
description: "Generate production-ready code (JavaScript/jQuery, PHP, Python, C#, Node.js) that submits an external HTML form to MyBusiness CRM via the `web2lead` / `web2table` cloud functions — capturing leads or creating linked records (Sales, Cases, custom tables) on a customer's CRM. Use whenever the user wants to integrate a landing page, contact form, registration form, or any external HTML form with MyBusiness CRM, or asks for `web2lead`, `web2table`, `web2sale`, `web2case`, `web2contact` or similar `web2*` code. Strong triggers in Hebrew: 'קליטת לידים מטופס', 'חיבור טופס לאתר', 'אינטגרציית טופס', 'דף נחיתה', 'טופס חיצוני', 'קוד לטופס', 'יצירת ליד מטופס', 'קליטת מכירה מטופס', 'קליטת פנייה מטופס'. In English: 'landing page integration', 'external form to CRM', 'capture leads from form', 'embed form on website'. Use this BEFORE writing any HTTP integration code by hand — the field-naming conventions and Pointer-objectId requirements are easy to get wrong without this skill's schema lookups."
---

# Web Form → CRM Integration (`web2lead` / `web2table`)

Generate code that POSTs an external HTML form to one of two MyBusiness CRM cloud functions:

| Endpoint | Creates | Use when |
|---|---|---|
| **`web2lead`** | A new row in `Accounts` only, with `IsAccount: false` (Lead) | The form captures a contact only — no sale, case, or other linked record |
| **`web2table`** | A row in any target table (Sales, Cases, Orders, custom tables…) **AND** an Account if the contact is new | The form needs to create a linked record (e.g., a sale, a case, a course enrollment) tied to a contact |

Both endpoints:
- POST JSON to `https://api.mbapps.co.il/functions/{appId}/{endpoint}`
- Require the header `X-Parse-Application-Id: {appId}`
- Handle duplicate-contact detection on the server side
- Are gated by a Config-table flag (403 if disabled) — `AcceptWebLeads` gates `web2lead`, **`AcceptWebToTable`** gates `web2table` (verified in the deployed code)

`web2sale`, `web2case`, etc. mentioned in customer requests are **not separate endpoints** — they are `web2table` with `table: "Sales"` / `"Cases"` / etc. Use `web2table` for all "create a record in X" requests.

## Pre-setup — the `AcceptWebLeads` / `AcceptWebToTable` Config rows (one-time, per customer)

Each endpoint reads its own row in the system `Config` table: `web2lead` requires an enabled `AcceptWebLeads` row; `web2table` requires an enabled **`AcceptWebToTable`** row (verified in the deployed code). If the relevant row is missing or set to `false`, that endpoint returns **HTTP 403** and the request is rejected before reaching duplicate detection. When debugging a 403, check BOTH Config rows — don't assume `AcceptWebLeads` covers `web2table`.

**Row shape** (in the `Config` table):

| Field | Value |
|---|---|
| `Name` | `"AcceptWebLeads"` (String) |
| `Value` | `{ "AcceptWebLeads": true }` (Object — yes, the key is repeated inside the object) |

The Object form is what the cloud function reads — the outer `Name` is the lookup key; the inner Boolean is the actual switch. Setting Value to `{ "AcceptWebLeads": false }`, or having no row at all, disables the endpoint. The `web2table` row has the identical shape with `AcceptWebToTable` as both the `Name` and the inner key.

**Critical: the Config table is fully restricted from MCP.** Both `Get-Data` and `Create-Many` against `Config` return `Error: Table is restricted`. There is no MCP-supported way to:
- read the current value of `AcceptWebLeads`
- create the row
- toggle the value
- list other Config keys

Because MCP cannot touch `Config`, **the agent's job is to *guide the user* to enable the flag themselves** — do not attempt it via MCP (it returns `Table is restricted`), and never try to work around the tool-permission layer; if the user can't flip it, escalate to the MyBusiness team. There are three known web-capture flags; enable the one(s) your endpoint needs. Each is a row in `Config` whose `Value` is an Object that repeats the flag name as its inner key:

| `Name` (String) | `Value` (Object) | Enables |
|---|---|---|
| `AcceptWebLeads` | `{ "AcceptWebLeads": true }` | `web2lead` — capture a lead into `Accounts` |
| `AcceptWebToTable` | `{ "AcceptWebToTable": true }` | `web2table` — create a row in a target table |
| `AcceptWebToSaleLeads` | `{ "AcceptWebToSaleLeads": true }` | web→sale-lead capture |

Enable it in **one** of these ways:

1. **CRM admin → `Config` table (recommended — customer-facing, no credentials needed).** This is the reliable path; walk the user through it step by step:
   - Open the CRM admin and go to **Tables → `Config`** (the raw system-config grid — Refresh / Settings / **+ Add row** / Delete rows toolbar).
   - **If a row with the matching `Name` already exists** (e.g. `AcceptWebToTable`): click its **✎ (edit/pencil)** in the Action column and set `Value` to `{ "<FlagName>": true }`.
   - **If no such row exists:** click **+ Add row**, set `Name` = the exact flag (e.g. `AcceptWebToTable`) and `Value` = the JSON object `{ "AcceptWebToTable": true }` (the inner key repeats the `Name` verbatim), then save.
   - Keep **exactly one** row per flag — duplicates make the 403 unpredictable (see below).
   - Tell them the value must be the **object** form (`{ "AcceptWebToTable": true }`), not the bare boolean `true` — the cloud function reads the inner key.
2. **Escalate to the MyBusiness team** — if the customer can't reach the `Config` grid (missing permissions, hosted admin), mark the item blocked and hand it to the MyBusiness team per the internal ops runbook. Never go around the tool-permission layer yourself. Where the internal team legitimately needs a credentialed path, credentials are fetched at runtime via the `get-secret` CLI (secrets-manager skill) — never stored in files or pasted.

**Verifying the rows exist** — `Get-Data` on `Config` is blocked, so verification also goes through the CRM admin `Config` grid: have the customer open it and check BOTH flags (`AcceptWebLeads` and `AcceptWebToTable`), or escalate to the MyBusiness team.

If the customer has **multiple rows for the same flag** (seen in practice — e.g., one from initial provisioning and one from a later reset), the deployed code takes `query.first()` — an unspecified order, NOT "the most recent" — so you cannot predict which row wins. Keep exactly one Config row per flag; delete or fix duplicates before debugging a 403 caused by a stale `false` row.

**Workflow recommendation**: when handing the generated code to the customer, **tell them to verify the relevant flag is enabled first** — `AcceptWebLeads` for web2lead, `AcceptWebToTable` for web2table (and link to the Settings page if you know its path). A 403 on first call after deploying the code is usually this, not the code.

## Pre-flight context — ask these before code

Five questions whose answers shape the generated code. Ask up front (or fill in from earlier conversation) so you don't have to regenerate later:

1. **Which language / framework?** — JavaScript/jQuery, vanilla `fetch`, PHP cURL, PHP Guzzle, Python `requests`, Node.js, C#, etc.
2. **Where does the code run?** — Landing page in WordPress / Wix / Elementor (frontend, browser), or a server endpoint (Express, Flask, Laravel, ASP.NET) that the form posts to first? Frontend submission is simplest; a server-side proxy hides any extra logic and lets you store the appId in env vars.
3. **What should happen on success?** — Redirect to a thank-you page? Show inline confirmation? Fire a tracking pixel / GTM event? Reset the form? Ask.
4. **Are there captcha or anti-bot fields?** — reCAPTCHA, Cloudflare Turnstile, honeypot? Their tokens are validated separately, before forwarding to web2lead/web2table.
5. **Is the form on a different domain than `api.mbapps.co.il`?** — Yes for almost all landing pages. Parse Cloud Functions allow CORS by default for these endpoints, but if the customer reports a blocked request, this is the first thing to check.

A quick word on `{appId}` exposure: the appId is the customer-facing application identifier — **not** the master key. Exposing it in browser JavaScript is intentional and safe for this flow; the API's gate is the endpoint's Config flag (`AcceptWebLeads` / `AcceptWebToTable`) plus duplicate detection, not appId secrecy. Customers occasionally panic about this — reassure them.

## Mandatory workflow before generating ANY code

This is the single most important rule of this skill: **you cannot produce correct code from memory**. The Accounts schema and the target table's schema differ per customer (custom fields, renamed labels, removed defaults), and Pointer fields require live objectIds. The price of guessing is a silent failure — the API returns 200 and the wrong-shaped record lands in the database.

1. **Get-Schema on Accounts** — list available field names and types.
2. **Get-Schema on the target table** (web2table only) — same.
3. **Get-Data on every Pointer's targetClass that the user wants to populate** — to build the value→objectId map.
4. **(web2lead only, when a custom status is requested)** Get-Data on `LeadStatuses` — to confirm the objectId exists.
5. **Validate every field the user asked for against the schema.** If a field doesn't exist, flag it before generating; don't quietly drop it.
6. Only then generate code.

If the user provided field info in the same message, do steps 1–4 in parallel — the schema reads are independent.

## Endpoint reference

### `web2lead`

```
POST https://api.mbapps.co.il/functions/{appId}/web2lead
Content-Type: application/json
X-Parse-Application-Id: {appId}

{ ...flat fields, no prefix... }
```

**Required**: at least one of `PhoneNumber` or `Email`. The API returns 422 if both are missing.

**Field naming**: **NO prefix**. Field names match the `Accounts` schema verbatim (e.g., `Name`, `F_name`, `L_name`, `PhoneNumber`, `Email`, `Address`, `City`, `CompanyId`).

**Protected fields** (API sets these — do not include in the body):
- `IsAccount` — always `false`
- `fromWeb2lead` — always `true`
- `LeadStatusId` — set by duplicate detection (overridable for new leads via the request body)
- System fields: `objectId`, `createdAt`, `updatedAt`, `ACL`, `createdBy`, `updatedBy`

**Duplicate detection** (server-side, automatic):
- Searches Accounts by `PhoneNumber` across formats (`05X…`, `972…`, `+972…`, with/without dashes)
- Searches by `Email`
- If duplicate → API assigns the documented "duplicate lead" status (default `QYvLV9xHE1`)
- If new → API assigns the request's `LeadStatusId` if provided, else the documented "new lead" default (`e9TwcETDGq`)

These default objectIds are documented system defaults but **verify them against the customer's `LeadStatuses` table** via Get-Data — they can differ on customized installations.

**Response**:
- Success: `{ success: true, leadId: "<objectId>" }`
- 422 — missing `PhoneNumber`/`Email`
- 403 — `AcceptWebLeads` is disabled (instruct the customer to enable it in CRM Settings)
- 500 — server error

### `web2table`

```
POST https://api.mbapps.co.il/functions/{appId}/web2table
Content-Type: application/json
X-Parse-Application-Id: {appId}

{
  "table": "Sales",          // ← required, names the target table
  "phone": "...",            // ← unprefixed, HARD-REQUIRED (422 "missing phone" without it)
  "email": "...",
  "idnum": "...",
  "account_Name": "...",     // ← any Accounts field, prefixed with account_
  "account_City": "...",
  "table_Title": "...",      // ← any target-table field, prefixed with table_
  "table_Amount": 1500,
  "table_StatusId": "<10charObjectId>"
}
```

**Required**:
- `table` — exact class name of the target table (e.g., `"Sales"`, `"Cases"`, `"Orders"`)
- `phone` — hard-required by the deployed code (422 "missing phone" without it). `email` / `idnum` are optional additional keys; the lookup keys are used to locate (or create) the Account that the new target-table row links to

**Field naming** — three buckets:

| Bucket | Prefix | Examples |
|---|---|---|
| Special lookup keys | none | `phone`, `email`, `idnum`, `table` |
| Accounts fields | `account_` | `account_Name`, `account_F_name`, `account_City`, `account_CompanyId` |
| Target-table fields | `table_` | `table_Title`, `table_Amount`, `table_SaleStatusId`, `table_Comment` |

The special keys (`phone`, `email`, `idnum`) drive duplicate detection; the API maps them into `Accounts.PhoneNumber` / `Email` / `CompanyId` on new contacts and uses them to look up returning ones. **Don't double-send** — `phone` + `account_PhoneNumber` is redundant and may not behave as expected.

**Special behavior fields**:
- `account_IsAccount: "true"` — creates the contact as a **Customer** (Account) instead of a Lead. Send as string `"true"`, not boolean.
- `IsFirst` — auto-set by the API (`true` for newly-created Accounts, `false` for returning).
- `AccountId` on the target-table row — auto-linked by the API.

**Response**:
- Success: `{ success: true, accountId: "<objectId>", Id: "<objectId-of-target-row>" }`
- 422 — missing required input
- 403 — `AcceptWebToTable` disabled (check both Config rows)
- 500 — server error

## Type mapping for the JSON body

| Schema type | JSON value to send | Notes |
|---|---|---|
| String | string | as-is |
| Number | number or stringified number | API auto-coerces |
| Boolean | `"true"` / `"false"` (string) | string form is the safest cross-language |
| Date | ISO string, minimum 10 chars (`"YYYY-MM-DD"` or full `"YYYY-MM-DDTHH:mm:ss.sssZ"`) | not a Parse `{__type:"Date",iso:...}` object — flat ISO string |
| Pointer | the 10-character objectId string | **never** a `{__type:"Pointer",className,objectId}` object — the API expects just the id |
| Array | JSON array (e.g., array of objectIds for `array_*_Pointer_*` fields) | |
| Object | JSON object | rare in form submissions |
| File / PrivateFile | not supported in this flow | use a different upload path; flag to user |

The Pointer rule is the single biggest gotcha — Parse REST uses the wrapped form, web2lead/web2table use a bare objectId. If you copy a Parse-REST snippet by reflex, the request will silently leave the Pointer field null.

## Pointer mapping pattern

For every Pointer field the user wants their form to populate, do this:

1. From the schema, get the Pointer's `targetClass` (e.g., `LeadSource` for `LeadSourceId`).
2. `Get-Data(table: "<targetClass>", keys: ["Name"], limit: 200)` — fetch the options.
3. Emit a static `name → objectId` map in the generated code, with a comment showing how to extend.
4. The form's `<select>` should submit the **Name** (or any key the customer uses), and the JS code translates via the map before sending.

If the lookup table is large or values change frequently, generate a fetch-on-demand pattern instead (one extra REST call to look up the objectId at submit time). Default to static map for simplicity unless the user asks otherwise.

## Validation checklist before emitting code

Run through this list mentally for every request — catch errors at generation time, not at runtime:

- [ ] Schema for Accounts retrieved.
- [ ] Schema for target table retrieved (web2table only).
- [ ] Every user-named field exists in the relevant schema. **Flag mismatches before generating.**
- [ ] At least one of `PhoneNumber`/`Email` is in the form (web2lead); `phone` is in the form (web2table — hard-required, 422 without it).
- [ ] `table` field is set (web2table only).
- [ ] Every Pointer field has a fetched mapping; no Pointer is left as a free-text string.
- [ ] Date fields use ISO format, ≥10 chars.
- [ ] Boolean fields use string `"true"`/`"false"`.
- [ ] Pointer fields use bare objectId strings — no wrapping.
- [ ] System fields (objectId, createdAt, etc.) are not in the body.
- [ ] Protected fields (web2lead: IsAccount, fromWeb2lead, LeadStatusId-when-set-by-duplicate) are not in the body unless the user explicitly wants a custom new-lead status.

## What to present to the user before the code block

**Show only the fields the user asked for** (matched to the schema), not the full table. Accounts can have 40–50+ columns; dumping all of them buries the relevant info. The user already told you what they want — confirm those exist, list any Pointers they touch with the lookup mapping, and surface any field they named that does NOT exist.

```
Based on the schema:

**Form-fields → CRM-fields mapping (matched to your request):**
- שם מלא       → Accounts.Name (String)
- טלפון         → Accounts.PhoneNumber (String) ✓ required
- אימייל        → Accounts.Email (String) ✓ required
- עיר          → Accounts.City (String)
- מקור הליד    → Accounts.LeadSourceId (Pointer → LeadSource)

**Pointer mapping used (from live data):**
- LeadSource: {
    "פייסבוק": "vOZLqOWnQf",
    "גוגל":   "fHG8Rgy8Hr",
    "אתר אינטרנט": "yOTdl4L99Q",
    ... (7 total)
  }

**Auto-managed by API (do NOT include in body):**
- web2lead: IsAccount, fromWeb2lead, LeadStatusId (duplicate-detection result)
- web2table: IsFirst, AccountId
- both: objectId, createdAt, updatedAt, ACL, createdBy, updatedBy

**Warnings (if applicable):** <field 'X' you named does not exist in Accounts — closest match: Y>

Here is the code:
<code>
```

## Reference code — JavaScript / jQuery (`web2lead`)

```javascript
/**
 * Web2Lead — capture a lead into Accounts.
 * Endpoint: https://api.mbapps.co.il/functions/{APP_ID}/web2lead
 * Required: PhoneNumber OR Email.
 * Duplicate detection is automatic on the server.
 */

// (1) If you have Pointer fields, declare the mapping(s) here.
// const sourceMapping = { "Google": "abc1234567", "Facebook": "def1234567" };

function submitLead() {
  const data = {
    // Required (at least one):
    PhoneNumber: document.getElementById('phone').value,
    Email:       document.getElementById('email').value,

    // Optional, names must match Accounts schema:
    Name:    document.getElementById('fullName').value,
    F_name:  document.getElementById('firstName').value,
    L_name:  document.getElementById('lastName').value,
    City:    document.getElementById('city').value,

    // Pointer field — send the 10-char objectId, NOT the display value:
    // LeadSourceId: sourceMapping[document.getElementById('source').value],

    // Optional custom status for NEW leads (10-char objectId; duplicates always
    // get the system "duplicate" status regardless of this):
    // LeadStatusId: 'e9TwcETDGq'
  };

  // Drop empty fields so they don't overwrite anything server-side
  Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });

  if (!data.PhoneNumber && !data.Email) {
    alert('נא למלא טלפון או אימייל');
    return;
  }

  jQuery.ajax('https://api.mbapps.co.il/functions/{APP_ID}/web2lead', {
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(data),
    headers: { 'X-Parse-Application-Id': '{APP_ID}' },
    success: function(resp) {
      if (resp.success) {
        console.log('Lead created:', resp.leadId);
        // redirect / show thank-you / track conversion
      }
    },
    error: function(xhr) {
      if (xhr.status === 422) alert('נא למלא טלפון או אימייל תקינים');
      else if (xhr.status === 403) alert('קבלת לידים מהאתר אינה מופעלת במערכת');
      else alert('אירעה שגיאה, נסה שנית');
    }
  });
}
```

## Reference code — JavaScript / jQuery (`web2table`)

```javascript
/**
 * Web2Table — capture into a target table + link/create Account.
 * Endpoint: https://api.mbapps.co.il/functions/{APP_ID}/web2table
 * Required: `table` AND `phone` (hard-required; email/idnum are optional extra lookup keys).
 */

// const saleStatusMapping = { "חדשה": "...", "בטיפול": "..." };

function submitSale() {
  const data = {
    // Required:
    table: 'Sales',                          // ← target class name
    phone: document.getElementById('phone').value,    // ← unprefixed (duplicate-detection key)
    email: document.getElementById('email').value,    // ← unprefixed

    // Accounts fields — prefix with account_:
    account_Name:      document.getElementById('fullName').value,
    account_CompanyId: document.getElementById('companyId').value,
    account_City:      document.getElementById('city').value,
    // account_IsAccount: 'true',  // ← uncomment to create as Customer rather than Lead

    // Target-table (Sales) fields — prefix with table_:
    table_Title:       document.getElementById('saleTitle').value,
    table_Amount:      document.getElementById('amount').value,           // Number — string OK
    table_ClosingDate: document.getElementById('closingDate').value,      // ISO date string
    // table_SaleStatusId: saleStatusMapping[document.getElementById('status').value],
  };

  Object.keys(data).forEach(k => { if (data[k] === '' || data[k] == null) delete data[k]; });

  if (!data.phone) {
    alert('נא למלא טלפון');
    return;
  }

  jQuery.ajax('https://api.mbapps.co.il/functions/{APP_ID}/web2table', {
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(data),
    headers: { 'X-Parse-Application-Id': '{APP_ID}' },
    success: function(resp) {
      console.log('Account:', resp.accountId, '| New Sales row:', resp.Id);
    },
    error: function(xhr) {
      if (xhr.status === 422) alert('חסר שדה חובה: טלפון');
      else if (xhr.status === 403) alert('קבלה מהאתר אינה מופעלת במערכת');
      else alert('אירעה שגיאה, נסה שנית');
    }
  });
}
```

## Array fields (multi-select Pointers)

A field whose name matches `array_<purpose>_Pointer_<TargetTable>` is a Simbla multi-select that stores a Parse `Array` of objectId strings (see the `myb-p-multi-select-field` skill for the schema/form-rendering side).

To populate one of these from a form submission, send a **JSON array of bare objectId strings** — no per-element wrapping:

```javascript
// In a web2lead body — populating array_interests_Pointer_Interests:
{
  PhoneNumber: '0501234567',
  array_interests_Pointer_Interests: [
    'uNbbHuMGlK',     // = "טכנולוגיה" objectId
    'j17RjXmHdN',     // = "ספורט"
  ],
}
```

In `web2table`, prefix with `account_` or `table_` per usual:
```
"account_array_interests_Pointer_Interests": ["uNbbHuMGlK", "j17RjXmHdN"]
"table_array_tags_Pointer_Tags":             ["GGZUYqBjqT", "io3Z6YsMcG"]
```

The form-side pattern is typically multiple `<input type="checkbox">` or a `<select multiple>` — collect the chosen values, map each through the lookup `name → objectId` table, and send the resulting array.

If a Pointer lookup misses (user picked something that's not in the static map), the safe behavior is to **omit the field from the body** rather than send `undefined` or an empty string. Filter the data object before posting (the `Object.keys(...).forEach(k => !data[k] && delete data[k])` idiom in the reference snippets handles this).

## Other languages

The shape is identical in every language — POST JSON with the two headers. Templates for PHP, Python, C#, Node.js are in `references/`:

- `references/php.md` — cURL + Guzzle
- `references/python.md` — `requests`
- `references/csharp.md` — `HttpClient`
- `references/nodejs.md` — `fetch` and `axios`

When the user asks for a less common language (Go, Ruby, Java, Kotlin, Swift), translate from the JavaScript reference — the structure, field names, and validation are language-independent; only the HTTP client and JSON serializer change.

## Related skills

- **`myb-p-multi-select-field`** — when the form has a multi-pick lookup that maps to an `array_*_Pointer_*` field. That skill covers the schema/form-rendering side; this skill covers wiring it into a form submission.
- **`myb-p-trigger-setup`** — for what happens *after* the lead/sale lands (auto-email, auto-WhatsApp, status routing). Worth mentioning to the customer when they ask "how do I notify the team when a lead comes in".

## Common pitfalls (in observed frequency order)

- **Wrapping Pointer values as `{__type:"Pointer",className,objectId}`.** That's Parse REST; web2lead/web2table want the bare objectId string. The request succeeds but the field stays null.
- **Sending `account_Phone` / `account_Email` instead of unprefixed `phone` / `email` in `web2table`.** The duplicate-detection keys are unprefixed; the prefixed forms may not feed into the lookup. Use unprefixed.
- **Missing `table` field on `web2table`.** Returns an error or creates the row on the wrong table.
- **Mixing the two endpoints.** `web2lead` does not accept `account_*` / `table_*` prefixes; `web2table` does not accept flat Accounts field names. Choose the endpoint, then use its naming.
- **Using `equalTo`-style filter values for dates.** Dates must be ISO strings; numerics like Unix timestamps get rejected.
- **Sending Boolean `true`/`false` (JS native).** Send the **string** `"true"` / `"false"` — the API parses strings reliably across languages.
- **Forgetting the `X-Parse-Application-Id` header.** Request returns an auth error.
- **Hardcoding `e9TwcETDGq` / `QYvLV9xHE1` without verifying.** Default LeadStatus IDs are documented but customizable; verify the customer has these specific objectIds via Get-Data on `LeadStatuses` before relying on them.
- **Generating code for a field that doesn't exist in the schema.** API silently ignores unknown keys → looks-like-success, but no data lands. Validate before generating.

## MCP Gaps (as of 2026-05-19)

1. **No MCP access to the `Config` table.** Both read (`Get-Data`) and write (`Create-Many`, presumably `Update-Data`) return `Error: Table is restricted`. This blocks any MCP-only setup of the `AcceptWebLeads` / `AcceptWebToTable` rows. Until lifted, enabling web leads is a CRM-UI operation (or an escalation to the MyBusiness team). A targeted MCP tool — `Get-Config-Value` / `Set-Config-Value` — would close this.
2. **No MCP way to verify a 403 against a specific Config row.** When a customer reports "the form returns 403", you can't ask MCP whether `AcceptWebLeads` / `AcceptWebToTable` is `true`, `false`, or missing — you must ask the customer to check the UI, or mark the item blocked and escalate to the MyBusiness team.

When this gap closes, this skill should be revised to call `Get-Config-Value` / `Set-Config-Value` (or whatever the eventual tool name is) in the workflow rather than instructing the customer to use the UI.

## Why this matters

The endpoints are designed for friction-free landing-page integration — no Parse SDK, no master key, no auth dance. The cost of that simplicity is that the API trusts the request shape and silently ignores anything unrecognized. So getting the field names, prefixes, types, and Pointer format right at code-generation time is the difference between "works" and "looks like it works but data is lost." The schema-driven workflow above is what turns this into a deterministic exercise rather than a guessing game.
