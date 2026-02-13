# Component: Divider

> Visual separator between sections, often with centered text.

---

## Visual Variants

### 1. Text Divider ("OR")
```html
<div class="relative my-6">
  <div class="absolute inset-0 flex items-center">
    <div class="w-full border-t border-gray-700"></div>
  </div>
  <div class="relative flex justify-center text-xs">
    <span class="px-2 bg-background-dark text-gray-500">OR</span>
  </div>
</div>
```

### 2. Gradient Text Divider ("OR JOIN")
- Left/right gradient lines: `bg-gradient-to-r from-transparent to-white/10`
- Text: `text-xs uppercase tracking-widest text-white/30 font-bold`
- Gap: `gap-4`

### 3. Simple Gradient Line
- Single: `w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto`
- Used as decorative accent under titles

### 4. Content Divider
- Full width: `h-px bg-gradient-to-r from-transparent via-white/10 to-transparent`
- Spacing: within cards

---

## Screens Where Used

| Screen | Variant |
|---|---|
| Login | text ("OR") |
| Join/Create Lobby | gradient text ("OR JOIN") |
| Home Screen | decorative line |
| Role Reveal Card | gradient line (inside card) |
