# web2 — `getlead` / `web2table` for a form that lives outside the CRM

Part of `myb-p-public-forms`. Use this method when the form is **not** a page of the tenant's CRM site — the customer's own website, a landing-page builder, a partner system, a server. For a form we host on a CRM page, `../native-form/GUIDE.md` is simpler (no phone, platform reCAPTCHA, nothing injected into the schema); for a closed table with server-side dedup, `../capture-data/GUIDE.md`.

Generate code that POSTs the form to one of two MyBusiness CRM cloud functions:

| Pattern | Endpoint (URL segment) | Creates | Use when |
|---|---|---|---|
| **web2lead** | **`getlead`** | A new row in `Accounts` only, with `IsAccount: false` (Lead) | The form captures a contact only — no sale, case, or other linked record |
| **web2table** | `web2table` | A row in any target table (Sales, Cases, Orders, custom tables…) **AND** an Account if the contact is new | The form needs to create a linked record (e.g., a sale, a case, a course enrollment) tied to a contact |

> ⚠️ **Read this before you write a single URL.** "web2lead" is the name of the *pattern*, not of the
> endpoint. The deployed function is **`getlead`** — `POST /functions/{appId}/web2lead` answers
> `{"error":"User function not found"}` and no such function exists. `web2table` is both the pattern
> and the function name, which is why the pair looks symmetrical and is not. Name matching is
> case-insensitive, so `getLead` works too. (Measured live 2026-08-24; this skill and the docs shipped
> `/web2lead` until then.)

Both endpoints:
- POST JSON to `https://api.mbapps.co.il/functions/{appId}/{functionName}` — `getlead` or `web2table`
- Require the header `X-Parse-Application-Id: {appId}`
- Handle duplicate-contact detection on the server side
- Are gated by a Config-table flag (refused with a "…is Disabled" error when off) — `AcceptWebLeads` gates `getlead`, **`AcceptWebToTable`** gates `web2table` (verified in the deployed code)
- Answer errors through the gateway as **HTTP 400 with a JSON body** `{"error": "<message>"}` — the
  function's own `422` / `403` never reach the caller, so branch on the message, not the status code
  (measured 2026-10-09: `missing "phone"`, `missing "PhoneNumber" or "Email"`, `AcceptWebToTable is Disabled`)
- Answer success differently: **`getlead` wraps it** — `{"result":{"success":true,"leadId":"…"}}` — while
  `web2table` does not (`{"success":true,"accountId":"…","Id":"…"}`). Read `body.result || body`.
- **Trust the `table` you send.** `web2table` writes, with the master key, into whatever class the body names — hard-code it in
  your code or server-side forwarder; never build it from user input.

`web2sale`, `web2case`, etc. mentioned in customer requests are **not separate endpoints** — they are `web2table` with `table: "Sales"` / `"Cases"` / etc. Use `web2table` for all "create a record in X" requests.

## Pre-setup — the `AcceptWebLeads` / `AcceptWebToTable` Config rows (one-time, per customer)

Each endpoint reads its own row in the system `Config` table: `web2lead` requires an enabled `AcceptWebLeads` row; `web2table` requires an enabled **`AcceptWebToTable`** row (verified in the deployed code). If the relevant row is missing or set to `false`, that endpoint refuses the call before duplicate detection — the caller sees **HTTP 400** with `{"error":"AcceptWebToTable is Disabled"}` (the function's own 403 is rewritten by the gateway). When debugging a "Disabled" error, check BOTH Config rows — don't assume `AcceptWebLeads` covers `web2table`.

**Row shape** (in the `Config` table):

| Field | Value |
|---|---|
| `Name` | `"AcceptWebLeads"` (String) |
| `Value` | `{ "AcceptWebLeads": true }` (Object — yes, the key is repeated inside the object) |

The Object form is what the cloud function reads — the outer `Name` is the lookup key; the inner Boolean is the actual switch. Setting Value to `{ "AcceptWebLeads": false }`, or having no row at all, disables the endpoint. The `web2table` row has the identical shape with `AcceptWebToTable` as both the `Name` and the inner key.

**The `Config` table is reachable from MCP.** `Get-Data`, `Create-Data` and `Update-Data` on `Config` read, create and toggle these rows directly — **the agent does this itself**, no UI round-trip needed. (Earlier MCP versions answered `Error: Table is restricted`; if the connection still does, fall back to the CRM admin grid below.) There are three known web-capture flags; enable the one(s) your endpoint needs. Each is a row in `Config` whose `Value` is an Object that repeats the flag name as its inner key:

| `Name` (String) | `Value` (Object) | Enables |
|---|---|---|
| `AcceptWebLeads` | `{ "AcceptWebLeads": true }` | `web2lead` — capture a lead into `Accounts` |
| `AcceptWebToTable` | `{ "AcceptWebToTable": true }` | `web2table` — create a row in a target table |
| `AcceptWebToSaleLeads` | `{ "AcceptWebToSaleLeads": true }` | ⚠️ unverified — read by none of the two endpoints here; seen in some tenants' `Config` |

Enable it in **one** of these ways:

0. **MCP (default).**
   - Look up the row: `Get-Data(table:"Config", where:{"Name":"AcceptWebToTable"})` (or `AcceptWebLeads`).
   - **One row, wrong value** → `Update-Data(table:"Config", objectId:<id>, data:{"Value":{"AcceptWebToTable":true}})`.
   - **No row** → `Create-Data(table:"Config", data:{"Name":"AcceptWebToTable","Value":{"AcceptWebToTable":true}})`.
   - **Several rows** → set every one of them to `true` with `Update-Data` (MCP has no delete); have the customer delete the extras in the grid when convenient.
   - Re-read the row with `Get-Data` to confirm the write landed. `Config` is a system table shared by other integrations — touch only the flag rows you need, and do not echo other rows' values (some hold provider credentials).
1. **CRM admin → `Config` table (fallback — customer-facing, no credentials needed).** Use when MCP answers `Table is restricted`, or when the customer prefers to do it themselves; walk the user through it step by step:
   - Open the CRM admin and go to **Tables → `Config`** (the raw system-config grid — Refresh / Settings / **+ Add row** / Delete rows toolbar).
   - **If a row with the matching `Name` already exists** (e.g. `AcceptWebToTable`): click its **✎ (edit/pencil)** in the Action column and set `Value` to `{ "<FlagName>": true }`.
   - **If no such row exists:** click **+ Add row**, set `Name` = the exact flag (e.g. `AcceptWebToTable`) and `Value` = the JSON object `{ "AcceptWebToTable": true }` (the inner key repeats the `Name` verbatim), then save.
   - Keep **exactly one** row per flag — duplicates make the refusal unpredictable (see below).
   - Tell them the value must be the **object** form (`{ "AcceptWebToTable": true }`), not the bare boolean `true` — the cloud function reads the inner key.
2. **Ask MyBusiness support** — if neither MCP nor the `Config` grid is available (e.g. the customer can't reach the grid — missing permissions, hosted admin, mark the item blocked and hand it to MyBusiness support. Never go around the tool-permission layer yourself. 

**Verifying the rows exist** — `Get-Data(table:"Config", where:{"Name":{"$in":["AcceptWebLeads","AcceptWebToTable"]}})` returns both flags in one call; check the inner Boolean and the row count per flag. Without MCP access, check the CRM admin `Config` grid or ask MyBusiness support.

If the customer has **multiple rows for the same flag** (seen in practice — e.g., one from initial provisioning and one from a later reset), the deployed code takes `query.first()` — an unspecified order, NOT "the most recent" — so you cannot predict which row wins. Keep exactly one Config row per flag; delete or fix duplicates before debugging a refusal caused by a stale `false` row.

**Workflow recommendation**: when handing the generated code to the customer, **tell them to verify the relevant flag is enabled first** — `AcceptWebLeads` for web2lead, `AcceptWebToTable` for web2table — or set it yourself over MCP. A "Disabled" error on the first call after deploying the code is usually this, not the code.

## Pre-flight context — ask these before code

Five questions whose answers shape the generated code. Ask up front (or fill in from earlier conversation) so you don't have to regenerate later:

1. **Which language / framework?** — JavaScript/jQuery, vanilla `fetch`, PHP cURL, PHP Guzzle, Python `requests`, Node.js, C#, etc.
2. **Where does the code run?** — Landing page in WordPress / Wix / Elementor (frontend, browser), or a server endpoint (Express, Flask, Laravel, ASP.NET) that the form posts to first? Frontend submission is simplest; a server-side proxy hides any extra logic and lets you store the appId in env vars.
3. **What should happen on success?** — Redirect to a thank-you page? Show inline confirmation? Fire a tracking pixel / GTM event? Reset the form? Ask.
4. **Are there captcha or anti-bot fields?** — reCAPTCHA, Cloudflare Turnstile, honeypot? The endpoints check none of them: validate the token on your own server before forwarding (a server-side forwarder is the clean pattern). The platform's own reCAPTCHA is available only to native forms on CRM pages (`../native-form/GUIDE.md`).
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

### `getlead` (the web2lead pattern)

```
POST https://api.mbapps.co.il/functions/{appId}/getlead
Content-Type: application/json
X-Parse-Application-Id: {appId}

{ ...flat fields, no prefix... }
```

**Required**: at least one of `PhoneNumber` or `Email`. Without both the caller gets HTTP 400 `{"error":"missing \"PhoneNumber\" or \"Email\""}`.

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
- ⚠️ **Normalize the phone to digits before sending.** The format variants are generated only when the incoming value is digits-only; a phone sent as `+972-50-000-0098` or `050 000 0098` is matched **exactly** and an existing `0500000098` is not found (measured 2026-10-09: digits-only `0500000098` and `972500000098` were flagged duplicate, `+972-50-000-0098` was not). `phone.replace(/\D/g,'')` in the form code fixes it.
- If new → API assigns the request's `LeadStatusId` if provided, else the documented "new lead" default (`e9TwcETDGq`)

These default objectIds are documented system defaults but **verify them against the customer's `LeadStatuses` table** via Get-Data — they can differ on customized installations.

**Response** (measured):
- Success: `{ "result": { "success": true, "leadId": "<objectId>" } }` — note the `result` wrapper
- 400 `{"error":"missing \"PhoneNumber\" or \"Email\""}` — neither key sent
- 400 with a "disabled" message — `AcceptWebLeads` is off (enable it in `Config`, Pre-setup)
- 500 — server error

### `web2table`

```
POST https://api.mbapps.co.il/functions/{appId}/web2table
Content-Type: application/json
X-Parse-Application-Id: {appId}

{
  "table": "Sales",          // ← required, names the target table
  "phone": "...",            // ← unprefixed, HARD-REQUIRED (400 'missing "phone"' without it)
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
- `phone` — hard-required by the deployed code (HTTP 400 `missing "phone"` without it). `email` / `idnum` are optional additional keys; the lookup keys are used to locate (or create) the Account that the new target-table row links to

**Field naming** — three buckets:

| Bucket | Prefix | Examples |
|---|---|---|
| Special lookup keys | none | `phone`, `email`, `idnum`, `table` |
| Accounts fields | `account_` | `account_Name`, `account_F_name`, `account_City`, `account_CompanyId` |
| Target-table fields | `table_` | `table_Title`, `table_Amount`, `table_SaleStatusId`, `table_Comment` |

The special keys (`phone`, `email`, `idnum`) drive duplicate detection; the API maps them into `Accounts.PhoneNumber` / `Email` / `CompanyId` on new contacts and uses them to look up returning ones. **Don't double-send** — `phone` + `account_PhoneNumber` is redundant and may not behave as expected.

**Special behavior fields**:
- `account_IsAccount: "true"` — creates the contact as a **Customer** (Account) instead of a Lead. Send as string `"true"`, not boolean.
- `IsFirst` — auto-set by the API: `true` for a new Account; `false` only when the Account existed **and** the request sent `isExistsAccountCheck: true` — without that flag every row is `true` (as is `AccountNotExist`).
- `AccountId` on the target-table row — auto-linked by the API.

**Response** (measured):
- Success: `{ "success": true, "accountId": "<objectId>", "Id": "<objectId-of-target-row>" }`
- 400 `{"error":"missing \"phone\""}` — phone absent (email alone is not enough)
- 400 `{"error":"AcceptWebToTable is Disabled"}` — the Config flag is off or missing
- 500 — server error

**What it does to the target table** (measured 2026-10-09): ignores the table's CLP (an Admin-only table was written to); ignores `table_objectId` (always a new row); adds **7 columns** to the table schema if missing — `IsFirst`, `AccountNotExist`, `AccountId`, `CampaignName`, `PageName`, `PhoneNumber`, `Email` — and fills them; when you do not send them, sets `Name` to `פניה ראשונה` and `CampaignName` / `PageName` to `MainLandingPage`. Send `table_Name`, `CampaignName` and `PageName` yourself so the rows are recognisable. MCP cannot delete columns, so never aim it at a table you are only experimenting with.

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
| File | a File **object** `{"__type":"File","name":"<name returned by the upload>","url":"<url>"}` | upload first with `POST https://api.mbapps.co.il/parse/files/<name>` (App ID header only, raw bytes, no session header) → use its `name`/`url`; a string in the field fails with a schema mismatch (measured 2026-10-09); a File object for a name that was **never uploaded** answers `400 {"code":1}` after ~5 s and leaves 5 duplicate target rows — upload first, then send what the upload returned (measured 2026-10-10) |

The Pointer rule is the single biggest gotcha — Parse REST uses the wrapped form, web2lead/web2table use a bare objectId **for a single Pointer**. If you copy a Parse-REST snippet by reflex, the request will silently leave the Pointer field null. Arrays of pointers are the one exception (next section).

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
- [ ] At least one of `PhoneNumber`/`Email` is in the form (web2lead); `phone` is in the form (web2table — hard-required, 400 `missing "phone"` without it).
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

## Reference code — JavaScript / jQuery (lead intake, `getlead`)

```javascript
/**
 * Web2Lead pattern — capture a lead into Accounts. Endpoint: getlead.
 * Endpoint: https://api.mbapps.co.il/functions/{APP_ID}/getlead
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
  // Digits only - duplicate detection expands phone formats only for a digits-only value
  if (data.PhoneNumber) data.PhoneNumber = data.PhoneNumber.replace(/\D/g, '');

  if (!data.PhoneNumber && !data.Email) {
    alert('נא למלא טלפון או אימייל');
    return;
  }

  jQuery.ajax('https://api.mbapps.co.il/functions/{APP_ID}/getlead', {
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(data),
    headers: { 'X-Parse-Application-Id': '{APP_ID}' },
    success: function(resp) {
      var r = resp.result || resp;          // getlead wraps its answer in `result`
      if (r.success) {
        console.log('Lead created:', r.leadId);
        // redirect / show thank-you / track conversion
      }
    },
    error: function(xhr) {
      // every error arrives as HTTP 400 { error: "<message>" } - branch on the message
      var msg = (xhr.responseJSON && xhr.responseJSON.error) || '';
      if (msg.indexOf('missing') === 0) alert('נא למלא טלפון או אימייל תקינים');
      else if (/Disabled/i.test(msg)) alert('קבלת לידים מהאתר אינה מופעלת במערכת');
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
    table: 'Sales',                          // ← target class name - hard-coded, never from user input
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
    table_Name: 'טופס אתר',                   // otherwise the row is named "פניה ראשונה"
    CampaignName: 'website', PageName: 'contact',   // otherwise both become "MainLandingPage"
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
      var msg = (xhr.responseJSON && xhr.responseJSON.error) || '';   // HTTP 400 { error }
      if (msg.indexOf('missing') === 0) alert('חסר שדה חובה: טלפון');
      else if (/Disabled/i.test(msg)) alert('קבלה מהאתר אינה מופעלת במערכת');
      else alert('אירעה שגיאה, נסה שנית');
    }
  });
}
```

## Array fields (multi-select Pointers)

A field whose name matches `array_<purpose>_Pointer_<TargetTable>` is a Simbla multi-select that stores a Parse `Array` of objectId strings (see the `myb-p-multi-select-field` skill for the schema/form-rendering side).

To populate one of these from a form submission, send a **JSON array of pointer objects** `{"__type":"Pointer","className":"<Target>","objectId":"<id>"}`. A bare-id array is stored too, but the CRM then draws empty chips and `containedIn` trigger criteria do not match it (both stored forms verified 2026-10-09):

```javascript
// In a web2lead body — populating array_interests_Pointer_Interests:
{
  PhoneNumber: '0501234567',
  array_interests_Pointer_Interests: [
    { __type: 'Pointer', className: 'Interests', objectId: 'uNbbHuMGlK' },   // = "טכנולוגיה"
    { __type: 'Pointer', className: 'Interests', objectId: 'j17RjXmHdN' },   // = "ספורט"
  ],
}
```

In `web2table`, prefix with `account_` or `table_` per usual:
```
"account_array_interests_Pointer_Interests": [{"__type":"Pointer","className":"Interests","objectId":"uNbbHuMGlK"}]
"table_array_tags_Pointer_Tags":             [{"__type":"Pointer","className":"Tags","objectId":"GGZUYqBjqT"}]
```

The form-side pattern is typically multiple `<input type="checkbox">` or a `<select multiple>` — collect the chosen values, map each through the lookup `name → objectId` table, wrap each id as a pointer object, and send the resulting array.

If a Pointer lookup misses (user picked something that's not in the static map), the safe behavior is to **omit the field from the body** rather than send `undefined` or an empty string. Filter the data object before posting (the `Object.keys(...).forEach(k => !data[k] && delete data[k])` idiom in the reference snippets handles this).

## Other languages

The shape is identical in every language — POST JSON with the two headers. Templates for PHP, Python, C#, Node.js are in `code/`:

- `code/php.md` — cURL + Guzzle
- `code/python.md` — `requests`
- `code/csharp.md` — `HttpClient`
- `code/nodejs.md` — `fetch` and `axios`

When the user asks for a less common language (Go, Ruby, Java, Kotlin, Swift), translate from the JavaScript reference — the structure, field names, and validation are language-independent; only the HTTP client and JSON serializer change.

## Related

- **`../native-form/GUIDE.md`** / **`../capture-data/GUIDE.md`** — the CRM-hosted alternatives; the comparison table is in `../SKILL.md`.
- **`../csat/GUIDE.md`** — the satisfaction survey, whose web2table variant uses this contract.
- **`myb-p-multi-select-field`** — when the form has a multi-pick lookup that maps to an `array_*_Pointer_*` field. That skill covers the schema/form-rendering side; this skill covers wiring it into a form submission.
- **`myb-p-trigger-setup`** — for what happens *after* the lead/sale lands (auto-email, auto-WhatsApp, status routing). Worth mentioning to the customer when they ask "how do I notify the team when a lead comes in".

## Common pitfalls (in observed frequency order)

- **Reading `resp.success` on `getlead`.** The answer is `{result:{success,leadId}}` — read `resp.result || resp`, or every lead looks failed.
- **Branching on 422 / 403.** Through the gateway every error is HTTP 400 with `{error}`; branch on the message.
- **Sending a formatted phone to `getlead`.** `+972-50-…` defeats duplicate detection; send digits only.
- **Wrapping single Pointer values as `{__type:"Pointer",className,objectId}`.** That's Parse REST; web2lead/web2table want the bare objectId string for a single Pointer. The request succeeds but the field stays null. (Arrays of pointers are the opposite — send objects.)
- **Sending `account_Phone` / `account_Email` instead of unprefixed `phone` / `email` in `web2table`.** The duplicate-detection keys are unprefixed; the prefixed forms may not feed into the lookup. Use unprefixed.
- **Missing `table` field on `web2table`.** HTTP 400 `missing "table" in request body`.
- **Mixing the two endpoints.** `web2lead` does not accept `account_*` / `table_*` prefixes; `web2table` does not accept flat Accounts field names. Choose the endpoint, then use its naming.
- **Using `equalTo`-style filter values for dates.** Dates must be ISO strings; numerics like Unix timestamps get rejected.
- **Sending Boolean `true`/`false` (JS native).** Send the **string** `"true"` / `"false"` — the API parses strings reliably across languages.
- **Forgetting the `X-Parse-Application-Id` header.** Request returns an auth error.
- **Hardcoding `e9TwcETDGq` / `QYvLV9xHE1` without verifying.** Default LeadStatus IDs are documented but customizable; verify the customer has these specific objectIds via Get-Data on `LeadStatuses` before relying on them.
- **Generating code for a field that doesn't exist in the schema.** API silently ignores unknown keys → looks-like-success, but no data lands. Validate before generating.

## MCP and the `Config` gate

The `Config` gate used to be the one step MCP could not do (reads and writes returned `Error: Table is restricted`). It is now reachable: read, create and toggle the flag rows with `Get-Data` / `Create-Data` / `Update-Data` as described in Pre-setup, and diagnose a customer's "the form is refused" by reading the rows yourself. Two things MCP still cannot do here: **delete** a duplicate row (use the grid), and anything on a connection whose MCP version still answers `Table is restricted` (fall back to the grid or MyBusiness support).

## Why this matters

The endpoints are designed for friction-free landing-page integration — no Parse SDK, no master key, no auth dance. The cost of that simplicity is that the API trusts the request shape and silently ignores anything unrecognized. So getting the field names, prefixes, types, and Pointer format right at code-generation time is the difference between "works" and "looks like it works but data is lost." The schema-driven workflow above is what turns this into a deterministic exercise rather than a guessing game.
