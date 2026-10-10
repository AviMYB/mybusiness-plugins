---
name: myb-p-chatbots
description: "Build, edit, repair and verify MyBusiness MyChat chatbots using BOTH MyBusiness MCP and the actual browser editor. Use whenever a user asks to create a chatbot, build a WhatsApp bot, design a conversation flow, add an AI agent to a bot, fix broken chatbot nodes/options/layout, or turn a valid database graph into a working visual bot — צור צ׳אטבוט, בנה בוט, הקמת צאטבוט, שיחה אוטומטית, בוט וואטסאפ, סוכן AI בצ׳אטבוט, תקן מפת בוט, אפשרויות משובשות. Prefer this over generic table-writing or page-building skills for the MyChat bot canvas. NOT for analytical dashboards (myb-p-dashboards), ordinary CRM triggers (myb-p-trigger-setup), or designing a separate website chat widget. Browser verification is part of completion, never an optional screenshot."
---

# MyChat chatbot builder

Produce a bot that can be understood, edited and tested by its owner. A successful database write is only the first checkpoint. Deliver the actual saved bot, a clear map and evidence of its tested conversation paths.

## Knowledge sources

Read **`../myb-p-kb/references/30-customization/14-chatbot-authoring.md` in full before authoring**. It is the graph, action, UI-save and verification contract; do not guess its fields from memory.

Read on demand:
- `../myb-p-kb/references/10-modules/04-mychat.md` — module and channel context.
- `../myb-p-kb/references/20-data-model/03-module-tables.md` — related table map.
- `../myb-p-kb/references/20-data-model/05-field-types-and-conventions.md` — record field types.
- `../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md` — exact current tool parameters.
- `../myb-p-kb/references/40-integrations-api/05-messaging-channels.md` — channel delivery requirements.
- `../myb-p-kb/references/80-capability-matrix/02-known-limitations.md` — relevant limitations.
- User guides linked from https://www.mybusiness.co.il/support-cata/chatbots/ when a feature is unfamiliar; verify against the current editor.

MCP inventory: `Get-Schema`, `Get-Triggers`, `Get-Data`, `Create-Data`, `Update-Data` through the connected MyBusiness server. Discover actual tool signatures. Browser inventory: list/open/select pages, snapshot, click/fill/type/select, evaluate DOM, screenshot, console/network inspection. Names depend on the browser connector; use available tools and fresh page/element IDs. Never claim a missing MCP or browser connection is working.

## 1. Establish scope and access

1. Confirm intended tenant, bot purpose/audience, language, channels, intended outcomes and whether this is a draft or activation. Reuse supplied context; ask only for material missing decisions. For an unspecified example choose a fictional service scenario and state assumptions.
2. Verify the same application ID in the browser and MCP. Read the table schema and triggers. If access fails, diagnose the configured connection; do not write to a different available tenant.
3. Inventory existing bots and relevant dependencies with minimum fields. Zero matches → build new; one → inspect; multiple names → distinguish by record ID. Keep originals unchanged unless editing them is the explicit task.
4. Draft bot creation/testing is authorized by a build request. External sends and changes to a live channel require the appropriate existing authorization. Keep test bots inactive and unbound unless the requested test/deployment says otherwise. Do not invent additional approval steps for ordinary reversible demo work.
5. Give parallel builders separate records and browser pages. Pass an explicit page ID for every browser action. A browser connector may own a single profile: use a supported shared connection or serialize browser work when concurrent workers cannot attach. Recover access without closing unrelated user windows.

## 2. Design the conversation and tests together

Write a compact flow plan: entry → intent choices → information needed → actions → final outcome. For each branch state what the customer sees, what is saved, when a human becomes involved and what can fail.

Include a variable ledger (name, type, where introduced, consumers), dependency list and scenario matrix before building. Cover every offered branch and alternate outcome; useful content and an honest next step matter more than node count. Avoid unnecessary questions, unsupported claims, dead-end menus and unbounded loops.

Translate each client outcome into a concrete assertion before building: display the actual requested status, answer the supplied policy question correctly, preserve both updates after a second update, and avoid duplicate records on a returning-customer path. Reaching a later node or finding a generic keyword does not satisfy those assertions. If updates must accumulate, distinguish an append-only history from a last-update summary.

Use the reference's simulator preflight before making personalization, input validation or CRM actions acceptance criteria. If those are required, keep their tests even when the platform fails them. For an open-ended demonstration, choose a useful flow whose essential content is supported by the available test surface; do not introduce broken dynamic text just to display a feature. Preserve the failure report for any separate diagnostic bot.

Choose a coherent map layout. Give each step a short internal name and each customer message one clear purpose. Plan room for nested branch choices and terminal lanes using the reference's layout guidance.

Review the actual composition, not only a layout score: related decisions should stay together, all map bounds must be visible in the overview, and a detail view must be readable. Correct layout without rewriting already-tested conversation content; then save, reload and recheck it.

## 3. Learn the target editor's actual contract

1. Inspect a representative working bot through MCP AND the browser. Select examples by their action types, not just by name or number of nodes.
2. Create a small disposable draft through the native editor containing each unfamiliar action. Save the step and bot, then re-read it through MCP. Compare with the canonical reference; resolve differences before scaling up.
3. Verify both how a node renders and what its pencil opens. Record the minimal payload the current editor produces, excluding transient fields and tenant-specific secrets.
   Wait for rich-text initialization and read the actual editor body, including its frame if present. An empty DOM query is not proof that stored content is empty or correct. Compare displayed text with the saved message.
4. Follow the reference's action-specific checks for branching, data operations, AI, hours, jumps and outbound calls. For unsupported/unverified mechanics, use the native settings form and test the result; do not manufacture a plausible JSON shape.

When AI is required, test a real answer on the small specimen before scaling the graph: one specific fact from the supplied policy, one unsupported request, and the exits. Verify source selection/readiness separately from answer quality. Correct saved instructions or an active source flag alone are not evidence of grounded answers.

## 4. Build with MCP and the editor

Use the browser for canonical settings and special controls; use MCP for inventory, complete graph assembly, safe deterministic edits and readback. Neither surface substitutes for the other's verification.

Before any update, save a sanitized baseline and recheck updatedAt. Read → merge → write entire array/object values. Preserve unrelated nodes, fields and settings. If another editor changed the record, reconcile rather than overwriting. For many records inspect trigger behavior and choose suppression only when a supported tool and the task require it; never invent a skip flag.

Create new bots with a provisional working name; reserve the final name for the genuine browser save. Assemble the graph using the reference's node/child/edge contracts. Resolve all lookup IDs against the current tenant. Validate the complete graph before sending it, then read it back by returned record ID.

After MCP writes, close/reload stale editor state before editing. Open the new record from a fresh list. Apply the final name and any required native form settings, save, and verify the browser's settings refresh as described in the reference. Save defaults through their own form when changed. Do not activate or change a channel to force synchronization.

Treat an HTTP rejection as a failed write: verify what was actually created before retrying. Isolate the rejected field and use the native editor or a supported equivalent representation. Follow the reference's rich-text caveat; never bypass access controls, claim success from a partial write, or change deployment settings to obtain permission.

## 5. Mandatory verification gates

Do not finish until every applicable gate has evidence:

1. **Stored graph:** intended record and deployment state; unique IDs; no orphan parents/edges; option/outcome parity; every branch reaches an intended endpoint; variable references and dependency IDs resolved; no placeholders.
2. **Visible editor:** fresh load, whole-map screenshot and readable detail views; no unintended overlaps, hidden branch ports or disconnected steps. Open the settings of every action type and every complex/branching node. Verify meaningful fields, not just that a modal appeared.
3. **Save round trip:** save through the native UI, observe the expected refresh, reload, re-read with MCP and compare semantic graph/configuration. The browser must be able to edit the bot after reload.
4. **Conversation:** execute the scenario matrix in the playground, resetting between cases. Check variable substitution, every menu branch and terminal outcome. Include invalid/retry cases that the test surface actually supports. Inspect new console errors and relevant requests; separate pre-existing page noise from errors caused by this bot.
   Poll the actual expected UI state with a bounded timeout and select options from the current prompt, not matching historical buttons. Distinguish a mistyped expected label or premature test assertion from a product failure, preserve the first result and rerun after correcting the harness.
5. **Runtime claims:** follow the reference's simulation boundary. A passed playground does not prove a CRM mutation, webhook, validation or representative assignment. If live tests are authorized, verify logs and resulting records/assignment; otherwise record these as untested and describe exactly what remains.

If any gate fails, identify the cause, fix the saved bot, reload and rerun the failed scenario plus paths affected by the change. Do not hide a failed test by weakening its requirement. Recheck layout after changing branch counts.

For a suspected platform defect, reproduce once in a fresh conversation with native browser input, compare the saved configuration, and record the observed/expected result. Distinguish `failed` from an unsupported `not_tested` check. Do not patch app code or framework state to make an evaluation pass. Keep required behavior explicitly unresolved; if the brief allows a different design, document the alternative and test it as a new case rather than relabeling the failed case.

## 6. Deliver and hand off

Return the final bot name and record ID, a usable tenant page link, draft/active and channel state, a short description of what it does, tested paths and explicit remaining runtime checks. Include screenshots of the actual saved map and a representative conversation. For a requested report use `../myb-p-kb/assets/doc-template.html`; save under the current task folder.

Keep a compact test table: scenario, input, expected outcome, actual outcome, evidence, status (`passed`, `failed`, `not_tested`). Distinguish editor, playground and live-channel evidence. Export a sanitized blueprint only if useful; exclude auth headers, tokens, personal data and IDs from unrelated tenants.

For a complex scenario, report editor configuration, route traversal, displayed content and server effects as separate checks. A route can pass while its required status text fails and its database mutation remains untested; preserve all three results. Carry unresolved client requirements into the handoff instead of replacing them with narrower success criteria.

## Known limitations

- Requires an authenticated browser editor and a working MyBusiness data connection for full completion. If one is unavailable, continue independent planning/research, diagnose access and clearly mark the unverified part.
- Current graph mechanics and simulator boundaries live in the referenced authoring document and can change by version. A fresh UI-created specimen plus save/reload is required compatibility evidence.
- Configuring a node is not evidence of external delivery or server execution. Never label a draft bot production-ready solely because the map and playground look correct.
