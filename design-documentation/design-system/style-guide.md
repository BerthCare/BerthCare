# Style Guide

## Visual Language Philosophy

BerthCare's visual language is designed for one environment: the real world of home care. Not a design conference. Not a tech demo. The real world.

Sarah uses this app in bright sunlight, in dim hallways, in moving cars, with wet hands, with gloves on, while standing, while stressed. The visual language must work in all of these contexts—or it fails.

## Design Principles

### Calm, Not Clinical
Home care is intimate and personal. The visual language should feel trustworthy and professional without feeling cold or institutional.

**What this means:**
- Soft, rounded corners (not sharp edges)
- Warm neutrals (not stark white or cold gray)
- Generous whitespace (not cramped forms)
- Human photography (not stock medical imagery)

### Legible, Not Loud
Information must be instantly readable in any lighting condition. Hierarchy must be obvious at a glance.

**What this means:**
- High contrast text (WCAG AA minimum)
- System fonts (optimized for screen reading)
- Clear visual hierarchy (size, weight, color)
- No decorative elements that compete with content

### Fast, Not Flashy
Every visual element must serve speed. Animations provide feedback, not entertainment. Colors communicate state, not brand.

**What this means:**
- Animations are functional (confirm actions, show state changes)
- Colors have semantic meaning (green = synced, red = error)
- Layout optimizes for thumb reach (bottom-heavy)
- No visual elements that slow comprehension

## Color Philosophy

### Semantic, Not Decorative

Every color in BerthCare has a job. There are no decorative colors.

**Brand colors** establish identity and guide primary actions:
- Primary blue: "This is the main action"
- Accent teal: "This is important but secondary"

**Neutral colors** create hierarchy and structure:
- Dark neutrals: Primary content
- Mid neutrals: Secondary content
- Light neutrals: Backgrounds and dividers

**State colors** communicate system status:
- Green: Success, synced, completed
- Yellow: Warning, needs attention
- Red: Error, failed, emergency
- Blue: Information, in progress

**Sync colors** show data status (critical for offline-first):
- Gray: Saved locally, not yet synced
- Blue: Syncing in progress
- Green: Synced successfully
- Red: Sync failed, needs retry

**Emergency color** is reserved for one purpose:
- Red: Something is wrong, call for help

### Contrast and Legibility

All text meets WCAG 2.1 AA contrast requirements:
- Body text: ≥4.5:1 contrast ratio
- Large text (≥18pt): ≥3:1 contrast ratio
- UI elements: ≥3:1 contrast ratio

**Why this matters:** Sarah uses the app in bright sunlight. Low contrast text is unreadable outdoors.

### Color in Sunlight

Colors are tested in bright outdoor conditions:
- Blues and teals remain visible (cool colors work in sunlight)
- Yellows and light grays are avoided for critical text (wash out in sunlight)
- High contrast is maintained across all lighting conditions

## Typography Philosophy

### System Fonts, Not Custom Fonts

BerthCare uses system fonts (SF Pro on iOS, Roboto on Android) for three reasons:

1. **Performance:** System fonts load instantly (no web font delay)
2. **Legibility:** System fonts are optimized for screen reading
3. **Accessibility:** System fonts support dynamic type (user font scaling)

Custom fonts would add load time, reduce legibility, and complicate accessibility. Not worth it.

### Hierarchy Through Size and Weight

Typography hierarchy is created through size and weight, not color or decoration:

**Page heading** (28pt, Bold): Screen title, used once per screen
**Section heading** (22pt, Semibold): Major sections within a screen
**Card title** (17pt, Semibold): Client names, visit titles
**Body text** (17pt, Regular): Visit notes, documentation
**Label** (15pt, Regular): Field labels, metadata
**Caption** (13pt, Regular): Timestamps, helper text

**Why this scale:**
- 17pt body text is comfortable for extended reading
- 28pt page heading is large enough to scan quickly
- 13pt caption is small but still legible (meets WCAG AA at high contrast)

### Line Height and Spacing

Line height is generous to improve readability:
- Headings: 1.2x (tight, for impact)
- Body text: 1.5x (comfortable for reading)
- Labels: 1.3x (compact but readable)

Paragraph spacing is 16pt (one line of body text) to create clear visual breaks.

### Dynamic Type Support

All text scales with iOS Dynamic Type and Android font size settings:
- Test at 100% (default), 150% (common), and 200% (maximum)
- Layout must not break at any scale
- Minimum touch targets (44pt/48dp) must be maintained

**Why this matters:** Many caregivers are over 40 and prefer larger text. If the app doesn't scale, it's unusable for them.

## Layout and Spacing Philosophy

### 8pt Grid System

All spacing is based on an 8pt grid:
- xs: 4pt (tight spacing, rare)
- sm: 8pt (compact spacing)
- md: 16pt (default spacing)
- lg: 24pt (generous spacing)
- xl: 32pt (section breaks)

**Why 8pt:** Divisible by 2 and 4, works well across screen densities, creates consistent rhythm.

### Screen Padding

All screens have consistent edge padding:
- iOS: 16pt horizontal, 8pt top (below safe area), 16pt bottom
- Android: 16dp horizontal, 8dp top, 16dp bottom

**Why:** Creates breathing room, prevents content from touching screen edges, maintains consistency.

### Vertical Rhythm

Vertical spacing follows a consistent rhythm:
- Between cards: 12pt (tight, for scanning)
- Between sections: 24pt (clear visual break)
- Between screen title and content: 16pt (comfortable)
- Between form fields: 16pt (comfortable for input)

### Bottom-Heavy Layout

Primary actions live in the bottom third of the screen (thumb zone):
- Complete visit button: 16pt from bottom
- Emergency button: Always accessible (floating or in navigation)
- Back button: Top left (iOS) or system back (Android)

**Why:** One-handed operation. Sarah often holds a bag or opens a door with her other hand.

## Component Patterns

### Cards

Cards are the primary content container:
- Rounded corners: 12pt radius (soft, approachable)
- Shadow: Subtle (2pt offset, 8pt blur, 10% opacity)
- Padding: 16pt all sides
- Background: White (light mode) or dark surface (dark mode)

**Why cards:** Clear visual grouping, easy to scan, familiar pattern.

### Buttons

Buttons follow a strict hierarchy:
- **Primary:** Filled, brand color, high contrast label
- **Secondary:** Outlined, brand color border, brand color label
- **Tertiary:** Text only, brand color label, no border
- **Destructive:** Filled, red background, white label

**Rules:**
- One primary button per screen (maximum)
- Primary button is always the main action
- Destructive buttons require confirmation (modal)

### Forms

Forms are designed for speed, not data collection:
- Labels are inline (not above fields)
- Previous values are pre-filled (gray text)
- Validation is inline (below field, red text)
- No "required field" indicators (all fields are required or optional is obvious)

**Why:** Reduces visual clutter, speeds up input, makes copy-and-edit obvious.

### Status Indicators

Status is communicated through color, icon, and text:
- **Synced:** Green checkmark + "Synced"
- **Syncing:** Blue spinner + "Syncing..."
- **Saved locally:** Gray cloud + "Saved locally"
- **Error:** Red exclamation + "Sync failed"

**Why:** Redundant encoding (color + icon + text) ensures status is clear even for colorblind users.

## Animation and Motion

### Functional, Not Decorative

Every animation serves a purpose:
- **Confirm action:** Button press (scale down 95%, 150ms)
- **Show transition:** Screen slide (300ms, ease-out)
- **Indicate progress:** Spinner rotation (continuous, 1s per rotation)
- **Provide feedback:** Haptic + visual (simultaneous)

**No animations for:**
- Decoration or delight (wastes time)
- Attention-grabbing (distracting)
- Branding (not the place)

### Speed and Easing

Animations are fast and decisive:
- **Fast:** 150ms (button press, toggle)
- **Default:** 300ms (screen transition, modal)
- **Slow:** 500ms (rare, only for complex state changes)

Easing curves:
- **Ease-out:** Default (decelerates, feels responsive)
- **Ease-in-out:** Rare (smooth but slower)
- **Linear:** Never (feels robotic)

### Reduced Motion

All animations have reduced-motion alternatives:
- Screen transitions: Instant (no slide)
- Button press: Opacity change (no scale)
- Spinners: Static icon (no rotation)

**Why:** Some users experience motion sickness. Reduced motion is an accessibility requirement.

## Photography and Imagery

### Client Photos

Client photos are the most important visual element:
- **Size:** 64x64pt (large enough to recognize)
- **Shape:** Circle (friendly, consistent)
- **Border:** 2pt white border (separates from background)
- **Fallback:** Initials on colored background (if no photo)

**Why:** Recognition is critical. Sarah needs to identify clients at a glance.

### Visit Photos

Visit photos (wounds, conditions) are functional, not decorative:
- **Size:** Full width, 4:3 aspect ratio (camera native)
- **Compression:** <500KB (fast upload, good quality)
- **Encryption:** Always (before storage)
- **Thumbnail:** 120x90pt (for visit history)

**Why:** Photos are clinical documentation, not social media. Quality and security matter more than aesthetics.

### Icons

Icons are simple and functional:
- **Style:** Outlined (not filled, except for active state)
- **Size:** 24x24pt (comfortable tap target)
- **Color:** Semantic (matches text color or state color)
- **Source:** SF Symbols (iOS), Material Icons (Android)

**Why:** System icons are familiar, accessible, and free.

## Dark Mode

BerthCare supports dark mode with semantic color tokens:
- Background: Dark gray (not pure black, easier on eyes)
- Surface: Slightly lighter gray (cards, modals)
- Text: Off-white (not pure white, reduces eye strain)
- Colors: Slightly desaturated (less harsh in dark mode)

**Why:** Many caregivers work early morning or evening shifts. Dark mode reduces eye strain in low light.

## Accessibility Considerations

### Color Contrast
All text meets WCAG 2.1 AA:
- Body text: ≥4.5:1
- Large text: ≥3:1
- UI elements: ≥3:1

### Touch Targets
All interactive elements:
- iOS: ≥44x44pt
- Android: ≥48x48dp

### Screen Reader Support
All elements have semantic labels:
- Buttons: Clear action labels
- Images: Descriptive alt text
- Status: Announced on change

### Dynamic Type
All text scales with system settings:
- Test at 100%, 150%, 200%
- Layout adapts without breaking

## Design Decisions: Good vs Bad

### Example 1: Visit Documentation

**Bad:**
- Blank form with "New Note" button
- All fields empty, requires typing everything
- "Save" button at top of screen
- No indication of what changed

**Good:**
- Last visit's notes pre-filled (gray text)
- Only edited fields turn black
- Auto-save (no button)
- Swipe up to complete (thumb zone)

**Why:** Copy-and-edit is 10x faster than blank forms.

### Example 2: Emergency Alert

**Bad:**
- "Select alert type" dropdown
- "Describe the situation" text field
- "Submit alert" button
- Coordinator gets notification, calls back later

**Good:**
- "Something's wrong" button (always visible)
- "Call Coordinator" button (one tap)
- Phone dials immediately
- Optional note after call

**Why:** In an emergency, every second counts. Forms slow down help.

### Example 3: Sync Status

**Bad:**
- No indication of sync status
- "Sync now" button (manual)
- Error message: "Sync failed" (no context)

**Good:**
- Always-visible status: "Saved locally" → "Syncing..." → "Synced"
- Automatic background sync
- Error message: "Sync failed. Will retry in 30 seconds."

**Why:** Users need confidence that data is safe. Ambiguity creates anxiety.

## Platform-Specific Adaptations

### iOS
- Navigation: Swipe from left edge to go back
- Buttons: Rounded, filled (iOS style)
- Haptics: Medium impact for primary actions
- Fonts: SF Pro (system font)

### Android
- Navigation: System back button
- Buttons: Slightly less rounded (Material style)
- Haptics: Standard vibration patterns
- Fonts: Roboto (system font)

### Shared
- Three-screen structure (identical)
- Color palette (identical)
- Component behavior (identical)
- Copy-and-edit pattern (identical)

**Why:** Feel native, but maintain BerthCare identity.

## What We're NOT Doing

To protect simplicity, we explicitly reject:

**Visual complexity:**
- Gradients, shadows, or textures (flat is faster)
- Custom illustrations (photos are functional)
- Animated mascots or characters (distracting)
- Decorative patterns or backgrounds (noise)

**Interaction complexity:**
- Gesture tutorials (if it needs explanation, it's wrong)
- Hidden navigation (hamburger menus)
- Multi-step wizards (one screen per task)
- Customizable themes (one design, done well)

**Feature complexity:**
- Settings screens (no settings to configure)
- Notification preferences (smart defaults only)
- Multiple views or layouts (one way, the right way)
- Power user shortcuts (everyone is a power user)

## Conclusion

This style guide describes a visual language designed for speed, clarity, and reliability in the real world of home care.

Every decision—from color contrast to button placement to animation speed—exists to help Sarah document a visit in under 60 seconds.

If a design choice doesn't serve that goal, it doesn't belong in BerthCare.

---

**Next:** Review `/design-system/tokens/` for specific color values, typography scales, and spacing measurements.
