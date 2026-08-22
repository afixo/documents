---
title: Glossary
description: The vocabulary of Afixo, in one place.
---

| Term | Meaning |
|---|---|
| **Subject** | A human identity owner. Signs in with GitHub; identified publicly by a handle. Owns personas, rules and an audit log. |
| **Handle** | A subject's public identifier, `[a-z0-9-]{2,39}`; what a requester names in `/v1/disclose/{handle}`. |
| **Persona** | A named partial identity (`legal`, `work`, `social`): a bundle of fields. Label unique per subject. |
| **Field** | A `key → value` pair in a persona, with a sensitivity tier. Key unique per persona. |
| **Sensitivity** | A field's tier: `0` public, `1` low, `2` medium, `3` high. Compared against a rule's ceiling. |
| **Ceiling** | A rule's `max_sensitivity`; fields above it are withheld. |
| **Allow-list** | A rule's optional `allow_keys`; when present, only listed keys may be released. `[]` releases nothing. |
| **Requester** | A registered machine client (`client_id` + hashed secret), owned by the subject that registered it. Also called an *API client*. |
| **Purpose** | One of seven names in a closed vocabulary, declared by the requester on every disclosure request. |
| **Rule** | A grant `(subject, requester?, purpose?) → persona, ceiling, allow-list?, priority`. `null` is a wildcard. Rules never deny. |
| **Specificity** | `2·[requester named] + 1·[purpose named]`; the highest-scoring matching rule wins. |
| **Priority** | Integer tie-breaker between rules of equal specificity; after that, the newest wins. |
| **Decision** | The outcome of one disclosure request: allow (persona + released fields + withheld keys) or deny (reason). Always audited. |
| **Withheld** | The keys of a persona's fields that the winning rule did not release; reported as names only. |
| **Deny by default** | No matching rule, a missing or foreign persona, or an unknown handle all produce the same `403`. |
| **Engine** | `afixo-engine`, the pure, property-tested crate that ranks candidates and filters fields. |
| **Audit log** | The append-only, hash-chained record of every decision, written before the response is sent. |
| **Hash chain** | Each audit row's `hash = SHA-256(prev_hash ‖ canonical(decision))`; `GET /v1/audit/verify` recomputes it. |
| **`decision_id`** | Returned on every disclosure response; equals the audit row's `event_id`. |
| **Console listener** | The gateway's subject-facing socket (`:8080`), reached as `afixo.io/api/v1/*` through the Workers. |
| **Machine listener** | The gateway's requester-facing socket (`:8081`), reached as `api.afixo.io`. |
| **Gateway** | The REST ↔ gRPC edge of the cluster; owns HTTP, owns no data. |
| **Introspection** | `auth.IntrospectToken`: how the gateway learns which principal a bearer belongs to. |
| **Service token** | The Cloudflare Access credential `afixo-api` presents to the `origin*` hostnames. |
| **Sealed cookie** | `__Host-afixo_session`: the subject's access and refresh tokens, AES-256-GCM encrypted at the edge. The browser never holds a token. |
