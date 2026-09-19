---
name: myb-p-mybooks-setup
description: "Set up and verify the MyBooks billing module (מודול חשבוניות והנהלת חשבונות) for a MyBusiness CRM customer — business identity and VAT settings, document types and numbering sequences including legacy-sequence continuation (המשך רצף ממערכת קודמת), credit-clearing setup (Upay/Pelecard), retainers / recurring charges (ריטיינר, הוראות קבע), hosted payment pages and embeddable payment buttons, document email dispatch, Israeli-compliance hookups (חשבונית ישראל, מבנה אחיד), ending with a verification pass that billing actually works. Use whenever a customer needs billing configured or checked: 'תקים את מודול החשבוניות', 'להמשיך רצף חשבוניות מהתוכנה הקודמת', 'הגדרת סליקת אשראי', 'להקים ריטיינר / הוראת קבע', 'דף תשלום ללקוחות', 'set up MyBooks', 'configure invoicing', 'recurring billing', 'payment page'. NOT for price-quote templates (use myb-p-price-quote-template), NOT for automations/triggers (use myb-p-trigger-setup), NOT bookkeeping advice — accounting decisions go to the customer's רואה חשבון."
---

# MyBooks Setup / הקמת מודול החשבוניות

MyBooks is the billing/documents app (`apps/mybooks/`) — it shares the `Accounts` and `Products` tables with CRM Core and produces legally-meaningful, numbered, **immutable** documents. Module truth (types, lifecycle, pages, settings): `../myb-p-kb/references/10-modules/02-mybooks.md`. This skill runs the setup end-to-end: scoping interview → staged configuration → verification pass.

## Safety posture — read before touching anything

MyBooks touches real money and tax documents. Non-negotiable rules for this skill:

1. **Plan-then-confirm.** Before the first write of any kind (MCP or guided UI), present a short plan: what will be created/changed, and what is **irreversible** — produced documents cannot be edited or deleted, and per-type number sequences move **upward only** (KB §4, "Limitations & gotchas"). Get explicit user confirmation.
2. **Test with drafts.** Drafts (`AccountingHeadersDraft`) are the only editable/deletable stage (KB §4). All flow testing happens at draft level. **Never produce a final document as a "test" without the user's explicit approval** — a produced document consumes a number in the legal sequence and can only be corrected with a חשבונית מס זיכוי.
3. **Accountant gate.** Sequence continuation, VAT rate, credit-note usage, and allocation-number fallbacks are accounting/legal decisions. The skill asks; the customer's רואה חשבון decides. Never advise on tax.
4. **Zero credential handling.** Clearing-gateway credentials and SMTP passwords are entered by the customer directly in the product UI. The agent never asks for, receives, stores, or reads them back. When reading `AccountingSettings`, always pass an explicit `keys` list that excludes the SMTP `Password` field.

## How configuration actually happens (MCP vs UI)

The KB documents MyBooks configuration **through its settings pages** (page map: KB §12; checklist: KB §14). The document-issuing transaction is server-side cloud code — its mechanics are marked ⚠️ UNVERIFIED in the KB (`../myb-p-kb/references/20-data-model/03-module-tables.md`, verification notes). Therefore:

- **MCP reads** (`Get-Data`, `Count-Data`, `Get-Schema`, `Get-Site-Pages`) are the documented verification surface — use them after every UI step. **Always pass an explicit `limit`** (the Get-Data default is 5 — a bare call silently truncates and can "verify" a partial list; e.g. `AccountingDocsType` ships 7 types). When the expected count is known, cross-check with `Count-Data`.
- **MCP writes to MyBooks config tables** (`AccountingSettings`, `AccountingDocsType`, `Retainers`, `PaymentBtns`, drafts) are **not documented as a supported mechanism**. UNVERIFIED — verify on the playground before relying; server-side wiring (numbering, tokens, charge engine) may be bypassed by a raw row write. Default to the guided UI walkthrough + read-back.
- **Exception — `Products`:** an ordinary shared data table (`../myb-p-kb/references/20-data-model/03-module-tables.md` §1). Rows may be created with `Create-Data` as generic data; verify with `Get-Data` **and** confirm the product renders on the הגדרות מוצרים page.

"Guided UI walkthrough" means: tell the user (or drive the browser yourself if the session has browser access and the user asked you to) **exactly where** — page path from KB §12 — what to enter, then the agent verifies with the matching `Get-Data` read-back. No step ends at "do it in the UI" without a read-back.

## Stage 0 — Baseline audit (read-only, always first)

```
Get-Site-Pages                                     -- apps/mybooks/* present? if not: module not installed
Get-Data(table: "AccountingSettings", keys: ["Name","NameHeb","CompanyId","VAT","Currency","MultiTerminals","SenderEmail","SenderName"], limit: 1)
Get-Data(table: "AccountingDocsType", limit: 10)   -- the document types + NumLast per type
Get-Data(table: "CreditClearingTerminal", limit: 10)
Count-Data(table: "AccountingHeaders")             -- documents already produced? (changes migration math)
Count-Data(table: "AccountingHeadersDraft")
Count-Data(table: "Retainers")
Get-Data(table: "RetainerPlans", limit: 20)
Get-Data(table: "PaymentBtns", limit: 20)
```

- If `apps/mybooks/*` pages are absent: the customer installs the module via the app switcher / `apps/mybusiness/install-mybooks` (KB §1) — then re-run `Get-Site-Pages` to confirm.
- If `Count-Data("AccountingHeaders") > 0`, documents were already produced — numbering can no longer be lowered below those numbers. Say so before the interview.

## Stage 1 — Scoping interview (Hebrew, ask the customer)

1. **סוגי מסמכים:** אילו מסמכים העסק מפיק בפועל? (חשבונית מס / קבלה / חשבונית מס קבלה / חשבונית מס זיכוי / חשבונית עסקה / הזמנת עבודה / תעודת משלוח — הרשימה המלאה: KB §3)
2. **המשך רצף ממערכת קודמת:** האם עוברים ממערכת חיוב קודמת? אם כן — מה **המספר האחרון שהופק בכל סוג מסמך** במערכת הקודמת? ⚠️ החלטה חשבונאית-משפטית: המספור ניתן להעלאה בלבד וטעות אינה הפיכה. בקשו מהלקוח אישור בכתב למספרים, ואשרור מול רואה החשבון.
3. **פרטי עסק:** שם משפטי (עברית + אנגלית אם מפיקים באנגלית), ח.פ / עוסק, כתובת, לוגו, אחוז המע׳׳מ הנהוג, מטבע.
4. **סליקה:** האם סולקים אשראי? איזה ספק (Upay / Pelecard / אחר)? **מי מחזיק בפרטי ההתחברות?** (הלקוח מזין אותם בעצמו — הסוכן לעולם לא מקבל אותם.)
5. **ריטיינרים / הוראות קבע:** כן/לא. אם כן — תדירות (חודשי/רבעוני/…), תאריך חיוב ראשון, סכומים או תוכניות קבועות, איזה סוג מסמך מופק בכל חיוב, כמה לקוחות.
6. **דפי/כפתורי תשלום:** כן/לא. אם כן — אילו מוצרים במחיר קבוע, טווח כמויות, היכן יוטמע הכפתור.
7. **שליחת מסמכים במייל:** מכתובת המערכת או מכתובת ממותגת של העסק (SMTP)?
8. **חשבונית ישראל:** האם צפויות חשבוניות מעל סף מספרי ההקצאה? (הסף משתנה לפי שנה — KB §9; לוודא מול רואה החשבון.)
9. **מלאי (אופציונלי):** האם מנהלים מלאי שמסמכים צריכים להזיז? אם כן — נקודות ההגדרה ב-KB §8; מחוץ לליבת הסקיל הזה.

## Stage 2 — Plan + confirmation gate

Summarize: which stages below run, what each creates/changes, and flag the irreversibles (sequence numbers, any final document production). Get an explicit "מאשר/ת" before proceeding. Record the confirmation in the build ledger (see Pipeline placement).

## Stage 3 — Business identity

- **UI (customer/implementer):** `apps/mybooks/SettingCompany` — legal name Heb/En, ח.פ, address, logos, currency, VAT %, rounding (KB §14 item 1). Per-document language pulls the matching logo/address set — incomplete English settings produce half-translated documents (KB "Limitations").
- **Verify:** `Get-Data("AccountingSettings", keys: [...])` (singleton row — full field list: `../myb-p-kb/references/20-data-model/03-module-tables.md` §2). Confirm name, `CompanyId`, `VAT`, logos present. Never include the SMTP `Password` key.

## Stage 4 — Document types & numbering (migration-critical)

- **UI:** הגדרות מסמכים (`apps/mybooks/OtherSettings` — page↔guide mapping is marked inferred in KB §12): per-type default header + notes (Heb/En) and **the last document number per type**. For sequence continuation, the customer sets each type's last number to the last number produced in the legacy system; the next document takes last+1. Upward-only — "get opening numbers right on day one" (KB §14 item 2, "Limitations").
- **Verify:** `Get-Data("AccountingDocsType", limit: 20)` — check `NumLast` per type against the customer's written confirmation, and headers/notes per language.
- Direct `Update-Data` on `NumLast` is UNVERIFIED — verify on the playground before relying; default to the UI which enforces the upward-only rule.

## Stage 5 — Templates & products

- **UI:** `apps/mybooks/SettingsTemplates` (document color theme + preview) and `apps/mybooks/SettingProducts` (catalog; shared with CRM — KB §13).
- Products may alternatively be created via `Create-Data(table: "Products", ...)` / bulk via the `myb-p-data-import` skill. **Verify:** `Get-Data("Products")` for names/prices/catalog numbers + visual check on the settings page.

## Stage 6 — Credit clearing (gateway)

- **Providers per KB §6.2:** Upay (self-service signup from הגדרות → הגדרות סליקה) or Pelecard (provisioned via product support — escalate the request; pricing in the KB is dated, re-check). Multi-terminal is supported (`AccountingSettings.MultiTerminals` + `CreditClearingTerminal`).
- **Credentials are vendor/customer-side.** The customer completes signup and enters gateway credentials directly on `apps/mybooks/SettingPelecard`. The agent's role: point to the page, then verify.
- **Verify:** `Get-Data("CreditClearingTerminal")` — terminal row(s) exist, one `Default: true`. A live end-to-end clearing test moves real money — only with the customer's explicit approval, minimal amount, and read-back on `Get-Data("PaymentsLog")` for the transaction status (table shape: data-model doc §"Online payment & clearing"). Immediately correct per the accountant's instruction (typically a זיכוי + refund).

## Stage 7 — Retainers (ריטיינר / הוראות קבע)

Mechanics — period options, plans vs ad-hoc rows, document type per charge, token storage, retry policy: KB §7.

- **UI:** `apps/mybooks/RetainerPlans` for reusable plans (if the interview said fixed bundles), then `apps/mybooks/Retainers` → new authorization per customer: period, first `NextChargeDate`, charge limit, document type, rows/plan, credit card (validated in-UI via 'בדוק כרטיס אשראי'; stored as a token — the agent never sees card data), and the **'הגדר ריטיינר כפעיל' checkbox — a configured but unchecked retainer never charges** (KB §7).
- Creating `Retainers` rows via `Create-Data` is UNVERIFIED (token + charge-engine wiring is server-side) — do not; use the UI.
- **Verify:** `Get-Data("Retainers", keys: ["AccountId","Active","NextChargeDate","RetainerPeriod","ChargesLimit","DocTypeId","TotalSum"])` + `Get-Data("RetainerRows")`. Check `Active: true` on every authorization meant to run.
- **Hand the customer a monitoring habit:** after the first charge date, check דוח חיובים (tab in `Retainers`) / `Get-Data("RetainerChargeLog")` — a third consecutive failure deactivates the retainer, with an error row in דוח חיובים — that report is where to catch it (KB §7 retry policy).

## Stage 8 — Payment pages / buttons

- **Prerequisites (KB §6.3):** clearing configured (Stage 6) + logo uploaded (Stage 3).
- **UI:** `apps/mybooks/PaymentsBtns` → define title/paragraph/footer, fixed product rows with price and min/max quantity, VAT/rounding. Saving yields a shareable link + embeddable HTML for the customer's website.
- **Verify:** `Get-Data("PaymentBtns", keys: ["Name","Link","Active","OrdersCount"])` + `Get-Data("PaymentBtnsRows")`; then open the `Link` URL and confirm the public page renders the products.
- ⚠️ UNVERIFIED (KB §6.3): which document type is auto-produced after a successful public payment. Test one minimal-value transaction **only with explicit customer approval**, then read back `AccountingHeaders` + `PaymentsLog` to see what was produced; correct per the accountant.

## Stage 9 — Email dispatch of documents

- Default: documents auto-send on production to the customer email, from the system address (KB §10). Branded sending uses the SMTP block on `AccountingSettings` — the customer enters the SMTP password in the UI; the agent configures/verifies everything except the credential.
- **Verify:** `Get-Data("AccountingSettings", keys: ["SmtpServer","SmptPort","SenderEmail","SenderName","Ssl","SendMeDocByMail"])` (note the real field name `SmptPort` — data-model doc §2), then a live test: resend an existing produced document (envelope icon on the documents list) to the customer's own inbox and have them confirm receipt.

## Stage 10 — Israeli compliance hookups

- **חשבונית ישראל (allocation numbers):** if invoices can exceed the year's threshold, the customer connects the tenant to רשות המסים from הגדרות (OAuth-style login — customer's own tax-authority credentials, never the agent's business). Mechanics, thresholds, refusal fallbacks: KB §9. Fallback choice on refusal is an accountant decision.
- **מבנה אחיד:** point the customer at הגדרות → ייצוא קבצים במבנה אחיד (`ExportUniformFiles`) for their accountant's periodic export. No setup needed; confirm the page opens.
- **Verify:** after connection, produce nothing — verification happens naturally on the first real over-threshold invoice. Tell the customer what to expect (allocation number printed above the notes, KB §9).

## Verification pass (run at the end, every setup)

| Surface | Read-back |
|---|---|
| Business identity | `Get-Data("AccountingSettings", keys: [...])` — name/ח.פ/VAT/logos |
| Types & numbering | `Get-Data("AccountingDocsType", limit: 20)` — `NumLast` per type matches written confirmation |
| Clearing | `Get-Data("CreditClearingTerminal")`; after any test charge `Get-Data("PaymentsLog")` |
| Retainers | `Get-Data("Retainers")` `Active` flags + `RetainerRows`; later `RetainerChargeLog` |
| Payment pages | `Get-Data("PaymentBtns")` + public link renders |
| Email dispatch | resend test received by the customer |

**End-to-end draft flow (mandatory):** the customer (or the agent in-browser, if asked) creates a new document of the primary in-scope type on `apps/mybooks/Documents` → picks a real or throwaway customer → adds one product row → **שמור טיוטא** (NOT הפק מסמך). Agent verifies `Get-Data("AccountingHeadersDraft")` + the matching `AccountingInvoiceLinesDraft`/`AccountingReceiptLinesDraft` rows, then the draft is deleted from the טיוטות tab and the deletion is read-back-verified.

**First real production** (only with explicit approval, ideally on the first genuine transaction): confirm the expected `DocumentNumber` (= NumLast+1) with the user **before** clicking הפק מסמך; warn that the PDF opens in a pop-up (allow pop-ups — KB "Limitations"); read back `Get-Data("AccountingHeaders")` for the number + `File`, and `AccountingInvoiceBalance` for invoice types.

## Pipeline placement

Executes the **MyBooks slice of WP9 (מסמכים ותקשורת)** in the build pipeline (`the work-plan playbook`): consumes DOC/billing items from the approved functional spec (and fit-gap rows classified Native under the capability matrix's "Billing — MyBooks" section, `../myb-p-kb/references/80-capability-matrix/01-capability-matrix.md` §10), and emits build-ledger rows per `build`'s ledger contract — one row per stage above, with the read-back output as evidence and the Stage-2 confirmation recorded. Prerequisites: WP2 schema items (if the spec adds billing fields); products and customer records that retainers/payment pages reference must exist by then (Stage 5 here, or data migration in WP13); runs before WP14 UAT.

## Boundaries — what this skill is NOT

- **Quote templates / branded PDF design** → `myb-p-price-quote-template`.
- **Billing automations** (auto-emails on document events, scheduled reminders) → `myb-p-trigger-setup`.
- **Reports/dashboards beyond MyBooks' built-in reports** (KB §11) → `myb-p-create-update-reports`.
- **Importing legacy invoices as produced documents** — not a documented capability; the documented migration mechanism is sequence continuation (Stage 4) with the legacy archive kept in the old system. Treat any request to "load old invoices" as a Gap for fit-gap.
- **Bookkeeping/tax advice** — every accounting-sensitive decision routes to the customer's רואה חשבון.

## Knowledge sources

Read on demand — do not embed their facts elsewhere:

- `../myb-p-kb/references/10-modules/02-mybooks.md` — module truth: document types (§3), lifecycle & numbering (§4), linked docs (§5), collection/clearing/payment pages (§6), retainers (§7), inventory (§8), Israeli compliance (§9), dispatch (§10), reports (§11), page map (§12), configuration checklist (§14), limitations.
- `../myb-p-kb/references/20-data-model/03-module-tables.md` — §2 MyBooks table shapes (the read-back surface) + verification caveats.
- `../myb-p-kb/references/80-capability-matrix/01-capability-matrix.md` — §10 Billing rows (Native vs Custom-Server boundaries, e.g. installments/US gateways/refunds are Custom-Server).
- `the work-plan playbook` — WP9 contract.

MCP tools used: `mcp__MyBusiness__Get-Site-Pages`, `mcp__MyBusiness__Get-Data`, `mcp__MyBusiness__Count-Data`, `mcp__MyBusiness__Get-Schema` (field-shape checks), `mcp__MyBusiness__Create-Data` (Products only, per Stage 5). `mcp__MyBusiness__Usage-Guide` when a tool's parameters are unclear.

## Known limitations

- **No documented MCP write path for MyBooks configuration** — this skill is UI-walkthrough + read-back by design. If a future KB update documents config writes, revisit the stages.
- **Exact field sets are indicative:** most MyBooks table shapes come from a demo dump; only `AccountingHeaders` was re-verified live (data-model doc). `Get-Schema` the table before relying on a specific field.
- **UNVERIFIED items inherited from the KB** (do not promise; verify on the playground first): post-payment auto-document type, `pay-open-invoice` end-customer flow, Sale→document/retainer linkage UI (`ConnectedSale`), `AutoChargeRules` feature status, Hashavshevet export flow, allocation-number field details.
- **The skill cannot undo money:** a produced document, a consumed sequence number, and a cleared charge are all outside the agent's power to revert — only the confirmation gates prevent damage.
- **Gateway onboarding time is external** — Upay signup is self-service but Pelecard provisioning goes through support; chase it from day 1 like the WP9 SMTP/WhatsApp dependencies.
- Inventory (KB §8) and the collection workflow (KB §6.1) are read-pointed but not staged here; add them explicitly to scope if the customer needs them.
