---
title: Requesters (API clients)
description: Registered machine clients — how they authenticate and who owns them.
---

A **requester** is a registered machine client: the integrator's server, never a
person. It is the principal that calls the product endpoint, and the thing a subject's
rules name when they say *who* may see a persona.

## Registration

A subject registers a client in the dashboard ([API clients](/dashboard/api-clients/))
or with `POST /v1/requesters {name}`. The response carries the `client_id` and,
**exactly once**, the `client_secret`. The server stores only a SHA-256 hash of the
secret, compares it in constant time and never logs it.

Every requester has an owner: the subject that registered it. Only the owner can
rotate its secret (`POST /v1/requesters/{id}/secret`). Rotation replaces the hash and
leaves the `client_id` and the internal id untouched, so disclosure rules that
reference the requester keep matching.

## The directory

`GET /v1/requesters` lists every registered client — name, `client_id`, creation
time, never a secret; `?mine=true` narrows it to the caller's own. The directory is
visible to every subject on purpose: a rule names a requester by id, and the subject
writing "ShopCo may see my `legal` persona for `shipping`" is usually not the
developer who registered ShopCo.

## Authentication

Requesters use the OAuth 2.0 **client-credentials** grant at
`POST https://api.afixo.io/oauth/token`, presenting the credentials either as HTTP
Basic or as form fields. The result is an opaque bearer token valid for one hour.
There is no refresh token: request a new one. Revocation is a row in the database;
introspection is one indexed lookup by hash; no signing keys exist.

A requester's token works only on the machine listener (`api.afixo.io`). On the
console surface it is `403 wrong_principal`.

See [the machine API](/api/machine/) for the full request and response shapes.
