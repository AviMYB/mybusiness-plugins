# Server-Side Extensions (Public Edition) — פונקציות צד שרת

> **Purpose:** The server-side extension model of MyBusiness CRM — when no-code configuration isn't enough, custom Node functions run server-side per app.
> **Last updated:** 2026-06-10 · **Status:** draft (public tier)

## 1. The model

Each app can have custom **server-side functions** (Parse Cloud Functions) deployed by the MyBusiness team. A function:

- runs server-side with the app's master key injected (full data access),
- is invoked over HTTPS: `POST https://api.mbapps.co.il/functions/<appId>/<functionName>`,
- or fires from a **trigger action** (`type: "server-side-code"` with `functionName`, or an `http` action pointing at the function URL),
- reads per-app configuration from a restricted `Config` table (API keys for payment/SMS providers, feature flags such as `AcceptWebLeads`/`AcceptWebToTable`).

Standard platform functions you'll meet on every app include the external-form intake endpoints (`web2lead`, `web2table` — see [03-web2lead-web2table.md](03-web2lead-web2table.md)).

## 2. When you need one (fit-gap signal: Custom-Server)

| Need | Why config can't do it |
|---|---|
| Cross-record calculations, rollups/sums, tiered commissions | triggers act on one record; no native aggregate fields |
| Business-day / holiday-aware time math (SLA, message windows) | trigger time offsets are calendar-minutes only |
| Payment-gateway calls (charge, tokens, refunds) | external API + secrets |
| Telephony: CDR ingestion, click-to-call, pop-screen | webhook receivers from PBX providers |
| Dedup/merge logic, complex validations | no native dedupe engine |
| Sync with external systems (accounting, calendars, registries) | external APIs, mapping, retries |
| Portal auth flows (OTP, self-signup with record linking) | user creation + role attach + session issuing |

## 3. Working with functions as an implementer

- **Invocation test:** `curl -X POST https://api.mbapps.co.il/functions/<appId>/<fn>` with a JSON body (the function defines its own contract — ask for it or read the trigger that calls it).
- **From triggers:** prefer the `server-side-code` action with `functionName`; the `http` action variant is equivalent but keeps the URL visible.
- **Debugging:** trigger-invoked functions log to `_syslogTriggers`; data effects are visible in `_Timeline`. See [../20-data-model/04-system-tables-and-logs.md](../20-data-model/04-system-tables-and-logs.md).
- **Spec discipline:** in a technical spec, a Custom-Server item must define: trigger/event, input payload, tables read/written, external calls, failure behavior, and acceptance criteria — see [../60-implementation-methodology/04-technical-requirements-spec.md](../60-implementation-methodology/04-technical-requirements-spec.md) §10.

## 4. Boundaries

- Functions are **developed and deployed by the MyBusiness team** — they are a development dependency with lead time; classify such requirements as Custom-Server (XL) in fit-gap and involve a developer in the estimate.
- The `Config` table is restricted from standard tooling — provider keys and intake flags are managed with the vendor.
- API writes performed by functions fire data triggers like any other write — design against trigger storms and chain limits (max 3 levels; see [../30-customization/06-triggers-and-automations.md](../30-customization/06-triggers-and-automations.md)).

## Limitations & gotchas

- Functions bypass nothing: CLP doesn't constrain master-key code, so a buggy function can touch anything — acceptance criteria + log checks are mandatory.
- Phone-matching integrations commonly match on last digits — collision risk on shared lines; specify the matching rule explicitly.
- Duplicate `Config` rows cause undefined flag reads — keep exactly one row per flag.
