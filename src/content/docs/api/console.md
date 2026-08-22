---
title: Console API
description: The dashboard's own API at afixo.io/api/v1 — documented for completeness, not for third parties.
---

The console API is what the dashboard calls. The browser reaches it as
`https://afixo.io/api/v1/…` with the session cookie; the `afixo-api` Worker strips the
cookie, injects `Authorization: Bearer <subject access token>` and forwards the request
to the gateway's console listener as `/v1/…`. Cookies and CSRF are described in
[the session boundary](/architecture/session-boundary/).

:::note[Not a third-party surface]
A session exists only in a browser, and requester tokens are rejected here with
`403 wrong_principal`. Integrators use the [machine API](/api/machine/).
:::

Every non-`GET`/`HEAD`/`OPTIONS` request must carry an `Origin` header in the allowed
list (`403 forbidden_origin` otherwise) and, once a session exists, an `X-CSRF-Token`
header equal to the readable `__Host-afixo_csrf` cookie (`403 csrf` otherwise).

## Routes

*subject* = a valid session; *owner* = the subject that registered the requester.
Paths are shown as the gateway sees them; the browser prefixes `/api`.

| Method | Path | Auth | Body / query | Response |
|---|---|---|---|---|
| GET | `/v1/health` | — | | `{status, service, version}` |
| GET | `/v1/purposes` | — | | `[{name, description}]` |
| GET | `/v1/auth/github/login` | — | `?redirect_to=/app/…` | `302` to GitHub |
| GET | `/v1/auth/github/callback` | — | `?code&state` | `Session` — sealed into cookies by the edge; the browser sees `302` to `redirect_to` (must be a same-origin `/app/…` path) or `/app` |
| POST | `/v1/auth/refresh` | — | `{refresh_token}` | `Session` — the edge opens the cookie, supplies the refresh token and re-sets the cookies; the browser sees `204` |
| POST | `/v1/auth/logout` | subject | | `204`; the edge clears the cookies |
| GET | `/v1/auth/me` | subject | | `Subject` |
| GET | `/v1/personas` | subject | | `[Persona]` |
| POST | `/v1/personas` | subject | `{label}` | `201 Persona` |
| GET | `/v1/personas/{id}` | subject | | `Persona` |
| DELETE | `/v1/personas/{id}` | subject | | `204` |
| PUT | `/v1/personas/{id}/fields/{key}` | subject | `{value, sensitivity}` | `Persona` |
| DELETE | `/v1/personas/{id}/fields/{key}` | subject | | `Persona` |
| GET | `/v1/requesters` | subject | `?mine=true` for own only | `[Requester]` (never a secret) |
| POST | `/v1/requesters` | subject | `{name}` | `201 Requester` plus `client_secret` (once) |
| POST | `/v1/requesters/{id}/secret` | owner | | `{client_secret}` |
| GET | `/v1/rules` | subject | | `[Rule]` |
| POST | `/v1/rules` | subject | `{requester_id?, purpose?, persona_id, max_sensitivity, allow_keys?, priority?}` | `201 Rule` |
| DELETE | `/v1/rules/{id}` | subject | | `204` |
| GET | `/v1/audit` | subject | `?limit=50&before=<seq>` | `{decisions: [AuditEvent], next_before}` |
| GET | `/v1/audit/verify` | subject | | `{ok, length, broken_at_seq?, head_hash}` |

## Shapes

`Session` — answered by the gateway on callback and refresh; the browser never sees
it, the edge seals the tokens into the session cookie:

```json
{
  "access_token": "…",
  "refresh_token": "…",
  "access_expires_at": "…",
  "refresh_expires_at": "…",
  "subject": { "id": "…", "handle": "alice", "display_name": "Alice" },
  "roles": ["subject"],
  "redirect_to": "/app"
}
```

`Rule.allow_keys` — omitted or `null` means ceiling only; `[]` means release nothing.

`AuditEvent` (hashes are hex):

```json
{
  "seq": 42,
  "event_id": "…",
  "requester_id": "…",
  "purpose": "shipping",
  "allowed": true,
  "reason": "…",
  "persona_id": "…",
  "persona_label": "legal",
  "disclosed_keys": ["full_name", "postal_address"],
  "withheld_keys": ["dob"],
  "decided_at": "…",
  "recorded_at": "…",
  "hash": "…",
  "prev_hash": "…"
}
```

`persona_id` and `persona_label` are absent on a deny.

## Expiry and refresh

Subject access tokens live 15 minutes. When one expires the gateway answers `401` and
the edge passes it through untouched — it never refreshes on the browser's behalf. The
dashboard's client issues one `POST /api/v1/auth/refresh`, queues concurrent requests,
retries once, and on a second `401` sends the user to `/login`. Refresh tokens rotate
on every use; presenting a spent one revokes the whole session family.
