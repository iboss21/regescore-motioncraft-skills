# Starlane Synthwave Terrain

![Starlane Synthwave Terrain hero: a neon wireframe road runs toward a striped sunset sun](../../docs/screenshots/starlane-synthwave-terrain.jpg)

A launch page for a fictional indie racing game, **NIGHTLINE** by Starlane Arcade. The hero is a live three.js synthwave world: a wireframe valley that scrolls toward a banded sun, finished with bloom and a CRT screen pass.

**Live demo:** [animatedwebs.com/demos/starlane-synthwave-terrain](https://animatedwebs.com/demos/starlane-synthwave-terrain/) · **Template page:** [animatedwebs.com/templates/starlane-synthwave-terrain](https://animatedwebs.com/templates/starlane-synthwave-terrain)

## Signature motion

- **Endless wireframe terrain.** A 160 unit plane is displaced in the vertex shader with fractal noise. The road corridor stays flat and the hills rise only past the shoulders. Grid lines are drawn in the fragment shader with `fwidth`, so they stay crisp at any distance, and shift from pink to cyan as they recede into fog.
- **Scroll is the throttle.** Scroll velocity feeds the travel speed (eased, capped), and the HUD speedometer reads it back in mph.
- **Banded sun and twinkling stars.** The sun is a single shader plane with animated horizontal cut bands. Stars are 1,200 points with per-star twinkle.
- **CRT finish.** UnrealBloom, then a custom pass for barrel distortion, a one-pixel chromatic split, scanlines, vignette and a small random brightness flicker.
- **Camera with intent.** A slow seven second sway, pointer parallax on desktop, and a rise plus a 20 degree tilt down onto the grid as the closing Wishlist section scrolls in.
- **Supporting moments.** A play button that runs an in-frame canvas road "trailer", car stat bars that fill cell by cell on reveal, a press marquee that pauses on hover, and Web Audio synth previews that only start when the visitor presses play (or the `M` key).

## Run it

No build step. The page loads three.js 0.170 from a CDN through an import map.

```bash
cd templates/starlane-synthwave-terrain
python -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly also works in current Chrome, Edge, Firefox and Safari. A static server is the safer path if your browser blocks module scripts on `file://`.

## Make it your brand

| What | Where |
| --- | --- |
| Colors | `:root` at the top of the `<style>` block: `--bg`, `--fg`, `--pink`, `--cyan`, `--sun`. The shaders use matching values in `lc`, `fill`, the sun gradient and the sky dome, so change those too for a full palette swap. |
| Fonts | The Google Fonts `<link>` (Tektur and Chakra Petch). |
| Copy and content | The `cars`, `tracks` and `quotes` arrays at the top of the module script, plus the section text in the HTML. |
| Terrain shape | `heightAt()` in the `noise` string: the `smoothstep(6., 18., ax)` mask sets road width, the final `* 9.` sets hill height. |
| Speed | `12 + vel * 0.02` (cruise speed and scroll gain) and the cap of `30` inside `frame()`. |
| Glow | `UnrealBloomPass` strength (`0.75` desktop, `0.6` mobile) and `uBarrel` for screen curvature. |
| Fog | `uFogNear` and `uFogFar` in the shared uniforms. |

## Performance and accessibility

- Renders only while the hero or the Wishlist section is on screen, and stops when the tab is hidden.
- Pixel ratio is capped (1.75 desktop, 1.5 phone). Phones get half the terrain segments, half resolution bloom, a wider lens and no barrel distortion.
- A pause button in the nav (`aria-pressed`) freezes the scene clock: road, sun bands, star twinkle, sway, flicker, marquee and CSS loops. While paused, the scene renders one frame per scroll, so the closing tilt still follows the visitor.
- `prefers-reduced-motion`: the page opens paused, CSS animations are disabled and reveals show immediately. The pause button can switch motion back on.
- Audio never autoplays. Track preview buttons expose `aria-pressed`.
- If WebGL is unavailable the canvas falls back to a CSS gradient and the page still reads correctly.

## Tech

Vanilla HTML, CSS and JavaScript. [three.js](https://threejs.org) 0.170 (core plus `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `ShaderPass`) through an import map. Google Fonts. Nothing else.

## Credit and license

Made by [AnimatedWebs](https://animatedwebs.com), a product of [LIKE A KING INC.](https://likeakinginc.com) Free for personal and commercial websites, including client work, under the [AnimatedWebs Free Template License](../LICENSE.md). You may not resell or redistribute it as a template.
