# Messaging Channels — Email, SMS, WhatsApp, Telephony

> **Purpose**: Reference for every outbound/inbound messaging surface of MyBusiness CRM — SMTP/email, SMS providers, WhatsApp (channels, templates, send API, chatbots), and telephony/CDR — with the exact parameter shapes an integrator needs.
> **Last updated**: 2026-06-10 · **Status**: draft

---

## 1. Email

### 1.1 SMTP accounts (per-app sender identities)

`Get-SMTP-Accounts` (MCP, no params) → array of:

```json
[{ "objectId": "smtp12345", "SenderEmail": "info@company.co.il",
   "SenderName": "Company Support", "UserId": {"__type":"Pointer","className":"_User","objectId":"…"} }]
```

(Live playground check returned `[]` — empty array when none configured.) The **`objectId` of an SMTP account is required when configuring an email trigger action** (`Set-Trigger-Action`, email action's account parameter). `SenderName`/`SenderEmail` are what the recipient sees. Accounts are typically bound to a CRM user (`UserId`).

### 1.2 Provider integrations (configured in DB → Integrations tab)

| Provider | Type | Config (per Simbla docs) |
|---|---|---|
| **Gmail** | native send/receive | OAuth from the CRM (`integration-gmail.md`) |
| **IMAP (any provider)** | native send/receive | host/credentials (`mail-integration-imap.md`); validation function `validate-imap-channel` |
| **Mailgun** | native send (domain sending) | sender email, domain, API key (`mailgun-integration.md`); domain provisioning automated by `sync-domain-mailgun` |
| **Office 365** | sync | OAuth; server functions `office365sync` / `office365token` |
| **Google Calendar** | meeting sync | `google-calendar-synchronization-guide.md`; function `google-calendar-sync` |
| **Zapier** | generic | `zapir-integration-google-sheets-example.md` |

### 1.3 Email sending contexts

| Context | Mechanism |
|---|---|
| Trigger automation | `Set-Trigger-Action` email action (SMTP account objectId + to/subject/body with `{{{Field}}}` placeholders) |
| Campaigns (MyCampaigns) | bulk email via campaign engine (`apps/mycampaigns/`); queue scanned by `search-for-waiting-campaigns` |
| Documents (MyBooks) | `sendHebDocument` / `send-invoice-reminde` mail accounting documents |
| Scheduled reports | `Create-or-Update-Report.ScheduleSendAt` (daily/weekly/monthly email delivery) |
| User flows | password reset (`/parse/requestPasswordReset`), email verification |

### 1.4 Inbound email

- Mailbox pull: `emails-pull` (IMAP), `emails-pull-365` (O365), `emails-pull-folders` (folder-aware), `imap-gmail-mark-del` (post-process). Pulled mail lands in the CRM (MyInbox/conversations).
- **`mail2case`**: converts inbound email into `Cases` records (name-verified function; standard support-desk intake).

## 2. SMS

### 2.1 Providers

| Provider | Evidence |
|---|---|
| **Twilio** | Simbla native integration (`twilio-sms-integration.md` — configure in Integrations tab) + `Config:twilio-settings {accountSid, authToken, fromNumber}` consumed by deployed code |
| **Plivo** | Simbla native integration (`plivo-sms-integration.md`) |
| Apideck SMS | pilot, retired (`apideck-sms-not-in-use`) |

⚠️ Israeli aggregators (e.g. 019, InforU) are not evidenced in the sources read — UNVERIFIED whether additional SMS providers are wired per customer.

### 2.2 Trigger SMS action shape (from mcp-tool-guides)

```json
{ "triggerId": "T_ID", "actionType": "sms",
  "actionData": { "sms": {
      "toType": "field",            // take recipient from a record field
      "to": "PhoneNumber",          // field name (or literal when toType differs)
      "from": "0501234567",
      "local": "IL",
      "content": "Hi {{{Name}}}, your order of {{{Total}}} NIS has been received!"
  } } }
```

### 2.3 Rule-based scheduling

`sms-by-rules` (deployed): refuses to process on Friday/Saturday and Israeli holidays (`@hebcal/core` — Rosh Hashanah, Yom Kippur, Sukkot, Pesach, Shavuot, Independence/Memorial days) and computes next-working-day delivery. Pattern to reuse for any "don't message on Shabbat/חג" requirement.

### 2.4 SMS storage

Outbound messages are written to the **`SMS`** table (`From, To, timestamp, Content, Status, CaseId?`) — verified in `twilio-WA-send` (which logs WhatsApp-over-Twilio sends to `SMS` as well).

## 3. WhatsApp

### 3.1 Channels & the Identity rule (CRITICAL)

Sender phone numbers live in the **`Channels`** table. **Always use the `Identity` field value (e.g. `"100000000000000"` — the WhatsApp phone-number-id) as `fromPhoneNumberId` — NEVER the channel row's `objectId`.** This is the #1 WhatsApp integration bug (project rule + tool guide). Discover available numbers at runtime: `Send-WhatsApp-Message { "getNumbers": true }`.

### 3.2 Send-WhatsApp-Message — full parameter shape (live schema; do NOT call casually — sends real messages)

```json
// minimal text send
{ "fromPhoneNumberId": "100000000000000", "phoneNumber": "972500000000",
  "message": "*שלום רב!*\nנשמח לעמוד לשירותך 🚀" }

// reply with a PDF inside an existing conversation
{ "conversationId": "L7y9ieFPBh", "fromPhoneNumberId": "100000000000000",
  "phoneNumber": "972500000000", "contextId": "RoUWBMnQoM",
  "message": "מצורף המסמך המבוקש",
  "fileBase64": "data:application/pdf;base64,JVBERi0xLjc...", "fileName": "document.pdf" }
```

| Param group | Params | Notes |
|---|---|---|
| Discovery | `getNumbers`, `getTemplates` | return sender numbers / approved templates (incl. `components`) without sending |
| Addressing | `phoneNumber`, `fromPhoneNumberId`, `wabaId` | international format `972…`; Identity rule above; `wabaId` for multi-WABA tenants |
| Threading/logging | `conversationId`, `contextId` (reply-to message objectId), `savedInTable`+`savedInObjectId` (log location when no conversation) | |
| Content | `message` | WhatsApp markup `*bold* _italic_ ~strike~ \`code\``; full URLs get link previews |
| Files | `fileBase64` (Data-URI prefix REQUIRED, e.g. `data:image/png;base64,`), `fileName`, `fileDBName` (send a file already stored in the CRM) | MIME support: images jpeg/png/webp (**gif NOT supported**), docs pdf/txt/doc(x)/xls(x), audio mpeg/aac/ogg/opus, video mp4/3gpp |
| Templates | `template{name, language, components}` + `WATemplateParams` | components copied verbatim from `getTemplates` |
| Interactive | `interactiveButtons[]{title,id}` (≤3) · `interactiveCTA{title,url,HEADER_TEXT,FOOTER_TEXT}` (1 button) · `interactiveLIST{BUTTON_TEXT, SECTIONS[1..10]{title, rows[1..10]{id,title,description}}, HEADER_TEXT, FOOTER_TEXT}` | |

### 3.3 Template parameter workflow

1. `Send-WhatsApp-Message {"getTemplates": true}` → approved templates with `components`.
2. `Get-WhatsApp-Template-Params { "templateComponents": [...] }` → example params object keyed by component:

```json
// input component: { "type":"BODY", "text":"שלום {{1}}, בהמשך לפנייתך מספר {{2}}..." }
// tool returns:    { "BODY": ["שם לקוח", "מספר פניה"] }
```

3. Replace example values with CRM placeholders — `{{{Name}}}`, `{{{AccountId.Name}}}` — for use in trigger automations and campaigns.
4. Send with `template` + `WATemplateParams`.

### 3.4 Under the hood & logging

- Internal platform endpoint: `https://api.mbapps.co.il/whatsapp-send/` (serverURL minus `/parse` + `whatsapp-send/`), POST `{appId, masterKey, getTemplates|…, waba_id}` — observed called by the `mychat` function; the MCP tool and trigger actions ride the same service. ⚠️ Internal — not a public integration contract.
- WhatsApp send log table: **`_syslogWA`** (`Direction:"sent", To, From, Content{txt}, UserId, accountSid…`) — verified in `twilio-WA-send`.
- Conversations/messages live in MyChat tables (conversations referenced by `conversationId`; message rows referenced by `contextId`). `conversation-read` syncs read-state; `conv-owner-from-last` assigns owners.
- **Twilio-WhatsApp variant**: `twilio-WA-send`/`twilio-WA-recevie` send/receive WhatsApp through Twilio (prefix `whatsapp:` + `Config:twilio-settings`) — predates/parallels the Meta-Cloud-API channel; logs to `SMS` + `_syslogWA`, can attach to a `CaseId`.
- 2FA: `send-2FA-whatsapp`.

### 3.5 Chatbots touchpoint (MyChat)

`mychat` function = bot bridge: `POST /functions/{appId}/mychat` with `templateId` (approved template), `srcPhoneId` (sender channel), `phoneNumber`, optional `botParam_<name>` values, `botStepId` (`node-…` — the bot-flow step to attach the contact to), `bodyText`. It resolves the template via the internal whatsapp-send service, fills params (incl. BUTTONS components), sends, and registers the conversation with the chatbot flow. `mychat-post-register` runs post-registration logic. Bot/chat credit is account-level (admin API `addChatBotCreditToApp`).

## 4. Telephony — CDR & click2call

### 4.1 CallRecords ingestion (canonical pattern — verified in `015-CDR-Pull`)

Per-provider functions poll or receive call detail records and write the **`CallRecords`** table:

| CallRecords field | Content |
|---|---|
| `pbx` | provider key (`"015"`, …) |
| `caller` / `target` | normalized numbers (out-calls show external caller-id) |
| `record` | recording URL |
| `duration` | talk time (Number, seconds) |
| `ivruniqueid` | provider's unique call id |
| `time` | call start (Date) |
| `status` | provider status |
| `AccountId` / `ContactId` | matched by `endsWith` on last 7 digits against `Accounts.PhoneNumber`, `Contacts.PhoneNumber`, `Contacts.CellPhone` |

Provider credentials come from `Config:pbx` (`pbxName`, `pbxAuth_username`, `pbxAuth_password`); incremental sync watermark in `Config:<provider>-CDR-LastSync`. The AI summary pipeline (`call_records_summary` Firebase function) then turns `CallRecords.record` into a transcribed Activity — see [04-cloud-functions.md](04-cloud-functions.md) §4.

### 4.2 Provider coverage (deployed functions)

| Provider | CDR | Pop-screen | Click2call | Other |
|---|---|---|---|---|
| 015 (015pbx.net) | `015-CDR-Pull` ✓, `015-CDR-event`, `015-CDR-record` | – | – | `015-add-user`, `015-register-user` |
| Voicespin | `Voicespin-CDR`, `Voicespin-cdr-za` | – | `Voicespin-click2call` | |
| Voicenter | `voicenter-CDR` | `voicenter-pop-up-screen` | – | |
| Bezeq | `bezeq-CDR` | – | – | |
| Omnitelecom | `omnitelecom-CDR` | `omnitelecom-popscreen` | – | |
| Globalex | `globalex-CDR` | `globalex-popscreen` | – | |
| Other CDR providers | additional `<provider>-CDR` functions | – | – | |
| Aspire (Optimus) | – | – | `aspire-click2call` ✓ | dial API `…/OptimusIntegration/Rest/ExtensionWebMethods.aspx/dialtoclidext?clid=<dest>&agent=<a>|ext=<e>`; requires logged-in user + `Config:pbx{pbxName:"aspire", click2callDomain}` |
| Generic | – | `popscreen` | – | caller-id → customer card resolver |
| Customer-specific | customer-forked `<name>-cdr` functions | – | – | |

### 4.3 Click2call contract (verified, `aspire-click2call`)

Input: `{agent | extension, destination}` + logged-in `user.sessionToken` (403 without login). Reads `Config:pbx` with the **user's session** (not master key) so CLP applies; 403 variants: no config / wrong pbxName / missing domain. Response `{status: <provider HTTP status>}`.

## 5. Channel selection cheat-sheet (for fit-gap)

| Requirement | Native answer |
|---|---|
| Auto-email on status change | Trigger email action + SMTP account |
| Bulk marketing email | MyCampaigns + Mailgun/SMTP |
| Transactional SMS | Trigger SMS action (Twilio/Plivo configured) |
| WhatsApp notify (approved template) | Trigger/campaign WhatsApp action; template workflow §3.3 |
| Two-way WhatsApp inbox | MyChat conversations + Channels |
| Bot-driven WhatsApp flows | MyChat chatbot + `mychat` bridge (botStepId) |
| Call logging + recordings on the customer card | Provider CDR function + `CallRecords` (+ AI summary pipeline) |
| Click-to-dial from the CRM | Provider click2call function (Aspire/Voicespin) |
| Email → ticket | `mail2case` |

## Limitations & gotchas

- **`Identity` vs `objectId`** on Channels — sending with the objectId fails or mis-routes; always `Channels.Identity`.
- **WhatsApp business rules**: free-form `message` only inside the 24-hour customer-service window; outside it an approved **template** is mandatory (Meta platform rule). `image/gif` unsupported; buttons ≤3; list sections/rows ≤10.
- **`fileBase64` must carry the Data-URI prefix** (`data:<mime>;base64,`) — raw base64 fails.
- **Send tools are irreversible** — `Send-WhatsApp-Message` without `getNumbers`/`getTemplates` sends a real message to a real customer. Gate it in agent permission models.
- **SMTP accounts may be empty** on a fresh app (live playground = `[]`) — email triggers configured before an SMTP account exists will fail; check `Get-SMTP-Accounts` first.
- **Provider credentials live in the restricted `Config` table** — channel debugging (missing pbx/twilio settings) requires master-key REST, not MCP.
- **Phone matching in CDR is last-7-digit endsWith** — collisions possible (shared office lines, short numbers); mis-linked calls are a known support theme.
- **Two WhatsApp stacks coexist** (Meta Cloud API channels vs Twilio-WhatsApp functions) — per customer, verify which one is live before debugging.
- **Multiple log tables**: `SMS`, `_syslogWA`, MyChat conversation tables, `CallRecords` — there is no single unified message log; investigations must check the right table per channel.
- SMS provider list beyond Twilio/Plivo is ⚠️ UNVERIFIED; the internal `whatsapp-send/` endpoint and GET-style function invocation are internal observations, not contracts.
