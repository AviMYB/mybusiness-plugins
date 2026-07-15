# CLP Patterns

Ready-to-adapt Class Level Permissions templates for the most common access-control scenarios. Copy the JSON, swap in role/user IDs for the target app, and pass to `Set-Table-Permissions`.

## Remember

- **All six keys are mandatory:** `find`, `get`, `create`, `update`, `delete`, `addField`. An omitted key is erased.
- **`find` and `get` should match** in almost every case. Split only for deliberate audit scenarios.
- **Values are always `true`.** Absence of a key = no grant.
- **Always read first** with `Get-Table-Permissions`, then modify, then write. Skipping the read risks erasing existing roles you did not intend to touch.

---

## Pattern 1 — Default CRM Table (three core roles with full CRUD)

The standard template the CRM ships with for core entities (Accounts, Contacts, Activities, Tasks):

```json
{
  "find":   { "role:CRM": true, "role:Admin": true, "role:Sales": true, "role:Support": true },
  "get":    { "role:CRM": true, "role:Admin": true, "role:Sales": true, "role:Support": true },
  "create": { "role:CRM": true, "role:Admin": true, "role:Sales": true, "role:Support": true },
  "update": { "role:CRM": true, "role:Admin": true, "role:Sales": true, "role:Support": true },
  "delete": { "role:CRM": true, "role:Admin": true, "role:Sales": true, "role:Support": true },
  "addField": {}
}
```

Start from this and trim. Use this as the default for any new custom entity table you create.

---

## Pattern 2 — Sales-only table

Sales artifact that the Support team should not touch (e.g., Sales itself, Quotes):

```json
{
  "find":   { "role:CRM": true, "role:Admin": true, "role:Sales": true },
  "get":    { "role:CRM": true, "role:Admin": true, "role:Sales": true },
  "create": { "role:CRM": true, "role:Admin": true, "role:Sales": true },
  "update": { "role:CRM": true, "role:Admin": true, "role:Sales": true },
  "delete": { "role:CRM": true, "role:Admin": true, "role:Sales": true },
  "addField": {}
}
```

---

## Pattern 3 — Support-only table

Cases, SLA artefacts, support-specific tables:

```json
{
  "find":   { "role:CRM": true, "role:Admin": true, "role:Support": true },
  "get":    { "role:CRM": true, "role:Admin": true, "role:Support": true },
  "create": { "role:CRM": true, "role:Admin": true, "role:Support": true },
  "update": { "role:CRM": true, "role:Admin": true, "role:Support": true },
  "delete": { "role:CRM": true, "role:Admin": true, "role:Support": true },
  "addField": {}
}
```

---

## Pattern 4 — Read-only viewer

A role that can browse but never modify. Common for Finance peeking at Sales, or Auditor on Invoices:

```json
{
  "find":   { "role:Admin": true, "role:Finance": true },
  "get":    { "role:Admin": true, "role:Finance": true },
  "create": { "role:Admin": true },
  "update": { "role:Admin": true },
  "delete": { "role:Admin": true },
  "addField": {}
}
```

The viewer role only appears in `find` and `get`. It cannot write.

---

## Pattern 5 — Collaborator without delete

Allow a role to create and edit but never delete. Good for junior staff, or any case where you want to force "Lost/Cancelled" transitions instead of hard deletes:

```json
{
  "find":   { "role:Admin": true, "role:Sales": true, "role:Field Agents": true },
  "get":    { "role:Admin": true, "role:Sales": true, "role:Field Agents": true },
  "create": { "role:Admin": true, "role:Sales": true, "role:Field Agents": true },
  "update": { "role:Admin": true, "role:Sales": true, "role:Field Agents": true },
  "delete": { "role:Admin": true, "role:Sales": true },
  "addField": {}
}
```

Field Agents appears in 4 of 5 actions — all except `delete`.

---

## Pattern 6 — Single user exception

Grant one specific user an extra permission without creating a whole role. Use the user's `_User.objectId` as the key:

```json
{
  "find":   { "role:Support": true, "role:Admin": true },
  "get":    { "role:Support": true, "role:Admin": true },
  "create": { "role:Support": true, "role:Admin": true },
  "update": { "role:Support": true, "role:Admin": true, "EkeJaH4t4W": true },
  "delete": { "role:Admin": true },
  "addField": {}
}
```

Here user `EkeJaH4t4W` can update Cases even though they are not in `Support` or `Admin`. Use this sparingly — too many user-keys make CLPs unreadable. Prefer roles for anything that will generalize.

---

## Pattern 7 — Admin-only lockdown

A very sensitive table (audit log, configuration, private keys) where only admins should have access:

```json
{
  "find":   { "role:Admin": true },
  "get":    { "role:Admin": true },
  "create": { "role:Admin": true },
  "update": { "role:Admin": true },
  "delete": { "role:Admin": true },
  "addField": {}
}
```

---

## Pattern 8 — Locked table (only Master key)

Nobody, not even admins, can write through the API. Only MCP / Master key can modify. Useful for system tables driven by triggers only:

```json
{
  "find":   { "role:Admin": true, "role:CRM": true },
  "get":    { "role:Admin": true, "role:CRM": true },
  "create": {},
  "update": {},
  "delete": {},
  "addField": {}
}
```

Reads allowed, writes all empty.

---

## Pattern 9 — Authenticated-anyone access

Any logged-in user regardless of role. Use for true utility tables (e.g., country list):

```json
{
  "find":   { "requiresAuthentication": true },
  "get":    { "requiresAuthentication": true },
  "create": { "role:Admin": true },
  "update": { "role:Admin": true },
  "delete": { "role:Admin": true },
  "addField": {}
}
```

---

## Pattern 10 — Public read (anonymous)

`*` means public. **Only use for tables deliberately exposed to the internet** — e.g., a public catalog on a landing page:

```json
{
  "find":   { "*": true },
  "get":    { "*": true },
  "create": { "role:Admin": true },
  "update": { "role:Admin": true },
  "delete": { "role:Admin": true },
  "addField": {}
}
```

Double-check with the customer before enabling `*`. Once public, the data is world-readable.

---

## Role-name conventions

Keys use the exact role name as returned by `Get-Roles`:
- Case-sensitive: `role:Admin` works; `role:admin` does not.
- Spaces allowed: `role:Report Admin`, `role:Field Agents` — just don't forget them.
- Custom roles you create are used the same way: `role:<YourCustomName>`.

If a CLP is silently failing ("the user is in Support but can't read the table"), inspect the role name with `Get-Roles` — a typo in the CLP key is the most common cause.
