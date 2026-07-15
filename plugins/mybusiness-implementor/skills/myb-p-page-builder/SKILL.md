---
name: myb-p-page-builder
description: "Create, redesign, and edit record card pages (form pages) in MyBusiness CRM. Use this skill whenever a customer wants to build a new card page for any entity (Account, Sale, Case, Task, Contact, or any custom table), redesign an existing card page, add sections or fields to a page, organize fields into logical groups, add section headers, add related data tables to a card, improve page layout, or fix poorly structured pages. Also use when the user mentions: דף כרטיס, עיצוב דף, בניית דף, עריכת דף, הוספת שדות לדף, סקשן, כותרת סקשן, טאב, טבלה בכרטיס, page builder, card page, form page, page layout, page design, section header, add fields to page, redesign page, page structure, Edit-Page, Create-Form-Page, Add-Table-View-to-Form-Page."
---

# Page Builder / בניית ועריכת דפי כרטיס

Build well-structured, professional record card pages in MyBusiness CRM for any entity type.

## Relation to `myb-p-create-entity`

`myb-p-create-entity` builds the full entity stack (DB tables → list page → menu → JS). This skill (`myb-p-page-builder`) handles the **card page** for an entity created by either:

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
│  │ ─── separator ───                   │    │
│  │ Section Header: "פרטי התקשרות"      │    │
│  │ ┌──────────┬──────────┬──────────┐  │    │
│  │ │ Field 4  │ Field 5  │ Field 6  │  │    │
│  │ └──────────┴──────────┴──────────┘  │    │
│  │ ─── separator ───                   │    │
│  │ ┌────────────────────────────────┐  │    │
│  │ │ Comment (full width, col-12)  │  │    │
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
1. **Header row** -- col-12 with H2 text element (class `TicketHeadline`, color `#3249b3`)
2. **Field rows** -- typically col-4/4/4 (3 columns), each column stacking 2-3 fields
3. **Separator** -- visual line between sections

This pattern repeats for every logical group of fields on the page.

### Shortcut: duplicate an element instead of rebuilding it

`Duplicate-Element(pageId, elemId)` deep-clones any element carrying the `simblaEL` class — the copy lands right after the original with brand-new ids and all classes/styles/bindings intact. Re-fetch the page (`Get-Page-Content`) to read the new ids, then edit the copy. On a card page it's the fast way to replicate **structure** that's tedious to rebuild:

- A **related-records table** already configured on this card → duplicate it, then `Edit-Table-View(tableId=<copy>)` to repoint it at a different child table (the copy inherits the columns/formatting/edit-mode you already set).
- A styled **section header** (`TicketHeadline` H2) or text block → duplicate, then `Add-Edit-Text-Element(elemId=<copy>)` to change the text.

⚠️ **Bound input fields are NOT the sweet spot.** A duplicated field keeps the original's `name`, i.e. it points at the SAME DB column, and there is no clean "rebind field" action (`Edit-Page` does label / move / required / remove — not re-bind). So duplicating a field row to host *different* fields means removing the copies and `add-new-field` anyway. Use `Duplicate-Element` for display/structure elements (related tables, text, and — on dashboards — counters/charts); keep the `Edit-Page` add-row/add-field flow for form inputs. Full spec: `../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md`.

## What This Skill Covers vs. Does NOT Cover

### Covered
- Creating new form pages from scratch (`Create-Form-Page`)
- Adding/removing/moving fields on pages (`Edit-Page`)
- Adding section headers with styled text (`Add-Edit-Text-Element`)
- Adding related data tables to pages (`Add-Table-View-to-Form-Page`)
- Setting page CSS and JavaScript (`Edit-Page-CSS-JS`)
- Redesigning existing pages (reading current structure, planning improvements, executing changes)
- Choosing which fields belong in which section for any business domain

### NOT Covered / Limitations
- **Tab components** (`simbla-nav`) -- cannot be created via MCP tools. Tabs are only available in the UI page builder. Related tables are added as separate sections instead
- **Separator elements** -- the `separatorElm` visual dividers cannot be created via MCP. Use section headers as visual breaks instead
- **Custom HTML injection** -- MCP only supports adding text/title elements, not raw HTML
- **Drag-and-drop reordering in UI** -- MCP handles field positioning; manual reordering requires the visual editor
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

14. **`edit-row` before moving fields.** When changing a row's grid from [6,6] to [4,4,4], do it BEFORE adding/moving fields to the new column (index 2). Otherwise the third column doesn't exist yet and field placement may fail.

15. **Multiple field moves in one `Edit-Page` call.** You can batch multiple `move-existing-field` actions in a single call -- they execute in order. This is efficient for reorganizing a page.

16. **`Add-Table-View-to-Form-Page` creates its own header row automatically.** You do NOT need to manually create a header row or text element for related tables -- the tool generates a section header with the `tableTitle` parameter. Just call the tool and it handles the visual structure.

17. **Multiple tables inserted at same `insertAfterRow` stack in reverse order.** If you insert Tables A, B, C all after row P100, they appear C, B, A (bottom to top). To get them in the desired order, either insert them in reverse order, or use different `insertAfterRow` values (insert A first, then B after A's new row, etc.).

18. **Existing pages may have multiple containers.** When redesigning, the page might have separate `containerHolder` divs (e.g., P38 for form, P339 for old toggle-based table sections). New table views added via MCP go into the main form container (P38). The old container sections (P339) remain -- they can be left as-is or cleaned up manually.

19. **`Add-Edit-Text-Element` and `Edit-Page(add-row)` can run in parallel.** When you need to both place a text element in a just-created header row AND create the next field row, these are independent operations and can be called simultaneously to save time.

20. **Delete empty rows only.** Before calling `delete-row`, make sure you've moved all fields out of it first. Deleting a row with fields will lose those fields from the page.

21. **`move-existing-object` on rows with fields causes orphaning.** Never use `move-existing-object` to move a row that contains fields -- the fields become orphans and disappear from the page structure. Instead, move individual fields out of the row using `move-existing-field`, then delete the empty row, and create a new row where needed. Only use `move-existing-object` for empty rows or non-field elements.

22. **Free-text fields only auto-render as `<textarea>` if named exactly `Comment`, `Description`, or `Notes`.** Fields with custom names like `Resolution`, `RootCause`, `TechnicianNotes`, `Summary` will render as a single-line `<input type="text">` even though they're meant for long text. To fix this, add JavaScript that converts them to textareas on page load. See the JS pattern below in "Converting Text Fields to Textareas".

23. **`Add-Table-View-to-Form-Page` field types don't include Pointer.** The `type` parameter only accepts: String, Number, Boolean, Date, PrivateFile, File. For pointer fields displayed in a table, use `fieldName: "PointerField.TargetField"` (dot notation) with `type: "String"` -- the value displays as read-only text. If you need the field to be editable as a dropdown in the table, use `fieldName: "PointerField"` (without dot notation) with `type: "String"` -- the system auto-detects the pointer and renders a dropdown.

24. **Related table Name field should be clickable.** By default, the Name column in related data tables (Tasks, Activities, Notes) is plain text -- clicking it does nothing. To make it open the record in the sidebar, add a JS click handler after the table loads. See "Clickable Table Rows" JS pattern below.

25. **Controlling table insertion order -- practical example.** If you want tables in order: Tasks, Activities, Notes (top to bottom), insert them in **reverse order** with the same `insertAfterRow`:
    ```
    1. Add-Table-View: Notes    (insertAfterRow: P393)  → goes right after P393
    2. Add-Table-View: Activities (insertAfterRow: P393) → pushes Notes down
    3. Add-Table-View: Tasks     (insertAfterRow: P393)  → pushes Activities+Notes down
    Result: Tasks → Activities → Notes (top to bottom)
    ```

## Workflow

### Step 0: Understand the Entity

Before touching the page, understand what you're building:

1. **Which table?** Run `Get-Schema(className)` to see all available fields, their types, and pointer relationships
2. **What does the customer do?** A real-estate company needs different sections than a school or a service company. Ask the user about their business context if not clear
3. **Is there an existing page?** Run `Get-Page-Content(pageName, minimal: true)` to see current structure. Also run `Get-Site-Pages` to check if the page exists

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

### Step 2: Create or Prepare the Page

**New page:**
```
Create-Form-Page(
  tableName: "TableName",
  pageName: "apps/mybusiness/TableName",
  title: "כותרת הכרטיס"
)
```

**Existing page:** Read current structure with `Get-Page-Content(pageName, minimal: true)`. Identify what needs to change -- missing sections, misplaced fields, missing headers.

### Step 3: Build the Grid -- Rows First, Fields Second

This is the core building step. For each section:

**3a. Add the header row:**
```
Edit-Page(pageId, actions: [
  { actionType: "add-row", columnSize: [12], newRowAfterRow: "<lastRowId>" }
])
```

**3b. Place the section header text:**
```
Add-Edit-Text-Element(
  pageId: "<pageId>",
  elemType: "H2",
  html: "<font color=\"#3249b3\" style=\"font-size: 24px;\">Section Title</font>",
  rowId: "<headerRowId>",
  columnNumber: 0
)
```

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

### Step 5: Apply CSS

Add the standard card page CSS:

```
Edit-Page-CSS-JS(pageId, cssCode: `
.TicketHeadline {
    font-size: 24px !important;
    font-weight: 800 !important;
    margin-top: 17px !important;
    padding-bottom: 7px;
}
`)
```

Read current CSS first with `Get-Page-Content` and merge if needed -- `Edit-Page-CSS-JS` overwrites.

### Step 6: Verify and Advise

1. Run `Get-Page-Content(pageName, minimal: true)` to verify the final structure
2. Remind the user to reload the page in the browser
3. Suggest any form rules that might be needed (conditional visibility of fields)

### Step 7: Link the Card Page to its List Page (sidebar mode)

After the card is built, configure the entity's list page so clicking a row opens this card in a left sidebar (matches Account / Sale UX). Run on the **list page**, not on the card page:

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

## Section Header HTML Template

The standard section header HTML for `Add-Edit-Text-Element`:

```html
<font color="#3249b3" style="font-size: 24px;">כותרת הסקשן</font>
```

Use `elemType: "H2"` with this HTML. The color `#3249b3` is the default MyBusiness brand blue. You can adjust it to match the customer's brand.

## Essential JS Patterns

Always include these JS patterns when building pages. Add them via `Edit-Page-CSS-JS`.

### Converting Text Fields to Textareas

Only fields named exactly `Comment`, `Description`, or `Notes` auto-render as `<textarea>`. All other text fields (like `Resolution`, `RootCause`, `TechnicianNotes`, `Summary`) render as single-line `<input type="text">` -- even if they're meant for long text. Fix this with JS:

```javascript
// Convert specific text inputs to textareas
$(document).ready(function() {
    var textareaFields = ['Resolution', 'RootCause', 'TechnicianNotes', 'Summary'];
    textareaFields.forEach(function(fieldName) {
        var $input = $('input[name="' + fieldName + '"]');
        if ($input.length && $input.attr('type') === 'text') {
            var $textarea = $('<textarea>')
                .attr('name', fieldName)
                .attr('id', $input.attr('id'))
                .addClass($input.attr('class'))
                .val($input.val())
                .attr('rows', 3);
            $input.replaceWith($textarea);
        }
    });
});
```

Also add matching CSS to ensure minimum height:
```css
textarea[name="Resolution"],
textarea[name="RootCause"],
textarea[name="TechnicianNotes"],
textarea[name="Summary"] {
    min-height: 100px;
}
```

**When to apply:** Any time a free-text field is added with a custom name (not Comment/Description/Notes), add its name to the `textareaFields` array in the JS.

### Clickable Table Rows

By default, the Name column in related data tables is plain text. To make it clickable (opens the record in the sidebar):

```javascript
// Make Name column clickable in related tables
$('.simbla-table').on('data-loaded', function() {
    var $table = $(this);
    var nameIndex = $table.find('thead th').index(
        $table.find('thead th[data-field="Name"]')
    );
    if (nameIndex < 0) return;
    $table.find("tbody tr td:nth-child(" + (nameIndex + 1) + ")").each(function() {
        $(this).css({ cursor: "pointer", color: "#299ff2" });
        $(this).on("click", function() {
            $(this).closest("tr").find(".fa-pencil").click();
        });
    });
});
```

**When to apply:** Always add this JS when the page includes related data tables (Tasks, Activities, Notes, etc.). Users expect to click a record name to open it.

## Redesigning an Existing Page

When improving a page that already has fields, the process is significantly different from building a new page. Follow this tested sequence:

### Phase 1: Audit
1. **Read** the current structure: `Get-Page-Content(pageName, minimal: true)`
2. **Read** the schema: `Get-Schema(className)` to see all available fields
3. **List existing fields** on the page -- extract every `name:` value from the YAML
4. **List missing fields** -- compare schema fields to page fields
5. **Plan target sections** -- decide which fields go where

### Phase 2: Grid Restructuring
1. **Change existing row layouts** using `edit-row` (e.g., convert [6,6] to [4,4,4]) -- do this BEFORE moving fields so the new columns exist
2. **Delete empty spacer rows** that are no longer needed

### Phase 3: Field Reorganization
1. **Move existing fields** to their target sections using `move-existing-field` -- batch multiple moves in one `Edit-Page` call
2. **Add new fields** (fields not yet on the page) using `add-new-field` -- only for fields NOT already in the page YAML
3. **Delete empty rows** left behind after moves

### Phase 4: Section Headers
For each new section (working top to bottom):
1. `Edit-Page(add-row [12])` -- create header row, note the returned `newRowId`
2. `Add-Edit-Text-Element(H2)` -- place header text + `Edit-Page(add-row [4,4,4])` for field row (these two can run in parallel)
3. Move/add fields to the new field row

### Phase 5: Related Tables & Finishing
1. Add a spacer row (col-12, empty) after the last form field
2. `Add-Table-View-to-Form-Page` for each related table (no need to create headers manually -- the tool does it)
3. `Edit-Page-CSS-JS` -- read existing CSS/JS first, then merge with new code
4. **Verify** with `Get-Page-Content(pageName, minimal: true)`

### Common Mistake: "Field already exists"
When redesigning, NEVER try to `add-new-field` for a field that's already on the page. This will throw an error. Instead:
- Fields already on the page → use `move-existing-field`
- Fields NOT on the page → use `add-new-field`
Always cross-reference the current page YAML before choosing which action to use.

## Reference Files

- [references/page-design-principles.md](references/page-design-principles.md) -- Detailed design principles extracted from ideal example pages, with rationale for each
- [references/edit-page-reference.md](references/edit-page-reference.md) -- Complete parameter reference for all Edit-Page action types with examples
- [references/common-layouts.md](references/common-layouts.md) -- Ready-to-use section layouts for common entity types (Account, Sale, Case, Task, Contact) and guidelines for custom entities
