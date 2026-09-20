# Mockup visual baseline

Last compared with the rendered CRM: **2026-09-20**, using an authorized demo account.
Read-only inspection covered dashboard, customer list, customer record sheet, settings
landing/detail, weekly calendar and pipeline. No live records were modified. Only sanitized
visual facts appear here; account identifiers, tenant URLs and captures remain private.

## Current CRM shell

| Element | Observed desktop baseline |
|---|---|
| Background | White; title strips #F4F4F4. Avoid pale cards around every page. |
| Header | White, 71px; actual MyBusiness wordmark right; user/apps/bell left. |
| Right navigation | 232px, #252C57; 62px rows; padding 5px 25px 5px 20px. |
| Navigation icons | 44px circles #3D4993; selected circle #62A6FF; selected label bold. No whole-row fill. |
| Navigation type | Helvetica/Arial, 12px, white. |
| Page title | Heebo, 24px/600 on a 62px #F4F4F4 strip; overview title 18px. |
| Body/table | Assistant 14px; navy #252C57. |
| Inputs | 42px high; 1px #8B93A8; radius 7px; Assistant 15px. |
| Table header | #252C57, white 14px/700; 14px 15px padding; about 48px high. |
| Table row | White; #F0F0F0 divider; 12px 15px padding; about 45px high. |
| Search button | #3D4993; white 12px/600; 6px 20px padding; radius 7px. |
| Cards | White, radius 7px, light border, subtle shadow; used selectively. |

Native navigation labels: מבט-על, חיפוש לקוחות ולידים, לידים, לקוחות, אנשי קשר,
משימות, יומן, פעילויות, מכירות, פניות, דוחות, הגדרות. A scoped prototype may omit
unimplemented destinations. Gallery and pattern names are not native menu labels.

## Composition matters

- Customer list: grey title strip and new-record action, blue-underlined search heading,
  four-column filter grid, search button, substantial gap, navy-header table and pager.
  Page size is on the right, record count on the left. A generic toolbar/card is insufficient.
- Customer record: sheet anchored LEFT, 80vw, full viewport height. Navy 65px header;
  form roughly 60% on the right, timeline on the left. Three form columns at wide widths,
  related-data tabs below, sticky save actions at the bottom.
- Overview: right two-thirds for tabbed/filterable table content, left third for four
  KPI cards in a 2x2 grid and a chart underneath. Preserve this hierarchy before details.
- Settings landing: centered underlined heading; four columns of tall outlined tiles,
  blue illustrations, title and description. Detail screens add a white navigation card
  around 240px wide and a narrower content card with grey band heading.
- Calendar: user selector above a card, week navigation in its toolbar, seven day columns,
  hourly lines, time labels on the right, pale-blue current-day column.
- Pipeline: white columns in one outlined/shadowed board, headings and summaries above,
  compact white cards with an accent edge. Stages are configuration-dependent.

## Starter scope and remaining differences

The starter uses these structures with synthetic data. Its sidebar includes only implemented
destinations. Icons, tile illustrations, fields, tabs, stages and KPI data are reduced examples.
Mobile adaptation and local interactions are design choices, not a clone of every native
workflow. Other patterns are proposed compositions. Gallery UI is outside the product shell.
Compare the specific target at the same viewport before claiming exact fidelity.

## Historical module references

The original fourteen HTML references derive from a 2026-07-17 capture. They were sanitized,
not revalidated across every module in September.

- MyBusiness, MyChat and MyCollege use the CRM right-navigation family.
- MyBooks, MyCampaigns and TimeSheet have their own module branding/navigation.
- MyBooks references cover overview and document lists.
- MyChat uses a conversation list/message pane; local message append does not imply delivery.
- MyCampaigns references cover campaign overview.
- MyCollege combines filter/table and KPI/chart columns.
- TimeSheet uses hours/project navigation and a timesheet dashboard.

Read the runtime app tour for context. Use the matching module shell and verify the actual
target before reuse. Never make screenshots or tenant exports public template fixtures.
