# T18 — Mobile Responsiveness & Touch Optimization

| Field | Value |
|-------|-------|
| **Agent** | A2 — Frontend UI Engineer |
| **Priority** | P1 |
| **Complexity** | M |
| **Dependencies** | T14 |

## Description

Ensure the entire game is fully playable on mobile browsers with touch-optimized interactions.

## Sub-Tasks

1. Define breakpoints: mobile (360-480px), tablet (481-768px), desktop (769px+)
2. Mobile lobby: stack layout instead of grid, collapsible settings
3. Mobile game board:
   - Player list as horizontal scrollable strip or compact grid
   - Bottom sheet for action panels (voting, abilities)
   - Floating timer overlay
4. Touch targets: minimum 44x44px for all interactive elements
5. Swipe gestures: swipe to vote (optional enhancement)
6. Prevent accidental double-tap zoom on game actions
7. Viewport meta tag: prevent zoom, handle safe areas (notch, home indicator)
8. Test on:
   - iPhone Safari (latest)
   - Android Chrome (latest)
   - Small screens (360px width)
9. PWA-ready: add `manifest.json`, service worker stub, app icons
10. Handle orientation: lock to portrait or adapt landscape

## Acceptance Criteria

- [ ] Full game playable on 360px screen
- [ ] No horizontal scroll on any page
- [ ] Touch targets meet minimum size
- [ ] Tested on real iOS and Android devices
- [ ] PWA installable from browser
