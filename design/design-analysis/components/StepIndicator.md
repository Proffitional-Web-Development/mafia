# Component: StepIndicator

> Progress dots/bars for multi-step onboarding flows.

---

## Visual Design

### Bar Variant (Username Selection)
- Active bar: `w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(131,17,212,0.5)]`
- Inactive bar: `w-2 h-1 bg-primary/20 rounded-full`
- Layout: `flex space-x-2` centered

### Bar Variant (Avatar Selection)
- Active bar: `h-1 w-8 rounded-full bg-primary`
- Inactive bar: `h-1 w-8 rounded-full bg-primary/30`
- Layout: `flex items-center justify-center space-x-2`

---

## Props

| Prop | Type | Description |
|---|---|---|
| `totalSteps` | number | Total step count |
| `currentStep` | number | Active step (1-indexed) |

---

## Screens Where Used

| Screen | Position |
|---|---|
| Username Selection | Top, between back button and spacer |
| Avatar Selection | Top, centered below nav bar |
