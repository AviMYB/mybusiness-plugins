# Synthetic Data — MyChat / WhatsApp Conversations

How to generate **structurally-valid, referentially-complete, and actually-visible** synthetic WhatsApp (MyChat) conversations in MyBusiness CRM. Written from a live build (created a channel + 6 conversations + 30 messages for a flagship demo customer). Read this end-to-end before generating — the **permissions (CLP) section is the difference between data that shows in the UI and data that silently doesn't.**

> This is programmatic synthetic generation via MCP (`Create-Data`/`Create-Many`/`Update-Data`), not file import. The general data-creation mechanics (Pointer/Date formats, Create-Many batching, `skipTriggers`/`skipTimeline`) from the main SKILL still apply.

---

## 1. The three-layer model

```
Channels            (a business WhatsApp number / sender)
  └─ Conversations  (one thread per customer phone — the "chat")
       └─ ConversationMessages  (each message; raw Meta webhook payload in `Data`)
```

Supporting/lookup tables: `ChannelTypes` (WhatsApp/Email), `ConversationStates` (פתוח/סגור), `ConversationStatuses` (חדשה/בטיפול/ממתינה/סגורה), and (for automation) `ChatBots`/`ChatBotLogs`/`AIConversations`. A conversation links into the CRM via `AccountId`/`ContactId`/`SaleId`/`CaseId`/`TaskId`.

### Creation order (bottom-up, so every Pointer targets an existing row)
1. `ChannelTypes` / `ConversationStates` / `ConversationStatuses` — **already seeded** in any MyChat install; resolve their objectIds, don't create.
2. `Channels` — at least one WhatsApp channel (create if `Count-Data Channels` = 0).
3. `Accounts` + `Contacts` — the customer you're chatting with (from CRM).
4. `Conversations` — one row per thread.
5. `ConversationMessages` — many per conversation (`Create-Many`).

**Always resolve lookup objectIds live per app** (`Get-Data ChannelTypes` etc.) — do NOT copy objectIds between apps/environments. Sample objectIds in any reference doc are environment-specific.

---

## 2. Schema cheat-sheet (verify with `Get-Schema` first)

**Channels** — `Name`, `Identity`, `Key`, `TypeId`→ChannelTypes (⚠️ the channel-type field is **`TypeId`**, NOT `ChannelTypeId`), `WaBaId`, `DefaultOwnerId`→_User, `HasChatBots`, `DefaultResponse`.

**Conversations** — `ChannelId`→Channels, `ChannelTypeId`→ChannelTypes, `Identity`, `ContactName`, `Title`, `AccountId`, `ContactId`, `SaleId`, `CaseId`, `TaskId`, `OwnerId`→_User, `StatusId`→ConversationStatuses, `StateId`→ConversationStates, `UnreadCount` (Number), `HasMedia` (Boolean), `LastMessageAt` (Date), `ClosedAt` (Date), `Pinned`, `Number` (AutoIncrement), `Department`, `ChatBotId`/`UsedChatBotId`/`ChatBotStepId`.

**ConversationMessages** — base fields only: `ConversationId`→Conversations, `UserId`→_User, `Direction` (String), `Data` (Object), `Message` (HTML/XML), `File` (PrivateFile), `errors` (Array), `failed`/`failedAt`, `IsErrorRead`.
- ⚠️ On a fresh table the message fields `Identity`, `sent`/`sentAt`, `delivered`/`deliveredAt`, `read`/`readAt` **don't exist in the schema yet** — Parse **auto-creates them on first write** (master key). Just include them; the columns appear. (If a Create call ever rejects an unknown field, fall back to the base set + put everything in `Data`.)

---

## 3. Critical field rules

### Identities (the #1 source of mistakes)
| Field | Meaning | Example |
|---|---|---|
| `Conversations.Identity` / `ConversationMessages.Identity` | the **customer's** phone, international, **no `+`** | `972500000000` |
| `Channels.Identity` | Meta `phone_number_id` (numeric) | `100000000000000` |
| `Channels.Key` | the business's human phone | `972500000000` |
| `Channels.WaBaId` | WhatsApp Business Account id | `200000000000000` |

In `Data`: an **incoming** message's `from` = the customer; an **outgoing** message's `to` = the customer.

### `Direction`
- `"Incomeing"` — from the customer (⚠️ **keep the product's misspelling exactly** — it is not "Incoming").
- `"Outgoing"` — from the business / rep / bot.

### `Message` vs `Data`
- `Message` = the displayed body, **HTML-escaped** (`&#39;`=`'`, `&#58;`=`:`, `&#47;`=`/`).
- `Data.text.body` = the same text, raw. Keep them consistent (identical if no special chars).

### `Data` payload by message type
**Incoming text:**
```json
{"from":"972500000000","id":"wamid.<unique>","timestamp":"1769775382","type":"text","text":{"body":"שלום"}}
```
**Outgoing text** (replying to a message → `context.message_id` = the message replied to):
```json
{"type":"text","text":{"body":"..."},"messaging_product":"whatsapp","recipient_type":"individual",
 "to":"972500000000","context":{"message_id":"<prev-msg-id>"},"id":"wamid.<unique>"}
```
**Outgoing template** (REQUIRED when >24h after the customer's last inbound — see window rule):
```json
{"type":"template","template":{"name":"payment_reminder","language":{"code":"he"},
 "components":[{"type":"BODY","parameters":[{"type":"text","text":"..."}]},
 {"type":"button","sub_type":"URL","index":"0","parameters":[{"text":"לתשלום"}]}]},
 "messaging_product":"whatsapp","recipient_type":"individual","to":"972500000000","id":"wamid.<unique>"}
```
**Incoming media** (document/audio/image/video) — the media block carries the payload:
```json
{"from":"...","id":"wamid.<unique>","timestamp":"...","type":"document",
 "document":{"filename":"x.pdf","caption":"...","mime_type":"application/pdf","sha256":"...","id":"<media-id>","url":"https://lookaside.fbsbx.com/..."}}
```
and set `Conversations.HasMedia = true`.

### `id` (wamid) & `timestamp`
- `Data.id` (wamid) must be **unique per message** — for synthetic data use a pseudo value like `wamid.SYNTH-<conv>-<n>`.
- Incoming `Data.timestamp` = **Unix seconds as a string** (`"1769775382"`).

### Delivery status (successful outgoing only)
```json
"sent":true,"sentAt":{...},"delivered":true,"deliveredAt":{...},"read":true,"readAt":{...}
```
Keep timestamps non-decreasing: `sentAt ≤ deliveredAt ≤ readAt`.

### The 24-hour window rule (makes data realistic)
Free-text outbound is blocked >24h after the customer's last inbound; you must send a **`template`** instead. So in synthetic data: if an outgoing message is >24h after the last incoming, make it a `template` — OR mark it failed:
```json
"failed":true,"failedAt":{...},
"errors":[{"code":131047,"title":"Re-engagement message","error_data":{"details":"...more than 24 hours..."}}]
```

---

## 4. Conversation-level coherence
- All messages in a thread share the same `ConversationId` and `Identity`.
- `Conversations.LastMessageAt` = the last message's time; `Title` = preview (usually last message text); `UnreadCount` = # unread inbound (0 if all handled, >0 if it ends on an unanswered inbound); `HasMedia` = true if any media message.
- Closed thread: `StatusId`→"סגורה", `StateId`→"סגור", set `ClosedAt`.
- Link CRM: set `AccountId`/`ContactId` (and `SaleId`/`CaseId`/`TaskId` if relevant); set `OwnerId` to the handling rep; on outgoing messages set `UserId` to the same rep/bot.

---

## 5. ⚠️ PERMISSIONS (CLP) — do this or the data is INVISIBLE

**The single most important step.** Records created via MCP use the **master key**, so `Get-Data` will always see them. But the **UI (account-card MyChat widget, the MyChat inbox) runs as the logged-in user** and is subject to **Class-Level Permissions**. If a MyChat table's CLP doesn't grant `find`/`get` to the viewing user's role, the UI query is **denied → renders empty**, even though the rows exist. This looks exactly like "the data didn't get created" — but it's a permissions lock.

**Symptom seen live:** the `Conversations` table CLP had been wiped to `find:{}` / `get:{}` (no role granted = locked to everyone except master key). Master-key `Get-Data` returned all conversations; the card widget and the MyChat inbox showed nothing. Granting find/get fixed it.

**What to do — before declaring success:**
1. `Get-Table-Permissions` on **`Conversations`**, **`ConversationMessages`**, **`Channels`** (and the lookups `ChannelTypes`/`ConversationStates`/`ConversationStatuses` if the UI joins them).
2. An action object that is **empty `{}` means NO ONE** (except master key) — that's the lock. Fix it with `Set-Table-Permissions`.
3. The native MyChat tables expect roles **`Admin`, `MyChatAdmin`, `MyChatUser`** (this is what `ConversationMessages`/`Channels` normally carry). Align `Conversations` to the same. To guarantee any logged-in user (incl. the demo admin) sees the data, you can also grant `find`/`get`/`create`/`update` to `requiresAuthentication: true`; keep `delete` restricted to `Admin`/`MyChatAdmin`.
4. `Set-Table-Permissions` **replaces** the whole CLP object — pass the complete set (all six actions), don't send a partial.
5. Re-verify with `Get-Table-Permissions`, then check the UI.

```jsonc
// Example: open Conversations to logged-in users, keep delete admin-only
Set-Table-Permissions(table:"Conversations", classLevelPermissions:{
  find:{ "requiresAuthentication": true },
  get:{ "requiresAuthentication": true },
  create:{ "requiresAuthentication": true },
  update:{ "requiresAuthentication": true },
  delete:{ "role:Admin": true, "role:MyChatAdmin": true },
  addField:{}
})
```

---

## 6. ⚠️ Visibility gotchas (beyond CLP)

- **MyChat inbox needs a *connected* channel.** The inbox lists conversations only on a recognized/connected channel (a real Meta/WABA connection with `MetaBusinessPortfolio`/`UsersAssignment`). A **synthetic channel will NOT appear in the inbox** — there's no way to fully fake a live Meta connection. Surface the conversation history on the **customer card** instead (that's the natural demo place anyway).
- **Account-card native "שיחות MyChat" widget may not render.** In the native Account card, the Conversations widget inside "ריכוז אירועים" is wired by the platform JS via a CSS-class hook; if that particular widget lacks the hook + carries `data-disable-load=true`, it never loads. The reliable fix: add a **dedicated read-only Conversations related-table widget** to the card, auto-filtered by `AccountId` (the Conversations→Accounts pointer), with no `data-disable-load`. (Avoid adding a *second* `data-simbla-class="Conversations"` table if the native one already works — the native JS selects by that attribute and a duplicate can conflict.)

## 7. ⚠️ Field-write gotchas
- **`File` (PrivateFile) cannot be written** with the webhook's `{type:"resource_link", uri:...}` Object → `error 111: expected PrivateFile but got Object`. That shape is read-only *output*. For synthetic media, put the payload in `Data.document`/`Data.audio`/`Data.image` and set `HasMedia=true`; skip the `File` field (attaching a real stored file requires uploading via the file API first).
- **`createdAt` cannot be backdated** — Parse forces it to the server insertion time. To make a thread look historical, set the *writable* date fields: `Data.timestamp` (incoming), `sentAt`/`deliveredAt`/`readAt` (outgoing), `Conversations.LastMessageAt`/`ClosedAt`. Create each conversation's messages in **one ordered `Create-Many` batch** so their (real) createdAt preserves message order.

---

## 8. End-to-end example (MCP)

**A. Channel (once, if Channels is empty):**
```jsonc
Create-Data(table:"Channels", data:{
  "Name":"וואטסאפ עסקי (לדוגמה)", "TypeId":{"__type":"Pointer","className":"ChannelTypes","objectId":"<WhatsApp>"},
  "Key":"972500000000", "Identity":"100000000000000", "WaBaId":"200000000000000",
  "DefaultOwnerId":{"__type":"Pointer","className":"_User","objectId":"<user>"}, "HasChatBots":false })
// → save the returned channel objectId
```

**B. Conversation:**
```jsonc
Create-Data(table:"Conversations", data:{
  "ChannelId":{"__type":"Pointer","className":"Channels","objectId":"<channel>"},
  "ChannelTypeId":{"__type":"Pointer","className":"ChannelTypes","objectId":"<WhatsApp>"},
  "Identity":"972500000000", "ContactName":"ישראל ישראלי",
  "Title":"שאלה על הדוח החודשי",
  "AccountId":{"__type":"Pointer","className":"Accounts","objectId":"<account>"},
  "ContactId":{"__type":"Pointer","className":"Contacts","objectId":"<contact>"},
  "OwnerId":{"__type":"Pointer","className":"_User","objectId":"<rep>"},
  "StatusId":{"__type":"Pointer","className":"ConversationStatuses","objectId":"<בטיפול>"},
  "StateId":{"__type":"Pointer","className":"ConversationStates","objectId":"<פתוח>"},
  "UnreadCount":0, "HasMedia":false,
  "LastMessageAt":{"__type":"Date","iso":"2026-06-13T06:30:00.000Z"} })
// → save the returned conversation objectId (e.g. NEWCONV1234)
```

**C. Messages (one ordered batch):**
```jsonc
Create-Many(table:"ConversationMessages", data:[
  { "ConversationId":{"__type":"Pointer","className":"Conversations","objectId":"NEWCONV1234"},
    "Direction":"Incomeing", "Identity":"972500000000", "Message":"היי, ראיתי את הדוח, אפשר הסבר?",
    "Data":{"from":"972500000000","id":"wamid.SYNTH-1-1","timestamp":"1781000000","type":"text","text":{"body":"היי, ראיתי את הדוח, אפשר הסבר?"}} },
  { "ConversationId":{"__type":"Pointer","className":"Conversations","objectId":"NEWCONV1234"},
    "UserId":{"__type":"Pointer","className":"_User","objectId":"<rep>"},
    "Direction":"Outgoing", "Identity":"972500000000", "Message":"בשמחה! ה-CTR עלה 18%...",
    "Data":{"type":"text","text":{"body":"בשמחה! ה-CTR עלה 18%..."},"messaging_product":"whatsapp","recipient_type":"individual","to":"972500000000","context":{"message_id":"wamid.SYNTH-1-1"},"id":"wamid.SYNTH-1-2"},
    "sent":true,"sentAt":{"__type":"Date","iso":"2026-06-13T06:25:00.000Z"},
    "delivered":true,"deliveredAt":{"__type":"Date","iso":"2026-06-13T06:25:02.000Z"},
    "read":true,"readAt":{"__type":"Date","iso":"2026-06-13T06:30:00.000Z"} }
])
```

**D. Update the conversation** so `LastMessageAt`/`Title`/`UnreadCount`/`HasMedia` reflect the final message (and set `StatusId`=סגורה/`StateId`=סגור/`ClosedAt` if closed).

**E. Fix CLP** (Section 5) and **verify** (Section 9).

---

## 9. Verification checklist
- [ ] **CLP**: `Conversations`/`ConversationMessages`/`Channels` grant find/get to the viewing role(s) — no empty `{}` action that locks the UI. (Section 5.)
- [ ] Each message has a valid `ConversationId` and the same `Identity` as its conversation.
- [ ] `Direction` is exactly `"Incomeing"` / `"Outgoing"`.
- [ ] `Message` matches `Data.text.body`; every `Data.id` (wamid) is unique; incoming carry `from`+`timestamp`.
- [ ] Successful outgoing carry `messaging_product`/`recipient_type`/`to` + a `sent→delivered→read` chain with non-decreasing times.
- [ ] No free-text outgoing >24h after last inbound (else `template`, or `failed`+`131047`).
- [ ] Media messages carry a `Data.document/audio/image` block and the conversation has `HasMedia=true`.
- [ ] `Conversations.LastMessageAt`/`Title`/`UnreadCount` updated; closed threads have `ClosedAt` + closed status/state.
- [ ] Visible in the UI on the **customer card** (a Conversations widget filtered by AccountId). The **MyChat inbox** will only show them if the channel is a real connected WABA (synthetic channels won't appear there — expected).
