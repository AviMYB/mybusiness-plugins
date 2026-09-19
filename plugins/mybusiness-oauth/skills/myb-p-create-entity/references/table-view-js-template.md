# Table View Page JS Template

Template for the custom JavaScript file uploaded for the list page. This template is battle-tested against all the platform bugs documented in SKILL.md.

## Why this specific structure

1. **Everything wrapped in `$(function(){...})`** — the inline jsCode might render before `.simbla-table` exists in DOM; direct `.on()` attachments would miss. Document-ready fixes this.
2. **Polling fallback** — `data-loaded` may fire before our handler attaches, or not fire at all if the table loaded before we registered. Polling ensures decoration runs even then.
3. **Idempotent decoration** — checks `!$td.find('a.entity-link').length` before re-wrapping, so polling doesn't duplicate work.
4. **Name click opens the entity card** — by triggering the row's edit pencil, which opens the Phase-4 card per the list's `editView` (`modal-left` + `useIframe`; SKILL.md Constraint 1 — NewMaster works fine inside the iframe). When no pencil is present, a direct `Mode=Modal` open is used as fallback. If the list is configured inline-only, the same click simply enters inline edit.
5. **`{{PRIMARY_COL}}` instead of a hardcoded `Name`** — junction entities (enrollments, order-lines, memberships) have **no `Name` column**; their display column is a pointer-display like `AccountId.Name`. A hardcoded `Name` lookup returns jQuery index `-1` and the decoration becomes a silent no-op — nothing clickable, no error. The template warns and falls back to the first column so the failure is at least visible.
6. **`cardUrl()` derives from `window.location.pathname`** — hand-built `apps/mybusiness/...` links double the prefix and 404 (SKILL.md Bug 7), and irregular plurals break naive `s`-stripping; deriving the directory and appending `{{CARD_PAGE}}` avoids both.
7. **"New" sets the iframe `src` itself** — the inherited `data-toggle="modal"` alone opens an **empty** side panel (the classic «"New" does nothing» bug). The handler must point `#iframeModal` at an empty card and then show `#SideModal`.
8. **Hides `.db-form-add`** — the leaked `Add new row` green button from Simbla's built-in that shows when `allowEdit=true`.
9. **Fixes inherited `data-simbla-class="Cases"`** — `Create-Table-View-Page` copies from the Cases page.

## Template

Replace placeholders marked with `{{ENTITY_NAME}}`, `{{ENTITY_NAME_HEB}}`, `{{ENTITY_NAME_HEB_SG}}`, `{{ICON_CLASS}}`, `{{PRIMARY_COL}}`, and `{{CARD_PAGE}}`.

```javascript
// {{ENTITY_NAME}} list page JS

var EntityIcon = '<i class="fa {{ICON_CLASS}}" style="padding-left: 7px; color: #4149B4;font-size: 16px;vertical-align: middle;display: inline-block;"></i>';

// --- Card opening (NewMaster path) ------------------------------------------
// The Phase-4 card is NewMaster-based: it opens ONLY inside the side-iframe via
// Mode=Modal (#SideModal + #iframeModal). The inherited Mode=Ticket /
// #SideModalTicket path serves built-in MasterTicket cards (Account/Task/Case)
// and shows an EMPTY card for this entity — never use it here.
// Query-string shape below was live-verified on a production tenant (2026-07);
// if the card loads empty, read the URL the row-pencil path generates on a
// working entity and mirror it exactly.
function cardUrl(oid, isNew) {
    var dir = window.location.pathname.replace(/[^\/]+$/, '');   // directory of the list page — avoids Bug 7
    return dir + '{{CARD_PAGE}}?oid=' + (oid || '') + '&Mode=Modal&cls={{ENTITY_NAME}}'
         + (isNew ? '&New{{ENTITY_NAME}}=true' : '');
}
function openEntityCard(oid, isNew) {
    $('#iframeModal').attr('src', cardUrl(oid, isNew));
    $('#SideModal').modal('show');
}

function decorateEntityRow(tr) {
    // {{PRIMARY_COL}} = the clickable display column.
    // Plain entities: "Name". Junction entities have NO Name field — use the
    // primary pointer-display column, e.g. "AccountId.Name". A wrong value
    // fails silently (index -1), hence the warn + first-column fallback.
    var $ths = $('.simbla-table thead th');
    var nameIdx = $ths.index($ths.filter('[data-field="{{PRIMARY_COL}}"]'));
    if (nameIdx < 0) {
        nameIdx = 0;
        if (!window._primaryColWarned) {
            window._primaryColWarned = true;
            console.warn('entity-list: primary column {{PRIMARY_COL}} not found - falling back to first column');
        }
    }
    var $td = tr.find('td').eq(nameIdx);
    var val = tr.data('val');
    if (!val || !val.id) return;
    var txt = $td.text();

    if (!$td.find('a.entity-link').length && txt !== '') {
        $td.html('<a class="entity-link" href="javascript:void(0)" style="color:#4149B4;font-weight:600;text-decoration:none;cursor:pointer"></a>');
        $td.find('a').text(txt);
        $td.prepend($(EntityIcon));
    }

    // Color status column based on StatusId.Color
    var statusIdx = $ths.index($ths.filter('[data-field="StatusId.Name"]'));
    if (statusIdx >= 0) {
        var $stTd = tr.find('td').eq(statusIdx);
        if (!$stTd.find('.status-pill').length) {
            var so = val.get && val.get('StatusId');
            if (so) {
                var color = so.get ? so.get('Color') : so.Color;
                var name = $stTd.text();
                if (color) {
                    $stTd.html("<div class='status-pill' style='background-color:" + color + ";color:#fff;padding:2px 10px;border-radius:3px;display:inline-block;font-weight:600'>" + name + "</div>");
                }
            }
        }
    }
}

$(function(){
    // Hide the leaked "Add new row" button from Simbla's built-in dynamic-table
    $('<style>.db-form-add{display:none !important;}</style>').appendTo('head');

    // Fix form's inherited data-simbla-class="Cases"
    $('form.dynamic-table-query[data-simbla-class="Cases"]').attr('data-simbla-class', '{{ENTITY_NAME}}');

    // Fix "New" button label (inherited from Cases as "פנייה חדשה").
    // Stripping data-toggle/data-target matters: left in place, the inherited
    // attributes open an EMPTY side panel before our handler runs.
    $('.addNewBtn').html('<span class="fa fa-plus"></span>&nbsp;&nbsp;{{ENTITY_NAME_HEB_SG}} חדש').removeAttr('data-toggle').removeAttr('data-target');

    // Fix head icon (inherited fa-headphones from Cases)
    $('.headIcon i').removeClass('fa-headphones').addClass('{{ICON_CLASS}}');

    // Decorate on data-loaded (primary path)
    $('.simbla-table').on('data-loaded', function() {
        if (typeof EndLoader === 'function') EndLoader();
        $(this).find('tbody tr').each(function(){ decorateEntityRow($(this)); });
    });

    // Re-decorate after inline edit closes
    $(document).on('inline-edit-closed', function(e, d) {
        if (d && d.tr) decorateEntityRow(d.tr);
    });

    // Name click → open the record's card.
    // Preferred: trigger the row's edit pencil so the list's own editView config
    // (modal-left + useIframe → the Phase-4 card) does the opening.
    // Fallback: open the card directly via Mode=Modal (pencil hidden / not rendered).
    $(document).on('click', 'a.entity-link', function(e){
        e.preventDefault();
        e.stopPropagation();
        var $tr = $(this).closest('tr');
        var $editBtn = $tr.find('.editRow, .fa-pencil, [data-action="edit"], .fa-edit').first();
        if ($editBtn.length) { $editBtn.trigger('click'); return; }
        var val = $tr.data('val');
        if (val && val.id) openEntityCard(val.id, false);
    });

    // "New" button — CARD MODE (the default: editView modal-left/right + iframe).
    // Must set the iframe src itself; data-toggle alone opens an empty panel.
    $(document).on('click', '.addNewBtn', function(e){
        e.preventDefault();
        openEntityCard('', true);
    });
    // INLINE MODE instead? (editView {openFrom:"inline"}, no Phase-4 card)
    // Delete the handler above and use the table's built-in add-row:
    // $(document).on('click', '.addNewBtn', function(e){
    //     e.preventDefault();
    //     $('.simbla-table').find('.db-form-add, .addRowBtn').first().trigger('click');
    // });

    // Polling fallback — catches rows even if data-loaded fires before we attach
    var attempts = 0;
    var iv = setInterval(function(){
        attempts++;
        var $t = $('.simbla-table');
        if ($t.length && $t.find('tbody tr').length) {
            $t.find('tbody tr').each(function(){ decorateEntityRow($(this)); });
        }
        if (attempts > 30) clearInterval(iv);  // stops after 15 seconds
    }, 500);
});
```

## Placeholder Values

| Placeholder | Example | Description |
|------------|---------|-------------|
| `{{ENTITY_NAME}}` | `Suppliers` | English table name (plural) — also the Parse className |
| `{{ENTITY_NAME_HEB}}` | `ספקים` | Hebrew entity name (plural) |
| `{{ENTITY_NAME_HEB_SG}}` | `ספק` | Hebrew entity name (singular) |
| `{{ICON_CLASS}}` | `fa-truck` | FontAwesome 4 icon class |
| `{{PRIMARY_COL}}` | `Name` / `AccountId.Name` | The clickable display column. Plain entities: `Name`. **Junction entities (no Name field): the primary pointer-display column.** Verify against the live headers: `$('.simbla-table thead th').map((i,e)=>e.getAttribute('data-field')).get()` |
| `{{CARD_PAGE}}` | `Supplier` | The Phase-4 card page name (singular), as passed to `Create-Form-Page` — appended to the list page's directory by `cardUrl()` |

## Common FontAwesome 4 Icons

| Entity Type | Icon |
|------------|------|
| People/Contacts | `fa-user` or `fa-users` |
| Partners/Affiliates | `fa-handshake-o` |
| Suppliers/Vendors | `fa-truck` |
| Projects | `fa-briefcase` |
| Products/Inventory | `fa-cube` or `fa-cubes` |
| Vehicles | `fa-car` |
| Courses/Education | `fa-graduation-cap` |
| Events | `fa-calendar` |
| Tickets/Support | `fa-headphones` or `fa-ticket` |
| Orders | `fa-shopping-cart` |
| Documents | `fa-file-text-o` |
| Money/Finance | `fa-money` or `fa-dollar` |
| Buildings/Properties | `fa-building` |
| Tasks | `fa-check-square-o` |
| Services | `fa-wrench` |

## Upload and Hookup Process

1. Save the filled-in JS content to a local file (e.g., `entity-list.js` in the working directory).
2. Base64-encode it (Windows-safe, no `/dev/stdin`):
   ```bash
   node -e "console.log(require('fs').readFileSync('entity-list.js').toString('base64'))"
   ```
3. Upload via MCP:
   ```
   Upload-Public-File(file: {name: "entity-list.js", mimeType: "text/javascript", data: "<base64>"})
   ```
4. Copy the returned `filePath` URL.
5. Also clear the inline page jsCode and set the CSS (one call):
   ```
   Edit-Page-CSS-JS(pageId: <listPageId>, jsCode: "", cssCode: ".db-form-add{display:none !important;}")
   ```
   — Clearing `jsCode` avoids conflicts between inline code and the external file.
6. Wire the file URL onto the page (and overwrite the inherited "Cases" SEO title) with `Set-Page-Settings`:
   ```
   Set-Page-Settings(pageId: <listPageId>, jsFile: "<URL>", title: "{{ENTITY_NAME_HEB}}")
   ```
   Verify with `Get-Page-Settings(pageId)`. Then verify the flows yourself if a browser channel exists (SKILL.md Phase 7), and only then ask the user to hard-reload (Ctrl+F5).
7. Delete the local `entity-list.js` file.

## Card-page linking — how it actually works

`Create-Form-Page` always produces a **NewMaster**-based card, and no MCP/Parse API can change a page's master. NewMaster shows empty fields when opened via **direct URL** — but works correctly **inside the side-iframe** for authenticated CRM users. So:

- **The pencil path** — `editView: {openFrom: "modal-left", useIframe: true, page: "<card>"}` (SKILL.md Phase 5c) opens the card correctly. This is what the name-click handler triggers.
- **The direct path** — set `#iframeModal`'s `src` to the card URL with `Mode=Modal` and call `$('#SideModal').modal('show')`. Same result; used by this template's "New" handler and the name-click fallback.
- **What does NOT work** — plain `<a href="Entity?oid=X">` navigation (NewMaster reads nothing from the URL), and the inherited `Mode=Ticket` → `#SideModalTicket` path, which serves **MasterTicket** cards only (the built-in Account/Task/Case). Do not imitate a built-in list's mechanics (e.g. the Accounts list JS) on a NewMaster card — that mismatch is exactly the "clicking does nothing / card opens empty" class of bugs.

If the user insists on a standalone URL-addressable card like the Account card, that requires manually cloning a MasterTicket card in the Simbla page-builder UI (outside MCP scope).
