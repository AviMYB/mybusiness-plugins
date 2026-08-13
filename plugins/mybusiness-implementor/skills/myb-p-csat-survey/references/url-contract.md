# The link contract — email → public page

Read this before editing the email template. A template that renders a placeholder literally, or a link missing the phone, fails silently: the recipient sees a normal-looking mail, clicks, and nothing is recorded.

## 1. The URL

```
https://<tenant-public-host>/<survey-page>?c={{{objectId}}}&p={{{PhoneNumber}}}&r=<N>
```

| Param | Carries | Notes |
|---|---|---|
| `c` | the business record's objectId | 10 chars; the page sends it as a bare id, never a wrapped pointer |
| `p` | the customer's phone | **mandatory** — `web2table` returns 422 without it |
| `r` | the rating value | one link per level; this is what makes it one-click |

One link per rating level, identical except for `r`. Nothing else belongs in the URL — anything you add is visible to the recipient and lands in server logs.

## 2. Which placeholders actually resolve

Do not assume. Verified behaviour in email templates:

- `{{{objectId}}}` — resolves to the triggering record's id. ✅
- `{{{PhoneNumber}}}` — resolves **when the record itself carries the phone**. Many service tenants mirror the customer phone onto the case; check `Get-Schema` first.
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

**A. The page and the projection, with no mail at all.** Take a real (or test) record, read its objectId and phone, hand-build the URL, and open it in a logged-out browser (or a private window). Then confirm the intake row exists and the rating landed on the record:

```
Get-Data(table: "<intake table>", order: "-createdAt", limit: 2)
Get-Data(table: "<business table>", where: {objectId: "<the record>"}, keys: ["CsatRating","CsatComment","CsatAt"])
```

This validates everything except the template.

**B. The rendered template, with the mail diverted to an internal address.** Create a test contact whose address is your own (`you+test@…`), attach a test record to it, enable the send trigger for a controlled window, close the record, then read what was actually sent:

```
Get-Data(table: "Emails", order: "-createdAt", limit: 1)
```

In that body, check: zero literal `{{{` remain · three distinct hrefs · each carries a non-empty `c` and `p` · the `r` values differ. Then open one href in a logged-out browser and re-run check A's verification.

**Before enabling the trigger for the window:** confirm *every* email action on it is diverted, not just the first. Disable it afterwards in a `finally` and verify with `Get-Triggers` that `active` is really `false`.

## 5. If the customer rejects the phone in the URL

The fallback is an opaque token: add a random token column to the business record, put the token in the link instead of `c`+`p`, and resolve it server-side. That requires a cloud function (the public page cannot look up a record anonymously — anonymous reads are rejected), which moves the effort class up and adds a dev dependency. Present the cost before promising it.
