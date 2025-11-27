# Offline Sync Feature

## Overview

Offline sync is not a feature—it's the foundation. BerthCare works offline by default. Sync happens invisibly in the background.

**Purpose:** Let Sarah work anywhere, anytime. Never lose data.

**Success criteria:**
- Works offline for 7 days (auth grace period)
- Sync success rate ≥99.5%
- Data loss incidents: 0
- Sarah never wonders "Did it save?"

## Key Principles

1. **Offline-first** – Everything works offline
2. **Auto-save** – Saves after 2 seconds of inactivity
3. **Background sync** – Syncs when online, non-blocking
4. **Clear status** – Always shows sync state
5. **Conflict resolution** – Last-write-wins, logged for review

## Components Used

- Sync status indicator (`navigation.md`)
- Status chips (on cards)
- Error banners (sync failed)
- Retry buttons

---

**See individual files for detailed specifications.**
