# 1.5.1 — web2table file fields: the upload must really happen

Both plugin variants. One correction in `myb-p-public-forms` (`web2/`) and the knowledge base (`40-integrations-api/03` §5, `06` §2.3), measured on a live system on 2026-10-10:

- A `web2table` file field takes a File object only for a file that was **uploaded first** (`POST /parse/files/<name>`). A File object that names a file which was never uploaded does not fail fast: the call answers `400 {"code":1}` after about 5 seconds, and by then the target rows are already written — five duplicate rows plus the contact. The generated code uploads first and sends exactly what the upload returned.

Authentication configuration, setup guides and permission notes are unchanged. Refresh the plugin marketplace and update the installed variant to receive this version.
