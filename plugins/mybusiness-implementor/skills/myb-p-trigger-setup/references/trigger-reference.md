# Trigger Reference -- Complete Parameter Guide

## Table of Contents
1. [Set-Trigger Parameters](#set-trigger-parameters)
2. [Criteria Reference](#criteria-reference)
3. [Scheduled Trigger Timing](#scheduled-trigger-timing)
4. [Action Type: email](#action-email)
5. [Action Type: sms](#action-sms)
6. [Action Type: whatsapp-message](#action-whatsapp)
7. [Action Type: create-object](#action-create-object)
8. [Action Type: update-object](#action-update-object)
9. [Action Type: notification](#action-notification)
10. [Action Type: http](#action-http)
11. [Action Type: server-side-code](#action-server-side-code)
12. [Updating and Deleting Actions](#updating-and-deleting)
13. [Dynamic Content Placeholders](#dynamic-content)
14. [Field Value Types in Actions](#field-value-types)
15. [Real-World Examples](#real-world-examples)
16. [Troubleshooting](#troubleshooting)

---

## Set-Trigger Parameters <a name="set-trigger-parameters"></a>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableName` | String | Yes | Table to monitor |
| `type` | Enum | Yes | `"data change"` or `"scheduled"` |
| `active` | Boolean | Yes | Enable/disable the trigger |
| `name` | String | Yes (create) | Descriptive name (Hebrew recommended) |
| `_id` | String | For update | Existing trigger ID to update |
| `events` | Array | For data change | `["create"]`, `["update"]`, or `["create", "update"]` |
| `onSetFields` | Array | Recommended | Fields to watch -- trigger only evaluates if one of these changed |
| `criterias` | Array | No | Filter conditions (AND by default, OR with condOr) |
| `oneachupdate` | Boolean | No | `true`: fires every matching update. `false` (default): fires once per record |
| `schedulerField` | String | For scheduled | Date field name to schedule from |
| `shcedulerHours` | Number | For scheduled | Hours before (positive) or after (negative) the date |

**Notes on `onSetFields`:**
- Highly recommended for update triggers -- without it, the trigger evaluates on ANY field change
- Can list multiple fields: `["StatusId", "OwnerId"]` -- trigger fires if ANY of them changed
- For create events, use a field that's always set on creation (e.g., `"Name"`)

**Notes on `oneachupdate`:**
- `false` = the trigger marks the record after first execution and won't fire again for the same record
- `true` = fires every time the criteria match, even if the record was already processed
- For status-change notifications: usually `false` (notify once when status changes to X)
- For field sync/timestamp patterns: usually `true` (sync every time)

---

## Criteria Reference <a name="criteria-reference"></a>

### Criteria Object Structure

```json
{
  "F": "FieldName",
  "FText": "FieldName",
  "C": "equalTo",
  "V": "value_or_objectId",
  "T": "String",
  "P": { "targetClass": "TableName", "visibleVal": "Display", "multiple": false },
  "condOr": false
}
```

| Field | Description |
|-------|-------------|
| `F` | Field name. Supports dot notation for pointer subfields: `OwnerId._User.name` |
| `FText` | Display label (usually same as F) |
| `C` | Condition operator (see below) |
| `V` | Value to compare. For Pointer: objectId. For containedIn: array of objectIds |
| `T` | Type: `String`, `Number`, `Pointer`, `Boolean`, `Date` |
| `P` | Required for Pointer: `{ "targetClass": "...", "visibleVal": "...", "multiple": false }` |
| `condOr` | `true` to make this part of an OR group (at least 2 criteria with condOr needed) |

### Condition Operators

| Operator | Types | Description |
|----------|-------|-------------|
| `equalTo` | All | Exact match |
| `notEqualTo` | All | Not equal |
| `greaterThan` | Number, Date | Greater than |
| `lessThan` | Number, Date | Less than |
| `greaterThanOrEqualTo` | Number, Date | >= |
| `lessThanOrEqualTo` | Number, Date | <= |
| `contains` | String | Substring match |
| `startsWith` | String | Starts with |
| `containedIn` | Pointer | Value is one of array items. V must be array: `["id1", "id2"]` |
| `notContainedIn` | Pointer | Value is NOT one of array items |

### Criteria Examples

**Pointer field equals specific value:**
```json
{
  "F": "SaleStatusId", "FText": "SaleStatusId",
  "C": "equalTo", "V": "abc123", "T": "Pointer",
  "P": { "targetClass": "SaleStatuses", "visibleVal": "הושלמה", "multiple": false }
}
```

**Number greater than:**
```json
{ "F": "Total", "FText": "Total", "C": "greaterThan", "V": 50000, "T": "Number" }
```

**Boolean equals:**
```json
{ "F": "IsAccount", "FText": "IsAccount", "C": "equalTo", "V": true, "T": "Boolean" }
```

**Pointer in multiple values (containedIn):**
```json
{
  "F": "StatusId", "FText": "StatusId",
  "C": "containedIn", "V": ["id1", "id2", "id3"], "T": "Pointer",
  "P": { "targetClass": "AccountStatuses", "visibleVal": "סטטוס1, סטטוס2, סטטוס3", "multiple": true }
}
```

**OR criteria (either condition matches):**
```json
[
  { "F": "PriorityId", "C": "equalTo", "V": "criticalId", "T": "Pointer",
    "P": { "targetClass": "CasePriorities", "visibleVal": "Critical" }, "condOr": true },
  { "F": "PriorityId", "C": "equalTo", "V": "highId", "T": "Pointer",
    "P": { "targetClass": "CasePriorities", "visibleVal": "High" }, "condOr": true }
]
```

---

## Scheduled Trigger Timing <a name="scheduled-trigger-timing"></a>

| `shcedulerHours` | Meaning |
|-------------------|---------|
| `720` (30 days) | 30 days BEFORE the date |
| `168` (7 days) | 7 days BEFORE |
| `24` (1 day) | 1 day BEFORE |
| `1` | 1 hour BEFORE (minimum before) |
| `-1` | 1 hour AFTER (minimum after) |
| `-24` | 1 day AFTER |
| `-48` | 2 days AFTER |
| `-168` | 7 days AFTER |

**IMPORTANT NOTES:**
- The typo `shcedulerHours` (not `schedulerHours`) is intentional -- this is the actual parameter name in the system.
- **Value `0` is NOT supported** -- the system rejects it with "Scheduler hours is required". Use `1` (1 hour before) or `-1` (1 hour after) as minimum values.
- **Scheduled triggers return a different ID format** -- `{"value":"<mongoObjectId>"}` instead of the Parse-style `_id`. Use the `value` field as `triggerId` when adding actions.
- **Scheduled trigger action responses** also differ -- they return `{"ok":1,"value":{...}}` instead of the full class schema.

---

## Action Type: email <a name="action-email"></a>

### Prerequisites
1. Get SMTP account: `Get-SMTP-Accounts()` -- save the objectId
2. Get email template: `Get-Data(table: "EmailTemplate", limit: 20, keys: ["objectId", "Name"])`

### Action Data Structure

```json
{
  "actionType": "email",
  "actionData": {
    "email": {
      "emailType": "field",
      "emailTarget": "Email",
      "emailSubject": "Subject with {{{Name}}} dynamic content",
      "emailAccount": "<smtpAccountObjectId>",
      "template": "<emailTemplateObjectId>",
      "saveToEmailsTable": true,
      "fieldsValue": [
        {
          "field": "AccountId",
          "targetClass": "Accounts",
          "type": "Pointer",
          "value": "AccountId",
          "visibleVal": "Account"
        },
        {
          "field": "SaleId",
          "targetClass": "Sales",
          "type": "Pointer",
          "value": "current",
          "visibleVal": "Current Object(Sales)"
        }
      ]
    }
  }
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `emailType` | `"fixed"` / `"field"` | Fixed = hardcoded address; Field = from record field |
| `emailTarget` | String | Email address (fixed) or field name (field). Supports pointer: `AccountId.Accounts.Email` |
| `emailSubject` | String | Subject line. Supports `{{{FieldName}}}` placeholders |
| `emailAccount` | String | SMTP account objectId from Get-SMTP-Accounts |
| `template` | String | EmailTemplate objectId |
| `saveToEmailsTable` | Boolean | Save copy in Emails table for tracking |
| `fieldsValue` | Array | Pointer fields to link in saved email record (only if saveToEmailsTable) |

**Fixed email example (send to a specific address):**
```json
"emailType": "fixed",
"emailTarget": "manager@company.com"
```

---

## Action Type: sms <a name="action-sms"></a>

```json
{
  "actionType": "sms",
  "actionData": {
    "sms": {
      "toType": "field",
      "to": "PhoneNumber",
      "from": "0501234567",
      "local": "IL",
      "content": "שלום {{{AccountId.Name}}}, הזמנתך #{{{Name}}} בסך {{{Total}}} ש\"ח התקבלה!",
      "useQueue": true
    }
  }
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `toType` | `"fixed"` / `"field"` | Fixed number or from record field |
| `to` | String | Phone number (fixed) or field name (field) |
| `from` | String | Sender phone number |
| `local` | String | Country code: `"IL"`, `"US"`, etc. Can be empty `""` |
| `content` | String | SMS body. Supports `{{{FieldName}}}` placeholders |
| `useQueue` | Boolean | Send via queue (recommended for bulk) |

---

## Action Type: whatsapp-message <a name="action-whatsapp"></a>

### Prerequisites
1. Get WhatsApp numbers and templates: `Send-WhatsApp-Message(getNumbers: true, getTemplates: true)`
2. Get template params: `Get-WhatsApp-Template-Params(templateComponents: [<components from template>])`

### Action Data Structure

```json
{
  "actionType": "whatsapp-message",
  "actionData": {
    "whatsapp-message": {
      "toType": "field",
      "to": "PhoneNumber",
      "from": "<channelIdentityId>",
      "waba_id": "<wabaId>",
      "message": "Description text",
      "template": {
        "name": "template_name",
        "parameter_format": "POSITIONAL",
        "components": [ ... ],
        "language": "he",
        "status": "APPROVED",
        "category": "MARKETING",
        "id": "<templateId>"
      },
      "WATemplateParams": {
        "BODY": ["{{{AccountId.Name}}}", "{{{Name}}}"]
      }
    }
  }
}
```

**Important notes:**
- Use the `from` value as the phone number ID from `Send-WhatsApp-Message(getNumbers: true)`, NOT an objectId.
- The `template` object should include the full components from the template as returned by `getTemplates`.
- **`Get-WhatsApp-Template-Params` is unreliable for templates with 2+ body params** -- it may return only the FIRST one. Count the `{{N}}` placeholders in the template body text yourself and build `WATemplateParams.BODY` with one entry per placeholder, in order, using dynamic `{{{FieldName}}}` placeholders. For example, a body with `{{1}}` and `{{2}}` needs `{"BODY":["{{{AccountId.Name}}}","{{{CaseNum_Auto}}}"]}`.
- For HEADER with IMAGE type, WATemplateParams.HEADER should contain the image URL.
- Dynamic values use the same `{{{FieldName}}}` syntax as other action types. Example: `["{{{Name}}}", "{{{DateField.format(date,he-IL,Asia/Jerusalem)}}}"]`

---

## Action Type: create-object <a name="action-create-object"></a>

```json
{
  "actionType": "create-object",
  "actionData": {
    "create-object": {
      "targetClass": "Tasks",
      "fieldsValue": [
        { "field": "Name", "type": "static", "value": "Follow up task" },
        { "field": "AccountId", "type": "dynamic", "value": "currentObject", "targetClass": "Accounts" },
        { "field": "OwnerId", "type": "dynamic", "value": "OwnerId", "targetClass": "_User" },
        { "field": "DueDate", "type": "dynamic", "value": "updatedAt", "timeGap": 1440 },
        { "field": "Description", "type": "static", "value": "Auto-created by trigger" },
        { "field": "StatusId", "type": "static", "value": "<statusObjectId>", "targetClass": "TaskStatuses", "visibleValue": "חדש" }
      ]
    }
  }
}
```

See [Field Value Types](#field-value-types) for details on static vs dynamic values and timeGap.

---

## Action Type: update-object <a name="action-update-object"></a>

### Connection Types

| Connection | Meaning | Example |
|------------|---------|---------|
| `"current.objectId"` | Update the triggered record itself | Trigger on Sales, update the same Sale |
| `"source.AccountId"` | Triggered record has pointer `AccountId` to target | Trigger on Sales, update the linked Account |
| `"target.SaleId"` | Target records have pointer `SaleId` to triggered record | Trigger on Sales, update all SaleRows that point to this Sale |

### Update Current Record

```json
{
  "actionType": "update-object",
  "actionData": {
    "update-object": {
      "targetClass": "Sales",
      "connection": "current.objectId",
      "fieldsValue": [
        { "field": "StatusUpdateDate", "type": "dynamic", "value": "updatedAt" },
        { "field": "StatusUpdatedBy", "type": "dynamic", "value": "updatedBy", "targetClass": "_User" }
      ]
    }
  }
}
```

### Update Related Record via Source (triggered record points to target)

```json
{
  "actionType": "update-object",
  "actionData": {
    "update-object": {
      "targetClass": "Accounts",
      "connection": "source.AccountId",
      "fieldsValue": [
        { "field": "LastActivityDate", "type": "dynamic", "value": "updatedAt" }
      ]
    }
  }
}
```

### Update Related Records via Target (target records point to triggered record)

```json
{
  "actionType": "update-object",
  "actionData": {
    "update-object": {
      "targetClass": "SaleRows",
      "connection": "target.SaleId",
      "fieldsValue": [
        { "field": "AccountId", "type": "dynamic", "value": "AccountId", "targetClass": "Accounts" }
      ]
    }
  }
}
```

---

## Action Type: notification <a name="action-notification"></a>

```json
{
  "actionType": "notification",
  "actionData": {
    "notification": {
      "userType": "field",
      "user": "OwnerId",
      "content": "ליד חדש הוקצה אליך: {{{Name}}} - {{{PhoneNumber}}}",
      "icon": "fa-bell",
      "iconColor": "#4CAF50"
    }
  }
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `userType` | `"fixed"` / `"field"` | Fixed user or from record field |
| `user` | String | User objectId (fixed) or field name pointing to _User (field) |
| `content` | String | Notification text. Supports `{{{FieldName}}}` and HTML |
| `icon` | String | FontAwesome 3.4 icon: `fa-bell`, `fa-envelope`, `fa-phone`, `fa-info`, `fa-clock-o`, `fa-user`, `fa-trophy`, `fa-exclamation`, `fa-calendar` |
| `iconColor` | String | Hex color: `"#ff4444"`, `"#4CAF50"`, `"#ffd700"`, `"#013479"` |

---

## Action Type: http <a name="action-http"></a>

```json
{
  "actionType": "http",
  "actionData": {
    "http": {
      "url": "https://hooks.example.com/webhook/abc123",
      "method": "POST",
      "useQueue": true,
      "headers": [
        { "name": "Content-Type", "value": "application/json" },
        { "name": "Authorization", "value": "Bearer <token>" }
      ]
    }
  }
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | String | Webhook URL. Supports `{{{FieldName}}}` in URL path |
| `method` | Enum | `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`, `"AUTO"` (AUTO = POST for create, PUT for update) |
| `useQueue` | Boolean | Queue execution (recommended for high-volume triggers) |
| `headers` | Array | Custom headers: `[{ "name": "...", "value": "..." }]` |

**The request body is automatically populated with the full record data as JSON.**

---

## Action Type: server-side-code <a name="action-server-side-code"></a>

```json
{
  "actionType": "server-side-code",
  "actionData": {
    "server-side-code": {
      "functionName": "calculateCommission",
      "useQueue": true
    }
  }
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `functionName` | String | Cloud function name (must be pre-deployed) |
| `useQueue` | Boolean | Queue execution |

**Note:** The function receives the triggered record as context. The function must already exist in the system -- this skill cannot create cloud functions.

---

## Updating and Deleting Actions <a name="updating-and-deleting"></a>

### Update an Existing Action

Pass `actionId` in the Set-Trigger-Action call:

```
Set-Trigger-Action(
    tableName: "<Table>",
    triggerId: "<triggerId>",
    triggerType: "data change",
    actionType: "sms",
    actionId: "<actionObjectId>",
    actionData: { "sms": { ... updated params ... } }
)
```

**For data-change triggers:** `actionId` is the action's objectId (the `_id` field in the action)
**For scheduled triggers:** `actionId` is the zero-based index as a string (`"0"`, `"1"`, etc.)

### Delete an Action

**IMPORTANT:** You MUST provide `actionData` even when deleting. Without it, the system throws `"Cannot read properties of undefined"`. Send minimal/dummy data for the action type.

```
Set-Trigger-Action(
    tableName: "<Table>",
    triggerId: "<triggerId>",
    triggerType: "data change",
    actionType: "sms",
    actionId: "<actionId>",
    deleteAction: true,
    actionData: { "sms": { "toType": "field", "to": "PhoneNumber", "from": "0500000000", "local": "IL", "content": "x" } }
)
```

The actionData content doesn't matter for deletion -- it just needs to be structurally valid for the action type.

---

## Dynamic Content Placeholders <a name="dynamic-content"></a>

Usable in: email subjects, SMS content, notification content, HTTP URLs, and within `visibleValue` fields.

| Syntax | Description |
|--------|-------------|
| `{{{Name}}}` | Direct field from triggered record |
| `{{{AccountId.Name}}}` | Pointer field traversal (one level) |
| `{{{OwnerId.name}}}` | User name from _User pointer |
| `{{{objectId}}}` | Record's unique ID |
| `{{{Total}}}` | Number field value |
| `{{{DateField.format(date,he-IL,Asia/Jerusalem)}}}` | Formatted date |
| `{{{DateField.format(timehm,he-IL,Asia/Jerusalem)}}}` | Time only (HH:MM) |
| `{{{DateField.format(datetime,he-IL,Asia/Jerusalem)}}}` | Date and time |

---

## Field Value Types in Actions <a name="field-value-types"></a>

Used in `fieldsValue` arrays for create-object and update-object actions:

### Static Values

```json
{ "field": "Name", "type": "static", "value": "Fixed text value" }
{ "field": "StatusId", "type": "static", "value": "<objectId>", "targetClass": "Statuses", "visibleValue": "Active" }
{ "field": "IsActive", "type": "static", "value": true, "visibleValue": "true" }
{ "field": "Amount", "type": "static", "value": 100 }
```

### Dynamic Values (from triggered record)

```json
{ "field": "Name", "type": "dynamic", "value": "Name" }
{ "field": "AccountId", "type": "dynamic", "value": "AccountId", "targetClass": "Accounts" }
{ "field": "OwnerId", "type": "dynamic", "value": "OwnerId", "targetClass": "_User" }
```

### Special Dynamic Values

| Value | Meaning |
|-------|---------|
| `"currentObject"` | Pointer to the record that triggered the action |
| `"updatedAt"` | Current timestamp (when trigger fires) |
| `"updatedBy"` | User who made the change (Pointer to _User) |
| `"createdAt"` | Record creation timestamp |
| `"currentUser"` | Currently logged-in user (static type) |

### timeGap (Date Calculations)

For Date fields with dynamic type, add `timeGap` in **minutes**:

```json
{ "field": "DueDate", "type": "dynamic", "value": "updatedAt", "timeGap": 1440 }
```

| Minutes | Duration |
|---------|----------|
| `1` | 1 minute (used as minimal offset, effectively "now") |
| `60` | 1 hour |
| `1440` | 1 day (24 hours) |
| `10080` | 1 week |
| `43200` | 30 days |
| `-1440` | 1 day ago (subtract time) |

---

## Real-World Examples <a name="real-world-examples"></a>

### Example 1: Status Change Email + WhatsApp + Record Update

A trigger that fires when an account status changes to "questionnaire sent", updates a date field, sends an email, and sends a WhatsApp message:

```
Step 1: Set-Trigger
  tableName: "Accounts"
  type: "data change"
  active: true
  name: "שליחת שאלון למילוי"
  events: ["create", "update"]
  oneachupdate: false
  onSetFields: ["StatusId"]
  criterias: [{
    "F": "StatusId", "C": "equalTo", "V": "<statusObjectId>",
    "T": "Pointer", "P": { "targetClass": "AccountStatuses", "visibleVal": "נשלח שאלון" }
  }]

Step 2: Set-Trigger-Action (update date)
  actionType: "update-object"
  actionData: { "update-object": {
    "targetClass": "Accounts",
    "connection": "current.objectId",
    "fieldsValue": [
      { "field": "QuestionnaireSentDate", "type": "dynamic", "value": "updatedAt", "timeGap": 1 }
    ]
  }}

Step 3: Set-Trigger-Action (email)
  actionType: "email"
  actionData: { "email": {
    "emailType": "field", "emailTarget": "Email",
    "emailSubject": "מתחילים! נתחיל במילוי השאלון",
    "emailAccount": "<smtpId>", "template": "<templateId>"
  }}

Step 4: Set-Trigger-Action (WhatsApp)
  actionType: "whatsapp-message"
  actionData: { "whatsapp-message": {
    "toType": "field", "to": "PhoneNumber",
    "from": "<channelIdentity>",
    "template": { "name": "questionnaire", ... },
    "WATemplateParams": { "BODY": ["{{{Name}}}"] }
  }}
```

### Example 2: Auto-Create Referral Record on Status Change + Boolean

```
Step 1: Set-Trigger
  tableName: "Accounts"
  type: "data change"
  name: "פתיחת הפניה לקיבוץ X"
  events: ["update"]
  oneachupdate: false
  onSetFields: ["StatusId", "KibbutzXField"]
  criterias: [
    { "F": "StatusId", "C": "containedIn", "V": ["id1", "id2"],
      "T": "Pointer", "P": { "targetClass": "AccountStatuses", "visibleVal": "הופנה, הפנייה נוספת", "multiple": true }},
    { "F": "KibbutzXField", "C": "equalTo", "V": true, "T": "Boolean" }
  ]

Step 2: Set-Trigger-Action
  actionType: "create-object"
  actionData: { "create-object": {
    "targetClass": "Referrals",
    "fieldsValue": [
      { "field": "Name", "type": "static", "value": "הפניה לקיבוץ X" },
      { "field": "AccountId", "type": "dynamic", "value": "currentObject", "targetClass": "Accounts" },
      { "field": "ReferralDate", "type": "dynamic", "value": "updatedAt", "timeGap": 1 },
      { "field": "Status", "type": "static", "value": "<statusId>", "targetClass": "ReferralStatuses", "visibleValue": "הופנה" },
      { "field": "KibbutzName", "type": "static", "value": "<kibbutzId>", "targetClass": "KibbutzNames", "visibleValue": "קיבוץ X" }
    ]
  }}
```

### Example 3: Multi-Action -- Email to Customer + Email to Manager + Create Record

```
Step 1: Set-Trigger on Accounts, events: ["update"], onSetFields: ["StatusId"]
  criteria: StatusId = "הופנה"

Step 2: Set-Trigger-Action -- email to customer (field)
  emailType: "field", emailTarget: "Email"

Step 3: Set-Trigger-Action -- email to manager (fixed)
  emailType: "fixed", emailTarget: "manager@company.com"
  emailSubject: "פרטי מתעניין חדש ({{{Name}}})"

Step 4: Set-Trigger-Action -- create referral record
  create-object with targetClass, fieldsValue
```

### Example 4: Scheduled Trigger -- Reminder 24 Hours Before Meeting

```
Step 1: Set-Trigger
  tableName: "Activities"
  type: "scheduled"
  name: "תזכורת לפגישה"
  schedulerField: "DateA"
  shcedulerHours: 24
  criterias: [{ "F": "ActivityTypeId", "C": "equalTo", "V": "<meetingTypeId>", "T": "Pointer", ... }]

Step 2: Set-Trigger-Action
  actionType: "notification"
  actionData: { "notification": {
    "userType": "field", "user": "OwnerId",
    "content": "תזכורת: פגישה מחר עם {{{AccountId.Name}}} - {{{Name}}}",
    "icon": "fa-calendar", "iconColor": "#013479"
  }}
```

### Example 5: Contact Field Sync (oneachupdate: true)

```
Step 1: Set-Trigger
  tableName: "Accounts"
  type: "data change"
  name: "עדכון איש קשר ראשי"
  events: ["create", "update"]
  oneachupdate: true
  onSetFields: ["MainContact"]
  criterias: [{ "F": "MainContact", "C": "equalTo", "V": "<optionId>", "T": "Pointer", ... }]

Step 2: Set-Trigger-Action
  actionType: "update-object"
  actionData: { "update-object": {
    "targetClass": "Accounts",
    "connection": "current.objectId",
    "fieldsValue": [
      { "field": "Main_F_Name", "type": "dynamic", "value": "F_namePartner1" },
      { "field": "Email", "type": "dynamic", "value": "EmailPartner1" },
      { "field": "PhoneNumber", "type": "dynamic", "value": "PhonePartner1" }
    ]
  }}
```

---

## Troubleshooting <a name="troubleshooting"></a>

| Problem | Likely Cause | Resolution |
|---------|-------------|------------|
| Trigger not firing | Inactive, criteria not met, or `onSetFields` wrong | Check `active`, verify criteria values, ensure changed field is in `onSetFields` |
| Trigger fired once but not again | `oneachupdate: false` | Set to `true` if it should fire every time |
| Email not sent | Wrong SMTP account or template ID | Verify with `Get-SMTP-Accounts` and check template exists |
| SMS not delivered | Phone format or SMS credits | Ensure no spaces/dashes in phone, check SMS balance |
| WhatsApp not sent | Wrong Identity or template not approved | Use Identity from Channels table, verify template status is APPROVED |
| create-object missing fields | Wrong field names or types | Run `Get-Schema` on target table to verify field names |
| update-object "missing type or field" | Wrong connection value | For self-update use exactly `"current.objectId"` |
| Infinite loop | Trigger A updates record → triggers B → triggers A | Use `onSetFields` to limit, check chain depth (max 3) |
| Action not attached | Wrong triggerId or triggerType mismatch | Verify triggerId and ensure triggerType matches the trigger's type |
| Scheduled trigger not firing | Date field empty or in the past | Ensure the date field has a future value |
| "Scheduler hours is required" | `shcedulerHours` set to 0 | Value 0 is not accepted. Use 1 (1h before) or -1 (1h after) as minimum |
| Delete action fails with "Cannot read properties of undefined" | Missing `actionData` in delete call | Always include `actionData` even when `deleteAction: true` |
| Can't find scheduled trigger ID | Scheduled triggers return different format | Use the `value` field from `{"value":"<mongoId>"}` response |

### Checking Trigger Logs

```
Get-Data(
    table: "_syslogTriggers",
    order: "-createdAt",
    limit: 10,
    keys: ["triggerId", "triggerName", "error", "status", "createdAt", "tableName"]
)
```

Look for `error` field -- common errors:
- `"missing type or field"` -- wrong connection or field type in update-object
- `"Can not find record"` -- source/target connection couldn't find the related record
- `"Max trigger depth reached"` -- trigger chain exceeded 3 levels
