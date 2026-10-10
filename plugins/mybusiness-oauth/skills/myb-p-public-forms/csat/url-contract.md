# The link contract — email → public page

Read this before editing the email template. A template that renders a placeholder literally, or a link missing a parameter (the record id; the phone in the web2table variant), fails silently: the recipient sees a normal-looking mail, clicks, and nothing is recorded.

## 1. The URL

### 1b. Native variant (default)

```
https://<tenant-public-host>/<survey-page>?<RatingField>=<N>&c={{{objectId}}}
```

| Param | Carries | Notes |
|---|---|---|
| `<RatingField>` | the rating value | named exactly like the intake's rating field — the page's `value-from-url` rule reads the parameter of that name |
| `c` | the business record's objectId | the page sets the pointer from it; nothing is read, the business table stays closed |

No personal data in the URL. Whoever holds the link can add a rating to that record — nothing more (no read, no update).

### 1a. web2table variant

```
https://<tenant-public-host>/<survey-page>?c={{{objectId}}}&p={{{PhoneNumber}}}&r=<N>
```

| Param | Carries | Notes |
|---|---|---|
| `c` | the business record's objectId | 10 chars; the page sends it as a bare id, never a wrapped pointer |
| `p` | the customer's phone | **mandatory** — `web2table` answers HTTP 400 `missing "phone"` without it |
| `r` | the rating value | one link per level; this is what makes it one-click |

One link per rating level, identical except for `r`. Nothing else belongs in the URL — anything you add is visible to the recipient and lands in server logs.

## 2. Which placeholders actually resolve

Do not assume. Verified behaviour in email templates:

- `{{{objectId}}}` — resolves to the triggering record's id. ✅
- `{{{PhoneNumber}}}` (web2table variant only) — resolves **when the record itself carries the phone**. Many service tenants mirror the customer phone onto the case; check `Get-Schema` first.
- `{{{AccountId.PhoneNumber}}}` — one pointer hop is supported. Two hops are not.
- `{{{RecordLink}}}` — ⚠ observed rendering **empty** on a production tenant, with nine templates silently shipping a dead button. Never rely on it without rendering a real mail and looking.
- Conditional sections / loops — not supported. If the copy needs branching, build the branch into separate templates or a mirror field maintained by a trigger.

**The rule:** any placeholder you have not personally seen resolve in a rendered mail on *this* tenant is unverified. A literal `{{{…}}}` in a customer's inbox is the most common failure of this build.

## 3. Editing the template safely

The closing template usually already exists with a CTA button pointing at a placeholder that resolves to nothing (`{{{SurveyLink}}}` and friends are common). Replace the CTA block with `assets/email-faces.html`.

- **Do not regex-replace the button.** A greedy pattern has already eaten a template's header, greeting and case number in one pass. Rebuild the block from a sibling template's skeleton, then diff: logo, greeting, record number, the three faces, and the full footer must all still be there.
- **Re-read the template after saving.** Template bodies are string fields and pass through entity-escaping on every write; `&` between query params is expected to come back as `&amp;` (valid in an `href`) but the rest of the markup should be untouched. If a UI save mangles the block, re-save from the API instead.
- **The three faces must differ by glyph, not only by colour.** Colour is lost in plain-text parts and in some clients; two identical glyphs in different colours make the middle option unreadable — a real mail shipped this way once.

## 4. Verifying without mailing a human

Two independent checks. Run both — they cover different halves.

**A. The page and the projection, with no mail at all.** Take a real (or test) record, read its objectId (and, for the web2table variant, its phone), hand-build the URL, and open it in a logged-out browser (or a private window). Then confirm the intake row exists and the rating landed on the record:

```
Get-Data(table: "<intake table>", order: "-createdAt", limit: 2)
Get-Data(table: "<business table>", where: {objectId: "<the record>"}, keys: ["CsatRating","CsatComment","CsatAt"])
```

This validates everything except the template.

**B. The rendered template, with the mail diverted to an internal address.** Create a test contact whose address is your own (`you+test@…`), attach a test record to it, enable the send trigger for a controlled window, close the record, then read what was actually sent:

```
Get-Data(table: "Emails", order: "-createdAt", limit: 1)
```

In that body, check: zero literal `{{{` remain · three distinct hrefs · each carries a non-empty `c` (and `p` in the web2table variant) · the rating values differ. Then open one href in a logged-out browser and re-run check A's verification.

**Before enabling the trigger for the window:** confirm *every* email action on it is diverted, not just the first. Disable it afterwards in a `finally` and verify with `Get-Triggers` that `active` is really `false`.

## 5. If the customer rejects the phone in the URL

Use the **native variant** (§1b) — it needs no phone and no server function. (The old fallback — an opaque token column resolved by a cloud function — is no longer necessary. If the record id itself must not appear in the link either, put an invite record in between: `../native-form/assets/invite-gate.js`, an invite table opened for `get` only, the link carrying the invite's id.)
