# Mycel Physarum Network

![Mycel Physarum Network hero: glowing teal and gold trails connect labeled freight hubs](../../docs/screenshots/mycel-physarum-network.jpg)

A home page for **Mycel**, a fictional logistics routing platform. The hero is a living slime mold simulation: tens of thousands of agents forage between freight hubs and grow the network you see, live, in the browser.

**Live demo:** [animatedwebs.com/demos/mycel-physarum-network](https://animatedwebs.com/demos/mycel-physarum-network/) · **Template page:** [animatedwebs.com/templates/mycel-physarum-network](https://animatedwebs.com/templates/mycel-physarum-network)

## Signature motion

- **A real Physarum model.** Each agent senses the trail ahead, left and right, turns toward the strongest scent, steps forward and deposits more trail. The trail map diffuses and decays every step. Hubs act as food sources, so efficient routes between them emerge and strengthen on their own.
- **On the GPU.** With WebGL2 and float render targets, agent positions live in a float texture (65,536 agents on desktop). Each frame runs three passes: agent update, additive point deposit, then diffuse and decay into a half float trail texture.
- **Lit like terrain.** The display pass turns the trail into a relief: normals from the trail gradient, a light that follows the pointer, a teal to gold color ramp, a soft bloom ring, pulsing hub glows, vignette and grain.
- **You can feed it.** Moving the pointer over the hero places food that pulls the network toward you. Clicking anchors a new hub (up to six), and the routes regrow around it.
- **A second, smaller colony** grows behind the closing call to action.
- **Starts grown.** Both simulations are prewarmed for 120 to 150 steps, so the first frame already shows a network instead of noise.

## Run it

No build step and no libraries.

```bash
cd templates/mycel-physarum-network
python -m http.server 8080
# then open http://localhost:8080
```

You can also open `index.html` directly in a browser.

## Make it your brand

| What | Where |
| --- | --- |
| Colors | `:root`: `--bg`, `--ink`, `--amber`, `--teal`. The simulation colors live in `ramp()` inside `GLSL_DISPLAY` (GPU) and the `stops` table in `Physarum.prototype.build` (Canvas 2D fallback). |
| Hubs | `NODES` and `NODES_M` (phone layout): `[x, y, weight]` in 0 to 1 screen space. `NAMES` sets the labels. |
| Network character | Sensor distance `uSD` (8), sensor angle `uSA` (0.55 rad), turn rate `uRT` (0.45), step size `uSS` (1), decay `uDec` (0.925) and diffusion `uMix` (0.3) in `GPUPhysarum.prototype.step`. Longer sensors give smoother, longer roads. Faster decay gives a leaner network. |
| Brightness | `this.gain` in `GPUPhysarum.prototype.build` (0.46). |
| Colony size | `AS` and `mobAS` (agent texture side) in the `makeSim()` calls. |
| Fonts | The Google Fonts `<link>` (Bricolage Grotesque, Instrument Sans, JetBrains Mono). |

## Performance and accessibility

- Simulations step only while on screen and pause when the tab is hidden. Phones run one step per frame instead of two, with a coarser grid and fewer agents.
- Software WebGL renderers are detected and get a coarser grid and a smaller colony.
- If WebGL2 or float render targets are missing, the page swaps in a Canvas 2D version of the same model built on typed arrays.
- A pause button in the nav (`aria-pressed`) holds both colonies in their current shape.
- `prefers-reduced-motion`: the network is prewarmed further, drawn once as a still image, and pointer feeding is off. The page opens paused, and the pause button can switch the simulation on.
- Skip link, visible focus rings, decorative canvases hidden from assistive tech, and a status region for the form.

## Tech

Vanilla HTML, CSS and JavaScript. Raw WebGL2 (GLSL ES 3.0, `EXT_color_buffer_float`) with a Canvas 2D fallback. Google Fonts.

## Credit and license

Made by [AnimatedWebs](https://animatedwebs.com), a product of [LIKE A KING INC.](https://likeakinginc.com) Free for personal and commercial websites, including client work, under the [AnimatedWebs Free Template License](../LICENSE.md). You may not resell or redistribute it as a template.
