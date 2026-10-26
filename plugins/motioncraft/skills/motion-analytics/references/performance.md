# Performance for motion pages

A motion page has two budgets: **time per frame** and **bytes per page**. Both are spent by the same choices (pixel ratio, passes, textures, video), so measure both and trade between them on purpose.

## 1. Frame-time budget

| Display | Frame interval | Usable work budget |
|---|---|---|
| 60 Hz | 16.7 ms | about 12 ms, leaving room for the browser, compositor and GC |
| 120 Hz | 8.3 ms | about 6 ms, or cap your scene to 60 fps on purpose |
| 30 fps fallback | 33.3 ms | only for tier 1 scenes on weak phones |

Rules:

- **Judge p95, not the mean.** p95 is the frame you notice. A p50 of 8 ms with a p95 of 35 ms is a stuttering page.
- **Measure intervals and work separately.** The interval between `requestAnimationFrame` callbacks shows missed frames. The busy time inside your callback shows how much headroom you have. On a 60 Hz screen a healthy interval is always about 16.7 ms, so headroom can only be read from busy time.
- **Long frames are bugs.** A frame over 50 ms during scroll is almost always a one-off cost: a shader compile, a texture upload, a layout read, a big allocation. Find it and move it to the loader or to idle time.

Use [../scripts/frame-meter.js](../scripts/frame-meter.js) to read p50, p95, long frames and a tier suggestion on any page.

## 2. The rolling quality ladder

Every scene ships with tiers that tell the same story at different costs:

| Tier | Name | Typical content |
|---|---|---|
| 3 | Full | Full scene, post effects, DPR up to 2 |
| 2 | Reduced | DPR 1.25, post at half resolution, fewer particles |
| 1 | Minimal | DPR 1, no post, simplified shaders, 30 fps cap allowed |
| 0 | Static | A designed still frame, no render loop |

The ladder watches a rolling window of recent frames and moves one tier at a time:

- **Down** when the p95 interval is above **22 ms** (the page is missing frames regularly).
- **Up** when the page holds the display refresh **and** the p95 busy time is below **12 ms**, sustained for 5 seconds.
- **Cooldown** of 2.5 seconds after any change, so one tier is judged on its own frames.
- **Ceiling:** if a tier fails twice, the ladder never climbs back into it this session. This stops oscillation.
- **Ignore gaps** over 250 ms (hidden tab, debugger, tab switch).

Working snippet (ES module, no dependencies):

```js
// quality-ladder.js
export class QualityLadder {
  constructor({ tiers = 4, start = tiers - 1, size = 90, down = 22, up = 12, cooldown = 2500, upHold = 5000, onChange = () => {} } = {}) {
    Object.assign(this, { tiers, tier: start, down, up, cooldown, upHold, onChange });
    this.ceiling = tiers - 1;
    this.drops = new Array(tiers).fill(0);
    this.gaps = new Float32Array(size);   // interval between frames, ms
    this.busy = new Float32Array(size);   // work inside the frame callback, ms
    this.n = 0; this.i = 0; this.prev = 0; this.t0 = 0; this.changedAt = -Infinity; this.goodSince = 0; this.evalAt = 0;
  }
  begin(now = performance.now()) {
    this.gap = this.prev ? now - this.prev : 0;
    this.prev = this.t0 = now;
  }
  end(now = performance.now()) {
    const gap = this.gap;
    if (gap <= 0 || gap > 250) return this.tier;   // first frame, or the tab was hidden
    const k = this.i++ % this.gaps.length;
    this.gaps[k] = gap; this.busy[k] = now - this.t0;
    this.n = Math.min(this.n + 1, this.gaps.length);
    if (this.n < this.gaps.length / 2 || now - this.changedAt < this.cooldown || now - this.evalAt < 500) return this.tier;
    this.evalAt = now;
    const gap95 = pct(this.gaps, this.n, 0.95), busy95 = pct(this.busy, this.n, 0.95);
    const refresh = displayInterval(pct(this.gaps, this.n, 0.1));
    if (gap95 > this.down && this.tier > 0) {
      if (++this.drops[this.tier] >= 2) this.ceiling = Math.min(this.ceiling, this.tier - 1);
      this.set(this.tier - 1, now, gap95);
    } else if (gap95 <= refresh * 1.15 && busy95 < this.up && this.tier < this.ceiling) {
      this.goodSince ||= now;
      if (now - this.goodSince >= this.upHold) this.set(this.tier + 1, now, gap95);
    } else this.goodSince = 0;
    return this.tier;
  }
  set(tier, now, p95) {
    this.tier = tier; this.changedAt = now; this.goodSince = 0; this.n = 0; this.i = 0;
    this.onChange(tier, p95);
  }
}
// The fastest tenth of frames sits at the display interval; snap it to a real refresh rate
// (144, 120, 90, 75, 60 Hz) so a page that misses every frame is not mistaken for a slow display.
function displayInterval(fast) {
  return [6.94, 8.33, 11.11, 13.33, 16.67].filter((ms) => ms <= fast * 1.05).pop() ?? 6.94;
}
function pct(buf, n, q) {
  const a = Array.from(buf.subarray(0, n)).sort((x, y) => x - y);
  return a[Math.min(n - 1, Math.floor(n * q))];
}
```

Wiring it to a three.js scene:

```js
import { QualityLadder } from "./quality-ladder.js";

const phone = matchMedia("(max-width: 760px)").matches;
const ladder = new QualityLadder({ start: phone ? 2 : 3, onChange: applyTier });

function applyTier(tier) {
  if (tier === 0) { renderer.setAnimationLoop(null); document.body.classList.add("static"); return; }
  const dprCap = [1, 1, 1.25, phone ? 1.5 : 2][tier];
  renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap));
  composer.setPixelRatio(Math.min(devicePixelRatio, dprCap));
  bloomPass.enabled = tier >= 2;
  particles.geometry.setDrawRange(0, [0, 3000, 12000, 40000][tier]);
}
applyTier(ladder.tier);

renderer.setAnimationLoop((now) => {
  ladder.begin(now);
  update(now);
  composer.render();
  ladder.end();
});
```

Notes:

- **Start on a guess, then let the ladder correct it.** Phones start at tier 2, desktops at tier 3. A GPU name check (`WEBGL_debug_renderer_info`) can pick a lower start for known weak GPUs, but frames are the truth.
- **Tier 0 is a destination.** Once static, stay static. Show a designed frame, not a frozen mid-motion render.
- **Same story on every tier.** Lower tiers remove cost, never content. Every section still says what it says.
- **Add `?tier=N` for QA.** Force a tier from the URL so you can screenshot and review every tier.

## 3. Device pixel ratio caps

Fill rate grows with the square of DPR. A DPR 3 phone renders 9 times the pixels of DPR 1.

| Target | Cap |
|---|---|
| Desktop main scene | 1.5 to 2 |
| Phone main scene | 1.25 to 1.5 |
| Bloom, blur, depth of field | half resolution |
| Fluid, smoke, cursor trails | quarter resolution or lower (7.5 to 25 percent still reads well) |
| Raymarched volumes | small render target, capped steps, upsampled |

Set the cap with `renderer.setPixelRatio(Math.min(devicePixelRatio, cap))` and re-apply it on resize. Text and UI stay in the DOM at full sharpness, so a lower canvas DPR rarely shows.

## 4. Stop work nobody sees

```js
// Pause when the tab is hidden.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) renderer.setAnimationLoop(null);
  else renderer.setAnimationLoop(loop);
});

// Pause when the canvas is scrolled out of view.
new IntersectionObserver(([e]) => {
  renderer.setAnimationLoop(e.isIntersecting && !document.hidden ? loop : null);
}).observe(renderer.domElement);
```

Also pause video elements that are off screen, stop idle animations when the visitor pauses motion, and drop to on-demand rendering (render only on input or scroll) for scenes that are still.

## 5. Texture and GPU memory budget

An uncompressed RGBA texture costs `width x height x 4` bytes in GPU memory, plus about a third more with mipmaps. A 2048 by 2048 texture is about 16 MB, or about 21 MB with mips, no matter how small the file was.

| Rule | Why |
|---|---|
| Keep total texture memory under about 128 MB on phones, 256 MB on desktop | Above this, mobile browsers lose the context or the tab reloads |
| Use KTX2 (Basis) for large photographic textures | Stays compressed in GPU memory, often 4 to 8 times smaller there |
| Keep line art and UI in WebP or PNG | Block compression can smear thin lines; test before converting |
| Size textures for the screen they appear on | A 4096 texture behind a 400 px card is waste |
| Upload before the moment it is needed | `renderer.initTexture(tex)` during the loader or idle time avoids mid-scroll hitches |
| Compile shaders in the loader | `await renderer.compileAsync(scene, camera)` (three.js r158 and newer) removes first-view stalls |
| Dispose what leaves | `texture.dispose()`, `geometry.dispose()`, `material.dispose()` when a section is gone for good |

## 6. Page-weight budget

| Asset | Budget | Notes |
|---|---|---|
| First screen total | under 3 MB | A composed still or poster appears first |
| Whole page | under 10 MB | Everything a visitor downloads on a full scroll |
| Hero video | 1.5 to 4 MB desktop, 0.8 to 2 MB phone | Separate encodes per size, short GOP if scrubbed |
| Frame sequences | WebP, 10 frames first, rest queued in scroll direction | Separate desktop and phone sets |
| 3D models | under 2 MB each | Draco or meshopt geometry, KTX2 textures |
| Fonts | 2 families, 2 to 4 files, WOFF2 | Subset when you can |
| JavaScript | under 300 KB compressed for the motion layer | three.js core is about 170 KB compressed; import only what you use |

Load in this order: HTML and critical CSS, poster or still, fonts used above the fold, the scene code, then heavy assets in the order the visitor will reach them.

## 7. Web Vitals for motion sites

| Vital | Target | Motion-site pitfall | Fix |
|---|---|---|---|
| LCP | under 2.5 s | The largest element is a canvas or a video that paints late | Put a real `<img>` poster in the hero; fade the canvas in over it |
| CLS | under 0.1 | Canvas, video or font swap pushes content | Reserve boxes with `aspect-ratio` or fixed heights; match fallback font metrics |
| INP | under 200 ms | A heavy render loop or a long setup task blocks input | Split setup into chunks, yield with `await new Promise(requestAnimationFrame)`, keep per-frame JS small |
| TBT (lab) | under 200 ms | Parsing and compiling a big bundle on load | Lazy-load the scene module after first paint |

Measure in the field when you can. The `web-vitals` library reports real visitors; lab tools report your machine.

## 8. Fix table

| Symptom | Likely cause | First fix |
|---|---|---|
| Smooth on desktop, stutters on phone | DPR 3 fill rate, full-res post | DPR cap 1.5, post at half resolution |
| One hitch when a section appears | Texture upload or shader compile | `initTexture` and `compileAsync` in the loader |
| Gets worse over minutes | Leaks: undisposed targets, growing arrays | Dispose on teardown, reuse vectors, watch `renderer.info.memory` |
| Fans spin while the page is idle | Rendering every frame for a still scene | On-demand rendering, pause when hidden or off screen |
| Scroll feels late | Scroll read in a separate loop, or eased twice | One clock: read scroll in the render loop, ease once |
| Video scrub stutters | Long GOP | Re-encode with a short keyframe interval (for example `-g 12`) or use a frame sequence |
| Page jumps on load | Unreserved media boxes, font swap | `aspect-ratio`, `size-adjust` on fallback fonts |
