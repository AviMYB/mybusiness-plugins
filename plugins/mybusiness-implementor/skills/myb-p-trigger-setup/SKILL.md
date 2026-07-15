---
name: myb-p-trigger-setup
description: "Create, configure, and manage triggers (automations) in MyBusiness CRM using MCP tools. Use this skill whenever a customer wants to set up automations, create triggers, configure automatic actions on record create/update, schedule time-based triggers, send automatic emails/SMS/WhatsApp on status change, auto-create records, auto-update related records, send notifications, call webhooks, or run server-side code. Also use when troubleshooting existing triggers or when the user mentions: טריגר, אוטומציה, כלל אוטומטי, שליחת מייל אוטומטית, שליחת SMS אוטומטי, יצירת רשומה אוטומטית, עדכון אוטומטי, התראה אוטומטית, תזמון, trigger, automation, auto-send, auto-create, auto-update, webhook, scheduled trigger, notification trigger."
---

# Trigger Setup / הגדרת טריגרים

Create, configure, and manage automations (triggers) in MyBusiness CRM.

## Architecture

Triggers follow a **two-step model**:
1. **Create the Trigger** (WHEN to fire) -- `Set-Trigger`
2. **Add Actions** (WHAT to do) -- `Set-Trigger-Action` (call once per action)

```
TRIGGER (When)                    ACTIONS (What) -- one or more
├── Type: data change / scheduled ├── email
├── Events: create / update       ├── sms
├── Criteria: conditions          ├── whatsapp-message
├── onSetFields: watched fields   ├── create-object
└── oneachupdate: repeat?         ├── update-object
                                  ├── notification
                                  ├── http (webhook)
                                  └── server-side-code
```

## What This Skill Covers vs. Does NOT Cover

### Covered (via MCP tools)
- Creating data-change triggers (on create/update)
- Creating scheduled triggers (relative to a date field)
- Adding all 8 action types: email, sms, whatsapp-message, create-object, update-object, notification, http, server-side-code
- Updating existing triggers and actions
- Deactivating triggers (`active: false`)
- Deleting individual actions from a trigger
- Querying existing triggers (`Get-Triggers`)

### NOT Covered / Limitations
- **Deleting triggers entirely** -- MCP can only deactivate, not delete. To delete: user must go to Admin > Databases > Tables > [Table] > Triggers and remove manually
- **"Add to Timeline" trigger type** -- only available in the UI, not via MCP
- **Suppressing triggers on single-record writes** -- triggers DO fire from API/MasterKey operations (verified live: `Create-Data`, `Update-Data`, `Create-Many` all fire create/update triggers), so testing via MCP is valid. The only opt-in suppression is `Create-Many(skipTriggers: true)` (master-key only; `skipTimeline: true` similarly suppresses Timeline entries); single-record tools have NO skip flag. ⚠️ Bulk writes storm automations by default. See the Testing section below
- **Viewing trigger execution logs in real-time** -- use `Get-Data` on `_syslogTriggers` table as a workaround
- **Editing email templates** -- templates must be created via the CRM UI first; the trigger only references an existing template by objectId
- **Creating/managing SMTP accounts** -- use `Get-SMTP-Accounts` to list existing ones; creation is done in UI
- **Creating/managing WhatsApp templates** -- templates must be pre-approved in Meta; use `Send-WhatsApp-Message` with `getTemplates: true` to list available ones

## Verified Gotchas (from hands-on testing)

1. **`shcedulerHours: 0` FAILS** -- the system rejects value 0 with "Scheduler hours is required". Use `1` (1 hour before) or `-1` (1 hour after) as the minimum. There is no "exactly at time" option via MCP.
2. **Scheduled triggers return a different ID format** -- they return a MongoDB ObjectId (`{"value":"69df53414167a73a568f34df"}`) instead of the Parse-style `_id`. Use the `value` field as the `triggerId` when adding actions.
3. **Scheduled trigger action responses are different too** -- they return a MongoDB document format (`{"ok":1,"value":{...}}`) instead of the full class schema.
4. **Deleting an action requires `actionData`** -- even when `deleteAction: true`, you MUST provide a valid `actionData` object for the action type. Without it, you get `"Cannot read properties of undefined"`. Send dummy/minimal actionData alongside `deleteAction: true`.
5. **AND + OR criteria work together** -- criteria without `condOr` are AND conditions. Criteria with `condOr: true` form an OR group. Both can coexist: the AND criteria must ALL match, and at least ONE of the OR criteria must match.
6. **Notification content supports HTML** -- you can use `<div>`, `<b>`, `<br/>` tags in notification content.
7. **Multiple actions on one trigger** -- call `Set-Trigger-Action` multiple times with the same `triggerId`. Each call adds a new action. Verified working with notification + http on same trigger.
8. **`onSetFields` with empty array `[]`** -- works but means the trigger evaluates on ANY field change (not recommended for update triggers).
9. **All 8 action types verified working** -- notification, update-object, create-object, http, server-side-code, sms, email, and whatsapp-message were all tested and confirmed working via MCP tools.
10. **`Get-WhatsApp-Template-Params` is unreliable for templates with 2+ body params** -- it may return only the FIRST parameter. Count the `{{N}}` placeholders in the template body yourself and build `WATemplateParams.BODY` with one entry per placeholder, in order, using dynamic `{{{FieldName}}}` placeholders from the triggered record.
11. **Email `emailTarget` supports pointer traversal** -- e.g., `"OwnerId.email"` sends to the owner's email. Both `"field"` and `"fixed"` emailType work correctly.
12. **Email subject supports date formatting** -- `{{{DateField.format(date,he-IL,Asia/Jerusalem)}}}` works in email subjects, not just body.
13. **Multiple email actions on same trigger** -- works (tested field + fixed email on same trigger).

## Workflow

### Step 0: Gather Requirements

Ask the user:
1. **Which table?** (e.g., Accounts, Sales, Cases, Tasks)
2. **When should it fire?** (on create, update, both, or scheduled)
3. **What conditions?** (e.g., status = "Won", amount > 50000)
4. **What action(s)?** (email, SMS, create task, update record, etc.)
5. **Repeat on every update or once?** (oneachupdate)

### Step 1: Get Schema -- understand the table

```
Get-Schema(tableName: "<Table>")
```

Identify field names, types, and pointer targets. This is MANDATORY before creating triggers.

### Step 2: Check existing triggers

```
Get-Triggers(tableName: "<Table>")
```

Review for conflicts or duplicates before creating new ones.

### Step 3: Create the trigger

Read `references/trigger-reference.md` for full parameter reference and examples for the specific trigger type and action types needed.

**Data Change trigger:**
```
Set-Trigger(
    tableName: "<Table>",
    type: "data change",
    active: true,
    name: "<descriptive name in Hebrew>",
    events: ["create"] / ["update"] / ["create", "update"],
    onSetFields: ["<field1>", "<field2>"],
    oneachupdate: true/false,
    criterias: [...]
)
```

**Scheduled trigger:**
```
Set-Trigger(
    tableName: "<Table>",
    type: "scheduled",
    active: true,
    name: "<descriptive name>",
    schedulerField: "<DateFieldName>",
    shcedulerHours: <number>,
    criterias: [...]
)
```

Save the returned trigger ID for adding actions:
- **Data change triggers** return the full table schema with a `triggers` array. Find your trigger by name and use its `_id` field.
- **Scheduled triggers** return `{"value":"<mongoId>"}`. Use the `value` field as your `triggerId`.

### Step 4: Add action(s)

Call `Set-Trigger-Action` once per action. See `references/trigger-reference.md` for the full actionData structure for each of the 8 action types.

```
Set-Trigger-Action(
    tableName: "<Table>",
    triggerId: "<trigger_id>",
    triggerType: "data change" / "scheduled",
    actionType: "<type>",
    actionData: { ... }
)
```

### Step 5: Verify and Test

**Triggers DO fire from API/MasterKey (MCP) operations** (verified live: `Create-Data`, `Update-Data`, and `Create-Many` all fire create/update triggers). Testing via MCP writes is valid -- UI and API writes behave the same. Suppression is opt-in only via `Create-Many(skipTriggers: true)`; single-record tools have no skip flag. ⚠️ This cuts both ways: bulk API writes storm automations by default -- plan imports accordingly.

Test via an MCP write, or have the user test through the CRM UI:

1. Trigger the event:
   - Via MCP: `Create-Data` / `Update-Data` a record on the monitored table, setting [specific field] to [specific value]
   - Or via UI: "Open the CRM at `https://<numericId>.mbapps.co.il/apps/mybusiness/<tablePage>`", create/edit a record and save
2. After the write, verify:
   ```
   Get-Data(table: "<TargetTable>", order: "-createdAt", limit: 1)
   ```
3. If the trigger didn't fire, check logs:
   ```
   Get-Data(table: "_syslogTriggers", order: "-createdAt", limit: 5, keys: ["triggerId", "error", "triggerName", "createdAt"])
   ```
4. Common issues:
   - `onSetFields` doesn't include the changed field
   - `criterias` not matching (wrong objectId, wrong type)
   - Trigger is inactive
   - `oneachupdate: false` and trigger already fired for this record
   - Trigger chain depth exceeded (max 3 levels)
   - Record was written with `Create-Many(skipTriggers: true)`

## Quick Reference: Criteria Object

```json
{
  "F": "FieldName",           // Field to check (dot notation for pointers: "OwnerId._User.name")
  "FText": "FieldName",       // Display label
  "C": "equalTo",             // Condition operator
  "V": "value",               // Value to compare (objectId for Pointers)
  "T": "Pointer",             // Type: String, Number, Pointer, Boolean, Date
  "P": {                      // Required for Pointer type only
    "targetClass": "TableName",
    "visibleVal": "Display Text",
    "multiple": false
  },
  "condOr": true              // Optional: makes this part of OR group
}
```

**Condition operators:** `equalTo`, `notEqualTo`, `greaterThan`, `lessThan`, `greaterThanOrEqualTo`, `lessThanOrEqualTo`, `contains`, `startsWith`, `containedIn`, `notContainedIn`

## Quick Reference: Dynamic Content Placeholders

Use `{{{FieldName}}}` in email subjects, SMS content, notification content, and HTTP URLs:
- `{{{Name}}}` -- field from triggered record
- `{{{AccountId.Name}}}` -- pointer traversal
- `{{{DateField.format(date,he-IL,Asia/Jerusalem)}}}` -- formatted date

## Common Patterns

| Pattern | Trigger | Action |
|---------|---------|--------|
| Status change notification | `events: ["update"]`, `onSetFields: ["StatusId"]`, criteria for status | notification / email / sms |
| Welcome email on new record | `events: ["create"]` | email |
| Auto-create follow-up task | `events: ["update"]`, criteria for completion status | create-object (Tasks) with DueDate = updatedAt + 1440 |
| Sync fields between tables | `events: ["update"]`, `onSetFields: ["<field>"]` | update-object with source/target connection |
| Scheduled reminder | `type: "scheduled"`, `shcedulerHours: 24` | sms / notification |
| Webhook to external system | `events: ["create", "update"]` | http POST |
| Record timestamp on change | `events: ["create", "update"]`, `onSetFields: ["<field>"]` | update-object current.objectId with updatedAt |

## Updating and Managing Triggers

**Update trigger:** Pass `_id` to `Set-Trigger` along with the fields to change
**Deactivate:** `Set-Trigger(_id: "<id>", tableName: "<Table>", type: "<type>", active: false)`
**Update action:** Pass `actionId` to `Set-Trigger-Action` with updated `actionData`
**Delete action:** Pass `deleteAction: true` AND a valid `actionData` to `Set-Trigger-Action` (actionData is required even for deletion -- the system throws an error without it; send minimal/dummy data for the action type)

For full parameter reference, action data structures, and detailed examples, read `references/trigger-reference.md`.
