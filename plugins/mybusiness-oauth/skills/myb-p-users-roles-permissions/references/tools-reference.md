# Tools Reference

Complete parameter and return shapes for every MCP tool related to users, roles, packages, and permissions. Treat this as the authoritative spec when you need the exact shape of a call.

## Table of Contents
1. [Get-Current-User](#get-current-user)
2. [Get-all-Users](#get-all-users)
3. [Create-or-Update-User](#create-or-update-user)
4. [Get-Packages](#get-packages)
5. [Set-Package-for-User](#set-package-for-user)
6. [Get-Roles](#get-roles)
7. [Get-Role-Users](#get-role-users)
8. [Create-Role](#create-role)
9. [Add-Users-to-Role](#add-users-to-role)
10. [Remove-Users-from-Role](#remove-users-from-role)
11. [Get-Table-Permissions](#get-table-permissions)
12. [Set-Table-Permissions](#set-table-permissions)

---

## Get-Current-User

No parameters. Returns information about the authenticated user (when using Master key, returns a synthetic Master record).

**Return:**
```json
{
  "objectId": "Master",
  "username": "Master",
  "name": "avi",
  "appId": "aaaa...",
  "email": "owner@example.com"
}
```

Use this early in a session to confirm which app you're operating against.

---

## Get-all-Users

No parameters. Returns the array of all users in `_User`.

**Return (partial):**
```json
[
  {
    "objectId": "2b0QVKoigE",
    "username": "owner@example.com",
    "email": "owner@example.com",
    "name": "avi tests",
    "active": true,
    "last_success_login": { "__type": "Date", "iso": "2026-04-20T06:02:00Z" },
    "_failed_login_count": 0,
    "ACL": { "*": { "read": true }, "2b0QVKoigE": { "read": true, "write": true } }
  }
]
```

The `_failed_login_count` and `_account_lockout_expires_at` fields surface lockouts — useful when debugging "user cannot log in".

---

## Create-or-Update-User

One tool for both create and update. **Omit `objectId` to create; include `objectId` to update.**

**Parameters:**

| Field | Type | Required | Notes |
|------|------|----------|-------|
| `objectId` | string | only for update | Existing user's Parse objectId |
| `name` | string | — | Display name |
| `username` | string | yes (on create) | Login identifier, should equal email |
| `password` | string | yes (on create) | Min 8 chars, 1 upper, 1 lower, 1 digit |
| `job` | string | — | Job title |
| `phone` | string | — | Phone number |
| `extension` | string | — | Phone extension |
| `active` | boolean | — | `false` blocks login |
| `isPortalUser` | boolean | — | External portal user; default `false` |
| `emailVerified` | boolean | — | Default `true` |

**Return (create):**
```json
{ "objectId": "6uWdJUouOg", "createdAt": "2026-04-23T07:04:28Z", "sessionToken": "r:..." }
```

**Return (update):**
```json
{ "objectId": "6uWdJUouOg", "updatedAt": "2026-04-23T07:07:16Z" }
```

**Error examples:**
- `"Password must be at least 8 characters long"` — password is too short or too simple.
- Duplicate username will error — Parse enforces uniqueness on `username`.

**Patterns:**
- Partial update: pass `objectId` + only the field(s) to change. Other fields retain their existing value.
- Deactivation: `{ objectId, active: false }`.
- Password reset (admin): `{ objectId, password: "<new-passw0rd>" }` (example only — meets the policy above).

---

## Get-Packages

No parameters. Returns available packages and which users occupy which seats.

**Return:**
```json
{
  "packages": [
    {
      "_id": "69bfd8149cbf3f5ed63463bb",                    // internal — DO NOT pass to Set-Package-for-User
      "resellerPackageId": "5ae5986c9a2e78001af81715",       // ← use THIS as resellerPackageId
      "numberOfUsers": 8,
      "validUntil": "2027-04-05T00:00:00Z",
      "resellerPackageIdData": { "name": "Enterprise" }
    },
    {
      "_id": "69e9c3c7...",
      "resellerPackageId": "<businessPackageId>",
      "numberOfUsers": 7,
      "resellerPackageIdData": { "name": "Business" }
    }
  ],
  "users": [
    {
      "parseId": "2b0QVKoigE",
      "email": "owner@example.com",
      "relatedPackages": ["5ae5986c9a2e78001af81715"]
    }
  ]
}
```

**How to compute free seats:**
```
free = numberOfUsers − count(users where relatedPackages includes resellerPackageId)
```

---

## Set-Package-for-User

Attach or detach a package seat for a user.

**Parameters:**

| Field | Type | Required | Notes |
|------|------|----------|-------|
| `userId` | string | yes | Parse `_User.objectId` |
| `resellerPackageId` | string | yes | From `Get-Packages`. **Not** the `_id`. |
| `action` | `"add"` \| `"remove"` | yes | |

**Return:** string `"OK"` on success.

To move a user between packages, call `remove` on the old package, then `add` on the new one, so they do not briefly consume two seats.

---

## Get-Roles

No parameters. Returns all roles (system + custom).

**Return:**
```json
[
  { "objectId": "aZPDIDZS4b", "name": "Admin", "description": "Database administrator", "color": "red" },
  { "objectId": "slOOdR6Dyh", "name": "Sales", "description": "", "color": "azure" }
]
```

Color is one of: `green`, `red`, `yellow`, `orange`, `azure`, `purple`.

---

## Get-Role-Users

**Parameters:** `roleId` (string, required) — `_Role.objectId`.

**Return:**
```json
[
  { "objectId": "6uWdJUouOg", "name": "דוד כהן", "email": "david.cohen@alphatech.co.il", "username": "david.cohen@alphatech.co.il" }
]
```

Note: `Get-Schema` for `_Role` returns `{}` — _Role is a Parse system class whose schema is fixed (name, users relation, roles relation) and not exposed via Get-Schema.

---

## Create-Role

Create a custom role.

**Parameters:**

| Field | Type | Required |
|------|------|----------|
| `name` | string | yes |
| `description` | string | — |
| `color` | enum | — — one of `green`, `red`, `yellow`, `orange`, `azure`, `purple` |

**Return:** `{ "objectId": "RGgGEH4iIZ", "createdAt": "..." }`.

The new role starts empty (no members, no CLP grants). Add members with `Add-Users-to-Role` and grant table access with `Set-Table-Permissions`.

---

## Add-Users-to-Role

**Parameters:**

| Field | Type | Required |
|------|------|----------|
| `roleId` | string | yes |
| `userIds` | string[] | yes |

**Return:** `{ "objectId": "<roleId>", "updatedAt": "..." }`.

Takes an array — batch members in one call instead of looping. Re-adding an existing member is safe (no error).

---

## Remove-Users-from-Role

Same parameter shape as `Add-Users-to-Role`. Returns `{ objectId, updatedAt }`.

Removing a user who is not a member is safe.

---

## Get-Table-Permissions

Read the CLP for one table.

**Parameters:** `table` (string, required).

**Return:**
```json
{
  "classLevelPermissions": {
    "find":   { "role:CRM": true, "role:Admin": true, "role:Sales": true },
    "get":    { "role:CRM": true, "role:Admin": true, "role:Sales": true },
    "create": { "role:CRM": true, "role:Admin": true, "role:Sales": true },
    "update": { "role:CRM": true, "role:Admin": true, "role:Sales": true },
    "delete": { "role:CRM": true, "role:Admin": true, "role:Sales": true },
    "addField": {}
  }
}
```

**Errors:**
- `"Error: Class <Table> does not exist."` — the class name is wrong, case-sensitive, or not present in this app.

---

## Set-Table-Permissions

Replace the CLP for one table. **All six actions must be included** — this is a full replace, not a patch.

**Parameters:**

| Field | Type | Required |
|------|------|----------|
| `table` | string | yes |
| `classLevelPermissions` | object | yes — must contain keys `find`, `get`, `create`, `update`, `delete`, `addField` |

**CLP key patterns:**

| Key | Meaning |
|-----|---------|
| `role:<RoleName>` | Grant to all users in that role (name must match `Get-Roles` exactly, case-sensitive) |
| `<userObjectId>` | Grant to one specific user by `_User.objectId` |
| `*` | Public — anyone can perform this action |
| `requiresAuthentication` | Any logged-in user |

Value is always `true`. There is no `false` — absence of a key means no grant.

**Return:** full class schema including fields, the updated `classLevelPermissions`, triggers, and timeline config. Treat the `classLevelPermissions` block as the source of truth for what was applied.

**Workflow:**
```
1. snapshot = Get-Table-Permissions({ table })
2. new = { ...snapshot.classLevelPermissions }
   new.find[`role:Finance`] = true
   new.get[`role:Finance`]  = true
3. Set-Table-Permissions({ table, classLevelPermissions: new })
```

**Common mistake:** forgetting to include all six keys (especially `addField`, which is often `{}` but must still be present). Sending `{ find, get }` alone will erase `create`, `update`, `delete`.
