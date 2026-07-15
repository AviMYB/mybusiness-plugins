# Lookup Resolution

How to convert human-readable text values from file columns into Parse objectIds required by the CRM.

## Table of Contents
1. [Resolution Process](#resolution-process)
2. [Status and Source Lookups](#status-and-source-lookups)
3. [User Lookups](#user-lookups)
4. [Caching Resolved Values](#caching-resolved-values)

---

## Resolution Process

Every pointer field in the CRM requires an objectId, not a text value. The file contains text like "חדש" or "בר בכור" — these must be resolved to objectIds before creating records.

**General pattern:**
```
1. Query the lookup table: Get-Data on TableName where Name = "value from file"
2. Extract objectId from result
3. Construct pointer: {"__type": "Pointer", "className": "TableName", "objectId": "..."}
```

## Status and Source Lookups

### Sale Status (סטטוס מכירה → SaleStatuses)
```
Get-Data table=SaleStatuses, where={"Name": "חדש"}, keys=["objectId", "Name"]
```
Common values: חדש, נכשלה, פולואפ, חדש ללא מענה

### Sale Source (מקור המכירה → SaleSourceList)
```
Get-Data table=SaleSourceList, where={"Name": "ניוזלטר"}, keys=["objectId", "Name"]
```
Common values: ניוזלטר, דאטה, ליד חדש, לקוח חוזר, וובינר

### Lead Status (סטטוס ליד → LeadStatuses)
```
Get-Data table=LeadStatuses, where={"Name": "ליד חדש"}, keys=["objectId", "Name"]
```
Common values: ליד חדש, ליד כפול, נקבעה פגישה, אין מענה, הפך ללקוח

### Lead Source (מקור הליד → C_LeadSourceList)
```
Get-Data table=C_LeadSourceList, where={"Name": "אתר WeCheck"}, keys=["objectId", "Name"]
```
Note: The value in the file might differ slightly from the CRM value (e.g., "אתר WECHECK" vs "אתר WeCheck"). If exact match fails, try case-insensitive regex: `{"Name": {"$regex": "wecheck", "$options": "i"}}`

## User Lookups

User lookups are trickier because:
1. `Get-all-Users` MCP tool only returns the first 100 users
2. The user might not be in those first 100

### Step 1: Try Get-all-Users first
Check the results for a name match. If found, use the objectId.

### Step 2: If not found — escalate
The 100-user cap on `Get-all-Users` is a documented tool limitation, and there is no sanctioned way to search beyond it from here. Mark the affected rows as blocked and escalate to the MyBusiness team to resolve the user's objectId (internal ops path; credentials only via get-secret at runtime). Never work around the tool-permission layer.

### Step 3: Handle ambiguity
If multiple users match (e.g., searching "ירון" returns "ירון נפרסטק", "ירון וולפה", "ירון גרוסמן"), use the FULL name from the file to select the correct one.

### Common user field mappings:
- `אחראי מכירה` / `יועץ` → Sales.OwnerId
- `מתאם` → Accounts.LeadOwnerId + Accounts.NewCoordinator + Accounts.OwnerId (set all three)

## Caching Resolved Values

When processing a file where all rows share the same status/source/owner values (very common), resolve each lookup once and reuse:

```javascript
// Resolve once at the beginning
const SALE_STATUS_ID = 'E9cYlAlooc';   // חדש
const SALE_SOURCE_ID = 'Cg5Y1FQPBN';   // דאטה
const OWNER_ID = 'RK12fpW3BL';          // בר בכור

// Then reuse in every record
const saleRecord = {
  SaleStatusId: { __type: 'Pointer', className: 'SaleStatuses', objectId: SALE_STATUS_ID },
  SaleSource: { __type: 'Pointer', className: 'SaleSourceList', objectId: SALE_SOURCE_ID },
  OwnerId: { __type: 'Pointer', className: '_User', objectId: OWNER_ID },
};
```

If different rows have different values, resolve each unique value once and build a mapping dictionary:
```javascript
const sourceMap = {
  'ניוזלטר': 'VHEcsv0TPs',
  'דאטה': 'Cg5Y1FQPBN',
  'ליד חדש': 'BKCDSycKv4',
};
```

**Important:** objectIds are specific to each customer's CRM instance. Never hardcode them across different customers — always resolve fresh for each customer.
