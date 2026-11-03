# 1.6.0 — AI agents (MyAgents), scheduled jobs, and knowledge-base updates

Both plugin variants (`mybusiness-oauth` and `mybusiness-implementor`) carry the same 25 skills. Authentication configuration, setup guides and permission notes are unchanged.

## New skill

- **`myb-p-myagents`: build and run AI agents with MyAgents.** It takes an agent from idea to a verified automation:
  1. Design the agent: one job, what starts it, what it reads and writes.
  2. Choose the intelligence level.
  3. Give it a role and access to its tables.
  4. Create it from the agent card or through MCP, and write its instructions.
  5. Try it in the workspace.
  6. Start it from a webhook, a record-change trigger or a scheduled job.
  7. Optionally, set business hours with a queue for requests that arrive outside them.
  8. Verify it by reading the run and the data it wrote.

  Recipes for a document-reading agent and for call-recording transcription into a CRM activity, plus an overview of voice agents.

## Updated skills

- **`myb-p-trigger-setup`:**
  - Scheduled jobs: run a cloud function or an AI agent on the clock with `Get-Scheduled-Jobs` / `Create-or-Update-Scheduled-Job`.
  - The `trigger-ai-agent` action, which runs an AI agent when a record changes.
  - Notes on scheduled-trigger timing, how many trigger levels fire, and keeping keyed webhook actions out of shared output.
- **`myb-p-users-roles-permissions`:** a new section on roles for AI agents.
- **`myb-p-sla-configuration`:** business hours are written in exactly the shape the SLA hours screen reads.
- **`myb-p-record-timeline`:** a new section on what a table's timeline records once it has settings.

## Knowledge base (`myb-p-kb`)

- **New module page `10-modules/09-myagents.md`:**
  - intelligence levels, permissions, ways to start an agent;
  - business hours and the queue, conversations, voice-card tools, files, results;
  - the data model for MCP work.
- **Triggers and automations (`30-customization/06`):**
  - §5.9 the AI-agent action;
  - §14 scheduled jobs;
  - more detail on scheduled-trigger timing and on trigger chains.
- **MCP tools catalog (`40-integrations-api/02`):** §8b, the scheduled-job tools.
- **Login security, two-factor authentication by email:** in `30-customization/08` §9, the REST login answer when 2FA is on, portal users, and the admin Security screen.
- **Data model:** `20-data-model/04` §6, the `BusinessHours` field shapes. `20-data-model/06` gains rules D-13 to D-15.
- **Methodology:** standing design rules SR-11 to SR-16 in `60-implementation-methodology/09`.
- **Capability matrix and known limitations:** §19 AI agents, plus the scheduled-jobs and AI-agent sections.

## Update

Refresh the plugin marketplace and update the installed variant. Claude.ai sync picks up the new version on its next run. All 25 skills in both variants pass the skill validator.
