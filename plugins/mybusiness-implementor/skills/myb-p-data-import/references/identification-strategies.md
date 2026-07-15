# Identification Strategies

How to match file rows to existing CRM Accounts, ordered from most to least reliable.

## Table of Contents
1. [Strategy 1: Direct ObjectId](#strategy-1-direct-objectid)
2. [Strategy 2: Email Match](#strategy-2-email-match)
3. [Strategy 3: Phone Match](#strategy-3-phone-match)
4. [Strategy 4: Name Fallback](#strategy-4-name-fallback)
5. [Strategy 5: Create New (Leads)](#strategy-5-create-new-leads)

---

## Strategy 1: Direct ObjectId

**When:** File has a column like `AccountId.objectId` containing 10-character Parse objectIds.

**Reliability:** Perfect — no ambiguity.

**Process:**
1. Extract all unique objectIds from the file
2. Verify they exist: `Get-Data` on Accounts with `{"objectId": {"$in": [allIds]}}`, limit=2000
3. Compare found count to expected count
4. Create records directly using verified objectIds

**Example query:**
```json
{"objectId": {"$in": ["EVMrWVw9Gk", "FdPO1MSsyT", "vDCFbgAVyf"]}}
```

**Batch size:** `$in` can handle up to 200 IDs safely since objectIds return exactly one result each.

---

## Strategy 2: Email Match

**When:** File has a מייל/email column.

**Reliability:** High — emails are mostly unique per account.

**Process:**
1. Extract unique emails, normalize (trim whitespace, check for data quality issues)
2. Search in batches of 20: `{"Email": {"$in": [batch]}}`
3. Verify found count matches expected
4. If count is off, fall back to individual searches

**Critical pitfall — $in silent truncation:**
When using `$in` with emails, if ANY single email matches many accounts (e.g., generic emails like `info@company.com`), Parse returns those first and may consume the entire result limit, silently dropping results for other emails in the batch.

**How to detect:** Compare the number of unique emails found vs. emails searched. If the numbers don't match, some were silently dropped.

**How to fix:** Search individually for any batch where the count doesn't match:
```json
// Instead of $in with 20 emails, search one by one:
{"Email": "specific@email.com"}
```

**Data quality issues seen in practice:**
- Extra quotes: `'yonathan.david1@gmail.com'` — strip quotes before searching
- Invalid domains: `edri.lea@il/zim.com` — flag as error, skip
- Case sensitivity: Parse Email field may be case-sensitive — search with exact case from file

---

## Strategy 3: Phone Match

**When:** File has a טלפון/מספר טלפון column.

**Reliability:** Medium-High — phones are unique but stored in inconsistent formats.

### Phone Normalization

Israeli phone numbers appear in many formats in source files:

| Raw Format | After Normalization |
|---|---|
| `052-6281228` | `526281228` |
| `0524025858` | `524025858` |
| `052-6281228  ליסה` | `526281228` |
| `+972 54-922-5227` | `549225227` |
| `⁦+972 52-407-2244⁩` | `524072244` |
| `526268026` | `526268026` |
| `52-287-4434 - רונית` | `522874434` |
| `+1 (917) 8535630` | `178535630` (non-Israeli) |

**Normalization algorithm:**
```javascript
function normalizePhone(raw) {
  // 1. Strip ALL non-digit characters (including Unicode markers)
  let digits = raw.replace(/[^0-9]/g, '');
  
  // 2. Remove country code
  if (digits.startsWith('972')) digits = digits.slice(3);
  if (digits.startsWith('1') && digits.length === 11) digits = digits.slice(1); // US +1
  
  // 3. Remove leading zero
  if (digits.startsWith('0')) digits = digits.slice(1);
  
  // 4. Take last 9 digits if still too long
  if (digits.length > 9) digits = digits.slice(-9);
  
  return digits; // Should be 9 digits for Israeli phones
}
```

### Search Strategy

CRM phones are ALSO stored in inconsistent formats (with dashes, spaces, text annotations). Use regex to match the normalized 9-digit core anywhere in the stored value:

```json
{"PhoneNumber": {"$regex": "526281228"}}
```

**Batch with $or (15 phones per query):**
```json
{
  "$or": [
    {"PhoneNumber": {"$regex": "526281228"}},
    {"PhoneNumber": {"$regex": "503338543"}},
    {"PhoneNumber": {"$regex": "524025858"}}
  ]
}
```

Limit batch size to 15 phones per `$or` query to avoid result truncation (same issue as `$in` with emails, but less common with phones).

### Mapping results back

When results come back, map each result to its source phone:
```javascript
for (const account of results) {
  const storedDigits = account.PhoneNumber.replace(/[^0-9]/g, '');
  for (const phone of batchPhones) {
    if (storedDigits.includes(phone)) {
      phoneToAccount.set(phone, account.objectId);
    }
  }
}
```

### When multiple accounts match the same phone

If a phone number matches multiple accounts, prefer the most recently updated one (`order: "-updatedAt"`).

---

## Strategy 4: Name Fallback

**When:** Phone search failed for some entries, or file only has names.

**Reliability:** LOW — use only as a last resort and warn the user about potential mismatches.

**Process:**
1. Extract last name from the full name in the file
2. Search: `{"L_name": {"$regex": "lastName", "$options": "i"}}`
3. If found, compare the FULL name from the file with the FULL name in the CRM
4. Flag any mismatch where first names differ

**Known false positive patterns:**
- Common last names (כהן, לוי, מזרחי) match dozens of unrelated accounts
- Similar last names match incorrectly: "בן דור" matches "דורון", "פרי" matches "פרידמן"
- Same family, different person: "גל דיקשטיין" matches "אורן דיקשטיין"

**Recommendation:** When using name fallback, generate a review Excel file showing: file name, CRM match name, match type. Let the user verify questionable matches before creating records.

---

## Strategy 5: Create New (Leads)

**When:** File contains new leads not yet in the CRM. Usually identified by two-sheet structure (ליד + מכירה).

**Process:**
1. Create Account records with `IsAccount: false`
2. Use Create-Many for batch creation
3. Collect returned objectIds
4. Create linked Sales using those objectIds

**Required fields for new lead:**
```json
{
  "Name": "full name",
  "F_name": "first",
  "L_name": "last",
  "PhoneNumber": "phone",
  "Short": "brief description",
  "IsAccount": false,
  "LeadStatusId": {"__type": "Pointer", "className": "LeadStatuses", "objectId": "..."},
  "C_LeadSource": {"__type": "Pointer", "className": "C_LeadSourceList", "objectId": "..."},
  "LeadOwnerId": {"__type": "Pointer", "className": "_User", "objectId": "..."},
  "NewCoordinator": {"__type": "Pointer", "className": "_User", "objectId": "..."},
  "OwnerId": {"__type": "Pointer", "className": "_User", "objectId": "..."}
}
```
