---
name: myb-p-create-settings-page
description: "Create a 'System-Tables'-style settings/admin page in MyBusiness CRM for managing the values of a lookup/status table (e.g. SupplierStatuses, ProjectStatuses, any custom <Entity>Statuses / <Entity>Types / <Entity>Priorities) with inline add / edit / delete, matching the built-in System-Tables-Task-Statuses / System-Tables-Sale-Statuses pages. Use this skill whenever the user wants an admin/settings screen where users (usually Admins) can add and edit the option values of a custom lookup table -- phrases like 'add a settings page for statuses', 'let users add/edit statuses in settings', 'create a System-Tables page', 'manage lookup values', 'a settings page like the other settings pages', 'עמוד הגדרות לסטטוסים', 'שיוכל להוסיף ולערוך סטטוסים במסך ההגדרות', 'עמוד ערכי מערכת', 'הגדרות לטבלת ערכים'. Use it AFTER the lookup table already exists (often right after myb-p-create-entity). It does NOT create the table itself."
---

# Create Settings Page (System-Tables style) / יצירת עמוד הגדרות לערכי מערכת

Build a settings page that looks and behaves like MyBusiness's built-in **System-Tables-\*** pages
(e.g. `System-Tables-Task-Statuses`, `System-Tables-Sale-Statuses`): a cog-headed page with the
settings side-nav, a white card, an **inline-editable table** with an "הוסף ערך" (Add value) button,
and a "< חזרה להגדרות" back link. The user manages the rows (add / edit / delete) of a small
lookup table — statuses, types, priorities, categories — directly in the grid.

> ## ⚠️ Read this first — the settings side-nav
>
> This skill reliably produces a working, role-gated settings page with inline
> add/edit/delete, **and you CAN get the link into the settings side-nav** — as long as you edit the
> *right* menu (Phase 6). The side-nav (`menuHolder2`) renders **live** from the menu its
> `data-menu-id` points to, so adding your page to *that* menu makes the link appear and highlight as
> "current". **The one narrow gap that remains:** MCP cannot change *which* menu the page binds to
> (the `data-menu-id` lives in page HTML), so your link lands in whichever menu the template you
> copied was bound to — which is usually **shared** with sibling settings pages, so it shows in their
> side-navs too. A truly dedicated nav group requires the Simbla page-builder UI. The **direct URL
> always works** regardless. See **Phase 6** and **Known limitations**.

---

## When to use / not use

**Use** when a lookup/option table already exists and the customer wants a self-service settings
screen to maintain its values — exactly like the product's own `System-Tables-*` pages.

**Do not use** to *create the lookup table itself* (use `myb-p-create-entity` or `Create-Table`),
to build a normal list/CRUD page for a business entity (use `myb-p-create-entity` /
`myb-p-page-tables`), or to manage real records with many fields and a card view.

## Prerequisites

1. **The lookup table exists** (e.g. `SupplierStatuses` with `Name`, and optionally `Color` or other
   simple String/Number fields). If it doesn't, create it first.
2. **The table has role-based CLP**, not `{"*": true}`. The CRM front-end enforces role membership;
   without it, inline editing throws "no permissions" in the UI. Match the roles that actually use
   the values plus the admins who maintain them, e.g.:
   ```
   Set-Table-Permissions(table: "<LookupTable>", classLevelPermissions: {
     find:{"role:CRM":true,"role:Admin":true,"role:Support":true},
     get:{"role:CRM":true,"role:Admin":true,"role:Support":true},
     create:{"role:Admin":true}, update:{"role:Admin":true}, delete:{"role:Admin":true},
     addField:{}
   })
   ```
   (Find/Get must allow every role that *reads* the values elsewhere; Create/Update/Delete can be
   Admin-only since this is a settings screen.)

---

## Why the "copy a built-in page" approach

There is **no MCP tool that builds the System-Tables layout from scratch** (cog header + settings
side-nav + white card + inline table + back link). The reliable path is to **copy an existing
built-in `System-Tables-*` page** with `Create-Table-View-Page`, then repoint its table at your
lookup class and fix the labels. Copying inherits the exact chrome for free.

---

## Workflow

### Phase 0 — Pick a template page

`Get-Site-Pages` and find a built-in settings page to copy. Page IDs differ per tenant — always look
them up; never hardcode. Good templates (all inline-edit lookup managers):

| Page name | Manages |
|---|---|
| `apps/mybusiness/System-Tables-Task-Statuses` | Task statuses (Name only) |
| `apps/mybusiness/System-Tables-Sale-Statuses` | Sale statuses |
| `apps/mybusiness/System-Tables-Case-Statuses` | Case statuses |

Prefer the one whose column shape is closest to your table. None of the built-ins have a `Color`
column, so you will add extra columns yourself in Phase 3 regardless.

### Phase 1 — Inspect the template

Understand what you're copying so you can fix it precisely:

- `Get-Page-Content(pageId, minimal: false)` on the template. Note:
  - the **table element id** (e.g. `P171`) and its `data-simbla-class` (e.g. `TaskStatuses`),
  - the **card sub-heading** text inside the table (e.g. an `<h2>` "סטטוסי משימות"),
  - the side-nav `<nav class="menuHolder2" data-menu-id="...">`.
- `Get-Page-Settings(pageId)` — note `jsFile`, `loginOnly: true`, `allowedRoles` (typically
  `"loggedOnly, Admin"`). You'll mirror these.

### Phase 2 — Create the page (copy from the template)

```
Create-Table-View-Page(
  tableName: "<LookupTable>",
  pageName: "apps/mybusiness/System-Tables-<Entity>-Statuses",
  copyFromPageId: "<template page id from Phase 0>",
  title: "<top heading, e.g. 'הגדרות ספקים'>",
  tableColumns: [
    {field: "Name",  label: "ערך לסטטוס", type: "String", aggrField: "Name"},
    {field: "Color", label: "צבע",        type: "String", aggrField: "Color"}   // include your extra fields
  ]
)
// Do NOT pass searchFields or menuName — a System-Tables page has no search form,
// and you'll wire the menu deliberately in Phase 6.
```

**⚠️ Gotcha A — "error" but the page IS created.** Copying from a non-Cases template can return
`MCP error -32602: ... Invalid tools/call result: expected object, received undefined`. This is a
response-validation error, **not** a creation failure. Confirm with
`Get-Page-Content(pageName: "apps/mybusiness/System-Tables-<Entity>-Statuses", minimal: true)` and
grab the new `_id`.

**⚠️ Gotcha B — columns not applied.** When copying from a System-Tables template, the `tableColumns`
you passed are often **ignored** — the copied table still points at the template's class with the
template's columns. You fix this in Phase 3. (The `title`, however, *is* applied to the top heading.)

### Phase 3 — Configure the table (`Edit-Table-View`)

Get the new page's full content, locate the table id (same as the template, e.g. `P171`), then:

```
Edit-Table-View(
  pageId: "<new page id>",
  tableId: "<table id, e.g. P171>",
  tableClassName: "<LookupTable>",                 // repoints data-simbla-class
  classPointers: {"createdBy":"_User","updatedBy":"_User"},
  columns: [
    {field:"Name",  type:"String", aggrField:"Name",  label:"ערך לסטטוס",
     inlineOptions:{type:"text", required:true,  readonly:false}},
    {field:"Color", type:"String", aggrField:"Color", label:"צבע",
     inlineOptions:{type:"text", required:false, readonly:false}}
  ],
  editView: {openFrom: "inline"},                  // edit in the row, no card page
  tablePermissions: {allowCreate:true, allowEdit:true, allowDelete:true},
  filterAndSort: {queryType:"hard-code", sortBy:"Name", sortOrder:"ascending", sortLimit:50}
)
```

Notes:
- Keep `queryType: "hard-code"` so the page shows all rows with no search form (matches the
  built-ins).
- For a **Pointer** display column (rare on lookup tables — e.g. a `StateId.Name`), use
  `type:"String"` (not `"Pointer"`) and `aggrField:"StateId.<TargetClass>.Name"`, mirroring the
  Constraint-9 rule from `myb-p-create-entity`. Plain `Color`/`Name` strings need no special handling.

Verify with `Get-Page-Content(pageId, minimal:false)`: `data-simbla-class` is your class and the
`<thead>` shows your columns + the `action` column.

### Phase 4 — Fix the heading & polish via page JS

The copied **card sub-heading** still shows the template's text (e.g. "סטטוסי משימות"), and there is
**no MCP tool to edit a free text/`<h2>` element**. Fix it with a tiny page JS file that also adds
the niceties the built-in pages have (loader, nav highlight) and — if you have a `Color` column — a
visual color swatch per row. Use [references/page-js-template.md](references/page-js-template.md),
fill the placeholders, then:

```
Upload-Public-File(file: {name:"system-tables-<entity>-statuses.js",
  mimeType:"text/javascript", codeFile:true, data:"<base64>"})
```
Base64 on Windows (no `/dev/stdin`):
```
node -e "console.log(require('fs').readFileSync('system-tables-<entity>-statuses.js').toString('base64'))"
```

The heading fix is done client-side (the saved HTML keeps the old text but the JS rewrites it on
load). That's acceptable and is how the built-in settings pages attach their own behavior.

### Phase 5 — Page settings (JS, SEO, roles)

```
Set-Page-Settings(
  pageId: "<new page id>",
  jsFile: "<URL from Phase 4>",
  title: "<SEO/tab title, e.g. 'הגדרות סטטוסי ספקים'>",
  allowedRoles: "loggedOnly, Admin",
  loginOnly: true
)
```
Verify with `Get-Page-Settings`. This gates the page to Admins like the other settings pages.

### Phase 6 — Reachability: put the link in the side-nav (the right way)

The settings side-nav is a `menuHolder2` element **inside your page's HTML**. It renders **live** from
the menu its `data-menu-id` points to — **not** from the global `Settings` menu, and **not** from the
saved HTML snapshot. So the rule is simple: **find the menu your page is actually bound to, then add
your page to that exact menu.** Do **not** guess the menu by name (e.g. don't just add to `Settings`);
read the binding off your own page.

**Which menu is it?** Whatever menu the **template you copied in Phase 2** was bound to. It varies by
template — e.g. copying `System-Tables-Task-Statuses` binds you to the *task/activity* settings menu;
copying a different `System-Tables-*` page binds you to that area's menu. **Always read it from your
page; never hardcode a menu id.**

1. **Read the binding.** `Get-Page-Content(pageId, minimal: false)` on your new page and find the nav
   element: `<nav class="...menuHolder2..." data-menu-id="XXXXXXXX">`. That `XXXXXXXX` is the menu
   that drives this page's side-nav.
2. **Confirm it's the right menu.** `Get-Menu-Items(menuId: "XXXXXXXX")` — its items should match,
   one-for-one, the links you see rendered in the side-nav. (This is your proof you've got the menu
   that actually renders, not a look-alike.) Note whether it's flat or has a parent group item (some
   settings menus nest children under a parent like "ערכי מערכת"; others are flat).
3. **Add your page to that menu.** Append after the existing items (use the next `order`); set
   `parent` only if you want it nested under an existing group item:
   ```
   Set-Menu-Items(menuId: "XXXXXXXX", items: [{
     title: "<e.g. 'סטטוסי ספקים'>", type: "page",
     page: "<new page id>", order: <next N>   // , parent: "<group item _id>"  (only if nesting)
   }])
   ```
4. **Reload** (a normal refresh — the nav reads menu *data*, not the JS file). The link appears in the
   side-nav and highlights as "current" when you're on the page.

> **⚠️ The one narrow gap (and the trade-off).** The menu you just edited is typically **shared** by
> all the sibling settings pages that copied the same template, so your new link will **also** appear
> in *their* side-navs — which can be semantically off (e.g. a "Suppliers" link showing under the
> *tasks/activities* settings group). MCP **cannot rebind `data-menu-id`** (it's in page HTML), so you
> can't give the page its own dedicated nav group through MCP. Your choices:
> - **Accept the shared grouping** — simplest; the link works everywhere that menu renders.
> - **Page-scoped nav via the page JS** — in the page's JS file, rewrite/append the rendered side-nav
>   on *this* page only (full control, no cross-page effect, but local to this page and client-side).
> - **Rebind in the Simbla page-builder UI** — the only way to point the page at a brand-new,
>   dedicated menu (outside MCP scope).
>
> Regardless of choice, the **direct URL** (`/apps/mybusiness/System-Tables-<Entity>-Statuses`) is
> always a guaranteed entry point. Optionally, also add the page to the global `Settings` menu /
> settings-landing for extra discoverability — but that is **separate** from the side-nav and does not
> by itself put the link in the `menuHolder2`.

### Phase 7 — Verify

1. **Hard-reload** (Ctrl+F5) to load the new JS + SEO title.
2. Open the page — via the **side-nav link** you added in Phase 6 (it should now appear and highlight
   as "current"), and/or the direct URL.
3. Confirm: top heading + card heading correct; the grid lists existing rows; "הוסף ערך" adds a row;
   inline edit + delete persist; (if applicable) color swatches render; browser tab title is correct;
   **the new link shows in the settings side-nav**.

If something's off, check in this order: hard-reloaded? → **does the rendered side-nav match the menu
behind `data-menu-id` (did you edit the *bound* menu, not `Settings`)?** → `Get-Page-Settings` shows
the right `jsFile`/`title`? → lookup table CLP is role-based (not `*`)? → `Edit-Table-View` set the
right `tableClassName`?

---

## Known limitations

- **Side-nav: content controllable, binding not.** See Phase 6. You CAN make the link appear in the
  side-nav by adding your page to the menu its `menuHolder2` `data-menu-id` points to (the nav renders
  live from that menu). What MCP **cannot** do is change *which* menu the page is bound to — so the
  link lands in a menu usually **shared** with sibling settings pages and appears in their navs too. A
  dedicated, page-specific nav group needs the Simbla page-builder UI (or a page-JS nav override).
- **Card sub-heading is JS-patched, not HTML-edited.** No MCP tool edits free text elements, so the
  heading is corrected at runtime (brief flash possible).
- **`Create-Table-View-Page` returns a validation error on non-Cases copies** even though the page is
  created (Gotcha A), and **ignores `tableColumns`** on such copies (Gotcha B) — both handled above.
- **No delete-page tool.** There is no MCP tool to delete a page, so get the `pageName` right the
  first time; a mistaken page can't be cleanly removed via MCP.

## Reference files

- [references/page-js-template.md](references/page-js-template.md) — the page JS: heading fix,
  `EndLoader` on `data-loaded`, settings-nav "current" highlight, and optional per-row color swatch.
