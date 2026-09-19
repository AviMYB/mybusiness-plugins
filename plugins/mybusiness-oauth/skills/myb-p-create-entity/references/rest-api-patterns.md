# Entity Creation — MCP-First Policy & REST-Layer Background

## The policy: MCP is the only sanctioned path

From a working session, the `mcp__MyBusiness__*` tools are the **only** sanctioned way to touch a tenant. Never handle tenant credentials in any form: no credential files, no raw Parse REST calls, no key-bearing headers, no proxy internals. The tool-permission layer is a security boundary — do not go around it.

**On failure:** if a required MCP tool fails with its documented error signature (e.g., `Create-Table` → `"missing user"`), retry once to rule out a transient error, then **mark the step blocked and escalate to the MyBusiness team** (internal ops runbook). Do not improvise a credentialed workaround.

**Internal team only:** where a credentialed path is legitimately required, that procedure lives in the internal tier. Credentials there are fetched at runtime via the `get-secret` CLI (secrets-manager skill) — never stored in files, never pasted.

## Background: what the raw REST layer historically covered

Kept as context so you can recognize when a blocked step is one of these known cases. **Do not execute these via REST from a session** — probe the MCP tool first; only on the exact documented failure, mark blocked + escalate.

| Operation | Why REST was once used | Sanctioned path today |
|---|---|---|
| Create a table (schema), incl. Pointer fields | `Create-Table` MCP reportedly returned `"missing user"` (unverified as of 2026-07 — re-test before relying) | `Create-Table` MCP; on the exact documented error → blocked + escalate |
| Create records with Pointer / Date values | `Create-Data` MCP reportedly failed on nested objects (unverified as of 2026-07 — re-test before relying) | `Create-Many` MCP with `__type: "Pointer"` / `__type: "Date"`; on error → blocked + escalate |
| Bulk ACL update on records created outside MCP | REST-created records carried no ACL, making them invisible to logged-in users | Not applicable to MCP-created records; if records are inaccessible, escalate |

## Setting CLP — USE ROLES, NOT `*`

Parse-level `{"*": true}` is NOT enough — the CRM front-end enforces role-based access and users see "no permissions" errors.

**Use the MCP `Set-Table-Permissions` tool with the same roles as Cases/Accounts:**

```
Set-Table-Permissions(
  table: "YourTableName",
  classLevelPermissions: {
    find:    {"role:CRM": true, "role:Admin": true, "role:Support": true},
    get:     {"role:CRM": true, "role:Admin": true, "role:Support": true},
    create:  {"role:CRM": true, "role:Admin": true, "role:Support": true},
    update:  {"role:CRM": true, "role:Admin": true, "role:Support": true},
    delete:  {"role:CRM": true, "role:Admin": true, "role:Support": true},
    addField: {}
  }
)
```

Verify by fetching the schema — CLPs should show role keys, not `*`.

Run on ALL new tables immediately after creation. Do in parallel.

## Creating Records with Pointers

Use the MCP `Create-Many` tool — it handles `__type: "Pointer"` and `__type: "Date"`:

```
Create-Many(table: "Suppliers", data: [
  {
    Name: "אלקטרוניקה הצפון",
    Email: "info@example.co.il",
    Active: true,
    StatusId: {__type: "Pointer", className: "SupplierStatuses", objectId: "abc1234567"},
    JoinDate: {__type: "Date", iso: "2026-01-15T00:00:00.000Z"}
  }
])
```

If `Create-Many` errors on a record shape it should support, capture the exact error, mark the step blocked, and escalate to the MyBusiness team — do not fall back to raw API calls.

## Record ACLs

Records created via the sanctioned MCP tools are expected to be accessible to logged-in users. If records turn out inaccessible even though the table CLP is role-based (see above), that is an escalation case — the bulk-ACL repair is an internal ops procedure, not something to run from a session.

## Uploading a Public File

Use the MCP tool `Upload-Public-File`:
- `name`: filename (e.g., `entity-list.js`)
- `mimeType`: `"text/javascript"` for JS, `"text/css"` for CSS
- `data`: base64-encoded file content

To encode a local file on Windows (no `/dev/stdin` support):
```bash
node -e "console.log(require('fs').readFileSync('path/to/file.js').toString('base64'))"
```

The tool returns a URL at `mb-static-files.s3.il-central-1.amazonaws.com/...`. Copy it.

Then attach it to the page programmatically with `Set-Page-Settings`:

```
Set-Page-Settings(pageId: <pageId>, jsFile: "<URL>")
```

You can pass `cssFile`, `title` (Page Title / SEO — useful when a page was copied and inherited the wrong title), `description`, `keywords`, `metaTags`, `loginOnly`, `allowedRoles`, `dynamicTable`, `dynamicFields` in the same call. Verify with `Get-Page-Settings(pageId)`. The user only needs to hard-reload (Ctrl+F5).
