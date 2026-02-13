# Component: BottomNavigation

> Persistent tab bar for main app navigation. Appears on home and lobby screens.

---

## Visual Design

- Container: `bg-surface-darker/95 backdrop-blur-xl border-t border-white/5`
- Safe area: `padding-bottom: env(safe-area-inset-bottom, 20px)`
- Position: Fixed bottom, full-width, z-50
- Layout: `flex justify-around items-center px-2 py-3`

### Tab Item

- Layout: `flex flex-col items-center justify-center w-16 gap-1`
- Icon container: `p-1.5 rounded-lg`
- Icon: `material-icons-round text-2xl`
- Label: `text-[10px] font-medium`

### Active State
- Icon container: `bg-primary/20`
- Icon color: `text-primary`
- Label color: `text-primary`

### Inactive State
- Icon container: transparent, `hover:bg-white/5`
- Icon color: `text-slate-400 group-hover:text-white`
- Label color: `text-slate-400 group-hover:text-white`

---

## Tabs

| Tab | Icon | Label |
|---|---|---|
| Home | `home` | "Home" / "Lobby" |
| Profile | `person` | "Profile" |
| Settings | `settings` | "Settings" |

---

## Screens Where Used

| Screen | Notes |
|---|---|
| Mafia Game Home Screen | Active: Home |
| Join/Create Room Lobby | Active: Lobby |
