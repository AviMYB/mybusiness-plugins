# Chatbot authoring: persisted graph, visual editor and verification

> Purpose: the contract for building MyChat chatbots with MCP and the browser together.
> Last updated: 2026-09-16. Evidence: live editor, a new UI-created bot, 12 existing bots, and the JavaScript loaded by that editor. Channel delivery and all server actions are NOT proven by the browser playground.

## Contents
1. Evidence and access
2. Persisted graph
3. Action payloads
4. Browser authoring and save lifecycle
5. Conversation design and map layout
6. Verification and troubleshooting
7. Sources and limits

## 1. Evidence and access

The visible editor is `apps/mychat/chatbots` on the current tenant's host. A new-bot dialog can be opened with `#newBot=1`; selecting an existing bot does not necessarily put its ID in the address bar. The list row's name cell has the record ID in its `title` attribute. Use the live row and its edit button, not a guessed deep link.

MCP: `Get-Schema(className:"ChatBots")`, `Get-Triggers(tableName:"ChatBots")`, `Get-Data(table:"ChatBots",...)`, `Create-Data(table:"ChatBots",data:{...})`, `Update-Data(table:"ChatBots",objectId,data:{...})`. These are general data tools, not a dedicated graph compiler. Check the current tools' schemas.

The observed table fields are `Name:String`, `Active:Boolean`, `ChannelId:Pointer→Channels`, `Nodes:Array`, `Edges:Array`, `Conditions:Array`, `DefaultMessages:Object`, `ExecutionCount:Number` plus normal audit fields. Do not infer conditions syntax from the field name. It was not part of the observed editor's normal save mapping.

Compare the browser's application ID to the MCP target before any write. An authenticated browser on another tenant is not confirmation of access to the requested tenant. Read only the application ID; do not export session tokens or keys.

Read existing bots with explicit keys. For examples prefer inactive, representative bots. Their data may contain personal data, webhook headers and tenant IDs: do not copy those into reusable samples. Existing records can be old or malformed; compare against a freshly UI-created node.

## 2. Persisted graph

### 2.1 Two different type systems

`node.type` is the React Flow rendering type: `startNode`, `customNode`, or `childNode`. `node.data.type` is the business action, for example `ask_question`. Setting `node.type` to `ask_question` is not equivalent.

Every node has a unique string `id`, a numeric `position:{x,y}`, and `data`. The start node uses the exact ID `start-node`; the playground searches for that ID. The UI uses `node-<UUID>` for newly created steps. A start skeleton:

```json
{"id":"start-node","type":"startNode","position":{"x":1150,"y":300},"data":{"label":"כאן מתחילים","position":{"x":1150,"y":300}},"deletable":false}
```

A normal step:

```json
{"id":"node-menu","type":"customNode","position":{"x":820,"y":300},"data":{"type":"ask_question","action":"ask-question","actionLabel":"צור שאלה מותאמת","nodeType":"requestInfo","title":"בחירת שירות","label":"בחירת שירות","position":{"x":820,"y":300},"content":"שלום! במה נוכל לעזור?","fieldName":"service","fieldType":"Options","options":[{"value":"מידע","label":"מידע","nodeId":null},{"value":"נציג","label":"נציג","nodeId":null}],"optionsWithNodes":[],"multipleObjectsSettings":null,"multiObjectsView":false,"isGroup":true}}
```

`data.action` chooses which settings form opens when the pencil is clicked. The editor calls `.match()` on it. A missing action can leave a node looking plausible while editing fails. `actionLabel`, `label` and `title` are display metadata; do not replace the action key with an invented synonym. Old Hebrew action values exist; new authoring should use the current keys below.

The editor refreshes `data.position` from top-level `position` on load. Keep both synchronized, especially after layout changes. `measured`, `selected`, `dragging`, `data.activeChat` and viewport state are transient. Do not copy stale sizes/highlighting from a template. The browser measures nodes again.

### 2.2 Branches are real child nodes

An Options list alone does not build the branch ports. Each option also has a corresponding `childNode` with `parentId` equal to the question's ID. Parent comes BEFORE children in `Nodes`. The child position is RELATIVE to the parent, not a canvas coordinate:

```json
{"id":"node-option-info","type":"childNode","parentId":"node-menu","extent":"parent","draggable":false,"deletable":false,"position":{"x":18,"y":130},"data":{"value":"מידע","label":"מידע","nodeId":null,"title":"מידע","number":1,"parentType":"ask_question","position":{"x":18,"y":130}}}
```

The current UI factory uses x=18 and y=130+55×optionIndex; numbers start at 1. The second option is y=185. Match `data.value` exactly to its option value. Outcomes of search/conditions/AI instead use `data.typeId` matching an outcome ID. Preserve their own shape; a menu's value is not an outcome's typeId.

Set the branch parent's `data.isGroup:true`. The renderer sizes groups from the actual children and suppresses the parent's normal output handle. Branch edges originate from CHILD IDs. Do not invent `sourceHandle` names or create parallel parent→next edges for branching. The parent-child relation is implicit; it does not need a normal edge.

```json
{"id":"edge-info-next","source":"node-option-info","target":"node-info-message","type":"buttonedge","style":{},"markerEnd":{"type":"arrow","color":"#62a6ff"}}
```

Every edge's source and target must exist. Ordinarily each non-terminal normal node and each branch child has one outgoing edge. The editor replaces display edge type and arrow marker on load. Terminal types include close, transfer and transfer_bot; jumps require an explicit target reference and their corresponding edge when `createTargetEdge` is enabled.

The observed playground advances along Edges and does not independently interpret a jump's `targetNodeId`. For a jump intended to work in the playground, use the native jump form with `createTargetEdge:true` and verify the explicit outgoing edge. Native jump nodes use `nodeType:"routing"`. A reference without its edge can look configured yet end with "לא נשארו צעדים נוספים". A direct branch-child edge back to the menu is another supported graph route; visually inspect returning edges so they do not pass through unrelated cards.

Fresh name, phone, email and question specimens used `nodeType:"requestInfo"`; phone/email fieldType was `Text`. A native close specimen also used `nodeType:"requestInfo"`, despite being a terminal action. Copy current native metadata rather than inferring nodeType from the action's meaning.

### 2.3 Whole-state updates

`Update-Data` replaces a supplied array/object field. Read → merge → write complete `Nodes`, `Edges` and `DefaultMessages`; omitted siblings inside those values are not preserved automatically. Keep record ID and unrelated top-level fields. Check `updatedAt` immediately before applying an edit; if it changed, re-read and reconcile.

When cloning, use a new record; keep the designated start ID and remap all other IDs consistently, including `parentId`, edges and jump targets. Never inherit a source bot's active state or channel without checking the requested deployment.

### 2.4 Default messages

```json
{"waitingTime":{"noResponseTime":15,"closeTime":60},"messages":{"noResponse":"אנחנו עדיין כאן. אפשר להשיב כדי להמשיך.","closeChat":"השיחה נסגרה לעת עתה. אפשר לפנות שוב.","invalidInput":"הנתון לא התקבל. נא לבדוק ולנסות שוב.","error":"לא הצלחנו להשלים את התהליך. אנא נסו שוב בהמשך."}}
```

Times are minutes. The UI rounds to increments of 15 and bounds inputs to 15–600, enforcing closeTime after noResponseTime. Use valid values rather than depending on blur-time correction. Default messages are saved by a separate settings operation; saving the main graph does not substitute for it.

## 3. Action payloads

The following is an action map observed in the current editor. For an unfamiliar action, create ONE canonical specimen through its actual settings form and re-read it through MCP. Do not fill a record by guessing the fields below. This table describes editor/data support, not proof of production execution.

| Purpose | data.type | data.action | Payload / branching |
|---|---|---|---|
| Name | request_name | request-name | content, fieldName, fieldType:"Text" |
| Email | request_email | request-email | content, fieldName, fieldType (copy UI specimen) |
| Phone | request_phone | request-phone | content, fieldName, fieldType (copy UI specimen) |
| Question or message | ask_question | ask-question | content, fieldName, fieldType, options, multiObjectsView |
| Human handoff | transfer | transfer | transferType, selectedValue, optionally sendMessage; resolve the actual user/group |
| Close | close | close | closeMessage; terminal |
| Jump to step | jump_to_node | jump-to-node | targetNodeId, createTargetEdge; resolve within this bot |
| Jump to bot | transfer_bot | transfer-to-bot | targetBotId; resolve a permitted target bot |
| Business hours | smart_routing | split-by-time | scheduleId, scheduleName, outcomes; canonical child outcomes from UI |
| AI agent | ai_agent | ai-agent | see below; three child outcomes |
| Webhook | api | api | url, method, headers:[{key,value}], fieldName, apiFields, continuesWebhook |
| Find records | search_in_system | search-in-system | searchInTable, searchField/searchInFields or searchConditions, objectName, allowMultipleObjects, multipleObjectsName, outcomes |
| Create record | create_object | create-object | objectType, fields, saveObject, createObjectName |
| Update record | update_object | update-object | objectType, objectName, fields |
| Extract record data | verify from new UI specimen | extract-create-object | do not infer the persisted type or mapping |
| Conditions | conditions | conditions | conditions, conditionOperator; children meets / does_not_meet |
| Email | verify from new UI specimen | send-email | resolve sender account/template; external delivery test needed |
| SMS | verify from new UI specimen | send-sms | resolve destination/template/credit; external delivery test needed |

### Questions, variables and message-only steps

Observed question field types are `Text`, `Date`, `Number`, `Options`, `File`. The UI select displays localized labels; browser selection may need the visible label (e.g. אפשרויות), while the persisted value remains `Options`.

An empty `fieldName` makes a question act as a message that continues immediately. A nonempty fieldName waits for input. Use English variable names with one consistent meaning; avoid silently reusing a name for unrelated questions. UI examples interpolate `{{{variableName}}}`. Use the editor's dynamic-field picker for record fields/nested expressions rather than inventing a path. On every incoming branch, a referenced variable must already exist or the copy must handle its absence.

`Options` includes visible label and stored value. For a menu, keep values stable and unique, and keep child value/title aligned when renaming. `optionsWithNodes`, multiple-record display settings and skipIfExists should be taken from the current UI. Do not manufacture them to implement behavior their names merely suggest.

Essential summaries and farewells belong in an explicit message-only step before `close`, since the observed playground emits a generic closed-state message and ignores `closeMessage`. Save `closeMessage` as appropriate for runtime, but do not use it as the only visible confirmation in a browser demonstration.

### Record operations

Mappings use `fields:[{fieldName,valueType,value}]`. Observed valueType values include `static` and `dynamic`. A dynamic mapping stores the variable name, not necessarily a template expression. A Pointer's static UI value is an object carrying `objectId`, `label`, `type:"Pointer"`, `targetClass`; this is different from a raw Parse Pointer. Resolve target table/schema and real lookup record, then build through the form or a fresh specimen.

Search produces branches with IDs such as `found`, `not_found`, `multiple_found` and corresponding `childNode.data.typeId`. Wire every offered outcome, including zero and many. The selected search mode governs which outcomes are present; never hardcode three if the configured mode differs.

`objectName`/`multipleObjectsName`/`createObjectName` define record variables for later operations. Keep names and target classes aligned throughout. Inspect table triggers before any runtime write test; a demo CRM can still have outbound automations.

### AI agent

Observed payload: `agentName`, `introMessage`, `instructions`, `selectedKnowledgeSources` (IDs), `selectedDynamicData`, `endConversationMethod` (`buttons` or `text`), `transferText`, `endText`, `continueInstructionsText`, plus the usual type/action/title/label metadata. The UI creates child outcomes `end_conversation`, `transfer_to_agent`, `max_messages`. Wire ALL THREE. Auto-created terminal steps may still have placeholder copy or an empty transfer target; inspect them.

Resolve knowledge sources by current records and confirm ready/active status in the UI. Never carry a sample's source ID into another tenant. Instructions should define scope, verified sources, concise answers, uncertainty, prohibited invented facts, and when to hand off. UI states a 50-message cap. Browser-test an in-scope question, an unsupported question and both exit controls. Actual AI responses use the configured service; the playground's AI is not entirely local.

### Webhooks and outbound channels

The editor exposes GET/PUT/POST/AUTO and optional headers. Keep secrets out of logs and exported bot examples. `continuesWebhook` affects whether the node exposes an output; verify its specific asynchronous contract before using it. No webhook, email, SMS or WhatsApp send is authorized merely by a request to build a draft bot. Use a designated test endpoint/recipient when delivery testing is part of the request.

## 4. Browser authoring and save lifecycle

1. Start from the actual tenant's list; inspect one representative existing bot and a fresh specimen. Keep the source bot unchanged.
2. For native creation choose צור בוט חדש → התחל מאפס / בחר מתבנית / בחר מבוט קיים. The plus on a node creates a connected successor. The toolbar plus requires manual connection verification. In the observed UI, a toolbar-created step persisted an edge whose source was absent (`edge-undefined-…`); never trust it without checking.
3. Select the action from the submenu; expand/click its category if necessary. A snapshot can list hidden submenu text. Prefer visible controls; if a browser driver cannot interact, inspect current DOM and use the actual element's click handler. Do not inject React state.
4. Rich text is contenteditable. Focus it before typing, and verify the resulting content after blur. Setting innerHTML alone can leave the editor's state unsaved. Use native typing or its documented editor API with a real change event.
   The tested editor used Froala 4.2.2 and initialized its contenteditable body after the modal appeared. A read 100ms after opening returned no content; waiting for the real editor body made all messages available. Poll for the body and compare its content, rather than treating an empty early query as proof. If another version uses an iframe, inspect its actual frame. Opening a populated modal heading alone is not a content check.
5. Save the step, then save the whole bot. These are separate operations. Open and save defaults separately if changed.
   The class `.save-button` exists both inside a step dialog and in the main toolbar. Scope a step save to its visible dialog or a fresh unique UI element; a bare class query can save the bot while leaving the dialog unsaved.
6. After MCP writes, reload the list and open the bot afresh. An already-open editor holds stale arrays and can overwrite your changes. Do not save that stale tab.
7. Make a genuine final edit in the browser (for example use the final bot name after provisional MCP creation) and save. The current browser service saves dirty fields and invokes `updateSettingsForChannel`, which posts `service:chat-bot-settings-updated` with the bot/channel IDs through the current authenticated session. A no-op click is not proof that this happened. Observe the service request's success without exporting its auth data.
8. Reload once more, re-open settings for representative nodes and re-read the record through MCP. Compare semantic fields and graph references; ignore newly measured sizes/selection flags.

The service callback is part of browser save behavior. MCP database success alone does not establish that the runtime configuration was refreshed. Do not change channel settings or activate an existing bot merely to force refresh.

In one build, a rich-HTML Nodes payload returned HTTP 403 while metadata, edges and the same copy as plain text with newlines saved successfully. This is a tenant/request-specific observation, not proof that all HTML is forbidden. Check partial writes, narrow the rejected field, and use plain text when it preserves the intended presentation or let the native editor serialize rich text. Do not retry the same rejected whole payload blindly or bypass access controls.

## 5. Conversation design and map layout

Plan purpose, primary user intents, required data, decision points and terminal outcomes before adding nodes. Prefer short messages, one question at a time, a clear next action, truthful confirmation and an accessible human fallback. Do not claim a ticket was created or a human was notified without that operation existing and being verified.

Use compact internal titles that explain the step at a glance. The current canvas cards are about 200px wide; long titles are ellipsized. A sensible initial layout flows right→left with roughly 320px between columns, then branches into separate horizontal lanes. Reserve height based on the number of child options. Keep terminal nodes beside the relevant lane. These are starting dimensions, not an excuse to skip screenshots.

Inspect fit-view for the complete map and zoomed sections for readability. No node overlaps, branch children outside parents, disconnected islands, unlabeled nodes, duplicate options or edges through unrelated cards. The layout must still be understandable after a full page reload. Nested children are allowed to overlap their own parent rectangle; this is not a layout collision.

Keep related decisions and their outcomes close together and align the same level in columns. Avoid scattering related nodes across distant vertical positions merely to reduce an automatic edge-crossing score. Inspect actual viewport bounds: a nominal fit-view can still clip the top/bottom of a large graph. Compact the lanes, verify all bounds, and capture a readable zoom detail. A larger overview viewport can document the whole flow, but does not replace normal-scale readability checks.

## 6. Verification and troubleshooting

### Three independent proofs

**Stored graph:** exact record ID; intended active/channel state; unique IDs; valid edge endpoints; valid parents; correct action metadata; menu/outcome-child parity; terminal reachability; variable availability; valid lookup references; defaults.

**Editor:** fresh load; map fits; readable titles; all branch ports visible; every action's pencil opens the right form; content and variables match; no new graph/editor console errors; final save and refresh persist.

**Conversation:** reset the playground for each case; test every top-level branch, collected input and variable substitution, final state, human fallback, and error/retry behavior where supported. For merge paths, repeat with different inputs to expose stale values. Record steps and actual outcomes, not only screenshots of a welcome bubble.

Wait for the expected message and actual closed state rather than an arbitrary fixed pause. The observed playground schedules automatic transitions about 800ms apart; a message → farewell → close sequence can need multiple transitions. The observed closed label was "שיחה נסגרה". A different guessed label or an early assertion is a test-harness defect, not evidence of a broken bot.

Scope option clicks to the latest displayed question. Historical option buttons can remain enabled; a fast test that selects any matching button on the page may click an old question before the current automatic message sequence finishes, producing misleading out-of-order output. Wait for the current prompt and, after reset, for the fresh input element before typing.

The observed playground walks the client graph. Search, conditions and business-hour decisions are presented as selectable simulated outcomes. Record create/update, webhook delivery and representative assignment are NOT executed/proven merely by reaching their nodes. Validation and close/transfer copy may differ from the server. The AI branch does call an AI service. Separately label `editor verified`, `playground verified`, and `server/channel not tested` in handoff evidence. Only claim end-to-end live behavior after an explicitly authorized test recipient, trace/log and expected record or assignment result.

### Simulator preflight and confirmed limitations

Two independently built bots were tested on 2026-09-16 with fresh conversations and native browser input:

- Name/phone/email/issue prompts collected the entered values, but `{{{variable}}}` substitutions rendered empty in subsequent prompts and summaries. Persisted variable names matched, and read-only inspection showed the captured values present. The shipped renderer reads state via a queued state updater before formatting; this is a suspected implementation cause, not a verified server-runtime diagnosis. Do not change correct variables or claim runtime personalization is broken based only on this preview.
- Arbitrary text at an Options question ended with "לא נשארו צעדים נוספים" instead of the configured invalid-input reply. Invalid phone/email strings advanced. Stored defaults and timers could be inspected, but the playground did not enforce them. Record an observed mismatch as `failed`; server validation and real elapsed-time behavior remain `not_tested`.
- Preserve an explicit failure transcript and a minimal reproducible case. Do not inject state, replace the renderer or change the app to make the test green. A fresh test on a later product version may resolve these limitations.
- When the request is an open-ended demo, a guided recommendation or information flow can use meaningful branch-specific messages without dynamic templates. This is an alternative design with its own tests, not proof that personalization was fixed. If personalization is required by the brief, keep that requirement unresolved until a valid runtime test or product fix verifies it.

| Symptom | Inspect first |
|---|---|
| Generic/wrong card or no icon | top-level type versus data.type; action metadata; unknown action from an old template |
| Pencil fails / blank settings | data.action missing or not a supported key; wrong payload for its form |
| Options appear in chat but no routes on map | missing childNode records, parentId, isGroup, relative positions |
| Branch click ends unexpectedly | child value/typeId mismatch or missing edge FROM that child |
| Child labels float/overlap | absolute coordinates used for child; parent ordered after child; stale measurements |
| Start says no further steps | missing edge from exact start-node, missing source from toolbar creation |
| Works until reload | step/main save omitted; stale editor saved over MCP edits; unpersisted rich text |
| DB correct but channel uses old behavior | observed browser settings-refresh service after a real save |
| Confirmation but no CRM record | playground simulated that action; inspect runtime logs and target record |
| AI works but handoff stalls | unresolved transfer target, missing max_messages or other child edge |

## 7. Sources and limits

- Public guide index: https://www.mybusiness.co.il/support-cata/chatbots/ (creation, basic controls, message, routing, data, AI, business hours).
- Live evidence: current MyChat editor DOM, browser-created Options node read through MCP, representative persisted graphs, browser save network request and deployed editor source.
- Existing MyChat overview: [10/04](../10-modules/04-mychat.md); table map: [20/03](../20-data-model/03-module-tables.md); messaging: [40/05](../40-integrations-api/05-messaging-channels.md).

The basic graph and save contract were inspected live. Less common action forms must be regenerated and tested in the target tenant before relying on their detailed payload. No paid messaging, real recipient, runtime webhook, all server validations, assignment or CRM mutations were certified by this authoring research. Product versions may change; the fresh UI specimen and reload test are the compatibility checks.
