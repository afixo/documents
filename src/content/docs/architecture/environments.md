---
title: Environments
description: Production and staging for the platform; a single environment for this site.
---

The platform runs two environments on one Kubernetes cluster (DigitalOcean, `fra1`):
the same images, with different namespaces, tunnels, databases, secrets and Worker
hostnames.

| | production | staging |
|---|---|---|
| Workers | `afixo-web`, `afixo-api` | `afixo-web-staging` (`staging.afixo.io`, `api-staging.afixo.io`, behind an Access email policy), `afixo-api-staging` |
| Namespace | `afixo` | `afixo-staging` |
| Tunnel | `afixo-fra1` → `origin.` / `origin-api.` | `afixo-fra1-staging` → `origin-staging.` / `origin-api-staging.` |
| Databases | `afixo_auth`, `afixo_identity`, `afixo_policy`, `afixo_audit` | `afixo_*_staging`, on the same managed cluster |
| Access service token | `afixo-api-production` | `afixo-api-staging` — never shared across environments |
| GitHub OAuth app | callback `https://afixo.io/api/v1/auth/github/callback` | callback `https://staging.afixo.io/api/v1/auth/github/callback` |
| Deployed by | `workflow_dispatch` → production, in every repo | push to `master`, in every repo |

Both namespaces share a single `s-1vcpu-2gb` node for now; requests are sized to fit
(~175m CPU / ~225Mi per environment). Migrations run at service boot, so a deploy that
ships a migration applies it on first start; they are written to stay compatible with
the previous binary, which is still serving during the rollout.

## This site

`docs.afixo.io` has one environment. A push to `master` in the `documents` repository
builds the site and runs `wrangler deploy`; there is no staging hostname for the docs.
The Worker is assets only: a bad deploy is a wrong page, never a wrong decision.

## Local development

The platform uses docker compose for Postgres and `cargo run` for the services;
`afixo-web`'s `astro dev` registers `afixo-api` as an auxiliary Worker so a login can
complete locally. This site is `pnpm dev`, or `pnpm preview` to see the production
headers and the 404 page.
