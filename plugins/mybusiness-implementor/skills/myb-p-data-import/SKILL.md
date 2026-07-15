---
name: myb-p-data-import
description: "Bulk import data (leads, sales, accounts) into MyBusiness CRM from Excel/CSV files, AND generate synthetic/sample/demo data programmatically. Use this skill whenever the user uploads a file (Excel, CSV, XLSX) and asks to create records, OR asks to seed synthetic/demo data into CRM tables — including realistic MyChat/WhatsApp conversations (channels → conversations → messages). Triggers on phrases like 'תעלה קובץ', 'תקים מכירות', 'תפתח לידים', 'file import', 'העלאת נתונים', 'הקמת מכירות מקובץ', 'דאטה סינתטי', 'דאטה לדוגמה', 'שיחות וואטסאפ לדוגמה', 'synthetic data', 'sample data', 'seed data', or any request involving creating CRM records in bulk. Also covers the Migration Validation Report (דוח אימות הסבה) — the customer-facing counts+spot-check sign-off document for MASS one-time data migrations (הסבת נתונים); triggers: 'דוח אימות הסבה', 'migration validation', 'אישור הסבת נתונים'."
---

# Data Import — Bulk CRM Record Creation from Files

Import data from Excel/CSV files into MyBusiness CRM. Handles customer identification (by email, phone, name, or objectId), field mapping from Hebrew column names, lookup resolution, deduplication, and batch record creation.

## When to Use

- User uploads a CSV or Excel file and asks to create CRM records from it
- Bulk creation of Sales, Leads (Accounts with IsAccount=false), or both
- Matching file rows to existing CRM Accounts by email, phone, name, or objectId
- Any "file → CRM records" workflow
- **Generating synthetic / demo data** programmatically (no file) — e.g. seeding sample records for a demo. For **MyChat / WhatsApp conversations** specifically (channels, conversations, messages, the `Direction` typo, the 24-hour window, and the critical CLP-visibility step), read **`references/mychat-conversations.md`** — it is a complete, standalone generator guide.

## High-Level Workflow

```
1. READ the file → understand structure (sheets, columns, row count)
2. ANALYZE columns → classify each as: identifier, CRM field, or metadata
3. RESOLVE lookups → find objectIds for users, statuses, sources
4. MATCH records → find or create target Accounts
5. DEDUPLICATE → remove duplicate rows from source
6. CREATE records → use Create-Many for batch creation
7. REPORT results → summarize created/skipped/failed
```

## Step 1: Read and Understand the File

Read the file using Node.js with the `xlsx` package (install if needed: `npm install xlsx`).

```javascript
const xlsx = require('xlsx');
const wb = xlsx.readFile('filename.xlsx');
console.log('Sheets:', wb.SheetNames);
// For each sheet, show header + first few rows + total count
```

For CSV files, `xlsx` handles them too, or use `fs.readFileSync` with manual parsing.

Key things to determine:
- **How many sheets?** Two sheets usually means "ליד" (lead) + "מכירה" (sale) — rows aligned 1:1
- **What are the column headers?** Map them to CRM fields (see Column Mapping below)
- **What's the identifier?** How do we match rows to existing Accounts? (see Identification Strategies)
- **Are all values uniform?** Check unique values per column — often status/source/owner are the same for all rows
- **How many rows?** Determines batch strategy

## Step 2: Column Mapping

Hebrew column names map to CRM fields. Read `references/column-mapping.md` for the complete mapping table.

The most common patterns:

| Hebrew Column | CRM Table | CRM Field | Type |
|---|---|---|---|
| מייל / אימייל | Accounts | Email | Identifier (lookup) |
| טלפון / מספר טלפון | Accounts | PhoneNumber | Identifier (lookup) |
| AccountId.objectId | Accounts | objectId | Identifier (direct) |
| שם | Accounts | Name, F_name, L_name | Direct field |
| כותרת | Sales | Name | Direct field |
| סטטוס / סטטוס מכירה | Sales | SaleStatusId | Lookup → SaleStatuses |
| מקור המכירה | Sales | SaleSource | Lookup → SaleSourceList |
| מקור הליד | Accounts | C_LeadSource | Lookup → C_LeadSourceList |
| אחראי מכירה / יועץ | Sales | OwnerId | Lookup → _User |
| מתאם | Accounts | LeadOwnerId, NewCoordinator, OwnerId | Lookup → _User |
| בקצרה | Accounts | Short | Direct field |
| תאריך התקשרות הבא | Sales | NextStepDate | Date conversion |

## Step 3: Resolve Lookups

Before creating records, resolve all text values to objectIds. Read `references/lookup-resolution.md` for patterns and pitfalls.

**Critical lookups to resolve:**
1. **Status values** (e.g., "חדש") → query the relevant status table by Name
2. **Source values** (e.g., "ניוזלטר", "דאטה", "ליד חדש") → query SaleSourceList or C_LeadSourceList
3. **User names** (e.g., "בר בכור", "ירון גרוסמן") → search _User table

**User lookup is tricky:** `Get-all-Users` only returns the first 100 users (documented tool limitation). If the user isn't in those results, don't work around the tool-permission layer — mark the affected rows as blocked and escalate to the MyBusiness team to resolve the user's objectId (internal ops path; credentials only via get-secret at runtime).

## Step 4: Identify and Match Accounts

This is the most critical step. The strategy depends on what identifier is available in the file. Read `references/identification-strategies.md` for detailed patterns.

### Strategy Selection

| Identifier in File | Strategy | Reliability |
|---|---|---|
| AccountId / objectId | Direct lookup with `$in` | Perfect |
| Email (מייל) | Search Accounts.Email | High |
| Phone (טלפון) | Normalize → regex search | Medium-High |
| Name (שם) | Last resort — search by L_name | Low (many false positives) |
| None (new leads) | Create new Account | N/A |

### When creating new leads (no existing account to match):
Create Account records with `IsAccount: false` and lead-specific fields (LeadStatusId, C_LeadSource, LeadOwnerId, NewCoordinator).

## Step 5: Deduplicate

Always check for duplicate rows before processing:
- Build a Set of identifier values (email, phone, objectId)
- Skip duplicates, log them
- For phone duplicates, normalize first then compare

## Step 6: Create Records

Use **Create-Many** MCP tool for batch creation — it accepts an array of records and creates them all in one API call.

### Triggers during import

**API-created records fire triggers by default (verified live)** — a bulk import can mass-send emails/SMS and create child rows. Check `Get-Triggers` on the target tables and decide per import:
- **Suppress**: `Create-Many(skipTriggers: true)` (`skipTimeline: true` also available) — then backfill trigger-derived fields (timestamps, child rows) as part of the import.
- **Let them run**: deliberately (e.g., to build tracking rows), after deactivating notification-type triggers (email/SMS/WhatsApp) for the import window.
- **Never** bulk-import with notification triggers active unknowingly.

### Batch sizing
- Create-Many handles up to ~50 records comfortably per call
- For larger sets, split into batches of 46-50
- For very large sets (500+), keep batching sequentially through Create-Many; if the volume makes that impractical, escalate to the MyBusiness team for a server-side bulk load (internal ops path; credentials only via get-secret at runtime)

### Two-phase creation (Leads + Sales)
When creating both leads and sales:
1. **Phase 1**: Create all Account (lead) records via Create-Many → get back objectIds
2. **Phase 2**: Map each objectId to its corresponding sale data → Create all Sales via Create-Many

The response from Create-Many returns objectIds in the same order as the input array — use positional mapping.

### Parse pointer and date formats
```json
// Pointer
{"__type": "Pointer", "className": "TableName", "objectId": "abc123"}

// Date
{"__type": "Date", "iso": "2020-01-01T00:00:00.000Z"}
```

## Step 7: Report Results

After completion, provide a clear summary:
```
סיכום:
- X לידים נוצרו
- X מכירות נוצרו
- X כפולות דולגו
- X לא נמצאו (list them if under 30)
- שגיאות: X
```

If there were records not found or with data quality issues, list them so the user can handle them manually.

## Migration Validation Report — דוח אימות הסבה (mass data migration ONLY)

> **Scope note — read first:** this report applies **only to mass, one-time data migration** — the cutover of a customer's legacy data into a fresh/production system (הסבת נתונים, typically the spec's §11/MIG package or a go-live delta import). It is **NOT for routine bulk uploads** — importing a leads file from Excel, a periodic list load, or day-to-day record creation needs only the Step-7 chat summary, no formal report and no signature.

Why it exists: migrated data the users don't trust is a top adoption killer — a rep who meets duplicates or missing customers in week one quietly goes back to their spreadsheet. The validation report turns the counts you already run into a **customer-facing trust artifact with a sign-off**, so doubts surface and die before go-live instead of after.

When a mass migration completes, render `docs/migration/migration-validation.html` (Hebrew, customer-facing — use `../myb-p-kb/assets/doc-template-brand.html`) containing:

1. **Counts table** — per target table: source rows → imported → skipped (with reason class: duplicate / unmatched / invalid) → `Count-Data` live verification. Discrepancies explained in writing, never waved off.
2. **Mapping summary** — source field → CRM field, in business language (one table, no JSON).
3. **Exceptions list** — every skipped/failed row group with its reason and disposition (fix-and-reimport / accepted-as-is / customer to supply).
4. **Spot-check protocol + result** — the customer picks 5–10 real records they know well ("הלקוחה הכי ותיקה שלך"), you open them together against the legacy source, and each check is recorded (record, field compared, מקור=מערכת ✓/✗).
5. **Sign-off block** — name, role, date, and an explicit "הנתונים נבדקו ואושרו להפעלה". This signature is an entry gate for go-live — collect it before real communication channels are switched on.

If the spot-check fails on anything, fix → re-verify → re-run the spot-check on the failed items; never collect a signature over known-bad data "to keep the schedule" — the schedule you save costs the adoption you need.

## Synthetic Data — MyChat / WhatsApp Conversations

To generate realistic sample WhatsApp conversations, read **`references/mychat-conversations.md`** (complete, standalone). The essentials:

- **Three layers, created bottom-up:** `Channels` (a business WhatsApp number) → `Conversations` (one thread per customer phone) → `ConversationMessages` (`Create-Many`). Resolve lookup objectIds live (`ChannelTypes`/`ConversationStates`/`ConversationStatuses`); create a `Channels` row if `Count-Data Channels` = 0 (note the channel-type field is **`TypeId`**, not `ChannelTypeId`).
- **Message rules:** `Direction` is literally `"Incomeing"`/`"Outgoing"` (keep the typo); `Identity` = customer phone international **without `+`**; `Message` (HTML-escaped) must match `Data.text.body`; each `Data.id` (wamid) is unique; outgoing "success" carries a `sent→delivered→read` chain; obey the **24-hour window** (free-text outbound >24h after last inbound must be a `template`, else `failed` code `131047`).
- **🔴 The make-or-break step — CLP/permissions:** records you create use the **master key**, so `Get-Data` always sees them, but the **UI runs as the logged-in user**. If the `Conversations` (or `ConversationMessages`/`Channels`) table CLP doesn't grant `find`/`get` to the viewing role, the **card widget and MyChat inbox render EMPTY** even though the rows exist — it looks like the data wasn't created. **Always `Get-Table-Permissions` and fix any empty `find:{}`/`get:{}`** (native MyChat roles: `Admin`/`MyChatAdmin`/`MyChatUser`; or grant `requiresAuthentication:true`). This is the #1 reason synthetic conversations "don't show".
- **Visibility caveats:** the MyChat **inbox** only lists conversations on a *real connected* channel — a synthetic channel won't appear there (surface the history on the customer card via an `AccountId`-filtered Conversations widget instead). And `File` (PrivateFile) can't be written from the webhook's resource_link object (put media in `Data.document/audio/image`), and `createdAt` can't be backdated (use `Data.timestamp`/`sentAt`/`LastMessageAt` for chronology).

## Decision Tree

```
File received
├── Has AccountId/objectId column?
│   ├── YES → Verify IDs exist → Create Sales directly
│   └── NO ↓
├── Has Email column?
│   ├── YES → Search Accounts by Email → Create Sales for found
│   └── NO ↓
├── Has Phone column?
│   ├── YES → Normalize phones → Regex search → Create Sales for found
│   └── NO ↓
├── Has two sheets (ליד + מכירה)?
│   ├── YES → Create new Accounts (leads) → Create linked Sales
│   └── NO ↓
└── Has Name only?
    └── Search by L_name (last resort, warn about false positives)
```

## Common Pitfalls

Read `references/pitfalls.md` for detailed explanations of each pitfall and how to avoid it. The most critical ones:

1. **`$in` query silent truncation**: When searching with `$in` and one value returns many results, it consumes the limit and silently drops other results. Always verify the count of found records matches expectations.
2. **Phone normalization**: Israeli phones come in dozens of formats. Always strip to 9-digit core.
3. **Name search false positives**: Searching by last name "כהן" will match many unrelated accounts.
4. **Get-all-Users limit**: Only returns first 100 users. If a user isn't found there, mark the row blocked and escalate to the MyBusiness team.
5. **Create-Many batch size**: Keep under 50 records per call to avoid timeouts.
