# 1.5.0 — Public forms, card design, chatbots, record timeline

Both plugin variants now carry the full current skill set (24 skills). Authentication configuration, setup guides and permission notes are unchanged.

- **`myb-p-public-forms`** replaces `myb-p-web2lead-web2table` and `myb-p-csat-survey`. One skill for every way a visitor without a login submits data: a native Database form on a public page of your CRM site (platform reCAPTCHA, no phone needed), the capture-data save mode (the table stays closed; required fields, duplicate flag and defaults from one `Config` row), and code for forms on your own website through `getlead` / `web2table`. The satisfaction survey now has a one-click variant with no personal data in the link. Every mechanism was tested end to end on a live system; the getlead code samples now read the wrapped answer (`result`) and branch on the error message.
- **`myb-p-card-design`** replaces `myb-p-page-builder` (record cards, with a layout and aesthetics rulebook).
- **`myb-p-chatbots`** (MyChat bot authoring) and **`myb-p-record-timeline`** (the record timeline / change log) are included for the first time.
- Knowledge base: new reference `30-customization/15-public-forms.md`; the `Config` table is documented as readable and writable through MCP; many corrections since 1.4.2.

If you used the old skill names in your own notes, `myb-p-public-forms` and `myb-p-card-design` are the new ones. Refresh the plugin marketplace and update the installed variant to receive this version.
