---
title: Changelog
description: Notable changes to the platform and to these docs.
---

Entries are added whenever a service ships and whenever the API contract changes.

## 0.1 — 2026-08-23

- **2026-08-23** — Production: the cluster (DigitalOcean Kubernetes, `fra1`), in-cluster
  PostgreSQL (one database per service), the Cloudflare tunnel and Access applications,
  the GitHub OAuth app, and the Workers `afixo-web`, `afixo-api`, `afixo-docs` and
  `afixo-mcp`. `afixo.io` serves the dashboard, `api.afixo.io` the machine API,
  `mcp.afixo.io/mcp` the MCP server for agents.
- **2026-08-23** — Dashboard rebuilt on a semantic design-token system with light and
  dark themes; every token pair audited for WCAG 2.2 AA contrast.
- **2026-08-22** — `auth`, `identity`, `disclosure` and `audit` implemented: GitHub
  sign-in with rotating refresh tokens and reuse detection, requesters with
  client-credential tokens, personas and fields, real disclosure decisions, synchronous
  hash-chained audit with `GET /v1/audit/verify`.
- **2026-08-22** — Documentation site created at `docs.afixo.io`; contract, migrations,
  decision engine, policy service and gateway complete.
