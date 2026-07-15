# Form Pages & Layouts — Cards, Grid, Sections, Settings, Versions, CSS/JS

> **Purpose:** Spec-ready reference for building and editing record card pages (דף כרטיס / form pages): page anatomy, `Create-Form-Page`, every `Edit-Page` action, section headers, related-record widgets, containers & tabs, page settings, page versions, and the page CSS/JS + design-system layer.
> **Last updated:** 2026-06-10 · **Status:** draft

## 1. Page model

### Page kinds & master pages

`Get-Site-Pages` returns every page: `{_id, name, isMasterPage}`. Three kinds:

| Kind | Example | Role |
|---|---|---|
| Master page (`isMasterPage: true`) | `apps/mybusiness/CRMmaster`, `MasterTicket`, `NewMaster`, `PortalMaster`, `Mobile-*` masters | Holds nav chrome + a `_dynamicContentArea` placeholder |
| Page with `masterPageId` | `apps/mybusiness/Accounts` (list), `apps/mybusiness/Supplier` (card) | Content object keyed by the master's area IDs; merged at runtime |
| Standalone page | login pages | Self-contained |

Content zones of a card page (keys of the page `content` object):

| Zone | Content | Who fills it |
|---|---|---|
| `_MPID0` | Main content — the form, sections, fields, related tables | You (all page building happens here) |
| `_MPID1` | Top bar — back button, dynamic title | Auto-generated |
| `_MPID2` | Bottom bar — Save/Delete buttons | Auto-generated |

Which master matters:

| Master | Used by | Behavior |
|---|---|---|
| `CRMmaster` | List pages, dashboards | Full nav chrome |
| `MasterTicket` | Built-in entity cards (Account, Sale, Case…) | Card chrome; works via direct URL (`?oid=`) |
| `NewMaster` | Every page made by `Create-Form-Page` | Modal-popup master: works **inside an iframe sidebar** for logged-in users; via direct URL shows empty fields (`missing uuidVal` path runs only for anonymous users). **No MCP/API can change a page's master afterwards** |
| `PortalMaster` / `Mobile-*` | customer portal / mobile pages | Rarely customized |

Naming convention: list page plural (`apps/mybusiness/Suppliers`), card page singular (`apps/mybusiness/Supplier`). RTL: pages have `isRtl: true` (returned by `Get-Page-Content`, inherited from the master) — column 0 renders on the **right**.

### Grid anatomy (rows / columns)

```
form.dbForm (data-simbla-class="Suppliers")        ← binds the form to a DB class
└── div.rDivider  (row)                            ← Edit-Page "add-row"
    └── div.sDivider.col-md-N  (column, 12-grid)   ← fields live here, one per column
        └── div.form-group → <label> + <input/select>
```

Live example (`Get-Page-Content(pageName:"apps/mybusiness/Supplier", minimal:true)` — an MCP-built card): a title row (`h2` "פרטי ספק"), then field rows `[6,6]`, section-header rows `[12]` with `h2` text, a `[4,4,4]` row for status/payment/rating, and full-width rows for הערות. A fresh `Create-Form-Page` page ships with the title row plus one empty `[6,6]` row whose ID is `P272` and class `ai-placeHolder` — fill it first.

Grid quick reference (columnSize must sum to 12):

| Layout | `columnSize` | Use |
|---|---|---|
| 3 columns | `[4,4,4]` | default field rows |
| 2 columns | `[6,6]` | long labels / wide inputs |
| Full width | `[12]` | section headers, textareas, related tables |
| 4 columns | `[3,3,3,3]` | compact booleans/short selects |
| Wide+narrow | `[8,4]` / `[9,3]` | description + side field |

## 2. `Create-Form-Page`

```json
// mcp__MyBusiness__Create-Form-Page
{ "tableName": "Suppliers", "pageName": "apps/mybusiness/Supplier", "title": "פרטי ספק" }
```

| Param | Required | Notes |
|---|---|---|
| `tableName` | yes | DB class the form binds to |
| `pageName` | yes | Singular path under `apps/mybusiness/` |
| `title` | yes | Hebrew page header (also becomes the H2 title row) |

Creates an **empty** form (no fields) on `NewMaster`. Follow with `Edit-Page` to add fields, then `Create-Table-View-Page` for the list ([04-table-views-and-lists.md](04-table-views-and-lists.md)), wiring `editView: {openFrom:"modal-left", useIframe:true, page:"apps/mybusiness/Supplier"}` so list rows open this card in a sidebar — the standard UX, identical to Account/Sale cards.

## 3. `Edit-Page` — the grid/fields workhorse

`Edit-Page(pageId, actions: [...])` executes an ordered array of actions. Top-level params: `pageId` (required), `actions`, plus legacy `cssCode`/`jsCode` (prefer `Edit-Page-CSS-JS`).

| actionType | Purpose | Key params |
|---|---|---|
| `add-row` | new grid row | `columnSize` (sum 12), `newRowAfterRow` \| `toExistingRow`+`toExistingColumn` (nested row) |
| `edit-row` | change a row's column layout | `toExistingRow`, `columnSize` |
| `delete-row` | remove a row | `toExistingRow` — **empty rows only** (fields inside are lost) |
| `add-new-field` | place a schema field on the form | `fieldName`, `fieldType`, `label`, `targetClass` (Pointer), position params, `isRequired`, `defaultValue` |
| `move-existing-field` | reposition a field | `fieldName` + position params |
| `move-existing-object` | move any element by ID (rows, text) | `fieldName` = element ID (e.g. `"P47"`) — **never on rows containing a `simbla-table`** (destroys the widget) |
| `change-existing-field-label` | rename a field's page label | `fieldName`, `label`, `fieldType` (required even for label-only change) |
| `set-field-required` | toggle required | `fieldName`, `isRequired` |
| `remove-existing-field` | remove from page (stays in DB) | `fieldName` |

Position params (shared): `toExistingRow` (row ID) + `toExistingColumn` (0-based), or `newRowAfterRow` (creates a row after the given row and drops the element there).

```json
// Fill the placeholder row, then open the next row — IDs come back in info[]
{ "pageId": "<id>", "actions": [
  { "actionType": "add-new-field", "fieldName": "Name", "fieldType": "String",
    "label": "שם הספק", "isRequired": true, "toExistingRow": "P272", "toExistingColumn": 0 },
  { "actionType": "add-new-field", "fieldName": "AccountId", "fieldType": "Pointer",
    "targetClass": "Accounts", "label": "לקוח", "toExistingRow": "P272", "toExistingColumn": 1 },
  { "actionType": "add-row", "columnSize": [6, 6], "newRowAfterRow": "P272" }
]}
// → response info: [..., { "actionType": "add-row", "newRowId": "P276", ... }]
```

### Execution-order rules (hard-won)

1. **Create space before filling it** — `add-row` first, read `info[].newRowId` from the response, then `add-new-field` into it (separate calls when dependent).
2. **Schema check is mandatory** — a field not in `Get-Schema(class)` cannot be added; create it first (`Add-Field-to-Table`).
3. **`edit-row` before moving fields into new columns** — the target column must exist.
4. **Batching with the same `newRowAfterRow` inserts in REVERSE order** (each new row lands directly after the anchor). To get final order Header→Fields→Charts, list the actions bottom-up.
5. **Redesign = `move-existing-field`, never `add-new-field`** for fields already on the page ("Field already exists" error). Read the page YAML first and diff.
6. **Move fields out, then `delete-row`** — deleting a populated row loses the fields.
7. Multiple independent actions batch fine in one call; `Add-Edit-Text-Element` and an independent `Edit-Page(add-row)` can run in parallel.
8. Nested rows (`add-row toExistingRow+toExistingColumn`) historically mis-nested for columns ≥ 1 (bug report `Playground/findings/edit-page-nested-row-bug-report.md`, 2026-04-30); a platform fix followed (referenced in `edit-page-add-container-feature-request.md`). ⚠️ Re-verify on first nested use in a given environment.

## 4. Sections — the visual pattern

Every card is a repetition of: **header row `[12]` with an H2 → field rows `[4,4,4]` → (separator = next header)**. Group fields by topic (פרטי לקוח, פרטי התקשרות, מידע עסקי), identity/status first, contact next, dates/meta later, free-text last full-width, related tables at the bottom. Section names must be specific — never "פרטים נוספים".

```json
// mcp__MyBusiness__Add-Edit-Text-Element — section header (after add-row [12] → rowId)
{ "pageId": "<id>", "elemType": "H2",
  "html": "<font color=\"#3249b3\" style=\"font-size: 24px;\">פרטי התקשרות</font>",
  "rowId": "P280", "columnNumber": 0 }
```

| Param | Notes |
|---|---|
| `elemType` | `H1`/`H2`/`H3`/`H4`/`P` — must match existing type when editing |
| `html` | inline HTML allowed |
| `rowId`+`columnNumber` | for **new** elements |
| `elemId` | for **editing** an existing element (do NOT pass rowId too, or you get a duplicate) |

Standard card CSS (apply via `Edit-Page-CSS-JS`): `.TicketHeadline { font-size:24px!important; font-weight:800!important; margin-top:17px!important; padding-bottom:7px; }`

## 5. Containers & tabs (2026 additions)

Both were "UI-editor-only" until ~mid-2026; the live MCP now has them. They close dashboard tooling gap B1 and the page-builder "no tabs via MCP" limitation (those skill texts are now outdated).

```json
// mcp__MyBusiness__Add-Container-to-Page — card-style wrapper (containerHolder>container)
{ "pageId": "<id>", "toExistingRow": "P221", "toExistingColumn": 0,
  "isFullWidth": false, "isFullHeight": false }
// Alternative positioning: "afterElement": "<elemId>" or "intoExistingElemId": "<elemId>"
// (never an rDivider for intoExistingElemId)
```

```json
// mcp__MyBusiness__Add-Edit-Tabs-Element — simbla-nav tab strip
{ "pageId": "<id>", "rowId": "P300", "columnNumber": 0,
  "newTabs": [ { "label": "פרטים" }, { "label": "מסמכים" }, { "label": "היסטוריה" } ] }
// Edit: { "pageId", "elemId": "<tabsId>", "updateTabs": [{"id":"<tabId>","label":"חדש"}], "deleteTabs": ["<tabId>"] }
```

The `Add-Edit-Counter-Element` / `Add-Edit-Chart-Element` / `Add-Edit-Tabs-Element` tools all accept `intoExistingElemId` — place elements **inside a container** for the proper card look (see [05-dashboards-and-reports.md](05-dashboards-and-reports.md)). ⚠️ UNVERIFIED whether `Add-Edit-Text-Element` also accepts it (not in its loaded schema as of 2026-06-10).

## 6. Related-record widgets on a card — `Add-Table-View-to-Form-Page`

Embeds a child-record table (e.g. SupplierOrders on the Supplier card). Precondition: the child class has a Pointer to the card's class — then the platform **auto-filters** the widget to the open record (no criteria needed).

```json
{ "pageId": "<cardPageId>", "tableName": "SupplierOrders",
  "insertAfterRow": "P319", "tableTitle": "הזמנות רכש",
  "createBtnTitle": "הוסף הזמנה", "allowCreate": true, "allowInlineEdit": true,
  "showSummary": "Total",
  "fields": [
    { "fieldName": "Name",   "label": "הזמנה", "type": "String", "aggrField": "Name" },
    { "fieldName": "StatusId.Name", "label": "סטטוס", "type": "String", "aggrField": "StatusId.OrderStatuses.Name" },
    { "fieldName": "Amount", "label": "סכום", "type": "Number", "aggrField": "Amount", "summary": "sum" },
    { "fieldName": "createdAt", "label": "נוצר", "type": "Date", "aggrField": "createdAt" }
  ]}
```

Critical rules (full table-config reference in [04-table-views-and-lists.md](04-table-views-and-lists.md)):

- **`aggrField` on every field** — omitting it renders `data-aggr-field="undefined"` and breaks sort/aggregation. Copy exact values from `Get-Optional-Fields`.
- **`type` has no `Pointer`** (`String`/`Number`/`Boolean`/`Date`/`PrivateFile`/`File` only). `"StatusId.Name"+String` = read-only text; bare `"StatusId"+String` = auto-detected editable dropdown.
- **No `"` in `showSummary`** (escaping bug) — placeholder now, real `sumTitle: "סה\"כ"` later via `Edit-Table-View`.
- **Placement (KI-9):** pick an `insertAfterRow` whose *next sibling* is a plain field/section row. If the next sibling is a tab container (`simbla-nav`) or another `simbla-table`, the widget nests inside it — hidden and **not auto-filtered**. After inserting, re-fetch the page and walk the widget's ancestors; none may be `simbla-nav`/`simbla-table`. On the demo Account card, the first row (P127) is safe; the last row before the tabs is not.
- The tool auto-creates its own header row from `tableTitle`; several tables inserted at the same `insertAfterRow` stack in reverse — insert in reverse of desired order.
- A widget row must never be moved with `move-existing-object` (wipes the widget); delete and re-add instead.

## 7. Page settings — `Get-Page-Settings` / `Set-Page-Settings`

Settings live outside the page HTML. `Get-Page-Settings(pageId)` returns current values; `Set-Page-Settings` patches:

| Param | Type | Purpose |
|---|---|---|
| `pageId` | String (req) | target |
| `title` / `description` / `keywords` / `metaTags` | String | SEO/browser-tab. **Pages copied from Cases inherit title "Cases" — always fix** |
| `name` | String | rename the page (URL path; must be unique) — the only "delete" substitute |
| `loginOnly` | Boolean | gate to logged-in users |
| `allowedRoles` | String (comma-sep) | role gate |
| `jsFile` / `cssFile` | String (URL) | the page's ONE external JS / ONE external CSS file (from `Upload-Public-File`) |
| `removeJSFile` / `removeCSSFile` | Boolean | detach the file (page falls back to master inheritance) |
| `dynamicTable` / `dynamicFields` | String | dynamic-page serving: table + URL-path field mapping (Simbla "Dynamic pages") |

Not settable: `masterPageId` (gap — you cannot rebase a page onto another master).

## 8. Page versions — backup & recovery

| Tool | Shape |
|---|---|
| `Get-Page-Versions` | `{pageId \| pageName}` → `{versions: [{_id, date}]}` |
| `Get-Page-Version` | `{pageId, versionId}` → full HTML/CSS/JS of that version |
| `Set-Page-Version` | `{pageId, versionId, overrideHTML?, overrideCSS?, overrideJS?}` — restores selected parts only; no flag = no change |

Recovery recipe (e.g., a broken `Edit-Table-View` complaining `page.savedContent[key].includes`): `Get-Page-Versions` → pick the earliest version (creation snapshot) → `Set-Page-Version(..., overrideHTML: true)` restores the HTML **without touching** current jsCode/cssCode → re-run the failed edit. Treat versions as the only undo; take none of this lightly — `Set-Page-Version` overwrites irreversibly.

## 9. Page CSS & JS

### Inline code — `Edit-Page-CSS-JS`

`{pageId, cssCode?, jsCode?}` — each provided field **overwrites entirely** (omitted field untouched; empty string clears). Always `Get-Page-Content` first and merge. Standard uses: TicketHeadline CSS, hiding the leaked `.db-form-add` button (`.db-form-add{display:none !important;}`), and the two canonical JS patterns:

```javascript
// (a) long-text fields with custom names → textarea (only Comment/Description/Notes auto-convert)
$(document).ready(function() {
  ['Resolution','RootCause','TechnicianNotes'].forEach(function(f) {
    var $i = $('input[name="'+f+'"]');
    if ($i.length && $i.attr('type')==='text') {
      $i.replaceWith($('<textarea>').attr({name:f,id:$i.attr('id'),rows:3}).addClass($i.attr('class')).val($i.val()));
    }
  });
});
// (b) clickable Name column in related tables → opens the row's edit
$('.simbla-table').on('data-loaded', function() {
  var i = $(this).find('thead th').index($(this).find('thead th[data-field="Name"]'));
  if (i < 0) return;
  $(this).find('tbody tr td:nth-child('+(i+1)+')').css({cursor:'pointer',color:'#299ff2'})
    .on('click', function(){ $(this).closest('tr').find('.fa-pencil').click(); });
});
```

Other recurring page-JS hooks: `$('[name=StatusId]').on('before-select-options', (e,d)=>d.query.ascending("Order"))` (sort dropdown options); auto-compose `Name` from other fields on `change`.

### External files — production pattern

`Upload-Public-File({file:{name, mimeType:"text/javascript"|"text/css", data:<base64>}})` → S3 URL → `Set-Page-Settings(pageId, jsFile/cssFile)`. For code that must be updated in place, upload with `codeFile: true` and reuse the returned `_id` on subsequent uploads (+`cacheControl:"no-cache"`) — the URL stays **stable**, so referencing pages are configured once.

### The site-wide design system (May-2026 redesign)

Since May 2026 the product look is a single **`unified-master.css`** (~7,500 lines, v6.2xx) attached as `cssFile` to BOTH masters — `CRMmaster` + `MasterTicket` — replacing ~80 per-page css files; pages inherit it (regular pages should have **no** own `cssFile`, except 3 auth + 2 chat pages intentionally kept on legacy). Rules that matter when styling any page (full detail: `the design-system reference`):

- **Scope page rules with `body.page-slug-<name>`** (slug = lowercase of the page name's last path segment: `DashboardSales` → `page-slug-dashboardsales`). NEVER `page-id-<hash>` — page IDs differ per customer.
- **The file is native nested CSS** — page blocks are wrapped `body.page-slug-x { .inner { … } }`; dashboards use `body:is(.page-slug-a, …)`; add new page rules *inside* the existing wrapper, never double-prefix; brace-balance check after edits.
- **Deploy = update-in-place** (`codeFile:true` + saved `_id`); masters point at the stable URL once — no per-edit `Set-Page-Settings`. The CSS repo is `Playground css\` (git: AviMYB/mybusiness-unified-css).
- Design tokens: primary navy `--main-bg-color:#252C57`, secondary `#3D4993`, info `#369BCD`, danger `#F44336`, success `#4CAE4C`, border `#E8E8E8`; body font Assistant, headings Heebo; standard tile shadow `-4px 3px 13px 0 rgba(76,76,76,.1)` + `border:1px solid #f0f0f0; border-radius:7px`.
- Cascade traps: a (0,4,3)-specificity rule paints every `.modal-body *` navy/Assistant — FontAwesome glyphs become tofu unless you restore `font-family:'FontAwesome'!important`; inline `style="…!important"` is unbeatable from CSS; RTL flips margins (use `margin-inline-end`); two-state selection = white/`#E8EAF2`, never navy-on-navy.

## Limitations & gotchas

- **`Create-Form-Page` ⇒ `NewMaster`, irreversibly.** Cards work in the iframe sidebar; direct-URL standalone cards require cloning a MasterTicket card in the Simbla editor. No tool changes `masterPageId`; `Create-Table-View-Page` inherits the master of its `copyFromPageId` source — that is the only "choose master" lever.
- **No `Delete-Page`, no element-level delete** via MCP — rename pages aside (`_old_*`), hide elements with CSS.
- **`Get-Page-Content(minimal: true)` hides `simbla-counter`/`simbla-chart`/`simbla-table` nodes** — containers look empty. Use `minimal: false` when discovering interactive elements (dashboards, embedded tables).
- **`Edit-Page-CSS-JS` overwrite semantics** destroy unmerged code; the same applies to `Edit-Page`'s legacy `cssCode`/`jsCode` params.
- **Field labels on pages vs schema**: `change-existing-field-label` affects only that page; the schema `label` (translation) is separate.
- **Saved HTML may show `Comment` as `<input type="text">`** (live Supplier card) even though the runtime auto-renders Comment/Description/Notes as textareas — judge by the rendered page, not the stored markup. ⚠️ runtime behavior re-verify per environment.
- **Search forms (`dbFormQuery`) have no creation/edit tool** — inputs inside them are only fixable via page JS or by cloning a page that already has the right form.
- After every page change, the user must reload (and **hard-reload Ctrl+F5** when `jsFile`/`cssFile` changed — CDN/browser cache).
- The visual editor and MCP edit the same artifact — concurrent editing loses one side's changes silently. Coordinate with anyone using the Simbla UI.
