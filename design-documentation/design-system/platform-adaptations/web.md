# Web Platform Adaptations (Phase 2)

## Purpose

Web version is for coordinators (Linda), not caregivers (Sarah). Different use case, different adaptations.

**Coordinator needs:**
- View all caregivers and visits
- Export reports (PDF, FHIR)
- Monitor sync status
- Respond to alerts

## Responsive Breakpoints

**Mobile:** <768px (phone-sized)
**Tablet:** 768px-1024px (iPad-sized)
**Desktop:** >1024px (laptop/desktop)

## Navigation

**Desktop:**
- Sidebar navigation (persistent)
- Breadcrumbs for deep navigation
- Keyboard shortcuts (Cmd+K for search)

**Mobile:**
- Hamburger menu (acceptable for coordinator portal)
- Bottom navigation bar
- Swipe gestures

## Keyboard Navigation

**Tab order:**
- Logical, top-to-bottom, left-to-right
- Skip links for screen readers
- Focus indicators (2pt blue outline)

**Shortcuts:**
- Tab / Shift+Tab: Navigate
- Enter / Space: Activate
- Escape: Close modal / Cancel
- Cmd+K: Search

## Mouse Interactions

**Hover states:**
- Buttons: Slight darkening
- Cards: Elevation increase
- Links: Underline appears

**Cursor:**
- Pointer for interactive elements
- Text cursor for inputs
- Not-allowed for disabled elements

## Typography

**System fonts:**
- macOS: -apple-system, SF Pro
- Windows: Segoe UI
- Linux: Roboto, Ubuntu

**Scaling:**
- Base: 16px (browser default)
- Respect browser zoom (Cmd +/-)
- Test at 100%, 150%, 200%

---

**Note:** Web version is Phase 2. Mobile app (iOS/Android) is MVP priority.
