---
name: myb-p-kb
description: "MyBusiness CRM product knowledge base (librarian). Use whenever you need authoritative product facts - 'can MyBusiness do X?', capability/fit-gap classification, module behavior (CRM core, MyBooks, MyCampaigns, MyChat, MyCollege, TimeSheet), data model and field conventions, customization grammar (pages, table views, dashboards, reports, triggers, form rules, permissions, terminology, quote templates, portals), API/MCP tool parameters, known limitations, or the implementation methodology (discovery/אפיון, fit-gap, technical spec, implementation plan). Triggers - 'האם המערכת יודעת', 'מה המוצר תומך', capability question, fit gap, מסמך אפיון, product documentation, איך עובד הטריגר, מבנה הנתונים. This skill ROUTES to reference files; read only the files you need."
---

# MyBusiness CRM — Product Knowledge Base (Librarian)

All product facts live in `references/` (generated from the canonical docs — do not edit references directly). **Read selectively**: open only the file(s) the routing table points to. Every file starts with a Purpose line and ends with `Limitations & gotchas`.

## Routing table

| You need... | Read |
|---|---|
| "Can the product do X?" / fit-gap classification | `references/80-capability-matrix/01-capability-matrix.md` → then ALWAYS check `references/80-capability-matrix/02-known-limitations.md` before answering "yes" |
| First orientation / what is this product | `references/00-overview/01-product-overview.md` |
| Architecture, page model, auth | `references/00-overview/02-architecture.md` |
| Hebrew↔English term for anything | `references/00-overview/03-glossary.md` |
| Module behavior (flows, pages, entities) | `references/10-modules/01-crm-core.md` … `07-myinbox-and-misc.md` (numbered per module) |
| Tables, fields, types, wire formats (Pointer/Date JSON), naming conventions, multi-select & cascading field mechanics | `references/20-data-model/05-field-types-and-conventions.md`; full model: `01`–`04` in same folder |
| Building/editing pages, views, dashboards, reports, menus | `references/30-customization/01-customization-overview.md` (map + build order) → detail docs `02`–`05` |
| Triggers & automations grammar (events, conditions incl. the canonical `equesition` shape, actions, scheduled, chains, **API-write behavior**) | `references/30-customization/06-triggers-and-automations.md` |
| Form rules | `references/30-customization/07-form-rules.md` |
| Users, roles, CLP permissions | `references/30-customization/08-users-roles-permissions.md` |
| Terminology renaming | `references/30-customization/09-terminology-localization.md` |
| Quote/PDF templates | `references/30-customization/10-price-quotes-documents.md` |
| Field patterns (multi-select, parent-child, timestamp) | `references/30-customization/11-field-patterns.md` |
| Proven solution blueprints (SLA, import, web2lead, entity, automation pack) | `references/30-customization/12-solution-blueprints.md` |
| Customer-facing portals | `references/30-customization/13-customer-portals.md` |
| REST API / MCP tool parameters | `references/40-integrations-api/01-parse-rest-api.md`, `02-mcp-tools-catalog.md` |
| External form intake (web2lead/web2table) | `references/40-integrations-api/03-web2lead-web2table.md` |
| Server-side extension model | `references/40-integrations-api/04-cloud-functions.md` |
| Messaging (email/SMS/WhatsApp) & files | `references/40-integrations-api/05-messaging-channels.md`, `06-files-and-storage.md` |
| What the UI looks like (screenshots) | `references/50-ui-walkthrough/01-runtime-app-tour.md`, `02-admin-builder-tour.md` |
| Run a discovery (אפיון) / fit-gap / write a technical spec / build an implementation plan | `references/60-implementation-methodology/01`–`06` + fill-in templates under `references/60-implementation-methodology/templates/` |
| Published user guides & FAQ | `references/90-appendices/01-support-site-catalog.md`, `02-faq-troubleshooting.md` |

## Usage rules (binding)

1. **Live system beats documents.** Before promising behavior on a specific tenant, verify with read-only MCP calls (`Get-Schema`, `Get-Triggers`, `Get-Site-Pages`…) — tenant schemas diverge.
2. Anything marked **⚠️ UNVERIFIED** must be verified before being relied on or promised.
3. Capability answers use the level ladder: `Native / Config / Custom-JS / Custom-Server / External / Gap` — defined in `references/60-implementation-methodology/03-fit-gap-analysis.md` §2.
4. Claims citing ticket numbers or "in QA" **expire** — re-verify at use time.
5. If you discover the docs are wrong, say so explicitly in your answer and flag it for the maintainers (do not silently work around it).
