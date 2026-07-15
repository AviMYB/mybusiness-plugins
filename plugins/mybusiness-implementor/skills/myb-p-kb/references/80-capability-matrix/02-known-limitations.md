# Known Limitations & Sharp Edges — מגבלות ידועות

> **Purpose:** Every verified limitation, gotcha, and platform sharp edge in one place — so fit-gap doesn't over-promise and builders don't step on landmines.
> **Audience:** Implementers, developers, AI agents — read before classifying anything as "Config" and before any build/migration.
> **Last updated:** 2026-06-23 (MyCollege 2026-06 rework) · **Status:** draft — living document.

Format per item: **the edge** → why it bites → what to do.

---

## 1. Triggers & automation

1. **Triggers DO fire on API/master-key writes — live-verified 2026-06-10** (`Create-Data`, `Update-Data`, `Create-Many` all fire; an earlier internal claim to the contrary was wrong). → The real trap is the opposite: **bulk imports storm automations by default** (mass emails, mass child rows). → Suppress deliberately with `Create-Many(skipTriggers: true[, skipTimeline: true])` and backfill trigger-derived fields (timestamps, SLA stamps) in the import — or deactivate notification triggers for the window. Single-record tools and REST `/batch` have **no** skip flag. ([30/06](../30-customization/06-triggers-and-automations.md) §9)
2. **Trigger chains max 3 levels.** → Deep automation cascades stop silently. → Design flat; use one-time flags for idempotency. ([30/06](../30-customization/06-triggers-and-automations.md))
3. **Scheduled-trigger param is literally `shcedulerHours`** (misspelled) and **value `0` is rejected via MCP** (tool-guide vs verified behavior conflict). → Copy the canonical shape from the doc, not from intuition. ([30/06](../30-customization/06-triggers-and-automations.md))
4. **No trigger deletion via MCP** — deactivate only; delete in UI. ([30/06](../30-customization/06-triggers-and-automations.md))
5. **Native SLA engine is known-buggy** — the SLASettings-driven runtime doesn't compute reliably. → Use the trigger-built SLA blueprint / productized `SLA-*-v2` functions. ([30/12](../30-customization/12-solution-blueprints.md))
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
21. **Compound reports and report deletion are REST-only.** ([30/05](../30-customization/05-dashboards-and-reports.md))
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

33. **WhatsApp channel identity = `Identity` field on Channels, NOT `objectId`** — the classic integration bug. ([40/05](../40-integrations-api/05-messaging-channels.md))
34. **Business-initiated WhatsApp only via Meta-approved templates within the 24h-window rules**; template approval latency is a calendar risk; `Get-WhatsApp-Template-Params` unreliable with ≥2 params. ([40/05](../40-integrations-api/05-messaging-channels.md))
35. **Email sending requires per-user/per-app SMTP setup** (playground has none configured by default); calendar invites need per-user SMTP. ([10/03](../10-modules/03-mycampaigns.md))
36. **Quote templates:** no `<script>` allowed (breaks rendering); MCP-created templates can't carry fillable inputs (escalated bug) — create those in UI. ([30/10](../30-customization/10-price-quotes-documents.md))

## 8. Intake & integrations

37. **web2lead always inserts** (duplicate → new row flagged duplicate, no merge); **web2table creates but never updates linked Accounts**; deployed web2table requires `phone` and reads `AcceptWebToTable` (repo vs skill drift). → Spec intake field contracts from [40/03](../40-integrations-api/03-web2lead-web2table.md), not from memory.
38. **The `Config` table is fully MCP-restricted** (holds AcceptWeb*, PBX, Twilio, payment settings) → diagnosing/enabling these needs UI/REST/dev. ([40/04](../40-integrations-api/04-cloud-functions.md))
39. **CDR phone matching uses last-7-digit endsWith** — collision risk on shared lines. ([40/04](../40-integrations-api/04-cloud-functions.md))
40. **Landing-page form contract has a doc bug** (`F_name` listed for both first/last name) — verify the last-name key on a test lead. ([10/03](../10-modules/03-mycampaigns.md))

## 9. Environments & ops

41. **No staging environment**; the tenant-clone op **overwrites the destination completely**; no config diff/merge between apps. → Prototype in Playground; treat prototypes as specs; rehearse migrations on clones. ([00/04](../00-overview/04-environments-and-access.md))
42. **No trigger on/off console for testing windows** — field practice uses date-criterion hacks or "מבוטל" naming.
43. **File deletion/quota management has no self-service** — `outOfStorage` is flagged via the reseller API. ([40/06](../40-integrations-api/06-files-and-storage.md))
44. **One shared deployment serves nearly the whole fleet** — platform incidents are platform-wide. ([00/02](../00-overview/02-architecture.md))

## 10. Module maturity flags

45. **MyCollege (reworked 2026-06):** lessons & attendance now have dedicated tables (`Lessons`/`LessonAttendance`) and a few automations ship (enrollment-counter trigger; capacity + duplicate-enrollment block client-side; single-lesson scheduling-conflict via cloud fn). Still gaps: multi-state attendance (`Presence` Boolean), flexible/holiday-aware series (fixed-interval), certificates, student reminders, reports/dashboard, waiting-list auto-promotion. **Legacy installs still reuse `Activities`/`ActivityAdditionalAccounts` with zero triggers — confirm per tenant.** ([10/05](../10-modules/05-mycollege.md))
46. **MyChat ergonomics** (quick replies, round-robin, signatures) were in QA as of 2026-06 — verify before promising. ([10/04](../10-modules/04-mychat.md))
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

55. **Portal pages suffer first-load race conditions** — page JS can run before the dbForm has loaded the logged-in user's record (a field-observed refresh bug: intermittent empty forms/tables). → Bind logic to the account-loaded event (the safe pattern in [30/13](../30-customization/13-customer-portals.md)); never assume data at DOMContentLoaded. ([30/13](../30-customization/13-customer-portals.md))
56. **Portal logout lands users on the staff login** unless a loginUrl redirect/cookie is set (a field-observed portalmaster fix). → Include logout-redirect handling in every portal master JS. ([30/13](../30-customization/13-customer-portals.md))
57. **Cloning a portal tenant breaks hardcoded role objectIds** — role ids change on the tenant-clone op while most system-table ids survive; server functions referencing role ids must be re-pointed after every clone. Related: `allowedRoles` gates pages by role **name string**; and some tenants store portal passwords as plain Account fields sent via SMS (accepted risk — flag in security reviews). ([30/13](../30-customization/13-customer-portals.md))
58. **Server-side row-level scoping (advanced permissions) is per-tenant optional and invisible to API tools** — CLP is table-wide, element criteria are UX-only. A tenant without it has no row fence against raw REST queries from a portal session. → UI-configure per table (staff exemptions included), document in the spec, and run the REST isolation test with a real portal user before every go-live and after every permission change. ([30/13](../30-customization/13-customer-portals.md))
59. **`find: requiresAuthentication` on lookup tables exposes them to every portal user** — value-bearing lookups (coupon/voucher codes, price agreements) become enumerable by any logged-in external user; `_User` rows carry a public-read ACL by default, so portal sessions can often enumerate the whole user list. → Lock sensitive lookups to staff roles and validate codes inside a server function; restrict the `_User` CLP for portal audiences. ([30/13](../30-customization/13-customer-portals.md))
60. **The built-in OTP login page (`PortalLoginOTP`/`loginOTPForm`) is not in the vanilla install** — it arrives with tenant-level `enableOTP` provisioning. Triggers also cannot add users to roles — trigger-provisioned portal users need a separate role-attachment step (users tool or a server function). → Plan OTP enablement + role attachment explicitly in every portal build. ([30/13](../30-customization/13-customer-portals.md))

## Limitations & gotchas

- This list is curated, not exhaustive — every section doc ends with its own `Limitations & gotchas`; check there for domain detail.
- Items referencing open product tickets **expire** — re-verify status before citing in a customer-facing document.
