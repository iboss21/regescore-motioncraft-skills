# Blocking QA checklist

Every check here blocks shipping. Run them at **1440x900** and **390x844**. [`../scripts/qa-lite.mjs`](../scripts/qa-lite.mjs) measures the automated part and prints PASS or FAIL with numbers. The manual part is marked **Manual**. Do it by hand; it takes about five minutes.

```bash
node scripts/qa-lite.mjs ./my-site                 # serve a folder, test index.html
node scripts/qa-lite.mjs http://localhost:5173/    # or test a running dev server
node scripts/qa-lite.mjs ./my-site --budget-mb 8 --json qa.json --out qa/evidence
```

The script exits with code 1 when any check fails, so you can put it in CI. It renders with software WebGL by default so results repeat across machines; a heavy 3D page takes a few minutes. Add `--gpu` for speed, or `--only phone` while iterating.

| # | Check | Pass when | Automated |
|---|---|---|---|
| 1 | Console errors | Zero page errors, console errors, failed requests or HTTP 4xx/5xx at both sizes | Yes |
| 2 | Horizontal overflow | Page is never wider than the viewport at both sizes | Yes |
| 3 | Reversible scroll | Scrolling back up returns a section to how it looked on the way down | Approximate + Manual |
| 4 | Pause control | Continuous motion has a visible control that actually stops it | Yes + Manual |
| 5 | Reduced motion | With reduced motion on, the page is complete, composed and still | Yes |
| 6 | Phone text size | No visible text under 11 px at 390 px wide | Yes |
| 7 | Tap targets | Interactive elements are at least 44 by 44 px on the phone | Yes |
| 8 | No white flash | A dark page never paints a white frame while loading | Yes |
| 9 | Fonts loaded | Every declared web font loads; nothing fails silently | Yes |
| 10 | Alt text and names | Images have alt, controls have accessible names | Yes |
| 11 | Focus states | Every keyboard stop shows a visible focus style | Yes |
| 12 | Page weight | Total transfer under budget (default 10 MB) at both sizes | Yes |

## 1. Console errors

**Why:** One error usually means a broken fallback, a missing asset or a shader that failed on some GPUs. Visitors do not see the console, but they see the result.

**How the script measures:** Collects `pageerror`, `console.error`, failed requests and responses with status 400 or higher during load and the wait period, at both sizes.

**Usual fixes:** Fix the path or remove the request. Guard optional features (`try` around WebGL context creation, check `HTMLVideoElement.prototype.requestVideoFrameCallback` before using it). Never silence errors with an empty `catch` around the main loop.

## 2. Horizontal overflow

**Why:** Sideways wobble on a phone makes a premium page feel broken.

**How:** Compares `scrollWidth` to `clientWidth` on the document and lists the elements whose right edge passes the viewport.

**Usual fixes:** `overflow-x: clip` on the section that holds an oversized decoration (not on `body`, which can break `position: sticky`), `max-width: 100%` on media, `min-width: 0` on flex and grid children, and long words with `overflow-wrap: anywhere`.

## 3. Reversible scroll

**Why:** Visitors scroll back up constantly. A timeline that only plays forward leaves sections half revealed, items stuck mid-flight, or a camera in the wrong place.

**How:** The script pauses ambient motion if the page has a pause control, then steps down the page in half-screen scroll steps to a point about 40 percent down, screenshots it, steps on to the bottom, steps back up to the same point, waits to settle, screenshots again and compares. It also measures how much the page drifts on its own over 3 seconds at that point, so ambient motion does not cause a false FAIL. The check fails when the round-trip difference is above 1.5 percent plus twice the drift. With `--out <dir>` it saves both frames so you can see what stuck.

**Manual:** Fling fast down and up three times, then stop in the middle of a transition. Nothing should be stuck, doubled or blank. Use the keyboard (Page Down, Home, End) too.

**Usual fixes:** Drive every scroll effect from the current scroll position (a pure function of progress) instead of from one-shot "on enter" events. If you use enter events, also handle leave and enter-back. Clamp and ease toward a target instead of incrementing state per event.

## 4. Pause control for continuous motion

**Why:** Anything that moves, blinks or scrolls on its own for more than five seconds needs a way to pause it (WCAG 2.2.2). It is also a mark of a considered build.

**How:** The script takes two screenshots of the first screen one second apart. If more than 0.3 percent of the picture changes, the page moves by itself, and the script looks for a button whose name or label mentions pause, stop, freeze or still, clicks it, and checks that the motion stops. If the page does not move by itself, the check passes as not applicable.

**Manual:** Confirm the control is visible without hunting, reachable by keyboard, announces its state (`aria-pressed` or a changing label), stops every moving layer (canvas, video, CSS loops, marquee text), and that the page still reads well while paused.

**Usual fixes:** One `motionOff` flag read by the render loop, videos and CSS (`body.still * { animation-play-state: paused }`). When paused, keep rendering on scroll if scroll drives the scene, but freeze the clock.

## 5. Reduced motion

**Why:** Some visitors get sick from large motion. Reduced motion is not "no page": it is the same story told with still, composed frames.

**How:** Opens the page with `prefers-reduced-motion: reduce`, confirms there are no errors, that the first screen is not blank or flat, and that it does not move by itself. It also reports how many CSS animations still run forever.

**Usual fixes:** Read `matchMedia("(prefers-reduced-motion: reduce)")` once at start and listen for changes. Show a designed still (the settled frame of the film, the final pose of the scene) instead of an empty canvas. Keep scroll-linked state changes but replace movement with cuts or short fades.

## 6. Phone text at least 11 px

**Why:** Small captions over imagery are the most common readability failure on motion pages.

**How:** At 390 px wide, finds every visible element that holds text directly and reports any with a computed font size under 11 px.

**Usual fixes:** Set a floor in your scale, for example `font-size: max(11px, 0.72rem)` for captions. Watch for `transform: scale()` on text containers, which the script cannot see; check those by eye.

## 7. Tap targets at least 44 px

**Why:** Thumbs are not cursors. Tiny nav dots and icon buttons are missed taps and rage.

**How:** At 390 px wide, measures the box of every visible link, button, form control, summary and element with `tabindex` or `role="button"`. Links inside running text are skipped (WCAG excludes inline links).

**Usual fixes:** Grow the box with padding, not with a pseudo-element the script cannot measure. Keep the visual small if you want, and make the hit area large: a 10 px dot inside a 44 px transparent button.

## 8. No white flash

**Why:** A dark page that flashes white on load feels cheap and hurts at night.

**How:** On a dark page (settled brightness under 0.35), takes screenshots during the first two seconds after first paint and fails if any frame is brighter than 0.8. It also fails when neither `html` nor `body` has a background color, because the browser's default canvas is white.

**Usual fixes:** Set `html { background: #0b0b0f; color-scheme: dark; }` in an inline `<style>` in the head. Give the canvas the same background. Fade the WebGL layer in from the page color, not from transparent white.

## 9. Fonts loaded

**Why:** A failed font silently falls back to a default face and ruins the typography score, often only on some machines.

**How:** Waits for `document.fonts.ready`, then fails on any font face with status `error` and lists families used in the page that never loaded.

**Usual fixes:** Fix the URL or the `@font-face` family name, self-host WOFF2, use `font-display: swap`, and preload the one or two faces used above the fold.

## 10. Alt text and accessible names

**Why:** Motion pages lean on imagery and icon buttons. Screen readers need words.

**How:** Fails on `<img>` without an `alt` attribute (empty `alt=""` is correct for decoration), on links and buttons with no accessible name, and on form fields with no label.

**Usual fixes:** `alt` that says what the image shows in the brand's context, `aria-label` on icon buttons, `<label for>` on inputs, `aria-hidden="true"` on purely decorative canvases.

## 11. Focus states

**Why:** Keyboard visitors need to see where they are. A custom design that removes the outline and adds nothing is a FAIL.

**How:** Presses Tab through up to 30 stops, records each element's outline, shadow, border, background, color and text decoration while focused and again while not focused, and fails any stop where nothing changes.

**Usual fixes:** One `:focus-visible` rule for the whole site with a clear outline in the accent color and `outline-offset: 3px`. Check it on both light and dark sections.

## 12. Page weight budget

**Why:** Weight is load time, data cost and battery. Award-level builds ship rich scenes under 10 MB.

**How:** Sums the transferred body size of every response during load and the wait period, at both sizes. Default budget 10 MB, change it with `--budget-mb`. Lazy assets loaded later in the scroll are not counted; budget those separately (see [../../motion-analytics/references/performance.md](../../motion-analytics/references/performance.md)).

**Usual fixes:** WebP or AVIF stills at the displayed size, separate phone and desktop video, compressed GLB (Draco or meshopt) and KTX2 textures, one font family with two weights, and load the second half of the page after the first screen is interactive.

## Manual checks (not scripted)

- **Sound:** off until the visitor chooses it; a visible toggle; no sound starts on scroll alone.
- **Interaction survives spam:** click, drag and toggle the signature interaction fast for ten seconds. No stuck states.
- **Touch:** the signature moment works with a finger; nothing depends on hover.
- **Keyboard:** the signature interaction has a keyboard path or an equivalent control.
- **Slow network:** throttle to Fast 3G once. The first screen should be composed (a still, a poster) before heavy assets arrive.
- **Real phone:** one pass on a real mid-range phone. Emulation lies about GPU and thermal limits.
