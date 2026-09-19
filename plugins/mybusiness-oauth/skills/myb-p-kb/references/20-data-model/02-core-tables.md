# Core Tables Reference

> **Purpose:** Field-level reference for the seven core entities — Accounts, Contacts, Sales, Cases, Tasks, Activities, _User — for discovery and implementation work.
> **Last updated:** 2026-06-23 (MyCollege 2026-06 rework) · **Status:** draft

**How to read this file.** Schemas are per-tenant. Each table below is split into:
- **Baseline fields** — present in the live Playground app AND (unless noted) in the demo dump → safe to assume on most tenants, but still verify.
- **Tenant-customization examples** — fields seen only in the customized demo dump → illustrate *how* customers extend the table; do **not** assume they exist elsewhere.

Every table also has the 6 system fields (`objectId:String`, `createdAt:Date`, `updatedAt:Date`, `ACL:ACL`, `createdBy:Pointer→_User`, `updatedBy:Pointer→_User`) — omitted below. See [05-field-types-and-conventions.md](05-field-types-and-conventions.md).

---

## 1. Accounts — לקוחות / לידים

**Purpose:** The business hub. Holds **both leads and customers** in one table, distinguished by `IsAccount` (false = lead ליד, true = customer לקוח). 38 business pointer fields from 36 tables reference it in the demo dump (see [01-data-model-overview.md](01-data-model-overview.md)).

### Baseline fields (live, Playground 2026-06-10)

| Field | Type | Hebrew label | Purpose / target |
|---|---|---|---|
| `Name` | String | | Display name (company or person) |
| `F_name` / `L_name` | String | | First/last name (person-style accounts) |
| `Email` | String | | Primary email |
| `PhoneNumber` | String | | Primary phone |
| `Phone` | String | | Additional phone ⚠️ UNVERIFIED whether in all tenants (live only) |
| `Website` | String | | |
| `Industry` | String | | Free-text industry |
| `NumberOfEmployees` | Number | | |
| `CompanyId` | String | | ח.פ / business registration number |
| `Address`, `City`, `State`, `Country`, `PostalCode` | String | | Address block (live `City` is String; demo dump remapped `City` to Pointer→CityList — tenant divergence) |
| `Comment` | HTML/XML | | Rich-text notes |
| `Campaign` | String | | Originating campaign (free text) |
| `Source` | String | | Lead source free text (live only) |
| `IsAccount` | Boolean | | **false = lead, true = account** — the lead/customer switch |
| `TypeId` | Pointer→`AccountTypes` | | Account type lookup |
| `StatusId` | Pointer→`AccountStatuses` | סטאטוס | Account status lookup |
| `LeadStatusId` | Pointer→`LeadStatuses` | | Lead-side status lookup |
| `OwnerId` | Pointer→`_User` | | Account owner |
| `LeadOwnerId` | Pointer→`_User` | | Lead owner (before conversion) |
| `LeadSourceId` | Pointer→`LeadSource` | | Lead source lookup |
| `BrandId` | Pointer→`Brands` | | |
| `ConversionDate` / `LeadConversionDate` | Date | | Lead→account conversion timestamps |
| `IsLost` | Boolean | | Lost-lead flag (live only) |
| `Active` | Boolean | | (live only) |
| `ExternalId` | String | | Foreign-system key for integrations |
| `ApplicationId` | String | | ⚠️ UNVERIFIED semantics (present both envs) |
| `dontSendSms` / `dontSendEmail` / `dontSendWhatsApp` | Boolean | | Channel opt-outs (only `dontSendWhatsApp` in the 2026-02 dump; all three live → newer baseline) |
| `UnsubscribeCampaign` | Pointer→`Campaigns` | | Campaign that triggered unsubscribe (live only) |
| `UnsubscribeDate` | Date | | (live only) |
| `updatedByTrigger` | String | | Trigger-loop guard, set by automations (see [04-system-tables-and-logs.md](04-system-tables-and-logs.md)) |
| `StudentPortal` | Pointer→`_User` | | Portal login user for this account (MyCollege portal pattern) |
| `StudentPortalConnected` | Boolean | | |

Playground sandbox extras (experiments, not product): `TestField123:String`, `Array_Interests:Array` (תחומי עניין), `array_languages_Pointer_Languages:Array` (שפות מדוברות — the multi-select naming convention, see [05-field-types-and-conventions.md](05-field-types-and-conventions.md)).

### Tenant-customization examples (demo dump only — 91 fields total there)

Illustrative groups of what one tenant added:

| Group | Fields (type → target) |
|---|---|
| Demographic profile | `Age:Number`, `DateBirth:Date`, `Gender:P→Gender`, `MaritalStatus:P→MaritalStatus`, `Population:P→Population`, `Lifestyle:P→Lifestyle`, `SchoolEducation:P→SchoolEducation`, `NumberChild:Number`, `HouseType:P→HouseType`, `CarType:P→CarType`, `Color:P→Colors`, `ShirtSize:P→ShirtSizes`, `EyeColor:String`, `FatherAge:Number`, `BabyWeight:Number` |
| Geography | `City:P→CityList`, `CityId:P→CityList`, `CityText:String`, `Area:P→Area`, `buiding:String` (note typo — field names are immutable once created) |
| Lead funnel extensions | `SourceLead:P→SourceLead`, `LeadSubStatuses:P→LeadSubStatuses`, `ReasonFailure`/`ReasonFailureLead:P→ReasonFailure`, `CompetitorName:String`, `DifferentReason:String`, `Recommend:String`, `fromWeb2lead:Boolean` |
| Org structure | `TypeAccount:P→TypeAccount_2`, `BranchType:P→BranchType`, `NumberOfBranches:Number`, `Ydcnj:P→_User` (garbled Hebrew field name — another immutability artifact) |
| Contact snapshot | `ContactName`/`ContactPhon`/`ContactEmail:String`, `CallPhon:String` |
| Misc vertical (tenant-added, illustrative) | e.g. `Interested:P→Products`, `ConversationId:P→Conversations`, `RegistrationDate:Date`, `SignatureName:String`, plus vertical-specific booleans and notes fields — these are per-tenant customizations, not baseline columns |

### Key pointers in (who references Accounts)

`Contacts.AccountId`, `Sales.AccountId`, `SaleRows.AccountId`, `Cases.AccountId`, `Tasks.AccountId` (+`Tasks.WhatId` in dump), `Activities.AccountId`, `Notes.AccountId`, `Files.AccountId`, `Emails.AccountId`, `SMS.AccountId`, `Conversations.AccountId`, `PriceQuotes.AccountId`, `AccountingHeaders.AccountId`, `Retainers.AccountId`, `RetainerChargeLog.AccountId`, `AccountingInvoiceBalance.AccountId`, `CampaignSentLog.AccountId`, `CallRecords.AccountId`, `_Timeline.AccountId`, `AccountRelation.AccountIdMain`/`.AccountIdConnected`, `CourseEnrollment.AccountId`, `ExamEnrollment.AccountId`, `Projects.AccountId`, `SubProjects.AccountId`, `TimeClock.AccountId`, `UserSubProjectConnection.AccountId`, `AutoChargeLogs.AccountId`, `PaymentsLog.AccountId`, `AccountTokens.AccountId`, `CaseFile.AccountId`, `ActivityAdditionalAccounts.AccountId`, more per tenant.

**Related helper table — `AccountRelation`:** links account↔account (`AccountIdMain`, `AccountIdConnected`, `Title:String`) for parent-company / branch / referral structures.

---

## 2. Contacts — אנשי קשר

**Purpose:** Persons attached to an account (B2B pattern). In B2C tenants often unused — the person lives directly on `Accounts`.

### Baseline fields (live)

| Field | Type | Hebrew label | Purpose / target |
|---|---|---|---|
| `FirstName` / `LastName` / `Name` | String | | Person name (`Name` = display/full) |
| `Email` | String | | |
| `PhoneNumber` / `CellPhone` | String | | Land/mobile |
| `Position` | String | | Job title |
| `AccountId` | Pointer→`Accounts` | | Parent account — the defining link |
| `OwnerId` | Pointer→`_User` | | |
| `Address`, `City`, `State`, `Country`, `Website` | String | | |
| `Comment` | HTML/XML | | |
| `dontSendSms`/`dontSendEmail`/`dontSendWhatsApp` | Boolean | | Channel opt-outs (newer baseline, live only) |
| `UnsubscribeCampaign` | Pointer→`Campaigns` | | (live only) |
| `UnsubscribeDate` | Date | | (live only) |

### Tenant-customization examples (dump: 30 fields)

`Area:P→Area`, `CityName:P→CityList`, `ContactType:P→ContactType`, `NumberId:String` (ת.ז), `Internal:Boolean`, `StartWorkDate`/`EndWorkDate:Date`, `ActivitC:P→AccountStatuses`, `File:PrivateFile`.

### Key pointers in

`Sales.ContactId`, `Cases.ContactId`, `Tasks.ContactId`, `Activities.ContactId`, `Notes.ContactId`, `Emails.ContactId`, `SMS.ContactId`, `Conversations.ContactId`, `Files.ContactId`, `_Timeline.ContactId` (+ dump: `Streets.ContactId`).

---

## 3. Sales — מכירות (עסקאות)

**Purpose:** Deal/opportunity. The most heavily customized table in the product — demo dump shows **133 fields / 57 pointers**; live Playground baseline is ~37 fields. Line items live in `SaleRows`.

### 3.1 Baseline fields (live), grouped

**Identity & classification**

| Field | Type | Hebrew label | Purpose / target |
|---|---|---|---|
| `Name` | String | | Deal name |
| `Title` | String | | (live only — newer baseline) |
| `Source` | String | | Free-text source |
| `Comment` | String | | |
| `AllExtraInfo` | HTML/XML | | Aggregated extra info blob rendered on the card |
| `updatedByTrigger` | String | | Trigger-loop guard |

**Pipeline**

| Field | Type | Hebrew label | Purpose / target |
|---|---|---|---|
| `SaleStatusId` | Pointer→`SaleStatuses` | | Pipeline stage; `SaleStatuses.Probability:Number` carries per-stage % |
| `Probability` | Number | | Deal-level probability |
| `ReasonForLost` | String | | |
| `IsWon` / `IsLost` | Boolean | | Outcome flags (live only — newer baseline) |
| `NextStepDate` | Date | | Follow-up date |
| `ClosingDate` | Date | | Expected/actual close |
| `CloseDate` | Date | | (live only; coexists with `ClosingDate` ⚠️ semantics per tenant) |

**Finance**

| Field | Type | Hebrew label | Purpose / target |
|---|---|---|---|
| `Total` | Number | | Final amount (after discount) |
| `TotalBeforeDiscount` | Number | | |
| `Discount` | Number | | Discount % or amount per `DiscountType` |
| `DiscountValue` | Number | | Computed discount amount |
| `DiscountType` | String | | `"%"` or absolute (observed value `"%"` in live `_Timeline.data`) |
| `Amount` | Number | | (live only — newer baseline) |

**Relations**

| Field | Type | Purpose / target |
|---|---|---|
| `AccountId` | Pointer→`Accounts` | Customer |
| `ContactId` | Pointer→`Contacts` | Person |
| `OwnerId` | Pointer→`_User` | Salesperson |
| `ActivityId` | Pointer→`Activities` | Originating meeting |
| `TaskId` | Pointer→`Tasks` | Originating task |

Playground sandbox extras (experiments): `OwnerSetDate:Date` (תאריך הגדרת אחראי — auto-timestamp pattern), `DepartmentId:P→SalesDepartments` (מחלקה), `SubDepartmentId:P→SalesSubDepartments` (תת-מחלקה), `ChannelId:P→SalesChannels` (ערוץ מכירה), `SubChannelId:P→SalesSubChannels` (תת-ערוץ) — a live parent/child dropdown pair, and `array_tags_Pointer_Tags:Array` (תגיות) — multi-select. See [05-field-types-and-conventions.md](05-field-types-and-conventions.md).

### 3.2 Tenant-customization groups (demo dump, 133 fields)

The dump shows what a mature subscription/field-service tenant did to Sales. Groups:

| Group | Fields |
|---|---|
| Contact snapshot | `PhoneNumber`, `Email`, `Address:String`, `ContactNameI`/`ContactPhonI:String` |
| Source & qualification | `SourceArrival:P→SourceLead`, `SourceA:P→SourceLead`, `SaleType:P→SaleType`, `LevelReadiness:P→LevelReadiness`, `MonetaryValue:P→MonetaryValue`, `CauseAbnormality:P→CauseAbnormality`, `ReasonFailure:P→ReasonFailure`, `TypeConsultation:P→TypeConsultation`, `TypeId`/`TypeAccoint:P→ActivityTypes`, `TypeA:P→AccountTypes` |
| Subscription lifecycle | `SubscriptionStartDate`/`SubscriptionEndDate`/`SubscriptionFreezeDate:Date`, `SubscriberStatus:P→SubscriberStatus`, `BillingPeriod:P→BillingPeriod`, `NextAnnualPayment:Date`, `CanceledRetainer:Boolean`, `FirstSale:Boolean` |
| Payments | `PaymentStatus:P→PaymentStatus`, `AgreementApproved:Boolean`, `DetailsNonPayment:String` |
| Installation vertical | `Installation`/`Installation2:Boolean`, `ListOfInstallers:P→ListOfInstallers`, `InstallersPhon:String`, `InstallersDate`/`InstallersDateEnd`/`DateInstallers:Date`, `InstallersStatus:P→InstallersStatus`, `InstallersNote:String`, `InstallationAmount:P→YesOrNo`, `DetailAmount:String`, `Technician:P→Technician`, `DetailFix:String` |
| Delivery vertical | `NeedDelivery`/`NoNeedDelivery:Boolean`, `DeliveryAddress:String`, `DeliveryCity:P→CityList`, `ContactPersonDelivery`/`PhonPersonDelivery`/`DeliveryEmail:String`, `DateDelivery:Date`, `FromHohrDelivery`/`HohrDelivery:String` (time window), `Floor`/`Entrance:String`, `ShippingStatus:P→CaseStatuses`, `TypeOfDelivery:P→TypeOfDelivery`, `ShippingNumber:String`, `NoteDelivery:String`, `CollectionBranch`/`CollectionConfirmation:Boolean`, `CollectionDate:Date`, `SendingDetails:Boolean` |
| Satisfaction questionnaire | `QuestionnaireStatus:P→QuestionnaireStatus`, `ServiceQuestion`/`ServiceAttitudeQuestion`/`SatisfiedPayment:P→Rating`, `RecommendationQ`/`Late`/`LateI:P→YesOrNo`, `NoteI:String`, `MessagesToCustomer:P→MessagesToCustomer` |
| **Per-status timestamp pairs** (the status-timestamp pattern: a `Date` + a `Pointer→_User` per pipeline stage, filled by triggers) | `IncorrectStatusUpdate`+`IncorrectStatusUpdateName`, `FailedUpdateStatus`+`FailedUpdateStatusName`, `StatusUpdateCompleted`+`StatusUpdateCompletedName`, `QuotationStatusUpdate`+`QuotationStatusUpdateName`, `NegotiationStatusUpdate`+`NegotiationStatusUpdateName`, `IntroductoryCallStatusUpdate`+`IntroductoryCallStatusUpdateName`, `StatusUpdatePresentation`+`StatusUpdatePresentationName` |
| Demographics (B2C) | `Gender:P→Gender`, `Age:Number`, `DateBirth:Date`, `WorkStatus:P→WorkStatus`, `JobType:P→JobType`, `Shabbat:P→YesOrNo`, `HouseType:P→HouseType`, `CarType:P→CarType`, `Color:P→Colors`, `Carnumber:String`, `Area:P→Area` |
| MyCollege link | `CourseId:P→Courses`, `CourseCategoryId:P→CourseCategoryList`, `TrainingDate:Date` |
| Misc | `Branches:P→Branches`, `PeriodicTreatmentType:P→PeriodicTreatmentType`, `ConversationId:P→Conversations`, `Message`/`Note`/`Notes:String`, `NoteC:Boolean`, `Confirmation18:Boolean`, `Datey`/`Ad:Date` |

### 3.3 SaleRows — שורות מכירה (line items)

| Field | Type | Purpose / target |
|---|---|---|
| `SaleId` | Pointer→`Sales` | Parent deal |
| `ProductId` | Pointer→`Products` | |
| `Description` | String | Line description |
| `Quantity` / `PricePerUnit` / `Discount` / `Total` | Number | Line math |
| `AccountId` | Pointer→`Accounts` | Denormalized customer |
| `ConversationId` | Pointer→`Conversations` | Chat-commerce link |

### Key pointers in (Sales)

`SaleRows.SaleId`, `Cases.SaleId`, `Tasks.SaleId`, `Activities.SaleId`, `Notes.SaleId`, `Emails.SaleId`, `SMS.SaleId`, `Conversations.SaleId`, `PriceQuotes.SaleId`, `CourseEnrollment.SaleId`, `_Timeline.SaleId`.

---

## 4. Cases — פניות (קריאות שירות)

**Purpose:** Service tickets. Has an `AutoIncrement` human-readable number and the richest status model (status → state) plus SLA hooks.

### Baseline fields (live)

| Field | Type | Hebrew label | Purpose / target |
|---|---|---|---|
| `Name` | String | | Subject |
| `Title` / `Subject` | String | | (live only — newer baseline aliases) |
| `Description` | String | | Body |
| `Comment` | String | | |
| `Number` | AutoIncrement | | Ticket number (live). Dump instead has `Number:Number` + `CaseNum:AutoIncrement` + `CaseNum_Auto:AutoIncrement` — per-tenant numbering drift; verify which field the UI shows |
| `Date` | Date | | Opened date (business) |
| `StatusId` | Pointer→`CaseStatuses` | | Status; `CaseStatuses.StateId→CaseStates` gives open/closed semantics |
| `StateId` | Pointer→`CaseStates` | | Direct state pointer (live only — newer baseline) |
| `PriorityId` | Pointer→`CasePriorities` | | `CasePriorities` has `Color:String` |
| `CaseTypeId` | Pointer→`CaseTypes` | | Type |
| `SubTypeId` | Pointer→`CaseSubTypes` | | Subtype; `CaseSubTypes.TypeId→CaseTypes` makes it a parent/child pair |
| `AccountId` / `ContactId` | Pointer | | Customer/person |
| `OwnerId` | Pointer→`_User` | | Assignee |
| `CurrentUserId` | Pointer→`_User` | | Current handler (distinct from owner) |
| `SaleId` / `TaskId` / `ActivityId` | Pointer | | Cross-links (live; dump has SaleId/TaskId) |
| `Email` / `PhoneNumber` | String | | Requester contact snapshot (web2case forms) |
| `CaseStatusId` / `CasePriorityId` | Pointer | | (live only) duplicates of StatusId/PriorityId ⚠️ UNVERIFIED why both exist |
| `IsClosed` | Boolean | | (live only) |
| `Priority` | String | | Legacy free-text priority (live + dump Tasks-style) |
| `updatedByTrigger` | String | | Trigger-loop guard |

### SLA-related fields

- Demo dump (`a production schema export`, post-Feb additions): `ExpectedClosingDate:Date`, `TimeLeftForClosingDays/Hours/Minutes:Number`, `RequestIsOpenedPeriod:String`, `ClosingDate:Date`, `WorkingTime:String`, plus `Date1:Date`, `EndDate:Date`, `EndCaseUser:P→_User`.
- Playground (SLA-skill build): `SLADeadline:Date` (דד-ליין SLA), `ResponseTime:Date` (זמן מענה ראשוני), `ResolutionTime:Date` (זמן פתרון), `IsEscalated:Boolean` (אסקלציה), `EscalationLevel:Number`, `EscalatedTo:P→_User`, `FollowUpRequired:Boolean`, `FollowUpDate:Date`, `CustomerSatisfaction:Number`, plus vertical fields (`Channel`, `ServiceType`, `IsVIP`, `EquipmentModel`, `EquipmentSerial`, `PlanType`, `Resolution`, `RootCause`, `FaultArea`, `TechnicianNotes`, `ConnectionSpeed`, `EstimatedResolution`).
- Supporting tables: `SLASettings` (per type/subtype/status hour-day budgets), `CaseSLAProcess`/`CasesSlaProcess` (per-status tracking rows), `BusinessHours`, `SlaConfig` — detailed in [04-system-tables-and-logs.md](04-system-tables-and-logs.md).

### Tenant-customization examples (dump)

`AppealSource:P→AppealSource` (מקור פנייה), `ProductId:P→Products`, `JiraNumber:String`, `Technician:P→Technician`, `Is:Boolean`.

### Key pointers in

`Tasks.CaseId`, `Activities.CaseId`, `Notes.CaseId`, `Emails.CaseId`, `SMS.CaseId`, `Conversations.CaseId`, `CaseFile.CaseId`, `SatisfactionSurveys.CaseId`, `_Timeline.CaseId`, `CaseSLAProcess.CaseId`.

**Helper:** `CaseFile` (files per case: `Name`, `CaseId`, `AccountId`, `File:PrivateFile`).

---

## 5. Tasks — משימות

**Purpose:** To-dos with reminder, status, priority, type; attachable to any core entity.

### Baseline fields (live)

| Field | Type | Purpose / target |
|---|---|---|
| `Name` | String | Title |
| `Description` | String | |
| `Date` | Date | Due date (the live baseline due field) |
| `ReminderDateTime` | Date | Absolute reminder |
| `ReminderTime` | String | Reminder offset/time-of-day as text |
| `Priority` | String | Legacy free-text priority |
| `PriorityId` | Pointer→`TaskPriorities` | Lookup priority |
| `StatusId` | Pointer→`TaskStatuses` | |
| `TypeId` | Pointer→`TaskTypes` | |
| `OwnerId` | Pointer→`_User` | Assignee |
| `AccountId` / `ContactId` / `SaleId` / `CaseId` / `ActivityId` | Pointer | Context links |
| `updatedByTrigger` | String | Trigger-loop guard |

### Tenant-customization examples (dump: 51 fields)

`DueDate:Date` + `Subject:String` (alternate naming), `WhatId:P→Accounts` (Salesforce-style generic link), `Technician:P→Technician`, field-service QA block (`ProductTest`, `ProductCollected:Boolean`, `DateCollected:Date`, `ProductIntegrity:Boolean` + `Product_Integrity:P→YesOrNo`, `SpecifyReason:Boolean`, `Reason:String`, `ManagerAcceptence:Boolean` + `Manager_Acceptence:P→YesOrNo`, `Manager_Name:P→_User`, `TaskAanswers:P→TaskAanswers`, `ExceptionDetail:String`, `TimeQ:Boolean`, `SmsMessageCustomer:Boolean`), contact snapshot (`Phon`, `Email`, `CallPhon:String`), `Interested`/`YesOrNo` pointers, `Number:String`, `Color:String`, `DateE:Date`, `NameC:P→_User`, `Documentation:String`, `AmendmentDocument:PrivateFile`.

### Key pointers in

`Sales.TaskId`, `Cases.TaskId`, `Activities.TaskId`, `Notes.TaskId`, `Emails.TaskId`, `SMS.TaskId`, `Conversations.TaskId`, `_Timeline.TaskId`.

---

## 6. Activities — פעילויות (פגישות/אירועי יומן)

**Purpose:** Calendar events / meetings, with multi-user participation and (in MyCollege tenants) lesson scheduling.

### Baseline fields (live)

| Field | Type | Purpose / target |
|---|---|---|
| `Name` | String | Title |
| `StartTime` / `EndTime` | Date | Event window |
| `Location` | String | |
| `StatusId` | Pointer→`ActivityStatuses` | |
| `Status` | Pointer→`ActivityStatuses` | Duplicate status pointer (both envs) ⚠️ check which the tenant's UI uses |
| `TypeId` | Pointer→`ActivityTypes` | |
| `OwnerId` | Pointer→`_User` | Organizer |
| `Users` | Array | Participant user ids (multi-user calendar) |
| `UserNames` | Array | Denormalized participant names |
| `ReminderDateTime` / `ReminderTime` | Date / String | Reminder |
| `AccountId` / `ContactId` / `SaleId` / `CaseId` / `TaskId` | Pointer | Context links |
| `DayOfWeek` | String | **[legacy MyCollege]** recurring-lesson day — moved to the dedicated `Lessons` table in the 2026-06 rework |
| `CourseId` / `ClassId` / `FacilityId` / `LecturerId` | Pointer→`Courses`/`Classes`/`Facilities`/`Lecturers` | **[legacy MyCollege]** lesson scheduling — the reworked module uses a dedicated `Lessons` table (these are absent from `Activities` on reworked installs); see [../10-modules/05-mycollege.md](../10-modules/05-mycollege.md) |
| `LessonCount` | Number | **[legacy MyCollege]** — now on `Lessons` |

### Tenant-customization examples (dump: 42 fields)

Meeting-summary block: `DateA:Date`, `Summary:String`, `ReasonsRejection:P→ReasonsRejection`, `OtherReasons:String`, `ResponsibleFurtherOperations:P→_User`, `FollowupActions:String`, `FollowActions:Boolean`, `NerDate:Date`, `MeetingLocation:P→MeetingLocation`, `Sms_Email:Boolean`, `NameOwner:P→_User`, `UID:String`, `Cost:Number`.

**Helper:** `ActivityAdditionalAccounts` — attendance rows per activity (`ActivityId`, `AccountId`, `Presence:Boolean`, `Grade:Number`, `Remark:String`) — **[legacy MyCollege]** group-lesson attendance; the 2026-06 rework moved attendance to a dedicated `LessonAttendance` table (→`Lessons`, →`Accounts`). Still used for non-college multi-account activities.

### Key pointers in

`Sales.ActivityId`, `Tasks.ActivityId`, `Cases.ActivityId` (live), `Notes.ActivityId`, `Emails.ActivityId`, `SMS.ActivityId`, `ActivityAdditionalAccounts.ActivityId`, `_Timeline.ActivityId`.

---

## 7. _User — משתמשים

**Purpose:** Parse built-in auth class, extended by MyBusiness. CRM operators, portal users, and the `Master` pseudo-user (server-side actions) all live here. Receives more pointers than any table: 51 business + 392 `createdBy`/`updatedBy` edges in the dump.

### Fields (identical live and dump — 20 fields)

| Field | Type | Purpose |
|---|---|---|
| `username` | String | Login (usually = email) |
| `password` | String | Write-only; never returned by queries |
| `email` | String | |
| `emailVerified` | Boolean | |
| `authData` | Object | OAuth provider data |
| `name` | String | Display name |
| `profile_image` | File | Avatar (public File) |
| `last_success_login` | Date | Last successful login |
| `language` | String | UI language |
| `status` | Pointer→`UserStatuses` | Presence/status (`UserStatuses`: `name`, `icon`, `color`, `state:Boolean`) |
| `active` | Boolean | Account enabled — the offboarding switch |
| `job` | String | Job title |
| `phone` | String | |
| `extension` | String | PBX extension |

Notes:
- Password policy (enforced on create/update): **min 8 chars, ≥1 lowercase, ≥1 uppercase, ≥1 digit** (source: project `CLAUDE.md` rule 10; ⚠️ UNVERIFIED against server code).
- Roles/packages are not fields here — membership lives in `_Role` (Parse `Relation`) and package assignment via platform tooling (`Get-Packages`, `Set-Package-for-User`). See [04-system-tables-and-logs.md](04-system-tables-and-logs.md) §_Role.
- CLP on `_User` (demo): `find`/`get`/`update` require authentication; `create`/`delete` master-key only (`a production schema export`).
- Companion per-user tables: `UserParameters` (`UserId`, `ParamName`, `ParamValue:HTML/XML` — saved UI preferences), `UsersAssignments` (round-robin assignment pools: `Name`, `Users:Array`, `ActiveStatuses:Array`, `LastAssignmentUserId:P→_User` — referenced by `Channels.UsersAssignmentId`).

### Typical pointers in (selection)

`OwnerId` on every work-item table; `Accounts.LeadOwnerId`, `Cases.CurrentUserId`/`EndCaseUser`, `Sales.*StatusUpdateName` timestamp pairs, `Emails.UserId`, `Campaigns.OwnerId`, `Conversations.OwnerId`, `Channels.DefaultOwnerId`, `TimeSheet.UserId`, `MinutesForSalary.UserId`, `SMTP.User`, `_Timeline.user`/`OwnerId`/`SaleOwner`, `_Session.user`, `_RequestLog.user`.

---

## Limitations & gotchas

- **Baseline vs customization is inferred from two environments only** (Playground sandbox + demo dump). A field marked "live only" may be newer product baseline or Playground drift; fields marked "dump only" are almost certainly tenant customizations, but a few may be older baseline fields that were later removed. Always `Get-Schema` the actual tenant. ⚠️
- **Duplicate-purpose fields are common and dangerous**: `ClosingDate` vs `CloseDate` (Sales), `StatusId` vs `CaseStatusId` (Cases), `Status` vs `StatusId` (Activities), `Number` vs `CaseNum` vs `CaseNum_Auto` (Cases), `City:String` vs `CityId:Pointer`. The page (form) decides which field is actually used — inspect with `Get-Page-Content`/`Get-Optional-Fields` before writing data.
- **Field names are immutable once created** (Parse type lock-in + stored data) — hence typo fields like `buiding`, `TypeAccoint`, `Phon`, `TaskAanswers`, `EletctricGraduate` survive forever. Renaming = new field + data migration.
- `Accounts.City` is `String` in the live baseline but `Pointer→CityList` in the demo dump — same field name, **different type per tenant**. Type-sensitive integrations must check the schema, not this doc.
- Lead and account live in one table; counting "customers" requires `IsAccount=true` filters everywhere, and lead-conversion resets which status field (`LeadStatusId` vs `StatusId`) is meaningful.
- `password` is returned as a bcrypt-hash-bearing field only via master key direct DB access; treat `_User` queries as requiring authentication and avoid selecting `password`/`authData`.
