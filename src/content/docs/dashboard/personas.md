---
title: Personas
description: Author the partial identities that rules can disclose.
---

*Dashboard → Personas.* A persona is a named bundle of fields; each field's sensitivity
tier is the ceiling a rule can raise or lower, so it is shown while you edit.

## Create a persona

1. Under **New persona**, enter a name — `work`, `legal`, `social` — and choose
   **Create persona**.
2. The persona appears below with its id and an empty field table.

Names are unique per subject.

## Add and edit fields

Each persona card ends with an **Add field** row: a key (letters, digits, `_`, `.`,
`-`), a value and a sensitivity tier from `0 · public` to `3 · high` (default
`1 · low`). Saving an existing key overwrites its value and tier.

Every field row has **Save** — after you change the value or the tier — and **Delete**.

## Delete a persona

**Delete persona** removes the persona and all its fields after a confirmation. Rules
that point at it are not deleted: they keep matching but disclose nothing, because a
missing persona is a deny. Delete or rewrite them on the [Policies](/dashboard/policies/)
page, where they are marked *missing persona*.

:::caution[Status: skeleton (2026-08-22)]
This panel calls the `identity` service, which is a skeleton; requests currently
answer `501 not_implemented`.
:::
