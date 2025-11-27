# Visit Documentation: Interactions

## Tap Field to Edit

**Trigger:** Tap tap-to-edit row

**Behavior:**
1. Row transforms to input (150ms)
2. Border appears (blue)
3. Keyboard opens
4. Cursor at end of text
5. User edits
6. Text turns black
7. Tap "Done" or tap outside
8. Input transforms back to row (150ms)
9. Auto-save triggers (2 seconds later)

---

## Swipe to Complete

**Trigger:** Swipe up on "Complete Visit" button

**Behavior:**
1. Haptic feedback (medium)
2. Screen slides out (300ms)
3. Visit marked complete
4. Return to Today screen

---

## Take Photo

**Trigger:** Tap "Add Photo"

**Behavior:**
1. In-app camera opens
2. Take photo
3. Photo compresses (<500KB)
4. Photo encrypts
5. Thumbnail appears
6. Auto-save triggers

---

**See implementation.md for code examples.**
