---
title: Architecture overview
description: Six Rust services behind one gateway, reached only through Cloudflare Workers.
---

Afixo is the selective-disclosure identity API of the original report — one TypeScript
Worker with D1, KV and a Vue console — rebuilt as a distributed system. The thesis is
unchanged: given *(subject, requester, purpose)* select a rule, resolve the persona,
apply ceiling + allow-list, deny by default, audit the decision. It is now one pure
crate (`afixo-engine`) surrounded by services that own data, a gateway that owns HTTP,
and an edge that owns the session.

## The one rule of the topology

**Nothing an end user or an API client talks to resolves to the cluster.** Every
public hostname is a Cloudflare Worker. The Workers reach the cluster through a
Cloudflare Tunnel whose hostnames sit behind Cloudflare Access (service token) and are
called by exactly one Worker. The cluster has no public IP, no ingress controller, no
load balancer and no inbound firewall rule.

```
                    ┌──────────────────────── Cloudflare ────────────────────────┐
 browser ── afixo.io ─────► afixo-web (Astro Worker)                            │
 client ─── api.afixo.io ─► afixo-web: src/fetch.ts branches on hostname        │
                    │            └─ service binding ─► afixo-api (no public route)│
                    │                    console mode: cookie → bearer, CSRF     │
                    │                    machine mode: bearer passed through     │
                    │                                 │                          │
                    │          origin.afixo.io ◄───────┤   Access: Service Auth   │
                    │          origin-api.afixo.io ◄───┘   Access: Service Auth   │
                    └───────────────────┬────────────────┬────────────────────────┘
                                        │ tunnel         │
            ┌── DOKS fra1, namespace afixo ──────────────┼────────────────────────────┐
            │  cloudflared ─► gateway :8080 (console) / :8081 (machine)               │
            │                    │ gRPC                                               │
            │     auth ◄─────────┼────────► identity      policy ◄── disclosure ──► audit
            │      │             │              ▲            ▲         │               │
            │      └── identity ─┘              └────────────┴─────────┘               │
            └──────────────────────────────────────────────────────────────────────────┘
                 DigitalOcean managed PostgreSQL: afixo_auth · afixo_identity · afixo_policy · afixo_audit
```

## Components

| Component | Repo | Role |
|---|---|---|
| `afixo-web` | afixo-web | Public Worker: custom domains `afixo.io`, `www.afixo.io`, `api.afixo.io`. Static site + dashboard. Forwards any request on a machine host, and `/api/*` on the site host, to `afixo-api` over a service binding with the original URL. Holds no secrets. |
| `afixo-api` | afixo-api | Session boundary, no public route. **Console mode** (site host): sealed cookie ⇄ bearer, Origin + CSRF checks, Access headers, → `origin.afixo.io`. **Machine mode** (`api.afixo.io`): only `/oauth/token`, `/v1/disclose/*`, `/v1/purposes`, `/v1/health`; the client's own `Authorization` passed through, cookies stripped, Access headers added, → `origin-api.afixo.io`. |
| `afixo-docs` | documents | This site: static assets only, `docs.afixo.io`. |
| `gateway` | afixo-services | REST ↔ gRPC. Two listeners, so the subject surface and the machine surface are different sockets, routed by cloudflared per origin hostname. |
| `auth` | afixo-services | Subjects: GitHub OAuth → opaque access token (15 min) + rotating refresh (7 d). Requesters: registry + client credentials → opaque tokens (1 h). `IntrospectToken` is how the gateway learns who is calling. |
| `identity` | afixo-services | Subjects, personas, fields with sensitivity tiers. |
| `policy` | afixo-services | Purpose vocabulary and rules. Stores and selects candidates; never ranks. |
| `disclosure` | afixo-services | The product hot path: subject → candidates → winner → persona → engine → `audit.Record` → answer. Owns no data. |
| `audit` | afixo-services | Append-only, hash-chained log of every decision; `Record` (idempotent), paginated reads, chain verification. |

## Request paths

**Dashboard (subject).** `browser → afixo-web → [binding] → afixo-api (console mode)
→ https://origin.afixo.io/v1/… → tunnel → gateway:8080 → gRPC`. The Worker translates
cookie → bearer; the gateway introspects the bearer with `auth`; the owning service
re-checks `subject_id` in SQL.

**Product (requester).** `client → https://api.afixo.io → afixo-web → [binding] →
afixo-api (machine mode) → https://origin-api.afixo.io → tunnel → gateway:8081`.
`POST /oauth/token`, then `GET /v1/disclose/{handle}?purpose=`. The gateway
introspects the bearer, `disclosure` orchestrates, `audit.Record` is awaited before
the answer.

The dashboard's Explorer acts as a requester from the browser: it calls
`https://api.afixo.io` cross-origin, so the gateway's machine listener answers CORS
for `https://afixo.io`, relayed unchanged by the Workers.

## Why these choices

- **Six services, not fifteen.** Boundaries follow ownership and workload: credentials,
  profile data, policy, a read-heavy orchestrator, an append-only log.
- **The engine is a crate, not a service.** Ranking and filtering are pure and
  property-tested, and stay in one function — the report's argument for ranking in
  code rather than SQL.
- **Synchronous audit, no broker.** "No unlogged disclosure" is kept by awaiting
  `audit.Record`; audit down ⇒ disclose fails closed. A JetStream design was dropped as
  more machinery for the same guarantee.
- **No Redis.** Tokens live in Postgres with expiry columns; rate limiting is a
  Cloudflare rule; there is no cache.
- **Opaque tokens.** The only claim anyone needs is "which principal"; revocation is a
  row; no signing keys.
- **Two gateway listeners, two origin hostnames.** cloudflared routes by hostname;
  nothing parses `Host`.
- **Machine traffic through the Workers too.** `api.afixo.io` is a Worker custom
  domain, not a tunnel hostname, so that no public name ever resolves to the tunnel.
- **Sealed cookie at the edge, no refresh at the edge.** Worker invocations cannot
  coordinate; the browser single-flights a refresh.
