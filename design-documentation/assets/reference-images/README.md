# Reference Images

## Purpose

This folder contains reference images and mockups for the BerthCare design system.

## File Naming Convention

**Format:** `[screen]-[state]@[scale].png`

Examples:

- `today-default@2x.png` – Today screen, default state, 2x resolution
- `today-empty@2x.png` – Today screen, empty state, 2x resolution
- `visit-editing@2x.png` – Visit screen, editing state, 2x resolution
- `visit-offline@2x.png` – Visit screen, offline state, 2x resolution
- `alert-modal@2x.png` – Emergency alert modal, 2x resolution

## Scales

- `@1x` – Standard resolution (750×1334 for iPhone 8)
- `@2x` – Retina resolution (1125×2436 for iPhone X)
- `@3x` – Super Retina resolution (1242×2688 for iPhone XS Max)

## Screens to Document

### Today Screen

- `today-default@2x.png` – Default state with visits
- `today-empty@2x.png` – Empty state (no visits)
- `today-offline@2x.png` – Offline state
- `today-error@2x.png` – Sync error state
- `today-dark@2x.png` – Dark mode

### Visit Screen

- `visit-default@2x.png` – Default state (pre-filled)
- `visit-editing@2x.png` – Editing a field
- `visit-empty@2x.png` – First visit (empty fields)
- `visit-photo@2x.png` – With photo
- `visit-dark@2x.png` – Dark mode

### Emergency Alert

- `alert-modal@2x.png` – Emergency modal
- `alert-call@2x.png` – Call coordinator button
- `alert-note@2x.png` – Optional note after call

### Components

- `button-primary@2x.png` – Primary button
- `button-secondary@2x.png` – Secondary button
- `button-destructive@2x.png` – Destructive button
- `card-schedule@2x.png` – Schedule card
- `input-default@2x.png` – Text input
- `input-error@2x.png` – Text input with error

## How to Use

For designers:

- Export mockups from Figma/Sketch
- Use naming convention above
- Include 2x and 3x versions
- Update this README with new images

For developers:

- Reference images for implementation
- Compare implementation to mockups
- Use for visual regression testing

For stakeholders:

- Review design direction
- Provide feedback on mockups
- Understand user flows

## Tools

Export from Figma:

1. Select frame
2. Export settings: PNG, 2x
3. Name according to convention
4. Save to this folder

Export from Sketch:

1. Select artboard
2. Export: PNG, 2x
3. Name according to convention
4. Save to this folder

## Notes

- Images are for reference only (not used in production app)
- Keep images up to date with design changes
- Delete outdated images
- Compress images (use ImageOptim or similar)

---

This completes the design system documentation.
