---
title: API clients
description: Register requesters and manage their secrets.
---

*Dashboard → API clients.* Requesters are OAuth 2.0 clients. The server keeps only a
hash of each secret, so the plaintext is shown once — and cached in this browser
(`localStorage` key `afixo.clients`) so the [Explorer](/dashboard/explorer/) can act as
the client.

## Register a client

1. Under **Register a client**, enter a name (for example `ShopCo Checkout`) and
   choose **Register**.
2. A panel shows the `client_id` and the `client_secret`, each with a **Copy** button.
   Store the secret in your own secret manager now; it cannot be retrieved later.

## Registered clients

| Column | Meaning |
|---|---|
| Name, `client_id`, Created | the registration |
| Secret | *secret in this browser* — saved on this device and usable by the Explorer — or *no local secret — rotate to get one* |

Per row:

- **Rotate secret** — after a confirmation, issues a new secret and invalidates the
  current one immediately. The `client_id` and the internal id do not change, so
  rules naming this client keep matching. Only the client's owner can rotate it.
- **Forget local secret** — removes the cached plaintext from this browser only.

## For integrators

A client registered here is used exactly as in [Getting started](/getting-started/):
`POST /oauth/token`, then `GET /v1/disclose/…`. Nothing is disclosed to it until a
subject writes a [rule](/dashboard/policies/) that names it, or a purpose it declares.

