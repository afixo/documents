---
title: Personas, fields & sensitivity
description: Partial identities as bundles of fields, each carrying a sensitivity tier.
---

People do not have one presentation of self; they have several and choose between
them by context. Afixo models that directly: a subject owns several **personas**, and a
disclosure returns at most one of them.

## Personas

A persona is a named partial identity — `legal`, `work`, `social` — a bundle of fields
authored explicitly by the subject. Labels are unique per subject. Personas are never
inferred, merged or composed: what a requester sees is exactly one persona, filtered.

## Fields

A field is a `key → value` pair inside a persona; keys are unique per persona. Each
field carries a **sensitivity** tier:

| Tier | Name | For example |
|---|---|---|
| `0` | public | a chosen display name, pronouns, an avatar |
| `1` | low | a job title, a work email |
| `2` | medium | a postal address |
| `3` | high | a date of birth |

Sensitivity is what lets one rule say "this context may see ordinary attributes but
not the high-sensitivity ones": a rule names a **ceiling** (`max_sensitivity`) and any
field above it is withheld. Because the tier belongs to the field, adding a new
high-sensitivity field to a persona does not leak it through existing rules — it is
withheld automatically.

## Editing

In the dashboard, [Personas](/dashboard/personas/) creates personas and upserts fields
(`PUT /v1/personas/{id}/fields/{key}` with `{value, sensitivity}`). The dashboard
accepts keys matching `[A-Za-z0-9_.-]+` and defaults new fields to tier `1`;
`sensitivity` outside `0..3` is rejected.

Deleting a persona does not delete the rules that point at it. Those rules now resolve
to a missing persona, and a missing persona is a **deny** — never an error, never a
fallback to another persona.
