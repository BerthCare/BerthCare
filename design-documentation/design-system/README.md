# Design System Overview

## What This Is

The BerthCare design system is a collection of reusable design tokens, components, and patterns that ensure consistency, speed, and simplicity across the entire product.

This is not a traditional design system with dozens of variants and edge cases. This is a **ruthlessly minimal** system designed for one purpose: help Sarah document a visit in under 60 seconds.

## Core Principles

### 1. Foundations First
Design tokens (colors, typography, spacing, motion) are the atomic building blocks. Components are built from tokens. Features are built from components. This hierarchy ensures consistency and makes changes propagate cleanly.

### 2. Say No to Variants
Most design systems fail by offering too many options. We offer exactly what's needed:
- Buttons: 4 types (primary, secondary, tertiary, destructive)
- Text styles: 6 roles (page heading, section heading, card title, body, label, caption)
- Spacing: 5 scales (xs, sm, md, lg, xl)

If you need a new variant, you must first prove that existing options can't solve the problem.

### 3. Platform-Aware, Not Platform-Specific
We respect iOS and Android conventions (navigation patterns, system fonts, haptics) but maintain a consistent BerthCare identity across platforms. The experience should feel native but recognizable.

### 4. Accessibility is Non-Negotiable
Every component meets WCAG 2.1 AA standards. Color contrast, touch targets, screen reader support, and dynamic type are built in from the start—not added later.

### 5. Performance is a Feature
Fast transitions (<300ms), instant feedback, and optimistic rendering are part of the design language. If a component feels slow, it's a design failure.

## System Architecture

```
Tokens (Foundational)
  ├── Colors (semantic roles, not raw values)
  ├── Typography (system fonts, clear hierarchy)
  ├── Spacing (8pt grid, consistent rhythm)
  └── Animations (durations, easing, reduced motion)
        ↓
Components (Reusable)
  ├── Buttons (primary, secondary, tertiary, destructive)
  ├── Forms (inputs, labels, validation)
  ├── Navigation (app shell, back button, status bar)
  ├── Cards (schedule card, visit summary)
  ├── Modals (rare, only for critical confirmations)
  └── Emergency Trigger (dedicated spec)
        ↓
Features (Complete Experiences)
  ├── Today Schedule (list of visits)
  ├── Visit Documentation (copy-and-edit)
  ├── Emergency Alert (call-first)
  ├── Offline Sync (status indicators)
  └── Onboarding (first-run, empty states)
```

## How Tokens → Components → Features

**Example: Primary Action Button**

**Token level:**
- `color.brand.primary` = #0066CC
- `color.text.inverse` = #FFFFFF
- `space.md` = 16pt
- `type.button.default` = System Bold, 17pt
- `motion.fast` = 150ms

**Component level:**
- Button uses `color.brand.primary` for background
- Button uses `color.text.inverse` for label
- Button has `space.md` horizontal padding
- Button label uses `type.button.default`
- Button press animation uses `motion.fast`

**Feature level:**
- Visit screen uses primary button for "Complete Visit"
- Only one primary button per screen (design rule)
- Button is in thumb zone (bottom third of screen)
- Swipe gesture is alternative to button tap

This hierarchy means:
- Changing `color.brand.primary` updates all primary buttons
- Changing `motion.fast` updates all fast animations
- Components stay consistent without manual coordination

## Design System Files

### `/tokens/`
Foundational design values that cascade through the entire system.

- `colors.md` – Semantic color system (brand, neutral, state, sync, emergency)
- `typography.md` – Type scale and roles (headings, body, labels)
- `spacing.md` – Layout grid and spacing scale
- `animations.md` – Motion tokens (durations, easing, reduced motion)

### `/components/`
Reusable UI building blocks with strict specifications.

- `buttons.md` – Primary, secondary, tertiary, destructive buttons
- `forms.md` – Input fields, labels, validation patterns
- `navigation.md` – App shell, back navigation, status bar
- `cards.md` – Schedule card, visit summary card
- `modals.md` – When and how to use modals (rarely)
- `emergency-trigger.md` – Dedicated spec for emergency button

### `/platform-adaptations/`
How the design system adapts to iOS, Android, and Web.

- `ios.md` – SF Symbols, haptics, iOS navigation patterns
- `android.md` – Material patterns, back button, device fragmentation
- `web.md` – Responsive breakpoints, keyboard navigation (Phase 2)

## Design Rules (Hard Constraints)

These rules are not suggestions. They are architectural constraints that protect simplicity.

### Rule 1: One Primary Action Per Screen
Every screen has exactly one primary action. If you think you need two, you're wrong. Simplify the screen or split it into two screens.

**Example:**
- Today screen: Tap client card (implicit primary action)
- Visit screen: Complete visit (explicit primary action)
- Alert screen: Call coordinator (explicit primary action)

### Rule 2: No Explicit "Save" Buttons
Auto-save happens after 2 seconds of inactivity. Sync status is always visible. Users never wonder "Did it save?"

### Rule 3: Bottom-Heavy Layout
Primary actions live in the bottom third of the screen (thumb zone). Critical information lives in the top two-thirds. This enables one-handed operation.

### Rule 4: Gray = Unchanged, Black = Edited
In copy-and-edit flows, gray text indicates copied values. Black text indicates user edits. This visual language is consistent across all forms.

### Rule 5: Offline Always Works
No feature can require network connectivity to function. Sync happens in the background. Network errors never block the user.

### Rule 6: Touch Targets ≥44pt (iOS) / 48dp (Android)
All interactive elements meet minimum touch target sizes. No exceptions. This is accessibility and usability.

### Rule 7: Screen Transitions <300ms
Transitions between screens must feel instant. If a transition feels slow, optimize it. Use cached data and optimistic rendering.

### Rule 8: No Tutorials or Tooltips
If the interface needs explanation, the design is wrong. Redesign until it's obvious.

### Rule 9: Haptic Feedback for Key Actions
Button presses, swipe completions, and error states use haptic feedback. This provides tactile confirmation without visual clutter.

### Rule 10: Reduced Motion Support
All animations must have reduced-motion alternatives. Users who disable animations should still get clear feedback.

## Using This Design System

### For Designers

1. Start with tokens when designing new screens
2. Use existing components whenever possible
3. Propose new components only when existing ones can't solve the problem
4. Every design must answer: "Does this help Sarah document faster?"

### For Developers

1. Implement tokens first (use Style Dictionary)
2. Build components according to specs (exact spacing, colors, motion)
3. Test on real devices (simulators lie about performance)
4. Measure everything (cold start, transitions, sync time)

### For Product

1. Use this system to evaluate feature requests
2. Reject features that add complexity without clear value
3. Protect the three-screen simplicity
4. Say no to 1,000 things

## What's Not in This System

We deliberately exclude:

- Marketing website design (separate brand)
- Coordinator portal design (Phase 2)
- Email templates (use transactional email service defaults)
- Print layouts (PDF exports use simple templates)

This system is for the mobile app only. Everything else is out of scope.

## Maintenance and Evolution

### When to Add to the System

Add a new token, component, or pattern when:
1. It solves a real problem in the three core screens
2. It will be reused in multiple places
3. It doesn't add complexity that slows Sarah down

### When to Remove from the System

Remove a token, component, or pattern when:
1. It's no longer used anywhere
2. It can be replaced by something simpler
3. It adds complexity without clear value

### Version Control

Design system changes are versioned alongside code:
- Major version (2.0): Breaking changes to tokens or components
- Minor version (1.1): New components or tokens
- Patch version (1.0.1): Bug fixes or clarifications

## Success Criteria

This design system succeeds if:

1. Developers can build new screens without asking designers for specs
2. New screens feel consistent with existing screens
3. Changes to tokens propagate cleanly through components
4. The app feels fast, simple, and obvious to use
5. Sarah documents visits in under 60 seconds

If any of these fail, the system has failed.

---

**Next Steps:**
- Read `/design-system/style-guide.md` for the visual language narrative
- Review `/design-system/tokens/` for foundational design values
- Study `/design-system/components/` for reusable building blocks
