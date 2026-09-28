---
title: The session boundary
description: How a browser session works across the Workers and the gateway — cookies, sealing, CSRF, and why refresh never happens at the edge.
---

The `afixo-api` Worker is the session boundary between the public site and the private
gateway. It has no public route — only `afixo-web` reaches it, over a service binding —
and it runs in two modes chosen by the request's hostname.

| Hostname | Mode | Forwarded to | Who owns `Authorization` at the hop |
|---|---|---|---|
| `afixo.io`, `www.afixo.io` — `/api/v1/*` only | console | `origin.afixo.io/v1/*` → gateway `:8080` | the Worker: sealed cookie → bearer, plus the Access service token |
| `api.afixo.io` | machine | `origin-api.afixo.io` → gateway `:8081` | the requester: its own bearer or Basic credentials pass through untouched, plus the Access service token |

**Machine mode has no session.** It passes the client's `Authorization` through
unchanged, never reads or sets a cookie, runs no Origin or CSRF check, and knows only
five routes (`POST /oauth/token`, `GET /v1/disclose/*`, `GET /v1/purposes`,
`GET /v1/health`, `OPTIONS` on those). Everything else on a machine host is `404`.
The rest of this page is console mode.

## The one rule

**The browser never holds a token.** The gateway keeps ordinary bearer auth — opaque
15-minute access tokens, 7-day refresh tokens rotated on every use — and the Worker
translates between a sealed cookie and that bearer in both directions:

```
login     browser ──GET /api/v1/auth/github/callback?code&state──► afixo-api ──► origin
                                        afixo-api seals {access, refresh, exp} ◄──┘
          browser ◄── 302 /app + Set-Cookie ×3 ──────────────────┘

request   browser ──cookie──► afixo-api   opens the cookie, drops any client Authorization,
                                         injects its own `Bearer <access>` + the Access service token
                              afixo-api ──► origin
```

## The three cookies

| Cookie | Flags | Holds |
|---|---|---|
| `__Host-afixo_session` | `HttpOnly; Secure; SameSite=Strict; Path=/` | sealed JSON `{"a":access,"r":refresh,"e":access_exp_unix}` |
| `__Host-afixo_csrf` | `Secure; SameSite=Strict; Path=/` — readable | 32 random bytes, base64url |
| `__Host-afixo_state` | `Secure; SameSite=Lax; Path=/` — readable | base64url JSON `{"sub","handle","roles":["subject"],"exp":refresh_exp_unix}` |

All three are set together on login, re-set together on refresh, and cleared together
on logout or any failure; their `Max-Age` runs out with the refresh token.

`__Host-` is not decoration: browsers accept such a cookie only when it is `Secure`,
has `Path=/` and carries no `Domain`, so no sibling hostname — `origin.afixo.io`,
`api.afixo.io`, `docs.afixo.io` — can set or overwrite it.

The state cookie is cosmetic. `afixo-web` reads it to decide whether to render `/app/*`
or bounce to `/login`; nothing authorises on it, and it is deliberately unsigned.

## Sealing

The session cookie is AES-256-GCM under a Worker secret (`SESSION_KEY`, 32 random
bytes):

```
wire = base64url( 0x01 ‖ iv(12 random bytes) ‖ ciphertext ‖ tag(16) )
```

The leading byte is a format version. `unseal()` answers `null` for every failure —
bad encoding, wrong version, wrong key, tampered bytes, unexpected shape — and a cookie
that does not open is treated exactly like no cookie: the origin answers `401`, the
browser's refresh fails the same way and clears everything. No oracle.

The session store *is* the cookie; there is no KV and no Durable Object. KV is
eventually consistent, and a stale read during a refresh-token rotation would present
an already-spent token, trip the gateway's reuse detection and destroy a healthy
session.

## No refresh at the edge

When the access token expires the origin answers `401` and the Worker passes it
through untouched, even though it holds the refresh token and could refresh. Worker
invocations cannot coordinate: two concurrent requests would both refresh, the first
rotation would invalidate the second's token, reuse detection would fire and the
session would die. A browser tab *can* single-flight, and `afixo-web`'s client does:
on `401` it issues one `POST /api/v1/auth/refresh`, queues the rest, retries once, and
on a second `401` goes to `/login`.

`POST /api/v1/auth/refresh` is the only place the Worker touches the refresh token:
open the cookie → refresh at the origin → seal the new pair → re-set the cookies →
`204`. A `401` from the origin means the token is spent or revoked: clear all three
cookies and answer `401`.

## CSRF, in layers

Cookies are ambient, so every non-`GET`/`HEAD`/`OPTIONS` request is checked before
routing:

1. `Origin` must be in the allowed list; a missing `Origin` is `403 forbidden_origin`.
   This covers the pre-session endpoints and is what blocks login-CSRF.
2. With a session cookie present, `X-CSRF-Token` must equal `__Host-afixo_csrf`,
   compared in constant time; otherwise `403 csrf`. The dashboard's client reads the
   cookie and adds the header on every non-GET.

`SameSite=Strict` on the session and csrf cookies is the third layer. Refresh and logout are POSTs and go through the
same checks as everything else. The state cookie alone is `Lax`: a login ends with GitHub redirecting cross-site to the
callback, and the `302 /app` that follows is part of that navigation; Safari withholds Strict cookies for the whole
redirect chain, so a Strict state cookie bounced a freshly signed-in user back to `/login`. The state cookie is unsigned
and cosmetic — nothing authorises on it — so Lax costs nothing.

## What the Worker never does

- Never logs a token, a cookie value or a secret.
- Never trusts the state cookie for anything.
- Never follows a redirect from the origin — it relays them.
- Never attaches Access headers unless both halves of the service token are set.
- Never has a public URL.
- Never passes a client `Authorization` to the console listener, and never rewrites
  the requester's on the machine hop.
- Never sends a machine-host request to the console listener, and never forwards
  `/api/*` from a machine host.

The canonical description, with every header rule, is `afixo-api/docs/session.md`.
