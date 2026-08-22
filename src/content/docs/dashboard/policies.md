---
title: Policies
description: Write disclosure rules and preview their effect before saving.
---

*Dashboard → Policies.* Rules only ever grant. A request is denied unless a rule
matches its (requester, purpose); the most specific rule wins, then priority, then the
newest. Adding a rule can never restrict another.

## Write a rule

| Field | Value |
|---|---|
| Requester | a registered client, or *any requester* |
| Purpose | one of the [seven purposes](/concepts/purposes/), or *any purpose* |
| Persona to disclose | one of your personas — required |
| Max sensitivity (ceiling) | `0 · public` … `3 · high`; default `1 · low` |
| Allow keys | optional, comma-separated field keys; empty means ceiling only |
| Priority (tie-breaker) | an integer, default `0`; higher wins at equal specificity |

Choosing *any requester* **and** *any purpose* shows a warning: such a rule is a
catch-all that applies to every caller and every purpose no more specific rule covers.

## Live preview

As you edit, **Live preview** lists, for the chosen persona, which fields the rule
would **disclose** and which it would **withhold**, each with its sensitivity badge.
The preview applies the same two filters as the engine — ceiling and allow-list — so
what you see is what a matching request gets.

## Rules in force

The table lists every rule in the order the engine considers them (specificity, then
priority, then newest): requester, purpose, persona, ceiling, allow keys, priority,
specificity, and **Would disclose** — the keys the rule releases against the persona
as it is today. A rule whose persona has been deleted is marked *missing persona*: it
still matches, and denies.

**Delete** removes a rule after a confirmation. Requests it currently allows are denied
unless another rule covers them.

The engine's ranking and filtering are described in
[The decision algorithm](/concepts/decision-algorithm/). The `policy` service behind
this panel is complete; creating a rule also validates the persona and requester ids
against `identity` and `auth`, which are still skeletons.
