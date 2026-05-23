# Plan 12: UX Polish — Keyboard Shortcuts, Animations, Responsive

**Status:** pending  
**Priority:** P2

## Problem

The app functions but feels unpolished. Missing: keyboard shortcuts for power users, consistent animation patterns, mobile-responsive layout for studio sidebar, focus indicators for accessibility.

## Solution

### Keyboard Shortcuts

| Key      | Action                        |
| -------- | ----------------------------- |
| `R`      | Start / stop recording        |
| `M`      | Toggle microphone mute        |
| `V`      | Toggle video                  |
| `S`      | Toggle screen share           |
| `Space`  | Push-to-talk (hold to unmute) |
| `?`      | Show/hide shortcut overlay    |
| `Escape` | Close any modal               |

Implement via a `useKeyboardShortcuts` hook with `useEffect` + `keydown` listener. Show overlay via `dialog` with retro styling.

### Animations

- Dialog/modal enter: `scale(0.95) + opacity 0` → `scale(1) + opacity 1` (never `scale(0)`)
- Dialog/modal exit: reverse
- Toast enter: `translateY(8px) + opacity 0` → `translateY(0) + opacity 1`
- Use `--ease-mechanical` for UI transitions, `--ease-out` for dismissals
- All transitions: `duration-200` or `duration-300` only

### Responsive

- Studio sidebar: `hidden md:flex` → hamburger toggle on mobile (off-canvas slide from right)
- Recording controls: bottom sheet on mobile (`fixed bottom-0`)
- Dashboard: stack columns on mobile, side-by-side on desktop

### Focus Rings

Add to ALL interactive elements:

```
focus-visible:ring-2 focus-visible:ring-accent/60
focus-visible:ring-offset-2 focus-visible:ring-offset-background
```

### Tooltips

Add `@radix-ui/react-tooltip` for icon-only buttons. `delayDuration: 300`. Retro-styled content with noise texture.

## Files to Create

- `apps/client/lib/hooks/use-keyboard-shortcuts.ts`
- `apps/client/components/ui/keyboard-shortcuts-overlay.tsx`

## Files to Change

- `apps/client/app/chat/[roomId]/page.tsx` — shortcuts, responsive sidebar
- `apps/client/components/ui/retro-primitives.tsx` — add tooltip support to MechButton
- `packages/ui/src/styles/globals.css` — modal animation keyframes, focus ring utility

## Acceptance Criteria

- All shortcuts work in studio page
- `?` key shows overlay with all shortcuts listed
- Modals animate in/out smoothly (no jarring pop)
- Studio sidebar accessible on mobile via hamburger
- Tab navigation shows visible focus rings
- Icon-only buttons show tooltips on hover
