# NNN - <Title>

- Status: <Proposed|Accepted|Superseded>
- Date: YYYY-MM-DD
- Deciders: <names>
- References: [Technical Blueprint §3 — Architecture Overview](../../../project-documentation/technical-blueprint.md#3-architecture-overview-jobs-style); <other sources/links>

> Numbering: filenames start at `001` and stay fixed; new ADRs take the next zero-padded `NNN-title.md` value (do not rename earlier numbers).
> Lifecycle: include Status and Date; statuses typically flow Proposed -> Accepted -> Superseded (preserve filenames when superseded).
> Engineering rituals: cite applicable items in References for each ADR.

- Initialize repo scaffolds and commit; use branch/PR flow per CONTRIBUTING.
- Follow code review and testing gates before acceptance.
- Keep docs/READMEs and architecture diagrams updated when behavior changes.
- Reference/update Technical Blueprint diagrams when building features that touch architecture.
- Run security scans/compliance checklists as required.
- Perform deployment verification and maintain rollback steps where applicable.

## Context

Describe the problem, constraints, and architectural forces. Cite Technical Blueprint §3 (e.g., [The Simplest Thing That Could Possibly Work](../../../project-documentation/technical-blueprint.md#the-simplest-thing-that-could-possibly-work), [Why React Native?](../../../project-documentation/technical-blueprint.md#why-react-native)) and any other relevant sources that informed the decision.

## Decision

Record the choice made and the rationale.

## Consequences

- Positive/expected outcomes
- Risks or trade-offs
- Follow-ups or related ADRs
