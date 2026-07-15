# Module Tables Reference

> **Purpose:** Compact per-domain reference for the non-core tables — MyBooks billing, products & price quotes, MyCampaigns, MyChat, MyInbox/email, SMS, MyCollege, TimeSheet/Projects, and vertical add-ons — key fields and relations for fit-gap work.
> **Last updated:** 2026-06-23 (MyCollege 2026-06 rework) · **Status:** draft

Format: `field:Type→Target` (P = Pointer). System fields (`objectId`, `createdAt`, `updatedAt`, `ACL`, `createdBy`, `updatedBy`) omitted — every table has them. Hebrew terms from `terminology.md` of the `the support reference` skill.

---

## 1. Products & price quotes (shared by CRM + MyBooks)

### Products — מוצרים
Catalog items for sale rows, invoice lines, payment buttons, and MyCollege courses. Key fields:
`Name`, `Price:Number`, `OriginalPrice:Number`, `CatalogNumber:String`, `Active:Boolean`, `NotPhysical:Boolean`, `Inventory:Number`, `Category:P→ProductCategories`, `PriceType:P→PriceType`, `Variant:String`, e-commerce/SEO block (`PageName`, `PageTitle`, `PageKeyWords`, `PageDescription`, `PageMetaTags:HTML`, `ShortDescription`, `ProductDescription:HTML`, `ExtraInfo:HTML`, `PreviewImage`/`Image1`/`Image2:File`).
Referenced by: `SaleRows.ProductId`, `Cases.ProductId`, `AccountingInvoiceLines(.Draft).ProductId`, `RetainerRows.ProductId`, `PaymentBtnsRows.ProductId`, `InventoryLog.ProductId`, `Courses.ProductId`, `Accounts.Interested`, `Tasks.Interested`.
Demo customizations: price-change audit (`ProductPriceChange:Boolean`, `ChangeDate:Date`, `FirstPrice:Number`, `ManagerApprovesChange:P→_User`), course fields (`CourseStartDate`/`CourseEndDate:Date`, `Lecturers:P→Lecturers`, `Area`, `City`, `Address`), `DateCessationActivity:Date`, `ReasonCessationActivity:String`.

### InventoryLog — יומן מלאי
Stock movements: `ProductId:P→Products`, `ActionDate:Date`, `ActionType:String`, `ActionAmount`, `AmountBeforeAction`, `AmountAfterAction:Number`, `ActionNotes:String`.

### PriceQuotes — הצעות מחיר
Quote + e-signature flow: `Number:Number`, `AccountId:P→Accounts`, `SaleId:P→Sales`, `StatusId:P→PriceQuoteStatuses`, `TemplateId:P→PDFTemplate`, `Content:HTML` (rendered quote), signature block (`SignedAt:Date`, `SignedByName`, `SignedByEmail:String`, `SignedPdf:PrivateFile`, `Signature:PrivateFile`).
Signing happens on the public page `apps/mybusiness/PriceQuoteSign?oid=<objectId>`.

### PDFTemplate / PDFTemplateTypes
Quote/document HTML templates: `Name`, `HTML:HTML/XML`, `TypeId:P→PDFTemplateTypes`. Referenced by `PriceQuotes.TemplateId` and `AccountingHeaders.TemplateId`. Templates embed `{{Table.Field}}` placeholders and `<input name="Table.Field">` write-back fields — see [05-field-types-and-conventions.md](05-field-types-and-conventions.md) §9 for the binding convention and a known MCP-created-template gotcha.

---

## 2. MyBooks — billing & accounting (apps/mybooks/)

Document model: **Draft headers/lines → finalized headers/lines + balance tracking**. A "document" (invoice חשבונית מס, receipt קבלה, invoice-receipt חשבונית מס קבלה, credit חשבונית זיכוי, delivery note תעודת משלוח, work order הזמנת עבודה) is one `AccountingHeaders` row + child line rows.

| Table | Key fields | Relations |
|---|---|---|
| `AccountingSettings` | Company profile: `Name`/`NameHeb`, address block (+Heb variants), `CompanyId:Number` (ח.פ), `LogoHeb`/`LogoEn`/`Signature:File`, `VAT:Number`, `Currency:P→Currencies`, `Type:P→CompanyType`, doc-mail SMTP block (`SmtpServer`, `SmptPort`, `UserName`, `Password`, `SenderName`, `SenderEmail`, `Ssl`), `InventorySettings:Object`, `InventoryMin:Number`, `RoundTotal`-style flags, `MultiTerminals:Boolean` | Singleton settings row |
| `AccountingDocsType` | Document types: `Name`/`NameEn`, `Header`/`HeaderHeb`, `Notes`/`NotesHeb`, **`NumLast:Number`** (per-type running number) | ← `AccountingHeaders.DocTypeId`, `Retainers.DocTypeId` |
| `AccountingHeadersDraft` | Editable doc before issuing: customer snapshot (`Name`, `Address`, `City`, `CompanyId`, `Email`…), totals (`TotalBeforeDiscount`, `Discount`, `DiscountType`, `DiscountValue`, `TotalAfterDiscount`, `VatPercent`, `VatValue`, `TotalSum`, `TotalToPay`, `TotalPayed`), `DocTypeId`, `AccountId`, `Language`, `IsDocumentInProcess:Boolean` | ← `AccountingInvoiceLinesDraft.HeaderDraftId`, `AccountingReceiptLinesDraft.HeaderDraftId` |
| `AccountingHeaders` | Final immutable doc: same totals + `DocumentNumber:Number`, `DocumentDate:Date`, `File:PrivateFile` (the PDF), `TemplateId:P→PDFTemplate`, `InvoiceDueDate:Date`, `NoVat`, cancellation/allocation fields (`IsCancellation`, `OriginalInvoiceId`, `confirmation_number`, `TaxId`, `Approve`, `State`, `JobId` — Israeli tax-authority allocation numbers ⚠️ UNVERIFIED detail) | ← `AccountingInvoiceLines.HeaderId`, `AccountingReceiptLines.HeaderId`, `AccountingInvoiceBalance.InvoiceId`, `RetainerChargeLog.DocumentId`, `AutoChargeLogs.InvoiceId` |
| `AccountingInvoiceLines` (+`Draft`) | `HeaderId`, `ProductId`, `ProductDescription`, `Quantity`, `Price`, `RowTotal`, `CurrencyId:P→Currencies`, `CurrencyRate`, `ForeginRowTotal` | line items of invoice-type docs |
| `AccountingReceiptLines` (+`Draft`) | Payment rows: `PaymentRowType:P→PaymentType` (מזומן/צ'ק/אשראי/העברה/PayPal), `PaymentSum`, `PaymentTotalSum`, `PaymentCurrency:P→Currencies`+`Rate`, `PaymentDate`, cheque block (`Bank:P→Banks`, `BankBranch`, `AccountNumber`, `ChequeNumber`, `IsChequeOpen`), credit-card block (`CreditCardType:P→CreditCardTypes`, `CreaditCardNumber` (sic), `CreditCardExpirationDate`, `CreditCardPaymentType`, `NumberOfPayments`, `ApprovalCode`, `ClearingBool`, `DebitApproveNumber`), PayPal block | payment rows of receipt-type docs |
| `AccountingInvoiceBalance` | Open-invoice tracking: `InvoiceId:P→AccountingHeaders`, `InvoiceNumber`, `AccountId`, `TotalSum`, `Balance:Number`, `IsClosed:Boolean`, `ClosedAt:Date`, `ClosedBy:P→_User`, `DueDate` | ← `AccountingInvoiceBalanceRows` (`InvoiceId`, `RecieptId` (sic), `CreditInvoiceId` → all P→AccountingHeaders, `Sum:Number`) — receipt-to-invoice allocation |
| `ArchiveAccountingDocuments` | `Customer:String` — archive stub | |
| `Currencies` | `Name`, `NameEnglish`, `NameHebrew` | ← 7 tables |
| `Banks` | `BankId:String`, `Name`, `Color` | |
| `CompanyType` | `Name` (עוסק מורשה/חברה בע"מ…) | ← `AccountingSettings.Type` |

### Recurring billing (retainers/subscriptions — ריטיינרים/הוראות קבע)

| Table | Key fields | Relations |
|---|---|---|
| `Retainers` | `AccountId`, `RetainerPlanId:P→RetainerPlans`, `Active:Boolean`, schedule (`FirstChargeDate`, `NextChargeDate`, `LastChargeDate:Date`, `RetainerPeriod:Number` (months), `ChargesLimit`, `ChargesCount:Number`), money (`TotalSum`, `TotalBeforeDiscount`, `TotalAfterDiscount`, `Discount`, `DiscountType`, `DiscountValue`, `VatPercent`, `VatValue`, `NoVat`, `PaymentCurrency:P→Currencies`+Rate, `IsPrecise:Boolean`), payment method (`AccountTokenId:P→AccountTokens`, `PaymentRowType:P→PaymentType`, `CreditCardFourNumbers`), doc config (`DocTypeId:P→AccountingDocsType`, `DocumentDetails`, `PaymentDescription`, `Email`), state (`LastChargeStatus:String`, `InProcess:Date`, `ExternalId`, `InternalComment`) | ← `RetainerRows.RetainerId`, `RetainerChargeLog.RetainerId` |
| `RetainerRows` | `RetainerId`, `ProductId`, `ProductDescription`, `Quantity`, `Price`, `RowTotal`, `PlanId:P→RetainerPlans`, `CurrencyId`+`CurrencyRate` | line items |
| `RetainerPlans` | `Name`, `TotalBeforeDiscount` | plan presets |
| `RetainerChargeLog` | Per-charge audit: `RetainerId`, `AccountId`, `ChargeDate`, `TotalSum`, `ChargeStatus:String`, `ChargeError:Object`, `DocumentError:Object`, `ChargeLogId:P→PaymentsLog`, `DocumentId:P→AccountingHeaders`, `DocTypeId`, `DocumentNumber` | charge results incl. failures |

### Online payment & clearing

| Table | Key fields |
|---|---|
| `PaymentsLog` | Gateway transactions: `Data:Object`, `Method`, `Total:String`, `Currency`, `Type`, `TransactionType`, `Status`, `StatusCode`, `Message`, `Error:Object`, `TerminalNumber`, `PaymentsNumber:Number`, `User:P→_User`, `AccountId`, `documentDraftHeaderId:String` |
| `AccountTokens` | Stored card tokens: `Token`, `CCExp`, `VisibleCreditCardNumber`, `Provider:String`, `AccountId:P→Accounts`. CLP locked to roles `Admin` + `MyBooks Admin` |
| `CreditClearingTerminal` | `Name`, `Terminal:String`, `Default:Boolean` — clearing terminals (multi-terminal support) |
| `PaymentBtns` | Hosted payment-page buttons: `Name`, `Title`, `TopParagraph`, `Footer`, `Link:String`, images, `VatPercent`, `NoVat`, `RoundTotal`, `Active`, `OrdersCount:Number`, `RetainerPeriod:Number` (button can start a subscription) ← `PaymentBtnsRows` (`PaymentBtnId`, `ProductId`, `Price`, `MinQuantity`, `MaxQuantity`) |
| `AutoChargeRules` / `AutoChargeLogs` | Scheduled auto-billing: rules (`Name`, `Active`, `Type`, `TimeGap:Number`, `TimeField:String`, `Title`, `SiteUrl`, `Content:HTML`) and per-run logs (`RuleId`, `AccountId`, `InvoiceId:P→AccountingHeaders`, `Balance:Number`, `Error`, `Data:String`) |
| `Expenses` | `Total:Number`, `Date:Date`, `Comment`, `Distance:Number`, `SubProjectId:P→SubProjects` — expense rows (TimeSheet-linked) |

---

## 3. MyCampaigns — קמפיינים (apps/mycampaigns/)

| Table | Key fields | Relations |
|---|---|---|
| `Campaigns` | `Name`, `Type:String` (email/SMS/WhatsApp), `OwnerId:P→_User`, `DeliveryTime:Date`, audience (`Groups:Object`, `IncludeGroups:Array`, `ExcludeGroups:Array`, `NumOfRecipients:Number`), email (`EmailSubject`, `EmailContent:HTML`, `EmailSender:HTML`), SMS (`SMSSender`, `SMSContent:HTML`), WhatsApp (`WASender`, `WATemplate:String`, `WATemplateParams:Object`), state (`CampaignStatus:P→CampaignStatuses`, `CampaignSentStatus:P→CampaignSentStatuses`) | ← `CampaignSentLog.CampaignId`, `_syslogCampaignWA.CampaignId`, `Accounts.UnsubscribeCampaign` |
| `CampaignSentLog` | Per-recipient engagement: `CampaignId`, `AccountId`, `Type`, `Destination:String`, `Status:String`, event flags+timestamps (`delivered`/`deliveredAt`, `opened`/`openedAt`, `clicked`/`clickedAt`, `failed`/`failedAt`, `unsubscribed`), `data:Object`, `Error:String` | the engagement-analytics source |
| `CampaignStatuses` / `CampaignSentStatuses` | `Name` | lifecycle lookups |
| `Groups` | Saved audience segments: `Name`, `RelatedClass:String` (e.g. Accounts), `Conditions:Array` (condition objects — format in [05](05-field-types-and-conventions.md) §7). CLP: roles `Admin`, `Campaign Manager` | used by `Campaigns.IncludeGroups`/`ExcludeGroups` |
| `LandingPages` | `PageId`, `WebsitePageName`, `OriginalPageId`, `OriginalName:String` — landing-page registry pointing at Simbla site pages | |
| `_syslogCampaignEmails` / `_syslogCampaignSMS` | system-fields-only batch stubs (6 fields) | batch send logs |
| `_syslogCampaignWA` | `CampaignId`, `User:P→_User`, `Phones:Array`, `TotalPhones:Number` | WhatsApp batch log |

---

## 4. MyChat — multi-channel conversations (apps/mychat/)

| Table | Key fields | Relations |
|---|---|---|
| `Channels` — ערוצים | `Name`, **`Identity:String`** (the channel's phone/identity — use this, not objectId, when sending WhatsApp), `Key:String`, `TypeId:P→ChannelTypes` (WhatsApp/FB/web…), `WaBaId:String` (WhatsApp Business Account), `MetaBusinessPortfolioId:P→MetaBusinessPortfolio`, `DefaultResponse:HTML`, `HasChatBots:Boolean`, routing (`DefaultOwnerId:P→_User`, `DefaultRole:String`, `UsersAssignmentId:P→UsersAssignments` round-robin pool) | ← `Conversations.ChannelId`, `ChatBots.ChannelId` |
| `ChannelTypes` | `Name` | |
| `MetaBusinessPortfolio` | `Name`, `waba_id:String` — Meta business portfolio registry | |
| `Conversations` — שיחות | `Number:AutoIncrement`, `Title`, `Identity:String` (customer's channel identity, e.g. phone), `ContactName:String`, `ChannelId`, `ChannelTypeId`, context (`AccountId`, `ContactId`, `SaleId`, `CaseId`, `TaskId`), state (`StatusId:P→ConversationStatuses`, `StateId:P→ConversationStates`, `ClosedAt:Date`, `Pinned:Boolean`), inbox UX (`LastMessageAt:Date`, `UnreadCount:Number`, `HasMedia:Boolean`, `Department:String`), bots (`ChatBotId`/`UsedChatBotId:P→ChatBots`, `ChatBotStepId:String`), `OwnerId:P→_User` | ← `ConversationMessages.ConversationId`, `AIConversations.ConversationId`, `ChatBotLogs.ConversationId`, `Emails.ConversationId`, `Files.ConversationId`, `Sales.ConversationId`, `SaleRows.ConversationId`, `Accounts.ConversationId` |
| `ConversationMessages` | `ConversationId`, `UserId:P→_User` (sender if outbound), `Direction:String`, `Message:HTML`, `File:PrivateFile`, `Data:Object` (raw provider payload), delivery state (`failed:Boolean`, `failedAt:Date`, `errors:Array`, `IsErrorRead:Boolean`) | the message bodies |
| `ConversationStatuses` / `ConversationStates` | `Name`; statuses carry `StateId:P→ConversationStates` (open/closed semantics) | |
| `ChatBots` | Flow-builder bots: `Name`, `Active`, `ChannelId`, graph (`Nodes:Array`, `Edges:Array`, `Conditions:Array`), `DefaultMessages:Object`, `ExecutionCount:Number` | ← `ChatBotLogs.ChatBotId` |
| `ChatBotLogs` | `ConversationId`, `ChatBotId`, `Logs:Array`, `Data:Object`, `AIQueryCount:Number` | bot run traces |
| `KnowledgeSources` / `KnowledgeSourceTypes` / `KnowledgeSourceFiles` | AI-bot knowledge base: source (`Name`, `Type:P→Types`, `Url`, `Status`, `Active`), files (`KnowledgeSourceId`, `File:PrivateFile`, `Name`, `Status`) | feeds AI answers |
| `AIConversations` | `ConversationId`, `system:Array`, `messages:Array` — LLM message history per conversation | |
| `QuickResponses` | Canned replies (live Playground; ⚠️ UNVERIFIED fields — not in dump) | |
| `BusinessHours` | `Name` (שם לוח הזמנים), `WeeklyHours:Array` (חלון שבועי), `SpecialDates:Array`, `ConsiderIsraeliHolidays:Boolean` — service window used by chat auto-reply and SLA computations | |
| `MessagesToCustomer` | `Name` — lookup of predefined customer messages (demo) | ← `Sales.MessagesToCustomer` |
| `CallRecords` | Telephony CDR: `time:Date`, `caller`, `type`, `status`, `representative_name:String`, `duration:Number`, `record:String` (recording URL), `AccountId:P→Accounts` | populated by PBX integration |

---

## 5. Email & MyInbox (apps/myinbox/)

| Table | Key fields | Relations |
|---|---|---|
| `SMTP` | Per-user/shared mail accounts: `User:P→_User`, `ServerUser`, `Password`, `hash_Password`, SMTP (`Server`, `Port:String`, `SSL`), IMAP (`ImapServer`, `ImapPort:Number`, `ImapSSL`, `SyncFolders`, `SyncSeen`, `SyncGoogleTrash`), OAuth flags (`UseGoogleAuth`, `UseMSXAuth`), identity (`SenderName`, `SenderEmail`, `Signature:HTML`), `IsDefault`, `IsShared:Boolean`, sync cursors (`uidvalidity`, `lastUid`, `sentLastUid`, `ErrorCount:Number`). **Holds credentials — excluded from schema dumps; CLP requires authentication** | ← `Emails.SMTPId`, `InboxFolders.SmtpId`, `EmailsToPull.SMTPId`, `EmailsSaved.SMTPId` |
| `Emails` | Sent + synced mail: addressing (`MailFrom`, `MailTo`, `CC`, `BCC`, `SentToName`), content (`Subject`, `Body:HTML`, `Text:String`, `HasAttachments:Boolean`), send state (`SendAt:Date`, `SendStatus:String`, `ErrorMessage`), threading (`MessageId`, `InReplyTo:String`, `References:Array`, `UID:Number`, `xgmmsgid:String`), inbox state (`UnRead:Boolean`, `Box:String`, `FolderId:P→InboxFolders`, `DeletedAt:Date`), context pointers (`AccountId`, `ContactId`, `SaleId`, `CaseId`, `TaskId`, `ActivityId`, `ConversationId`, `UserId:P→_User`, `SMTPId:P→SMTP`, `GeneralLogId:P→_GeneralLogs`), `SearchField:String` (concatenated search index) | ← `Files.EmailId` (attachments), `_Timeline.EmailId` |
| `EmailTemplate` | `Name`, `HTML:HTML`, `UserId:P→_User`, `Date:String` | merge templates |
| `InboxFolders` | `Name`, `SmtpId:P→SMTP`, `uidvalidity:Number`, `lastUid:Number` | IMAP folder map |
| `EmailsToPull` / `EmailsSaved` | sync queues: (`Emails:Array`, `SMTPId`) / (`SMTPId`, `EmailNumber:Number`) | |
| `OAuthTokens` | `access_token`, `access_token_expiration:Date`, `refresh_token`, `refresh_token_expiration:Date` — Google/MS mail OAuth. CLP: `Admin`/`MyBooks Admin` | |
| `Office365Subscription` | `access_token`, `access_token_expire:Date` — MS Graph webhook subscription | |

### SMS

| Table | Key fields |
|---|---|
| `SMS` | Outbound messages with context: `From`, `To`, `Content:String`, `Status:String`, `TemplateId:P→SmsTemplates`, pointers `AccountId`/`ContactId`/`SaleId`/`CaseId`/`TaskId`/`ActivityId` |
| `SmsTemplates` | `Name`, `Template:HTML` |
| `_syslogSMS` | Provider-level log: `Uuid`, `State`, `ToNumber`, `FromNumber`, `Message`, `Method`, `Error:String`, `Price:Number`, `User:P→_User` |

---

## 6. MyCollege — מכללה (apps/mycollege/)

> **Reworked 2026-06.** Lessons and attendance moved into dedicated tables (`Lessons`, `LessonAttendance`); legacy installs still reuse `Activities`/`ActivityAdditionalAccounts`. See [../10-modules/05-mycollege.md](../10-modules/05-mycollege.md) for the full picture. Table list below = the reworked install (live `Get-Schema`, 2026-06-23).

| Table | Key fields | Relations |
|---|---|---|
| `Courses` — קורסים | `Name`, `Description`, `Color`, `StartDate`/`EndDate:Date`, `NumberOfLessons:Number`, capacity (`MaxCapacity:Number`, `AllowOverBooking:Boolean`, `RegisteredStudents:Number` — counter maintained by the `CourseEnrollment` "sum registered" trigger), `StatusId:P→CourseStatuses` (`IsOpen:Boolean` on status), staff/place (`Owner:P→_User`, `MainLecturerId:P→Lecturers`, `MainClassId:P→Classes`, `FacilityId:P→Facilities`), `ProductId:P→Products` (price linkage), `syllabus:File`, `Comments` | ← `CourseEnrollment.CourseId`, `Exams.CourseId`, `Lessons.CourseId`, `Sales.CourseId`, `Files.CourseId` |
| `CourseEnrollment` — רישום לקורס | `CourseId`, `AccountId` (the student — students are Accounts), `SaleId:P→Sales` (the purchase — now filtered to the student's own Sales), `CourseEnrollmentStatusId:P→CourseEnrollmentStatus` (`IsRegistered:Boolean` on status), `OwnerId:P→_User`, `Date:Date` | enrollment join table |
| `Lessons` — שיעורים **(dedicated, new)** | `Name`, `CourseId:P→Courses`, `ClassId:P→Classes`, `LecturerId:P→Lecturers`, `FacilityId:P→Facilities`, `StartTime`/`EndTime:Date`, `LessonCount:Number`, `DayOfWeek:String`, `Summary:String`, `TypeId:P→LessonTypes`, `StatusId:P→LessonStatuses`, `OwnerId:P→_User` | ← `LessonAttendance.LessonId` |
| `LessonAttendance` — נוכחות **(dedicated, new)** | `LessonId:P→Lessons`, `AccountId:P→Accounts`, `Presence:Boolean`, `Grade:Number`, `Remark:String` | per-student per-lesson attendance |
| `Classes` — כיתות | `Name`, `Location`, `FacilityId:P→Facilities`, `MaxCapacity:Number`, `Comments` | |
| `Facilities` — מתקנים | `Name`, `City`, `Address`, `PhoneNumber`, `Email`, `Comments` | shared with TimeSheet domain |
| `Lecturers` — מרצים | `Name`, `PhoneNumber`, `Email`, `Comments`, `SelectionLocked:Boolean` (new) | ← `Courses.MainLecturerId`, `Lessons.LecturerId`, `Products.Lecturers` |
| `Exams` — מבחנים | `Name`, `CourseId`, `StartTime`/`EndTime:Date`, `Facility:P→Facilities`, `Class:P→Classes`, `Note` | ← `ExamEnrollment.ExamId` |
| `ExamEnrollment` | `ExamId`, `AccountId`, `StatusId:P→ExamEnrollmentsStatus`, `Grade:Number`, `DateOfGrade:Date` | exam registration + grading |
| `CourseStatuses` / `CourseEnrollmentStatus` / `LessonTypes` / `LessonStatuses` / `ExamEnrollmentsStatus` | `Name` (+flags noted above) | lookups (`ExamEnrollmentsStatus`/`LessonStatuses` ship unseeded) |

Students are core `Accounts` (hidden `IsAccount`); portal link `Accounts.StudentPortal:P→_User` + roles `Student Portal`/`Lecturer`/`College Admin` (live `Get-Roles`). **[legacy]** pre-rework installs store lessons as `Activities` (`CourseId`/`ClassId`/`FacilityId`/`LecturerId`/`DayOfWeek`/`LessonCount`) and attendance as `ActivityAdditionalAccounts` (`Presence:Boolean`, `Grade:Number`) — see [02-core-tables.md](02-core-tables.md) §6; `Courses` also carried `CourseCategory:P→CourseCategoryList`, `CourseEnrollment` an `updatedByTrigger` guard, and a `Holidays` table existed (absent on the reworked reference install).

---

## 7. TimeSheet & Projects — שעון נוכחות ופרויקטים (apps/timesheet/)

| Table | Key fields | Relations |
|---|---|---|
| `Projects` | `Name`, `AccountId:P→Accounts` (the client), `ProjectType:P→ProjectTypes`, `comment`, hour budget (`TotalHoursEstimated:String` + `TotalHoursEstimatedMinutes:Number`, `TotalHoursUsed`/`TotalHoursUsedMinutes`, `totalHoursDiff`/`totalHoursDiffMinutes`) — string+minutes twin fields: minutes for math, string for display | ← `SubProjects.ProjectId`, `UserSubProjectConnection.ProjectId` |
| `ProjectTypes` | `Name`, `Time:Number`, `EstimatedTime:String` — type presets with default budget | |
| `SubProjects` | Same budget structure + `ProjectId`, `AccountId`, `Color:String`, `reportAll:Boolean` | ← `TimeSheet.SubProjectsId`, `Expenses.SubProjectId`, `SubProjectView.SubProjectId` |
| `SubProjectView` | `SubProjectId`, `UserId:P→_User` — per-user visibility of subprojects | |
| `UserSubProjectConnection` | Assignment + billing: `UserId`, `AccountId`, `ProjectId`, `SubProjectId`, `FeeType:P→FeeType` | who works on what, at which fee |
| `TimeSheet` | Work entries per subproject: `UserId`, `SubProjectsId`, `FromTime`/`ToTime:Date`, `TotalTime`/`TotalMinutes:Number`, `OnlyTotal:Boolean`, `Description` | billable-hours source |
| `TimeClock` | Punch clock: `UserId`, `AccountId`, `FromTime`/`ToTime:Date`, `TotalMinutes:Number`, `closed:Boolean`, `DayOfWeek:P→DayOfWeekList`, `Comment` | attendance source |
| `TimeSheetSettings` | Daily norm minutes per weekday: `Sunday`…`Saturday:Number` | drives overtime calc |
| `MinutesForSalary` | Monthly salary aggregation per user: `UserId`, `Date:Date`, `BaseWorkMinutes`, `RegularMinutes`, `Extra125PercentMinuts`/`150`/`175`/`200`, `MissingMinutes`, `TotalWorkMinuts`, `TotalVacationMinuts`, `TotalSickDaysMinuts`, `TotalHolidaysMinuts`, `TotalReserveDaysMinuts` (מילואים), `Comment` | payroll export (note `Minuts` spelling) |
| `Holidays` | `Name`, `FromTime`/`ToTime:Date`, `Remark` | holiday calendar (also consumed by SLA business-hours logic) |
| `DayOfWeekList` | `Name`, `Order:Number` | lookup |
| `FeeType` | `Name` | billing-type lookup |

---

## 8. Vertical add-ons seen in the demo app

| Cluster | Tables | Notes |
|---|---|---|
| Lost & Found (אבידות ומציאות) | `LostAndFounds` (37 fields: item/owner/finder details, `ReportDate`/`LostDate`/`FoundDate`/`ReturnDate:Date`, `ItemPhoto:File`, status + 4 item lookups), `LostAndFoundTypes`, `LostAndFoundStatuses` (`Order:Number`), `ItemTypeList`, `ItemSubTypeList` (`ItemType:P→ItemTypeList` — parent/child pair), `ItemBrandList` (also child of ItemTypeList), `ItemColorList` | A complete custom module built with the standard pattern: main table + status + parent/child lookups |
| Satisfaction surveys | `SatisfactionSurveys`: `CaseId`, `AccountId`, ratings (`OverallRating`, `ServiceRating`, `ResponseTimeRating`, `ProfessionalismRating:Number`), `ProblemSolved`/`WouldRecommend:Boolean`, free text (`PositiveFeedback`, `ImprovementSuggestions`, `AdditionalComments`) | Post-case CSAT |
| Israeli geo data | `Cities` (13 fields: `Name`, `Population:Number`, `ZipCode`, `IsMajorCity:Boolean`, `District:String`, **`Location:GeoPoint`**, `AccountId`), `Streets` (`Name`, `StreetName`, `City`, `ZipCode`, `CityId:P→Cities`, `ContactId`), `CityList` (`Name` only — the dropdown source) | The only observed `GeoPoint` usage |
| Playground sandbox modules (live app) | `Affiliates`/`AffiliateStatuses`/`AffiliateCommissions`/`AffiliatePayments`; `Suppliers`/`SupplierStatuses`/`SupplierOrders`; e-commerce cluster `Orders`/`OrderRows`/`OrderStatuses`/`StoreItems`/`StoreItemsParamsName`/`Coupons`/`BillingDetails`/`ShippingAddresses`/`ShippingMethods`/`TaxRules`/`Countries`/`States_Regions`; `Interests`, `Tags`, `Languages`, `SalesDepartments`(+Sub)/`SalesChannels`(+Sub), `PlaygroundTables`/`PlaygroundStatuses` | ⚠️ Sandbox experiments, not product — listed so future readers of the Playground app aren't surprised |

---

## 9. The lookup-table pattern (Status/Lookup domain — 44 tables in the dump)

Nearly every dropdown in the product is a table: 6 system fields + `Name:String` (+ occasionally `Order:Number`, `Color:String`, `Probability:Number`, a `StateId` pointer, or a parent pointer for cascading dropdowns). Implications:

- Adding a dropdown value = inserting a row (`Create-Data`), not editing an enum.
- Filtering by dropdown value requires the row's `objectId` (Pointer equality), not the label — resolve via `Get-Data` on the lookup table first.
- Status tables that participate in platform logic carry a **state pointer**: `CaseStatuses.StateId→CaseStates`, `LeadStatuses.StateId→AccountStatusesStates`, `AccountStatuses.StateId→AccountStatusesStates`, `ConversationStatuses.StateId→ConversationStates`, plus boolean flags (`CourseStatuses.IsOpen`, `CourseEnrollmentStatus.IsRegistered`, `UserStatuses.state`).
- `SaleStatuses.Probability:Number` drives pipeline forecasting.

## Limitations & gotchas

- Field lists for MyBooks/MyCampaigns/MyChat/MyCollege/TimeSheet come primarily from the **demo dump**; only `AccountingHeaders`, `Channels`, `Conversations`, `BusinessHours` were re-verified live. Treat exact field sets as indicative.
- The draft→final accounting flow and `AccountingDocsType.NumLast` numbering are inferred from schema shape and terminology docs; the issuing transaction itself is server-side cloud code not visible in the schema. ⚠️ UNVERIFIED mechanics.
- Hebrew/typo field names are real and load-bearing: `CreaditCardNumber`, `RecieptId`, `Minuts`, `ForeginRowTotal`, `SmptPort`. Copy them exactly.
- WhatsApp sending uses `Channels.Identity` (not `objectId`) — repeated platform-wide rule (project `CLAUDE.md` rule 2).
- `Products.Inventory` together with `InventoryLog` implies stock management exists, but decrement logic (on sale? on invoice?) is server-side. ⚠️ UNVERIFIED.
- Tables present in a tenant do not imply the module is licensed/enabled — module visibility is controlled by packages/menus (see `Get-Packages`, `Get-Menus`), not by table existence.
