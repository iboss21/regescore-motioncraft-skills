# Aurel Liquid Chrome Audio

![Aurel Liquid Chrome Audio hero: polished chrome blobs float beside a serif headline](../../docs/screenshots/aurel-liquid-chrome-audio.jpg)

A product page for **Aurel Model 01**, fictional wireless headphones "cast in liquid chrome". The hero is a raymarched pool of mercury that follows the cursor, splashes on click and pours itself together as you scroll.

**Live demo:** [animatedwebs.com/demos/aurel-liquid-chrome-audio](https://animatedwebs.com/demos/aurel-liquid-chrome-audio/) · **Template page:** [animatedwebs.com/templates/aurel-liquid-chrome-audio](https://animatedwebs.com/templates/aurel-liquid-chrome-audio)

## Signature motion

- **Raymarched metaballs.** Six spheres are blended with a smooth minimum into one liquid surface, with a small animated ripple on top. It is a single fullscreen triangle and one fragment shader on raw WebGL2.
- **A studio you never see.** Reflections come from a procedural environment: soft window boxes, a bright top light, warm and cool strip lights, a hard horizon and a reflective floor. The reflection is sampled three times with slightly bent normals for a subtle chromatic edge, then gets Fresnel, ambient occlusion, a specular kiss, filmic tone mapping and fine grain.
- **The metal follows you.** One blob chases the pointer and two others lean toward it. With no pointer the group drifts on its own path. Clicking the hero "kicks" the blobs apart and they settle back in about a second.
- **Scroll pours it together.** As the hero scrolls away the outer blobs collapse into the center one, which grows to absorb them.
- **Supporting moments.** The headline rises word by word, stats count up when they enter, and sections reveal with a long, soft ease.

## Run it

No build step and no libraries.

```bash
cd templates/aurel-liquid-chrome-audio
python -m http.server 8080
# then open http://localhost:8080
```

You can also open `index.html` directly in a browser.

## Make it your brand

| What | Where |
| --- | --- |
| Colors | `:root`: `--bg`, `--ink`, `--mute`, `--accent` (champagne gold), `--glass`. |
| Metal tint | `tint` in the fragment shader mixes a cool silver with a warm gold by Fresnel. Push it toward copper, rose or blue steel. |
| Studio lighting | `env()` in the shader: each softbox and strip light is one line with its own color and strength. |
| Blob shapes | `R` (six radii) and the orbit math in `simulate()`. The `.85` in `smin` sets how eagerly the blobs merge. |
| Placement | `center` in `simulate()` shifts the metal to the right on desktop so the copy has room. |
| Fonts | The Google Fonts `<link>` (Instrument Serif, Hanken Grotesk, JetBrains Mono). |
| Copy | All text is in the HTML. Stats use `data-count` for the count-up. |

## Performance and accessibility

- Adaptive resolution: every 30 frames the page measures frame time and scales the render buffer between 42 and 100 percent (60 percent cap on phones). Ray steps drop from 60 to 34 on phones.
- The loop stops when the hero leaves the viewport or the tab is hidden.
- A pause button in the nav (`aria-pressed`) stops the metal and the hint loop. While paused, the pour still follows the scroll, one frame per scroll event.
- `prefers-reduced-motion`: the page opens paused on a composed still frame, reveals show immediately and counters jump to their final values. The pause button can switch motion back on.
- Skip link, visible focus rings, a labeled email field and a polite live region for the form message.
- Without WebGL2 the hero falls back to a CSS radial gradient.

## Tech

Vanilla HTML, CSS and JavaScript. Raw WebGL2 with one GLSL ES 3.0 fragment shader. Google Fonts.

## Credit and license

Made by [AnimatedWebs](https://animatedwebs.com), a product of [LIKE A KING INC.](https://likeakinginc.com) Free for personal and commercial websites, including client work, under the [AnimatedWebs Free Template License](../LICENSE.md). You may not resell or redistribute it as a template.
