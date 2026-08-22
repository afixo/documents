---
title: Trust boundaries
description: What each hop trusts, what it re-checks, and what is enforced where.
---

| Boundary | Enforced by |
|---|---|
| Internet → cluster | Nothing inbound. `cloudflared` dials out; every tunnel hostname is behind Access (service token only). The public hostnames are Workers. |
| Worker → origin | Access service token (`CF-Access-Client-Id` / `CF-Access-Client-Secret`); one Access application per origin hostname, never a wildcard. |
| gateway → services | Private network + NetworkPolicy (only backend-tier pods reach `:50051`). Services trust the gateway's authenticated `subject_id` / `requester_id` **and** re-check ownership in SQL. |
| services → data | One database per service; no shared schema; no cross-database foreign keys. |

## Principals

Two caller types, never the same principal:

| | Subject | Requester |
|---|---|---|
| Proves identity with | GitHub OAuth | client credentials (secret stored as a SHA-256 hash, compared in constant time) |
| Carries | a sealed cookie; the edge turns it into a 15-minute bearer | its own 1-hour bearer |
| Is introspected by | the gateway, via `auth.IntrospectToken` — one indexed lookup by token hash | the same |
| Served on | console listener only | machine listener only |

A token on the wrong listener is `403 wrong_principal`.

## Invariants the services hold

1. **Deny by default.** No rule → deny. Missing or foreign persona → deny. Unknown
   subject → deny, and the gateway answers a uniform `403` so handles cannot be
   enumerated. Rules only grant; there is no deny rule.
2. **The service that owns the data re-checks ownership.** Every mutating RPC carries
   the acting `subject_id`, and the owning service puts it in the SQL predicate. The
   gateway authenticating the caller is not a substitute.
3. **Tokens and secrets are stored hashed, compared in constant time, never logged.**
   Refresh tokens rotate on every use; reuse revokes the whole session family. Cookie
   values, tokens and persona field values never appear in logs.
4. **No unlogged disclosure.** `disclosure` awaits `audit.Record` before answering; if
   `audit` is down the request fails closed (`503`). `Record` is idempotent on
   `event_id`. The audit write is never asynchronous or best-effort.
5. **Cross-service references are plain UUIDs**, validated by RPC at write time (rule →
   persona via `identity`, rule → requester via `auth`), so an invalid rule is never
   stored. At read time a dangling reference is a deny, never an error.
6. **Nothing in the deployment exposes the cluster**: no LoadBalancer or NodePort
   service, no Ingress, no hostPort.

## Where secrets live

| Secret | Where | Never |
|---|---|---|
| `SESSION_KEY`, Access service token | `afixo-api` Worker secrets | in `afixo-web`, which holds no secrets at all |
| Database URLs, GitHub OAuth app credentials | Kubernetes Secrets per namespace | in files that are tracked |
| Requester secrets, all tokens | Postgres, as SHA-256 hashes | in plaintext anywhere server-side |
