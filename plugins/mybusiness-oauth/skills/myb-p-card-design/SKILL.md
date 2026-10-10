---
name: myb-p-card-design
description: "Design, build, redesign and polish record card pages (form pages) in MyBusiness CRM - structure AND aesthetics. Use whenever a card is created or changed for any entity (Account, Sale, Case, Task, Contact, custom table): new card, redesign, adding fields/sections/headers/related tables, and whenever a card looks off - holes left by form rules that hide fields, unbalanced rows, inconsistent heading font/colour, missing separation between sections. Also run its aesthetics pass after adding a hide form rule to a card. Native tools only - no JS or code unless nothing native can do it. Triggers: דף כרטיס, עיצוב כרטיס, עיצוב ואסתטיקה, אסתטיקה, אסטטיקה, עיצוב דף, בניית דף, עריכת כרטיס, הוספת שדות לדף, סקשן, כותרת סקשן, כותרת משנה, הפרדה בין סקשנים, שדות מוסתרים, חורים בטופס, טאב, טבלה בכרטיס, card design, aesthetics, page builder, card page, form page, page layout, section header, redesign page, Edit-Page, Create-Form-Page, Add-Table-View-to-Form-Page."
---

# Card Design & Aesthetics / עיצוב ואסתטיקה של כרטיסים

Build well-structured record card pages in MyBusiness CRM for any entity type — and make them look right. The skill has two halves that always run together:

- **Structure** — getting fields, sections, headers and related tables onto the page with the MCP tools (the Workflow below).
- **Aesthetics** — where each field goes and how the card reads in every state its form rules produce: balanced rows, no holes, one heading look, soft separation. Rulebook: [references/card-aesthetics.md](references/card-aesthetics.md). The aesthetics pass is **mandatory**, not polish to skip when time is short.

## Native only — code is the last resort

**No JavaScript — and no code of any kind — unless the requirement truly cannot be met with native tools.** Every card need is solved natively first, in this order:

1. **Page structure** through the page tools — rows, fields, headings, containers, tabs, related tables (`Edit-Page`, `Add-Edit-Text-Element`, `Add-Container-to-Page`, `Add-Edit-Tabs-Element`, `Add-Table-View-to-Form-Page`).
2. **Stored page markup** through `Edit-Page` `set-html-content` — a heading's class, a `<textarea>`, checkbox markup, a static option list. This is page HTML, the same thing the page editor stores; it is not code and nothing runs.
3. **Field and table settings** — native `required`, the parent/child cascade (`subclassDepend`), table-view settings through `Edit-Table-View` (edit mode, totals, conditional formatting, sort).
4. **Form rules** (`myb-p-form-rules`) — conditional visibility, required, read-only, default and copied values.
5. **Triggers** (`myb-p-trigger-setup`) — anything that must happen on save; configuration, not code.
6. **Page CSS — only the standard aesthetics block** (`references/card-aesthetics.md` §8). It is styling with no behaviour, and the one sanctioned exception, because no native mechanism draws the soft separation. No other CSS.
7. **Page JS — only when all of these hold:** the customer needs the behaviour; every native path above was checked against the KB anti-pattern table (`../myb-p-kb/references/30-customization/03-pages-and-layouts.md` §10) and the traps that make a native path *look* unavailable (`../myb-p-kb/references/80-capability-matrix/02-known-limitations.md` §16); and none fits. Then **stop**: write down which native options were ruled out and why, and get the user's explicit approval before writing a line. Even then: official `simbla.js` events only, never a hook on `Simbla`/`Parse`.

Never use code for structure, layout, labels, visibility, required fields, defaults, totals, sorting or anything in the aesthetics pass. Server-side code (cloud functions) is outside this skill altogether. When auditing an existing card that carries page JS, list what each script does, name the native mechanism that now covers it, and propose removing it.

## Relation to `myb-p-create-entity`

`myb-p-create-entity` builds the full entity stack (DB tables → list page → menu → JS). This skill (`myb-p-card-design`) handles the **card page** for an entity created by either:

- `myb-p-create-entity` Phase 4 (which now uses `Create-Form-Page` and basic field placement — see that skill)
- A standard built-in MyBusiness entity (Account, Sale, Case, etc.)

The card page connects to the list page via `data-edit-view="modal-left"` (or `modal-right`) + `useIframe: true` + `page: "apps/mybusiness/<EntityName>"` configured in `Edit-Table-View`. Clicking a row's pencil from the list opens this card in a left/right sidebar.

**When to use which skill:**
- Building a brand-new entity (DB tables + list + card)? → Start with `myb-p-create-entity`. After it creates the basic card via Phase 4, come here for richer card layout (sections, related-table widgets, custom CSS).
- Redesigning the card of an existing entity (Account, Sale, custom)? → This skill is the right place.

## Architecture

A card page in MyBusiness CRM follows this visual hierarchy:

```
┌─────────────────────────────────────────────┐
│  _MPID1: Top Bar (back button + title)      │
├─────────────────────────────────────────────┤
│  _MPID0: Main Content (the form)            │
│  ┌─────────────────────────────────────┐    │
│  │ Section Header: "פרטי לקוח"         │    │
│  │ ┌──────────┬──────────┬──────────┐  │    │
│  │ │ Field 1  │ Field 2  │ Field 3  │  │    │
│  │ │ col-4    │ col-4    │ col-4    │  │    │
│  │ └──────────┴──────────┴──────────┘  │    │
│  │ ─── soft hairline (page CSS) ───    │    │
│  │ Section Header: "פרטי התקשרות"      │    │
│  │ ┌──────────┬──────────┬──────────┐  │    │
│  │ │ Field 4  │ Field 5  │ Field 6  │  │    │
│  │ └──────────┴──────────┴──────────┘  │    │
│  │ ┌────────────────────────────────┐  │    │
│  │ │ Comment (full width, textarea) │  │    │
│  │ └────────────────────────────────┘  │    │
│  │                                     │    │
│  │ Related Tables:                     │    │
│  │  [Contacts] [Documents] [Tasks]...  │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│  _MPID2: Bottom Bar (save/delete buttons)   │
└─────────────────────────────────────────────┘
```

### The Section Pattern

Every section follows the same repeating pattern:
1. **Header row** -- col-12 with an H2 of class `TicketHeadline`, plain text — exactly what the built-in cards use, so the master styles every heading alike (no inline colour/size)
2. **Field rows** -- typically col-4/4/4 (3 columns), **one field per column**, rows filled full-first
3. **Separation** -- a soft hairline above the next section's header, drawn by the standard aesthetics CSS block (no separator elements)

This pattern repeats for every logical group of fields on the page.

## Aesthetics — the mandatory pass

Run it on every new card, every redesign, and **every time a field, a section, or a `hidden` form rule is added to an existing card**. Inputs: `Get-Schema`, `Get-Page-Content` (minimal, plus one full read for the heading audit) and **`Get-Form-Rules`** — conditional fields drive the layout. The full rulebook with reasons and worked examples is [references/card-aesthetics.md](references/card-aesthetics.md); the rules at a glance:

| # | Rule |
|---|---|
| A1 | One field per column; never stack fields in a column. |
| A2 | Fill rows full-first: 5 fields on `[4,4,4]` = `3 + 2`, never `2 + 3`; the remainder starts at column 0 (right, RTL) and keeps the section's grid (not stretched). |
| A3 | One grid per section; inside it a fixed group order: visible inputs → conditional fields → checkboxes → metadata → long text (A3a). |
| A4 | Conditional fields **continue the flow** right after the always-visible fields (they may fill the trailing columns of the last visible row): hidden, the section just ends earlier. Only the first condition group may share a row with visible fields. |
| A5 | Never scatter conditional fields over several rows' last columns (hidden state `2 + 2 + 3`). Never in column 0 or the middle of a row with visible fields after them. |
| A6 | Put the controlling field in the last always-visible row (a controlling checkbox right before its fields); never a heading for conditional fields; the controlling field is never hidden. |
| A7 | Check fill order in **both** states of every rule, group by group — write the state table before building. |
| A8 | Mutually exclusive groups each start their own row. |
| A9–A11 | Checkboxes in their own row; long text full width at the end, stored as a real `<textarea>`; working metadata after the working fields; no `createdAt`/`updatedAt` on cards. |
| A12–A16 | Section heading = `h2.TicketHeadline`, plain text (create + `set-html-content`) — the `Create-Form-Page` title row and related-table headers too; no inline styling ever; sub-heading = H3, sparingly; one look across the card; audit headings on every redesign. |
| A17–A19 | Soft hairline above section headings and related-table blocks via the standard CSS block; delete spacer rows it replaces; no stray empty rows/columns; one transition before related tables. |
| A20–A22 | Short labels, no colon; an existing field keeps its schema `dictionary` label everywhere; same section order on sibling cards. |

Moving fields on an existing card has two silent traps — moving into an occupied column **stacks**, and `edit-row` to fewer columns **drops** the fields in the removed columns. Rulebook §10.

Why the rules are not taste: a form rule's `hidden` hides the field but **leaves its column standing**, so a hidden field in column 0 or the middle of a row leaves a visible hole (KB `30-customization/07-form-rules.md` §8); and an H2 created by `Add-Edit-Text-Element` has no `TicketHeadline` class, so on a ticket card it renders bigger and bolder than the built-in headings next to it (KB `30-customization/03-pages-and-layouts.md` §4). Both measured in the browser.

### Shortcut: duplicate an element instead of rebuilding it

`Duplicate-Element(pageId, elemId)` deep-clones any element carrying the `simblaEL` class — the copy lands right after the original with brand-new ids and all classes/styles/bindings intact. Re-fetch the page (`Get-Page-Content`) to read the new ids, then edit the copy. On a card page it's the fast way to replicate **structure** that's tedious to rebuild:

- A **related-records table** already configured on this card → duplicate it, then `Edit-Table-View(tableId=<copy>)` to repoint it at a different child table (the copy inherits the columns/formatting/edit-mode you already set).
- A text block → duplicate, then `Add-Edit-Text-Element(elemId=<copy>)` to change the text (the edit keeps the element's class). For a **section header** this is not a shortcut: the copy lands in the same column as the original, not in a new row — use the create + `set-html-content` pair (Step 3b).

⚠️ **Bound input fields are NOT the sweet spot.** A duplicated field keeps the original's `name`, i.e. it points at the SAME DB column, and there is no clean "rebind field" action (`Edit-Page` does label / move / required / remove — not re-bind). So duplicating a field row to host *different* fields means removing the copies and `add-new-field` anyway. Use `Duplicate-Element` for display/structure elements (related tables, text, and — on dashboards — counters/charts); keep the `Edit-Page` add-row/add-field flow for form inputs. Full spec: `../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md`.

## What This Skill Covers vs. Does NOT Cover

### Covered
- Creating new form pages from scratch (`Create-Form-Page`)
- Adding/removing/moving fields on pages (`Edit-Page`)
- Adding section headers (`Add-Edit-Text-Element` + `Edit-Page` `set-html-content` for the class)
- Adding related data tables to pages (`Add-Table-View-to-Form-Page`)
- Page CSS limited to the standard aesthetics block (`Edit-Page-CSS-JS`); page JS only under the code policy above
- Redesigning existing pages (reading current structure, planning improvements, executing changes)
- Choosing which fields belong in which section for any business domain
- **The card's aesthetics** — row balance, conditional-field placement against the form rules, heading uniformity, section separation, labels (rulebook: `references/card-aesthetics.md`)

### NOT Covered / Limitations
- **Tabs** (`simbla-nav`) -- `Add-Edit-Tabs-Element` can create a tab strip, but its `deleteTabs` is destructive (gotcha 27); prefer sections on a card unless the customer asks for tabs
- **Separator elements** -- the `separatorElm` dividers cannot be created via MCP. Section separation is the soft hairline in the standard aesthetics CSS block
- **Raw HTML** -- `Edit-Page` `set-html-content` writes an element's inner HTML; use it for heading markup (A12) and nothing structural (gotcha 26)
- **Drag-and-drop reordering in UI** -- MCP handles field positioning; manual reordering requires the visual editor
- **Hiding a heading from a form rule** -- form rules act on fields only; design so no heading depends on a condition (A6)
- **Master page editing** -- this skill works on form pages, not master pages (TicketMaster, CRMmaster)
- **Table view pages** (list pages) -- for creating list/grid pages, use `Create-Table-View-Page` tool directly; this skill focuses on the record card (form) page

## Verified Gotchas (from hands-on testing)

1. **`Edit-Page` actions that create space must run BEFORE actions that fill it.** When adding a row and then placing a field in it, you must execute `add-row` first and wait for the response to get the new row ID before using `add-new-field` with `toExistingRow`. Split these into separate `Edit-Page` calls.

2. **Row IDs come from the `info` array in the response.** After `add-row`, the response includes `info: [{ actionType: "add-row", newRowId: "P360", columnSize: [4,4,4] }]`. Use the `newRowId` value in subsequent actions. No need to parse HTML.

3. **`newRowAfterRow` creates a new row.** When you use `newRowAfterRow` in an `add-new-field` action, it creates a new row after the specified row and places the field there. For multiple fields in the same row, place the first field with `newRowAfterRow` and subsequent fields with `toExistingRow` pointing to the newly created row.

4. **Column numbering is 0-based.** The first column is `toExistingColumn: 0`, second is `1`, etc.

5. **Schema check is mandatory.** Always run `Get-Schema(className)` before adding fields. If a field doesn't exist in the schema, it can't be added to the page. The user needs to create the field in the database first (via the `Add-Field-to-Table` tool).

6. **Pointer fields need `targetClass`.** When adding a Pointer field, you must provide `fieldType: "Pointer"` and `targetClass: "ClassName"`. Get the exact targetClass from the schema output.

7. **`Get-Page-Content` with `minimal: true` returns YAML.** This is much easier to read and work with than the full HTML. Always use `minimal: true` when analyzing existing page structure.

8. **Page reload required.** After making changes, remind the user to reload the page in the browser to see updates.

9. **Field name format.** Field names must match the regex `/^[A-Za-z][A-Za-z0-9_]*$/` -- start with a letter, only alphanumeric and underscore.

10. **Text element positioning.** `Add-Edit-Text-Element` requires a `rowId` and `columnNumber` for new elements. Create the header row first with `Edit-Page` (add-row, columnSize [12]), then place the text element in it.

11. **Empty rows appear after section headers.** The header row (col-12) should only contain the H2 text element. Field rows come after it. Don't try to combine a header and fields in the same row.

12. **CSS overwrites.** `Edit-Page-CSS-JS` overwrites existing CSS/JS entirely. Always read current CSS/JS first (from `Get-Page-Content`) and append to it.

13. **"Field already exists" error.** If you try to `add-new-field` for a field that's already on the page, you get an error. When redesigning, first read the page structure to identify which fields are already placed, then use `move-existing-field` for those (not `add-new-field`). Only use `add-new-field` for fields that don't appear in the current page YAML.

14. **`edit-row` before moving fields — and never narrow a populated row.** When changing a row's grid from [6,6] to [4,4,4], do it BEFORE adding/moving fields to the new column (index 2). The reverse is dangerous: `edit-row` to **fewer** columns answers success and silently drops the fields in the removed columns from the page (measured). Empty those columns first.

15. **Multiple field moves in one `Edit-Page` call.** You can batch multiple `move-existing-field` actions in a single call -- they execute in order. This is efficient for reorganizing a page.

16. **`Add-Table-View-to-Form-Page` creates its own header row automatically.** You do NOT need to manually create a header row or text element for related tables -- the tool generates a section header with the `tableTitle` parameter. Just call the tool and it handles the visual structure.

17. **Multiple tables inserted at same `insertAfterRow` stack in reverse order.** If you insert Tables A, B, C all after row P100, they appear C, B, A (bottom to top). To get them in the desired order, either insert them in reverse order, or use different `insertAfterRow` values (insert A first, then B after A's new row, etc.).

18. **Existing pages may have multiple containers.** When redesigning, the page might have separate `containerHolder` divs (e.g., P38 for form, P339 for old toggle-based table sections). New table views added via MCP go into the main form container (P38). The old container sections (P339) remain -- they can be left as-is or cleaned up manually.

19. **`Add-Edit-Text-Element` and `Edit-Page(add-row)` can run in parallel.** When you need to both place a text element in a just-created header row AND create the next field row, these are independent operations and can be called simultaneously to save time.

20. **Delete empty rows only.** Before calling `delete-row`, make sure you've moved all fields out of it first. Deleting a row with fields will lose those fields from the page.

21. **`move-existing-object` on rows with fields causes orphaning.** Never use `move-existing-object` to move a row that contains fields -- the fields become orphans and disappear from the page structure. Instead, move individual fields out of the row using `move-existing-field`, then delete the empty row, and create a new row where needed. Only use `move-existing-object` for empty rows or non-field elements.

22. **No field becomes a textarea by itself.** `add-new-field` stores every String — `Comment`, `Description`, `Notes` included — as a single-line `<input type="text">` (measured; nothing in the runtime converts by name — built-in cards look right because their stored HTML holds `<textarea>`). Store textarea markup with `set-html-content` — see "Long-Text Fields" below.

23. **`Add-Table-View-to-Form-Page` field types don't include Pointer.** The `type` parameter only accepts: String, Number, Boolean, Date, PrivateFile, File. For pointer fields displayed in a table, use `fieldName: "PointerField.TargetField"` (dot notation) with `type: "String"` -- the value displays as read-only text. If you need the field to be editable as a dropdown in the table, use `fieldName: "PointerField"` (without dot notation) with `type: "String"` -- the system auto-detects the pointer and renders a dropdown.

24. **Related records open natively.** The row's edit icon opens the record in the table view's configured edit mode (inline / modal / sidebar — `Edit-Table-View`). A clickable Name column needs page JS, so it is **not** added by default — only if the customer explicitly requires it, under the code policy.

25. **Controlling table insertion order -- practical example.** If you want tables in order: Tasks, Activities, Notes (top to bottom), insert them in **reverse order** with the same `insertAfterRow`:
    ```
    1. Add-Table-View: Notes    (insertAfterRow: P393)  → goes right after P393
    2. Add-Table-View: Activities (insertAfterRow: P393) → pushes Notes down
    3. Add-Table-View: Tasks     (insertAfterRow: P393)  → pushes Activities+Notes down
    Result: Tasks → Activities → Notes (top to bottom)
    ```

26. **Page structure belongs in the page, never in runtime JS.** Tabs, sections, rows and fields are stored artifacts — `Add-Edit-Tabs-Element`, `Add-Container-to-Page`, `Edit-Page`. Building any of them in page JS at load time creates a permanent gap between what the page editor shows and what the user actually sees, and every future edit pays for it. If a tool gap tempts you into scripting structure, report the gap instead.

27. **`deleteTabs` is destructive — do not call it.** Creating tabs with `Add-Edit-Tabs-Element` works, but the delete action can remove content from the card along with the tab. Leave a stale tab in place instead — rename it, or hide it with CSS.

28. **`Set-Page-Settings` does not clear the page cache.** The setting updates while the page keeps being served from an older snapshot — so a correct change looks like it silently failed. Clear the cache by writing an identical, no-op `cssCode` through `Edit-Page-CSS-JS` right after the settings write.

29. **A container wrapper placed inside a search form (`dbFormQuery`) renders at height 0.** The fields are in the DOM and invisible to every user. This is the general verification rule for page work: **"exists" is not "visible"** — confirm by screenshot or `offsetHeight`, never by counting elements in the page dump and never by a `success: true` response.

30. **`Add-Edit-Text-Element(elemType: "H2")` creates a bare `<h2>` — no `TicketHeadline` class** (so does `Create-Form-Page`'s title row). On a ticket card it renders 24px/600 next to the built-in 18px/400 headings. Always follow it with `Edit-Page` `set-html-content` on the returned element id (Step 3b). Editing the text later with `Add-Edit-Text-Element(elemId)` keeps the class.

31. **A form rule's `hidden` hides the field, not its column.** The column keeps its width, so a hidden field in column 0 or the middle of a row leaves a hole, and a hidden field in a stacked column pulls the column out of line. Placement of conditional fields is planned, not left to chance — aesthetics rules A4–A8.

32. **Moving a field into an occupied column stacks it — no error.** Order every batch so each target column is emptied earlier in the same batch, and re-read before deleting rows (rulebook §10).

33. **`delete-row` on a heading-only row removes the heading** (measured) — the clean way to drop a stray or duplicate heading. `Get-Page-Content(minimal: true)` does not show heading element ids; read `minimal: false` to get them.

34. **A Boolean added with `add-new-field` shows its caption twice** (outer `<label>` + the label beside the box). Built-in checkboxes keep the outer label empty and hidden. Fix right after adding: `Edit-Page` `set-html-content` on the field's `.form-group` id with `<label for="X" style="display: none;"></label><div class="control"><div class="checkbox"><label><input type="checkbox" id="X" name="X">Caption</label></div></div>` (verified: one caption, form rules still fire on it).


## Workflow

### Step 0: Understand the Entity

Before touching the page, understand what you're building:

1. **Which table?** Run `Get-Schema(className)` to see all available fields, their types, and pointer relationships
2. **What does the customer do?** A real-estate company needs different sections than a school or a service company. Ask the user about their business context if not clear
3. **Is there an existing page?** Run `Get-Page-Content(pageName, minimal: true)` to see current structure. Also run `Get-Site-Pages` to check if the page exists
4. **Which fields are conditional?** On an existing page run `Get-Form-Rules(pageId)` and list every field with a `hidden` action, grouped by condition. On a new page, list the hide rules the customer needs (or that you will add with `myb-p-form-rules`). These fields are placed by the aesthetics rules A4–A8, not by topic alone
5. **Restore point** -- on an existing page, `Get-Page-Versions(pageId)` and note the newest `_id` before the first write (`Set-Page-Version(..., overrideHTML: true)` is the undo)
6. **Mobile twin?** -- if `Get-Site-Pages` shows `Mobile-<Entity>`, it has its own layout and rules; mention it and offer the same pass

### Step 1: Plan the Sections

Group the entity's fields into logical sections. The general principle: **group by topic, not by field type**. 

For guidance on how to organize sections for common entity types, read [references/common-layouts.md](references/common-layouts.md).

Universal section planning rules:
- **Identity/core fields first** -- Name, Number, Type, Status (the fields that identify what this record IS)
- **Contact/communication next** -- Phone, Email, Address (how to reach them)
- **Business details** -- Domain-specific fields (deal amount, case priority, task deadline)
- **Ownership/dates** -- Owner, CreatedBy, CreatedAt, UpdatedAt (metadata)
- **Free text last** -- Comment/Notes field always in a full-width row at the bottom of the form section
- **Related tables after the form** -- Contacts, Documents, Tasks, Sales, etc.

Then lay each section out as rows × columns by the aesthetics rules (A1–A11): one field per column, full rows first, conditional fields grouped per condition, checkboxes together, long text full width at the end. Write the **state table** (one line per hide condition, both states — `references/card-aesthetics.md` §9) into the plan before building.

### Step 2: Create or Prepare the Page

**New page:**
```
Create-Form-Page(
  tableName: "TableName",
  pageName: "apps/mybusiness/TableName",
  title: "כותרת הכרטיס"
)
```

`Create-Form-Page` is not empty: it ships a **title row** (a bare `<h2>` with the `title` text) and one empty `[6,6]` **placeholder row** (`ai-placeHolder`, e.g. `P272`). Make the title row the first section's heading (rename + `TicketHeadline`, A12) and re-grid / fill the placeholder row first instead of leaving it empty.

**Existing page:** Read current structure with `Get-Page-Content(pageName, minimal: true)`. Identify what needs to change -- missing sections, misplaced fields, missing headers.

### Step 3: Build the Grid -- Rows First, Fields Second

This is the core building step. For each section:

**3a. Add the header row:**
```
Edit-Page(pageId, actions: [
  { actionType: "add-row", columnSize: [12], newRowAfterRow: "<lastRowId>" }
])
```

**3b. Place the section header — plain text, then the built-in class (two calls):**
```
Add-Edit-Text-Element(
  pageId: "<pageId>",
  elemType: "H2",
  html: "Section Title",                 // plain text only — no <font>, no style (A13)
  rowId: "<headerRowId>",
  columnNumber: 0
)
// → { msg: "text element with id P286 added" }

Edit-Page(pageId, actions: [
  { actionType: "set-html-content", intoExistingElemId: "P286",
    htmlContent: "<div class=\"textContainer H2\"><h2 class=\"TicketHeadline\">Section Title</h2></div>" }
])
```
The second call matters: without `TicketHeadline` the heading renders larger and bolder than the built-in headings on a ticket card (gotcha 30).

**3c. Add the field row(s):**
```
Edit-Page(pageId, actions: [
  { actionType: "add-row", columnSize: [4, 4, 4], newRowAfterRow: "<headerRowId>" }
])
```

**3d. Add fields to the row:**
```
Edit-Page(pageId, actions: [
  { actionType: "add-new-field", fieldName: "FieldName", label: "תווית", 
    fieldType: "String", toExistingRow: "<fieldRowId>", toExistingColumn: 0 },
  { actionType: "add-new-field", fieldName: "OtherField", label: "תווית", 
    fieldType: "Pointer", targetClass: "TargetTable",
    toExistingRow: "<fieldRowId>", toExistingColumn: 1 }
])
```

**Important sequencing:** Steps 3a-3d must be executed sequentially (each depends on the row ID from the previous step). But multiple fields in step 3d can be added in a single `Edit-Page` call.

**Placement follows the plan, not the call order:** one field per column; the section's rows filled full-first with the remainder starting at column 0; each condition group in its own row (A1–A7).

### Step 4: Add Related Data Tables

After the form fields, add table views for related entities:

```
Add-Table-View-to-Form-Page(
  pageId: "<pageId>",
  tableName: "RelatedTable",
  insertAfterRow: "<lastFormRowId>",
  tableTitle: "כותרת הטבלה",
  fields: [
    { fieldName: "Name", label: "שם", type: "String" },
    { fieldName: "StatusId.Name", label: "סטטוס", type: "String" }
  ],
  allowCreate: true,
  allowInlineEdit: true
)
```

### Step 5: Apply the Standard Aesthetics CSS Block

Merge the block from `references/card-aesthetics.md` §8 into the page CSS — heading-uniformity guard, sub-heading size, soft hairline between sections:

```
/* >>> card-aesthetics v2 */
.dbForm :is(h1,h2,h3,h4) :is(font,span,b,strong) { color: inherit !important; font-family: inherit !important; font-size: inherit !important; font-weight: inherit !important; }
.dbForm h3 { font-size: 15px !important; font-weight: 400 !important; margin: 10px 0 2px !important; }
.dbForm .rDivider:not(:first-child):is(:has(> .sDivider > .tcH h2), :has(> .rDivider > .sDivider > .simbla-table)) { border-top: 1px solid var(--border-color, #E8E8E8); margin-top: 12px; padding-top: 6px; }
/* <<< card-aesthetics v2 */
```

`Edit-Page-CSS-JS` overwrites: read the current `cssCode` first (`Get-Page-Content`, `minimal: false`), remove any previous copy of the block between the markers (a `v1` copy too), append, write. Delete empty spacer rows that sit directly above heading rows — the hairline replaces them (A18). Do **not** add page-level heading size/colour rules (A15) — the old `.TicketHeadline { font-size: 24px; font-weight: 800; margin-top: 17px; padding-bottom: 7px }` rule is retired; delete the whole rule when you meet it. After applying the block to one card, offer to apply it to the sibling cards so the tenant keeps one look.

### Step 6: Verify and Advise

1. Run `Get-Page-Content(pageName, minimal: true)` to verify the final structure against the plan (A1–A11)
2. Read once with `minimal: false`: every section heading (related-table headers included) is `h2.TicketHeadline` with plain text, long text is a `<textarea>`, and the CSS block is present exactly once
3. **Look at the card in every state of the state table** — open it in a browser, toggle each controlling field without saving, at full and at sidebar width; read the headings' computed styles. No hole inside a row, no short row above a full one, headings identical per level. If no browser is available, say so and present the state table plus the expected computed style per heading as the evidence — never report a visual result you did not see (details: rulebook §9)
4. Remind the user to reload the page in the browser
5. Sequence when form rules are part of the job: layout → rules (`myb-p-form-rules`) → the visual check. Adding a `hidden` rule later means running the aesthetics pass again

### Step 7: Link the Card Page to its List Page (sidebar mode)

After the card is built, configure the entity's list page so clicking a row opens this card in a left sidebar (matches Account / Sale UX). First read the list page (`Get-Page-Content`, `minimal: false`) — if its table already opens this card, leave it. Run on the **list page**, not on the card page:

```
Edit-Table-View(
  pageId: <listPageId>,
  tableId: "P113",
  editView: {
    openFrom: "modal-left",                       // or "modal-right"
    useIframe: true,
    page: "apps/mybusiness/<EntityName>",         // path to the form page (singular)
    popupWidthPercent: 45                          // optional sidebar width
  }
)
```

NewMaster.js works fine inside this iframe for authenticated CRM users — its "missing uuidVal" error path runs only for anonymous users (`if (!Simbla.User.current())`).

If the entity uses pointer-display columns in the list (e.g., `AccountId.Name`), make sure those columns have `type: "String"` (NOT `"Pointer"`) — otherwise the table won't render rows. See `myb-p-create-entity` Constraint 9.

## Grid Layout Quick Reference

| Layout | columnSize | Use Case |
|--------|-----------|----------|
| 3 columns | `[4, 4, 4]` | Default for most fields |
| 2 columns | `[6, 6]` | Longer labels or wider fields |
| Full width | `[12]` | Section headers, Comment/textarea, Documentation |
| 4 columns | `[3, 3, 3, 3]` | Compact fields (checkboxes, short selects) |
| 1 wide + 1 narrow | `[9, 3]` or `[8, 4]` | Description + small field |

One field per column in every layout; one grid per section (A1, A3).

## Section Header Markup

The section header is the element the built-in cards use — nothing more:

```html
<div class="textContainer H2"><h2 class="TicketHeadline">כותרת הסקשן</h2></div>
```

Create it with `Add-Edit-Text-Element(elemType: "H2", html: "<plain text>")` and then `set-html-content` (Step 3b). Never put `<font>`, `style`, colour or size inside it — the design system styles every heading level; per-heading styling is exactly what makes one heading on a card look different from the rest (A13, A15). The retired template `<font color="#3249b3" style="font-size: 24px;">…</font>` must not be used.

## Native Patterns for Common Needs

Before anything that smells like code, check the code policy at the top and the KB anti-pattern table (`../myb-p-kb/references/30-customization/03-pages-and-layouts.md` §10). The needs that most often tempt page JS on a card, and their native answers:

| Need | Native answer |
|---|---|
| Long-text field (Comment, Description, any notes field) | Stored `<textarea>` markup via `set-html-content` (below) |
| One caption per checkbox | Stored built-in checkbox markup via `set-html-content` (gotcha 34) |
| Open a related record | The row's edit icon + the table view's edit mode (`Edit-Table-View`) |
| Totals of a related table | The table view's summary row (`showSummary` / `Edit-Table-View`) |
| Show / hide / require / lock a field by condition | Form rules (`myb-p-form-rules`) |
| A dropdown that depends on another field | The parent/child cascade (`subclassDepend`, `myb-p-parent-child-fields`) |
| A mandatory field | Native `required` on the field |
| Fill or copy a value | Form rule `fixed-value` / `dynamic-value` (one source field), or a trigger update action on save (`myb-p-trigger-setup`) |
| Compose one value from several fields (e.g. customer + case type) | No verified native path — trigger static values do not resolve `{{{…}}}` placeholders and `formula-value` is numeric. Prefer showing the source fields side by side; if the customer insists, it is a code-policy case |
| Tabs or sections | Stored structure (`Add-Edit-Tabs-Element`, `Edit-Page`) — never built in JS |

If none of these fits and the customer still needs the behaviour, the code policy applies: stop, document the native options you ruled out, get explicit approval.

### Long-Text Fields (stored markup, not JS)

`add-new-field` stores every String as a single-line input — `Comment`/`Description`/`Notes` included. Give a long-text field real `<textarea>` markup, the way built-in cards store it, by replacing the content of its `.form-group` (its id is in the `minimal: false` read):

```
Edit-Page(pageId, actions: [
  { actionType: "set-html-content", intoExistingElemId: "<form-group id>",
    htmlContent: "<label for=\"Comment\">הערות</label><textarea class=\"form-control\" id=\"Comment\" name=\"Comment\" rows=\"3\"></textarea>" }
])
```

Verified end to end: a record saved through such a textarea stored a two-line value. No page JS, and no runtime conversion — the older JS that swapped inputs for textareas on load is retired.

## Redesigning an Existing Page

When improving a page that already has fields, the process is significantly different from building a new page. Follow this tested sequence:

### Phase 1: Audit
1. **Read** the current structure: `Get-Page-Content(pageName, minimal: true)`
2. **Read** the schema: `Get-Schema(className)` to see all available fields
3. **Read** the form rules: `Get-Form-Rules(pageId)` -- list every `hidden` field by condition
4. **List existing fields** on the page -- extract every `name:` value from the YAML
5. **List missing fields** -- compare schema fields to page fields
6. **Aesthetics audit** -- against the rulebook: rows with a hidden field in column 0 or the middle (A4–A5), short rows above full ones (A2), stacked columns (A1), mixed checkbox rows (A9), long text stored as an input (A10), empty rows (A18); the heading audit with `minimal: false` (A16); and **existing page JS** — what each script does and which native mechanism now covers it (propose removal)
7. **Restore point** -- `Get-Page-Versions`, note the newest `_id`
8. **Plan target sections** -- decide which fields go where, and write the state table

*Heading/CSS-only request?* Phase 1 → Phase 4 step 5 → Phase 5 step 3 → Step 6. Phases 2–3 do not apply.

### Phase 2: Grid Restructuring
1. **Change existing row layouts** using `edit-row` (e.g., convert [6,6] to [4,4,4]) -- widen BEFORE moving fields so the new columns exist; never narrow a row that still holds fields in the columns that will disappear (they are dropped from the page)
2. **Reuse empty rows** -- an empty spacer row can be re-gridded with `edit-row` and used as a move target instead of deleting it and adding a new one

### Phase 3: Field Reorganization
1. **Move existing fields** to their target sections using `move-existing-field` -- batch multiple moves in one `Edit-Page` call, ordered so every target column is emptied earlier in the same batch (moving into an occupied column stacks)
2. **Add new fields** (fields not yet on the page) using `add-new-field` -- only for fields NOT already in the page YAML
3. **Re-read, then delete the rows the moves emptied** -- one step, after `Get-Page-Content(minimal: true)` confirms they are empty

### Phase 4: Section Headers
For each new section (working top to bottom):
1. `Edit-Page(add-row [12])` -- create header row, note the returned `newRowId`
2. `Add-Edit-Text-Element(H2, plain text)` -- place header text + `Edit-Page(add-row [4,4,4])` for field row (these two can run in parallel)
3. `Edit-Page(set-html-content)` on the new heading id -- add the `TicketHeadline` class (Step 3b)
4. Move/add fields to the new field row
5. Fix the existing headings the audit flagged (A16)

### Phase 5: Related Tables & Finishing
1. `Add-Table-View-to-Form-Page` for each related table (the tool creates the header from `tableTitle` -- a bare `<h2>`: give it the class with `set-html-content`, A16). Keep one transition before the tables (A19) -- no extra spacer rows
2. Long-text fields to stored `<textarea>` markup (A10)
3. `Edit-Page-CSS-JS` -- read existing CSS/JS first, then merge the standard aesthetics CSS block (Step 5)
4. **Verify** per Step 6 -- structure, headings, and the card seen in every state of the state table

### Common Mistake: "Field already exists"
When redesigning, NEVER try to `add-new-field` for a field that's already on the page. This will throw an error. Instead:
- Fields already on the page → use `move-existing-field`
- Fields NOT on the page → use `add-new-field`
Always cross-reference the current page YAML before choosing which action to use.

## Reference Files

- [references/card-aesthetics.md](references/card-aesthetics.md) -- **The aesthetics rulebook (A1–A22)**: grid and fill order, conditional fields vs. form rules, headings, soft separation, labels, the standard CSS block, the state table and the final check, worked examples
- [references/page-design-principles.md](references/page-design-principles.md) -- Detailed design principles extracted from ideal example pages, with rationale for each
- [references/edit-page-reference.md](references/edit-page-reference.md) -- Complete parameter reference for all Edit-Page action types with examples
- [references/common-layouts.md](references/common-layouts.md) -- Ready-to-use section layouts for common entity types (Account, Sale, Case, Task, Contact) and guidelines for custom entities
