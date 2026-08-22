---
title: Hostnames
description: Every public hostname is a Worker; the tunnel hostnames sit behind Cloudflare Access.
---

| Hostname | Is | Auth at that hop |
|---|---|---|
| `afixo.io`, `www.afixo.io` | Worker `afixo-web`, custom domains | — (the dashboard is gated by the session cookie) |
| `api.afixo.io` | Worker `afixo-web`, custom domain (machine host) | bearer / client credentials, validated by the gateway |
| `docs.afixo.io` | Worker `afixo-docs`, custom domain — this site, static assets only | — |
| `mcp.afixo.io` | Worker `afixo-mcp` — MCP server at `/mcp`; calls the machine API through `afixo-api` with the client's own bearer | bearer (requester token) passed through |
| `origin.afixo.io` | Tunnel → `gateway:8080` (console listener) | Cloudflare Access, Service Auth (afixo-api's token) |
| `origin-api.afixo.io` | Tunnel → `gateway:8081` (machine listener) | Cloudflare Access, Service Auth (afixo-api's token) |
| `staging.afixo.io` | Worker `afixo-web-staging`, custom domain | Cloudflare Access, Allow by email (+ the session cookie) |
| `api-staging.afixo.io` | Worker `afixo-web-staging`, custom domain (machine host) | bearer / client credentials |
| `origin-staging.afixo.io`, `origin-api-staging.afixo.io` | Tunnel (staging) → staging gateway | Cloudflare Access, Service Auth (staging token) |

No hostname is a CNAME to the tunnel except the four `origin*` ones, and those reject
anything without the Worker's service token. `afixo-api` itself has no public hostname
at all: `workers_dev` and preview URLs are off and it has no routes — only `afixo-web`
reaches it, over a service binding.

## Access, and what must not be an Access application

- `origin.afixo.io`, `origin-api.afixo.io` and their staging twins each have one
  self-hosted Access application with a single **Service Auth** policy and no Allow
  policy — there is no human login path to phish.
- `staging.afixo.io` has an **Allow by email** application: a pre-production dashboard
  should not be world-readable.
- `afixo.io`, `api.afixo.io`, `api-staging.afixo.io`, `docs.afixo.io` and `mcp.afixo.io` have **no**
  Access application. An application on `api.afixo.io` would break every API client.
- Never a wildcard `*.afixo.io` application, and the account-wide "Require Access
  protection" setting stays off — either would take the public hostnames offline.

One service token per environment, named for the caller (`afixo-api-production`,
`afixo-api-staging`); rotation is create-new, add to the policy, redeploy, then delete
the old.
