# Common Layouts / תבניות סקשנים לכרטיסים נפוצים

Ready-to-use section plans for common CRM entity types. These are starting points -- adapt them to the customer's specific business domain and schema.

## Table of Contents
1. [Account Card (כרטיס לקוח)](#account-card)
2. [Sale Card (כרטיס מכירה)](#sale-card)
3. [Case Card (כרטיס פנייה)](#case-card)
4. [Task Card (כרטיס משימה)](#task-card)
5. [Contact Card (כרטיס איש קשר)](#contact-card)
6. [Custom Entity Guidelines](#custom-entity-guidelines)
7. [Industry-Specific Adaptations](#industry-specific-adaptations)

---

## Account Card

The Account is the central entity in MyBusiness CRM. It represents a customer, company, lead, or organization.

### Standard Sections

| # | Section | Hebrew | Typical Fields | Grid |
|---|---------|--------|---------------|------|
| 1 | Identity | פרטי לקוח | Name*, TypeId, StatusId, BrandId, CompanyId | [4,4,4] |
| 2 | Contact | פרטי התקשרות | F_name, PhoneNumber, Email, City, Address | [4,4,4] |
| 3 | Lead Info | פרטי ליד | LeadStatusId, LeadOwnerId, SourceLead, FDate | [4,4,4] |
| 4 | Business | פרטי עסק | OwnerId, BranchType, NumberOfEmployees, Website | [4,4,4] |
| 5 | Dates | תאריכים ומטא | createdAt, createdBy, ConversionDate | [4,4,4] |
| 6 | Comment | הערה | Comment | [12] |

*Fields marked with * are required

### Related Tables

| Order | Table | Title | Key Columns |
|-------|-------|-------|-------------|
| 1 | Contacts | אנשי קשר | Name, PhoneNumber, Email, Role |
| 2 | Sales | מכירות | Name, StatusId.Name, Amount, createdAt |
| 3 | Cases | פניות | Name, StatusId.Name, PriorityId.Name, OwnerId.Name |
| 4 | Tasks | משימות | Name, StatusId.Name, DueDate, OwnerId.Name |
| 5 | Activities | פעילויות | Name, TypeId.Name, Date |
| 6 | Files | מסמכים | Name, createdAt |
| 7 | Notes | הערות | Name, createdAt |

### Conditional Sections (add based on customer needs)

- **פרטים דמוגרפיים** -- for B2C businesses: Gender, DateBirth, Age, MaritalStatus (grid: [3,3,3,3])
- **מורשי חתימה** -- for institutions: SignatureRightsTable table view
- **פרטי מנהל** -- for institutional customers: ManagerFirstName, ManagerLastName, ManagerPhone, ManagerEmail

---

## Sale Card

The Sale represents a deal, opportunity, or transaction.

### Standard Sections

| # | Section | Hebrew | Typical Fields | Grid |
|---|---------|--------|---------------|------|
| 1 | Deal Info | פרטי עסקה | Name*, Number, AccountId*, StatusId, StageId | [4,4,4] |
| 2 | Financial | פרטים כספיים | Amount, Discount, FinalAmount, Currency | [4,4,4] |
| 3 | Ownership | אחראי ותאריכים | OwnerId, createdAt, createdBy, CloseDate, ExpectedCloseDate | [4,4,4] |
| 4 | Products | מוצרים/שירותים | (table view of SaleItems/Products) | table |
| 5 | Comment | הערה | Comment | [12] |

### Related Tables

| Order | Table | Title | Key Columns |
|-------|-------|-------|-------------|
| 1 | SaleItems | פריטים | ProductId.Name, Quantity, Price, Total |
| 2 | Tasks | משימות | Name, StatusId.Name, DueDate |
| 3 | Activities | פעילויות | Name, TypeId.Name, Date |
| 4 | Files | מסמכים | Name, createdAt |
| 5 | Notes | הערות | Name, createdAt |

### JS Pattern for Sale Card

Auto-calculate total from items:
```javascript
// Recalculate when items table changes
$('.simbla-table').on('data-loaded', function() {
    // Sum is handled by showSummary in table view config
});
```

---

## Case Card

The Case represents a support ticket, service request, or inquiry.

### Standard Sections

| # | Section | Hebrew | Typical Fields | Grid |
|---|---------|--------|---------------|------|
| 1 | Case Info | פרטי פנייה | Number, Name*, CaseTypeId, SubTypeId, AccountId | [4,4,4] |
| 2 | Contact | פרטי התקשרות | ContactId, Email, PhoneNumber | [4,4,4] |
| 3 | Management | טיפול ומעקב | StatusId, StateId, PriorityId, OwnerId, Date | [4,4,4] |
| 4 | Comment | הערה | Comment | [12] |

### Related Tables

| Order | Table | Title | Key Columns |
|-------|-------|-------|-------------|
| 1 | Tasks | משימות | Name, StatusId.Name, DueDate, OwnerId.Name |
| 2 | Files | מסמכים | Name, createdAt |
| 3 | Notes | הערות | Name, createdAt |

### JS Pattern for Case Card

Auto-generate case title:
```javascript
$('select[name=CaseTypeId], select[name=AccountId]').on('change', function() {
    var account = $('#AccountId option:selected').text();
    var caseType = $('#CaseTypeId option:selected').text();
    $("#Name").val(account + ' - ' + caseType);
});
```

---

## Task Card

The Task represents a to-do item or assignment.

### Standard Sections

| # | Section | Hebrew | Typical Fields | Grid |
|---|---------|--------|---------------|------|
| 1 | Task Info | פרטי משימה | Name*, TypeId, StatusId, PriorityId | [4,4,4] |
| 2 | Assignment | הקצאה ותאריכים | OwnerId, AccountId, DueDate, createdAt | [4,4,4] |
| 3 | Related | קישורים | SaleId, CaseId, ContactId | [4,4,4] |
| 4 | Comment | הערה | Comment | [12] |

### Related Tables

| Order | Table | Title | Key Columns |
|-------|-------|-------|-------------|
| 1 | Files | מסמכים | Name, createdAt |
| 2 | Notes | הערות | Name, createdAt |

---

## Contact Card

The Contact represents an individual person associated with an Account.

### Standard Sections

| # | Section | Hebrew | Typical Fields | Grid |
|---|---------|--------|---------------|------|
| 1 | Personal | פרטים אישיים | Name* (or F_name + L_name), Role, AccountId | [4,4,4] |
| 2 | Communication | פרטי התקשרות | PhoneNumber, MobilePhone, Email, Fax | [4,4,4] |
| 3 | Address | כתובת | City, Address, HouseNum, PostalCode | [4,4,4] |
| 4 | Comment | הערה | Comment | [12] |

### Related Tables

| Order | Table | Title | Key Columns |
|-------|-------|-------|-------------|
| 1 | Cases | פניות | Name, StatusId.Name, createdAt |
| 2 | Activities | פעילויות | Name, TypeId.Name, Date |

---

## Custom Entity Guidelines

When building a card for a custom table (not one of the standard CRM entities), follow these principles:

### Step 1: Analyze the Schema

Run `Get-Schema(className)` and categorize every field:

| Category | Examples | Section Placement |
|----------|---------|-------------------|
| **Identity** | Name, Number, Title, Code | First section |
| **Classification** | Type, Category, Status, Priority | First or second section |
| **Relationships** | AccountId, ContactId, SaleId (Pointers) | Near the top -- these connect the record to its context |
| **Contact/Comm** | Phone, Email, Address fields | Communication section |
| **Financial** | Amount, Price, Total, Discount | Financial section |
| **Dates** | DueDate, StartDate, EndDate, createdAt | Dates section or grouped with related fields |
| **People** | OwnerId, AssignedTo, CreatedBy | Ownership/assignment section |
| **Descriptive** | Description, Comment, Notes | Full-width at bottom |
| **Boolean flags** | IsActive, IsApproved, IsPaid | Group together in [3,3,3,3] or [4,4,4] layout |
| **Files** | Documents, Images | Related table or dedicated section |
| **Computed** | TotalAmount, Age, DaysSinceCreation | Display near the source fields |

### Step 2: Name the Sections

Use names that describe the **topic**, not the field types:

| Instead of... | Use... |
|---------------|--------|
| פרטים ראשיים | פרטי [entity name] |
| פרטים נוספים | [specific topic] |
| שדות נוספים | [what they describe] |
| אחר | [find the real category] |

### Step 3: Determine Grid Layout

- Count the fields per section
- 1-3 fields: use [4,4,4] with empty columns, or [6,6] for 2 fields
- 4-6 fields: use [4,4,4] with 2 fields per column
- 7-9 fields: use [4,4,4] with 3 fields per column, or two rows of [4,4,4]
- 10+ fields: split into two sections

### Step 4: Order Fields Within Each Section

Follow the priority hierarchy from the design principles:
1. Identifying field (Name/Title)
2. Status/State
3. Type/Category
4. Owner/Assignee
5. Key business fields
6. Dates
7. Metadata

---

## Industry-Specific Adaptations

### Real Estate / נדל"ן
- Account → "לקוח" or "יזם"
- Sale → "נכס" or "עסקה"
- Sections: פרטי נכס, מיקום, פרטים פיננסיים, מצב תכנוני
- Special fields: Area (sqm), Rooms, Floor, Price per sqm

### Education / חינוך
- Account → "מוסד" or "סטודנט"
- Sale → "הרשמה" or "קורס"
- Sections: פרטי מוסד, פרטי מנהל, פרטי התקשרות, הכשרות/מקצועות
- Special tables: Courses, Enrollments, Exams, Attendance

### Services / שירותים
- Case → "קריאת שירות" or "הזמנה"
- Sections: פרטי הקריאה, פרטי לקוח, תיאור התקלה, פתרון
- Special fields: SLA, ResponseTime, ResolutionTime

### Non-Profit / עמותות
- Account → "תורם" or "משתתף"
- Sale → "תרומה" or "פרויקט"
- Sections: פרטי תורם, היסטוריית תרומות, קשרים

### E-Commerce / מסחר
- Sale → "הזמנה"
- Sections: פרטי הזמנה, פרטי לקוח, פריטים, משלוח, תשלום
- Special tables: OrderItems, Shipments, Payments

### Healthcare / בריאות
- Account → "מטופל"
- Case → "ביקור" or "טיפול"
- Sections: פרטי מטופל, פרטי ביטוח, היסטוריה רפואית

---

## Complete Build Example: Custom "Project" Card

Imagine a customer who manages construction projects. Their custom `Projects` table has these fields (from `Get-Schema`):

```
Name (String), Number (Number), AccountId (Pointer→Accounts), 
StatusId (Pointer→ProjectStatuses), ProjectType (Pointer→ProjectTypes),
OwnerId (Pointer→_User), StartDate (Date), EndDate (Date), 
Budget (Number), ActualCost (Number), City (Pointer→City),
Address (String), Description (String), Comment (String),
ContractorId (Pointer→Accounts), ArchitectId (Pointer→Contacts)
```

### Planned Sections:

**Section 1: פרטי פרויקט** (grid: [4,4,4])
- Col 0: Name*, Number
- Col 1: StatusId, ProjectType
- Col 2: OwnerId, AccountId

**Section 2: לוח זמנים ותקציב** (grid: [4,4,4])
- Col 0: StartDate, EndDate
- Col 1: Budget, ActualCost
- Col 2: ContractorId, ArchitectId

**Section 3: מיקום** (grid: [4,4,4])
- Col 0: City
- Col 1: Address
- Col 2: (empty)

**Section 4: תיאור** (grid: [12])
- Description (textarea)

**Section 5: הערה** (grid: [12])
- Comment (textarea)

**Related Tables:**
1. Tasks (משימות) -- Name, StatusId.Name, DueDate, OwnerId.Name
2. Files (מסמכים) -- Name, createdAt
3. Notes (הערות) -- Name, createdAt

### Build Sequence:

```
1. Create-Form-Page(tableName: "Projects", pageName: "apps/mybusiness/Project", title: "כרטיס פרויקט")
2. Get the page ID from the response
3. Get-Page-Content(pageName: "apps/mybusiness/Project", minimal: true) -- find the existing row IDs
4. Edit-Page: add-row [12] for Section 1 header
5. Add-Edit-Text-Element: H2 "פרטי פרויקט" in the header row
6. Edit-Page: add-row [4,4,4] for Section 1 fields
7. Edit-Page: add fields Name, Number, StatusId, ProjectType, OwnerId, AccountId
8. Repeat steps 4-7 for each section
9. Add-Table-View-to-Form-Page for Tasks, Files, Notes
10. Edit-Page-CSS-JS: add TicketHeadline CSS
```
