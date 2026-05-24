# Ototabi Interface System (Retro Analog v2)

## Elevation

| Level | Token / component           | Use                     |
| ----- | --------------------------- | ----------------------- |
| 0     | `--background`              | App canvas              |
| 1     | `--card` + `chassis-shadow` | Panels, AnalogCard      |
| 2     | `--popover`                 | Nested controls, inputs |
| 3     | Inset                       | AnalogInset, CRT wells  |

## Spacing

Base unit: 4px. Section rhythm: `py-20 md:py-28` (brand), `py-6 md:py-8` (product).

## Signature checklist

- Amber only on REC tally, primary CTA, focus rings
- CRT inset + scanlines on product previews
- Mono labels for technical strings; Source Sans 3 for paragraphs
- `SessionStatusRail` on studio and session review
- `SessionTimeline` for recording events

## Shells

- **Brand:** ProductShell + SiteHeader + SiteFooter
- **Product:** AppShell + PageHeader
