# Interaction and access

Recipes R22 to R26. Award juries score animation highest and accessibility lowest, so a site that does both well stands out. These recipes are the controls and safeguards every motion page needs: a real pause control, anchor links that glide without breaking anything, a hold gesture that cancels cleanly, a drag-to-look view that works by keyboard, and a quality ladder that keeps the story intact on weak hardware.

---

## R22. Pause-motion control

**What it is.** A visible, fixed, keyboard-reachable toggle button that stops every continuous motion on the page: idle sway, camera drift, light chases, grain, video loops and film clocks. Scroll-driven changes keep working, because the visitor drives them. Sound keeps its own control.

**When to use.** Always, on any page with motion that runs longer than 5 seconds (rule 27). It also helps everyone who wants to read without movement in the corner of their eye.

**Premium values.** At least 44 x 44 px, fixed to a corner with a 16 px gutter, never covered by the cookie bar or chat bubble. One stable accessible name ("Pause motion") with `aria-pressed` carrying the state, and an icon that swaps between pause bars and a play triangle. Start pressed when the OS asks for reduced motion, so a visitor who wants motion can still opt in.

```html
<button class="pause" id="pause" type="button" aria-pressed="false">
  <svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zM9 3h3v10H9z"/></svg>
  <svg class="i-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z"/></svg>
  <span class="lbl">Pause motion</span>
</button>
```

```css
.pause { position: fixed; right: 16px; bottom: 16px; z-index: 30; display: inline-flex; align-items: center; gap: 8px;
  min-width: 44px; min-height: 44px; padding: 0 14px; border-radius: 999px; font: 600 13px/1 system-ui, sans-serif; }
.pause svg { width: 16px; height: 16px; fill: currentColor; }
.pause .i-play, .pause[aria-pressed="true"] .i-pause { display: none; }
.pause[aria-pressed="true"] .i-play { display: block; }
.pause:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
.still *, .still *::before, .still *::after { animation-play-state: paused !important; }
```

```js
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const btn = document.getElementById("pause");
const listeners = new Set();
let paused = reduce.matches;
export const isPaused = () => paused;
export function onPauseChange(fn) { listeners.add(fn); fn(paused); }
export function setPaused(p) {
  paused = p;
  btn.setAttribute("aria-pressed", String(p));
  document.documentElement.classList.toggle("still", p);
  listeners.forEach((fn) => fn(p));
}
btn.addEventListener("click", () => setPaused(!paused));
reduce.addEventListener("change", () => setPaused(reduce.matches));
setPaused(paused);
```

Every system subscribes: the render loop zeroes idle drift and look, loops call `film.pause()`, film clocks switch off so all copy shows (R15). While paused, render one frame on each `scroll` event so the scene still follows the visitor.

**Phone.** Same corner, same size. Keep it clear of the browser's bottom bar with `bottom: max(16px, env(safe-area-inset-bottom))`.

**Reduced motion.** Starts pressed. The page shows its still versions.

**Cost.** Free. The cost of leaving it out is failing an accessibility review.

---

## R23. JS-only smooth scrolling for anchor links

**What it is.** Smooth scrolling applied only to in-page link clicks, in script, instead of `html { scroll-behavior: smooth }`. The CSS rule also slows every scripted jump (capture hooks such as `?shot=3`, focus restores, scroll position restore after reload) and has to be remembered in a reduced-motion query.

**When to use.** Every motion page with in-page navigation.

**Premium values.** Native `scrollIntoView` smoothing, which the browser tunes per device. `scroll-margin-top` on sections equal to the fixed header height. Move focus to the target so keyboard and screen reader users land where they jumped.

```js
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]:not([href="#"])');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const el = document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
  history.pushState(null, "", a.getAttribute("href"));
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1"); // focusable without joining the tab order
  el.focus({ preventScroll: true });
});
```

```css
.shot { scroll-margin-top: 72px; }
.shot:focus { outline: none; } /* sections receive focus from script, not from Tab */
```

The delegated listener also covers links added later. If the visitor has paused motion (R22), pass `"auto"` as well.

**Phone.** Same.

**Reduced motion.** Instant jumps.

**Cost.** Free.

---

## R24. Hold-to-trigger gate

**What it is.** A button that must be held for about a second to fire: hold to drop the batch, hold to weld, hold to imagine 2040. Progress shows from the first frame, a color snaps at 200 ms to confirm the hold registered, and releasing early cancels with no side effects.

**When to use.** A climactic action in the customer's own verb, once per page at most. Not for routine actions like opening a menu.

**Premium values.** 0.6 to 1.4 seconds (rule 13), 1.0 is a good default. A linear fill driven by a `--hold` variable. A 10 ms vibration on completion where supported. If the hold drives a heavy effect, lower the renderer's pixel ratio during the hold.

```html
<button class="hold" id="drop" type="button" aria-describedby="dropHint">Hold to drop the batch</button>
<p id="dropHint" class="hint">Press and hold for one second. Release to cancel.</p>
```

```css
.hold { --hold: 0; min-height: 48px; padding: 0 22px; border-radius: 999px; border: 2px solid var(--accent);
  background: linear-gradient(90deg, var(--accent) calc(var(--hold) * 100%), transparent 0); touch-action: none; user-select: none; }
.hold.armed { color: var(--on-accent); }
```

```js
export function holdGate(button, { seconds = 1, onDone, onProgress } = {}) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let start = 0, raf = 0, done = false;
  const show = (k) => {
    button.style.setProperty("--hold", k.toFixed(3));
    button.classList.toggle("armed", k * seconds >= 0.2); // the color snap that says "it is working"
    onProgress?.(k);
  };
  function frame(now) {
    const k = Math.min(1, (now - start) / (seconds * 1000));
    show(k);
    if (k >= 1) finish(); else raf = requestAnimationFrame(frame);
  }
  function begin(e) {
    if (done || raf) return;
    if (e.type === "pointerdown" && e.button !== 0) return;
    if (e.type === "keydown" && (e.repeat || (e.key !== " " && e.key !== "Enter"))) return;
    e.preventDefault();
    if (reduce.matches) { finish(); return; } // no hold needed when motion is reduced
    if (e.pointerId !== undefined) button.setPointerCapture(e.pointerId);
    start = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function cancel() {
    if (done || !raf) return;
    cancelAnimationFrame(raf); raf = 0;
    show(0);
  }
  function finish() {
    cancelAnimationFrame(raf); raf = 0; done = true;
    show(1);
    navigator.vibrate?.(10);
    onDone?.();
  }
  button.addEventListener("pointerdown", begin);
  button.addEventListener("pointerup", cancel);
  button.addEventListener("pointercancel", cancel);
  button.addEventListener("lostpointercapture", cancel);
  button.addEventListener("keydown", begin);
  button.addEventListener("keyup", cancel);
  return { reset() { done = false; show(0); } };
}
```

Offer a plain path to the same result nearby (a regular submit, a link), since some visitors cannot hold a press.

**Phone.** `touch-action: none` on the button so the hold does not scroll the page. Target at least 48 px tall.

**Reduced motion.** A single press completes it, with no pour or shatter animation.

**Cost.** One short rAF loop during the hold.

---

## R25. Drag-to-look room with idle pan

**What it is.** A wide room photo inside a frame that the visitor drags (or arrow-keys) to look around, with a small floor plan whose view cone turns to match. After 2 seconds without input it pans slowly on its own and turns around at the walls, so the section is alive in screenshots and for visitors who never touch it.

**When to use.** Real estate, hotels, venues, galleries, studios, restaurants. Cheaper and more honest than a fake 3D walkthrough.

**Premium values.** Photo about 2.4 times wider than tall. Idle pan at 0.035 of the width per second, turning at 3 and 97 percent. Cone rotation of 110 degrees across the full drag. Arrow keys step 8 percent. Room change crossfade 200 ms.

```js
export function lookAround(view, pano, { cone, at = [0, 0], span = 110 } = {}) {
  const img = new Image();
  let off = 0.5, dragX = null, startOff = 0, idle = 0, dir = 1, last = 0, onScreen = false, paused = false;
  function render() {
    const ratio = img.naturalWidth ? img.naturalWidth / img.naturalHeight : 2.4;
    const room = Math.max(0, view.clientHeight * ratio - view.clientWidth);
    pano.style.backgroundPosition = `${(-room * off).toFixed(1)}px 0`;
    cone?.setAttribute("transform", `translate(${at[0]} ${at[1]}) rotate(${((off - 0.5) * span - 90).toFixed(1)})`);
    view.setAttribute("aria-valuenow", String(Math.round(off * 100)));
  }
  const set = (v) => { off = Math.min(1, Math.max(0, v)); idle = 0; render(); };
  view.addEventListener("pointerdown", (e) => { dragX = e.clientX; startOff = off; view.setPointerCapture(e.pointerId); });
  view.addEventListener("pointermove", (e) => { if (dragX !== null) set(startOff - (e.clientX - dragX) / view.clientWidth); });
  const end = () => { dragX = null; };
  view.addEventListener("pointerup", end);
  view.addEventListener("pointercancel", end);
  view.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); set(off + (e.key === "ArrowRight" ? 0.08 : -0.08)); }
  });
  function drift(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!paused && dragX === null && (idle += dt) > 2) {
      off += dir * 0.035 * dt;
      if (off > 0.97) { off = 0.97; dir = -1; } else if (off < 0.03) { off = 0.03; dir = 1; }
      render();
    }
    if (onScreen) requestAnimationFrame(drift); else last = 0;
  }
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) requestAnimationFrame(drift); }).observe(view);
  addEventListener("resize", render);
  return {
    load(src, label) {
      img.onload = render;
      img.src = src;
      pano.style.backgroundImage = `url("${src}")`;
      view.setAttribute("aria-label", label);
      set(0.5);
    },
    setPaused(p) { paused = p; },
  };
}
```

```html
<div class="view" id="view" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"
     aria-label="Living room, look around"><div class="pano" id="pano"></div></div>
```

```css
.view { position: relative; overflow: hidden; aspect-ratio: 16 / 9; cursor: grab; touch-action: pan-y; }
.view:active { cursor: grabbing; }
.pano { position: absolute; inset: 0; background-size: auto 100%; background-repeat: no-repeat; }
```

`touch-action: pan-y` lets a vertical swipe still scroll the page while a sideways drag looks around.

**Phone.** Same behavior. Make the frame taller (4 / 5) so more of the room shows.

**Reduced motion.** No idle pan. Drag and keys still work.

**Cost.** One background-position write per frame while visible. Room photos at 2400 to 3000 px wide, about 300 to 500 KB each as WebP.

---

## R26. Quality ladder and loop hygiene

**What it is.** A governor that picks a starting tier from the device, watches real frame timings, and steps quality down or up while keeping the same story on every tier (rule 29). Plus the loop rules every page needs: clamp `dt`, stop when hidden or off screen, cap phones at 30 fps when the scene is heavy, and survive a lost WebGL context.

**When to use.** Every WebGL page.

**Premium values.** Tiers: 0 static (no canvas), 1 minimal, 2 reduced, 3 full. Sample about 120 frames, decide every 2 seconds. Step down when the 95th percentile frame interval is above 22 ms. Step up only after three straight windows where the 95th percentile work time is under 12 ms (the interval cannot drop below the display's refresh, so measure the work inside the frame for this). Software renderers and Save-Data start at tier 1, phones at 2, desktops at 3.

```js
export const TIERS = [
  null,                                  // 0: static page, no canvas
  { dpr: 1, bloom: false, count: 0.35 }, // 1: minimal
  { dpr: 1.25, bloom: true, count: 0.6 }, // 2: reduced
  { dpr: 1.75, bloom: true, count: 1 },   // 3: full
];
export function startTier(gl) {
  if (!gl) return 0;
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
  if (/SwiftShader|llvmpipe|Software|Basic Render/i.test(name) || navigator.connection?.saveData) return 1;
  return matchMedia("(pointer: coarse)").matches || innerWidth < 760 ? 2 : 3;
}
export function createGovernor(initial, apply) {
  const SIZE = 120, iv = new Float32Array(SIZE), wk = new Float32Array(SIZE);
  let tier = initial, i = 0, n = 0, good = 0, lastCheck = 0;
  const set = (t) => { tier = t; i = n = good = 0; apply(TIERS[t], t); };
  const p95 = (b) => Array.from(b.subarray(0, n)).sort((x, y) => x - y)[Math.min(n - 1, Math.floor(n * 0.95))];
  set(initial);
  return {
    get tier() { return tier; },
    sample(intervalMs, workMs, now) {
      iv[i] = intervalMs; wk[i] = workMs; i = (i + 1) % SIZE; n = Math.min(SIZE, n + 1);
      if (n < 60 || now - lastCheck < 2000) return;
      lastCheck = now;
      if (p95(iv) > 22 && tier > 1) set(tier - 1);
      else if (p95(wk) < 12 && tier < 3) { if (++good >= 3) set(tier + 1); }
      else good = 0;
    },
  };
}
```

```js
// the loop: dt clamp, optional 30 fps cap, stop when hidden or off screen, feed the governor
export function runLoop(frame, { canvas, governor, capFps = 0 } = {}) {
  let raf = 0, last = 0, acc = 0, visible = !document.hidden, onScreen = true;
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const interval = last ? now - last : 16.7;
    last = now;
    acc += Math.min(0.05, interval / 1000);
    if (capFps && acc < 1 / capFps - 0.002) return;
    const dt = Math.min(0.05, acc);
    acc = 0;
    const t0 = performance.now();
    frame(dt, now);
    governor?.sample(interval, performance.now() - t0, now);
  }
  const sync = () => {
    cancelAnimationFrame(raf); raf = 0; last = 0; acc = 0;
    if (visible && onScreen) raf = requestAnimationFrame(tick);
  };
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; sync(); });
  if (canvas) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(canvas);
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      cancelAnimationFrame(raf); raf = 0;
      document.body.classList.add("no-gl"); // the DOM fallback takes over
    });
  }
  sync();
}
```

`apply` is where the tier becomes real: `renderer.setPixelRatio(Math.min(devicePixelRatio, cfg.dpr))`, `bloomPass.enabled = cfg.bloom`, `points.geometry.setDrawRange(0, Math.floor(total * cfg.count))`. Never change the camera, copy or beats between tiers.

**Phone.** Start at tier 2 and pass `capFps: 30` for scenes with post-processing or depth stages.

**Reduced motion.** The governor still runs, but there is little to render: one frame per scroll event.

**Cost.** A sort of 120 numbers every 2 seconds. Free next to what it saves.
