# Column Mapping Reference

Complete mapping of Hebrew file column names to MyBusiness CRM database fields.

## Table of Contents
1. [Identifier Columns](#identifier-columns)
2. [Account (Lead) Fields](#account-lead-fields)
3. [Sales Fields](#sales-fields)
4. [Lookup Tables](#lookup-tables)
5. [Name Splitting](#name-splitting)
6. [Date Conversion](#date-conversion)

## Identifier Columns

These columns determine HOW to find the target Account in the CRM:

| File Column | CRM Lookup | Notes |
|---|---|---|
| `AccountId.objectId` | Direct objectId | Most reliable — no search needed |
| `מייל` / `אימייל` / `email` | `Accounts.Email` | Case-sensitive in Parse, use exact match |
| `טלפון` / `מספר טלפון` / `phone` | `Accounts.PhoneNumber` | Requires normalization, use regex |
| `שם` / `משויך ללקוח` | `Accounts.Name` or `Accounts.L_name` | Last resort — high false positive rate |

## Account (Lead) Fields

When creating new Accounts (leads), map these columns:

| File Column | CRM Field | CRM Type | Notes |
|---|---|---|---|
| `שם` | `Name` | String | Full display name |
| (split from שם) | `F_name` | String | First name — all words except last |
| (split from שם) | `L_name` | String | Last name — last word |
| `מספר טלפון` / `טלפון` | `PhoneNumber` | String | Store as-is from file |
| `בקצרה` | `Short` | String | Brief description |
| `מקור הליד` | `C_LeadSource` | Pointer → C_LeadSourceList | Lookup by Name |
| `מתאם` | `LeadOwnerId` | Pointer → _User | Lookup by name |
| `מתאם` | `NewCoordinator` | Pointer → _User | Same user as LeadOwnerId |
| `מתאם` | `OwnerId` | Pointer → _User | Same user as LeadOwnerId |
| (always) | `IsAccount` | Boolean | Set to `false` for leads |
| (always) | `LeadStatusId` | Pointer → LeadStatuses | Default: "ליד חדש" |

## Sales Fields

When creating Sales records:

| File Column | CRM Field | CRM Type | Notes |
|---|---|---|---|
| `כותרת` | `Name` | String | Sale title/description |
| (from identification) | `AccountId` | Pointer → Accounts | The matched/created account |
| `סטטוס` / `סטטוס מכירה` | `SaleStatusId` | Pointer → SaleStatuses | Lookup by Name |
| `מקור המכירה` / `מקור מכירה` | `SaleSource` | Pointer → SaleSourceList | Lookup by Name |
| `אחראי מכירה` / `יועץ` | `OwnerId` | Pointer → _User | Lookup by name |
| `תאריך התקשרות הבא` | `NextStepDate` | Date | Convert to Parse Date format |
| `הערת לקוח בעייתי` | (metadata only) | — | Reference info, not mapped to a field |
| `משויך ללקוח` | (reference only) | — | Customer name for verification |

## Lookup Tables

Values in the file are human-readable text. They must be resolved to objectIds:

| Text Value Type | Lookup Table | Example Values |
|---|---|---|
| Sale status | `SaleStatuses` | חדש, נכשלה, פולואפ |
| Sale source | `SaleSourceList` | ניוזלטר, דאטה, ליד חדש, לקוח חוזר |
| Lead status | `LeadStatuses` | ליד חדש, ליד כפול, נקבעה פגישה |
| Lead source | `C_LeadSourceList` | אתר WeCheck, פייסבוק, גוגל, הפנייה מעובד |
| User name | `_User` | Search by name regex |

### How to resolve a lookup value:
```
Get-Data on the lookup table with where={"Name": "valueFromFile"}
→ returns objectId
→ construct pointer: {"__type": "Pointer", "className": "TableName", "objectId": "..."}
```

## Name Splitting

When creating Accounts, split the full name into F_name and L_name:

```javascript
const parts = fullName.trim().split(/\s+/).filter(Boolean);
const F_name = parts.slice(0, -1).join(' ') || parts[0] || '';
const L_name = parts.length > 1 ? parts[parts.length - 1] : '';
```

Special cases:
- Single word name: F_name = the word, L_name = empty
- Arabic names with "אבו": keep "אבו" with the following word (e.g., "מורד אבו נאצר" → F_name="מורד אבו", L_name="נאצר")
- This is handled naturally by the "last word = last name" rule

## Date Conversion

File dates come in various formats. Convert to Parse Date:

| File Format | Example | Parse Date |
|---|---|---|
| `DD/MM/YYYY HH:MM` | `01/01/2020 00:00` | `{"__type":"Date","iso":"2020-01-01T00:00:00.000Z"}` |
| `D.M.YYYY` | `1.1.2020` | `{"__type":"Date","iso":"2020-01-01T00:00:00.000Z"}` |
| `DD/MM/YYYY` | `23/07/2025` | `{"__type":"Date","iso":"2025-07-23T00:00:00.000Z"}` |

Note: Israeli date format is DD/MM/YYYY (day first), not MM/DD/YYYY.
