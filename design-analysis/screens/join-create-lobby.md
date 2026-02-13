# Screen: Join or Create Room Lobby

> Pre-game screen where users either create a new room or join via code.

---

## Screen Purpose

Dual-action screen: users can create a new game room (hero card action) or join an existing one by entering a 6-character room code.

---

## Component Composition

| Component | Usage |
|---|---|
| `AvatarCircle` | User avatar in header (w-10 h-10) with online indicator |
| `LanguageSwitcher` | Globe button variant in header |
| `TextInput` | Room code input (code variant — centered, mono, uppercase) |
| `SecondaryButton (outline)` | "Join Game" button |
| `Divider` | "OR JOIN" gradient text divider |
| `BottomNavigation` | 3-tab nav (Lobby active) |

---

## Layout Notes

- **Header**: User avatar + name left, language switcher right
- **Hero Title**: "Start **Playing**" (Playing in gradient text) + subtitle
- **Create Room Card**: Full-width `aspect-[4/3] rounded-2xl` button card
  - Background image with gradient overlay
  - Center: Add icon in `w-16 h-16` circle + "Create Room" title + description
  - Shine/hover effect animation
  - Shadow: `shadow-primary/20`
- **Divider**: "OR JOIN" between sections
- **Join Section**: `bg-surface-darker rounded-2xl p-6` card
  - Room code label with `vpn_key` icon
  - 6-char input field
  - Join Game button (outline → primary on hover)
- **Bottom Nav**: Fixed, Lobby tab active
- **Background blobs**: Purple + blue blur effects

---

## Unique Requirements

- Create Room card is a large interactive button with image background
- Room code input: uppercase, monospace, `tracking-[0.5em]`, maxlength 6
- Auto-capitalize room code input via JS
- "Create Room" navigates to Room Lobby (as host)
- Valid code + "Join Game" navigates to Room Lobby (as participant)
- Gradient text utility: `bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-primary`

---

## Open Questions / Ambiguities

1. Room code validation — client-side format check + server lookup?
2. Error state for invalid room code? (Room not found, room full, game already started)
3. Does the Create Room card use a real background image or a placeholder?
4. Is there room configuration before creation (or does it happen in lobby)?

---

## Dependencies

- `AvatarCircle`, `LanguageSwitcher`, `TextInput`, `SecondaryButton`, `Divider`, `BottomNavigation`
- Room creation API (Convex mutation)
- Room lookup API (Convex query)
- User profile data
- Theme tokens (purple variant)
- i18n strings

---

## Implementation Checklist

- [ ] Build page layout with header
- [ ] Build Create Room hero card button with image overlay
- [ ] Reuse `Divider` ("OR JOIN" variant)
- [ ] Build join section card
- [ ] Reuse `TextInput` (code variant)
- [ ] Reuse `SecondaryButton` for "Join Game"
- [ ] Reuse `BottomNavigation` (Lobby active)
- [ ] Wire up Create Room action → navigate to lobby as host
- [ ] Wire up Join Game action → validate code → navigate to lobby
- [ ] Add error handling for invalid/full rooms
- [ ] Add i18n for all text
