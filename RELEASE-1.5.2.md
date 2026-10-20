# 1.5.2 — skill descriptions accepted by Claude.ai sync

Both plugin variants. The Claude.ai plugin sync rejects a skill whose `description` contains `<` or `>` (read as XML tags), so automatic sync of `mybusiness-implementor` and `mybusiness-oauth` failed on two skills:

- `myb-p-create-settings-page`: `<Entity>Statuses / <Entity>Types / <Entity>Priorities` is now written `{Entity}Statuses / {Entity}Types / {Entity}Priorities`.
- `myb-p-multi-select-field`: `array_<purpose>_Pointer_<TargetTable>` is now `array_{purpose}_Pointer_{TargetTable}`, and `<select multiple>` is now `select multiple`.

Only the two description lines changed. Skill bodies, the knowledge base, authentication configuration, setup guides and permission notes are unchanged. Refresh the plugin marketplace and update the installed variant to receive this version; Claude.ai sync picks it up on its next run.
