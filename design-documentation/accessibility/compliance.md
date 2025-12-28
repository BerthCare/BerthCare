# Accessibility Compliance

## Legal Requirements

BerthCare must comply with accessibility laws in Canada and Alberta.

### Canadian Requirements

Accessible Canada Act (ACA)

- Applies to federally regulated organizations
- Requires WCAG 2.1 Level AA compliance
- Requires accessibility feedback mechanism

Provincial Requirements (Alberta)

- Alberta Human Rights Act
- Duty to accommodate persons with disabilities
- WCAG 2.1 Level AA recommended

### U.S. Requirements (if expanding)

Americans with Disabilities Act (ADA)

- Applies to public accommodations
- WCAG 2.1 Level AA compliance

Section 508

- Applies to federal agencies
- WCAG 2.1 Level AA compliance

---

## WCAG 2.1 Level AA Mapping

### Perceivable

| Criterion                    | Requirement            | BerthCare Compliance        |
| ---------------------------- | ---------------------- | --------------------------- |
| 1.1.1 Non-text Content       | Alt text for images    | ✓ All images have alt text  |
| 1.3.1 Info and Relationships | Semantic structure     | ✓ Proper heading hierarchy  |
| 1.4.3 Contrast (Minimum)     | 4.5:1 for text         | ✓ All text ≥4.5:1           |
| 1.4.4 Resize Text            | 200% without loss      | ✓ Dynamic type support      |
| 1.4.5 Images of Text         | Avoid images of text   | ✓ No images of text         |
| 1.4.10 Reflow                | No horizontal scroll   | ✓ Layout adapts             |
| 1.4.11 Non-text Contrast     | 3:1 for UI             | ✓ All UI ≥3:1               |
| 1.4.12 Text Spacing          | Adjustable spacing     | ✓ System fonts support      |
| 1.4.13 Content on Hover      | Dismissible, hoverable | ✓ No hover content (mobile) |

### Operable

| Criterion                     | Requirement            | BerthCare Compliance        |
| ----------------------------- | ---------------------- | --------------------------- |
| 2.1.1 Keyboard                | All functionality      | ✓ Screen reader gestures    |
| 2.1.2 No Keyboard Trap        | Can navigate away      | ✓ No traps                  |
| 2.1.4 Character Key Shortcuts | Remappable             | ✓ No shortcuts (mobile)     |
| 2.2.1 Timing Adjustable       | Extend time limits     | ✓ No time limits            |
| 2.2.2 Pause, Stop, Hide       | Control moving content | ✓ No auto-moving content    |
| 2.3.1 Three Flashes           | No flashing            | ✓ No flashing content       |
| 2.4.1 Bypass Blocks           | Skip navigation        | ✓ Simple navigation         |
| 2.4.2 Page Titled             | Descriptive titles     | ✓ Clear screen titles       |
| 2.4.3 Focus Order             | Logical order          | ✓ Top-to-bottom order       |
| 2.4.4 Link Purpose            | Clear from context     | ✓ Descriptive labels        |
| 2.4.5 Multiple Ways           | Multiple navigation    | ✓ Back, gestures, buttons   |
| 2.4.6 Headings and Labels     | Descriptive            | ✓ Clear headings/labels     |
| 2.4.7 Focus Visible           | Visible focus          | ✓ 2pt blue outline          |
| 2.5.1 Pointer Gestures        | Alternatives           | ✓ All gestures have buttons |
| 2.5.2 Pointer Cancellation    | Cancel on up-event     | ✓ Standard touch behavior   |
| 2.5.3 Label in Name           | Visible label matches  | ✓ Labels match              |
| 2.5.4 Motion Actuation        | Alternatives           | ✓ No motion-only controls   |

### Understandable

| Criterion                       | Requirement          | BerthCare Compliance            |
| ------------------------------- | -------------------- | ------------------------------- |
| 3.1.1 Language of Page          | Language set         | ✓ en-US                         |
| 3.2.1 On Focus                  | No context change    | ✓ No unexpected changes         |
| 3.2.2 On Input                  | No context change    | ✓ No unexpected changes         |
| 3.2.3 Consistent Navigation     | Consistent           | ✓ Consistent navigation         |
| 3.2.4 Consistent Identification | Consistent           | ✓ Consistent icons/labels       |
| 3.3.1 Error Identification      | Errors identified    | ✓ Clear error messages          |
| 3.3.2 Labels or Instructions    | Provided             | ✓ All inputs labeled            |
| 3.3.3 Error Suggestion          | Suggestions provided | ✓ Format examples               |
| 3.3.4 Error Prevention          | Confirmation         | ✓ Destructive actions confirmed |

### Robust

| Criterion               | Requirement  | BerthCare Compliance      |
| ----------------------- | ------------ | ------------------------- |
| 4.1.1 Parsing           | Valid markup | ✓ Native components       |
| 4.1.2 Name, Role, Value | Accessible   | ✓ All elements accessible |
| 4.1.3 Status Messages   | Announced    | ✓ Sync status announced   |

---

## Compliance Documentation

### Accessibility Statement

**Location:** App settings (Phase 2), website

Content:

- BerthCare is committed to accessibility
- WCAG 2.1 Level AA compliance
- Contact for accessibility feedback
- Known issues and workarounds (if any)

### VPAT (Voluntary Product Accessibility Template)

**Purpose:** Document WCAG compliance for procurement

Sections:

- WCAG 2.1 Level A (all criteria met)
- WCAG 2.1 Level AA (all criteria met)
- WCAG 2.1 Level AAA (partial, not required)

### Accessibility Feedback Mechanism

**Contact:** accessibility@berthcare.com (example)

Process:

1. User reports accessibility issue
2. Team reviews within 48 hours
3. Issue prioritized and fixed
4. User notified of resolution

---

## Compliance Testing

Annual audit:

- Third-party accessibility audit
- WCAG 2.1 Level AA compliance verification
- User testing with persons with disabilities

Continuous monitoring:

- Automated testing (axe, Accessibility Scanner)
- Manual testing (VoiceOver, TalkBack)
- User feedback

---

## Risk Mitigation

Potential risks:

- Non-compliance fines
- Lawsuits (ADA, Human Rights)
- Reputation damage
- Exclusion of users with disabilities

Mitigation:

- WCAG 2.1 Level AA compliance (minimum)
- Regular testing and audits
- Accessibility feedback mechanism
- Continuous improvement

---

This completes the accessibility documentation. See assets folder for design tokens and configuration files.
