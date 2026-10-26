# Keyline Command Palette Home

![Keyline Command Palette Home hero: a bold headline with a keycap word above a live command palette](../../docs/screenshots/keyline-command-palette-home.jpg)

A home page for **Keyline**, a fictional keyboard-first launcher. The product demo is the hero: a real command palette that types, filters, highlights and runs actions on its own, then hands control to the visitor the moment they press a key.

**Live demo:** [animatedwebs.com/demos/keyline-command-palette-home](https://animatedwebs.com/demos/keyline-command-palette-home/) · **Template page:** [animatedwebs.com/templates/keyline-command-palette-home](https://animatedwebs.com/templates/keyline-command-palette-home)

## Signature motion

- **Self-driving palette.** Four scenarios loop: type a query, render matching rows, slide a highlight pill down to the chosen row, flash its icon and pop a toast. The fourth scenario switches to an AI answer that writes itself line by line.
- **Visitor takeover.** `Cmd+K` or `Ctrl+K` focuses the input. Typing filters about forty actions, arrow keys move the highlight, `Enter` runs it, `Esc` leaves. The demo resumes three seconds after the input loses focus.
- **Keystroke ripples.** Every character the demo types sends a ripple out from the palette through the dot grid behind the hero (a Canvas 2D field of dots that swell as each ring passes).
- **A headline that types.** The word "keystroke" sits on a keycap that presses itself every three seconds.
- **Supporting moments.** Pillar icons draw their strokes on reveal, a 24 key shortcut wall presses on hover and shows what each chord does while random keys glow amber, and the extensions row drags to scroll with snap points.

## Run it

No build step and no JavaScript libraries.

```bash
cd templates/keyline-command-palette-home
python -m http.server 8080
# then open http://localhost:8080
```

You can also open `index.html` directly in a browser.

## Make it your brand

| What | Where |
| --- | --- |
| Colors | `:root`: `--bg`, `--fg`, `--blue` (primary), `--amber` (key glow). |
| Fonts | The Google Fonts `<link>` (Inter Tight, Inter, JetBrains Mono). |
| Palette scenarios | `SCENARIOS` (query, rows, which row to select, toast text) and `AI_LINES` in the script. |
| Searchable actions | `ALL_ACTIONS`: `[icon, label, category]` rows the visitor can filter. Icons map through `ICONS`. |
| Shortcut wall | `SHORTCUTS`: `[chord, action]` pairs. |
| Extensions | `EXT` and `COLORS`. The integration names are generic categories, so swap in the tools your product connects to. |
| Ripple feel | `GAP` (dot spacing, 22 px), ring radius `260` and lifetime `1400` ms in `drawGrid()`. |
| Typing rhythm | `typeText()`: 70 ms per character with a 190 ms beat every eighth key. |

## Performance and accessibility

- The dot grid redraws only while the tab is visible and motion is playing.
- A pause button in the nav (`aria-pressed`) stops the self-typing demo, the ripples, the headline keycap and the key wall.
- `prefers-reduced-motion`: the page opens paused, so the demo does not loop. The palette shows the first scenario with its first row selected, the keycap and shortcut wall stay still, and the dot grid draws once.
- The palette input is a real, labeled text field with keyboard support and a visible focus state, so the demo doubles as a working prototype.

## Tech

Vanilla HTML, CSS and JavaScript with Canvas 2D. Google Fonts. No frameworks, no WebGL.

## Credit and license

Made by [AnimatedWebs](https://animatedwebs.com), a product of [LIKE A KING INC.](https://likeakinginc.com) Free for personal and commercial websites, including client work, under the [AnimatedWebs Free Template License](../LICENSE.md). You may not resell or redistribute it as a template.
