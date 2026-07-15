# MCP Tools Catalog

> **Purpose**: THE complete catalog of the MyBusiness MCP server tools (https://mcp.mbapps.co.il/) — per-tool purpose, spec-ready parameters, read-only/mutating classification, and gotchas — so an implementer (human or AI) can plan and execute work without trial-and-error.
> **Last updated**: 2026-06-24 (added `Duplicate-Element`) · **Status**: draft

---

## 0. Server overview

| Item | Value |
|---|---|
| MCP server URL | `https://mcp.mbapps.co.il/` |
| Backing API | Parse Server at `https://api.mbapps.co.il/parse` (see [01-parse-rest-api.md](01-parse-rest-api.md)) |
| Tool count (live) | **64** tools (63 as of 2026-06-10, + `Duplicate-Element` added 2026-06-24; the 2026-02-07 guide says "59 tools" but includes 9 `internal-mcp` agent-management tools that are NOT part of this server, and misses 14 newer tools that ARE live — both sets reconciled below) |
| Scope | One customer app per connection (credentials bound at the MCP connection level) |
| First call | **`Usage-Guide`** — the server's own instruction says: "LLM should start with this prompt!!" |

**Legend**: 🟢 = read-only · 🔴 = mutating (writes data/schema/pages/config). An AI agent in read-only mode may only call 🟢 tools.

### 0.1 Universal condition object (used by triggers, counters, charts, table views, reports)

Two equivalent shapes appear across tools (canonical, from live `Usage-Guide` output):

```json
// Shape A (form rules, page tools)
{ "field": "StatusId", "equesition": "equalTo", "value": "abc1234567",
  "visibleVal": "בוטל", "condOr": false }

// Shape B (triggers, counters, charts, reports, table views)
{ "F": "StatusId", "C": "equalTo", "T": "Pointer", "V": "abc1234567",
  "P": { "targetClass": "CaseStatuses", "visibleVal": "בוטל", "multiple": false } }
```

- `equesition`/`C` values: `equalTo`, `notEqualTo`, `greaterThan`, `lessThan`, `greaterThanOrEqualTo`, `lessThanOrEqualTo`, `containedIn`, `notContainedIn`, `exists`, `notExist`/`doesNotExist`, `startsWith`, `endsWith`, `contains` (table views add `AuthorizedOn`, `underMyHierarchy`, `notUnderMyHierarchy`).
- Pointer-to-`_User` values may be the literal `"currentUser"`.
- Date values may be: `YYYY-MM-DD`, a number of days offset (negative allowed), or the literals `"year ago"`, `"beginning of this year"`, `"30 days period"`, `"beginning of this month"`, `"today"`, `"end of this month"`, `"end of next month"`, `"end of this year"`, `"year ahead"`.

### 0.2 Dynamic placeholders (messages, trigger actions, templates)

`{{{FieldName}}}` and pointer paths `{{{AccountId.Name}}}` are substituted from the triggering record. Date formatting: `{{{SaleDate.format(date,he-IL,Asia/Jerusalem)}}}` — format types `date`, `timehm`, `datetime`; then locale; then timezone. (Source: live Usage-Guide.)

### 0.3 File resource template

Files referenced in tool results as `resource_link` use the URI scheme
`file-storage:///api.mbapps.co.il/parse/files/APP_ID/FILE_NAME/TABLE_NAME/OBJECT_ID/PROPERTY_NAME`
fetched via the MCP resource template **`get-file`** (`resources/templates/list`). Prefer it over the `Get-File-Content` tool. See [06-files-and-storage.md](06-files-and-storage.md).

---

## 1. Meta / guide

| Tool | R/W | Purpose |
|---|---|---|
| `Usage-Guide` | 🟢 | Returns "About Us", system table map (`Accounts` central; `_User`; `_Timeline` audit by `objectIdValue`+`objectClass`), page-architecture rules (rDivider rows / sDivider columns, masterPage `_dynamicContentArea`, `data-simbla-class`), the condition shapes, form-rule action semantics, placeholder syntax, and the `get-file` resource. No params. Call first in every session. |

## 2. Data (CRUD + analytics)

### `Get-Data` 🟢 — query records from any table

| Param | Type | Req | Notes |
|---|---|---|---|
| `table` | String | ✔ | class name, e.g. `Accounts` |
| `where` | Object | – | Parse where syntax: `$gt $lt $gte $lte $ne $in $nin $exists $regex`, Pointer object, Date object |
| `keys` | Array | – | projection |
| `order` | String | – | `-createdAt` for desc |
| `limit` | Number | – | **default 5, max 2000** |
| `skip` | Number | – | pagination |

Gotchas: Pointer filters need the full `{__type:"Pointer",className,objectId}` object; returned Pointer fields come back as full objects; multiple `where` keys AND together.

### `Count-Data` 🟢 — count matching records

Params: `table` (✔), `where` (same syntax). Cheaper than `Get-Data` when only the number matters.

### `Aggregate-Data` 🟢 — group-by + sum/avg/min/max/count

| Param | Type | Req | Notes |
|---|---|---|---|
| `table` | String | ✔ | |
| `group` | Object | ✔ | `{"label":{"sum":"Total"}}` · count = `{"count":{"sum":1}}` · also `avg`/`min`/`max` |
| `groupby` | String | – | **must be a String, not an object** (else `groupby.includes is not a function`); pointer path `OwnerId._User.name` |
| `where` | Object | – | pre-filter |
| `order` | String | – | e.g. `-total` (by computed label) |
| `limit` | Number | – | top-N |
| `timeZone` | String | – | |

### `Create-Data` 🔴 — create one record

Params: `table` (✔), `data` (✔, map of field→value). Date = `{__type:"Date",iso:"YYYY-MM-DD"}`; Pointer = full Pointer object.

### `Create-Many` 🔴 — bulk create (live schema)

| Param | Type | Req | Notes |
|---|---|---|---|
| `table` | String | ✔ | |
| `data` | Array<Object> | ✔ | array of record objects |
| `skipTriggers` | Boolean | – | skip all create-triggers — **honored only with master-key auth** |
| `skipTimeline` | Boolean | – | suppress `_Timeline` audit entries — master-key only; reduces traceability |

This is the bulk-import workhorse (see `myb-p-data-import` skill). Not documented in the 2026-02-07 guide — schema from live server.

### `Update-Data` 🔴 — update one record

Params: `table` (✔), `objectId` (✔), `data` (✔). Supports `{"$inc": n}` increment on numbers, Pointer/Date wrappers.

> No `Delete-Data` tool exists on the live server — deletion is REST/master-key or UI only.

## 3. Schema

### `Get-Schema` 🟢 — table structure

Params: `className` (optional; omit for ALL tables). Returns field name → type (`String|Number|Boolean|Date|Array|Object|Pointer{targetClass}|Relation|File|PrivateFile|HTML/XML|ACL`). **Rule #1 of the platform: call this before any data operation on an unfamiliar table.** System fields `objectId/createdAt/updatedAt/ACL/createdBy/updatedBy` exist everywhere.

### `Create-Table` 🔴 — create a table

Params: `name` (✔, letters/digits/underscore), `fields` (optional array of `{name, type, label, targetClass}`). A `Name` String field is auto-created. `label` writes the Hebrew display name (stored in `_Dictionary`).

### `Add-Field-to-Table` 🔴 — add fields / spawn lookup table

| Param | Type | Req | Notes |
|---|---|---|---|
| `table` | String | ✔ | |
| `fields` | Array | ✔ | `{name, type, label, targetClass}` |
| `newTableName` | String | – | create a new lookup table for a Pointer in the same call |
| `newTableValues` | Array | – | seed rows (Name values) for the new lookup table |

## 4. Pages (HTML/CSS/JS, versions, settings)

### `Get-Site-Pages` 🟢 — list all pages
No params. Returns `_id`, `name` (path like `apps/mybusiness/Task`), `isMasterPage`. Naming: plural = list page, singular = form page; `Mobile-*` = mobile variants.

### `Get-Page-Content` 🟢 — page HTML/CSS/JS
Params: `pageId` or `pageName` (one required), `minimal` (Boolean, default false — use `true` for structure analysis). Content areas keyed `_MPID0…`; rows = `div.rDivider`, columns = `div.sDivider`, form table = `data-simbla-class` attribute.

### `Edit-Page` 🔴 — field-level form editing + page CSS/JS
| Param | Notes |
|---|---|
| `pageId` ✔ | |
| `actions[]` | `actionType` ∈ `change-existing-field-label` · `add-new-field` · `move-existing-field` · `set-field-required` · `remove-existing-field`; each action needs `fieldName` + `fieldType` (always, even for label changes), plus `label`, `targetClass` (Pointer), `toExistingRow`/`toExistingColumn` (0-based), `newRowAfterRow`, `isRequired`, `defaultValue` |
| `cssCode` / `jsCode` | **replace** existing code (not append) |

Gotchas: field must exist in schema first; removing from page ≠ deleting from schema; to place several fields on one new row — add the first with `newRowAfterRow`, re-fetch the page, then target the new row's id.

### `Edit-Page-CSS-JS` 🔴 — replace page CSS and/or JS
Params: `pageId` ✔, `cssCode`, `jsCode`. Overwrite semantics; omit a param to leave that part untouched; take a backup via `Get-Page-Content`/`Get-Page-Versions` first.

### `Get-Page-Settings` 🟢 / `Set-Page-Settings` 🔴 — page metadata & code FILES
`Set-Page-Settings` (live schema): `pageId` ✔, `name` (URL path — must be unique), `title`, `description`, `keywords`, `metaTags`, `loginOnly` (Boolean), `allowedRoles` (comma-separated), `jsFile` / `cssFile` (URLs of uploaded code files — pair with `Upload-Public-File` `codeFile:true`), `removeJSFile` / `removeCSSFile`, `dynamicTable` + `dynamicFields` (serve DB-driven dynamic pages by URL path). This is the "stable code-file deploy" mechanism used by the design system.

### `Get-Page-Versions` 🟢 — list saved versions (`pageId` or `pageName`) → `versions[]{_id,date}`
### `Get-Page-Version` 🟢 — full content of one version (`pageId` ✔, `versionId` ✔)
### `Set-Page-Version` 🔴 — restore a version (`pageId` ✔, `versionId` ✔, `overrideHTML`/`overrideCSS`/`overrideJS` Booleans — nothing happens if none set; irreversible overwrite of current content)

### `Create-Form-Page` 🔴 — new record-card page
Params: `tableName` ✔, `pageName` ✔ (singular convention `apps/mybusiness/Contact`), `title` ✔. Page is created EMPTY — add fields with `Edit-Page`. Standard build order: Create-Table → Create-Form-Page → Edit-Page → Create-Table-View-Page → form rules.

### `Add-Container-to-Page` 🔴 (live schema)
Params: `pageId` ✔; position via `afterElement` OR `toExistingRow`+`toExistingColumn` (0-based) OR `intoExistingElemId` (never an `rDivider`); `isFullWidth`, `isFullHeight` Booleans. Creates layout space for subsequent elements.

### `Duplicate-Element` 🔴 — clone any on-page element (duplicate-then-edit)
Params: `pageId` ✔, `elemId` ✔ (the target element must carry the `simblaEL` class). Clones the element **in place**: the copy is inserted immediately after the original, inside the same parent column/container, and the copy **plus every descendant element gets brand-new unique ids** (the original is untouched). All structure, CSS classes, inline styles and data-attributes/bindings are copied — a cloned field keeps its `name`; a cloned counter keeps `data-simbla-class`/`data-counter-function`/`data-criteria`/`format`; a cloned table keeps its columns.

**Duplicate-then-edit pattern** — usually faster and less error-prone than building from scratch when a similar element already exists: `Duplicate-Element` → `Get-Page-Content` to read the clone's new ids → edit the copy with the matching tool (`Edit-Page`, `Add-Edit-Counter-Element`, `Add-Edit-Text-Element`, `Add-Edit-Chart-Element`, `Edit-Table-View`…) to repurpose it. Works on any element type — form rows/sections, containers, counters, charts, tabs, table views, text. Reload the page after running. Caveat: the clone stacks in the same column/parent as the source, so fix its placement afterward. (Live-verified 2026-06-24.)

## 5. Dashboard elements

### `Add-Edit-Text-Element` 🔴
Params: `pageId` ✔, `elemType` ✔ (`H1|H2|H3|H4|P`), `html` ✔; add-mode: `rowId`+`columnNumber`; edit-mode: `elemId` (same elemType as existing). Find rowIds via `Get-Page-Content` (`div.rDivider`). Don't add to the same slot twice.

### `Add-Edit-Counter-Element` 🔴 — KPI number
| Param | Notes |
|---|---|
| `pageId` ✔, `counterFunction` ✔ | `sum-count` (row count) / `sum` / `avg` / `min` / `max` |
| `tableName` (add) · `elemId` (edit) | |
| `counterField` | required for numeric functions |
| `rowId` + `columnNumber` (add) | |
| `format` | Numeral.js, e.g. `0,0` / `0,0.00` |
| `css` | inline style string |
| `criteria[]` | Shape B conditions (incl. Pointer with `P`) |
| `queryForm` | bind to an on-page search form for dynamic filtering |

Auto-context: a counter inside a form page whose table has a Pointer to the form's table is filtered to the current record automatically.

### `Add-Edit-Chart-Element` 🔴 — Chart.js graphs
Key params: `pageId` ✔, `chartType` ✔ (`Bar|Line|Pie|Doughnut`), `chartTheme` ✔ (`icecream rainyday bluesky grasshopper partytime simbla romantic heatwave blooming sunnysummer underthesea coldmountain oldtown daydream`), `tableName`+`rowId`+`columnNumber` (add) / `elemId` (edit), `chartLabel` (X-axis; pointer path `FieldId.TableName.FieldName`), `chartLabelFormat` (`dow q q/yy mm mm/yy yy dd/mm/yy`), `chartLabelSort`, `chartCategory`(+Format) (series split — Bar/Line only), `chartFunc` (`sum-count|sum|avg|min|max`), `chartValue` (numeric field unless sum-count), `criteria[]`, `queryForm`, `chartDataset`/`chartOptions` (raw Chart.js overrides). Same auto-filter-in-form behavior as counters.

### `Add-Edit-Tabs-Element` 🔴 (live schema)
Params: `pageId` ✔; add: `rowId`+`columnNumber` or `intoExistingElemId`, `newTabs[]{label}` (≥1); edit: `elemId`, `updateTabs[]{id,label}`, `deleteTabs[]` (ids), `newTabs[]`. Suggest a page reload after running.

## 6. Table views (list pages & embedded tables)

### `Create-Table-View-Page` 🔴 — new list page (+ menu entry)
Key params: `tableName` ✔, `pageName` ✔ (plural), `copyFromPageId` ✔ (template page, conventionally `apps/mybusiness/Cases`), `title` ✔, `menuName` (auto-adds to main menu), `createNewEntityTitle`, `editEntityPageName` (the form page's short name), `editEntityTitle`, `mainSearchTitle`, `searchFields[]{field,label,type,equesition,defaultValue,targetClass}`, `tableColumns[]{field,label,type,aggrField}`. Pointer column conventions: display `AccountId.Name`, aggregate `AccountId.Accounts.Name` (class name in the middle).

### `Edit-Table-View` 🔴 — full control of an existing `simbla-table` (live schema; spec-ready)
| Group | Params (→ HTML data-attribute) |
|---|---|
| Identity | `pageId` ✔, `tableId` ✔, `tableClassName` (`data-simbla-class`) |
| `columns[]` | `field` ✔ (dot notation for Pointers), `label`, `type` (`String Number Boolean Date PrivateFile File HTML/XML Pointer Array AutoIncrement`), `aggrField` (`data-aggr-field`), `dateFormat` (`datetime date time year q/yy mm/yy month quarter`), `summary` (`sum avg min max count`), `inlineOptions`, `subclassPointers` |
| `optionalFields[]` | same shape + `text` — user-selectable extra columns (`data-optional-fields`) |
| `filterAndSort` | `criteria[]` (Shape B + `condOr`, ops incl. `underMyHierarchy`), `queryForm`, `queryGridSize` (`12/6/4/3/2`), `queryType` (`hard-code|form`), `sortBy`, `sortOrder`, `sortLimit`, `waitForFirstSubmit` |
| `editView` | `openFrom` ∈ `modal modal-left modal-right newwindow row hidetable inline`, `page`, `useIframe`, `popupWidthPercent`, `popupHeightPercent` |
| `tablePermissions` | `allowCreate` / `allowEdit` / `allowDelete` |
| `summaryOptions` | `showSum`, `sumTitle` |
| `conditionalFormattingRules[]` | `{name, conditions[] (Shape A + `empty`), actions[]{action, field, value}}` — row/cell coloring |
| `advancedOptions` | `allowExportToExcel` (+`exportToExcelRoles`), `enableMultiRowsEdit` (+`enableMultiRowsRoles`), `showUrlAsLink`, `showLoaderAnimation`, `noResultsImageUrl` |
| `classPointers` | map field→class (`data-class-pointers`) |

### `Add-Table-View-to-Form-Page` 🔴 — related-records table on a record card
Params: `pageId` ✔, `tableName` ✔ (MUST have a Pointer to the form's table — that's the auto-filter), `insertAfterRow` ✔ (rDivider id), `fields[]{fieldName,label,type,summary,aggrField}` ✔, `tableTitle`, `allowCreate` (default true), `allowInlineEdit` (default true), `createBtnTitle`, `showSummary` (summary-row title; omit = no summary row).

### `Get-Optional-Fields` 🟢
Params: `className` ✔. Returns the report/table-ready field descriptors (incl. defaults and pointer expansion) to feed `Create-or-Update-Report` / table views.

## 7. Form rules (client-side field behavior)

### `Get-Form-Rules` 🟢
Params: `pageId` ✔, `formId` (default: first form). Returns `rules[]{name, conditions[] (Shape A), actions[]{field, action, value}}`.

### `Edit-Form-Rules` 🔴 — single-rule add/edit/delete (PREFERRED)
Params: `pageId` ✔, `action` ✔ (`add|edit|delete`), `rule` ✔ (`name` is the identity key; for delete, conditions/actions may be empty), `formId`. Rule actions: `hidden`, `required`, `readonly`, `fixed-value` (incl. date literals, `"currentUser"`, `"checked"`/`"unchecked"`), `dynamic-value` (copy from field/pointer path e.g. `AccountId.Email`), `formula-value`, `show-message`, `value-from-url`. OR logic: ≥2 conditions with `condOr: true`. Rules with empty `conditions` always run.

### `Set-Form-Rules` 🔴 — **REPLACES ALL rules on the page**
Params: `pageId` ✔, `rules[]` ✔, `formId`. ⚠️ Destructive replace — always `Get-Form-Rules` and back up first. Use only for from-scratch rule systems; otherwise `Edit-Form-Rules`.

## 8. Triggers (server-side automations)

### `Get-Triggers` 🟢
Params: `tableName` (filter) or `triggerId` (full object incl. `actions[]`) or none (all). Returns `objectId, name, active, events, criterias, actions`. Run before creating to avoid duplicates/loops.

### `Set-Trigger` 🔴 — create the trigger "head" (when to fire)
| Param | Notes |
|---|---|
| `name`, `tableName`, `active` | |
| `type` | `data change` or `scheduled` |
| `events[]` | `create` / `update` (data change) |
| `onSetFields[]` | only changes to these fields evaluate the trigger (perf best practice) |
| `criterias[]` | Shape B, AND logic |
| `oneachupdate` | `true` = fire every matching update; `false` = once per record |
| `schedulerField` | date field (scheduled type) |
| `shcedulerHours` | (sic — misspelled param) hours BEFORE the date; `0` = at the date; negative = AFTER (e.g. `-24` = a day late) |

### `Set-Trigger-Action` 🔴 — attach an action to a trigger (call once per action; ordered list)
Params: `triggerId` ✔, `actionType` ✔, `actionData` ✔ (keyed by actionType), plus `tableName`, `triggerType` echo. Action types observed in guide: `update-object` (`connection: "current.objectId"` or `"target.<PointerField>"`, `targetClass`, `fieldsValue[]{field,type:static|dynamic,value,targetClass,timeGap}`), `create-object` (link back via `{field: <PointerField>, type:"dynamic", value:"currentObject", targetClass}`; `timeGap` in minutes for date math — 1440 = +24h), `http` (webhook: `method,url,headers[],useQueue`), `sms` (`toType:"field"|…, to, from, local:"IL", content` with `{{{placeholders}}}`), plus email / WhatsApp actions (email needs an SMTP account objectId from `Get-SMTP-Accounts`; WhatsApp params mirror `Send-WhatsApp-Message` — see [05-messaging-channels.md](05-messaging-channels.md)). ⚠️ The complete enum of actionTypes is not in the export; `update-object`, `create-object`, `http`, `sms`, email, WhatsApp, and server-side-code actions are evidenced (the last via deployed functions invoked from triggers — see [04-cloud-functions.md](04-cloud-functions.md)).

## 9. Users, packages, roles, permissions

| Tool | R/W | Params | Notes |
|---|---|---|---|
| `Get-Current-User` | 🟢 | none | objectId, username(=email), name, phone, status, appId; use objectId for `_User` Pointers / `currentUser` contexts |
| `Get-all-Users` | 🟢 | none | per user: objectId, username, email, name, active, job, phone, extension, status, profile_image, last_success_login |
| `Create-or-Update-User` | 🔴 | create: `username`(email)+`password`; update: `objectId`+changed fields; also `name, phone, extension, job, active, emailVerified`(def true)`, isPortalUser`(def false) | password policy: ≥8 chars, 1 lower, 1 upper, 1 digit (`(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}`) |
| `Get-Packages` | 🟢 | none | `packages[]{_id, resellerPackageId, numberOfUsers, validUntil, paymentPeriod}` + `users[]{_id, parseId, email, relatedPackages}` |
| `Set-Package-for-User` | 🔴 | `userId` ✔ (Parse objectId), `resellerPackageId` ✔ (NOT `_id`), `action` ✔ `add|remove` | seat assignment; check capacity via Get-Packages first |
| `Get-Roles` | 🟢 | none | `objectId, name, description, color`; report permissions use `role:<Name>` strings |
| `Create-Role` | 🔴 | `name` ✔, `description`, `color` ∈ `green red yellow orange azure purple` | live schema |
| `Get-Role-Users` | 🟢 | `roleId` ✔ | members list |
| `Add-Users-to-Role` | 🔴 | `roleId` ✔, `userIds[]` ✔ | |
| `Remove-Users-from-Role` | 🔴 | `roleId` ✔, `userIds[]` ✔ | live schema (the older guide claimed "no removal tool" — now exists) |
| `Get-Table-Permissions` | 🟢 | `table` ✔ | CLP for the table |
| `Set-Table-Permissions` | 🔴 | `table` ✔, `classLevelPermissions` ✔ with REQUIRED keys `create, delete, update, find, get, addField` | each action object maps grantee→true: `"role:Admin"`, a user objectId, `"*"` (public), or `"requiresAuthentication"`; empty object = nobody. find & get should usually match. |

## 10. Menus

| Tool | R/W | Params | Notes |
|---|---|---|---|
| `Get-Menus` | 🟢 | none | `_id`, `name` (e.g. `CRM-Menu`, `Settings`, `Dashboard Menu`), `originId`, `marketApp`. Duplicate names = versions. |
| `Get-Menu-Items` | 🟢 | `menuId` or `originMenuId` (MongoDB-format ids ONLY — names fail) | items: `_id, title, type(page|link), page/path, icon`(FontAwesome 4.7)`, order, newWin, parent, visibility[]` |
| `Set-Menu-Items` | 🔴 | `menuId` ✔, `items[]` | `type` is REQUIRED even on updates; delete = `{_id, removeThisItem:true}`; hierarchy via `parent`; un-parenting is unreliable — delete & recreate; `visibility` e.g. `['Admin']`, `['loggedIn']` |

## 11. Reports

### `Get-Reports` 🟢 — list all / one (`objectId` optional). Reports are system-wide but bound to a `PageId`.

### `Create-or-Update-Report` 🔴
Modes: flat list (`IsAggr:false` + `ShowFields[]` + `Sort` + `QueryElems[]`) or aggregated/pivot (`IsAggr:true` + `OptionalFields[]` where a field WITHOUT `aggrFunc` is the group-by and one WITH `aggrFunc` (`sum|avg|count`) is the value; `dateFormat` e.g. `MM/YY`; `PivotInfo` for cross-tab). Extras: `CalculatedFields[]{name, fieldA, fieldB, action: Plus|Minus|Divide (%)}`, `ScheduleSendAt` (scheduled email delivery), `permissions[]` (`role:Admin`, `userId:<id>`), `reportId` for update. Feed it from `Get-Optional-Fields`.

## 12. Terminology

| Tool | R/W | Params | Notes |
|---|---|---|---|
| `Get-Terminology-Dictionary` | 🟢 | none | current term-normalization dictionary |
| `Set-Terminology-Dictionary` | 🔴 | `terminology` ✔ (map old→new) | system-wide term resolution |
| `Replace-Terms` | 🔴 | `pageId` ✔, `terms` ✔ (map) | literal find-replace in page HTML (e.g. מכירה→פרוייקט); per page; beware breaking HTML; reload page after |

## 13. Price quotes

| Tool | R/W | Params | Notes |
|---|---|---|---|
| `Get-Price-Quote-Templates` | 🟢 | none | `objectId, Name`; template HTML lives in table `PDFTemplate` (read via Get-Data) |
| `Create-Update-Price-Quote-Template` | 🔴 | `templateName` ✔, `templateContent` ✔ (HTML), `objectId` (update) | HTML contract: root `<div id="windowDiv">` (+ class `rtl`); REQUIRED signature divs `#Signature`, `#SignatureDate`, `#SignatureName`; placeholders `{{Vat}} {{totalIncludingVat}} {{number}} {{date}} {{Sales.*}} {{Sales.AccountId.*}}`; repeating rows `<tr data-repeat="SaleRows">` with `{{SaleRows.ProductId.Name}}` etc.; inputs `<input name="Accounts.Address">` write back to records; print colors need `-webkit-print-color-adjust: exact` |
| `Create-Price-Quote` | 🔴 | `saleId` ✔, `templateId` ✔, `status` ✔ ∈ `טיוטה` · `נשלחה - בהמתנה לאישור` · `בוטלהמושהית` · `אושרה`, `includeVAT` (default true) | renders PDF from the Sale + its SaleRows |

## 14. Files

| Tool | R/W | Params | Notes |
|---|---|---|---|
| `Upload-Public-File` | 🔴 | `file{name ✔, mimeType ✔, data ✔ (base64), _id (update-in-place), codeFile (editable in code editor), keepName (default true), cacheControl (default `max-age=86400`)}` | returns public URL — anyone with the URL can read |
| `Get-File-Content` | 🟢 | `fileUrl` ✔ — must be on `api.mbapps.co.il` or `siteadmin.mbapps.co.il` | returns base64; prefer the `get-file` resource template |

Details and the Parse Files REST layer: [06-files-and-storage.md](06-files-and-storage.md).

## 15. Messaging

### `Get-SMTP-Accounts` 🟢
No params. Returns array of `{objectId, SenderEmail, SenderName, UserId(Pointer→_User)}`. The `objectId` is required for email trigger actions. (Live check on playground returned `[]` — empty array when none configured.)

### `Send-WhatsApp-Message` 🔴 (full live schema — document only; do not call casually: sends real messages)
| Param | Notes |
|---|---|
| `getNumbers` | `true` → returns available sender phone numbers (discovery mode, no send) |
| `getTemplates` | `true` → returns approved templates incl. `components` (discovery mode) |
| `phoneNumber` | recipient (e.g. `972500000000`) |
| `fromPhoneNumberId` | **the `Identity` field from the `Channels` table — NOT the channel's objectId** (critical product rule) |
| `message` | text; WhatsApp markup `*bold* _italic_ ~strike~ \`code\``, emojis OK |
| `conversationId` | attach to an existing conversation |
| `contextId` | objectId of the customer message being replied to (threaded reply) |
| `savedInTable` + `savedInObjectId` | where to log the message when not using `conversationId` |
| `fileBase64` | Data-URI prefixed base64 (`data:application/pdf;base64,…`); supported MIME: jpeg/png/webp (NO gif), pdf, txt, doc(x), xls(x), mp3/aac/ogg/opus, mp4/3gpp |
| `fileName` / `fileDBName` | name for the sent file / send a file already stored in the CRM |
| `template{name ✔, language, components ✔}` + `WATemplateParams` | approved-template send; components passed as-is from `getTemplates` |
| `interactiveButtons[]{title ✔, id}` | max 3 quick-reply buttons |
| `interactiveCTA{title ✔, url, HEADER_TEXT, FOOTER_TEXT}` | single call-to-action button |
| `interactiveLIST{BUTTON_TEXT ✔, SECTIONS ✔ (1–10, each rows 1–10 {id ✔,title ✔,description}), HEADER_TEXT, FOOTER_TEXT}` | list message |
| `wabaId` | WhatsApp Business Account id (multi-WABA setups) |

### `Get-WhatsApp-Template-Params` 🟢
Params: `templateComponents[]` ✔ (copied from `getTemplates` output). Returns an example `WATemplateParams` object keyed by component (`BODY`, `HEADER`…) with positional example values for `{{1}}, {{2}}…` — replace them with CRM placeholders `{{{Name}}}` / `{{{AccountId.Name}}}` for automations/campaigns. Workflow: `Send-WhatsApp-Message{getTemplates:true}` → copy `components` → this tool → fill params → send.

Full messaging architecture: [05-messaging-channels.md](05-messaging-channels.md).

---

## 16. Read-only vs mutating summary

**🟢 Read-only (19)**: Usage-Guide, Get-Data, Count-Data, Aggregate-Data, Get-Schema, Get-Site-Pages, Get-Page-Content, Get-Page-Settings, Get-Page-Versions, Get-Page-Version, Get-Optional-Fields, Get-Form-Rules, Get-Triggers, Get-Current-User, Get-all-Users, Get-Packages, Get-Roles, Get-Role-Users, Get-Table-Permissions, Get-Menus, Get-Menu-Items, Get-Reports, Get-Terminology-Dictionary, Get-Price-Quote-Templates, Get-File-Content, Get-SMTP-Accounts, Get-WhatsApp-Template-Params — *(27 listed; "Get-*" + Count/Aggregate/Usage-Guide)*.

**🔴 Mutating (37)**: Create-Data, Create-Many, Update-Data, Create-Table, Add-Field-to-Table, Edit-Page, Edit-Page-CSS-JS, Set-Page-Settings, Set-Page-Version, Create-Form-Page, Add-Container-to-Page, Duplicate-Element, Add-Edit-Text-Element, Add-Edit-Counter-Element, Add-Edit-Chart-Element, Add-Edit-Tabs-Element, Create-Table-View-Page, Edit-Table-View, Add-Table-View-to-Form-Page, Edit-Form-Rules, Set-Form-Rules, Set-Trigger, Set-Trigger-Action, Create-or-Update-User, Set-Package-for-User, Create-Role, Add-Users-to-Role, Remove-Users-from-Role, Set-Table-Permissions, Set-Menu-Items, Create-or-Update-Report, Set-Terminology-Dictionary, Replace-Terms, Create-Update-Price-Quote-Template, Create-Price-Quote, Upload-Public-File, Send-WhatsApp-Message.

(`Send-WhatsApp-Message` with only `getNumbers`/`getTemplates` is effectively read-only, but classify the tool as mutating for permission gating.)

## Limitations & gotchas

- **Guide vs live drift**: the 2026-02-07 export documents 50 product tools + 9 `internal-mcp` tools (Add-Tool-Docs, Create/Edit-Agent, Get-Agent(s), Get-Agent-Models, Get-Tool(s)) that belong to the AI-CRM-Implementor host app, NOT this MCP server. 14 live tools (Create-Many, Edit-Table-View, Add-Container-to-Page, Duplicate-Element, Add-Edit-Tabs-Element, Create-Role, Remove-Users-from-Role, Get/Set-Table-Permissions, Get/Set-Terminology-Dictionary, Replace-Terms, Get/Set-Page-Settings) are missing from the guide — their schemas above come from the live server and may still evolve.
- **No delete tools**: no record-delete, no table-delete, no page-delete, no trigger-delete/disable tool (disable via `Set-Trigger` with `active:false` re-creation is ⚠️ UNVERIFIED — the guide doesn't document trigger update semantics).
- **`Config` table is restricted** — `Get-Data`/`Create-Many` on `Config` return `Error: Table is restricted`. Web-lead toggles, PBX/Twilio/payment settings are unreachable from MCP (master-key REST only).
- **Replace-not-merge traps**: `Set-Form-Rules` (all rules), `Edit-Page`/`Edit-Page-CSS-JS` css/js (whole blob), `Set-Menu-Items` item `type` required on every update.
- **MongoDB ids vs Parse ids**: menus/pages use Mongo `_id` (24-hex); data records use Parse `objectId` (10-char). Never feed names where ids are expected.
- **`shcedulerHours`** is genuinely misspelled in the trigger API — sending `schedulerHours` silently does nothing.
- **`Aggregate-Data.groupby` must be a String**; an object throws `groupby.includes is not a function`.
- **Get-Data default limit is 5** — easy to mistake a truncated result for the full dataset; always set `limit` explicitly.
- **Trigger chains max 3 levels**; design automations so bulk MCP writes don't fan out (use `Create-Many.skipTriggers` when importing).
- **WhatsApp Identity rule**: `fromPhoneNumberId` = `Channels.Identity`, never `Channels.objectId` — the #1 WhatsApp integration bug.
- **Page edits need a browser refresh** to show; some tools explicitly tell you to ask the user to reload.
- **One connection = one customer app**; there is no cross-app tool. Credential routing happens at MCP connection setup (per-customer `.mcp.json`/proxy), not per call.
