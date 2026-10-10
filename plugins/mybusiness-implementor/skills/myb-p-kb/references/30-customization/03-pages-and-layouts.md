# Form Pages & Layouts — Cards, Grid, Sections, Settings, Versions, CSS/JS

> **Purpose:** Spec-ready reference for building and editing record card pages (דף כרטיס / form pages): page anatomy, `Create-Form-Page`, every `Edit-Page` action, section headers, related-record widgets, containers & tabs, page settings, page versions, and the page CSS/JS + design-system layer.
> **Last updated:** 2026-10-09 (§2 note: public pages are not built with `Create-Form-Page` — 15-public-forms) · previously 2026-10-06 (§4 heading anatomy, master heading styles, section separation) · previously 2026-08-23 (§2a MasterTicket cards for custom entities) · **Status:** draft

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
| `MasterTicket` | Built-in entity cards (Account, Sale, Case…) — **and any custom entity's card, built by copying one (§2a)** | Ticket chrome: two columns with the record timeline, ticket header, save bar; works via direct URL (`?oid=`) |
| `NewMaster` | Every page made by `Create-Form-Page` | Modal-popup master: works **inside an iframe sidebar** for logged-in users; via direct URL shows empty fields (`missing uuidVal` path runs only for anonymous users). **No MCP/API can change a page's master afterwards** — choosing a master is only possible at creation, via `Create-Table-View-Page(copyFromPageId)` (§2a) |
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

> **Not for public pages.** `Create-Form-Page` clones `apps/mybusiness/NewPage`, whose master (`NewMaster`) answers anonymous visitors with a 302 to the login page wherever the clone is named. A page for anonymous visitors is a clone of a **master-less** public page (vanilla: `apps/mybusiness/PortalLogin`) via `Create-Table-View-Page(copyFromPageId)` to a root-level name, then `set-html-content` of a complete Database form into its container — [15-public-forms.md](15-public-forms.md) §3.1 (verified 2026-10-09).

## 2a. Cards on `MasterTicket` — the ticket shell for a custom entity

`MasterTicket` is the master that gives a card its ticket shell: the two-column layout (form on one side, **record timeline** on the other), the ticket header, and the save/edit button bar. Built-in cards (Account, Sale, Case, Task…) sit on it. **A custom entity's card can sit on it too** — not through `Create-Form-Page`, which is hard-wired to `NewMaster`, but by copying a page that already has the master.

> All measurements in this section: a test tenant, 2026-08-23 — a live `Create-Table-View-Page` copy of `apps/mybusiness/Case` into `Contacts`, plus the served `MasterTicket3.2.js` and `case4.3.js`.

### The lever

```
Create-Table-View-Page({ tableName, pageName, copyFromPageId: "<a MasterTicket card>", title })
```

`copyFromPageId` is the **only** way to choose a master: the copy inherits `masterPageId` from the source. Measured — copying the Case card produced a page whose `masterPageId` is the id of `apps/mybusiness/MasterTicket`. Nothing else moves a page between masters (`Set-Page-Settings` has no such parameter — §7).

Pick the **smallest** built-in ticket card as the source: everything it contains is inherited, and none of it can be deleted through MCP.

### What the copy carries over

| Artifact | Copied | Rewritten to the target table? |
|---|---|---|
| `masterPageId` | yes | n/a — this is the point of the copy |
| `jsFile`, `loginOnly`, `allowedRoles` | yes | **no** — the copy runs the *source entity's* page JS |
| `title` | yes | no (empty on the Case card — set it explicitly) |
| the `<form>` element, its fields, rows and containers | yes | **`name` yes, `data-simbla-class` no** |

The last row is the trap. A card page writes to exactly one class, decided by **`data-simbla-class` on its `<form>`** — `simbla.js`'s `createSimblaObj()` reads `cls = T.data('simbla-class')`, with no fallback to the URL, to `dynamicTable`, or to the form's `name`. The copy rewrites `name` and leaves `data-simbla-class` pointing at the source class, so the page *reads* as correctly rebound while every save still lands in the source table:

```html
<!-- a copy of the Case card, created for Contacts -->
<form class="simblaEL dbForm" id="P1" name="Contacts" data-simbla-class="Cases"
      onsubmit="return createSimblaObj(this)">
```

`Get-Page-Content(minimal: true)` renders the `name` attribute and not the data attribute — the minimal view shows `name: Contacts` and hides the defect. Read the form tag from the full content, not the minimal one.

### The inherited form cannot be rebound, moved or deleted

Measured against a live server — do not re-test these:

| Attempt | Server response |
|---|---|
| `Edit-Page` → an element-delete action | no such `actionType`; the live enum is the 10 in §3 |
| `Edit-Page` `move-existing-object`, `fieldName` = the form id | `Element not found: P1` |
| `Edit-Page` `set-html-content`, `intoExistingElemId` = the form id | `target element not found` |
| `Edit-Table-View` with `tableClassName` | `Table not found in page` — that tool addresses `simbla-table` elements only |
| `Set-Page-Settings` | no `masterPageId`, no form-binding parameter (§7) |
| `Set-Page-Version` with another page's `versionId` | `Not Found` — versions are scoped to their own page |

**`Add-Container-to-Page` is the exception.** `afterElement: "<form id>"` positions correctly against the very element `Edit-Page` cannot see. That is how a correctly-bound form reaches the page: add a container after the inherited form, then `set-html-content` a complete `<form … data-simbla-class="<TargetClass>" onsubmit="return createSimblaObj(this)">` into the returned inner container. Measured: the injected form is stored verbatim, attributes intact — and the page now holds **two** forms.

### Two forms on one page — which one saves

The master reaches "the form" three different ways, all of them **at click time**, none at load:

| Where | Selector |
|---|---|
| validation in the `.SaveBtn` / `.SaveEditBtn` handlers | `document.forms[0]` |
| the submit itself | `$("form").submit()` |
| `saveAndStay()` | `$(".dbForm")[0]` and `$(".dbForm").submit()` |

The inherited form is first in the DOM and carries `dbForm`, so it wins all three: the card silently saves to the source class, and an empty record appears there on every save. Because every lookup happens at click time, **removing the inherited element during page load is a complete fix** — one guarded block of page JS. The permanent fix is deleting the element in the page editor, after which the block goes away.

### The ticket-shell contract

`MasterTicket3.2.js` declares `unsaved` and `redirectToUrl` and defines `checkIsModal()` and `saveAndStay()` — but it **reads four variables it never defines**. The card page's own JS must supply them:

| Symbol | Defined by | What happens without it |
|---|---|---|
| `formSubmit = true` | **the page** | Both save handlers run `if (!formSubmit === true) { return; }`. `!undefined === true` → **every save returns silently** — no error, no console line, no network call |
| `entity` | the page | the class in the ticket URLs the master builds |
| `saveEditAction` | the page | the page name save-and-edit redirects to |
| `redirectTo` | the page | `"<Page>?cls=<Class>&Mode=Ticket&oid="` |
| `checkIsModal()` | the master | call it on `ready`; without the call the ticket chrome is never applied |
| `saveAndStay` | the master | the master **hides** `.SaveAndStay` at load; the page shows it and binds the click |

Two more behaviours the page has to know about: `checkIsModal()` hides `.SaveEditBtn` at load and shows it again only for `Mode=Modal`; and `.editTicket` is hidden outright whenever `localStorage.isAdmin === "false"`. The master binds **no** click handler to `.editTicket` — each card page binds its own, calling `loginToAdmin("design", undefined, undefined, undefined, "<form id>")`, which opens the page editor on that page and element in a new tab, under the session already signed in.

A copied page inherits the source's `jsFile`, which satisfies the contract for the *source* entity — so the new card appears to work until `jsFile` is repointed at the entity's own file, and then every button dies at once. The built-in card's file (`case4.3.js` and its siblings) is the contract's reference implementation; read the one the tenant actually serves before writing a new one, since a tenant may carry a newer version.

### What the master does per mode

From `checkIsModal()`:

| Condition | Master behaviour |
|---|---|
| `Mode=Ticket` | ticket chrome: site header hidden, white background, borderless form; both columns kept |
| `Mode=Modal` | ticket chrome **plus** — shows `.SaveEditBtn`, hides `.col-md-1`, hides the timeline column (`#timeLineFrame`'s `.col-md-5`) and widens the form column `col-md-7` → `col-md-12`, hides every `.simbla-table` and `.statusRow`, hides `.editTicket` |
| no `oid` (a new record), either mode | hides the timeline column and widens the form column |

Two consequences worth designing for: **child tables are invisible** when the card is opened as a related record from another card; and on a **new** record the timeline column has to be restored after the first save, by reversing the same class swap (`col-md-12` → `col-md-7`, plus clearing the inline `display` on the timeline column).

### Two more things that bite

- **Dialog width.** A ticket card opens in `#SideModalTicket`, a NewMaster card in `#SideModal`. An unscoped width rule written for a NewMaster sidebar — typically on the *list* page — also reaches `#SideModalTicket` and shrinks the ticket card. Scope such rules to `#SideModal`, and verify by comparing `getComputedStyle(dialog).width` with a built-in ticket card in the same viewport.
- **The card header.** The master shows a generic caption; each card page sets its own into `#SideModalTicket .modal-header` (`Mode=Ticket`) or `#SideModal .modal-header` (`Mode=Modal`), driven by the `simblaobjectsettoform` event — which does **not** fire on a new record, so that case needs a static caption, swapped after the first save.

**Displaying the record timeline** in the column the shell provides is a separate, per-tenant page change — recording alone renders nothing. See [20/04](../20-data-model/04-system-tables-and-logs.md) §1.11.

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
| `set-html-content` | replace an element's inner HTML | `intoExistingElemId`, `htmlContent` — writes into containers/`htmlEditor` elements; an `htmlEditor` needs its `<div class="htmlContent">` wrapper written back in, or the element renders wrong |

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
8. Nested rows (`add-row toExistingRow+toExistingColumn`) historically mis-nested for columns ≥ 1; this was later addressed. ⚠️ Re-verify on first nested use in a given environment, and prefer `Add-Container-to-Page` where it fits.
9. **A `<form>` element is invisible to every `Edit-Page` action** — `move-existing-object` and `set-html-content` on a form id both answer "element not found" (measured). Position work around a form goes through `Add-Container-to-Page(afterElement: "<form id>")`, which does resolve the same id. See §2a.
10. **Moving a field into an occupied column stacks it** — `move-existing-field` to a column that already holds a field answers success and places the field under the existing one (measured). Re-layout in place = order each batch so every target column is emptied earlier in the same batch, then re-read before the next step.
11. **`edit-row` to fewer columns silently drops the fields in the removed columns** — `[4,4,4]` → `[6,6]` with a field in column 2: success, and the field is **gone from the page** (it stays in the schema; re-add it). Widening (`[6,6]` → `[4,4,4]`) keeps every field. Always empty the columns that will disappear first.
12. **`move-existing-field` needs no `fieldType`** (measured); neither do `add-row`, `edit-row`, `delete-row` or `set-html-content`. `add-new-field` needs `fieldType` (+ `targetClass` for a Pointer).
13. **`delete-row` on a row that holds only a heading removes the heading with it** (measured) — the clean way to drop a stray or duplicate heading.
14. **`Get-Page-Content(minimal: true)` does not show the ids of text elements** (`tcH`) — read once with `minimal: false` to get the id a heading fix needs.
15. **A Boolean added with `add-new-field` shows its caption twice** — once in the outer `<label>` and again beside the checkbox (measured 2026-10-06; built-in checkbox fields keep the outer label empty and hidden). Fix with `set-html-content` on the field's `.form-group`: `<label for="X" style="display: none;"></label><div class="control"><div class="checkbox"><label><input type="checkbox" id="X" name="X">caption</label></div></div>` — verified: one caption, and the checkbox still drives form rules.

## 4. Sections — the visual pattern

Every card is a repetition of: **header row `[12]` with an H2 → field rows `[4,4,4]` → (separator = next header)**. Group fields by topic (פרטי לקוח, פרטי התקשרות, מידע עסקי), identity/status first, contact next, dates/meta later, free-text last full-width, related tables at the bottom. Section names must be specific — never "פרטים נוספים". Built-in cards place **one field per column** (stacked columns are the exception — e.g. the Case SLA block).

### Heading anatomy and how the master styles it (measured 2026-10-06)

A section heading on every built-in card (Account, Sale, Case, Contact, Task) is the same three-level element, with **no inline styling**:

```html
<div class="simblaEL tcH" id="P129"><div class="textContainer H2"><h2 class="TicketHeadline">פרטי הלקוח</h2></div></div>
```

Its look comes entirely from the design system (`unified-master.css`, attached to the masters through `cssFile` — §9), never from the page. Computed in the browser on the playground:

| Element | `MasterTicket` card (`body.mb-ticket-master`) | `NewMaster` card (`Create-Form-Page`) |
|---|---|---|
| `h2.TicketHeadline` | Heebo 18px / 400, navy `#252C57` | Heebo 24px / 600, navy |
| bare `h2` (no class) | Heebo **24px / 600** | Heebo 24px / 600 |
| `h3` | Heebo 18px / **600** | Heebo 18px / 600 |
| `h4` | Heebo 18px / 500 | Heebo 18px / 500 |

Three consequences:

1. **`Add-Edit-Text-Element(elemType: "H2")` and `Create-Form-Page`'s title row emit a bare `<h2>` — no `TicketHeadline`.** On a `MasterTicket` card such a heading renders 24px/600 beside the built-in 18px/400 ones. Fix right after creating it: `Edit-Page` → `set-html-content` on the `tcH` element's id (the response says `text element with id P286 added`) with `<div class="textContainer H2"><h2 class="TicketHeadline">…</h2></div>` — verified: the class lands and the element keeps its id.
2. **On a `MasterTicket` card `h3`/`h4` out-weigh the section heading** (600/500 against 400): a raw sub-heading looks more important than its own section. A sub-heading needs a page-CSS rule that puts it below the section heading (measured: `.dbForm h3 { font-size:15px!important; font-weight:400!important }` renders 15px/400 navy on both masters).
3. **Inline styling inside a heading only partly yields to the master.** The master's heading colour wins over `<font color>` (measured navy), but an inline `font-size` survives (`<font style="font-size: 24px;">` measured 24px against the built-in 18px). Built-in cards carry `<font face>` wrappers too (`<font face="Varela Round">שיחות MyChat</font>` on Account/Sale/Case/Task), neutralised by the master today. A page-CSS guard that makes inline wrappers inherit (`.dbForm :is(h1,h2,h3,h4) :is(font,span,b,strong) { color:inherit!important; font-family:inherit!important; font-size:inherit!important; font-weight:inherit!important; }`) restores the class style — measured 24px → 18px on the Account card.

### Section separation on built-in cards

No built-in card uses a separator element. Sections are separated by **empty full-width spacer rows** (`[12]`, no content — Account `P146`, Case `P126`/`P132`, Contact `P75`/`P76`/`P77`), and some rows carry the editor's row-border setting (`data-border-type="Bottom"`). A hairline on every heading row except a container's first works on both masters through page CSS (the design system itself relies on `:has()`):

```css
.dbForm .rDivider:not(:first-child):is(:has(> .sDivider > .tcH h2), :has(> .rDivider > .sDivider > .simbla-table)) { border-top: 1px solid var(--border-color, #E8E8E8); margin-top: 12px; padding-top: 6px; }
```

(The second `:has()` catches related-record tables, whose header sits inside the table element — see below.)

### Creating a section heading

```json
// 1. mcp__MyBusiness__Add-Edit-Text-Element — plain text, no inline styling (after add-row [12] → rowId)
{ "pageId": "<id>", "elemType": "H2", "html": "פרטי התקשרות", "rowId": "P280", "columnNumber": 0 }
// → "text element with id P286 added"
// 2. mcp__MyBusiness__Edit-Page — give it the built-in class
{ "pageId": "<id>", "actions": [{ "actionType": "set-html-content", "intoExistingElemId": "P286",
  "htmlContent": "<div class=\"textContainer H2\"><h2 class=\"TicketHeadline\">פרטי התקשרות</h2></div>" }] }
```

| Param | Notes |
|---|---|
| `elemType` | `H1`/`H2`/`H3`/`H4`/`P` — must match existing type when editing |
| `html` | inline HTML allowed — but a heading's text goes in **plain** (consequence 3) |
| `rowId`+`columnNumber` | for **new** elements |
| `elemId` | for **editing** an existing element (do NOT pass rowId too, or you get a duplicate) |

Editing an existing heading's text with `Add-Edit-Text-Element(elemId, html)` **keeps the `<h2>`'s class** and replaces everything inside it (verified 2026-10-06) — so a `TicketHeadline` heading wrapped in `<font>` is cleaned by re-sending its plain text; a bare `<h2>` needs `set-html-content` to gain the class. `Duplicate-Element` on a heading puts the copy **in the same column**, right after the original — not in a new row.

Other heading markup, measured on the playground (2026-10-06): `Add-Edit-Text-Element(elemType: "H3")` emits `<div class="textContainer H3"><h3>…</h3></div>`; an `H1` element rewritten by `set-html-content` to `<div class="textContainer H2"><h2 class="TicketHeadline">…</h2></div>` is afterwards edited with `elemType: "H2"`. **The header that `Add-Table-View-to-Form-Page` creates from `tableTitle` is a bare `<h2>` too** — `tcH > textContainer H2 > h2`, nested inside the `simbla-table` element; `set-html-content` on that `tcH` id adds the class and leaves the table intact. An inline `<span style="font-family: Arial; color: #e05a00">` inside a heading **does** beat the master (measured Arial, orange — unlike `<font color>`); the uniformity guard restores Heebo navy.

The hairline CSS that also covers related-table blocks (their header sits inside the table element, so the heading selector alone misses them):

```css
.dbForm .rDivider:not(:first-child):is(:has(> .sDivider > .tcH h2), :has(> .rDivider > .sDivider > .simbla-table)) { border-top: 1px solid var(--border-color, #E8E8E8); margin-top: 12px; padding-top: 6px; }
```


Retired (2026-10-06): the page-level heading CSS `.TicketHeadline { font-size:24px; font-weight:800 }` and the heading template `<font color="#3249b3" style="font-size: 24px;">…</font>`. Both made MCP-built headings differ from the built-in ones on the same card.

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
- **No `"` in `showSummary`** (it is not escaped on that path) — placeholder now, real `sumTitle: "סה\"כ"` later via `Edit-Table-View`.
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

Not settable: `masterPageId` (gap — you cannot rebase an existing page onto another master; the master is chosen once, at creation, by `Create-Table-View-Page(copyFromPageId)` — §2a). No parameter rebinds a form to another class either.

## 8. Page versions — backup & recovery

| Tool | Shape |
|---|---|
| `Get-Page-Versions` | `{pageId \| pageName}` → `{versions: [{_id, date}]}` |
| `Get-Page-Version` | `{pageId, versionId}` → full HTML/CSS/JS of that version |
| `Set-Page-Version` | `{pageId, versionId, overrideHTML?, overrideCSS?, overrideJS?}` — restores selected parts only; no flag = no change |

Recovery recipe (e.g., a broken `Edit-Table-View` complaining `page.savedContent[key].includes`): `Get-Page-Versions` → pick the earliest version (creation snapshot) → `Set-Page-Version(..., overrideHTML: true)` restores the HTML **without touching** current jsCode/cssCode → re-run the failed edit. Treat versions as the only undo; take none of this lightly — `Set-Page-Version` overwrites irreversibly.

## 9. Page CSS & JS

### Inline code — `Edit-Page-CSS-JS`

`{pageId, cssCode?, jsCode?}` — each provided field **overwrites entirely** (omitted field untouched; empty string clears). Always `Get-Page-Content` first and merge. Standard uses: the heading-uniformity guard and the section hairline (§4), hiding the leaked `.db-form-add` button (`.db-form-add{display:none !important;}`), and the two canonical JS patterns:

**Long text is stored markup, not JS (verified 2026-10-06).** Replace the field's `.form-group` content with textarea markup — the same thing built-in cards store:

```json
{ "pageId": "<id>", "actions": [{ "actionType": "set-html-content", "intoExistingElemId": "<form-group id>",
  "htmlContent": "<label for=\"Comment\">הערות</label><textarea class=\"form-control\" id=\"Comment\" name=\"Comment\" rows=\"3\"></textarea>" }] }
```

Verified end to end: a record saved from the browser through that textarea stored a two-line `Comment` value. It works for any String field name. The older page-JS conversion (swap `input` for `textarea` on `document.ready`) also works but builds structure at runtime — avoid it (§10).

```javascript
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

## 10. Native-before-code — the page-JS decision gate

The page runtime (`simbla.js`) already exposes the mechanisms most page JS gets written to replace. The rule set below is a platform-developer code review of a production subscription card (2026-08, 12 comments plus 2 overarching principles); every capability claim in it was re-verified against the `simbla.js` source before being written down. It governs **all** page JS and page configuration, on every tenant.

**The two overarching principles**

- **Native before code, and above all before a server round-trip.** Before writing a line of page JS, check whether `simbla.js` already does it. A workaround works today, breaks on the next platform update, and nobody but its author knows it is there. A round-trip that could have been avoided costs response time and server load, and adds a failure point.
- **Zero hooks on `Simbla` / `Parse`.** Wrapping a core function also catches the platform's own internal calls — a small mistake in the wrapper breaks functionality unrelated to it, and that is invisible to whoever debugs the symptom later. Field evidence: a hook on the data-fetch path caught system queries and produced a transparency row showing wrong numbers.

**The rule table** — each row is *the anti-pattern* → *the native mechanism that replaces it*. IDs are stable; a later review round continues from H-13.

| # | Don't | Do instead — the native mechanism |
|---|---|---|
| H-01 | Build a closed 2-3 value list in JS at runtime | A static `select` with `option`s in the page HTML (editor or `Edit-Page`). Adding a value is then a UI change — no developer, no deploy — and the values are visible to whoever edits the page. |
| H-02 | Query the server for details of a record already pointed at on the form | Read it off the page. Loading a record `include`s every select-pointer on the form (`simbla.js` ~6682-6686), so the full object is on the field's `data('val')` and on the chosen option's `data('obj')`. |
| H-03 | Filter a picker's options with helper queries or post-load DOM filtering | `before-autocomplete-query` (~7497) — the platform hands its own options query to page code before running it; add a constraint and it runs filtered, with pagination and type-ahead intact. Non-autocomplete pickers: `before-select-options-loaded`. |
| H-04 | Block a save by intercepting clicks on the save buttons | `simblaobjectbeforesave` + `throw "stop"` (~1403-1411) — fires inside `save()`, so it catches every save path; async work via `data.promises`. |
| H-05 | Hard-coded `objectId`s and value lists | Derive from the page (label vs value of the already-loaded `select`), or one `config` block with a runtime name check that shouts when the lookup table changed. |
| H-06 | A home-grown client-side change-tracking mechanism | `_Timeline`, server-side — see [20/04](../20-data-model/04-system-tables-and-logs.md) §1. A dedicated *business* journal (event types, ranges, links) is legitimate, but written server-side, not by diffing old-vs-new in the browser. |
| H-07 | Build tabs or page structure in JS at runtime | Store the structure: `Add-Edit-Tabs-Element` (§5). A gap between what the editor shows and what actually runs is a permanent maintenance tax. |
| H-08 | Validation code for a mandatory field | Native `required` on the field; conditional-required via form rules ([30/07](07-form-rules.md)). One verified exception: the autocomplete picker — see known-limitation §16. |
| H-09 | `var P = window.Parse` and similar aliases | `Simbla`, always — it exists on every page and the platform itself is built on it. Do not write defensive guards around it: if it is broken, the failure is severe anyway. |
| H-10 | Code that filters a dropdown depending on another field | The native cascade — `subclassDepend` / "Define Parent" ([30/11](11-field-patterns.md)). When the parent field sits on the parent form rather than in the same row: `data-parent-elem`. |
| H-11 | Hooks on `Simbla` or `Parse` (see the second principle) | Official events only: `before-autocomplete-query` · `before-select-options-loaded` · `simblaobjectbeforesave` · `simblaobjectsettoform` · the table events. |
| H-12 | Branching state logic around parent and child rows | Simplify: one consistency check at save instead of state management on every `change`; stored sort order instead of re-ordering in JS; create the core row server-side where possible. |

Illustrative shapes only — exact signatures and the full event list live in the platform's own `simbla.js` developer reference (events index, forms & saving, templating & binding, queries & selects):

```javascript
// H-03  filter a picker's options INSIDE the platform's own query
$(document).on('before-autocomplete-query', '#MyField', function (e, d) {
    d.query.containedIn('SomeField', allowedValues);   // no extra round-trip
});

// H-04  block a save the official way
$(document).on('simblaobjectbeforesave', function (e, d) {
    if (!isValid(d.obj)) { showAlert('...'); throw 'stop'; }
});

// H-02  read the pointed record that is already on the page
var account = $('#PayerAccountId').data('val');        // full object, no query
```

```html
<!-- H-10  cascade when the parent field sits on the parent form -->
<select data-subclass-depend="ParentTable" data-parent-elem="#ParentField">
```

Measured on the one card the review was written against, after applying the set: server calls on card open **21 → 11** (of those, self-initiated **10 → 0**); the parent/child mechanism **~350 → ~120 lines**; hooks **2 → 0**.

**Checklist before handing over page code** (the same rules, in the order they are actually checked):

- zero `window.Parse` and zero aliases — only `Simbla`;
- zero hooks or monkey-patching on platform objects;
- every option filter goes through an official event — not the DOM, not a helper query;
- every save block via `simblaobjectbeforesave` + `throw "stop"` — not a click interception;
- zero queries for data already on the form (pointed pointers);
- zero hard-coded objectIds and lists — derived from the page, or a config block with a name check;
- page structure (tabs, sections, fields) stored — not built in JS at runtime;
- native `required`; code only in the documented autocomplete case;
- field-change history in `_Timeline` or server-side — not a browser diff;
- verification = a live pull of what is served **plus** a screenshot of what renders. Not a DOM count, not `success: true`;
- a `jsFile` users have already loaded is published under a new name and the page repointed — never overwritten;
- cache cleared after `Set-Page-Settings` (§16);
- backup and version anchor taken before touching page structure (§8).

The verified traps behind H-08, H-10 and the checklist's cache/verification lines are listed as known limitations — see [80/02](../80-capability-matrix/02-known-limitations.md) §16.


## Limitations & gotchas

- **`Create-Form-Page` ⇒ `NewMaster`, irreversibly.** Such cards work in the iframe sidebar but show empty fields via direct URL. No tool changes `masterPageId` afterwards; `Create-Table-View-Page` inherits the master of its `copyFromPageId` source — that is the only "choose master" lever, and it is enough: copying a built-in ticket card puts a **custom entity's card on `MasterTicket`**, with the ticket shell and the timeline column. The copy's `<form>` stays bound to the source class and cannot be rebound, moved or deleted through MCP — see §2a for the full path and its traps.
- **No `Delete-Page`, no element-level delete** via MCP — rename pages aside (`_old_*`), hide elements with CSS.
- **`Get-Page-Content(minimal: true)` hides `simbla-counter`/`simbla-chart`/`simbla-table` nodes** — containers look empty. Use `minimal: false` when discovering interactive elements (dashboards, embedded tables).
- **`Edit-Page-CSS-JS` overwrite semantics** destroy unmerged code; the same applies to `Edit-Page`'s legacy `cssCode`/`jsCode` params.
- **Field labels on pages vs schema**: `change-existing-field-label` affects only that page; the schema `label` (translation) is separate.
- **`Comment` added through `Edit-Page` is a single-line `<input type="text">` — stored and rendered.** There is no runtime conversion by field name (checked in `simbla.js` and both master scripts, and measured: an 83px single-line input). Built-in cards look right only because their stored HTML holds `<textarea>`. Fix = §9 stored-textarea pattern (verified 2026-10-06).
- **Search forms (`dbFormQuery`) have no creation/edit tool** — inputs inside them are only fixable via page JS or by cloning a page that already has the right form.
- After every page change, the user must reload (and **hard-reload Ctrl+F5** when `jsFile`/`cssFile` changed — CDN/browser cache).
- The visual editor and MCP edit the same artifact — concurrent editing loses one side's changes silently. Coordinate with anyone using the Simbla UI.
