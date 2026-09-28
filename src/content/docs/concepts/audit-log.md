---
title: Audit log & hash chain
description: Every decision is recorded before it is answered, in an append-only, hash-chained log.
---

Every disclosure decision — allow or deny, known subject or probe of an unknown
handle — becomes one row in the audit log **before** the requester gets an answer.

## Synchronous, in the request path

```
disclosure.Disclose
  … resolve subject, select rule, fetch persona, run afixo-engine …
  audit.Record(DisclosureDecided)   ← awaited; failure ⇒ UNAVAILABLE ⇒ gateway 503
  respond to the gateway
```

There is no message broker and no best-effort write. `Record` is idempotent on
`event_id`, so a timed-out call is retried once; if the audit service is down the
disclosure **fails closed** with `503`. The consequence is stated rather than hidden:
audit availability bounds disclose availability, and a disclosure nobody can audit is
worse than a refused one.

## What is recorded

Key **names** only — never field values. Each event holds the requester, the purpose,
the outcome and its reason, the persona (id and label) and rule that won, the
disclosed and withheld keys, and when the decision was made and recorded. The
`decision_id` a requester receives is the row's `event_id`, so a subject can find
exactly the call a requester quotes.

Probes of unknown handles are recorded too (subject id zero, reason
`unknown_subject`) while the requester still sees the uniform `403`.

## The chain

Each row commits to the previous one:

```
prev_hash(genesis) = 32 × 0x00
hash = SHA-256( prev_hash ‖ canonical(decision) )
canonical = length-prefixed: event_id, subject_id, requester_id, purpose,
            allowed, reason, persona_id, persona_label, rule_id,
            list(disclosed_keys), list(withheld_keys), decided_at
```

Length-prefixing makes the encoding injective. `recorded_at` is assigned on insert and
is not committed to the hash. Appends lock the chain head inside one transaction, and
the audit deployment never runs two replicas at once. The table carries an
`update or delete` trigger that raises; a superuser can drop it — which is exactly what
the chain makes detectable after the fact.

## Reading and verifying

| Route | |
|---|---|
| `GET /v1/audit?limit=50&before=<seq>` | the subject's decisions, newest first, keyset-paginated by sequence number |
| `GET /v1/audit/verify` | walks the chain from the genesis row, recomputes every hash and reports `{ok, length, broken_at_seq?, head_hash}` |

Verification is O(n) — fine at this scale; a per-subject Merkle index is the obvious
next step if it is not. The dashboard's [Audit](/dashboard/audit/) panel exposes both.

