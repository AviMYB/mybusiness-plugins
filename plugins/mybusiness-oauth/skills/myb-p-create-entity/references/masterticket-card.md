# Phase 4B — a MasterTicket card for a custom entity

Run this **instead of Phase 4** when the entity's card must carry the **record timeline** or otherwise
behave like a built-in card: two columns, ticket header, save bar, and a direct URL (`?oid=`) that
opens a populated record. Phase 4 (`Create-Form-Page` → NewMaster) stays the default for everything
else — it is shorter and has none of the traps below.

Budget an extra hour and follow **every** step. Partial application is the failure mode: the card
looks right and its buttons do nothing, or it silently saves into another table.

The platform facts behind each step — what the copy inherits, why the inherited form cannot be
removed, the exact contract the master expects — are in the product KB:
[`../myb-p-kb/references/30-customization/03-pages-and-layouts.md`](../myb-p-kb/references/30-customization/03-pages-and-layouts.md) §2a.
Read §2a before starting; this file is the procedure only.

Placeholders used below: `<Entity>` singular page name · `<Entities>` class name ·
`<SourceTicket>` the built-in ticket card you copy · `<SourceClass>` its class · `<formId>` the id
of the form you inject · `<ns>` a short event namespace unique to this page.

---

## 4B.0 — The one hard constraint, before you touch anything

A card page writes to exactly one class, decided by **`data-simbla-class` on its `<form>`**. A page
copy inherits the source's binding, the copy tool does **not** rewrite it (it rewrites only the
form's `name`, which nothing reads), and no MCP tool can change it afterwards — the form element is
not even addressable by `Edit-Page`.

So plan for this shape from the start: the inherited form stays in the stored HTML, your own
correctly-bound form is **added** next to it, and the page's JS removes the inherited one at load
(4B.3). That is safe and complete; the permanent cleanup is 4B.12.

§2a lists the six things people try and the exact error each returns. Do not re-test them.

## 4B.1 — Create the page by copying a built-in ticket card

```
Create-Table-View-Page({
  tableName:      "<Entities>",
  pageName:       "apps/mybusiness/<Entity>Ticket",
  copyFromPageId: "<id of a MasterTicket card>",     // Get-Site-Pages → e.g. apps/mybusiness/Case
  title:          "<Hebrew label>"
})
```

- `copyFromPageId` is the **only** lever that chooses a master — the copy inherits it.
- Pick the **smallest** built-in ticket card available: everything it contains is inherited and
  nothing can be deleted through MCP.
- Omit `menuName` unless you want a menu entry; the tool adds one when given.

Verify immediately with `Get-Page-Settings`: `masterPageId` must equal the source's, and note the
inherited `jsFile` — it is the source entity's page JS, and it is what keeps the copy working until
4B.4.

## 4B.2 — Put your entity's card into the page

```
Add-Container-to-Page({ pageId, afterElement: "<inherited form id>", isFullWidth: true })
```

`Add-Container-to-Page` resolves the form id that `Edit-Page` cannot see — this is the one tool that
can position against it. Then `Edit-Page` `set-html-content` into the returned `innerContainerId`,
writing a complete form:

```html
<form class="simblaEL dbForm" id="<formId>" name="<Entities>"
      data-simbla-class="<Entities>" onsubmit="return createSimblaObj(this)">
  ...rows, columns and fields...
</form>
```

If the entity already has a working NewMaster card, take that page's `_MPID0` **verbatim** — it is a
correctly-bound form and it carries all the field wiring, form rules and tabs already built.

⚠️ `set-html-content` writes **inner** HTML. When the target is an `htmlEditor` element, include the
platform's own wrapper — `<div style="width:100%" class="htmlContent">…</div>` — or the element
renders wrong. Always read the region back (full content, not `minimal: true`) after writing.

## 4B.3 — Neutralise the inherited form (page JS, once)

The master resolves the form **at click time** — `document.forms[0]`, `$("form")` and `$(".dbForm")`
— so removing the inherited element during page load is sufficient and complete.

```js
/* This page was produced by copying <SourceTicket>, which brought its own
   <form data-simbla-class="<SourceClass>"> as the first element of the content area.
   The master saves through document.forms[0] / $("form") / $(".dbForm"), all resolved
   at click time, so that empty form hijacks every save. No MCP tool can delete, rebind
   or move it (KB 30/03 section 2a). Removing it here is the minimal fix.
   The emptiness check keeps this harmless if it ever runs on the real <SourceClass> card.
   -> Permanent fix: delete the element in the page editor, then drop this block. */
(function () {
    var stray = document.querySelector('form.dbForm[data-simbla-class="<SourceClass>"]');
    if (!stray) { return; }
    if (stray.querySelector('input, select, textarea')) { return; }
    stray.parentNode.removeChild(stray);
})();
```

This is the same repair the list-page template already makes for an inherited search form
(Constraint 6) — one element further along.

## 4B.4 — Satisfy the ticket-shell contract ← the step everyone misses

The copied page inherits the source's `jsFile`, which already declares the contract **for the source
entity**. The moment you point `jsFile` at your own file, every button dies — no error, no console
message, nothing on click — because the master gates both save handlers on a variable it never
defines:

```js
if (!formSubmit === true) { return; }   // in the .SaveBtn and .SaveEditBtn handlers
```

`formSubmit` is undefined → `!undefined === true` → return. Your page JS must declare the contract:

```js
var saveEditAction = "<Entity>Ticket";
var entity         = "<Entities>";
var redirectTo     = "<Entity>Ticket?cls=<Entities>&Mode=Ticket&oid=";
var formSubmit     = true;                 // without this, nothing saves

$(document).ready(function () {
    if (typeof checkIsModal === 'function') { checkIsModal(); }
});

$(document).on('simblaobjectsettoform', function () {
    /* the ticket bar's edit button = entry to the page editor for this element */
    $(".editTicket").off('click.<ns>').on('click.<ns>', function () {
        if (typeof loginToAdmin === 'function') {
            loginToAdmin("design", undefined, undefined, undefined, "<formId>");
        }
    });

    /* the master hides "save" at load; the card shows and wires it */
    $(".SaveAndStay").show();
    $(document).off("click.<ns>Save", ".SaveAndStay")
               .on("click.<ns>Save", ".SaveAndStay", saveAndStay);

    $(":input").change(function () { unsaved = true; });
});
```

`checkIsModal`, `saveAndStay` and `unsaved` come from the master; `loginToAdmin` is global. Guard the
optional ones with `typeof` so the page degrades instead of throwing.

**Read the tenant's own built-in card file first** (`Get-Page-Settings` on e.g. `apps/mybusiness/Case`
→ fetch its `jsFile`). The names above are the contract as served today; a tenant may carry a newer
master.

## 4B.5 — Remove the duplicate button bar

If the injected card came from a NewMaster page it carries its own footer row with save buttons
**inside** the form, while the master supplies a bar **outside** it — two "save & close" buttons.
Hide the inner one, and only when a master bar actually exists, so the source NewMaster card is
unaffected:

```js
$(function () {
    var hasMasterBar = false;
    $('.SaveBtn').each(function () { if (!this.closest('form')) { hasMasterBar = true; } });
    if (!hasMasterBar) { return; }
    $('form .rDivider.footer').hide();
});
```

## 4B.6 — Set the card header

The master shows a generic caption; each card sets its own. Both modes matter — opened from its list
the card is `Mode=Ticket` in `#SideModalTicket`; opened as a related record from another card it is
`Mode=Modal` in `#SideModal`:

```js
var hdrSel = (QueryString.Mode === 'Ticket' ? '#SideModalTicket' : '#SideModal') + ' .modal-header';
```

Fill the record's name from the native `simblaobjectsettoform` event — never a timer. On a **new**
record that event never fires, so set a static "<label> חדש" caption and swap it after the first save.

## 4B.7 — Do not let page CSS shrink the ticket modal

A width rule written earlier for a NewMaster sidebar — typically on the **list** page — also matches
`#SideModalTicket` and shrinks the ticket card. Scope such rules to `#SideModal` only.

Verify by measurement, not by eye: open a built-in ticket card and yours in the same viewport and
compare `getComputedStyle(dialog).width`. They should match.

## 4B.8 — Design for what the master does per mode

`Mode=Modal` hides the timeline column, widens the form column, hides every `.simbla-table` and
`.statusRow`, and hides the edit button. No `oid` (a new record) hides the timeline column in either
mode. Full table in KB §2a.

Two consequences: **child tables are invisible** when the card is opened as a related record, and on
a new record the timeline column must come back after the first save — reverse the master's own
class swap:

```js
col.css('display', '');
col.siblings('.col-md-12').removeClass('col-md-12').addClass('col-md-7');
```

## 4B.9 — Repoint every entry point, then prove it

A custom entity's card is usually reached from more places than its own list. Sweep the **whole
site** instead of guessing: read every page's content and `jsCode` and search for the old page name.
Typical hits: the entity's list `jsFile`, a parent card's "open" handler duplicated across several
cards, and the timeline entry template.

Every entry point must target the mechanism this card supports: `Mode=Ticket` → `#iframeModalTicket`
+ `#SideModalTicket`.

⚠️ **A list page's `jsFile` overrides the table's `editView`.** If the list opens the card from its
own JS, changing `Edit-Table-View` accomplishes nothing — a change that looks applied and has no
effect. Check the `jsFile` first.

⚠️ **Re-uploading a code file under the same name serves stale content for up to a day.** Give every
deploy a new filename and repoint `jsFile`.

## 4B.10 — Wire the timeline

Recording is `myb-p-record-timeline`; **display** on this card is the other half and is a separate
per-tenant page change on the shared `apps/mybusiness/Timeline` page — the class whitelist in
`metaTags` (write the whole array, defaults included), a scoping filter field carrying **both**
`class="select-pointer"` and `targetclass="<Entities>"`, an `<li>` template for the type, its four
CSS rules, and a filter checkbox. Follow that skill; the mechanics are in KB
`20-data-model/04-system-tables-and-logs.md` §1.11.

Three renderer behaviours to plan for while you are here:

1. **Hebrew verb gender** is a heuristic over words in the entry title, and the shared renderer
   rewrites one of those words when the host page has no checked `IsAccount` input — which a custom
   card does not have. Fix the wording **in the page**, after the renderer runs. Never edit the
   shared renderer.
2. **Only the latest entry shows by default** — the renderer constrains the query to
   `Pinned = true OR Last = true` unless the "history" checkbox is ticked. Every write still creates
   its own row; verify with `Count-Data` before believing a bug report.
3. **"Add new"** on the timeline opens the platform's add-child modal. Hide it for entities that
   have no such child.

Scope all of it to the calling card with `window.parent.QueryString.cls` so other cards are
untouched.

## 4B.11 — Verification protocol (all of it, in a browser)

`success: true` is not verification, and neither is a DOM count.

| # | Check | Pass condition |
|---|---|---|
| 1 | `document.forms` inside the card | exactly **one**, bound to `<Entities>` |
| 2 | dialog width vs a built-in ticket card | equal |
| 3 | timeline column | present in `Mode=Ticket`, hidden on a new record |
| 4 | visible save buttons | one of each |
| 5 | edit a field → **save** | the record re-read from the API shows the new value and a later `updatedAt`; the modal stays open |
| 6 | edit a field → **save & close** | value persisted **and** modal closed |
| 7 | record count of `<SourceClass>` | unchanged — proves the inherited form is not creating empty records |
| 8 | new record → save | created, server-assigned fields populated, header switches to the name, timeline column returns and filters to the new id |
| 9 | every entry point from 4B.9 | opens this page, the right record, one bound form |

Take the count in check 7 **before** the save tests and compare after. A silent extra record in the
source class is the signature of a half-applied 4B.3.

## 4B.12 — Making the fix permanent

4B.3 leaves the inherited form in the stored HTML. To remove it for good, open the page editor and
delete the element, then drop the 4B.3 block and re-run the 4B.11 checks.

**The editor is reachable from the card itself**: the ticket bar's edit button calls
`loginToAdmin("design", …, "<elemId>")`, which opens the page editor on that page and element in a
new tab, using the session already signed in. This is also the answer to "the editor needs a separate
account" — from inside a ticket card, it does not.

---

## Symptom → cause

| Symptom | Cause |
|---|---|
| Save buttons do nothing, no error anywhere | `formSubmit` not declared — 4B.4 |
| Card saves to the wrong table / empty records appear in another class | inherited form still first — 4B.3 |
| Everything worked until the page JS was replaced | the inherited `jsFile` had been carrying the contract — 4B.4 |
| Two "save & close" buttons | the injected card's own footer — 4B.5 |
| Card opens narrower than built-in cards | a page CSS width rule reaching `#SideModalTicket` — 4B.7 |
| Header shows a generic caption | never set, or set only for `Mode=Ticket` — 4B.6 |
| Timeline empty although `_Timeline` rows exist | filter field missing `select-pointer` + `targetclass` — 4B.10 |
| Timeline shows one entry that keeps changing | the `Pinned OR Last` default — 4B.10 |
| Child tables missing | the card was opened as `Mode=Modal` — 4B.8 |
| Changing the table's `editView` has no effect | the list's `jsFile` opens the card itself — 4B.9 |
| A code change does not take effect | same-filename re-upload — 4B.9 |
| The page "looks" bound to the right class but saves elsewhere | `minimal: true` shows `name`, not `data-simbla-class` — 4B.0 |

## Worth raising with the product team

1. No element delete, no form rebind, no master reassignment — any one of them removes the need for
   4B.3.
2. `Create-Table-View-Page` rewrites a copied **table**'s class but not a copied **form**'s. Making
   it rewrite both would make 4B.1 complete on its own.
3. The ticket-shell contract fails silently. A `typeof formSubmit === 'undefined'` warning in the
   master would turn a day of debugging into one console line.
