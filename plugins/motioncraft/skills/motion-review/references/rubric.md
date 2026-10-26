# Motion page rubric

Ten criteria, each scored 1 to 10. Score from screenshots at 1440x900 and 390x844 and from using the page with a mouse, a touch screen (or phone emulation) and a keyboard.

**The bar: average 8 or higher, nothing under 7.** A single 6 means the page is not ready, whatever the average.

Write one sentence of evidence for every score. If you cannot point at a frame or a behavior, you are not scoring, you are guessing.

| # | Criterion | One-line question |
|---|---|---|
| 1 | Idea | Can you say what this page is in one sentence, and does every section serve it? |
| 2 | Domain language | Does the page speak the customer's world, or could it belong to any brand? |
| 3 | Composition | Is every frame composed on purpose, at both sizes? |
| 4 | Typography | Is the type readable, consistent and part of the identity? |
| 5 | Motion quality | Do timing, easing and weight feel deliberate? |
| 6 | Transitions | Do sections hand off to each other, or just stack? |
| 7 | Interaction | Is there a verb for the visitor, and does it reward within a second? |
| 8 | Phone experience | Is the phone version designed, not squeezed? |
| 9 | Performance | Does it stay smooth and load fast on an ordinary device? |
| 10 | Accessibility and control | Can everyone read it, operate it and stop it? |

## 1. Idea

- **5:** A pile of effects. Sections are unrelated set pieces. You cannot name the page's concept.
- **8:** One clear concept carries the hero and most sections. One or two sections drift into generic marketing blocks.
- **10:** You can describe the page in one sentence, and the loader, cursor, nav, transitions, footer and 404 all serve that sentence. Nothing is decoration for its own sake.

## 2. Domain language

- **5:** Stock layout with a brand name swapped in. Icons, cards and gradients that fit any company.
- **8:** The main sections borrow a real artifact from the customer's world (a work order, a plan sheet, a menu, a departure board). Small details still default to generic UI.
- **10:** The whole page is built from the customer's own artifacts and vocabulary. The accent color has one meaning and is used only for it. A visitor from that industry smiles at the details.

## 3. Composition

- **5:** Elements are placed where the framework put them. Text sits on busy image areas. Frames feel empty or crowded at random.
- **8:** Strong hero and key sections with a clear focal point and breathing room. A few frames are merely acceptable, usually on the phone.
- **10:** Every section screenshot works as a poster on its own at both sizes. Focal points, negative space and contrast are deliberate in every frame, including mid-transition frames.

## 4. Typography

- **5:** Default stacks or a trendy face with no relation to the brand. Line lengths too long, sizes inconsistent, poor contrast on imagery.
- **8:** Two typefaces with a clear role each, a consistent scale, comfortable measure. Minor issues such as a widow in a headline or a slightly small caption.
- **10:** Type is part of the identity, set with care (tracking, leading, balanced line breaks), readable on every background at every size, and it moves with the same character as the rest of the page.

## 5. Motion quality

- **5:** Linear or default easing everywhere, everything moves at once, motion that loops with no purpose, visible jank or popping.
- **8:** Consistent easing family, fast attack with slow release, staggered entrances, motion that supports the reading order. One or two moments feel slightly floaty or abrupt.
- **10:** Motion has weight. Holds give the eye time to read. Big moments are rare and land hard because the default is quiet. Scrubbed motion follows the hand exactly and settles cleanly.

## 6. Transitions

- **5:** Sections fade in on scroll, one after another, the same way every time.
- **8:** Key sections hand off with an intentional move (a shared object, a camera move, a wipe in the brand's language). Some sections still use a generic reveal.
- **10:** Transitions are first-class moments. The thing you clicked or followed becomes the next scene. Every transition is interruptible and reverses cleanly.

## 7. Interaction

- **5:** Nothing to do except scroll and hover buttons. Or interaction exists but is hidden, slow or confusing.
- **8:** One clear verb for the visitor (drag, hold, draw, scrub, rearrange) that is discoverable and responds quickly. It survives normal use.
- **10:** The verb is tied to the customer's world and explains the product better than copy would. It rewards within a second, survives spamming and fast input, works with touch and keyboard, and has a small hidden reward for the curious.

## 8. Phone experience

- **5:** The desktop layout shrunk. Tiny text, cropped subject, the 3D scene off center, hover-only interactions.
- **8:** A real phone layout with its own crops and camera framing. The signature moment works with touch. One or two sections are cramped.
- **10:** The phone version is designed as a first-class composition. The signature moment is adapted for thumbs, framing puts the subject in the safe area, and nothing depends on hover.

## 9. Performance

- **5:** Long blank load, frame drops while scrolling, fans spin, page weight far over budget.
- **8:** First meaningful frame quickly, smooth on a mid laptop and a recent phone, within the weight budget. Occasional p95 spikes in the heaviest section.
- **10:** p95 frame time inside budget on an ordinary device, a quality ladder that steps down gracefully, assets sized per device, nothing renders while hidden or off screen. See [../../motion-analytics/references/performance.md](../../motion-analytics/references/performance.md).

## 10. Accessibility and control

- **5:** No pause control, reduced motion ignored, missing alt text, invisible focus, content only in a canvas.
- **8:** Pause control, reduced motion that gives a composed page, real HTML content, alt text, visible focus. Small gaps such as one unlabeled icon button.
- **10:** Everything above, plus full keyboard operation of the signature interaction, an accessible alternative for anything visual-only (a "plain view" toggle, a described still), correct heading order, and sound that is off until the visitor chooses it.

## Scoring notes

- **Score the phone first.** If a criterion is 9 on desktop and 6 on the phone, it is a 6.
- **Average honestly.** Round the average to one decimal place and never round a criterion up.
- **Blocking checks are separate.** A page can score 9 on the rubric and still fail a blocking check. Both must pass. See [qa-checklist.md](qa-checklist.md).
- **Two reviewers beat one.** When a score matters, have a second reviewer score blind, then discuss any criterion where you differ by more than 1.

## Score sheet

```
Page:            Date:          Reviewer:
1  Idea                 _  evidence:
2  Domain language      _  evidence:
3  Composition          _  evidence:
4  Typography           _  evidence:
5  Motion quality       _  evidence:
6  Transitions          _  evidence:
7  Interaction          _  evidence:
8  Phone experience     _  evidence:
9  Performance          _  evidence:
10 Accessibility        _  evidence:
Average: _._   Lowest: _ (criterion)   Bar met: yes / no
```
