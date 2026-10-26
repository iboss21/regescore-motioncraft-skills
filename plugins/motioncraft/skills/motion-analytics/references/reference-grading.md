# Grading a page against a reference

"Is ours as good as the target?" is the most argued question in motion work. This method makes it a fair, repeatable measurement instead of a debate.

A **reference** here is anything you are measuring against: an approved design comp, a client mockup, an earlier version of your own page, or a published site whose level of craft you are studying. Grading is for measuring craft. It is never a license to copy: study the reference, build your own, and never ship someone else's code, copy, media or signature concept.

## The method in one paragraph

Pick four matched moments. Capture both pages at exactly those moments with identical settings. Put them side by side on a sheet, with the sides shuffled so graders cannot tell which is yours. Give the sheet to three independent graders, each with a different lens. Each grader gives every moment a verdict of close, partial or different, with one sentence of evidence. The majority verdict per moment is the result.

## 1. Pick four moments

| # | Moment | What it tests |
|---|---|---|
| 1 | First screen, settled | Composition, type, color, first impression |
| 2 | Signature moment at its peak | The one idea of the page at full strength |
| 3 | A transition, halfway through | Motion craft: easing, layering, what happens between states |
| 4 | Closing section or call to action | Whether quality holds to the end |

Define each moment by **story position**, not by pixels or seconds of wall clock: "the hero after the intro settles", "50 percent through the section 3 handoff". Pages differ in length and speed; story positions line up, pixel offsets do not.

Capture every moment at **1440x900** and **390x844**. That is 8 pairs per page.

## 2. Capture fairly

Unfair capture is the most common reason a grade is wrong. Equalize everything except the page itself:

- Same browser, same viewport, same device scale factor.
- Fonts loaded (`await document.fonts.ready`) and images decoded before capture.
- Same scroll progress through the section, measured as a fraction of the section, not in pixels.
- Cookie banners, chat bubbles and debug panels closed on both sides.
- The cursor in the same neutral spot, or hidden.
- Same rendering path. If one side needs the GPU to look right, capture both with the GPU.

### Play-once films and timed intros: pause and seek, never wall clock

A screenshot taken "3 seconds after load" lands on a different frame every run: load time varies, and software rendering can run a timeline at a fraction of real speed. Capture at an exact **film time** instead, by pausing the timeline and seeking it.

For a `<video>`:

```js
// In the page (for example via Playwright's page.evaluate): show the exact frame at t seconds.
async function videoAt(video, t) {
  video.pause();
  await new Promise((done) => {
    video.addEventListener("seeked", done, { once: true });
    video.currentTime = t;
  });
  // Wait until that frame has actually been presented, not just decoded.
  if ("requestVideoFrameCallback" in video) await new Promise((r) => video.requestVideoFrameCallback(() => r()));
  else await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}
```

For CSS animations and the Web Animations API:

```js
function animationsAt(ms) {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
}
```

For timelines you control (GSAP, a three.js clock, a custom scene), expose one QA hook that sets the time and renders a single frame:

```js
// In your page: one clock for everything, settable for QA.
let clock = 0, frozen = false;
window.__qaSetTime = (t) => { frozen = true; clock = t; renderFrame(clock); };
function loop(now) {
  if (!frozen) clock = now / 1000;
  renderFrame(clock);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

Then capture with Playwright:

```js
await page.goto(url, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
for (const t of [0.5, 2.0, 4.25, 7.0]) {
  await page.evaluate((s) => window.__qaSetTime(s), t);
  await page.waitForTimeout(100);  // let the frame reach the screen
  await page.screenshot({ path: `ours/film-${t.toFixed(2)}.png` });
}
```

For a reference you do not control, use the same idea with what the page exposes: pause its `<video>` and seek it, or pause and seek its document animations. If a moment cannot be reached deterministically, capture it several times and pick the frame that best matches the story position, and do the same for your own page so neither side gets a hand-picked best frame.

## 3. Build the sheet

```bash
node scripts/compare-sheet.mjs ./shots/ours ./shots/reference ./grading --labels "Ours,Reference" --blind
```

[`../scripts/compare-sheet.mjs`](../scripts/compare-sheet.mjs) pairs files with the same name in both folders and writes:

- `compare.html`: every pair side by side, always written, no dependencies.
- `compare.png`: one image of all pairs, when sharp is installed.
- `key.json` with `--blind`: which side is which in each row. Sides are shuffled per row and labels become A and B. Keep the key away from graders until verdicts are in.

Name files by moment and size so rows line up, for example `1-first-desk.png`, `2-signature-desk.png`, `1-first-phone.png`.

## 4. Three graders, three lenses

Use three graders who did not build the page. They can be people or separate AI sessions; what matters is that they work independently and do not see each other's notes until all verdicts are in.

| Grader | Lens | Looks at |
|---|---|---|
| A | Composition | Layout, focal point, crop, type scale and weight, negative space, hierarchy, phone framing |
| B | Motion | The transition moment and any frame strips: easing, layering, timing, what moves and what holds |
| C | Finish | Light, color, material, depth, texture, detail, edge quality, artifacts |

For grader B, add a short frame strip of the transition (four frames at 0, 33, 66 and 100 percent of it) to both sides, captured with the pause-and-seek method.

Grader brief, used as is for each lens:

```
You are grading two versions of the same moment of a web page, shown side by side as A and B.
Your lens is <LENS>: <what it covers>. Ignore everything outside your lens.
For each row, give one verdict for how close B is to A at the level of craft and look:
  close     a viewer would accept them as the same look and caliber; differences need side by side to notice
  partial   same idea and layout, but at least one gap a viewer notices without side by side
  different reads as a different look or a lower tier of craft, or the moment is missing or broken
Write one sentence of evidence per row that points at something visible.
Do not guess which side is the original. Do not average: grade each row on its own.
```

## 5. Verdicts

**Per moment:** the majority of the three graders (2 of 3). If all three disagree, the moment is **partial**.

**Per page:**

| Page verdict | Rule |
|---|---|
| Close | At least 6 of 8 moments close, and none different |
| Different | 2 or more moments different |
| Partial | Anything else |

Record it so the next round is comparable:

```
Page: <name> vs <reference>   Date: <yyyy-mm-dd>   Graders: A (composition), B (motion), C (finish)
Moment              Desktop                  Phone
1 First screen      close (A c, B c, C p)    partial (A p, B c, C p)
2 Signature         close                    close
3 Transition        partial                  partial
4 Closing           close                    close
Verdict: partial (5 close, 3 partial, 0 different)
Biggest gap: phone transition. B: "B's camera move starts late and ends without a settle."
```

## 6. Pitfalls

- **Best frame against average frame.** Comparing the reference's hero shot against your mid-load frame. Use matched story positions on both sides.
- **Wall-clock capture.** Screenshots at fixed delays after load. Pause and seek.
- **Labels on the sheet.** Graders who know which side is yours grade kinder or harsher. Use `--blind`.
- **The builder grades.** The person who built the page sees intent, not pixels.
- **Averaging away a failure.** One "different" moment is a real problem even if the rest are close. The page rule keeps it visible.
- **Grading only desktop.** Phone moments are half the sheet for a reason.
- **Chasing the reference instead of the idea.** If your page is "different" because it is a different and better idea, say so in the notes. The goal is craft at the same level, not a copy.
