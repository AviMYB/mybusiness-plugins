# capture-data — a public form into a table that stays closed

The same native Database form as `../native-form/GUIDE.md`, with one attribute changed: `data-use-caputure-data="true"` (the misspelling is the platform's — copy it exactly). Instead of saving as the anonymous visitor, the form hands the fields to the server function `simbla-capture-data`, which saves them **with the master key**. The table's permissions never open. A `Config` row per target table tells the function which fields are required, how to recognise a duplicate, and which defaults to apply.

Fact source: KB `30-customization/15-public-forms.md` §4 (every behaviour below measured live).

## When to choose it over the open intake table

| Choose capture-data when | Stay with the open intake table when |
|---|---|
| the table must stay closed — a lead table, a registration table the staff already work in | a dedicated intake table is fine |
| duplicates must be flagged on arrival (same email / phone already there) | duplicates do not matter |
| the server must enforce required fields (not only the browser) | browser `required` is enough |
| defaults must be stamped server-side (`Source = public-form`) | defaults can come from hidden fields |

It still **creates only** — a duplicate is a new row flagged as a duplicate, never a merge or an update.

## Step 1 — the `Config` row

`Config` is reachable from MCP. One row per target table:

```json
Create-Data(table: "Config", data: {
  "Name":  "CaptureData<Table>",
  "Value": {
    "requiredFields":          ["Email"],
    "checkForDuplicateFields": ["Email", "PhoneNumber"],
    "setOnDuplicate":          { "field": "IsDuplicate", "value": true },
    "duplicatePointerField":   "DuplicateOf",
    "defaultValues":           [ { "field": "Source", "value": "public-form" } ]
  }
})
```

| Key | Effect | Without it |
|---|---|---|
| (the row itself) | the function accepts the table | `"missing config for table <T>"` — nothing saved |
| `requiredFields` | refuses a submission missing any of them (`"Missing <Field>"`) | no server-side required check |
| `checkForDuplicateFields` | looks for an existing row **in the same table** with an equal value in any of these fields; `PhoneNumber` is compared by digits only (`050-111-2222` = `0501112222`) | no duplicate check |
| `setOnDuplicate` | on a duplicate, sets `{field: value}` on the new row | — |
| `duplicatePointerField` | on a duplicate, points the new row at the existing one (a Pointer to the same table) | — |
| `defaultValues` | sets each field only when the submission did not carry it | — |

Before writing: `Get-Data(table:"Config", where:{"Name":"CaptureData<Table>"})` — keep exactly one row per table. `Config` is shared by other integrations; touch only your row and never echo other rows' values. Read the row back after writing.

Create the fields the config names (`IsDuplicate` Boolean, `DuplicateOf` Pointer → the same table, `Source` String) with `Add-Field-to-Table` first.

**Lead intake straight into `Accounts`** (a lead is an Account with `IsAccount:false`) follows the same grammar — a row `CaptureDataAccounts` whose `defaultValues` set `IsAccount` to `false` and `LeadStatusId` to the tenant's "new lead" status (a Pointer object `{"__type":"Pointer","className":"LeadStatuses","objectId":"<id>"}`), and whose `setOnDuplicate` sets `LeadStatusId` to the "duplicate lead" status. Read both ids from `LeadStatuses` first. ⚠️ This exact configuration was not exercised in the lab (the lab used a dedicated table) — `Accounts` carries the tenant's own triggers, so test it on a test tenant before a customer's.

## Step 2 — the form

Build the page and form exactly as `../native-form/GUIDE.md` Steps 4–7, with two differences:

1. `data-use-caputure-data="true"` on the `<form>`.
2. **The invisible reCAPTCHA**: `<div class="g-recaptcha-invisible"></div>`. The visible checkbox fails here with "using invalid captcha keys" — the function verifies with the invisible key.

The table's CLP stays as it is (staff only). Do **not** add `"*"` anywhere.

## Step 3 — verify

| # | Test | Expect |
|---|---|---|
| 1 | Logged-out submission with all fields | row created; `Source` default applied; `createdBy = Master` |
| 2 | Same email again | new row with `IsDuplicate = true` and `DuplicateOf` → the first row |
| 3 | Same phone in another format, different email | flagged as duplicate (digit match) |
| 4 | Submission without a required field (remove `required` in the browser to send it) | error "Missing <Field>", no row |
| 5 | **Negative:** tokenless `POST /parse/functions/run_function` with `functionName:"simbla-capture-data"` | `missing captcha` |
| 6 | **Negative:** tokenless `POST /parse/classes/<Table>` | refused (the table is closed) |
| 7 | **Negative:** the table's CLP after the build (`Get-Table-Permissions`) | unchanged — no `"*"` |

## Traps

- **Visible widget = every submission fails.** Invisible only.
- **No `Config` row = every submission fails** with "missing config for table". The `Leads` table alone has a built-in default; every other table needs a row.
- **Rows are stamped `createdBy = Master`**, not `Public` — mark public submissions with a default (`Source`) if reports must tell them apart.
- **After the save the form holds the server's object** (new id, possibly another class) — code listening to `simbla-object-saved` must re-read `data.obj`.
- **Duplicates are still inserted.** Merge or close them with a trigger or by hand; the config only flags them.
- **Empty strings are dropped** before saving — an empty optional field leaves the column unset rather than "".
