# Node.js — web2lead / web2table templates

Node 18+ has global `fetch` — no dependency needed. For older runtimes, `axios` is shown below.

## web2lead — native fetch

```javascript
/**
 * Web2Lead — capture a lead into Accounts.
 * Required: PhoneNumber OR Email.
 */
const APP_ID = '{APP_ID}';
const URL = `https://api.mbapps.co.il/functions/${APP_ID}/web2lead`;

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
  if (res.ok && body.success) return { ok: true, leadId: body.leadId };
  if (res.status === 422)     return { ok: false, error: 'missing phone/email' };
  if (res.status === 403)     return { ok: false, error: 'web leads disabled' };
  return { ok: false, error: 'server error', raw: body };
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

  if (!data.phone && !data.email && !data.idnum) {
    return { ok: false, error: 'phone, email, or idnum required' };
  }

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Parse-Application-Id': APP_ID },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  return res.ok && body.success
    ? { ok: true, accountId: body.accountId, id: body.Id }
    : { ok: false, status: res.status, raw: body };
}
```

## Axios alternative

```javascript
import axios from 'axios';

const res = await axios.post(
  `https://api.mbapps.co.il/functions/${APP_ID}/web2lead`,
  data,
  { headers: { 'X-Parse-Application-Id': APP_ID } }   // axios sets Content-Type for JSON automatically
);
// res.data === { success: true, leadId: '...' }
```

## Express middleware sketch (server-side forwarder)

```javascript
import express from 'express';
const app = express();
app.use(express.json());

app.post('/lead', async (req, res) => res.json(await submitLead(req.body)));
app.listen(3000);
```

Pointer values are bare 10-character objectId strings. Never wrap.
