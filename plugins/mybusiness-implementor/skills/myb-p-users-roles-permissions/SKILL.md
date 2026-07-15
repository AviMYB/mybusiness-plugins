---
name: myb-p-users-roles-permissions
description: "Manage users, roles, packages and table permissions in MyBusiness CRM. Use this skill whenever a customer wants to create/update users, assign packages (Business, Enterprise, etc.), onboard or offboard staff, manage user permissions, create custom roles, add or remove users from roles, configure table access (CLP - Class Level Permissions), set up access control, deactivate employees, reset passwords, or create portal users. Also use when the user mentions: משתמש חדש, הוספת משתמש, יצירת משתמש, ניהול משתמשים, תפקיד, הרשאה, הרשאות, רול, role, חבילה, אנטרפרייז, ביזנס, Business, Enterprise, גישה, CLP, ACL, נעילת גישה, הגבלת גישה, הסרת משתמש, כיבוי משתמש, איפוס סיסמה, משתמש פורטל, portal user, onboarding, offboarding, assign package, seat, מושב, מספר משתמשים, add user to role, remove user from role, table permissions, class level permissions."
---

# Users, Roles & Permissions / ניהול משתמשים, תפקידים והרשאות

Manage the three pillars of access control in MyBusiness CRM: **Users** (who), **Roles/Packages** (what they are licensed for), and **Table Permissions (CLP)** (what they can actually do with data).

## The Mental Model

```
 ┌──────────────┐       belongs to       ┌─────────────┐
 │    USER      │ ─────────────────────► │   PACKAGE   │   (seat / license)
 │  (_User)     │                        │  Business   │
 │              │                        │  Enterprise │
 │              │       member of        └─────────────┘
 │              │ ─────────────────────►
 │              │                        ┌─────────────┐
 │              │                        │    ROLE     │   (permission group)
 │              │                        │  Admin      │
 │              │                        │  Sales ...  │
 └──────────────┘                        └──────┬──────┘
                                                │
                                      referenced in
                                                ▼
                                         ┌─────────────┐
                                         │   TABLE     │   Class Level
                                         │    CLP      │   Permissions
                                         │             │   (find/get/
                                         │             │    create/update/
                                         │             │    delete)
                                         └─────────────┘
```

Three independent decisions for every employee: **Who are they? → What seat do they take? → What can they do?** Keep them separate — a user has no automatic role, a role has no automatic permission.

## Toolkit at a Glance

| Tool | Purpose |
|------|---------|
| `Get-all-Users` | List all users in the app |
| `Get-Current-User` | Who am I (the authenticated/Master user) |
| `Create-or-Update-User` | Create a user (omit `objectId`) or update one (pass `objectId`) |
| `Get-Packages` | List packages and which user owns which seat |
| `Set-Package-for-User` | Attach or detach a package seat for a user |
| `Get-Roles` | List all roles (system + custom) |
| `Get-Role-Users` | Who is in a given role |
| `Create-Role` | Create a custom role |
| `Add-Users-to-Role` | Add one or more users to a role |
| `Remove-Users-from-Role` | Remove one or more users from a role |
| `Get-Table-Permissions` | Read the Class Level Permissions for one table |
| `Set-Table-Permissions` | **Replace** the full CLP of a table |

Detailed parameter reference: `references/tools-reference.md`.

## The Canonical Onboarding Flow

Onboarding a new employee is always three sequential steps. Do not skip any of them — a user with no package cannot log in even if they have a role; a user with no role can log in but will see empty tables.

```
1. Create-or-Update-User  →  get back the userId (objectId)
2. Set-Package-for-User    →  consume a seat (Business or Enterprise)
3. Add-Users-to-Role       →  grant access to tables via the role's CLP
```

### Worked example

```
// 1. create
Create-or-Update-User({
  name: "דוד כהן",
  username: "david.cohen@acme.co.il",     // username IS the login email
  password: "Sales2026!",                  // ≥8 chars, 1 upper, 1 lower, 1 digit
  job: "מנהל מכירות",
  phone: "0501111001",
  active: true
})
// → { objectId: "6uWdJUouOg", ... }

// 2. seat the user on the Business package
Get-Packages()  // find resellerPackageId, e.g. "<businessPackageId>" for Business
Set-Package-for-User({
  userId: "6uWdJUouOg",
  resellerPackageId: "<businessPackageId>",
  action: "add"
})

// 3. grant Sales access
Get-Roles()  // find roleId, e.g. "slOOdR6Dyh" for Sales
Add-Users-to-Role({ roleId: "slOOdR6Dyh", userIds: ["6uWdJUouOg"] })
```

Put the IDs you learned from `Get-Packages` / `Get-Roles` at the top of your plan so you do not re-query them for every user. For a bulk onboarding script, fetch them once and reuse.

## Users (_User)

### Creating

`Create-or-Update-User` — omit `objectId` to create, pass `objectId` to update. Available fields:

| Field | Notes |
|------|-------|
| `name` | Display name (Hebrew OK) |
| `username` | **Login identifier, must equal the email** |
| `password` | Min 8 chars, must include lowercase + uppercase + digit |
| `job` | Job title (custom field, not in base schema) |
| `phone` | Phone number |
| `extension` | Phone extension |
| `active` | `true` = can log in; `false` = locked out (does NOT delete) |
| `isPortalUser` | `true` for external/customer portal users; they don't use a seat in the same way |
| `emailVerified` | Defaults to `true` |

### Updating vs. creating

Pass `objectId` to update — only the fields you pass are changed. Omitting a field leaves its current value untouched. This is the safe way to do partial updates.

### Deactivating (not deleting)

There is no delete-user MCP tool. The idiom is `active: false`:

```
Create-or-Update-User({ objectId: "CDb95TKZIg", active: false })
```

This preserves history (`createdBy`, record ownership, timelines) while blocking login. To reinstate someone, flip it back to `true`. Prefer deactivation over deletion for leavers — the CRM is full of pointer references to users that would break on hard delete.

### Password rules

Enforced server-side:
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one digit

Short or simple passwords raise `"Password must be at least 8 characters long"`. Pick something that meets all four criteria on the first try; retries are visible in `_password_history` and after a few failures the account lockout timer kicks in.

### Portal users

`isPortalUser: true` marks a user as an external customer-portal user. They authenticate differently and do not take a regular seat. Use for customer self-service scenarios (e.g., a customer who views only their own invoices).

## Packages (seats / licenses)

`Get-Packages` returns two things you need:

```
{
  packages: [
    { resellerPackageId: "5ae59690...", numberOfUsers: 7, resellerPackageIdData: { name: "Business" } },
    { resellerPackageId: "5ae5986c...", numberOfUsers: 8, resellerPackageIdData: { name: "Enterprise" } }
  ],
  users: [
    { parseId: "2b0QVKoigE", email: "...", relatedPackages: ["5ae5986c..."] }  // current seats
  ]
}
```

### Critical ID distinction

`Set-Package-for-User` takes `resellerPackageId` (like `<businessPackageId>`), **not** the package's internal `_id` (like `69e9c3c7...`). Using the wrong one silently fails or errors. Always copy `resellerPackageId` from `Get-Packages`.

### Capacity

Each package has `numberOfUsers` — the seat cap. Count current seats before adding: `users.filter(u => u.relatedPackages.includes(pkgId)).length` vs. `numberOfUsers`. Exceeding the cap will fail.

### Moving a user to a different package

Remove the old package first, then add the new one, otherwise the user briefly occupies two seats:

```
Set-Package-for-User({ userId, resellerPackageId: oldPkgId, action: "remove" })
Set-Package-for-User({ userId, resellerPackageId: newPkgId, action: "add" })
```

## Roles (_Role)

### System roles (created automatically with the app)

| Role | Color | Typical Purpose |
|------|-------|----------------|
| Admin | red | Full database admin |
| CRM | purple | General CRM user — read/write most tables |
| Sales | azure | Sales team — Accounts, Contacts, Sales, Tasks |
| Support | green | Support team — Cases, Tasks |
| Lead Admin | red | Lead management administration |
| Report Admin | orange | Reports & analytics access |
| MyBooks Admin | orange | Bookkeeping / invoicing admin |
| Campaign Manager | green | Marketing campaigns |
| MyChatAdmin | red | Chat module admin |
| MyChatUser | azure | Chat module agent |

Full catalog with which tables each touches: `references/system-roles.md`.

### Creating custom roles

```
Create-Role({
  name: "Field Agents",
  description: "נציגי שדה — מכירות ותמיכה",
  color: "green"   // green | red | yellow | orange | azure | purple
})
```

The returned `objectId` is the role ID you use in subsequent calls. A new role starts **empty** — no users, no table permissions. You must add users (`Add-Users-to-Role`) and grant CLP access (`Set-Table-Permissions`) explicitly.

### Adding / removing users

Both take arrays, so batch members efficiently:

```
Add-Users-to-Role({ roleId: "RGgGEH4iIZ", userIds: ["6uWdJUouOg","d56ft3TglJ","EkeJaH4t4W"] })
Remove-Users-from-Role({ roleId: "slOOdR6Dyh", userIds: ["6uWdJUouOg"] })
```

`Add-Users-to-Role` is idempotent-ish — re-adding an existing member does not error. A user can be a member of any number of roles simultaneously; their effective permissions are the **union** of what each role grants.

### Inspecting membership

`Get-Role-Users({ roleId })` returns `{objectId, name, email, username}` for each member. Use this before removing someone to confirm the scope, and after a change to verify.

## Table Permissions — Class Level Permissions (CLP)

CLP is the main permission layer. Each Parse class has six "actions": `find`, `get`, `create`, `update`, `delete`, `addField`. For each action there is an object listing who can perform it.

### Anatomy

```
{
  "find":   { "role:CRM": true, "role:Admin": true, "role:Sales": true },
  "get":    { "role:CRM": true, "role:Admin": true, "role:Sales": true },
  "create": { "role:CRM": true, "role:Admin": true, "role:Sales": true },
  "update": { "role:CRM": true, "role:Admin": true, "role:Sales": true, "EkeJaH4t4W": true },
  "delete": { "role:Admin": true },
  "addField": {}
}
```

Key types (each key's value is **always `true`**):

| Key pattern | Meaning |
|-------------|---------|
| `role:<RoleName>` | All users who belong to that role |
| `<userObjectId>` | A specific user (by their `_User.objectId`) |
| `*` | Public / anonymous — use with extreme care |
| `requiresAuthentication` | Any logged-in user |

An empty object `{}` means **no one can perform that action via the normal API**. Only the Master key (MCP itself) can do it.

### The replace-all gotcha

`Set-Table-Permissions` REPLACES the whole CLP — there is no "patch single action" endpoint. You must send **all six keys** (`find`, `get`, `create`, `update`, `delete`, `addField`). The safe workflow:

```
1. Get-Table-Permissions({ table })        // read current state
2. Modify the returned object in memory     // add/remove keys as needed
3. Set-Table-Permissions({ table, classLevelPermissions: modifiedObject })
```

Skipping step 1 and sending a partial object will erase the actions you did not include — Sales team can suddenly no longer see Accounts because you forgot `find`.

### find vs. get

`find` = list query (the grid). `get` = single-record fetch by objectId (opening a card). **Keep them identical** in almost every case — a role that can open cards but not list them, or vice versa, creates a broken UX. Only split them for very narrow audit scenarios.

### Common patterns

Complete patterns (read-only viewer, no-delete collaborator, field agents, finance read-only, single-user exception, etc.) with full JSON examples: `references/clp-patterns.md`.

### User-specific permissions

Beyond roles, you can whitelist a single user by their objectId as a key:

```
"update": { "role:Support": true, "EkeJaH4t4W": true }
```

Useful for exceptions — e.g., a manager who is not in the Admin role but needs update access on one sensitive table. Prefer roles for anything that generalizes; reserve user-level keys for true one-offs so permissions remain maintainable.

## Pitfalls & Why They Bite

1. **`Set-Table-Permissions` replaces all six actions.** Always read first, modify, then write. Forgetting an action silently revokes it.
2. **Password rules are strict.** 8+ chars, upper + lower + digit. Suggest a pattern like `Word2026!` to customers.
3. **Packages use `resellerPackageId`, not `_id`.** Two similar-looking fields; only one works.
4. **Seat counts are capped.** `numberOfUsers` is enforced — check remaining capacity before bulk-onboarding.
5. **Deactivate, don't delete.** No delete-user tool exists; `active: false` is the right answer and preserves references.
6. **New custom roles grant nothing automatically.** Membership alone does nothing until you add the role to at least one table's CLP.
7. **`username` is the email.** The Parse `username` field is the login identifier and should equal the email address.
8. **Users' effective permissions = union over their roles.** If someone has unexpectedly broad access, check every role they belong to — not just the most obvious one.
9. **Role assignment does NOT imply package assignment.** A user in a role without a seat still cannot log in. Always do both.
10. **System roles cannot be renamed via MCP.** Their names (`Admin`, `Sales`, ...) are the canonical keys other CLPs reference. Changing the name would break every CLP that says `role:Admin`.

## Suggested Workflows

### Onboard N new employees (bulk)

```
1. Get-Packages  — verify seats available (Business 7, Enterprise 8, etc.)
2. Get-Roles     — map role names → roleIds once
3. For each employee:
     Create-or-Update-User → get userId
     Set-Package-for-User  → attach seat
4. Group users by role and call Add-Users-to-Role once per role with the full array.
```

Grouping the final step cuts round-trips: one `Add-Users-to-Role` call for all four new salespeople instead of four calls.

### Offboarding

```
1. Create-or-Update-User({ objectId, active: false })   // block login
2. Remove-Users-from-Role for every role they were in    // optional but tidy
3. Set-Package-for-User(action: "remove")                // free the seat
```

Do not delete — preserves audit trail. Freeing the seat lets you onboard the replacement.

### Promoting a user (role change)

```
Remove-Users-from-Role({ roleId: oldRoleId, userIds: [userId] })
Add-Users-to-Role({ roleId: newRoleId, userIds: [userId] })
```

Verify with `Get-Role-Users` on both roles.

### Restricting a table to a single department

```
1. Get-Table-Permissions({ table: "Invoices" })
2. Build new CLP: only role:MyBooks Admin + role:Admin on every action
3. Set-Table-Permissions({ table: "Invoices", classLevelPermissions: ... })
4. Get-Table-Permissions to verify
```

### Granting a manager read-only access to another team's table

```
Add their userObjectId to find + get only. Do not add to create/update/delete.
```

See `references/clp-patterns.md` for the full JSON template.

## Reference Files

| File | When to read |
|------|--------------|
| `references/tools-reference.md` | Need exact parameters / return shapes for a specific tool |
| `references/system-roles.md` | Figuring out which built-in role corresponds to a customer's job title |
| `references/clp-patterns.md` | Building a CLP — copy a template and adapt |

## Verification Checklist

After any change, prove it worked:

- Created a user? `Get-all-Users` should now include them.
- Set a package? `Get-Packages` → `users` array shows the new `relatedPackages` entry.
- Added to a role? `Get-Role-Users({ roleId })` should return them.
- Changed CLP? `Get-Table-Permissions({ table })` should reflect the new shape.

Don't trust the write call's "OK" response alone when permissions are sensitive — the readback is free insurance.
