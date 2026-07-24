# MCP tools with least privilege

The platform's MCP server exposes four deterministic tools: offline web
search over a curated index, a single read-only SELECT against a demo SQLite
database, and sandboxed file read/list under a data directory.

Safety is layered: the SQLite connection is opened read-only, an authorizer
denies everything but SELECT, multi-statement payloads are rejected, and
results are capped per cell and per response. File access resolves symlinks
and refuses any path that escapes the sandbox root. The HTTP transport
requires a bearer key; stdio stays open for local clients.
