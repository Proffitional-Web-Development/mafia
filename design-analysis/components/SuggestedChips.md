# Component: SuggestedChips

> Row of tappable suggestion pills for username or alias selection.

---

## Visual Design

- Container: `flex flex-wrap gap-2`
- Section label: `text-xs text-gray-500 uppercase tracking-wider font-bold` — "Available Aliases"
- Chip: `px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary/80`
- Hover: `hover:bg-primary hover:text-white`
- Transition: `transition-colors`

---

## Props

| Prop | Type | Description |
|---|---|---|
| `suggestions` | string[] | List of suggested names |
| `onSelect` | (name: string) => void | Selection handler |

---

## Screens Where Used

| Screen |
|---|
| Username Selection |
