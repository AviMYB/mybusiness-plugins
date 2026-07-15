# Files & Storage

> **Purpose**: How files work in MyBusiness CRM — upload paths (MCP tool, Parse REST), retrieval (tool + `file-storage:///` resource URIs), attaching files to records, public vs private files, page code files, and the storage-quota mechanism.
> **Last updated**: 2026-06-10 · **Status**: draft

---

## 1. Field types

| Schema type | Behavior |
|---|---|
| `File` | public file — URL readable by anyone who has it |
| `PrivateFile` | access-controlled file (served per permissions) |

A populated file field on a record carries the Parse File shape:

```json
{ "__type": "File", "name": "db295fb2-…-logo.png", "url": "https://api.mbapps.co.il/parse/files/…" }
```

Server-side code reads it via the SDK: `record.get("LogoHeb").url()` (verified in `accountingSettings` — `AccountingSettings.LogoHeb`). Table views render `File`/`PrivateFile` columns natively (column `type` enum in `Edit-Table-View`).

## 2. Upload paths

### 2.1 MCP tool — `Upload-Public-File` 🔴 (live schema)

```json
{ "file": {
    "name": "price-quote.pdf",
    "mimeType": "application/pdf",
    "data": "<base64 — no data-URI prefix>",
    "keepName": true,            // default true; false → server uniquifies the name
    "cacheControl": "max-age=86400",   // default
    "codeFile": false,           // true → editable in the platform code editor (JS/CSS deploys)
    "_id": "<existing file id>"  // provide to UPDATE the file in place (stable URL)
} }
```

Returns a **public URL**. Common MIME types: `application/pdf`, `image/png`, `image/jpeg`, `text/javascript`, `text/css`, Word `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, Excel `…spreadsheetml.sheet`.

Two important product workflows ride this tool:

1. **Attach to a record**: upload → take the returned URL → set the record's `File` field (via `Update-Data`/REST with the `__type:File` object, or store the raw URL in a String field where the page expects that).
2. **Stable page-code deploys**: upload with `codeFile: true` (+ reuse `_id` on subsequent versions so the URL never changes), then point the page at it once via `Set-Page-Settings { jsFile / cssFile }` — afterwards every code change is just a re-upload with the same `_id`, no page edits (the May-2026 design-system convention).

### 2.2 Parse Files REST

```bash
# upload — body is the raw bytes; Content-Type = the file's type; 10 MB limit
curl -X POST "https://api.mbapps.co.il/parse/files/pic.jpg" \
  -H "X-Parse-Application-Id: $APP_ID" -H "X-Parse-Master-Key: $MASTER_KEY" \
  -H "Content-Type: image/jpeg" --data-binary '@myPicture.jpg'
# → 201 { "url": "…", "name": "<uuid>-pic.jpg" }   (name auto-uniquified; no collisions)
```

Associate with a record (use the **returned** `name` + `url`, not the local filename):

```json
POST /parse/classes/Documents
{ "Name": "חוזה", "Attachment": { "__type": "File", "name": "<returned name>", "url": "<returned url>" } }
```

Deleting files: Parse supports `DELETE /parse/files/<name>` with the master key (ParseDocs 08-files/03) — ⚠️ UNVERIFIED whether the product exposes/permits this on api.mbapps.co.il; treat file deletion as an ops task.

### 2.3 What does NOT take files

- `web2lead` / `web2table` — file upload unsupported in the form-intake flow ([03-web2lead-web2table.md](03-web2lead-web2table.md)); upload separately and link.
- WhatsApp send uses its own inline transport: `fileBase64` **with** Data-URI prefix, or `fileDBName` to send a file already stored in the CRM ([05-messaging-channels.md](05-messaging-channels.md) §3.2). Note the prefix asymmetry: `Upload-Public-File.data` = bare base64; `Send-WhatsApp-Message.fileBase64` = `data:<mime>;base64,…`.

## 3. Retrieval

### 3.1 `Get-File-Content` 🟢 (MCP tool)

```json
{ "fileUrl": "https://api.mbapps.co.il/file/abc123/document.pdf" }
```

Returns base64. **Domain-restricted**: only `api.mbapps.co.il` or `siteadmin.mbapps.co.il` URLs are accepted. The tool's own description says: *prefer the resource template `get-file`*.

### 3.2 The `file-storage:///` resource URI (canonical, from live Usage-Guide)

Tool results that reference stored files return MCP `resource_link` items:

```json
{ "type": "resource_link",
  "uri": "file-storage:///api.mbapps.co.il/parse/files/APP_ID/FILE_NAME/TABLE_NAME/OBJECT_ID/PROPERTY_NAME" }
```

Fetch via the MCP **resource template `get-file`** (list templates with `resources/templates/list`). The URI encodes the full provenance: app → file → owning table/record/field — i.e., files are addressed in the context of the record+field they're attached to (this is how `PrivateFile` access is mediated). MCP clients that support resources should resolve these directly instead of calling `Get-File-Content`.

### 3.3 Direct URL patterns observed

| Pattern | Context |
|---|---|
| `https://api.mbapps.co.il/parse/files/<APP_ID>/<FILE_NAME>` | standard Parse file URL (public files) |
| `https://api.mbapps.co.il/file/<id>/<name>` | file-serving route seen in Get-File-Content examples |
| `https://siteadmin.mbapps.co.il/uploads/...` | site-admin-hosted assets (logos, page assets) |

## 4. Where files attach (product surfaces)

| Surface | Mechanism |
|---|---|
| Record card file fields | `File` / `PrivateFile` schema fields rendered as upload controls on form pages |
| Accounting / branding | `AccountingSettings.LogoHeb` (logo used on documents) — read by document-generation functions |
| Price-quote PDFs | `Create-Price-Quote` renders a PDF from `PDFTemplate` HTML; quote templates may embed uploaded logo URLs |
| Documents module | generated Hebrew accounting docs (hebdoc* functions) stored + emailed |
| WhatsApp/chat attachments | conversation messages reference stored files (`fileDBName`) |
| Page assets & code | `Upload-Public-File` (+ `codeFile`) with `Set-Page-Settings.jsFile/cssFile` |
| Customer flows | customer-forked file-ingest server functions write uploaded files into records |

## 5. Storage quota & `outOfStorage`

Storage is metered per application, and each app carries an `outOfStorage` flag. Setting/clearing that flag and reading per-app storage status are **vendor-side ops operations** (not on the Parse API and not part of the customer-facing integration surface). ⚠️ UNVERIFIED: the exact runtime effect on uploads when `outOfStorage` is set (assumed: uploads blocked / app degraded) and the quota size per package — confirm with platform ops before promising limits in a spec.

## 6. Spec-ready quick reference

| Task | Call |
|---|---|
| Upload public asset | MCP `Upload-Public-File {file:{name,mimeType,data}}` → URL |
| Versioned JS/CSS deploy | same + `codeFile:true`, reuse `_id`; bind once via `Set-Page-Settings` |
| Upload + attach to record (server-side) | REST `POST /parse/files/<name>` → `PUT /parse/classes/<T>/<id>` with `__type:File` |
| Read a file an MCP tool referenced | resolve the `file-storage:///…` URI via resource template `get-file` |
| Read by URL | MCP `Get-File-Content {fileUrl}` (mbapps domains only) |
| Send a CRM-stored file on WhatsApp | `Send-WhatsApp-Message {fileDBName}` |
| Check/flip storage flag | admin API `setDbStatus` (reseller key) |

## Limitations & gotchas

- **Public means public**: `Upload-Public-File` URLs are unauthenticated — never upload PII/financial docs this way; use `PrivateFile` fields (record-mediated access) instead.
- **10 MB Parse file limit** (ParseDocs default) — ⚠️ product-specific override UNVERIFIED; design integrations to chunk/compress or host large media externally.
- **Base64 prefix asymmetry**: `Upload-Public-File.data` takes bare base64; WhatsApp `fileBase64` requires the `data:<mime>;base64,` prefix. Mixing them up fails in both directions.
- **`keepName: true` (default) can collide** — if a same-named file exists the behavior is update/overwrite-or-error (⚠️ UNVERIFIED which); set `keepName: false` for guaranteed-unique names, or manage `_id` explicitly.
- **Get-File-Content domain restriction** means files hosted anywhere else (S3, customer sites) are unreachable from MCP — pull them with your own HTTP client.
- **No MCP file-delete tool** and no verified REST delete on this deployment — storage cleanup is an ops/UI task; quota incidents (outOfStorage) require the reseller admin API, a different host + key.
- **REST file upload + record association is two steps** — a crash between them orphans the file (it still consumes quota).
- **`file-storage:///` URIs embed the APP_ID** — do not paste them into cross-customer docs/tickets; they leak app identifiers and record ids.
