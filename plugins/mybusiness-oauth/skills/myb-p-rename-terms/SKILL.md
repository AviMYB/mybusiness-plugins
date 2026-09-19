---
name: myb-p-rename-terms
description: "Rename CRM entity terms to match a customer's domain language in MyBusiness CRM. Use this skill whenever a customer needs to change how entities are labeled - for example renaming 'מכירה' (Sale) to 'פרויקט' (Project), 'לקוח' (Account) to 'משתתף' (Participant), or 'פנייה' (Case) to 'קריאה' (Call). Triggers on requests like: 'שנה מכירה לפרויקט', 'rename sales to projects', 'התאמת מונחים', 'שינוי שמות ישויות', 'the customer calls sales projects', 'העמותה קוראת ללקוחות משתתפים'. Also use when a customer says their terminology is different from the CRM defaults, or when localizing the CRM for a specific industry vertical."
---

# MyBusiness CRM - Rename Terms / שינוי מושגים

This skill renames entity display labels across the entire CRM UI using native platform tools that modify the HTML and system dictionaries directly. No JavaScript overrides are used — all changes are permanent, immediate, and have no "flash" of old text.

## IMPORTANT: No JS Overrides

**Do NOT use `Edit-Page-CSS-JS` with jsCode for term replacement unless the user explicitly approves it.** Always exhaust the native tools first:

1. **`Set-Terminology-Dictionary`** — System-wide terminology mapping used by JS files
2. **`Replace-Terms`** — Direct HTML text replacement in any page
3. **`Edit-Page` with `change-existing-field-label`** — Permanent field label changes in forms
4. **`Set-Menu-Items`** — Menu item title changes
5. **`Add-Edit-Text-Element`** — Edit specific text/title elements on pages

Only if a specific text cannot be changed by any of these tools (which is rare), ask the user for permission to use a JS override as a last resort.

## What the User Provides

1. **Which entity** to rename (Sale, Account, Case, Task, Activity, Contact)
2. **New singular term** in Hebrew (e.g., "פרויקט")
3. **New plural term** in Hebrew (e.g., "פרויקטים")

If the user only gives singular, derive the plural (or ask).

## Default Term Mapping

| Entity | Class Name | Singular | Plural |
|--------|-----------|----------|--------|
| Sale | Sales | מכירה | מכירות |
| Account | Accounts | לקוח | לקוחות |
| Case | Cases | פנייה | פניות |
| Task | Tasks | משימה | משימות |
| Activity | Activities | פעילות | פעילויות |
| Contact | Contacts | איש קשר | אנשי קשר |

## Tools Reference

### 1. Set-Terminology-Dictionary
Sets a system-wide dictionary used by the CRM's JavaScript runtime. This is the foundation — it tells the system how to translate terms in dynamic contexts (reports, queries, runtime-generated labels).

```
Set-Terminology-Dictionary(terminology: {
    "מכירה": "פרויקט",
    "מכירות": "פרויקטים",
    // keep all other terms as-is
    "פנייה": "פנייה", "פניות": "פניות", ...
})
```

Always call `Get-Terminology-Dictionary` first to get the current state, then update only the terms being changed while preserving the rest.

### 2. Replace-Terms
Replaces text directly in a page's HTML. This is the primary tool for renaming — it changes headings, labels, button text, chart titles, counter labels, modal headers, and any other visible text.

```
Replace-Terms(pageId: "...", terms: { "מכירה": "פרויקט", "מכירות": "פרויקטים" })
```

Key behaviors:
- Modifies the actual HTML stored on the server — changes are permanent
- Returns a count of replacements made per term
- Running on **CRMmaster** updates the main dictionary that affects all pages
- Must also run on **Timeline** separately
- Be careful not to replace terms that would break HTML syntax (e.g., CSS class names, data attributes)

### 3. Edit-Page (change-existing-field-label)
Permanently changes a field's label in a form page. Use for pointer fields like SaleId, AccountId, etc.

```
Edit-Page(pageId: "...", actions: [
    { "actionType": "change-existing-field-label", "fieldName": "SaleId", "label": "משויך לפרויקט" }
])
```

### 4. Set-Menu-Items
Updates menu item titles. Required for side menu and settings sub-menus.

Each item must include: `_id`, `title`, `type`, `page`, `order`, `icon` (copy from Get-Menu-Items response).

### 5. Add-Edit-Text-Element
Edits specific text elements (headings, paragraphs) on a page by element ID. Useful when Replace-Terms can't target a specific element precisely.

```
Add-Edit-Text-Element(pageId: "...", elemId: "P62", elemType: "P", html: "הכנסות מפרויקטים בתאריכים הנבחרים")
```

## Step-by-Step Process

### Step 1: Discover All Affected Pages

Use two complementary strategies:

#### Strategy A: Page-Name Search
```
Get-Site-Pages()
```
Filter all pages whose name contains the entity class name (singular or plural). For Sale, search for `Sale`/`Sales`:
- Sale, Sales, SaleRows, Pipeline
- DashboardSales, DashboardSalesManager, DashboardSalesRep
- System-Tables-Sale-Statuses
- Mobile-Sale, Mobile-Sales

**Also always check these fixed pages:**
- `CRMmaster` (master dictionary)
- `Timeline` (entity event labels)
- `MasterTicket` (modal tabs)
- `Account` (entity tabs/sections)
- `settings` (module cards)
- `DashboardLeads`, `DashboardGen*` (may reference entity)

#### Strategy B: Schema-Driven Search
```
Get-Schema()
```
Find tables with Pointer fields targeting the entity's class. Check if those tables have CRM pages — they may display the term in field labels or section headers.

### Step 2: Update Terminology Dictionary

```
Get-Terminology-Dictionary()
```

Update the changed terms, keep everything else:

```
Set-Terminology-Dictionary(terminology: {
    "מכירה": "פרויקט",
    "מכירות": "פרויקטים",
    "פנייה": "פנייה",
    "פניות": "פניות",
    "משימה": "משימה",
    "משימות": "משימות",
    "פעילות": "פעילות",
    "פעילויות": "פעילויות",
    "לקוח": "לקוח",
    "לקוחות": "לקוחות",
    "ליד": "ליד",
    "לידים": "לידים"
})
```

### Step 3: Replace-Terms on CRMmaster

This is the most important step — CRMmaster contains the main dictionary used across all pages.

```
Replace-Terms(pageId: <CRMmaster ID>, terms: { "מכירה": "פרויקט", "מכירות": "פרויקטים" })
```

### Step 4: Replace-Terms on Timeline

Timeline must be updated separately — it contains hardcoded entity names in event templates.

```
Replace-Terms(pageId: <Timeline ID>, terms: { "מכירה": "פרויקט", "מכירות": "פרויקטים" })
```

### Step 5: Replace-Terms on All Discovered Pages

For every page found in Step 1, run Replace-Terms. This handles:
- Page titles and headlines
- Button text ("מכירה חדשה" → "פרויקט חדש")
- Chart/counter titles in dashboards
- Modal headers
- Checkbox filter labels
- Column headers in tables
- Settings card descriptions

Run in parallel for efficiency:
```
Replace-Terms(pageId: <Sales>, terms: {...})
Replace-Terms(pageId: <Sale>, terms: {...})
Replace-Terms(pageId: <Pipeline>, terms: {...})
Replace-Terms(pageId: <Account>, terms: {...})
Replace-Terms(pageId: <MasterTicket>, terms: {...})
Replace-Terms(pageId: <Task>, terms: {...})
Replace-Terms(pageId: <Activity>, terms: {...})
Replace-Terms(pageId: <PriceQuote>, terms: {...})
Replace-Terms(pageId: <DashboardSales>, terms: {...})
Replace-Terms(pageId: <DashboardSalesManager>, terms: {...})
Replace-Terms(pageId: <DashboardSalesRep>, terms: {...})
Replace-Terms(pageId: <DashboardLeads>, terms: {...})
Replace-Terms(pageId: <settings>, terms: {...})
Replace-Terms(pageId: <System-Tables-Sale-Statuses>, terms: {...})
```

If a page returns `changes: []` (no matches), that's fine — it means the term wasn't present there.

### Step 6: Update Field Labels on Form Pages

For form pages where the entity appears as a pointer field label (e.g., "משויך למכירה"):

```
Edit-Page(pageId: <PriceQuote>, actions: [
    { "actionType": "change-existing-field-label", "fieldName": "SaleId", "label": "משויך לפרויקט" }
])
```

Read each form page with `Get-Page-Content(minimal: true)` to identify fields whose label contains the old term, then batch-update them.

### Step 7: Update Menu Items

Fetch and update all menus with references to the entity:

```
Get-Menus()
Get-Menu-Items(menuId: <CRM-Menu>)
Get-Menu-Items(menuId: <Settings>)
Get-Menu-Items(menuId: <settings-sales>)  // entity-specific sub-menus
```

For each item containing the old term, update via Set-Menu-Items. Remember to include all required fields (`_id`, `type`, `page`, `order`, `icon`).

### Step 8: Verify and Report

Tell the user to refresh (Ctrl+F5) and check:
1. Side menu
2. List page (title, button, columns)
3. Form page (headline, field labels)
4. Pipeline (Sale only)
5. Account page (tabs, sections, columns)
6. Timeline (filter, event titles)
7. "Add new" modal tabs
8. Dashboards (chart titles, counters)
9. Settings page and sub-pages

Provide a summary table of all pages modified with replacement counts.

## Critical Rules

1. **No JS overrides without explicit user approval** — Always use Replace-Terms, Set-Terminology-Dictionary, Edit-Page, and Set-Menu-Items first
2. **CRMmaster + Timeline are mandatory** — Always run Replace-Terms on both
3. **Never touch schema** — Table names, field names, CSS classes are internal identifiers
4. **Menu items need all fields** — `_id`, `type`, `page`, `order`, `icon` for each item
5. **Read before write** — Always Get-Page-Content to get page IDs before Replace-Terms
6. **Discover all pages** — Use both page-name search and schema-driven search to find every page
7. **Multiple renames** — Can pass multiple term pairs in a single Replace-Terms call
8. **Idempotent** — Running Replace-Terms twice with the same terms has no effect (the old term is already gone)

## Gender Handling

When the gender changes (e.g., מכירה=feminine → פרויקט=masculine), the Timeline event verbs may need adjustment. Include verb forms in the Replace-Terms call on the Timeline page:

```
Replace-Terms(pageId: <Timeline>, terms: {
    "מכירה": "פרויקט",
    "מכירות": "פרויקטים",
    "עודכנה": "עודכן",    // feminine → masculine
    "נוצרה": "נוצר"       // feminine → masculine
})
```

Only include verb changes if the gender actually differs between old and new terms. Be careful — verb changes on Timeline only, not on other pages where these words might appear in different contexts.

## Rollback

To revert a rename:
1. `Set-Terminology-Dictionary` — restore original terms
2. `Replace-Terms` on all affected pages with reversed mapping (e.g., `{"פרויקט": "מכירה", "פרויקטים": "מכירות"}`)
3. `Set-Menu-Items` — restore original titles
4. `Edit-Page` — restore original field labels
