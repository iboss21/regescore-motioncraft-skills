---
name: motion-analytics
description: Measure the quality and performance of a motion-heavy web page (WebGL, scroll film, shader heroes, particle scenes) and compare it fairly against a reference. Use when asked to profile, speed up, budget, benchmark or grade an animated page, when a scene stutters or drains phones, when choosing quality tiers or DPR caps, or when judging "how close is our page to the reference". Covers frame-time budgets with p50 and p95, a rolling quality ladder, page and texture weight budgets, Web Vitals for motion sites, and reference grading with side-by-side sheets and independent graders.
---

# Motion analytics

Motion quality is measurable. "Feels smooth" and "looks close to the reference" are claims; this skill turns them into numbers you can repeat next week.

Two jobs:

1. **Performance:** how long each frame takes, how heavy the page is, and how the page adapts when the device is slow. Guide: [references/performance.md](references/performance.md). Tool: [scripts/frame-meter.js](scripts/frame-meter.js).
2. **Reference grading:** how close a page is to a reference or to its own design target, judged fairly. Guide: [references/reference-grading.md](references/reference-grading.md). Tool: [scripts/compare-sheet.mjs](scripts/compare-sheet.mjs).

## Quick start

### Measure frame time on any page

Drop the meter in and open the page with `?meter`:

```html
<script src="frame-meter.js" defer></script>
```

A small readout shows p50, p95 and a suggested quality tier, and the console logs a summary every five seconds. From the console you can also run:

```js
frameMeter.start();          // begin a clean measurement
// ...scroll through the page, use the signature interaction...
frameMeter.report();         // { frames, p50, p95, p99, max, fps, longFrames, jank, suggest }
```

Measure on the slowest device you care about, not on your workstation. Scroll the whole page and use the main interaction during the measurement, because idle frames hide the expensive moments.

### Build a side-by-side sheet

```bash
node scripts/compare-sheet.mjs ./shots/ours ./shots/reference ./compare --labels "Ours,Reference"
```

Pairs images with the same file name, writes `compare.html` (always) and `compare.png` (when sharp is installed). Hand the sheet to graders as described in the grading guide.

## The numbers that matter

| Measure | Target | Why |
|---|---|---|
| Frame time p95 | 16.7 ms or less on the target device (60 Hz) | p95 is what people feel; the median hides stutter |
| Frame time p50 | Well under p95 | A big gap means spikes: uploads, GC, shader compiles |
| Long frames (over 50 ms) | 0 while scrolling | Each one is a visible hitch |
| Page weight at first screen | Under 3 MB | First impression on mobile data |
| Whole page | Under 10 MB | Load time, data cost, battery |
| Largest Contentful Paint | Under 2.5 s | Show a composed still before heavy assets arrive |
| Cumulative Layout Shift | Under 0.1 | Canvas and video boxes must reserve their space |
| Interaction to Next Paint | Under 200 ms | Heavy render loops must not block input |

Details, budgets per asset type and a working quality ladder are in [references/performance.md](references/performance.md).

## Workflow

1. **Baseline.** Load the page with `?meter`, scroll top to bottom twice, use the main interaction, then read `frameMeter.report()`. Write down device, browser, viewport and the numbers.
2. **Find the expensive section.** Repeat per section with `frameMeter.start()` at the section and `report()` after it. The worst p95 is where to work.
3. **Fix the cause.** Usually one of: device pixel ratio too high, a full-resolution post pass, too many draw calls, a texture uploaded mid-scroll, a shader compiled on first view, or rendering while hidden. See the fix table in the performance guide.
4. **Add the ladder.** Even a fast page needs a way down on a weak phone. Use the rolling ladder snippet: step down above 22 ms p95, step up below 12 ms.
5. **Re-measure the same way.** Same device, same path, same duration. Report before and after.
6. **Grade against the target.** When the page recreates a design or a reference look, build four-moment sheets and run the three-grader method in [references/reference-grading.md](references/reference-grading.md).

## Report format

```
Page: <name>   Device: <model, browser>   Viewport: <w x h, DPR>
Path: full scroll x2 + signature interaction, 60 s
Before: p50 9.8 ms, p95 31.2 ms, long frames 6, weight 14.1 MB
After:  p50 7.1 ms, p95 15.9 ms, long frames 0, weight 8.7 MB
Changes: DPR cap 1.5 on phones, bloom at half res, hero textures to WebP 2048, shaders pre-compiled in loader
Ladder: tiers 0 to 3, settles at tier 3 on desktop, tier 2 on the test phone
```

## Rules

- **Report p95, not average FPS.** An average of 58 fps can hide a stutter every second.
- **One device class per number.** Never mix a laptop measurement with a phone measurement in one claim.
- **Same path every time.** Measurements are only comparable when the scroll path, interaction and duration match.
- **Measure the cold load too.** First view compiles shaders and uploads textures. That is where long frames live.
- **Grade with evidence.** A "close" verdict needs sheets at matched moments and graders who did not build the page.

## Related

- Review rubric and blocking QA checks: [../motion-review/SKILL.md](../motion-review/SKILL.md).
- Craft workflow and technique library: [../motioncraft-builder/SKILL.md](../motioncraft-builder/SKILL.md).
