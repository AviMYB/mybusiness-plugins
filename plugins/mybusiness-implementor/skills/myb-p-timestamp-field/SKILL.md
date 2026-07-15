---
name: myb-p-timestamp-field
description: "Create a timestamp (date) field in MyBusiness CRM that automatically records when a specific field is set or changed. Use this skill whenever a customer wants to document/log/track when a field was changed, record the date of a status change, timestamp when an owner was assigned, track when a field was first set, audit field change dates, or create date-based SLA tracking. Triggers on requests like: 'תיעוד תאריך שינוי סטטוס', 'מתי שונה האחראי', 'timestamp for field change', 'לתעד מתי שדה השתנה', 'חותמת זמן לשינוי', 'track when status changed', 'record assignment date', 'תאריך הקצאה', 'מתי הוגדר לראשונה', 'audit trail for field'."
---

# Timestamp Field / שדה חותמת זמן

Automatically record when a field is set or changed by creating a Date field + trigger with `onSetFields`.

## What You Need From the User

1. **Table** — e.g., Sales, Cases, Tasks
2. **Field to monitor** — e.g., OwnerId, SaleStatusId
3. **Every change or first time only?** — default: every change (`oneachupdate: true`)

## Steps

### 1. Get-Schema — verify the monitored field exists and no timestamp field already exists

### 2. Add-Field-to-Table — add a Date field

```
Add-Field-to-Table(table: "<Table>", fields: [{ name: "<Field>SetDate", type: "Date", label: "<Hebrew>" }])
```

### 3. Set-Trigger — create the trigger

```
Set-Trigger(
    tableName: "<Table>", type: "data change", active: true,
    name: "<descriptive Hebrew name>",
    events: ["create", "update"],
    oneachupdate: true,
    onSetFields: ["<MonitoredField>"]
)
```

- `events: ["create", "update"]` catches both creation-with-value and later changes
- `oneachupdate: false` for one-time-only timestamps (e.g., lead conversion date)
- Save the trigger `_id` from the response

### 4. Set-Trigger-Action — add the update action

```
Set-Trigger-Action(
    tableName: "<Table>", triggerId: "<id>", triggerType: "data change",
    actionType: "update-object",
    actionData: {
        "update-object": {
            "targetClass": "<Table>",
            "connection": "current.objectId",
            "fieldsValue": [{
                "field": "<TimestampField>",
                "type": "dynamic",
                "value": "updatedAt",
                "visibleVal": "updatedAt"
            }]
        }
    }
)
```

**`connection` MUST be `current.objectId`** — this is the only value that works for same-record updates. Using `self`, `objectId`, `target.objectId`, or `source.objectId` will fail with `"missing type or field"`.

Date fields only accept `dynamic` values — `updatedAt` gives the current moment.

### 5. Verify

**Triggers DO fire from API/MasterKey writes too (verified live).** Change the monitored field via `Update-Data` (or have the user change it in the CRM UI — both behave the same), then verify with Get-Data:

```
Get-Data(table: "<Table>", objectId: "<id>", keys: ["<TimestampField>", "updatedAt"])
```

If empty, check logs: `Get-Data(table: "_syslogTriggers", order: "-createdAt", limit: 3)` — look for the trigger ID and `error` field.

The one exception: bulk imports run with `Create-Many(skipTriggers: true)` skip the trigger — backfill the timestamp field as part of such imports.

## Variations

**Conditional timestamp** — add `criterias` to fire only on a specific value (e.g., status = "Won"):
```
criterias: [{ "F": "SaleStatusId", "C": "equalTo", "V": "<objectId>", "T": "Pointer",
              "P": { "targetClass": "SaleStatuses", "visibleVal": "הושלם" } }]
```

**Timestamp on a related record** — use `"connection": "source.AccountId"` to update the linked Account instead of the current record.

**Multiple fields** — create separate trigger+field pairs for clarity. A single trigger with multiple `onSetFields` fires on ANY of them but writes to one field, so it only works as a generic "last modified" date.
