# documents — docs.afixo.io

The public documentation site of the Afixo platform: Astro 7 + Starlight, built to
static HTML and served by the Cloudflare Worker **`afixo-docs`** (assets only, no
code) at **https://docs.afixo.io**. One environment: a push to `master` deploys
production. Product spec and system docs live in the sibling repos (see Sources).

## Hard rules

- **Static only.** No adapter, no `main` in `wrangler.jsonc`, no server code, no
  bindings, no on-demand pages. A page that needs a server does not belong here.
- **No secrets, no environments.** The Worker has no vars, secrets or `env.*`
  blocks. CI needs only the GitHub secrets `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID`.
- **Content lives in `src/content/docs/`** (Markdown/MDX). The sidebar is explicit
  in `astro.config.mjs`: adding a page means adding it there too.
- **Keep the API pages in sync with the contract.** `src/content/docs/api/*` mirrors
  `afixo-services/docs/api.md`; `architecture/session-boundary.md` mirrors
  `afixo-api/docs/session.md`. A contract change lands in those docs first, then here.
- **Do not invent behaviour.** Anything not yet implemented carries a
  "Status: skeleton" aside (as of 2026-08-22: `auth`, `identity`, `disclosure`,
  `audit` are skeletons; `policy`, `gateway`, `engine` are done — see
  `afixo-services/CLAUDE.md` → Status). Update those asides when services land.
- **Trailing slashes.** Astro `trailingSlash: 'always'` + default directory output
  + wrangler `html_handling: "auto-trailing-slash"`. Change all three or none.
- **Security headers and CSP** are in `public/_headers` and apply to every asset.
  Starlight needs `'unsafe-inline'` for its inline theme script and `'wasm-unsafe-eval'`
  for Pagefind search; re-test with `pnpm preview` before tightening or loosening.
- **Never `git push`. Always ask before `git commit`.** Branch `master`.

## Commands

| Command | What |
|---|---|
| `pnpm dev` | Starlight dev server on :4321 |
| `pnpm build` | `astro check && astro build` → `dist/` (zero errors required) |
| `pnpm preview` | build, then `wrangler dev` serving `dist/` with `_headers` and the 404 page |
| `pnpm check` | `astro check` only |
| `pnpm run deploy` | build + `wrangler deploy` — CI does this; `run` is required because `pnpm deploy` is pnpm's own command |
| `pnpm types` | `wrangler types` — there are no bindings, so it is not needed; kept for parity with the other repos |
| `pnpm wrangler deploy --dry-run --outdir dist-dry` | what CI runs; needs no credentials |

Needs node 24 and pnpm 11 (`packageManager` in `package.json`); `pnpm-workspace.yaml`
approves the install scripts of `esbuild`, `sharp` and `workerd`.

## Layout

```
astro.config.mjs        site URL, trailingSlash, Starlight title / sidebar / social / customCss
wrangler.jsonc          assets-only Worker: dist/, auto-trailing-slash, 404-page, docs.afixo.io
public/_headers         security headers + CSP + immutable cache for /_astro/*
public/favicon.svg
src/content.config.ts   Starlight docs collection (docsLoader + docsSchema)
src/content/docs/       index.mdx (splash) · getting-started.mdx · concepts/ · api/ · dashboard/ ·
                        architecture/ · reference/
src/styles/custom.css   accent colour only (light + dark)
.github/workflows/      ci.yml (install, build, deploy dry-run) · deploy.yml (master → production)
```

## Deploy

`deploy.yml` runs on push to `master` and on `workflow_dispatch`, in the GitHub
environment `production`, one run at a time: `pnpm build`, then `wrangler deploy`.
The custom domain `docs.afixo.io` is attached from `routes`; delete any existing
DNS record for that name before the first deploy. Never deploy from a laptop
without asking.

## Sources (read before writing content)

- `../FINAL_REPORT.md` — product spec (chapters 1, 3, 4)
- `../afixo-services/docs/{architecture,domain,api,audit,deploy}.md`
- `../afixo-api/docs/{session,access}.md`
- `../afixo-web/CLAUDE.md` and `src/pages/app/*.astro` — dashboard behaviour
- `../CLAUDE.md` — workspace overview, hostnames

## Git

`origin` = `git@github.com:afixo/documents.git`, branch `master`. Never push; ask
before committing; leave changes in the working tree and report them.
