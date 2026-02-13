# Screen: Public Voting Phase

> Daytime voting where all players vote to eliminate a suspect.

---

## Screen Purpose

Timed voting phase. Players tap a player card to cast their vote. Votes are visible in real-time. Includes option to skip the vote. Owner can confirm results early.

---

## Component Composition

| Component | Usage |
|---|---|
| `PhaseHeader (public-voting)` | "Public Execution" title, inline timer, progress bar |
| `TimerDisplay (inline)` | Large timer with urgent red pulse animation |
| `PlayerCard (voting)` | 2-col grid with vote count badges + voter avatars |
| `Badge (vote-count)` | Circular badge showing vote count per player |
| `AvatarCircle` | Stacked mini voter avatars (-space-x-2) |
| `SecondaryButton (dashed)` | "Skip Vote" option |
| `PrimaryButton` | "Confirm Results" (owner only) |

---

## Layout Notes

- **Header**: Title "Public Execution" + large inline timer + "Tap a player..." subtitle + progress bar
- **Grid**: 2-col, scrollable, with bottom padding for fixed bar
- **Card states**:
  - Default: subtle border, clickable
  - Selected (my vote): `border-2 border-primary + shadow-glow + scale-[1.02]`, checkmark icon
  - High votes: Large animated vote badge in red with `animate-bounce`
  - No votes: "No Votes" text, slightly dimmed (`opacity-75`)
- **Voters row**: Stacked mini avatars showing who voted for each player
  - Overflow: `+N` badge for additional voters
- **Skip Vote**: Full-width dashed button at bottom of scroll area
- **Bottom bar**: Fixed gradient overlay with owner CTA ("Confirm Results")

---

## Unique Requirements

- Vote is public — all voters visible in real-time
- Tap to vote (toggle), re-tap to change vote
- Timer urgency: red pulsing text when time is low
- Owner-only "Confirm Results" button
- Vote count badges animate on increment
- Skip Vote option (no-vote choice)
- Progress bar tracks time remaining

---

## Open Questions / Ambiguities

1. Can players change their vote before time runs out?
2. Is there a majority threshold or is it purely timer-based?
3. What happens on tie votes?
4. Does "Confirm Results" lock in the current tally or trigger a separate step?
5. Are dead players shown (dimmed) or hidden entirely?

---

## Dependencies

- `PhaseHeader`, `TimerDisplay`, `PlayerCard`, `Badge`, `AvatarCircle`, `PrimaryButton`, `SecondaryButton`
- Real-time voting state (Convex subscription)
- Vote mutation (Convex)
- Timer sync
- Theme tokens (purple variant)
- i18n strings

---

## Implementation Checklist

- [ ] Build header with inline timer and progress bar
- [ ] Build 2-col voting player grid
- [ ] Implement vote count badges with animation
- [ ] Implement stacked voter avatar row (with overflow count)
- [ ] Build selected/unselected card states
- [ ] Implement tap-to-vote interaction
- [ ] Build "Skip Vote" dashed button
- [ ] Conditionally render owner "Confirm Results" button
- [ ] Subscribe to real-time vote tallies
- [ ] Wire up vote mutation
- [ ] Handle timer expiry auto-confirm
- [ ] Add i18n for all text
