# Ototabi Design System & AI Guidelines

## The Aesthetic: Retro Analog

Ototabi uses a distinct **Retro Analog** design language. It is inspired by vintage recording studio equipment, synthesizers, and mechanical interfaces, but applied with modern interaction design.

### Core Philosophy
- **Physicality**: Interfaces should feel tactile. Buttons press down, panels are inset, and chassis elements have depth.
- **Utilitarian Elegance**: Form follows function. Use monospace fonts for values/data and stark sans-serif for labels.
- **Lighting**: Elements don't just change color; they illuminate. Use inner shadows and glowing dropshadows to simulate LED behavior.

## Color Palette

### Light Mode
- **Background**: `#a8a396` (Neutral gray/brown)
- **Chassis**: `#d1ccbd` (Warm beige/cream)
- **Panel**: `#b5b0a1` (Vintage panel gray)
- **Text**: `#2c2b29` (Dark charcoal)

### Dark Mode
- **Background**: `#121212` (Near black)
- **Chassis**: `#222222` (Dark gray)
- **Panel**: `#1a1a1a` (Deep inset gray)
- **Text**: `#e0e0e0` (Off white)

### Accents (LEDs)
- **LED Off**: `#592420` (Dark red)
- **LED On**: `#ff4a3d` (Vibrant neon red/orange)
- **LED Glow**: `box-shadow: 0 0 10px var(--led-on), inset 0 2px 4px rgba(255,255,255,0.4)`

## Typography
- **Primary / Labels**: `Oswald` (Google Fonts). Used in all caps for structural elements and headings.
- **Values / Data / Screens**: `Courier Prime` (Google Fonts). Used for inputs, statuses, and digital screen displays.

## Emil's Design Engineering Principles

We strictly follow the interaction design principles of Emil Kowalski:

1. **Custom Easings**: Never use `ease-in` for UI. 
   - Mechanical/Physical interaction curve: `cubic-bezier(0.1, 0.9, 0.2, 1)` (snappy, solid stop).
2. **Tactile Buttons**: Buttons must shrink on press. Apply `active:translate-y-[2px]` and shadow compression to simulate physical resistance.
3. **Interruptible UI**: Use CSS transitions over keyframes for rapidly triggered UI states (like hovers and clicks) so they can be smoothly interrupted.
4. **No scale(0) Exits/Enters**: Elements should enter from `scale(0.95)` with `opacity: 0`, rather than popping from nothing.
5. **Blur over Crossfades**: If two states look jarring when crossfading, use a subtle `filter: blur(2px)` during the transition to bridge the visual gap.

## Rules for Code Generation
When generating or modifying UI components:
1. **Always use Shadcn structural components**, but heavily modify their Tailwind classes to match this analog theme.
2. **Screens**: Any `input`, `textarea`, or video container should resemble a recessed LCD screen (inset shadows, dark background).
3. **Containers**: Any main container (`Card`, `Dialog`) should look like a hardware chassis (metallic gradients, outer dropshadows, top highlight).
