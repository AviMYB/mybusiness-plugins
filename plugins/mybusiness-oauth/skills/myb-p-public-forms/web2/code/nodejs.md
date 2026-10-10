# Node.js — web2lead / web2table templates

Node 18+ has global `fetch` — no dependency needed. For older runtimes, `axios` is shown below.

## web2lead — native fetch

```javascript
/**
 * Web2Lead — capture a lead into Accounts.
 * Required: PhoneNumber OR Email.
 */
const APP_ID = '{APP_ID}';
const URL = `https://api.mbapps.co.il/functions/${APP_ID}/getlead`;

// const sourceMap = { Google: 'abc1234567', Facebook: 'def1234567' };

async function submitLead(form) {
  const data = {
    PhoneNumber: form.phone,
    Email:       form.email,
    Name:        form.fullName,
    F_name:      form.firstName,
    L_name:      form.lastName,
    City:        form.city,
    // LeadSourceId: sourceMap[form.source],
    // LeadStatusId: 'e9TwcETDGq',   // verify via Get-Data on LeadStatuses
  };
  Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });
  // digits only - getlead expands phone formats for duplicate detection only for a digits-only value
  if (data.PhoneNumber) data.PhoneNumber = String(data.PhoneNumber).replace(/\D/g, '');

  if (!data.PhoneNumber && !data.Email) {
    return { ok: false, error: 'phone or email required' };
  }

  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': APP_ID,
    },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  const r = body.result || body;          // getlead wraps its answer: { result: { success, leadId } }
  if (res.ok && r.success) return { ok: true, leadId: r.leadId };
  // errors arrive as HTTP 400 { error: "<message>" } - branch on the message, not the status
  return { ok: false, error: body.error || 'server error', raw: body };
}
```

## web2table — native fetch

```javascript
const APP_ID = '{APP_ID}';
const URL = `https://api.mbapps.co.il/functions/${APP_ID}/web2table`;

async function submitSale(form) {
  const data = {
    table: 'Sales',
    phone: form.phone,
    email: form.email,

    account_Name:      form.fullName,
    account_CompanyId: form.companyId,
    account_City:      form.city,
    // account_IsAccount: 'true',   // string, not boolean — create as Customer

    table_Title:       form.saleTitle,
    table_Amount:      form.amount,            // Number — string ok
    table_ClosingDate: form.closingDate,       // ISO date string
    // table_SaleStatusId: statusMap[form.status],
  };
  Object.keys(data).forEach(k => { if (data[k] == null || data[k] === '') delete data[k]; });

  if (!data.phone) {
    return { ok: false, error: 'phone is required' };   // web2table answers missing "phone" without it
  }

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Parse-Application-Id': APP_ID },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  return res.ok && body.success
    ? { ok: true, accountId: body.accountId, id: body.Id }
    : { ok: false, error: body.error || 'server error', raw: body };   // 400 { error: "<message>" }
}
```

## Axios alternative

```javascript
import axios from 'axios';

const res = await axios.post(
  `https://api.mbapps.co.il/functions/${APP_ID}/getlead`,
  data,
  { headers: { 'X-Parse-Application-Id': APP_ID } }   // axios sets Content-Type for JSON automatically
);
// getlead: res.data === { result: { success: true, leadId: '...' } }   web2table: { success, accountId, Id }
```

## Express middleware sketch (server-side forwarder)

```javascript
import express from 'express';
const app = express();
app.use(express.json());

app.post('/lead', async (req, res) => res.json(await submitLead(req.body)));
app.listen(3000);
```

Single Pointer values are bare 10-character objectId strings - never wrapped. Arrays of pointers (`array_*_Pointer_*`) are the exception: send pointer objects (see `../GUIDE.md` Array fields).
