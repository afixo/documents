---
title: Subjects & handles
description: Who owns an identity in Afixo, and how a requester refers to one.
---

A **subject** is a human identity owner. Subjects sign in with GitHub, author
everything that can be disclosed about them, and are the only principals that can
write policy.

## Handles

Every subject has a public **handle** matching `[a-z0-9-]{2,39}`. It is the only
identifier a requester ever uses:

```
GET /v1/disclose/{handle}?purpose=…
```

Handles are public by design — they are how a client refers to a person — but they
are not enumerable through the API. A request for an unknown handle receives exactly
the same `403 deny` as a request with no matching rule, and the probe is still
written to the audit log (subject id zero, reason `unknown_subject`).

## Subjects are never requesters

The person who *owns* the policy and the client that is *subject to* it are different
principals, authenticated differently and served on different listeners:

| | Subject | Requester |
|---|---|---|
| Authenticates with | GitHub OAuth | OAuth 2.0 client credentials |
| Holds | nothing — a sealed cookie at the edge | a bearer token |
| Access token | opaque, 15 minutes | opaque, 1 hour |
| Refresh | rotating refresh token, 7 days; reuse revokes the whole family | re-authenticate |
| Surface | console listener, seen as `afixo.io/api/v1/*` | machine listener, `api.afixo.io` |

A subject token presented to the machine listener is `403 wrong_principal`; a
requester token on the console listener likewise.

## What a subject owns

- [Personas and their fields](/concepts/personas-and-fields/)
- The [API clients](/concepts/requesters/) it registered — although any subject can
  write a rule naming any registered client
- Its [disclosure rules](/concepts/disclosure-rules/)
- The [audit log](/concepts/audit-log/) of every decision made about its identity

Ownership is enforced by the service that owns the data, not only by the gateway:
every mutating call carries the acting subject's id and the owning service puts it in
the SQL predicate.
