# Screen: Role Reveal Card Phase

> Card distribution phase where each player sees their assigned role.

---

## Screen Purpose

After game starts, each player sees an animated card flip revealing their role, team alignment, and ability description. Player confirms readiness to proceed.

---

## Component Composition

| Component | Usage |
|---|---|
| `Badge (phase)` | "Card Distribution" status pill |
| `RoleRevealCard` | Flip card (back + front) — central element |
| `PrimaryButton` | "I AM READY" (appears after flip) |

---

## Layout Notes

- **Background**: Two large blur blobs (purple) + dot grid pattern (40px repeat)
- **Header**: Phase badge centered with green dot + "Card Distribution" text
- **Card area**: Centered, `perspective-1000`, `aspect-[2/3] max-h-[60vh]`
- **Pre-reveal**: "Tap card to reveal role" instruction with `animate-pulse`
- **Post-reveal**: Instruction fades out, "I AM READY" button fades in with `delay-300`
- **Card flip**: CSS 3D transform with `backface-visibility: hidden`
- **Mafia context**: Teammate list below card (conditional) — empty area for town roles

---

## Unique Requirements

- **CSS-only interaction**: Uses checkbox hack (`:checked ~ .card { rotateY(180deg) }`)
  - In React: controlled state with `isRevealed` boolean
- 3D card flip animation with `preserve-3d`
- Card back: decorative SVG pattern + "?" emblem
- Card front: role icon, name, team, description
- Role icons vary by role (e.g., `local_police` for Sheriff)
- "I AM READY" button only clickable after flip
- For Mafia: teammate list visible below card after reveal
- For Town: "Identity is secret" note

---

## Open Questions / Ambiguities

1. Is the card flip triggered by tap or is it auto-revealed on a timer?
2. For Mafia players, how are teammates shown? Avatars? Names?
3. Does the "I AM READY" confirm to server and show waiting state?
4. What happens if timer expires before player confirms ready?

---

## Dependencies

- `RoleRevealCard`, `Badge`, `PrimaryButton` components
- Card distribution data from Convex (role, team, description)
- 3D CSS animation utilities
- Theme tokens (purple variant)
- i18n strings

---

## Implementation Checklist

- [ ] Build card container with perspective and 3D transform
- [ ] Build card back face (pattern + emblem)
- [ ] Build card front face (dynamic role content)
- [ ] Implement flip animation on tap
- [ ] Implement post-flip button reveal with delayed fade-in
- [ ] Conditionally render Mafia teammate list
- [ ] Build background decorative layer (blobs + dot pattern)
- [ ] Wire up "I AM READY" to server confirmation
- [ ] Handle auto-ready on timer expiry
- [ ] Add i18n for all text
