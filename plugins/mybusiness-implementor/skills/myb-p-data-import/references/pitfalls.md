# Pitfalls and Lessons Learned

Critical issues encountered during real data import operations and how to avoid them.

## Table of Contents
1. [$in Query Silent Truncation](#1-in-query-silent-truncation)
2. [Phone Number Normalization Failures](#2-phone-number-normalization-failures)
3. [Name Search False Positives](#3-name-search-false-positives)
4. [Get-all-Users 100-Record Limit](#4-get-all-users-100-record-limit)
5. [Email Data Quality Issues](#5-email-data-quality-issues)
6. [Duplicate Rows in Source Files](#6-duplicate-rows-in-source-files)
7. [Create-Many Batch Size Limits](#7-create-many-batch-size-limits)
8. [Accidental Record Creation with Bad Data](#8-accidental-record-creation-with-bad-data)
9. [Date Format Confusion (DD/MM vs MM/DD)](#9-date-format-confusion)
10. [Unicode Direction Markers in Phone Numbers](#10-unicode-direction-markers)

---

## 1. $in Query Silent Truncation

**The problem:** When using `{"Email": {"$in": [20 emails]}}` and one of those emails (e.g., `info@company.co.il`) exists on 100+ accounts, the Parse query returns those 100+ results first, consuming the entire `limit` parameter. Results for the other 19 emails are silently dropped — no error, no warning.

**How it manifests:** You search for 20 emails, get back 100 results, but only 1 unique email is represented. The other 19 emails appear as "not found" even though they exist in the CRM.

**How to detect:** Always compare the count of unique identifiers found in results vs. the count searched. If they don't match, truncation occurred.

**How to fix:**
- For emails: Search individually when batch results seem incomplete
- For objectIds: Safe to use `$in` since each objectId returns exactly 1 result
- For phones with `$or` + regex: Keep batch size to 15 to reduce risk

**Real example:** Searching for 20 emails including `info@primeinv.co.il` (which had 100+ matching accounts) returned 0 results for emails like `olga@yuvalim.biz` that definitely existed.

---

## 2. Phone Number Normalization Failures

**The problem:** Phone numbers in source files contain:
- Dashes: `052-6281228`
- Spaces: `054 8300355`
- Text annotations: `052-6281228  ליסה`, `522440230 דוד`
- Unicode direction markers: `⁦+972 54-922-5227⁩`
- Country codes: `+972`, `+1`
- Missing leading zero: `526268026`
- International format: `+1 (917) 8535630`

**How to fix:** Aggressive normalization — strip everything that isn't a digit, handle country codes, take 9-digit core. See `identification-strategies.md` for the full algorithm.

**Additional gotcha:** Even after normalization, if the phone in CRM is stored as `052-6281228  ליסה` (with text appended), a regex search for `526281228` still matches because it finds the digit sequence within the larger string.

---

## 3. Name Search False Positives

**The problem:** Searching accounts by last name produces matches with different people who share the same surname.

**Real examples of false matches:**
| Searched For | Found | Why It's Wrong |
|---|---|---|
| גל בן חיים | אורן **אבן** חיים | "בן חיים" matched "אבן חיים" |
| סמדר בן דור | רעות **דורון** | "דור" matched "דורון" |
| מתן וליבי נאור | אוסנת **שנאור** | "נאור" matched "שנאור" |
| אור פרי | רותם **פרידמן** | "פרי" matched "פרידמן" |
| דיאנה רחמים | משי רחמים אפריאט | Same last name, different person |

**How to mitigate:**
1. After name-based search, compare the FULL name — not just last name
2. Flag matches where the first name differs
3. Generate a review spreadsheet for the user to verify questionable matches
4. For common last names (כהן, לוי, מזרחי, דוד, רחמים), name search is practically useless — warn the user

---

## 4. Get-all-Users 100-Record Limit

**The problem:** The MCP tool `Get-all-Users` only returns the first 100 users. If the CRM has more than 100 users, some will be missing from the results.

**How it manifests:** A user like "יועד סלמן" exists in the CRM but doesn't appear in `Get-all-Users` results.

**How to fix:** There is no sanctioned way to search beyond the first 100 users from here. When a user isn't found in `Get-all-Users` results, mark the affected rows as blocked and escalate to the MyBusiness team to resolve the user's objectId (internal ops path; credentials only via get-secret at runtime). Never work around the tool-permission layer.

---

## 5. Email Data Quality Issues

**The problem:** Emails in source files sometimes have data quality issues that prevent matching.

**Examples seen in practice:**
- `'yonathan.david1@gmail.com'` — wrapped in single quotes
- `edri.lea@il/zim.com` — slash in domain (invalid email)
- `email@domain.com ` — trailing whitespace
- `Email@Domain.Com` — unusual capitalization (Parse may be case-sensitive)

**How to fix:**
- Trim whitespace
- Strip surrounding quotes
- Validate email format before searching
- Report invalid emails as "not found with reason"

---

## 6. Duplicate Rows in Source Files

**The problem:** Source files often contain duplicate rows — same person appearing multiple times.

**Examples:**
- Exact duplicates: Same name + same phone on consecutive rows
- Near duplicates: Same phone, slightly different name spelling

**How to fix:** Build a Set of identifier values (email/phone/objectId) before processing. Skip and log duplicates:
```javascript
const seen = new Set();
for (const row of rows) {
  const key = normalizeIdentifier(row);
  if (seen.has(key)) {
    console.log('DUP:', row);
    continue;
  }
  seen.add(key);
  uniqueRows.push(row);
}
```

---

## 7. Create-Many Batch Size Limits

**The problem:** Create-Many can timeout or fail with very large batches.

**Safe limits:**
- Create-Many MCP tool: Up to ~50 records per call (the platform's underlying batch limit is 50 per request)

**How to handle large files (500+ records):**
1. Split into batches of 46-50
2. Process batches sequentially with small delays between them
3. Track progress and report after each batch
4. If the volume makes sequential MCP batching impractical, escalate to the MyBusiness team for a server-side bulk load (internal ops path; credentials only via get-secret at runtime)

---

## 8. Accidental Record Creation with Bad Data

**The problem:** Creating a record with an email in the objectId field instead of a real objectId, or creating a record linked to the wrong account.

**Real example:** Once created a Sale with `"objectId": "nissim@medicom.co.il"` as AccountId — an email instead of an objectId. Record deletion isn't available through the MCP tools, so it took an immediate escalation to the MyBusiness team to remove it (internal ops path).

**How to prevent:**
- Validate objectIds are exactly 10 characters alphanumeric before using them
- Verify accounts exist before creating linked records
- Do a pilot run (first 2-3 records) before processing the full file if the pattern is new

---

## 9. Date Format Confusion

**The problem:** Israeli date format is DD/MM/YYYY but some files mix formats.

**Rule:** Unless explicitly stated otherwise, assume DD/MM/YYYY for dates in Israeli business files.

**Conversion:**
```javascript
// "23/07/2025" → "2025-07-23T00:00:00.000Z"
// "1.1.2020" → "2020-01-01T00:00:00.000Z"
const [day, month, year] = dateStr.split(/[\/\.]/);
const iso = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}T00:00:00.000Z`;
```

---

## 10. Unicode Direction Markers

**The problem:** Phone numbers copied from WhatsApp or RTL text editors contain invisible Unicode direction markers (U+2066 LRI, U+2069 PDI, U+202A LRE, etc.).

**Example:** What looks like `+972 54-922-5227` is actually `⁦+972 54-922-5227⁩` with invisible characters at start and end.

**How to fix:** The phone normalization algorithm (strip all non-digits) handles this automatically since Unicode direction markers are non-digit characters.
