# 001 - Why React Native?

- Status: Accepted
- Date: 2025-11-30
- Deciders: Engineering + Product
- References:
  - [Technical Blueprint §3 — Architecture Overview](../../project-documentation/technical-blueprint.md#3-architecture-overview-jobs-style)
  - [Technical Blueprint §3.1 — The Simplest Thing That Could Possibly Work](../../project-documentation/technical-blueprint.md#the-simplest-thing-that-could-possibly-work)
  - [Technical Blueprint §3.2 — Why React Native?](../../project-documentation/technical-blueprint.md#why-react-native)

## Context

We must deliver iOS and Android clients without duplicating effort, per Technical Blueprint §3 (Architecture Overview) and its mobile-first stack guidance ([The Simplest Thing That Could Possibly Work](../../project-documentation/technical-blueprint.md#the-simplest-thing-that-could-possibly-work), [Why React Native?](../../project-documentation/technical-blueprint.md#why-react-native)). The pilot timeline and small team favor a single codebase with native performance for camera, gestures, offline sync, and background tasks.

## Decision

Build the mobile app with React Native to maximize shared UI/business logic across iOS and Android while retaining access to native capabilities where needed.

## Consequences

- Expect ~80% shared code with faster iteration speed across platforms.
- Native modules/bridges required for camera, push notifications, phone dialer integration, secure storage, and performance-sensitive paths.
- Keep sync/local storage patterns aligned with Blueprint §3 to preserve offline-first guarantees and sub-300ms transitions.
