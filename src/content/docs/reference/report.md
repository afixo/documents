---
title: The report (V1 → V2)
description: Afixo is the second version of a university final project — what carried over and what changed.
---

Afixo is the rewrite of a CM3070 final project (University of London) built on
template 7.1, *Identity and profile management API*, from CM3035 Advanced Web
Development. The first version was one TypeScript Cloudflare Worker with D1 and KV and
a Vue console, written to show that contextual, purpose-scoped disclosure can be
enforced at the boundary of a conventional REST API without the cryptographic and
decentralised machinery the standards landscape assumes.

What carries over unchanged is the product: subjects, personas, sensitivity tiers,
requesters, the closed purpose vocabulary, grant-only rules with wildcard and
specificity semantics, deny by default, and an audit row written before every response.
The rewrite keeps the decision as one pure crate and rebuilds the system around it —
Rust services behind one gateway on Kubernetes, Cloudflare Workers as the only public
surface, one PostgreSQL database per service — and addresses the limitations the
report recorded in its own evaluation.

## V2 changes relative to the report

| Report limitation (§5.4, §5.7) | V2 |
|---|---|
| Requester registration not scoped to an owner; anyone could rotate any secret | Requesters have an owner; rotation requires ownership; the directory exposes no secrets |
| `404` vs `403` on disclose let requesters enumerate handles | Uniform `403` for every deny, including an unknown subject |
| Audit append-only by convention | Append-only by trigger **and** hash-chained; `GET /v1/audit/verify` |
| Audit read is `LIMIT 200`, no paging | Keyset pagination (`before=<seq>`) |
| Audit write in the request path | Still in the request path — `audit.Record` awaited, idempotent on `event_id`; audit down ⇒ disclose fails closed |
| Refresh tokens absent (KV sessions) | Rotating refresh tokens with reuse detection; a sealed cookie at the edge |
| 11 tests, engine only | Engine unit + property tests; services get integration tests against real Postgres |
| Single scalar sensitivity; flat grant-only rules | **Unchanged** — still scalar and grant-only, deliberately: it fails safe. A category lattice and composition remain future work |
| Purpose taken at face value | **Unchanged** — declared purpose, auditable; RFC 9396 binding remains future work |

## What is not reproduced here

The report's literature review, requirements table, evaluation matrix and its
comparison with OIDC, RAR and SD-JWT are not repeated on this site. The concepts pages
restate only the design as it is built; the report itself remains the product
specification (`FINAL_REPORT.md` in the workspace).
