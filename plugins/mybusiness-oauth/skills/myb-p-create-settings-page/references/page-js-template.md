# Settings Page JS Template

The page JS for a System-Tables-style settings page. It does three jobs:

1. **Fixes the card sub-heading** copied from the template (e.g. "סטטוסי משימות") — there is no MCP
   tool to edit a free `<h2>`, so we rewrite it client-side on load.
2. **Mirrors built-in behavior** — calls `EndLoader()` on `data-loaded` (hides the spinner) and
   highlights the parent dropdown when a child nav item is "current", exactly like the product's own
   `system-tables-*.js` files.
3. **(Optional) Renders a color swatch** next to each row's `Color` value — drop this block if your
   lookup table has no `Color` column.

## Placeholders

| Placeholder | Example | Meaning |
|---|---|---|
| `{{OLD_HEADING}}` | `סטטוסי משימות` | the card heading copied from the template (read it from the page content) |
| `{{NEW_HEADING}}` | `סטטוסי ספקים` | the heading you want |
| `{{COLOR_FIELD}}` | `Color` | the color column's `data-field` (omit the swatch block if none) |

## Template

```javascript
// <Entity> statuses settings page JS

$(function () {
    // 1) Fix the card sub-heading inherited from the template (no MCP tool edits free text)
    $('.simbla-table .textContainer.H2 h2 span, .simbla-table .textContainer.H2 h2').each(function () {
        if ($(this).text().trim() === '{{OLD_HEADING}}') $(this).text('{{NEW_HEADING}}');
    });

    // 3) OPTIONAL — render a small color swatch next to each status color value.
    //    Delete this whole function + its callers if the table has no color column.
    function decorateColors() {
        var colorIdx = $('.simbla-table thead th').index($('.simbla-table thead th[data-field="{{COLOR_FIELD}}"]'));
        if (colorIdx < 0) return;
        $('.simbla-table tbody tr').each(function () {
            var $td = $(this).find('td').eq(colorIdx);
            // read just the text node, ignoring an already-inserted swatch
            var hex = $td.clone().children().remove().end().text().trim();
            if (hex && !$td.find('.color-swatch').length && /^#?[0-9a-fA-F]{3,8}$/.test(hex)) {
                var c = hex.charAt(0) === '#' ? hex : '#' + hex;
                $td.prepend('<span class="color-swatch" style="display:inline-block;width:14px;height:14px;border-radius:3px;margin-left:6px;vertical-align:middle;border:1px solid #ccc;background-color:' + c + '"></span>');
            }
        });
    }

    // 2) On data load: hide loader (matches built-in pages) and decorate colors
    $('.simbla-table').on('data-loaded', function () {
        if (typeof EndLoader === 'function') EndLoader();
        decorateColors();
    });

    // 2) Highlight the parent dropdown when a child nav item is current
    if ($('.dropdown-menu > li > a').hasClass('current')) {
        $('.dropdown-menu > li > a.current').closest('.dropdown').find('> a').addClass('current');
    }

    // Polling fallback — decorate even if data-loaded fired before this handler attached
    var attempts = 0;
    var iv = setInterval(function () {
        attempts++;
        if ($('.simbla-table tbody tr').length) decorateColors();
        if (attempts > 20) clearInterval(iv); // stops after ~10 seconds
    }, 500);
});
```

## Why the polling fallback

`data-loaded` may fire before this handler attaches (the inline table can render before the external
JS file is parsed). The 500 ms poll (capped at ~10 s) guarantees the swatches and heading get applied
even in that race, while the idempotent `!$td.find('.color-swatch').length` check prevents duplicates.

## Upload

```
Upload-Public-File(file: {name: "system-tables-<entity>-statuses.js",
  mimeType: "text/javascript", codeFile: true, data: "<base64 of the filled-in file>"})
```
Then wire the returned URL with `Set-Page-Settings(pageId, jsFile: "<URL>", ...)` (see SKILL.md Phase 5).
