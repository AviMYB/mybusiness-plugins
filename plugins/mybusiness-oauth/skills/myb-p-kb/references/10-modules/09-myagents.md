# MyAgents — AI agents in the CRM

> **Purpose:** what MyAgents does and how its parts behave. Covers:
> - agents and intelligence levels;
> - permissions;
> - the ways an agent is started;
> - business hours and the outside-hours queue;
> - conversations and their names;
> - reading files;
> - how results are reported, and the constraints to plan around.
>
> **Sources:** live tests on fresh databases with the module installed from the app market (2026-10 and 2026-11-02).
>
> **Tags:** [measured] seen live · [inference] not yet verified.
>
> **Last updated:** 2026-11-03 (§10 data model for MCP work) · **Status:** the module is new and changes often. Re-check behaviour before promising it to a customer.

---

## 1. What it is

- **An agent is an AI model with a set of tools**, working inside the CRM. It reads and writes CRM data through the MyBusiness MCP tools, within the permissions of the roles assigned to it.
- **Optional extras:**
  - search and fetch web pages;
  - use external MCP servers;
  - use skills.
- **Who can use it:** only users with an **Admin** role.
- **Module screens:**

  | Screen | What it holds |
  |---|---|
  | **סביבת העבודה** (workspace) | Chat with an agent and the conversation history |
  | **הסוכנים שלי** | The agents and their cards |
  | **אוטומציות** | Triggers, Webhooks, scheduled jobs |
  | **הגדרות** | Skills, MCP servers, roles, PBX and extension, **business hours**, credits |

- **Install:** MyAgents is installed from the app market (סביבת פיתוח → Applications → Add application → MyAgents).
- **Two agent types:** **LLM** (text) and **voice**. Voice agents place phone calls through a SIP trunk.

## 2. Intelligence levels

The agent card offers four levels, from the lightest to the strongest:

| Level | Model family | Notes |
|---|---|---|
| עוזר זוטר | Claude Haiku | Fast and cheap; simple tasks. Used when no level is set. |
| מתמחה | Gemini Flash | **The only level that can listen to audio files** (transcription). |
| מקצוען | Claude Sonnet | Extraction and reasoning. |
| מומחה | Claude Opus | The hardest tasks; about twice the cost of מקצוען per run [measured]. |

- **All levels read text, images and PDF files.** Skills work on the Claude levels only.
- **Usage is counted in credits.** A stronger level, a longer conversation, and many tool calls all cost more.
- **Credits are checked before a run but not reserved**, so several runs at once can use more than the remaining balance.

## 3. Permissions

- **The roles decide what the agent can touch.** Every agent should have at least one role, and its CRM permissions are those of its roles combined.
  - Writes are recorded as made by the agent's roles.
  - Tools that change the schema, permissions, users or triggers are blocked for agents.
- **Role required:**
  - The agent card does not save an agent without a role.
  - An agent created through the API is not checked. If such an agent has no role and runs automatically (webhook, trigger, scheduled job), it has no CRM tools at all.
- **Scheduled-job tools are not blocked by the role.** An agent given them can create and change scheduled jobs. Give them only to an agent whose purpose is managing jobs ([30/06](../30-customization/06-triggers-and-automations.md) §14.6).
- **Choose tools deliberately.** The tool picker lists every MCP tool, so give an agent only the tools its task needs.
- **Which role:**
  - An existing staff role that already writes the tables worked for unattended agents.
  - A dedicated role with no users is the least-privilege option, but test it with a real write: on a table that requires an authenticated user it is not proven yet.
  - Before blaming row-level permissions, count the rows' read/write ACLs (`_rperm` / `_wperm`) with Count-Data.

## 4. Ways to start an agent

| Way | Notes |
|---|---|
| **Chat** in the workspace | Always runs, also outside business hours. Each message shows its time. |
| **Webhook** (אוטומציות → Webhooks) | An external system posts to the agent's address. **Send the key and the data in the JSON body**; a header key is not recognised. The caller waits until the run ends. |
| **Data-change trigger** with the AI-agent action | Runs on create and update. It does not run on delete, and a **scheduled (date-field) trigger with this action does not run the agent**. |
| **Scheduled job** (אוטומציות → עבודות מתוזמנות) | On the clock. The job's description is the agent's task. See [30/06](../30-customization/06-triggers-and-automations.md) §14. |
| **Voice campaign** (MyCampaigns) | Voice agents only. |

Every way except chat is subject to the agent's **business hours** (§5).

## 5. Business hours and the outside-hours queue

**Setup:**
- Define schedules in **הגדרות → שעות פעילות**: weekly hours per day (or closed all day), special dates, and an option to respect Israeli holidays.
- The same schedules are shared with SLA and MyChat. A schedule that an agent uses cannot be deleted.
- On the agent card, choose **שעות פעילות** (empty = always available, 24/7). Optionally tick **השלם משימות בשעות הפעילות**.

**What happens to a request that arrives outside the hours** (webhook, trigger, scheduled job, campaign):
- **Without the checkbox:** the agent does not run, and the conversation records that the request arrived outside business hours. The caller still receives a normal success answer.
- **With the checkbox:** the request waits in a queue and runs when the hours start.
  - The conversation shows "ממתין לשעות הפעילות - יופעל ב-…".
  - Credits are used only when it runs.
  - Measured: requests queued at 08:21-08:45 ran at 09:00:01-09:00:04.

**Plan around these constraints:**
- **Order:** queued requests run together when the hours start, so arrival order is **not guaranteed**.
- **Webhook data:** data that a webhook sent in the **address (query string)** does not survive the queue. Send webhook data in the JSON body.
- **The queue:** there is no screen to view or cancel queued requests. If a queued request cannot run when the hours start (for example, no credits left), it can stay marked as waiting.
- **Overnight hours:** hours that cross midnight (for example 18:00-02:00) are treated as closed. Split them over two days instead.
- **Holidays:** the Independence Day handling is not reliable in every year. Add that day as a special date when it matters.

## 6. Conversations

**Names:**
- Each conversation gets a short **name** from its first message and answer, for example "שאלה על פרטי לקוח". The name is given once, at no charge.
- Some conversations do not get a name, and are listed with the start of their last answer instead.

**Renaming:** hover over a conversation in the list and click the pencil, type the new name, then click the ✓ to save or the ✗ to cancel. Enter and Esc are not supported.

**Search:** "חיפוש שיחות" filters by date and by **agent**, including agents that are no longer active.

**Quick test from the card:** an LLM agent's card has **"שמור ונהל שיחה עם הסוכן"**. It saves the agent and opens the workspace with the agent selected, so a prompt change can be tried at once.
- Make sure the agent is **active** first: an inactive agent cannot answer.
- After the first message of a new conversation, reload the page to see the conversation in the list.

**Display:** answers are shown as plain text (Markdown is not rendered), and the agent's thinking steps are shown in English.

## 7. Voice-agent card tools

- **"שמע דגימה":** plays a short sample (up to 300 characters) in the chosen voice before saving. The card offers 30 voices.
- **"שמור ובצע שיחת ניסיון":** saves the agent and calls a phone number through the agent's extension.
  - Enter the number in the local format (`05…`).
  - The test call runs **without CRM tools**, so it checks the voice and the script, not the CRM update.
  - It is charged like a regular call.
  - If the call never connects, check the extension settings and the agent's activity rather than the summary shown in the window.

## 8. Files

- **From a CRM table:** give the agent the Get-Data and Get-File-Content tools. **Text, image and PDF files work on every level**, including reading a document and filling CRM fields from it.
- **Audio:** **transcription works on the מתמחה level only**. Supported: MP3, WAV (including phone-quality), OGG, FLAC and WEBM. **M4A is not supported**, and AMR cannot be uploaded.
- **New tables:** a newly created table is closed to roles by default, so grant the agent's role access to it.
- **Chat attachments:** images, PDF and text work; Word and Excel need a skill. An audio file sent to a Claude level cannot be heard: the agent answers that it has no audio, and the run is still charged.

## 9. Results and monitoring

- **The answer to a webhook or API call reports success for every run that was accepted**, including runs the agent refused (inactive agent, outside the hours). To know what happened, open the conversation in the workspace.
- **A scheduled job's list shows the HTTP code (200), not the outcome.**

## 10. Data model (for work through MCP)

| Table | Fields that matter |
|---|---|
| `AiAgents` (one agent) | See the next table. |
| `AIIntelligenceLevels` | `Name` (עוזר זוטר / מתמחה / מקצוען / מומחה) and `Level` (1-4, the display order). |
| `AiAgentTypes` | The agent types: `LLM` and `סוכן קולי`. |
| `AiActivities` (one conversation or run) | `agentId`, `status` (`running` · `success` · `error` · `queued`), `finalOutput` (the last answer), `Name` (the conversation name), `startedAt`, `endedAt`, `credits`. |
| `AiActivitySpans` | The steps of a run (`spanType`: the user message, thinking, tool calls, the answer), linked by `activityId`. |
| `AiWebhooks` | `Name`, `AgentId`, `AuthKey`, `AuthValue`, `Active`. |
| `BusinessHours` | Schedules shared with SLA and MyChat; field shapes in [20/04](../20-data-model/04-system-tables-and-logs.md) §6. |

**`AiAgents` fields:**

| Field | What it does |
|---|---|
| `Name`, `Description` | Shown on the card. |
| `Active` | Only active agents run. |
| `AiAgentType` | Pointer to the type. |
| `AIIntelligenceLevelId` | Pointer to the level. |
| `SystemPrompt` | The agent's instructions, sent as written. |
| `MCPRoles_Pointer__Role` | The agent's roles. |
| `MCPTools_String` | The CRM tools it may use, e.g. `["MB_MCP_Get-Data","MB_MCP_Update-Data"]`. |
| `allowSearchAndFetch` | Web search and page fetch. |
| `BusinessHoursId` | Pointer to `BusinessHours`; empty = 24/7. |
| `QueueOutsideHours` | Queue requests that arrive outside the hours. |
| `AgentVoice`, `AiAgentSIPId` | Voice agents only. |

- **Look up the level and type rows by `Name`** with Get-Data, and use the pointer to the row you found.
- **Webhook calls:** the Webhook card (אוטומציות → Webhooks) shows the agent's webhook address and the key pair `AuthKey` / `AuthValue`. The caller posts JSON to the address with the key as a field (`"<AuthKey>": "<AuthValue>"`) next to the data. The whole JSON becomes the agent's message, and the caller waits for the run to end.

## Limitations & gotchas

- **Give every agent a role**, and check agents created through the API.
- **Send webhook keys and data in the JSON body.**
- **Business-hours queueing does not keep arrival order**, has no view or cancel, and does not support overnight hours.
- **A scheduled (date-field) trigger cannot run an agent.** Use a scheduled job.
- **Conversation names are not guaranteed.**
- **Transcription:** use the מתמחה level, and avoid M4A recordings.
- **Judge a run by its conversation, not by the HTTP answer.**
