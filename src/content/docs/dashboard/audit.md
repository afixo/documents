---
title: Audit
description: Every decision made about your identity, and a button to verify the chain.
---

*Dashboard → Audit.* Every request made against your identity — allowed or denied —
with the requester, the purpose, the persona returned and the exact keys released.
Field values never appear because they are never recorded.

## Decisions

| Column | |
|---|---|
| When | when the decision was made |
| Decision | `allow` or `deny` |
| Requester | the client that asked |
| Purpose | the declared purpose |
| Persona | the persona disclosed, if any |
| Disclosed keys | the field keys released |
| Withheld / reason | the withheld keys on an allow; the reason on a deny |

The page loads 25 decisions at a time, newest first; **Load more** continues from the
last sequence number (`GET /v1/audit?limit=25&before=<seq>`). The dashboard's overview
page shows the five most recent.

## Verify chain

**Verify chain** asks the server to walk the whole log from the genesis row, recompute
every hash and compare (`GET /v1/audit/verify`). The answer is *Chain intact (n
entries)* or *Chain broken at* the first sequence number whose hash does not match.
What the chain commits to is described in [Audit log & hash chain](/concepts/audit-log/).

:::caution[Status: skeleton (2026-08-22)]
This panel calls the `audit` service, whose read and verify RPCs are skeletons;
requests currently answer `501 not_implemented`.
:::
