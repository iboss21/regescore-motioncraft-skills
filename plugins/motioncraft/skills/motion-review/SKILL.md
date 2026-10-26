---
name: motion-review
description: Review and fix a motion-heavy web page (scroll stories, WebGL heroes, film scrub, shader sections) with a look-and-fix loop. Use when asked to review, critique, QA, polish or "make it ship ready" an animated landing page, template or hero, or before publishing one. Takes section screenshots at desktop and phone sizes, scores the page against a 10-criterion rubric, runs blocking QA checks (console errors, overflow, reversible scroll, pause control, reduced motion, text size, tap targets, white flash, fonts, alt text, focus, page weight) and fixes what fails.
---

# Motion review

A motion page is not done when it works on your monitor. It is done when it scores well on a fixed rubric, passes every blocking check at desktop and phone sizes, and you have looked at the result instead of trusting the code.

This skill gives you three things:

1. A **look-and-fix loop**: screenshot, score, fix the worst thing, screenshot again.
2. A **rubric** of 10 criteria scored 1 to 10, with what a 5, 8 and 10 look like: [references/rubric.md](references/rubric.md).
3. A **blocking QA checklist** and two standalone scripts that measure it: [references/qa-checklist.md](references/qa-checklist.md), [scripts/section-shots.mjs](scripts/section-shots.mjs), [scripts/qa-lite.mjs](scripts/qa-lite.mjs).

## The bar

- Rubric average of **8 or higher**, and **no single criterion under 7**.
- **Every blocking check passes** at 1440x900 and 390x844.
- You have **seen** every section at both sizes. A review without screenshots is a guess.

If the page misses the bar, it is not ready, however good the hero looks.

## Requirements

- Node 18 or newer.
- Playwright in the project you are reviewing: `npm i -D playwright` then `npx playwright install chromium`. Or use an installed Chrome with `playwright-core` and pass `--chrome "<path to chrome>"`. The scripts find Chrome or Edge in the usual Windows, macOS and Linux locations on their own.
- Optional: `npm i -D sharp` for contact sheets. Without it you still get every PNG.
- Run the scripts from your project folder. They look for Playwright and sharp in the folder you run them from first, then next to the script, so one install in your project is enough. Script paths below are relative to this skill's folder. Claude Code shows that folder when the skill loads; after a manual copy it is, for example, `~/.claude/skills/motion-review/`, so the full call is `node ~/.claude/skills/motion-review/scripts/qa-lite.mjs ./site`.

## The `?shot=N` convention

The scripts open `index.html?shot=N` and expect the page to land on section N. Add this to your page once (it costs a few lines and makes every review repeatable):

```js
// QA hook: ?shot=N scrolls section N to the middle of the viewport after load.
const shot = new URLSearchParams(location.search).get("shot");
if (shot !== null) addEventListener("load", () => {
  const marked = document.querySelectorAll("[data-shot]");
  const s = (marked.length ? marked : document.querySelectorAll("section"))[+shot];
  if (s) scrollTo(0, s.getBoundingClientRect().top + scrollY + s.offsetHeight / 2 - innerHeight / 2);
});
```

For a film or a play-once intro, also jump the timeline to its settled state when `?shot` is present, so the screenshot shows the composed frame and not frame 1. For timed films, see the fair capture method in the analytics skill: [../motion-analytics/references/reference-grading.md](../motion-analytics/references/reference-grading.md).

## The look-and-fix loop

Run this loop until the page meets the bar. Each pass should fix the single most damaging problem first, not ten small ones at once.

### 1. Shoot

```bash
node scripts/section-shots.mjs ./my-site 6 ./qa/shots
```

This serves `./my-site` on a local port, opens `index.html?shot=0` through `?shot=5` at desktop and phone sizes, writes `d0.png ... d5.png`, `p0.png ... p5.png`, and `desk-sheet.png` and `phone-sheet.png` when sharp is installed. It prints every page error and console error it saw.

### 2. Look

Open the two contact sheets first, then the single frames. Ask, section by section:

- Is the one idea of the page visible in this frame, or is this a generic section?
- Does the phone frame have its own composition, or is it the desktop squeezed?
- Is any text sitting on a busy part of the image?
- Is anything cropped, overlapping, blank, or still loading?
- Does every section look like the same brand?

Write down what you see in plain words before you score. "The phone hero headline covers the subject's face" is useful. "Looks good" is not.

### 3. Check

```bash
node scripts/qa-lite.mjs ./my-site
```

It prints PASS or FAIL per blocking check, with the measured numbers. Any FAIL blocks shipping. See [references/qa-checklist.md](references/qa-checklist.md) for what each check means, how the script measures it, and the usual fix.

Some checks need a human: does the pause control stop every moving thing, does scroll replay cleanly in reverse after a fast fling, does the page feel right with sound on. The checklist marks these as manual. Do them.

### 4. Score

Score all 10 rubric criteria from the screenshots and from using the page. Use the anchors in [references/rubric.md](references/rubric.md). Score what is on screen, not what the code intends. Write one sentence of evidence per score.

### 5. Fix the worst thing

Pick the lowest score or the first FAIL. Fix the cause, not the symptom: if text is unreadable on the phone, fix the type scale and the scrim, do not shrink the image. Keep the change small and local.

### 6. Repeat

Shoot again, look again, rescore the criteria you touched. Stop when the bar is met. Three to five passes is normal for a new page.

## Review report format

When you report a review, use this shape so results can be compared over time:

```
Page: <name>   Pass: <n>   Date: <yyyy-mm-dd>
Rubric: idea 8, craft 7, motion 9, ... average 8.1, lowest 7 (craft)
Blocking: 11 of 12 PASS. FAIL: tap targets (3 under 44 px on phone: .nav a, #prev, #next)
Seen: 6 desktop, 6 phone frames
Worst problem: <one sentence>
Fix applied: <one sentence>
Next: <one sentence>
```

## Rules of thumb

- **Phone first when scoring.** Most visitors arrive on a phone. A page that is a 9 on desktop and a 6 on the phone is a 6.
- **Motion you cannot stop is a bug.** Anything that moves for more than five seconds needs a visible pause control, and reduced motion must give a complete, composed page.
- **Scroll must run both ways.** Scrolling up must undo what scrolling down did, cleanly, at any speed.
- **No silent errors.** One console error is a FAIL, even if the page looks fine. It usually means a fallback path is broken.
- **Judge the settled frame and the moving frame.** A screenshot shows composition; only using the page shows timing. Do both.

## Related

- Measuring frame time, quality tiers and page weight: [../motion-analytics/SKILL.md](../motion-analytics/SKILL.md).
- Building the page in the first place: [../motioncraft-builder/SKILL.md](../motioncraft-builder/SKILL.md).
