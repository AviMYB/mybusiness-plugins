# Known Limitations & Sharp Edges — מגבלות ידועות

> **Purpose:** Every verified limitation, gotcha, and platform sharp edge in one place — so fit-gap doesn't over-promise and builders don't step on landmines.
> **Audience:** Implementers, developers, AI agents — read before classifying anything as "Config" and before any build/migration.
> **Last updated:** 2026-10-09 (public forms — §23, item 37 corrected) · previously 2026-10-06 (card layout & aesthetics — §22) · previously 2026-09-28 (build mechanics that shape a design — §21) · previously 2026-09-27 (`Config` reachable from MCP) · previously 2026-08-23 (native page mechanisms & page JS — §16) · **Status:** draft — living document.

Format per item: **the edge** → why it bites → what to do.

---

## 1. Triggers & automation

1. **Triggers DO fire on API/master-key writes — live-verified 2026-06-10** (`Create-Data`, `Update-Data`, `Create-Many` all fire; an earlier internal claim to the contrary was wrong). → The real trap is the opposite: **bulk imports storm automations by default** (mass emails, mass child rows). → Suppress deliberately with `Create-Many(skipTriggers: true[, skipTimeline: true])` and backfill trigger-derived fields (timestamps, SLA stamps) in the import — or deactivate notification triggers for the window. Single-record tools and REST `/batch` have **no** skip flag. ([30/06](../30-customization/06-triggers-and-automations.md) §9)
2. **Trigger chains max 3 levels.** → Deep automation cascades stop silently. → Design flat; use one-time flags for idempotency. ([30/06](../30-customization/06-triggers-and-automations.md))
3. **Scheduled-trigger param is literally `shcedulerHours`** (misspelled) and **value `0` is rejected via MCP** (tool-guide vs verified behavior conflict). → Copy the canonical shape from the doc, not from intuition. ([30/06](../30-customization/06-triggers-and-automations.md))
4. **No trigger deletion via MCP** — deactivate only; delete in UI. ([30/06](../30-customization/06-triggers-and-automations.md))
5. **The native SLA runtime does not compute reliably** — the SLASettings-driven engine cannot be depended on for deadlines. → Use the trigger-built SLA blueprint / productized `SLA-*-v2` functions. ([30/12](../30-customization/12-solution-blueprints.md))
6. **GCP rollup functions (`update_sum_count_obj`) fail silently** when misconfigured. → Add audit queries to UAT for every computed sum.

## 2. Full-replace writers (read-modify-write or you destroy state)

7. **`Set-Form-Rules` replaces ALL rules on the page** → use `Edit-Form-Rules` for single changes. ([30/07](../30-customization/07-form-rules.md))
8. **`Set-Table-Permissions` replaces the table's whole CLP** → read, merge, write. ([30/08](../30-customization/08-users-roles-permissions.md))
9. **`Set-Terminology-Dictionary` replaces the dictionary** → same discipline. ([30/09](../30-customization/09-terminology-localization.md))
10. **`Edit-Table-View` and `Edit-Page-CSS-JS` are whole-state writers** — omitted columns/filters/code blocks are lost. → Always Get→merge→Set; keep page versions as backup (`Get/Set-Page-Version`). ([30/04](../30-customization/04-table-views-and-lists.md), [30/03](../30-customization/03-pages-and-layouts.md))

## 3. Schema & data

11. **Fields can't be renamed or retyped; no MCP field/table delete.** Typo'd names (`buiding`, `CreaditCardNumber` exist in production) live forever. → Triple-check names before creation; REST/UI for removal. ([20/05](../20-data-model/05-field-types-and-conventions.md))
12. **No referential integrity / cascade delete** — dangling pointers accumulate. → Deletion processes need explicit child handling. ([20/01](../20-data-model/01-data-model-overview.md))
13. **Tenant schemas diverge hard from any reference dump** (playground Sales ~37 fields vs 133 in the metadata dump; duplicate-purpose fields like `City` String vs `CityId` Pointer; same field name can differ in type across tenants). → `Get-Schema` per tenant before any spec/build; pick the canonical field per customer and write it into the TRS. ([20/02](../20-data-model/02-core-tables.md))
14. **Multi-select is fully supported** via the native `array_<x>_Pointer_<T>` naming convention (Simbla's official mechanism — renders a Select2 multi-pick with no custom JS). The *remaining edges only*: form-page binding needs the page editor UI (`Edit-Page` can't bind it — broken `<input type="array">`); naming is case-sensitive and immutable after data exists; queries require `containedIn` (`equalTo` returns nothing); verify the stored shape on read (full Pointer objects vs bare objectId strings observed in different writers). ([30/11](../30-customization/11-field-patterns.md))
15. **Aggregate `groupby` must be a String field** — pointer/date grouping needs helper String fields. ([30/05](../30-customization/05-dashboards-and-reports.md))
16. **`Get-Data` returns 5 records by default, 2000 max; REST batch = 50 ops.** → Page through; never assume completeness. ([40/01](../40-integrations-api/01-parse-rest-api.md))
17. **No native dedupe** (phone/ת"ז) — duplicates are flagged at intake (web2lead) but never merged. → Dedupe is a migration/intake design item, possibly Custom-Server. ([40/03](../40-integrations-api/03-web2lead-web2table.md))

## 4. Pages, views & dashboards

18. **No page/element deletion via MCP**; `Create-Form-Page` forces the NewMaster master (irreversible); standalone-URL custom cards aren't creatable via MCP. → Plan page inventory before creating; hide/rename as workaround. ([30/03](../30-customization/03-pages-and-layouts.md))
19. **Search-form (dbFormQuery) inputs have no MCP tool** — page JS only. ([30/04](../30-customization/04-table-views-and-lists.md))
20. **Dashboard cloning overwrites `genericform`**; from-scratch dashboard tooling is new (2026) with open gaps. → Follow the clone-and-repoint workflow exactly. ([30/05](../30-customization/05-dashboards-and-reports.md))
21. **Compound reports and report deletion are REST-only; scheduled reports created tool-side never send until a UI save.** A `Create-or-Update-Report`/direct-write schedule stays inactive — the front-end schedule component only initializes when the report is saved from the report generator UI (live-verified 2026-07-21). → Always hand the user the open-in-generator-and-Save activation step. ([30/05](../30-customization/05-dashboards-and-reports.md) §B7)
22. **`minimal:true` page reads hide interactive elements** — don't audit pages with minimal mode. ([30/03](../30-customization/03-pages-and-layouts.md))

## 5. Permissions & users

23. **New users, roles, and tables start with ZERO permissions** — the single most common "the system is broken" ticket. → Permission assignment is a mandatory checklist step after every user/role/table creation. ([30/08](../30-customization/08-users-roles-permissions.md))
24. **Row-level ("advanced") permissions are UI-only** (no MCP) and heavy use explodes role counts (real case: 78 roles). → Design permission models top-down; prefer hierarchy operators in views. ([30/08](../30-customization/08-users-roles-permissions.md))
25. **No user deletion** (deactivate only); MCP user listing caps ~100. ([30/08](../30-customization/08-users-roles-permissions.md))
26. **MCP operates with master key** — audit fields show no human user attribution. → For attributable changes, work via UI or document the change log manually. ([00/02](../00-overview/02-architecture.md))
27. **Password policy:** min 8, ≥1 upper, ≥1 lower, ≥1 digit. ([30/08](../30-customization/08-users-roles-permissions.md))

## 6. Billing — MyBooks (compliance-grade edges)

28. **Produced documents are immutable; numbering is upward-only and per-type.** → Migration must not import documents that would collide with sequences; corrections only via זיכוי. ([10/02](../10-modules/02-mybooks.md))
29. **Lead→customer conversion is irreversible**, and **Sales.Total locks when line items exist.** ([10/01](../10-modules/01-crm-core.md), [10/02](../10-modules/02-mybooks.md))
30. **Retainers are inert until "פעיל" is checked and auto-deactivate after the 3rd failed charge** — silent revenue leak. → Add a monitoring report at go-live. ([10/02](../10-modules/02-mybooks.md))
31. **חשבונית ישראל allocation requires VAT registration** and can be refused (fallback flows exist); NGO donation-receipt features have open product tickets. ([10/02](../10-modules/02-mybooks.md))
32. **Income summary reports mix pre/post-VAT bases** — warn customers comparing reports. ([10/02](../10-modules/02-mybooks.md))

## 7. Messaging & documents

33. **WhatsApp channel identity = `Identity` field on Channels, NOT `objectId`** — the classic integration mistake. ([40/05](../40-integrations-api/05-messaging-channels.md))
34. **Business-initiated WhatsApp only via Meta-approved templates within the 24h-window rules**; template approval latency is a calendar risk; `Get-WhatsApp-Template-Params` unreliable with ≥2 params. ([40/05](../40-integrations-api/05-messaging-channels.md))
35. **Email sending requires per-user/per-app SMTP setup** (playground has none configured by default); calendar invites need per-user SMTP. ([10/03](../10-modules/03-mycampaigns.md))
36. **Quote templates:** no `<script>` allowed (it prevents the template rendering); MCP-created templates cannot carry fillable inputs — create those in the UI. ([30/10](../30-customization/10-price-quotes-documents.md))

## 8. Intake & integrations

37. **web2lead always inserts** (duplicate → new row flagged duplicate, no merge); **web2table creates but never updates** — not the linked Account and not the target row either (no `objectId` addressing); deployed web2table requires `phone` and reads `AcceptWebToTable`. **Tokenless anonymous Parse REST creates are CAPTCHA-gated (`code 119`) even with `create:{"*":true}`** — but a native Database form on a CRM page carries the platform's reCAPTCHA token, passes the gate, and is then let in by `create:"*"` (item 107; [30/15](../30-customization/15-public-forms.md)). ~~There is no anonymous UPDATE path at all~~ — corrected 2026-10-09: updates are not CAPTCHA-gated, only a closed `update` CLP stops them (item 109). "Public visitor updates an existing record" is still built as **intake table + projection trigger**. → Spec intake contracts from [40/03](../40-integrations-api/03-web2lead-web2table.md) and [30/15](../30-customization/15-public-forms.md), not from memory.
38. ~~The `Config` table is fully MCP-restricted~~ — **lifted:** `Get-Data`/`Create-Data`/`Update-Data` on `Config` (AcceptWeb*, PBX, Twilio, payment settings) work from MCP. If a connection still returns `Table is restricted`, its MCP version predates the change — use master-key REST or the CRM admin `Config` grid. ([40/04](../40-integrations-api/04-cloud-functions.md))
39. **CDR phone matching uses last-7-digit endsWith** — collision risk on shared lines. ([40/04](../40-integrations-api/04-cloud-functions.md))
40. **Landing-page form contract is ambiguous** (`F_name` listed for both first/last name in the source guide) — verify the last-name key on a test lead. ([10/03](../10-modules/03-mycampaigns.md))

## 9. Environments & ops

41. **No staging environment**; the tenant-clone op **overwrites the destination completely**; no config diff/merge between apps. → Prototype in Playground; treat prototypes as specs; rehearse migrations on clones. ([00/04](../00-overview/04-environments-and-access.md))
42. **No trigger on/off console for testing windows** — field practice uses date-criterion hacks or "מבוטל" naming.
43. **File deletion/quota management has no self-service** — `outOfStorage` is flagged via the reseller API. ([40/06](../40-integrations-api/06-files-and-storage.md))
44. **One shared deployment serves nearly the whole fleet** — platform incidents are platform-wide. ([00/02](../00-overview/02-architecture.md))

## 10. Module maturity flags

45. **MyCollege (reworked 2026-06):** lessons & attendance now have dedicated tables (`Lessons`/`LessonAttendance`) and a few automations ship (enrollment-counter trigger; capacity + duplicate-enrollment block client-side; single-lesson scheduling-conflict via cloud fn). Still gaps: multi-state attendance (`Presence` Boolean), flexible/holiday-aware series (fixed-interval), certificates, student reminders, reports/dashboard, waiting-list auto-promotion. **Legacy installs still reuse `Activities`/`ActivityAdditionalAccounts` with zero triggers — confirm per tenant.** ([10/05](../10-modules/05-mycollege.md))
46. **MyChat ergonomics** (quick replies, round-robin, signatures) were not available as of 2026-06 — verify before promising. ([10/04](../10-modules/04-mychat.md))
47. **MyInbox is minimal** — near-zero docs, immature flows. ([10/07](../10-modules/07-myinbox-and-misc.md))
48. **TimeSheet UI unverified on demo** (module not installed) — verify flows on a licensed tenant before fit-gap claims. ([10/06](../10-modules/06-timesheet.md))

## 11. Knowledge & tooling drift (meta-limitations)

49. **Tool guides lag the live server** (13 live tools missing from the 2026-02 guide; 9 listed tools absent); **skills lag tooling** (2026-04 skills miss container/tabs tools); **deployed function code drifts from repo** in places. → For anything load-bearing: verify live (ToolSearch the schema, Get-* the state) and prefer verified-behavior notes in these docs over older guides. ([40/02](../40-integrations-api/02-mcp-tools-catalog.md))
50. **Public docs have holes** customers will ask about: TimeSheet (0 guides), MyCollege (0 published), SLA, debugging/logs, system limits, webhooks/web2table (drafts unpublished). → Expect to hand-hold these topics; see [90/01](../90-appendices/01-support-site-catalog.md).

## 12. UI/runtime observations (from the live walkthrough)

51. **Record cards open in a side-modal iframe; links are JS (`data-ticket`), not hrefs** — deep-linking requires the iframe URL, and `oid` without `cls` renders an empty form. → For "send me a link to the record" requirements, spec the exact URL contract. ([50/01](../50-ui-walkthrough/01-runtime-app-tour.md))
52. **Three names per entity in renamed tenants** (menu label ≠ page title ≠ table name; e.g., menu משתתפים / page לקוחות / table `Accounts`) when terminology was applied partially. → Apply the full terminology plan (dictionary + labels + menus) and verify all three layers. ([50/01](../50-ui-walkthrough/01-runtime-app-tour.md))
53. **Nothing prevents publishing menu items to junk/test pages** (`_old_*`, `_v2_*` pages exist in tenants); some triggers are unnamed. → Hygiene pass (page inventory + trigger naming) belongs in every implementation plan. ([50/02](../50-ui-walkthrough/02-admin-builder-tour.md))
54. **Admin is a separate English/LTR environment** (siteadmin.mbapps.co.il; runtime is Hebrew/RTL); module switcher spawns new tabs. → Train customer admins explicitly; don't assume they'll find the builder. ([50/02](../50-ui-walkthrough/02-admin-builder-tour.md))

## 13. Customer portals (composite builds)

55. **Portal pages suffer first-load race conditions** — page JS can run before the dbForm has loaded the logged-in user's record (field-observed: intermittent empty forms/tables on refresh). → Bind logic to the account-loaded event (the safe pattern in [30/13](../30-customization/13-customer-portals.md)); never assume data at DOMContentLoaded. ([30/13](../30-customization/13-customer-portals.md))
56. **Portal logout lands users on the staff login** unless a loginUrl redirect/cookie is set (a field-observed portalmaster fix). → Include logout-redirect handling in every portal master JS. ([30/13](../30-customization/13-customer-portals.md))
57. **Cloning a portal tenant breaks hardcoded role objectIds** — role ids change on the tenant-clone op while most system-table ids survive; server functions referencing role ids must be re-pointed after every clone. Related: `allowedRoles` gates pages by role **name string**; and some tenants store portal passwords as plain Account fields sent via SMS (accepted risk — flag in security reviews). ([30/13](../30-customization/13-customer-portals.md))
58. **Server-side row-level scoping (advanced permissions) is per-tenant optional and invisible to API tools** — CLP is table-wide, element criteria are UX-only. A tenant without it has no row fence against raw REST queries from a portal session. → UI-configure per table (staff exemptions included), document in the spec, and run the REST isolation test with a real portal user before every go-live and after every permission change. ([30/13](../30-customization/13-customer-portals.md))
59. **`find: requiresAuthentication` on lookup tables exposes them to every portal user** — value-bearing lookups (coupon/voucher codes, price agreements) become enumerable by any logged-in external user; `_User` rows carry a public-read ACL by default, so portal sessions can often enumerate the whole user list. → Lock sensitive lookups to staff roles and validate codes inside a server function; restrict the `_User` CLP for portal audiences. ([30/13](../30-customization/13-customer-portals.md))
60. **The built-in OTP login page (`PortalLoginOTP`/`loginOTPForm`) is not in the vanilla install** — it arrives with tenant-level `enableOTP` provisioning. Triggers also cannot add users to roles — trigger-provisioned portal users need a separate role-attachment step (users tool or a server function). → Plan OTP enablement + role attachment explicitly in every portal build. ([30/13](../30-customization/13-customer-portals.md))


## 14. MyBooks line-level period & discount (2026-08)

63. **The line period/discount columns are absent from every vanilla document page** (live-verified 2026-08-02) — the DB fields and the page JS ship, but no `.ProductsTable` `thead` defines them, so both features are invisible and unreachable on a new tenant. The JS guards on `if (input.length > 0)` and therefore **fails silently, with no console error**. → Treat "the field exists in `Get-Schema`" as no evidence that a user can reach it; check the page's column definitions. ([30/10](../30-customization/10-price-quotes-documents.md) §8.3)
64. **The vanilla PDF templates render neither field** — a discounted line prints `quantity × price ≠ line total` with no column explaining the difference, on a document that is a legal tax invoice. → Never enable the line discount for a customer without updating their document templates in the same change. ([30/10](../30-customization/10-price-quotes-documents.md) §8)
65. **The per-line discount has no validation** — 150 %, an amount larger than the line, and negative values are all accepted and produce negative or inflated line totals on a produced (immutable) document. → Constrain at the point of entry; a produced document can only be corrected with a זיכוי. ([10/02](../10-modules/02-mybooks.md) §4.1)
66. **Line period dates default to today on every new line** and `DiscountType` is persisted even when no discount is entered → a one-off service line prints a one-day "period", and a discount-free line prints a bare `%`. → Clear both before producing, or accept the noise on the customer's document. ([10/02](../10-modules/02-mybooks.md) §4.1)

## 15. Record timeline / audit log (2026-08)

67. **Timeline logging is opt-in per table and only 11 tables come with it on** (and the module-owned ones among them exist only where that module is installed) (`Accounts`, `Contacts`, `Sales`, `Cases`, `Tasks`, `Activities`, `Notes`, `Emails`, `SMS`, `Conversations`, `PriceQuotes`). Everything else — `SaleRows`, `Orders`, accounting documents, `Retainers`, `Products`, `Projects`, `TimeSheet`, every custom table — records **nothing**. → Never answer "the system keeps a full audit trail" without checking `Get-Timeline-Settings` on the table in question. → Enable it deliberately during the build, not after the customer asks a forensic question. ([20/04](../20-data-model/04-system-tables-and-logs.md) §1.2)
68. **Enabling logging never backfills.** → History begins the moment the setting is saved, so a request to reconstruct past changes on a newly-tracked table is unanswerable. ([20/04](../20-data-model/04-system-tables-and-logs.md) §1.9)
69. **`delete` rows are nearly empty and invisible on the card** — they carry class, objectId, user and time, and nothing else: no field values, no parent pointers, no display text. Because the card feed filters on a pointer the delete row does not have, a deletion never shows in the record's timeline. → A customer asking "who deleted this and what was in it?" can be told *who* and *when*, never *what*. Build a soft-delete/archive flag when the answer matters. ([20/04](../20-data-model/04-system-tables-and-logs.md) §1.4)
70. **A bad mapping can permanently corrupt the audit table.** `Set-Timeline-Settings` validates the source field but not the `_Timeline` target column: a type mismatch silently writes `null`, and mapping `objectId` onto a Pointer column of a different class writes a row that makes every subsequent *full-row* read of `_Timeline` fail with `pointer to incorrect className`. `_Timeline` is read-only, so that row can be neither repaired nor deleted. → Always `Get-Schema` on `_Timeline` and `Get-Timeline-Settings` on sibling tables before choosing a column name, and rehearse on a sandbox tenant first. ([20/04](../20-data-model/04-system-tables-and-logs.md) §1.7)
71. **`Last: true` is not unique under concurrency** — parallel writes to one record (two triggers firing milliseconds apart is enough) leave several rows flagged. → Never treat `where Last = true` as "the current state"; order by `-createdAt`. ([20/04](../20-data-model/04-system-tables-and-logs.md) §1.8)
72. **`<Field>_changed` means "was in the write payload", not "the value differed"** — re-saving a field with its existing value sets the flag, and the flag is absent rather than `false` when unchanged. → Don't build "what actually changed" reports on it; diff `data` against the previous row instead. ([20/04](../20-data-model/04-system-tables-and-logs.md) §1.5)
73. **The shipped `SMS` settings cannot be re-saved** — they map String fields in `index`, which the current validator rejects. → A read-modify-write on `SMS` must strip the illegal legacy entries first, or the call fails wholesale. ([20/04](../20-data-model/04-system-tables-and-logs.md) §1.7)

## 16. Native page mechanisms & page JS (2026-08)

> Source: a platform-developer code review of a production subscription card, 2026-08-19, with every claim re-verified against the `simbla.js` source. The rules these produced are [30/03](../30-customization/03-pages-and-layouts.md) §10; the items below are the verified traps behind them.

74. **The native parent/child cascade looks broken inside an inline table row.** The parent-field lookup walks up with `closest('form…, tr.inline-form')` and stops at the inline row instead of reaching the parent form; the visible symptom is the warning `more than 2 fields found for parent`. The fix exists and was undocumented: **`data-parent-elem`**, pointing explicitly at the parent element. → Never fall back to JS option-filtering before trying it — this one cost a full working day. ([30/03](../30-customization/03-pages-and-layouts.md) §10 H-10, [30/11](../30-customization/11-field-patterns.md))
75. **`required` is not enforced on an autocomplete picker of an existing record.** The selected value is appended *after* the placeholder option, and browser validation blocks only while the placeholder is first; a regular `selectPointer` keeps the placeholder first and `required` works natively. → Until the platform fix, a short guard in `simblaobjectbeforesave`. This is the single verified exception to "use native `required`". ([30/03](../30-customization/03-pages-and-layouts.md) §10 H-08)
76. **`deleteTabs` is destructive.** Creating tabs via `Add-Edit-Tabs-Element` works; the delete action has previously wiped content from a customer card. → Do not call `deleteTabs` until it is fixed; leave stale tabs in place and rebuild the page instead. ([30/03](../30-customization/03-pages-and-layouts.md) §5)
77. **A child table on a record that was never saved queries unfiltered** — with no parent value to bind to, the widget presented rows from across the whole tenant to the user. → Until there is a native guard, hide child tables while the record is new. ([30/03](../30-customization/03-pages-and-layouts.md) §6)
78. **A child table on a card does not fire its own query on load** — measured at the network level on that card: zero requests at load, including with the tab already visible. → The native fix is `trigger('refresh')` (the table's official API) on `simblaobjectsettoform` and on `shown.bs.tab`; do not hand-build rows. ⚠️ measured on one card — check the network tab before assuming it on another page. ([30/04](../30-customization/04-table-views-and-lists.md))
79. **Deleting a parent record leaves orphan child rows** — there is no referential integrity between an entity and its child tables (measured; the general case is item 12). → A client-side delete block compensates until there is a platform mechanism; there is no `before-delete` event to hook, which is why the block is still a click interception. ([20/01](../20-data-model/01-data-model-overview.md))
80. **`Set-Page-Settings` does not clear the page cache** — the config updates while the page keeps being served from an older snapshot, so the change looks like it did not take. → Close it by writing an identical, no-op `cssCode` via `Edit-Page-CSS-JS`, which clears the cache. ([30/03](../30-customization/03-pages-and-layouts.md) §7)
81. **Container wrappers placed inside a search form render at height 0** — the fields exist in the DOM and are invisible to every user. → Hence the verification rule that applies to all page work: "exists" is not "visible". Verify by screenshot or `offsetHeight`, never by counting elements and never by `success: true`. ([30/04](../30-customization/04-table-views-and-lists.md))


## 17. Record timeline — the display layer (2026-08)

> Source: the stock `apps/mybusiness/Timeline` page and the two files it loads (`timeline4.7.js`, `unified-master.css`), read on a vanilla tenant, plus the platform's query-form serializer, 2026-08-23. Mechanics: ([20/04](../20-data-model/04-system-tables-and-logs.md) §1.11).

82. **Enabling logging on a table does not make it visible anywhere.** Recording (`Set-Timeline-Settings`) and display (the shared `Timeline` page) are independent layers, and only the 11 built-in tables arrive with both. For any other table the settings verify green, `_Timeline` fills correctly, and no user sees a thing. → Treat "the timeline is on" as half the job; the display half is a page change on a shared page, per tenant, every time. (([20/04](../20-data-model/04-system-tables-and-logs.md) §1.11)
83. **Only 6 classes can host a timeline feed at all** — `Contacts`, `Tasks`, `Accounts`, `Sales`, `Cases`, `Activities`. That is the renderer's built-in default whitelist, narrower than the 11 tracked tables: `Notes`, `Emails`, `SMS`, `Conversations` and `PriceQuotes` appear *inside* other entities' feeds but their own cards show none. Extending it means writing the whole `window.timelineClasses` array — defaults included — into the page's `metaTags`; sending only the new class disables the feed on every built-in card in the tenant. → The diagnostic is `timeline load disabled` in the console. (([20/04](../20-data-model/04-system-tables-and-logs.md) §1.11.1)
84. **A timeline filter field wired with `.val()` alone is silently always-empty.** The `_Timeline` scoping columns are Pointers, and the query form serializes a value as a pointer only when the input carries **both** `select-pointer` and `targetclass` — which is what the platform's own wiring does for the 6 built-in classes. Measured: the same filter as a bare string returns 0 rows, as a pointer 27. → Copy the platform's three-line pattern in full; a partial copy presents as "the timeline is empty" and sends the investigation to the data instead of the page. (([20/04](../20-data-model/04-system-tables-and-logs.md) §1.11.2)
85. **A new entry type gets no colour and no rail, and can render under every row.** The master stylesheet gates visibility and paints the badge circle + rail for the 11 shipped types only; an unlisted type inherits a white badge on a white panel, no rail, and — absent its own hide rule — shows under entries of every class. → Four CSS rules per new type (hide, show-for-its-class, badge colour, rail colour), with a colour checked against the shipped palette. (([20/04](../20-data-model/04-system-tables-and-logs.md) §1.11.4)
86. **Hebrew verb gender in a timeline entry is a heuristic, not a setting.** The renderer picks the masculine `נוצר`/`עודכן` only when the entry title contains `לקוח` or `איש קשר`, and the feminine `נוצרה`/`עודכנה` otherwise — so a masculine entity name reads wrong. The renderer is a shared static file served to every tenant. → The only correct lever is the title wording in the entry template; never patch the shared file for one customer. (([20/04](../20-data-model/04-system-tables-and-logs.md) §1.11.6)


## 18. Cards on the ticket shell — `MasterTicket` (2026-08)

> Source: a live `Create-Table-View-Page` copy of `apps/mybusiness/Case`, plus the served `MasterTicket3.2.js` and `case4.3.js`, measured 2026-08-23. Mechanics: ([30/03](../30-customization/03-pages-and-layouts.md) §2a).

87. **A copied card page keeps the source's form binding, while looking rebound.** `Create-Table-View-Page(copyFromPageId)` rewrites the form's `name` attribute to the target class but leaves `data-simbla-class` — the attribute `createSimblaObj()` actually reads — pointing at the source class. `Get-Page-Content(minimal: true)` shows only `name`, so the page passes inspection while every save lands in the source table and leaves an empty record there. → Read the `<form>` tag from the **full** page content, never the minimal view; and count records in the source class before and after a save test. ([30/03](../30-customization/03-pages-and-layouts.md) §2a)
88. **A `<form>` element cannot be rebound, moved or deleted through MCP** — and is not even addressable: `move-existing-object` and `set-html-content` on the form id both answer "element not found"; there is no element-delete action; `Set-Page-Settings` exposes no binding parameter; `Set-Page-Version` refuses another page's version id. → The working shape is additive — `Add-Container-to-Page(afterElement: "<form id>")` (which *does* resolve that id) plus a correctly-bound form injected into it, and the inherited form removed in page JS at load. The permanent removal is a manual delete in the page editor. ([30/03](../30-customization/03-pages-and-layouts.md) §2a)
89. **The ticket-shell contract is undeclared and fails in total silence.** `MasterTicket` gates both save handlers on `if (!formSubmit === true) { return; }` and never defines `formSubmit`; a page whose JS omits it has every save button do nothing — no error, no console line, no request. The same page JS also owns `entity`, `saveEditAction`, `redirectTo`, the `checkIsModal()` call and the `.SaveAndStay` wiring. A copied page inherits the source's `jsFile` and therefore works until that file is repointed. → Copy the contract block from the tenant's own built-in card file before repointing `jsFile`. Product ask: a `typeof formSubmit === 'undefined'` warning in the master would turn a day of debugging into one console line. ([30/03](../30-customization/03-pages-and-layouts.md) §2a)
90. **The ticket shell hides half of itself in `Mode=Modal` and on new records.** `checkIsModal()` hides the timeline column and widens the form column whenever there is no `oid`, and in `Mode=Modal` additionally hides every `.simbla-table` and `.statusRow`. So a card opened as a related record from another card shows **no child tables**, and a newly created record shows no timeline until the column is restored by reversing the class swap. → Design the card knowing its two modes; restore the column after the first save. ([30/03](../30-customization/03-pages-and-layouts.md) §2a)


## 19. External-form intake — endpoint naming (2026-08)

> Source: live probes against `api.mbapps.co.il` plus the deployed cloud-function inventory, 2026-08-24. Mechanics: ([40/03](../40-integrations-api/03-web2lead-web2table.md)).

91. **The "web2lead" endpoint does not exist — the function is `getlead`.** `POST /functions/{appId}/web2lead` answers `400 {"error":"User function not found"}`; the lead-intake function is deployed as `getlead` and the URL segment is always the deployed function's own name (there is no name-mapping layer, contrary to what these docs asserted as UNVERIFIED until 2026-08-24). `web2table` is both the pattern name and the function name, which makes the pair look symmetrical and hides the asymmetry. → Treat "web2lead" as the name of the mechanism only. Confirm any function's URL by POSTing `{}` and reading whether you get its own validation error or `User function not found`. ([40/03](../40-integrations-api/03-web2lead-web2table.md) §1, [40/04](../40-integrations-api/04-cloud-functions.md))
92. **The gateway rewrites a function's status code.** The intake functions answer `422` with a plain-text body; what the caller receives is **HTTP 400 with JSON** `{"error": "<the function's text>"}`. A client branching on `422` will never match, and a client branching on `400` cannot tell a validation failure from a wrong endpoint without reading the message. → Branch on the `error` string. ([40/03](../40-integrations-api/03-web2lead-web2table.md) §3)

## 21. Build mechanics that shape a design (2026-09)

Verified in a live build on 2026-09-27; each one changes what a design may assume.

94. **`formula-value` computes numbers only — a date + N months is a trigger.** A form rule cannot add months to a date. The native shape is one data-change trigger per term value (`ServiceTermMonths = N` → `ServiceEndDate` = dynamic `ServiceStartDate` with `timeGap` = round(N × 30.4375) × 1440 minutes); accuracy ±1 day against the calendar. ([30/07](../30-customization/07-form-rules.md), [30/06](../30-customization/06-triggers-and-automations.md))
95. **An update written by a trigger does not fire other triggers on the same record** (the write carries `dontRunSimblaTriggersUpdate`), but it **does** fire the update trigger of a record in another table. → When two fields must be set from one event (start date *and* end date), set both in the same action; don't chain two triggers on one record. ([30/06](../30-customization/06-triggers-and-automations.md))
96. **A dynamic trigger value through a pointer needs the class name in the middle.** `{"type":"dynamic","value":"CaseId.Cases.AccountId","targetClass":"Accounts"}` works; `"CaseId.AccountId"` runs, logs no error in `_syslogTriggers`, and writes nothing. → Read the record back after the first test. ([30/06](../30-customization/06-triggers-and-automations.md))
97. **`Set-Trigger` with `onSetFields: []` creates no trigger** — the call returns an error string instead of the schema. → Pass at least one watched field (e.g. the pointer the criteria test). ([40/02](../40-integrations-api/02-mcp-tools-catalog.md))
98. **A related-records table switched to "create" still has no way to create.** `Edit-Table-View(tablePermissions.allowCreate: true)` sets the attribute only; the table also needs a `db-form-add` button in its header (`set-html-content`) and an `action` column — without the column the inline new row has no save icon and Enter does nothing. The saved row inherits only the parent pointer of the card; any other pointer (e.g. the customer of the parent record) must be filled by a trigger. ([30/04](../30-customization/04-table-views-and-lists.md), [30/03](../30-customization/03-pages-and-layouts.md) §6)
99. **An e-mail trigger action without an SMTP account is dropped silently.** `Set-Trigger-Action(email, emailAccount: "")` returns success, but the trigger has no action (visible only in `Get-Triggers`). → Treat outbound e-mail as blocked until an SMTP account exists; prepare the templates and add the action afterwards. ([30/06](../30-customization/06-triggers-and-automations.md))


## 22. Card layout & aesthetics (2026-10)

Verified on the playground on 2026-10-06 (page runtime source + computed styles in the browser).

100. **A form rule's `hidden` leaves the grid column standing.** Only the field's `.form-group` is hidden: a field hidden mid-row leaves a hole, a fully hidden row still leaves ~21px, and a hidden field in a stacked column pulls the fields below it out of line. → Give conditional fields their own row(s) per condition, or the last column of a row. ([30/07](../30-customization/07-form-rules.md) §8)
101. **MCP-created headings carry no `TicketHeadline` class.** `Add-Edit-Text-Element(H2)` and `Create-Form-Page`'s title emit a bare `<h2>`; on a `MasterTicket` card it renders 24px/600 next to the built-in 18px/400. → Add the class with `Edit-Page` `set-html-content` on the `tcH` element. ([30/03](../30-customization/03-pages-and-layouts.md) §4)
102. **On a `MasterTicket` card `h3`/`h4` render heavier than the section heading** (600/500 against 400), and an inline `font-size` inside a heading survives the master. → Sub-headings get a page-CSS size/weight rule; headings carry plain text only. ([30/03](../30-customization/03-pages-and-layouts.md) §4)
103. **`edit-row` to fewer columns drops fields from the page.** `[4,4,4]` → `[6,6]` with a field in column 2 answers success and the field is no longer on the page. → Empty the columns that will disappear before the re-grid. ([30/03](../30-customization/03-pages-and-layouts.md) §3)
104. **Moving a field into an occupied column stacks it, without an error.** → Vacate target columns first in the same ordered batch; re-read before continuing. ([30/03](../30-customization/03-pages-and-layouts.md) §3)
105. **No String field becomes a textarea by itself.** `add-new-field` stores `Comment`/`Description`/`Notes` as single-line inputs like any other String. → Store textarea markup with `set-html-content`. ([30/03](../30-customization/03-pages-and-layouts.md) §9)
106. **A Boolean added through `Edit-Page` renders its caption twice.** → Rewrite its `.form-group` with the built-in checkbox markup (outer label empty + hidden) via `set-html-content`. ([30/03](../30-customization/03-pages-and-layouts.md) §3)

## 23. Public forms — anonymous visitors (2026-10)

Verified on the playground on 2026-10-09 (anonymous browser context + tokenless REST probes; platform source read). Fact source: [30/15](../30-customization/15-public-forms.md).

107. **Tokenless anonymous creates are always refused** (`code 119` "…without a valid CAPTCHA"), whatever the CLP; only a page of the tenant's CRM site that renders the platform reCAPTCHA can obtain a token. `code 119` is also the code of a CLP denial — read the message. → CRM-hosted form: native Database form + `create:"*"` on a dedicated intake table; external form: `web2table`/`getlead`. ([30/15](../30-customization/15-public-forms.md) §2.1)
108. **A reCAPTCHA token is accepted for 120 seconds** after the challenge. → A visitor who ticks and waits is rejected and must tick again; the form resets the widget. (§2.1)
109. **Anonymous updates are not CAPTCHA-gated.** With `update` open to `"*"`, anyone holding a row id can overwrite it with a plain `PUT`. → Never open `update` publicly on anything that matters; public "updates" go through an intake row + projection trigger. (§2.4)
110. **A public `get` serves every column, and `protectedFields` cannot be set through MCP** (the key is dropped silently). → A table opened for public `get` holds only what the page may show — a dedicated invite table, never the business table. (§2.3)
111. **Every dropdown on a public form makes its lookup table public** (options load with an anonymous `find`). → Only non-sensitive lookups on public forms. (§2.3)
112. **Unknown field names in an anonymous save are dropped without an error** (`addField:{}`, which `Set-Table-Permissions` always writes). → Diff the form's `name=` attributes against the schema before go-live. (§2.5)
113. **`Create-Form-Page` cannot produce a public page** — its source page's master redirects anonymous visitors to login. → Clone a master-less public page with `Create-Table-View-Page(copyFromPageId)` to a root-level name; the clone keeps the source's title, CSS and `data-simbla-class`. (§3.1)
114. **File inputs do not work for anonymous visitors on a native form** — the upload is refused (`209 invalid session token`) and the page reloads, losing every answer; tokenless REST uploads succeed. → No file fields on public native forms; collect files through `web2table` (File object) or a portal. (§3.9)
115. **A radio group cannot be a form-rule condition**, and conditions on a plain `select`/text field compare as strict strings (`equalTo`/`notEqualTo` only). → A rating that drives a rule is a `select` with string values or an `input type=number`. (§3.6)
116. **`simbla-capture-data` needs the invisible reCAPTCHA and one `Config` row `CaptureData<Table>` per table**; the visible widget fails ("using invalid captcha keys"), a missing row fails ("missing config for table"); rows are stamped `createdBy = Master`. (§4)
117. **`getlead` answers `{result:{success,leadId}}`**; both endpoints' errors arrive as HTTP 400 + `{error}` — integration code that reads `success` or branches on 422/403 is wrong. ([40/03](../40-integrations-api/03-web2lead-web2table.md) §3–4)
118. **`getlead` matches phone formats only for a digits-only `PhoneNumber`** — `+972-50-…` is compared exactly and misses an existing `0500000098`. → Send digits only. ([40/03](../40-integrations-api/03-web2lead-web2table.md) §3)
119. **`web2table` adds 7 columns to the target table and names unnamed rows `פניה ראשונה` / `MainLandingPage`.** → Aim it only at intended intake tables (MCP cannot delete columns); send `table_Name`, `CampaignName`, `PageName`. ([40/03](../40-integrations-api/03-web2lead-web2table.md) §4)

## Limitations & gotchas

- This list is curated, not exhaustive — every section doc ends with its own `Limitations & gotchas`; check there for domain detail.
- Items referencing open product tickets **expire** — re-verify status before citing in a customer-facing document.

## Chatbot authoring and simulation (2026-09-16)

- A valid ChatBots record can still have an uneditable or disconnected visual graph. Native action metadata, real branch child nodes, matching values/outcomes and relative coordinates are required. MCP-only writes do not demonstrate the browser settings-refresh callback.
- The playground simulates record operations, routing and handoffs; reaching a step does not prove a CRM write, webhook or assignment. AI replies can invoke the live AI service. Validate editor, save round trip, playground and actual runtime separately.
- The observed toolbar add-step flow could save an edge with an absent source. Verify all endpoints after native creation too. See [chatbot authoring](../30-customization/14-chatbot-authoring.md) for the observed contract and required checks.
