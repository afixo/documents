---
title: What is deliberately not done
description: Choices that were considered and rejected, and follow-ups that are still open — stated rather than hidden.
---

A system is defined as much by what it leaves out. These lists are kept current so that
nobody has to infer the gaps.

## Rejected on purpose

| Not done | Why |
|---|---|
| A message broker for audit events (NATS JetStream was drafted) | Same guarantee as the synchronous `audit.Record` call, more machinery, one more pod on a one-core node. If a second consumer of decisions ever appears, an event stream goes *downstream of* the audit table, not in front of it. |
| Redis, or any cache | Tokens live in Postgres with expiry columns; rate limiting is a Cloudflare rule; the hot path is a few indexed reads. |
| Signed tokens (JWT) | The only claim anyone needs is "which principal". Opaque tokens make revocation a row and need no signing keys. |
| Refresh at the edge | Worker invocations cannot coordinate; two concurrent refreshes would trip reuse detection. The browser single-flights instead. |
| KV or a Durable Object for sessions | KV is eventually consistent and would replay a rotated refresh token; a Durable Object would be correct and cost money for nothing. The sealed cookie is the store. |
| Deny rules | Grant-only rules fail safe; mixed polarities need conflict-resolution semantics that non-experts cannot predict. |
| A category lattice, or composition of personas | Sensitivity stays a single scalar and a disclosure is exactly one persona. Future work, recorded as such. |
| Binding the purpose to the token (RFC 9396) | Purpose is declared and audited. Future work. |
| One service per table | Six services follow ownership and workload; `persona-service` / `rule-service` would be distributed CRUD. |
| Public hostnames on the tunnel | `api.afixo.io` is a Worker custom domain so that no public name ever resolves to the tunnel and the Access service token is the only credential that can open it. |
| An Access application on `api.afixo.io` | It would break every API client; the gateway validates requester bearers itself. |
| Replicas | Both environments share one `s-1vcpu-2gb` node; a second replica on the same node buys nothing. Add a node first. |

## Open follow-ups

- No integration tests for `gateway` (REST ↔ gRPC mapping) or `policy`; the engine,
  `common`, `auth`, `identity`, `disclosure` and `audit` are the tested crates.
- No load or latency measurements of the disclosure path (Criterion, or a run against
  `api.afixo.io`).
- No backend staging environment: the edge Workers carry a staging configuration, but
  the cluster runs one production namespace and a push to `master` deploys it.
- No mTLS or service mesh between pods; the gateway → services hop relies on the
  private network and a NetworkPolicy.
- The Access JWT (`Cf-Access-Jwt-Assertion`) is not yet validated at the gateway as
  defence in depth behind Access.
- Backups: managed Postgres takes daily backups, but the audit database *is* the
  record — a restore has not been rehearsed.
- Observability beyond logs: no OpenTelemetry traces, no Prometheus metrics.
- Staging cookies: `SameSite=Strict` may read as logged-out immediately after the
  Access email-login bounce; `Lax` on the session cookie is the usual remedy, to be
  tested rather than assumed.

## Shipped since this page was first written

- **2026-08-22** — `auth`, `identity`, `disclosure` and the `audit` RPCs left skeleton
  status: GitHub sign-in with rotating refresh tokens, requesters and client-credential
  tokens, personas and fields, real disclosure decisions with the synchronous
  `audit.Record`, and `GET /v1/audit/verify`.
- **2026-08-23** — the Kubernetes cluster, in-cluster PostgreSQL, the tunnel and Access
  applications, the GitHub OAuth app and the Workers are in production at `afixo.io`,
  `api.afixo.io`, `docs.afixo.io` and `mcp.afixo.io`.
