---
name: myb-p-myagents
description: "Set up and run AI agents with MyAgents in MyBusiness CRM: design an LLM agent, choose its intelligence level, write its instructions, give it roles and CRM tools, try it in the workspace, start it from a webhook, a record-change trigger or a scheduled job, set business hours with an outside-hours queue, work with conversations, have it read documents from CRM tables, and build a call-recording transcription agent. Use whenever someone wants an AI agent inside the CRM: 'סוכן AI', 'מייאג׳נט', 'MyAgents', 'תקים לי סוכן', 'סוכן שמעדכן לידים', 'סוכן שקורא מסמכים', 'סוכן תמלול שיחות', 'שעות פעילות לסוכן', 'להפעיל סוכן מטריגר / מוובהוק / כל בוקר', 'create an AI agent', 'an AI agent that updates the CRM', 'run an agent on a schedule', 'webhook to an AI agent', 'transcribe call recordings into the CRM'. Prefer myb-p-trigger-setup to build the trigger or the scheduled job itself and myb-p-users-roles-permissions for roles and table access; use myb-p-kb for product facts. NOT for MyChat chatbots (myb-p-chatbots)."
---

# myb-p-myagents — סוכני AI במערכת (MyAgents)

An AI agent in MyAgents is **an AI model with instructions, a set of CRM tools and the permissions of its roles**. It reads and writes CRM data the way a careful employee would, and it starts in one of these ways:
- a person chats with it in the workspace;
- an external system calls its webhook;
- a record change fires a trigger;
- a scheduled job runs it on the clock.

This skill takes an agent from idea to a working, verified automation.

**Preconditions:**
- MyAgents is installed on the database from the app market: user menu → סביבת פיתוח → Applications → Add application → MyAgents.
- The person working on it is an **Admin**.
- There are credits on the credits screen (הגדרות → יתרת קרדיטים).

## Knowledge sources (binding)

- `../myb-p-kb/references/10-modules/09-myagents.md`: the module.
  - §2 levels, §3 permissions, §4 ways to start an agent, §5 business hours and queue, §6 conversations, §7 voice-card tools, §8 files, §9 results.
  - **§10 the data model and the webhook call.** Read §10 before any MCP write.
- `../myb-p-kb/references/30-customization/06-triggers-and-automations.md`:
  - §3 `Set-Trigger`;
  - **§5.9 the `trigger-ai-agent` action**;
  - **§14 scheduled jobs**.
- `../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md` §8b: the scheduled-job tools.
- `../myb-p-kb/references/20-data-model/04-system-tables-and-logs.md` §6: `BusinessHours` field shapes.
- `../myb-p-kb/references/80-capability-matrix/01-capability-matrix.md` §19: capability rows for fit-gap.
- **Sibling skills:** `myb-p-trigger-setup` (triggers and jobs), `myb-p-users-roles-permissions` (roles, CLP), `myb-p-card-design` (card fields), `myb-p-create-entity` (new tables).
- **MCP tools:**

  | Purpose | Tools |
  |---|---|
  | Read | `mcp__MyBusiness__Get-Schema`, `mcp__MyBusiness__Get-Data` |
  | Write | `mcp__MyBusiness__Create-Data`, `mcp__MyBusiness__Update-Data` |
  | Roles and access | `mcp__MyBusiness__Get-Roles`, `mcp__MyBusiness__Get-Table-Permissions`, `mcp__MyBusiness__Set-Table-Permissions` |
  | Triggers | `mcp__MyBusiness__Set-Trigger`, `mcp__MyBusiness__Set-Trigger-Action`, `mcp__MyBusiness__Get-Triggers` |
  | Scheduled jobs | `mcp__MyBusiness__Get-Scheduled-Jobs`, `mcp__MyBusiness__Create-or-Update-Scheduled-Job` |
  | Recipes | `mcp__MyBusiness__Get-File-Content`, `mcp__MyBusiness__Add-Field-to-Table` |

## When to use / not use

**Use:**
- To design, create, test and automate an AI agent that works on CRM data.
- To answer "can an agent do X" with a plan.
- To set up business hours for agents.
- To build a document-reading or transcription agent.

**Use a sibling skill instead:**
- **Building the trigger or the job itself:** `myb-p-trigger-setup`. This skill says what the agent needs from it.
- **Creating roles and table permissions:** `myb-p-users-roles-permissions`.
- **MyChat bots** (the bot builder, WhatsApp flows): `myb-p-chatbots`.

## Steps

### 1. Design the agent before building it

Write down five things:
1. **The one job** it does.
2. **What starts it:** a person, a webhook, a record change, or the clock.
3. **What it reads.**
4. **What it writes:** tables and exact fields.
5. **How you will check it worked.**

One agent, one job: a focused agent is easier to instruct, cheaper to run, and safer to permission.

Then pick the **intelligence level** (KB §2):

| Level | Use it for |
|---|---|
| עוזר זוטר | Simple, frequent tasks |
| מתמחה | Listening to audio files |
| מקצוען | Extraction and reasoning |
| מומחה | The hardest tasks |

A stronger level costs more per run, so start with the lightest level that does the job well.

### 2. Give it a role and table access

The agent's CRM permissions are the union of its roles' permissions (KB §3).

- **Choose the role:**
  - prefer an existing staff role that already writes the tables the agent needs;
  - otherwise create a dedicated role that has access to just those tables (`myb-p-users-roles-permissions`);
  - give an agent the Admin role only with the owner's approval.
- **Grant the role access to every table the agent touches.** Grant it with `Get-Table-Permissions` → merge the role into find/get (and create/update as needed) → `Set-Table-Permissions`.
  - Use read → merge → write, because the write replaces the whole permission object, and a blind write removes everyone else's access.
  - A table created for the project starts closed to all roles, so it always needs this step.

### 3. Create the agent

**Use the agent card** (הסוכנים שלי → סוכן חדש). It is the simplest path, and it checks the required fields:
1. Name, type **LLM**, intelligence level.
2. Instructions under "תפקיד והנחיות".
3. Roles, tools and web search under "מקורות וחיבורים".

**Through MCP:** `Create-Data` on `AiAgents` with the fields in KB §10:
- `Name`, `Active: true`;
- `AiAgentType` and `AIIntelligenceLevelId` as pointers to the rows you looked up **by name** with `Get-Data`;
- `SystemPrompt`;
- at least one role in `MCPRoles_Pointer__Role`;
- `MCPTools_String` with only the tools the job needs;
- `allowSearchAndFetch: true` if it needs the web.

Read the row back with `Get-Data` to confirm.

**Writing the instructions** (the prompt is sent exactly as written):
- **State the job** and who the agent works for.
- **Name the tables and the exact fields** it may read and write, with the allowed values for each field. The instructions are what keeps the agent inside its task.
- **Say how to find the record:** by the `objectId` in the incoming message, never by a name.
- **Say what to write, then re-read:** tell it to re-read the record after writing and to report exactly what it changed.
- **Dates and times:** take the date from the incoming message (a scheduled job's `time`, a record's dates), and write dates in full ISO form.
- **Language and length:** answer in Hebrew, short and factual.

### 4. Try it in the workspace

On the card, **"שמור ונהל שיחה עם הסוכן"** saves the agent and opens the workspace with it selected (the agent must be active).
- **Send realistic messages:** for an automated agent, paste the same JSON it will receive.
- **Read the answer and the tool steps.** Then open the records it touched and check the fields.
- **Improve one instruction at a time,** so each change can be judged.

### 5. Start it automatically (choose one)

| Start | How | What the agent receives |
|---|---|---|
| **Webhook** (an external system: a form, another app) | אוטומציות → Webhooks → new → the agent. Give the caller the address and the key pair from the card. The caller posts JSON with the key field and the data in the body (KB §10). | The JSON it was sent |
| **Record change** | A trigger on the table with the `trigger-ai-agent` action (`{"agentId","agentName"}`), on create and/or update, built with `myb-p-trigger-setup` (KB 30/06 §5.9). | The saved record as JSON, so the instructions say what to do with it |
| **The clock** | A scheduled job with `actionType: agent`: interval jobs with `start` + `end`, daily, monthly. Times are UTC minutes on the quarter hour (KB 30/06 §14). Built with `myb-p-trigger-setup`. | The job's description as its task |
| **Phone calls** | A voice agent in a MyCampaigns voice campaign (§9 below). | — |

For something "X hours before a date", use a scheduled job whose agent looks up the records that are due.

### 6. Business hours (optional)

Use this when an agent should work only in set hours (KB §5):
1. **Define a schedule** in הגדרות → **שעות פעילות**: weekly hours, special dates, and Israeli holidays. Or create a `BusinessHours` row in the shapes of KB 20/04 §6.
2. **On the card**, choose the schedule under "שעות פעילות".
3. **Tick "השלם משימות בשעות הפעילות"** so that webhook, trigger and job requests arriving outside the hours wait in a queue and run when the hours start. Credits are used only when they run.

Chat in the workspace always runs. For hours that run past midnight, define them as two days (evening until 23:59, and morning from 00:00).

### 7. Verify, then hand over

- **Read the run:** `Get-Data` on `AiActivities` where `agentId` is the agent, newest first. Check `status`, `finalOutput` and `Name`. The full steps are in `AiActivitySpans` and in the workspace conversation.
- **Read the data:** `Get-Data` on the records the agent was meant to write. The data, not the run's status, is the proof.
- **For an automated start:** fire it once with a test record or test call, then confirm both the conversation and the data.

## Recipe: an agent that reads documents from a table

1. **The table:** it needs a File field. Grant the agent's role find/get, and update if it fills fields.
2. **The agent:** tools `MB_MCP_Get-Data` + `MB_MCP_Get-File-Content` (+ `MB_MCP_Update-Data` to fill fields). Text, images and PDF work on every level.
3. **The instructions:**
   1. Read the row by its `objectId`.
   2. Read the file with Get-File-Content.
   3. Extract the named fields.
   4. Write them with Update-Data.
   5. Re-read and report.
4. **The start:** a trigger on the table, on create with a file (`onSetFields` = the file field), via `myb-p-trigger-setup`.

## Recipe: call-recording transcription → a CRM activity

A recording uploaded to a customer's files becomes an activity of type "תמלול" with the full transcript, linked to the customer and to the file.

1. **Documents:** use the built-in `Files` table (the customer card's files tab).
2. **Data model** (`Add-Field-to-Table`, `Create-Data`):
   - a row "תמלול" in `ActivityTypes`;
   - on `Activities`, a String field `Transcript` and a Pointer `FileId` → `Files`.

   Put both fields on the activity card with `myb-p-card-design`, with `Transcript` as a multi-line text area.
3. **The agent:**
   - level **מתמחה** (it listens to audio);
   - tools `Get-Data`, `Get-File-Content`, `Create-Data`;
   - a role with access to `Files` and `Activities`.
4. **Its instructions:**
   1. Read the `Files` row from the message's `object.objectId`, then the file.
   2. If it is not audio, stop.
   3. Otherwise transcribe it word for word, with speaker labels.
   4. Create one `Activities` row: the "תמלול" type, `Transcript`, `FileId`, the file's `AccountId` / `SaleId`, and `StartTime` = the file's `createdAt`.

   Give it the objectIds of the type and status rows to use.
5. **The trigger:** on `Files`, `events: ["create"]`, `onSetFields: ["File","PublicFile"]`, action `trigger-ai-agent` (via `myb-p-trigger-setup`). Create-only, so the agent's own writes never re-fire it.
6. **Verify:** upload a recording to a test customer, then read `Activities` where `FileId` is that file.

Use MP3, WAV, OGG, FLAC or WEBM recordings.

## Working with conversations (KB §6)

- **Names:** every conversation gets a short name from its first exchange.
  - **Rename:** use the pencil on the row (✓ saves).
  - **Search:** "חיפוש שיחות" filters by agent and date.
- **Webhook, trigger and job runs** appear in the workspace as conversations, with the incoming JSON as the first message. This is the place to see what the agent did.

## Voice agents (overview)

A voice agent (type "סוכן קולי") places phone calls through a PBX extension configured in הגדרות → מרכזיה ושלוחה. The PBX connection is set up with the MyBusiness team.

On the card:
- choose the **voice** and play **"שמע דגימה"** before saving;
- **"שמור ובצע שיחת ניסיון"** saves the agent and calls a number you enter, in local format;
- a voice campaign in MyCampaigns calls a whole group.

Write voice instructions as short spoken turns (KB §7).

## How to present the result

Lead with what the agent does and how it starts, then give:
- the agent's name;
- its level;
- its role;
- its tools;
- the start (webhook address, trigger, or job schedule);
- the business hours, if any;
- the test you ran and what it wrote.

Put the steps someone must do in the screen as a short list: installing the module, buying credits, connecting a PBX.

## Known limitations

- **Screen-only steps:** installing MyAgents, buying credits, and connecting a PBX for voice are done in the screens or by the MyBusiness team. This skill does not cover them.
- **Triggers and jobs:** the skill relies on `myb-p-trigger-setup` to build them, and on `myb-p-users-roles-permissions` for roles.
- **Changing module:** MyAgents is evolving. Check the current screens and KB §10 before automating against field names.
