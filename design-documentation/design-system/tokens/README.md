# Design Tokens

## What Design Tokens Are

Design tokens are the atomic design decisions that cascade through the entire system. They are named, semantic values that replace hard-coded numbers and hex codes.

Instead of:

```css
background-color: #0066CC;
padding: 16px;
font-size: 17px;
```

We use:

```css
background-color: var(--color-brand-primary);
padding: var(--space-md);
font-size: var(--type-body-default-size);
```

## Why Tokens Matter

### 1. Consistency

Tokens ensure that "primary blue" is the same blue everywhere. No more #0066CC in one file and #0065CB in another.

### 2. Maintainability

Changing `color.brand.primary` updates all primary buttons, links, and accents. One change, hundreds of updates.

### 3. Semantic Meaning

`color.state.error` is more meaningful than `#DC3545`. The name explains the purpose.

### 4. Platform Translation

Tokens can be transformed into platform-specific formats:

- iOS: Swift constants or JSON
- Android: XML resources
- Web: CSS custom properties
- React Native: JavaScript constants

### 5. Design-Dev Handoff

Designers and developers speak the same language. "Use `space.md` for padding" is clearer than "use 16 pixels."

## Token Categories

### Colors (`colors.md`)

Semantic color system organized by role:

- **Brand:** Primary, accent, secondary
- **Neutral:** Grayscale from 50 (lightest) to 900 (darkest)
- **Background:** Canvas, surface, overlay
- **Text:** Default, muted, inverse, disabled
- **State:** Success, warning, error, info
- **Sync:** Saving, synced, error
- **Emergency:** Primary, background

### Typography (`typography.md`)

Type scale and roles:

- **Headings:** Page, section
- **Titles:** Card, list row
- **Body:** Default, small
- **Labels:** Default, caption
- Font families, sizes, weights, line heights, letter spacing

### Spacing (`spacing.md`)

Layout grid and spacing scale:

- **Base grid:** 8pt
- **Scale:** xs (4pt), sm (8pt), md (16pt), lg (24pt), xl (32pt)
- **Layout recipes:** Screen padding, card spacing, form rhythm

### Animations (`animations.md`)

Motion tokens:

- **Durations:** Fast (150ms), default (300ms), slow (500ms)
- **Easing:** Standard, decelerate, accelerate
- **Reduced motion:** Alternatives for accessibility

## Naming Convention

Tokens follow a consistent naming pattern:

```
[category].[role].[variant].[state]
```

Examples:

- `color.brand.primary` (category: color, role: brand, variant: primary)
- `color.text.default` (category: color, role: text, variant: default)
- `color.state.error` (category: color, role: state, variant: error)
- `space.md` (category: space, variant: md)
- `type.body.default.size` (category: type, role: body, variant: default, property: size)
- `motion.fast` (category: motion, variant: fast)

Why this convention:

- Predictable: Easy to guess token names
- Hierarchical: Related tokens are grouped
- Semantic: Names explain purpose
- Scalable: Easy to add new tokens

## Token Files

### `colors.md`

Complete color palette with hex values, contrast ratios, and usage examples.

### `typography.md`

Type scale with font families, sizes, weights, line heights, and roles.

### `spacing.md`

Spacing scale with layout recipes and usage examples.

### `animations.md`

Motion tokens with durations, easing curves, and reduced motion alternatives.

## How Tokens Map to Code

Tokens are defined in `/assets/design-tokens.json` and transformed into platform-specific formats using Style Dictionary.

Example token definition:

```json
{
  "color": {
    "brand": {
      "primary": {
        "value": "#0066CC",
        "type": "color",
        "description": "Primary brand color, used for main actions"
      }
    }
  }
}
```

Transforms to:

iOS (Swift):

```swift
public enum Color {
    public static let brandPrimary = UIColor(hex: "#0066CC")
}
```

Android (XML):

```xml
<color name="color_brand_primary">#0066CC</color>
```

Web (CSS):

```css
:root {
  --color-brand-primary: #0066CC;
}
```

React Native (JavaScript):

```javascript
export const colors = {
  brand: {
    primary: '#0066CC',
  },
};
```

## Using Tokens

### For Designers

1. Reference tokens in design files (Figma variables, Sketch symbols)
2. Use token names in annotations ("Button background: `color.brand.primary`")
3. Propose new tokens only when existing ones don't solve the problem

### For Developers

1. Import tokens from generated platform files
2. Never hard-code values (always use tokens)
3. If a token doesn't exist, ask design team before creating it

### For Product

1. Understand that token changes affect the entire system
2. Approve token changes carefully (they cascade widely)
3. Use tokens to evaluate consistency of new features

## Token Governance

### Adding New Tokens

New tokens require:

1. Clear use case (where will it be used?)
2. Semantic name (follows naming convention)
3. Distinct from existing tokens (not a duplicate)
4. Approval from design lead

### Changing Existing Tokens

Token changes require:

1. Impact analysis (what will change?)
2. Visual regression testing (screenshots before/after)
3. Approval from design and engineering leads

### Removing Tokens

Tokens can be removed when:

1. No longer used anywhere (verified by code search)
2. Replaced by a better token
3. Deprecated for at least one release cycle

## Platform-Specific Tokens

Some tokens have platform-specific values:

Example: Touch targets

```json
{
  "size": {
    "touch": {
      "minimum": {
        "ios": { "value": "44pt" },
        "android": { "value": "48dp" }
      }
    }
  }
}
```

**Why:** iOS and Android have different minimum touch target requirements.

## Dark Mode Tokens

Color tokens have light and dark mode variants:

```json
{
  "color": {
    "bg": {
      "canvas": {
        "light": { "value": "#FFFFFF" },
        "dark": { "value": "#1C1C1E" }
      }
    }
  }
}
```

The system automatically selects the correct variant based on user preference.

## Accessibility Tokens

Some tokens are specifically for accessibility:

- `color.text.highContrast` (for high contrast mode)
- `size.touch.minimum` (minimum touch target)
- `motion.reducedMotion` (alternative durations)

These ensure the app works for all users.

## Token Documentation

Each token file includes:

- **Value:** The actual value (hex, pt, ms)
- **Usage:** Where and how to use it
- **Examples:** Visual examples or code snippets
- **Do/Don't:** Common mistakes to avoid
- **Accessibility:** Contrast ratios, WCAG compliance

## Success Criteria

Tokens succeed if:

1. Designers and developers use the same names
2. Changes propagate cleanly through the system
3. New screens feel consistent without manual coordination
4. Platform-specific code is generated automatically
5. Accessibility requirements are built in

If any of these fail, the token system has failed.

---

**Next:** Review individual token files for specific values and usage guidelines.
