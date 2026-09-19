# Web2Lead / Web2Table — External Form → CRM Intake

> **Purpose**: Complete mechanics of capturing external HTML forms (landing pages, registration forms, partner systems) into MyBusiness CRM via the `web2lead` and `web2table` cloud functions — endpoints, field naming, pointer handling, duplicate detection, config gates, and production-ready code.
> **Last updated**: 2026-08-10 (§11 anonymous-write security model added — CAPTCHA gate, CLP bypass, create-only) · **Status**: draft

---

## 1. The two endpoints

| Endpoint | Creates | Use when |
|---|---|---|
| **`web2lead`** | A new row in `Accounts` with `IsAccount: false` (= Lead) | Form captures a contact only |
| **`web2table`** | A row in ANY target table (Sales, Cases, Orders, custom…) **plus** an Account if the contact is new (existing contact is reused, not duplicated) | Form must create a linked record tied to a contact |

```
POST https://api.mbapps.co.il/functions/{appId}/web2lead
POST https://api.mbapps.co.il/functions/{appId}/web2table
Content-Type: application/json
X-Parse-Application-Id: {appId}
```

- No master key, no session, no SDK — by design these are safe to call from browser JavaScript. The `appId` is a public identifier, **not** a secret; the security gate is the per-app Config toggle (below) + server-side validation.
- "`web2sale`", "`web2case`", "`web2contact`" in customer parlance are **not separate endpoints** — they are `web2table` with `table: "Sales"` / `"Cases"` / etc.
- Customer-forked variants exist as separate deployed functions (e.g. a `web-to-sale` fork) — same pattern, customer-specific logic baked in (see [04-cloud-functions.md](04-cloud-functions.md)).

## 2. Config gates (one-time setup per customer)

Both endpoints are gated by rows in the system **`Config`** table (`Name` is the lookup key; `Value` is an Object whose inner boolean is the actual switch):

| Endpoint | Config row `Name` | `Value` shape | Evidence |
|---|---|---|---|
| `web2lead` | `AcceptWebLeads` | `{ "AcceptWebLeads": true }` | deployed `getLead/index.js` reads exactly this row |
| `web2table` | `AcceptWebToTable` | `{ "AcceptWebToTable": true, "ValidatePhoneOrEmail": …, "DefaultValues": { "Account": {…}, "Table": {…} } }` | deployed `web2table/index.js` reads `AcceptWebToTable` |

⚠️ Discrepancy note: the skill doc (2026-05-19) describes `AcceptWebLeads` as gating **both** endpoints; the deployed `web2table` source reads **`AcceptWebToTable`**. When debugging a 403, check **both** rows.

Additional knobs inside the Config `Value` (from deployed code):

- `ValidatePhoneOrEmail` (both endpoints): when true, the server rejects (422) submissions whose phone (digits only, 7–14 chars) AND email (6–80 chars, contains `@` + `.`) are both invalid.
- `DefaultValues.Account` / `DefaultValues.Table` (`web2table`): server-side default field values applied to newly created Accounts / target-table rows when the request didn't set them (Pointers as 10-char ids, Boolean strings coerced).

**The `Config` table is fully restricted from MCP** (`Get-Data`/`Create-Many` → `Error: Table is restricted`). To enable/verify, either use the CRM Settings UI toggle, or master-key REST:

```http
# verify
GET https://api.mbapps.co.il/parse/classes/Config?where={"Name":"AcceptWebLeads"}
X-Parse-Application-Id: {appId}
X-Parse-Master-Key: {masterKey}

# create
POST https://api.mbapps.co.il/parse/classes/Config
{ "Name": "AcceptWebLeads", "Value": { "AcceptWebLeads": true } }
```

If multiple rows with the same `Name` exist (seen in practice), verify which one the function reads (the code uses `query.first()` — effectively the oldest/unspecified order); a stale `false` row can shadow a `true` one. A 403 on first call after deployment is almost always this toggle, not the code.

## 3. `web2lead` reference

**Required**: at least one of `PhoneNumber` or `Email` (server returns 422 otherwise, when `ValidatePhoneOrEmail` is on).

**Field naming**: NO prefix — keys must match the `Accounts` schema verbatim (`Name`, `F_name`, `L_name`, `PhoneNumber`, `Email`, `Address`, `City`, `CompanyId`, custom fields…). Unknown keys are **silently ignored** (the server iterates the schema: `if (accountSchema.fields[k]) …`).

**Protected fields** (stripped/overridden by the server — from deployed code): `LeadStatusId` (set by duplicate logic; overridable for NEW leads via request body), `IsAccount` (always `false`), `objectId`, `createdAt`, `updatedAt`, `ACL`, `createdBy`, `updatedBy`. The skill also lists `fromWeb2lead: true` as auto-set — ⚠️ UNVERIFIED in the repo code version (not present in `getLead/index.js`); possibly set by a newer production build.

**Duplicate detection** (server-side, from deployed code):
- Phone is normalized (strip non-digits, `972…`→`0…`) and the server queries `Accounts.PhoneNumber` for ALL of: `05XXXXXXXX`, `9725XXXXXXX`, `+9725XXXXXXX`, `05X-XXXXXXX`, `+972-5X-XXXXXXX` (analogous for landline `0X…` prefixes) — OR'ed with `Accounts.Email == <email>`.
- A duplicate does **not** block creation: a NEW lead row is **always created**; if a match exists, the new row gets the "duplicate lead" status `QYvLV9xHE1`; if no match, it gets the request's `LeadStatusId` or the default new-lead status `e9TwcETDGq`.
- These two objectIds are template defaults — **verify against the customer's `LeadStatuses` table** (Get-Data) before relying on them; customized installs differ.

**Type coercion** (server-side, per schema type): Pointer ← 10-char id string; Boolean ← `"true"`/`"false"` strings; Date ← ISO string ≥10 chars (`new Date(v)`).

**Response**:

| Status | Body / meaning |
|---|---|
| 200 | `{ "success": true, "leadId": "<objectId>" }` |
| 422 | missing/invalid `PhoneNumber` + `Email` |
| 403 | `AcceptWebLeads is Disabled` |
| 500 | server error |

## 4. `web2table` reference

```json
POST https://api.mbapps.co.il/functions/{appId}/web2table
{
  "table": "Sales",
  "phone": "0501234567",
  "email": "x@y.co.il",
  "account_Name": "ישראל ישראלי",
  "account_City": "תל אביב",
  "table_Title": "פנייה מדף נחיתה",
  "table_Amount": 1500,
  "table_SaleStatusId": "zrP1MSVBoq"
}
```

**Required** (per deployed code): `table` (exact class name) and **`phone`** — the code returns 422 `missing "phone"` when phone is absent. ⚠️ The skill documents "one of phone/email/idnum"; the repo code hard-requires `phone`. Safest integration contract: **always send `phone`**; treat email/idnum as additional lookup keys.

**Field-name buckets**:

| Bucket | Prefix | Examples | Server behavior |
|---|---|---|---|
| Lookup keys | none | `phone`, `phone2`, `email`, `email2`, `idnum`, `table` | drive duplicate detection; `phone`→`Accounts.PhoneNumber`, `email`→`Accounts.Email`, `idnum`→`Accounts.CompanyId` on new contacts |
| Accounts fields | `account_` | `account_Name`, `account_F_name`, `account_CompanyId`, `account_IsAccount` | applied ONLY when a new Account is created (existing Accounts are **not updated** by this endpoint) |
| Target-table fields | `table_` | `table_Title`, `table_Amount`, `table_SaleStatusId` | applied to the new row, schema-validated |
| Top-level row extras | none | `Name`, `CampaignName`, `PageName`, `isExistsAccountCheck` | see auto-set fields below |

**Duplicate detection**: same multi-format phone OR email OR `CompanyId`(idnum) query as web2lead, plus `phone2`/`email2` secondary keys. Customer forks add fields (e.g. one customer matches `PhoneNumberHusband/Wife`, `EmailHusband/Wife`; another matches idnum against `ID` instead of `CompanyId`).

**Auto-set fields on the created target-table row** (deployed code):

| Field | Value |
|---|---|
| `AccountId` | Pointer to the found-or-created Account |
| `IsFirst` | `true` for a new Account; `false` only when the Account existed AND the request sent `isExistsAccountCheck: true` |
| `Name` | request `Name`, else `"פניה ראשונה"` (new) / `"פניה חוזרת"` (returning + isExistsAccountCheck) |
| `CampaignName` / `PageName` | request value, else `"MainLandingPage"` |
| `PhoneNumber`, `Email` | copied from the Account |
| `AccountNotExist` | `true` unless the matched Account is a real customer (`IsAccount==true`) — behavior seen in some customer forks |

**Protected** (ignored if sent with prefixes): `account_LeadStatusId`, `account_IsAccount` is allowed-but-special (below), `AccountId`, `SaleStatusId` (table bucket), and all system fields.

**Special behaviors**:
- `account_IsAccount: "true"` (string!) — create the new contact as a **Customer** instead of a Lead.
- Pointer values: bare 10-character objectId strings. A pointer value whose length ≠ 10 is **dropped** for table fields.
- Booleans as strings `"true"`/`"false"`; Numbers may be stringified (server coerces); Dates as flat ISO strings ≥10 chars (NOT Parse `{__type:"Date"}` objects).

**Response**:

| Status | Body |
|---|---|
| 200 | `{ "returnOrigin": true, "success": true, "accountId": "<objectId>", "Id": "<objectId of target row>" }` |
| 422 | `missing "phone"` / `missing "table" in request body` / invalid phone+email |
| 403 | `AcceptWebToTable is Disabled` |
| 500 | server error |

## 5. Type-mapping table (JSON body, both endpoints)

| Schema type | Send | Never send |
|---|---|---|
| String | string | |
| Number | number or numeric string | |
| Boolean | `"true"` / `"false"` strings (safest cross-language) | |
| Date | flat ISO string, ≥10 chars (`"2026-06-10"` or full ISO) | Parse `{__type:"Date",iso}` object |
| Pointer | bare 10-char objectId string | `{__type:"Pointer",className,objectId}` — silently leaves the field null |
| Array (multi-select `array_*_Pointer_*`) | JSON array of bare objectId strings | wrapped pointer objects |
| File / PrivateFile | **not supported** in this flow | |

The Pointer rule is the #1 gotcha: Parse REST uses the wrapped form, web2lead/web2table want the bare id. Copying a Parse-REST snippet by reflex produces a 200 response with a null pointer field.

## 6. Mandatory pre-code workflow (schema-driven, per customer)

You cannot produce correct code from memory — schemas differ per customer and the API silently ignores unknown keys:

1. `Get-Schema` on `Accounts`.
2. `Get-Schema` on the target table (web2table).
3. `Get-Data` on every Pointer's `targetClass` the form populates → build the `display-value → objectId` map (e.g. `Get-Data(table:"LeadSource", keys:["Name"], limit:200)`).
4. (web2lead with custom status) `Get-Data` on `LeadStatuses` to confirm the objectId.
5. Validate every requested form field against the schema; flag misses BEFORE generating.

Emit the pointer map as a static lookup in the code; the form `<select>` submits the display value and the code translates to objectId before POSTing. Omit unmapped/empty fields from the body entirely (don't send `""`/`null`).

## 7. Reference code — JavaScript (browser)

```javascript
// web2lead — required: PhoneNumber OR Email
const APP_ID = '{APP_ID}';
// const sourceMapping = { "פייסבוק": "vOZLqOWnQf", "גוגל": "fHG8Rgy8Hr" }; // from Get-Data on LeadSource

async function submitLead(form) {
  const data = {
    PhoneNumber: form.phone,
    Email:       form.email,
    Name:        form.fullName,
    City:        form.city,
    // LeadSourceId: sourceMapping[form.source],   // bare 10-char objectId
    // LeadStatusId: 'e9TwcETDGq',                 // custom NEW-lead status — verify first
  };
  Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });
  if (!data.PhoneNumber && !data.Email) return alert('נא למלא טלפון או אימייל');

  const res = await fetch(`https://api.mbapps.co.il/functions/${APP_ID}/web2lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Parse-Application-Id': APP_ID },
    body: JSON.stringify(data),
  });
  if (res.ok) { const b = await res.json(); console.log('Lead:', b.leadId); /* redirect / GTM event */ }
  else if (res.status === 422) alert('נא למלא טלפון או אימייל תקינים');
  else if (res.status === 403) alert('קבלת לידים מהאתר אינה מופעלת במערכת');
  else alert('אירעה שגיאה, נסה שנית');
}
```

```javascript
// web2table — required: table + phone
async function submitSale(form) {
  const data = {
    table: 'Sales',
    phone: form.phone,                       // unprefixed lookup key
    email: form.email,
    account_Name:      form.fullName,        // Accounts bucket
    account_City:      form.city,
    // account_IsAccount: 'true',            // string — create as Customer, not Lead
    table_Title:       form.saleTitle,       // target-table bucket
    table_Amount:      form.amount,
    table_ClosingDate: form.closingDate,     // flat ISO string
    // table_SaleStatusId: statusMapping[form.status],
  };
  Object.keys(data).forEach(k => { if (data[k] == null || data[k] === '') delete data[k]; });

  const res = await fetch(`https://api.mbapps.co.il/functions/${APP_ID}/web2table`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Parse-Application-Id': APP_ID },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  // body = { success, accountId, Id }
  return body;
}
```

## 8. Reference code — Python (server-side forwarder)

```python
import requests

APP_ID = "{APP_ID}"
HEADERS = {"Content-Type": "application/json", "X-Parse-Application-Id": APP_ID}

def submit_lead(form: dict) -> dict:
    data = {
        "PhoneNumber": form.get("phone"),
        "Email":       form.get("email"),
        "Name":        form.get("full_name"),
        "City":        form.get("city"),
        # "LeadSourceId": SOURCE_MAP.get(form.get("source")),
    }
    data = {k: v for k, v in data.items() if v}
    if not data.get("PhoneNumber") and not data.get("Email"):
        return {"ok": False, "error": "phone or email required"}

    r = requests.post(f"https://api.mbapps.co.il/functions/{APP_ID}/web2lead",
                      json=data, headers=HEADERS, timeout=10)
    if r.status_code == 200 and r.json().get("success"):
        return {"ok": True, "leadId": r.json()["leadId"]}
    if r.status_code == 422: return {"ok": False, "error": "missing phone/email"}
    if r.status_code == 403: return {"ok": False, "error": "web leads disabled"}
    return {"ok": False, "error": "server error", "raw": r.text}

def submit_sale(form: dict) -> dict:
    data = {
        "table": "Sales",
        "phone": form.get("phone"),
        "email": form.get("email"),
        "account_Name": form.get("full_name"),
        "table_Title":  form.get("sale_title"),
        "table_Amount": form.get("amount"),
    }
    data = {k: v for k, v in data.items() if v not in (None, "")}
    r = requests.post(f"https://api.mbapps.co.il/functions/{APP_ID}/web2table",
                      json=data, headers=HEADERS, timeout=10)
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code == 200 and body.get("success"):
        return {"ok": True, "accountId": body["accountId"], "id": body["Id"]}
    return {"ok": False, "status": r.status_code, "raw": body or r.text}
```

PHP (cURL + Guzzle), C# (`HttpClient`), and Node (`fetch`/axios + Express forwarder) templates follow the same shape — it is language-independent, only the HTTP client changes. The `myb-p-web2lead-web2table` skill carries ready templates per language.

## 9. Multi-select (Array-of-Pointer) fields

Fields named `array_<purpose>_Pointer_<TargetTable>` store an Array of bare objectId strings. Submit a JSON array (no wrapping):

```json
{ "PhoneNumber": "0501234567",
  "array_interests_Pointer_Interests": ["uNbbHuMGlK", "j17RjXmHdN"] }
```

In `web2table`, prefix per bucket: `account_array_interests_Pointer_Interests`, `table_array_tags_Pointer_Tags`. Form side: checkboxes / `<select multiple>` → map each picked display value through the lookup table → send the array. If a lookup misses, **omit the field** rather than sending undefined/empty.

## 10. Validation, CORS, anti-spam

- **CORS**: allowed by default for these endpoints (Parse cloud-function CORS); nearly all landing pages are cross-origin and work. If a customer reports a blocked request, check CORS first, then the Config toggle.
- **Captcha/anti-bot** (reCAPTCHA, Turnstile, honeypots): NOT validated by the endpoints — validate tokens on your own server BEFORE forwarding to web2lead/web2table. A server-side forwarder (Flask/Express/PHP) is the recommended pattern when captcha or secret keys are involved.
- **Server-side validation performed**: phone 7–14 digits / email sanity (only when `ValidatePhoneOrEmail` is on), schema-existence of every field, pointer id length. Everything else is the form's responsibility.
- **appId exposure** in browser JS is intentional and safe — it is not a credential. Reassure customers who panic about it.

## 11. The anonymous-write security model (why these endpoints are the only door)

Verified empirically on a live tenant (2026-08-09) while building an anonymous public rating page. Three facts that together decide the architecture of any "unauthenticated visitor writes to the CRM" feature:

1. **Direct anonymous Parse REST writes are CAPTCHA-gated — opening the CLP does not help.** A `POST /parse/classes/<Table>` with only `X-Parse-Application-Id` (no session, no master key) is rejected with `{"code":119,"error":"This action is not allowed without a valid CAPTCHA"}` **even after** the class-level permission is set to `create: {"*": true}`. The CAPTCHA gate sits in front of the CLP check, so widening the CLP buys nothing and only widens exposure. Anyone who "fixes" an anonymous 403/119 by opening a CLP has made the tenant less safe without making the write work.
2. **`web2table` runs elevated and bypasses CLP.** It successfully created rows in a table whose CLP was `create: role:Admin`. Consequence: **keep the target table's CLP closed.** The endpoint is the approved anonymous write path precisely because it is a server-side function with its own validation — the table does not need public permissions, and giving it any is pure downside.
3. **`web2table` is create-only.** It has no update semantics: passing `objectId` / `table_objectId` does not address an existing row — every call inserts. There is no anonymous update path at all (an anonymous `PUT` on an existing row is likewise rejected). So "let the customer update an existing record from a public link" cannot be built directly; it must be **staging-table + projection trigger**: the public page creates a row in a dedicated intake table, and a data-change trigger on that table projects the values onto the real business object (`update-object` with `connection: "source.<PointerField>"`). This also keeps the business table closed to anonymous writes, which was verified rejected.

Corollaries an implementer should carry into design:
- The intake link must carry `phone` (§4 — hard-required), which means a customer phone number travels in a URL and lands in server logs. That is a privacy decision to surface with the customer, not to hide; the alternative is an opaque per-record token column looked up server-side.
- Because every call inserts, a two-step interaction (rate now, comment a moment later) produces **two intake rows** for one response. That is correct behavior, not a bug — the intake table is the raw journal and the business object holds the resolved answer. Document it, or someone will "fix" it later.
- Any trigger that reacts to the *first* call will run **before** the second call's data exists. Don't compose a message/task body out of a field that arrives in the later call — point the reader at the record instead (see [../30-customization/06-triggers-and-automations.md](../30-customization/06-triggers-and-automations.md)).

## Limitations & gotchas (observed frequency order)

- **Wrapped Pointer objects** instead of bare objectIds → 200 OK, field silently null.
- **Trying to reach the API anonymously without `web2lead`/`web2table`** → `code 119` CAPTCHA rejection; widening the CLP does not lift it (§11).
- **Opening a target table's CLP "so web2table can write"** → unnecessary (it bypasses CLP) and a real exposure increase (§11).
- **Expecting `web2table` to update an existing row** → it always inserts; use staging-table + projection trigger (§11).
- **`account_Phone`/`account_Email` instead of unprefixed `phone`/`email`** in web2table → duplicate detection misses; contact duplicated.
- **Missing `table`** on web2table → 422.
- **Mixing endpoint dialects**: web2lead takes flat Accounts field names; web2table takes `account_`/`table_` prefixes. Never both in one body.
- **Native booleans** can misbehave — send string `"true"`/`"false"`.
- **Missing `X-Parse-Application-Id` header** → auth error.
- **Hard-coding `e9TwcETDGq`/`QYvLV9xHE1`** without verifying against the customer's `LeadStatuses`.
- **Unknown field names are silently dropped** — looks-like-success, data lost. Schema-validate at generation time.
- **Existing Accounts are not updated** by web2table — `account_*` values only apply to newly created contacts. If the business wants "update returning contacts", that requires Parse REST or a custom function.
- **web2lead always inserts** — duplicates become new lead rows flagged with the duplicate status; there is no merge.
- **`IsFirst` semantics** depend on the request flag `isExistsAccountCheck` — without it, every row is marked `IsFirst: true`.
- **Config gate unreachable from MCP** — a 403 cannot be diagnosed via MCP tools; needs CRM UI or master-key REST (documented MCP gap as of 2026-05-19).
- **File uploads not supported** in this flow — use a different upload path and link afterwards.
- Customer forks of these functions exist with hard-coded appId behavior switches — when supporting a specific customer, read THEIR deployed variant before assuming the generic contract.
