# BerthCare Design Documentation

## The Invisible Documentation System

This is the complete UX-UI design system for BerthCare, a mobile application that turns 15 minutes of home care paperwork into 30 seconds of effortless documentation.

## The One Ruthless Goal

**Document a visit in ≤60 seconds, with zero training required.**

If caregivers need a manual, we've failed. If the app adds friction instead of removing it, we've failed. Every design decision in this system exists to serve this single goal.

## Product Philosophy

BerthCare is built on Steve Jobs' design principles, adapted for healthcare:

**Simplicity is the ultimate sophistication**
- Three screens. No more. Today, Visit, Alert.
- No navigation menus, no hamburger icons, no settings screens.
- If users need to think, the design is wrong.

**Start with the experience, work backwards**
- We don't design from EMR tables or compliance checklists.
- We start from Sarah's reality: open app → see visits → tap client → edit what changed → done.
- Technology exists to serve this experience, not the other way around.

**The best interface is no interface**
- No "Save" buttons (auto-save is invisible).
- No "Copy from last visit" buttons (it's already copied).
- No "Check in / Check out" steps (EVV happens passively).
- The app opens to action, not options.

**Say no to 1,000 things**
- We will reject good ideas to protect the great one.
- Every button, field, and screen is guilty until proven essential.
- Complexity is the enemy. We fight it ruthlessly.

## Who This Serves

**Sarah – The Frontline Caregiver**
- 42 years old, Personal Support Worker
- 6-8 visits per day
- Currently spends 3-5 hours per week on unpaid paperwork
- Needs to document visits in under a minute, without thinking

**Linda – The Care Coordinator**
- Manages 20-30 caregivers and 100+ clients
- Needs real-time confidence that visits happened
- Wants immediate alerts when something is wrong
- Can't afford to chase missing paperwork

## Directory Structure

### `/design-system/`
The foundational design language: tokens (colors, typography, spacing, motion), components (buttons, forms, cards), and platform adaptations (iOS, Android, Web).

**Start here** if you're implementing UI components or need to understand the visual language.

### `/features/`
Complete specifications for each feature: user journeys, screen states, interactions, accessibility, and implementation notes.

**Start here** if you're building a specific feature or need to understand user flows.

### `/accessibility/`
Accessibility guidelines, testing procedures, and compliance documentation.

**Start here** if you're ensuring the app works for all users, including those with disabilities.

### `/assets/`
Design tokens (JSON), Style Dictionary configuration, and reference images.

**Start here** if you're setting up the design system in code or need exportable assets.

## How to Use This Documentation

### For Designers

1. Read this README and `/design-system/style-guide.md` to understand the philosophy
2. Review [`/design-system/tokens/`](/design-documentation/design-system/tokens/) to understand the foundational design language
3. Study `/features/` to see how tokens and components combine into complete experiences
4. Reference [`/design-system/components/`](/design-documentation/design-system/components/) when designing new screens or patterns

**Key principle:** Every design decision must answer: "Does this help Sarah document a visit in under 60 seconds?"

### For Developers

1. Read this README to understand the product goal
2. Implement design tokens from `/assets/design-tokens.json` using Style Dictionary
3. Build components according to [`/design-system/components/`](/design-documentation/design-system/components/) specifications
4. Reference `/features/[feature-name]/implementation.md` for feature-specific guidance
5. Test against `/accessibility/testing.md` requirements

**Key principle:** If the implementation requires Sarah to think or wait, it's wrong. Optimize for speed and obviousness.

### Generate Design Tokens (Style Dictionary)

1. Install tooling (from repo root): `cd design-documentation && npm install`
2. Build platform outputs: `npm run tokens:build`
   - Outputs land in `design-documentation/assets/style-dictionary/build/` for iOS, Android, Web, and React Native

### Consume Design Tokens (examples)

**React Native**
```js
// path: design-documentation/assets/style-dictionary/build/react-native/tokens.js
import * as Tokens from '../design-documentation/assets/style-dictionary/build/react-native/tokens';

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: Tokens.ColorBrandPrimary
  }
});
```

**iOS Swift**
```swift
// path: design-documentation/assets/style-dictionary/build/ios/DesignTokens.swift
import UIKit

let primary = DesignTokens.ColorBrandPrimary
button.backgroundColor = primary
```

**Android XML**
```xml
<!-- path: design-documentation/assets/style-dictionary/build/android/colors.xml -->
<TextView
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="Hello Sarah"
    android:textColor="@color/color_brand_primary" />
```

### For Product/Stakeholders

1. Read this README and `/project-documentation/product-vision.md`
2. Review `/features/` to understand user journeys and success criteria
3. Reference `/design-system/style-guide.md` to understand design decisions
4. Use this documentation to evaluate whether new feature requests align with the core goal

**Key principle:** Every feature request must be evaluated against the "say no to 1,000 things" philosophy.

## Success Metrics

This design system succeeds if:

1. **Documentation time:** ≤60 seconds per visit (from 15 minutes baseline)
2. **Zero training:** Caregivers can use the app without explanation
3. **Daily adoption:** ≥90% of enrolled caregivers use it daily
4. **Love:** Caregivers say "I'd be upset if you took this away"
5. **Reliability:** ≥99.5% sync success, 0 data loss incidents

If we don't hit these metrics, the design has failed—no matter how beautiful it looks.

## What We're NOT Building (MVP)

To protect simplicity, we explicitly reject these features in MVP:

- Family portal and messaging
- Care team chat or internal messaging
- Task assignment workflows
- Full Medication Administration Record (MAR)
- Structured incident reporting forms
- AI documentation or clinical decision support
- Analytics dashboards
- Multi-tier alert escalation
- Rich coordinator portal (beyond basic exports)

Each of these is a good idea. We're saying no anyway. The MVP does three things exceptionally well:

1. Show today's schedule
2. Let Sarah document by tapping what changed
3. Let her call for help instantly

Everything else is Phase 2.

## Backend Deployment Pipeline (Dev)

Reference: [Technical Blueprint §9 — Build Strategy](../project-documentation/technical-blueprint.md#9-build-strategy--milestones). Current dev pipeline favors a simple GitHub Actions → AWS ECS flow.

```mermaid
flowchart LR
  Dev[Push to main\nbackend code/workflow] --> CI[backend-ci.yml\nlint + tests]
  CI --> Deploy[backend-deploy-dev.yml]
  Deploy -->|OIDC assume role\ngithub-actions-deploy-dev| ECR[ECR: berthcare-backend\n{SHA, latest}]
  Deploy -->|Render & register task def| ECS[ECS service\nberthcare-dev-backend]
  ECS --> ALB[ALB https:443\nhttp->https redirect]
  ALB --> Clients[Mobile clients via API]
```

**Triggers**
- Push to `main` touching `berthcare-backend/**` or `.github/workflows/backend-deploy-dev.yml`
- Manual `workflow_dispatch` for re-deploy or rollback

**Inputs (secrets/env)**
- GitHub Actions secrets: `AWS_ACCOUNT_ID`, `SLACK_WEBHOOK_URL`
- App runtime: `DATABASE_URL` (required), `PORT` (optional; defaults 3000)
- Auth: AWS assumed via GitHub OIDC (no static keys)

**Deviations from Technical Blueprint**
- Blueprint §9 called for a “basic deploy script” to staging; we use a two-job GitHub Actions workflow (CI → deploy) targeting the dev ECS service, with buildx caching and Slack notification.
- Health-check injection during task-definition render (`curl /health`) is stricter than the baseline design and blocks rollout until the container passes readiness.
- HTTPS enforcement (ALB redirect + TLS 1.3 policy) is already applied in dev; blueprint noted TLS hardening primarily for production.

**Rollback**
- Re-run the deploy workflow against a previous commit SHA, or select a prior task definition revision for `berthcare-dev-backend` in ECS and force a new deployment.

## Design Principles in Practice

### Principle 1: Invisible by Default
**Bad:** "Click 'New Note' to start documenting"
**Good:** Last visit's notes are already there. Just edit what changed.

### Principle 2: One-Handed Operation
**Bad:** Primary action button at top of screen
**Good:** Swipe up to complete (thumb zone, natural gesture)

### Principle 3: Offline Always Works
**Bad:** "No internet connection" error blocks usage
**Good:** Everything works offline. Sync happens invisibly when online.

### Principle 4: Call-First, Data-Second
**Bad:** "Select alert type" dropdown before calling coordinator
**Good:** Tap "Something's wrong" → Tap "Call Coordinator" → Phone dials immediately

### Principle 5: No Training Required
**Bad:** Tutorial screens explaining features
**Good:** The interface is so obvious that tutorials are unnecessary

## Version History

**Version 1.0** – November 25, 2025
- Initial design system for MVP
- Three core screens: Today, Visit, Alert
- Offline-first architecture
- iOS and Android platform adaptations

## Questions or Feedback?

If something in this documentation is unclear, that's a design failure. The documentation should be as obvious as the product.

File issues or questions with the product team.

---

**Remember:** The goal isn't to build a documentation app. The goal is to make documentation invisible so caregivers can focus on care.

Start with the smallest possible thing that proves we understand Sarah's pain.

This is it.
