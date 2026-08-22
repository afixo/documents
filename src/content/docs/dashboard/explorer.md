---
title: Explorer
description: Act as one of your API clients and compare every purpose's answer side by side.
---

*Dashboard → Explorer.* The Explorer is the requester's view: your browser obtains a
token from the machine API and calls the disclosure endpoint once per purpose, exactly
as an integrator's server would. Every call is a real decision, audited like any other.

## Run a disclosure

1. **Act as client** — pick a client whose secret is saved in this browser. If the list
   is empty, register a client or rotate one on [API clients](/dashboard/api-clients/)
   first.
2. **Subject handle** — defaults to your own handle; any handle can be entered.
3. Choose **Disclose for every purpose**.

The panel shows which machine API it talks to (`https://api.afixo.io` in production),
then runs `POST /oauth/token` with the client's credentials (the token is cached until
shortly before it expires), fetches `GET /v1/purposes`, and calls
`GET /v1/disclose/{handle}?purpose=…` for every purpose in parallel.

## Reading the results

One card per purpose:

- **allow** — the persona label, the released fields and the withheld keys
- **deny** — the reason, always `no_matching_rule` on the wire
- **network error** or **HTTP n** — anything else, with the message

Each card has a **raw** disclosure with the status, the round-trip time and the JSON
body. The status line counts allowed versus denied or failed.

## Why it is cross-origin

The Explorer is the only part of the dashboard that calls anything other than
same-origin `/api/v1`. It talks to `api.afixo.io` across origins; the gateway's machine
listener answers CORS for `https://afixo.io` for exactly this purpose. Your browser is
the requester here — the session cookie plays no part.

:::caution[Status: skeleton (2026-08-22)]
`POST /oauth/token` and `GET /v1/disclose/…` reach the `auth` and `disclosure`
services, which are skeletons; every card currently shows `HTTP 501`.
:::
