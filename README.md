# documents

The public documentation of the Afixo platform — **https://docs.afixo.io**.

Built with [Astro](https://astro.build) 7 and [Starlight](https://starlight.astro.build),
output as static HTML and served by the Cloudflare Worker `afixo-docs` (static assets,
no code). One environment: a push to `master` deploys production.

## Develop

```sh
pnpm install          # node 24, pnpm 11
pnpm dev              # http://localhost:4321
pnpm build            # astro check && astro build → dist/
pnpm preview          # build, then serve dist/ with wrangler dev (headers + 404 as in production)
```

Content is Markdown/MDX under `src/content/docs/`; the sidebar is defined in
`astro.config.mjs`. The API pages mirror `afixo-services/docs/api.md` — change the
contract there first.

## Deploy

GitHub Actions: `ci.yml` builds and dry-runs a deploy on every push and pull request;
`deploy.yml` runs `wrangler deploy` on push to `master` (and on manual dispatch) with
the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

```
astro.config.mjs      Starlight configuration
wrangler.jsonc        assets-only Worker (dist/, docs.afixo.io)
public/_headers       security headers and CSP
src/content/docs/     the pages
src/styles/custom.css accent colour
```
