# Page Design Principles / עקרונות עיצוב דפים

These principles were extracted from analyzing well-designed card pages in production MyBusiness CRM systems. They represent best practices for any record card page, regardless of the entity type or business domain.

## Table of Contents
1. [Logical Section Grouping](#1-logical-section-grouping)
2. [Visual Hierarchy](#2-visual-hierarchy)
3. [Grid Consistency](#3-grid-consistency)
4. [Field Ordering Within Sections](#4-field-ordering-within-sections)
5. [Comment and Free-Text Fields](#5-comment-and-free-text-fields)
6. [Related Data Tables](#6-related-data-tables)
7. [Page Structure (MPID Zones)](#7-page-structure-mpid-zones)
8. [CSS Styling](#8-css-styling)
9. [Behaviour Without Code](#9-behaviour-without-code)
10. [RTL Considerations](#10-rtl-considerations)

---

## 1. Logical Section Grouping

**Principle:** Fields must be grouped by topic, never laid out as a flat list.

A flat page with 20+ fields in sequence is overwhelming and hard to scan. Users need to find specific information quickly -- sections with headers let them jump to what they need.

**How to group:**
- Think about what a user looks for when they open this record. The answer depends on their role:
  - A sales rep opening an Account card wants: name, phone, email (to contact them), status (to know the relationship stage), owner (to know who manages this account)
  - A manager opening a Case card wants: status, priority, owner (to manage the workload), then the case details
- Group fields that answer the same question together. "Who is this?" goes in one section. "How do I reach them?" goes in another. "What's the business context?" goes in a third.

**Section naming conventions (Hebrew):**
- Use descriptive, specific names -- not generic ones
- Good: "פרטי לקוח", "פרטי התקשרות", "פרטי מנהל", "מידע עסקי"
- Bad: "פרטים", "מידע נוסף", "אחר"
- If a section would be called "פרטים נוספים" (additional details), think harder about what those fields actually represent. Often they can be split into more specific groups.

**Minimum fields per section:** A section with only 1 field usually doesn't deserve its own header. Consider merging it into an adjacent section. Free text (Comment/Notes) gets no heading at all — it is the full-width last row of the form (`card-aesthetics.md` A10).

**Maximum fields per section:** If a section has more than 9-12 fields (3-4 rows of 3), consider splitting it. Large sections lose the benefit of grouping.

---

## 2. Visual Hierarchy

**Principle:** Create clear visual boundaries between sections.

The hierarchy from strongest to weakest visual signal:
1. **Section headers** (H2 with TicketHeadline class) -- marks the start of each section
2. **Soft hairline** above each section header except the first -- drawn by the standard aesthetics CSS block (no separator elements; they cannot be created via MCP anyway)
3. **Row spacing** -- the master's own padding on rows; do not add empty rows for spacing

**Section header format:**
```html
<div class="textContainer H2"><h2 class="TicketHeadline">כותרת</h2></div>
```
- Element type: H2, class `TicketHeadline`, plain text -- the exact element the built-in cards use
- Font, size and colour come from the design system, never from the heading: on ticket cards 18px/400 navy, on `NewMaster` cards 24px/600 navy (KB `30-customization/03-pages-and-layouts.md` §4). No `<font>`, no inline `style`
- Created with `Add-Edit-Text-Element` (plain text) + `Edit-Page` `set-html-content` (adds the class) -- SKILL.md Step 3b
- Always placed in a col-12 row (full width)

**Before related tables:** one transition only -- the hairline above the first table's header row. Full rules: `card-aesthetics.md` A17–A19.

---

## 3. Grid Consistency

**Principle:** Use a consistent column layout within each section and across the page.

**Default layout: 3 columns (`[4, 4, 4]`)**
This is the standard for most field rows. Three columns provide a good balance between information density and readability. One field per column; more fields means more rows, filled full-first (`card-aesthetics.md` A1–A2).

**When to use 2 columns (`[6, 6]`):**
- Fields with long labels (more than ~15 characters in Hebrew)
- Fields where the input needs more horizontal space (URL, email, long text)
- Pages where there are few fields per section (2 columns look better than 3 with empty space)

**When to use full width (`[12]`):**
- Section headers (always)
- Textarea fields (Comment, Description, Notes)
- Documentation/conversation widgets
- Rich text areas

**When to use 4 columns (`[3, 3, 3, 3]`):**
- Compact Boolean/checkbox fields
- Short select dropdowns (Gender, Yes/No)
- Groups of similar small fields (e.g., "מגדר", "מצב משפחתי", "שומר שבת")

**Mixing layouts:** One grid per section. The only row that may differ is a full-width `[12]` row (a textarea, a related table). Do not mix `[4,4,4]` and `[6,6]` in one section (`card-aesthetics.md` A3).

**No column stacking:** Do not stack several fields inside one column. Built-in cards place one field per column, and a stacked column breaks alignment with its neighbours the moment a form rule hides one of its fields (the fields below move up). Need more fields? Add rows (`card-aesthetics.md` A1).

---

## 4. Field Ordering Within Sections

**Principle:** Order fields by importance and natural reading flow.

**Within a row (left-to-right in RTL = right-to-left visually):**
- Column 0 (rightmost in RTL): Most important field in the group
- Column 1 (middle): Second most important
- Column 2 (leftmost in RTL): Least important or supplementary

**Across rows (reading order: right to left, then down):**
- Most important/frequently used fields in the first row
- Less common or supplementary fields in later rows
- Related fields adjacent in reading order (e.g., City then Address, Status then Sub-Status) — side by side in one row, or the last column of one row and the first of the next. Never stacked inside one column (A1)

**Field importance hierarchy (general):**
1. Name / Title / Number (identifies the record)
2. Status / State (current lifecycle position)
3. Type / Category (classification)
4. Owner / Assignee (who's responsible)
5. Related record (AccountId, ContactId -- the parent relationship)
6. Key business fields (Amount, Priority, Deadline)
7. Contact info (Phone, Email)
8. Dates (CreatedAt, UpdatedAt, custom dates)
9. Metadata (CreatedBy, Source)
10. Optional/supplementary fields

---

## 5. Comment and Free-Text Fields

**Principle:** Long text fields always get full width at the bottom of the form section.

- The `Comment` field should be in a col-12 row
- Place it after all the structured field sections, before related tables
- Use `<textarea>` (rows: 3-5)
- If there's a `Documentation` field (conversation-style), it also gets col-12, placed after Comment

---

## 6. Related Data Tables

**Principle:** Add table views for entities that have a pointer back to the current record.

**Ordering of related tables:**
1. Most frequently accessed first
2. For Account cards: Contacts > Sales > Cases > Tasks > Activities > Documents > Notes > Emails
3. For Sale cards: Line Items/Products > Tasks > Activities > Documents > Notes
4. For Case cards: Tasks > Notes > Documents > Related Cases

**Table view configuration:**
- `allowCreate: true` -- let users create new related records from the card
- `allowInlineEdit: true` -- let users edit fields without opening the related record
- Show 3-5 columns in each table (Name, Status, Date, Owner are typical)
- Add `createBtnTitle` in Hebrew (e.g., "הוסף איש קשר חדש")

**Table title format:** `Add-Table-View-to-Form-Page` creates the header from `tableTitle` — a bare `<h2>` inside the table element. Give it the `TicketHeadline` class with `set-html-content` on its `tcH` id so it matches the section headings (`card-aesthetics.md` A16).

---

## 7. Page Structure (MPID Zones)

Every page has 4 content zones controlled by the master page:

| Zone | Content | Notes |
|------|---------|-------|
| `_MPID1` | Top bar | Back button, dynamic title. Auto-generated by `Create-Form-Page` |
| `_MPID0` | Main content | The form, section headers, fields, related tables. This is where all page building happens |
| `_MPID2` | Bottom bar | Save/Delete/Cancel buttons. Auto-generated |
| `_MPID3` | Reserved | Always empty |

When building a page, you only work with `_MPID0`. The master page (`MasterTicket`) handles the top and bottom bars.

**Container hierarchy inside _MPID0:**
```
form (data-simbla-class="TableName")
└── containerHolder
    └── container.dbcont
        ├── Row: Section 1 Header (col-12)
        ├── Row: Section 1 Fields (col-4/4/4)
        ├── Row: Section 1 Fields (col-4/4/4)
        ├── Row: Section 2 Header (col-12)
        ├── Row: Section 2 Fields (col-4/4/4)
        ├── Row: Comment (col-12)
        ├── Row: Empty spacer (col-12)
        ├── Row: Related Table 1
        ├── Row: Related Table 2
        └── ...
```

---

## 8. CSS Styling

**Standard CSS for card pages:** the card-aesthetics block in `card-aesthetics.md` §8 -- heading-uniformity guard, sub-heading size, soft hairline between sections. Merge it into every card you build or redesign.

Heading size and colour are **not** set per page: the design system already styles `h2.TicketHeadline` (KB `30-customization/03-pages-and-layouts.md` §4), and a page-level override is exactly what makes one card's headings differ from every other card's. The old rule `.TicketHeadline { font-size: 24px !important; font-weight: 800 !important; … }` is retired -- remove it when you meet it.

---

## 9. Behaviour Without Code

**No page JS by default — native tools only** (SKILL.md, "Native only — code is the last resort"). The behaviours that used to be written as page JS on cards, and what replaces them:

- **Auto-compose a title from related fields** (e.g. Account + Case type) → no verified native path (trigger static values do not resolve `{{{…}}}`; `formula-value` is numeric). Show the source fields side by side instead; if the customer insists, apply the code policy. Copying a single field → form rule `dynamic-value`.
- **Order of a dropdown's options** → a stored sort order on the lookup table rather than re-ordering in JS (KB 30/03 §10, H-12).
- **Open a related record by clicking its name** → the row's edit icon and the table view's edit mode; no click handler.
- **Long text** → stored `<textarea>` markup, not a load-time conversion.

If a behaviour still has no native path, the code policy applies: document the native options ruled out and get explicit approval before writing anything.

---

## 10. RTL Considerations

MyBusiness CRM pages use `isRtl: true` by default (Hebrew). Key implications:

- Column order is visually reversed: column 0 appears on the **right**, column 2 on the **left**
- Field importance order: rightmost = most important (column 0)
- Text alignment is handled automatically by the framework
- Don't add explicit `direction: rtl` in CSS -- it's already set by the master page
- Labels are aligned to the right by default
