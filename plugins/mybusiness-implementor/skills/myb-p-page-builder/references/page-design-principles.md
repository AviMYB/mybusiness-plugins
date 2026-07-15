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
9. [JavaScript Patterns](#9-javascript-patterns)
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

**Minimum fields per section:** A section with only 1 field usually doesn't deserve its own header. Consider merging it into an adjacent section. Exception: a full-width Comment/Notes field is fine alone.

**Maximum fields per section:** If a section has more than 9-12 fields (3-4 rows of 3), consider splitting it. Large sections lose the benefit of grouping.

---

## 2. Visual Hierarchy

**Principle:** Create clear visual boundaries between sections.

The hierarchy from strongest to weakest visual signal:
1. **Section headers** (H2 with TicketHeadline class) -- marks the start of each section
2. **Separator lines** (not available via MCP, but headers alone create sufficient separation)
3. **Row spacing** -- padding-top/padding-bottom on rows
4. **Empty rows** -- a blank col-12 row between the form section and related tables

**Section header format:**
```html
<font color="#3249b3" style="font-size: 24px;">כותרת</font>
```
- Element type: H2
- Color: `#3249b3` (MyBusiness default blue) -- can be customized per customer's brand
- The `TicketHeadline` CSS class adds: font-size 24px, font-weight 800, margin-top 17px, padding-bottom 7px
- Always placed in a col-12 row (full width)

**Empty spacer rows:** Between the last field section and the first related table, add an empty row (col-12, no content). This creates breathing room between the editable form and the read-only table views.

---

## 3. Grid Consistency

**Principle:** Use a consistent column layout within each section and across the page.

**Default layout: 3 columns (`[4, 4, 4]`)**
This is the standard for most field rows. Three columns provide a good balance between information density and readability. Each column can stack 2-3 fields vertically.

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

**Mixing layouts:** You can mix column counts between rows in the same section, but keep it minimal. For example, a section might have one row of [4,4,4] for standard fields and one row of [12] for a textarea. Avoid mixing [4,4,4] and [6,6] in the same section unless there's a clear reason.

**Column stacking:** Within a single column, you can stack multiple fields vertically. This is the primary way to fit more than 3 fields per row. For example, in a 3-column row, each column might have 2-3 fields, giving 6-9 fields per row. Place related fields in the same column (e.g., City and Address in the same column).

---

## 4. Field Ordering Within Sections

**Principle:** Order fields by importance and natural reading flow.

**Within a row (left-to-right in RTL = right-to-left visually):**
- Column 0 (rightmost in RTL): Most important field in the group
- Column 1 (middle): Second most important
- Column 2 (leftmost in RTL): Least important or supplementary

**Within a column (top to bottom):**
- Most important/frequently used field on top
- Less common or supplementary fields below
- Related fields adjacent (e.g., City above Address, Status above Sub-Status)

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

**Table title format:** Use the same H2/TicketHeadline styling as section headers, but consider using a different approach -- the `tableTitle` parameter in `Add-Table-View-to-Form-Page` handles this automatically.

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

**Standard CSS for card pages:**

```css
.TicketHeadline {
    font-size: 24px !important;
    font-weight: 800 !important;
    margin-top: 17px !important;
    padding-bottom: 7px;
}
```

This CSS should be added to every card page that uses section headers. Without it, the H2 elements will use default browser styling which is inconsistent.

**Optional enhanced CSS:**

```css
/* Section header with brand color underline */
.accountDetailsHeader {
    border-radius: 0px;
    line-height: 26px;
}

/* Subtle top border on section header rows */
.rDivider[data-border-type="Bottom"] {
    border-bottom: 1px solid #e0e0e0;
}
```

---

## 9. JavaScript Patterns

**Common page JS patterns:**

**Auto-generate title from related fields:**
```javascript
// Case page: auto-set Name from Account + CaseType
$('select[name=CaseTypeId], select[name=AccountId]').on('change', function() {
    var account = $('#AccountId option:selected').text();
    var caseType = $('#CaseTypeId option:selected').text();
    $("#Name").val(account + ' - ' + caseType);
});
```

**Sort pointer dropdown options:**
```javascript
// Sort StatusId by Order field
$('[name=StatusId]').on('before-select-options', function(e, d) {
    d.query.ascending("Order");
});
```

**Click-to-open on table rows:**
```javascript
$('.simbla-table').on('data-loaded', function() {
    var nameIndex = $('.simbla-table thead th').index(
        $('.simbla-table thead th[data-field="Name"]')
    );
    $("tbody tr td:nth-child(" + (nameIndex + 1) + ")").each(function() {
        $(this).css("cursor", "pointer").css("color", "#299ff2");
        $(this).on("click", function() {
            $(this).closest("tr").find(".fa-pencil").click();
        });
    });
});
```

Only add JS when the customer needs specific behavior. Don't add JS by default -- keep pages simple.

---

## 10. RTL Considerations

MyBusiness CRM pages use `isRtl: true` by default (Hebrew). Key implications:

- Column order is visually reversed: column 0 appears on the **right**, column 2 on the **left**
- Field importance order: rightmost = most important (column 0)
- Text alignment is handled automatically by the framework
- Don't add explicit `direction: rtl` in CSS -- it's already set by the master page
- Labels are aligned to the right by default
