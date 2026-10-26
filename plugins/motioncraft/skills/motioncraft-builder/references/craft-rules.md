# Craft rules

Thirty rules we hold every motion build to. They come from studying award-winning motion sites and from shipping our own templates. Each rule has a number you can test. When two rules disagree, the lower number wins.

## A. The idea

**1. One idea per site.** One object, one verb, one world, written as one sentence before any code. If a section does not serve that sentence, it is cut. The test: a stranger who scrolls for 20 seconds can repeat the sentence back.

**2. The metaphor comes from the customer's world.** Repair orders for a garage, plan sheets for a contractor, a departures board for a transit agency, a roast log for a coffee roaster. Apply it to the loader, cursor, nav, hover, transitions and the 404. Domain language is the cheapest premium signal there is.

**3. The accent color has one meaning.** Pick one accent and give it one job, such as "live", "found a fault" or "your selection". Keep it under about 5 percent of the pixels on any screen so that when it appears, it is read.

**4. The verb rewards within 1 second.** Whatever the visitor does first (scroll, drag, hold, click), something meaningful changes inside 1 second. A first gesture that only fades text in has wasted the visitor's trust.

**5. Interaction beats film alone.** Footage still sells, but a live layer on top of it (a pinned callout, a tracked hotspot, a light that follows the film) is what makes it feel made rather than bought.

## B. Plan before pixels

**6. Write the beat sheet first.** Every beat names its scroll range, camera, copy, phone framing, reduced-motion version and cost. Code that does not map to a beat is deleted.

**7. Mechanics in grey, then dressing.** The scroll, camera and interaction must work with boxes and placeholder copy before any asset is made. If it is dull in grey, it will be expensive and dull in color.

**8. One clock.** Scroll, pointer, audio and rendering share one `requestAnimationFrame` loop. Per-frame values live in plain variables, shader uniforms and CSS custom properties, never in framework state. Clamp `dt` to 0.05 s so a tab switch never teleports anything.

**9. Shots, not tweens.** The camera moves between named shots, one per section, and holds on each. Use a smoothstep from 0.15 to 0.85 of each segment so about 30 percent of every scroll segment is hold and 70 percent is travel.

**10. Every reveal is reversible.** Scrolling back up plays the story backward with no stuck states, no double triggers and no elements that stay hidden. Derive state from the scroll position instead of firing one-shot events, except for deliberate play-once moments (rule 22).

## C. Timing and weight

**11. Fast attack, slow release.** Pulses rise in 2 to 10 ms and decay over 120 to 500 ms. A beat light that fades with `exp(-dt * 7)` feels like a drum; a linear fade feels like a dimmer switch.

**12. Damp everything the pointer touches.** Pointer-driven values chase their target with `x += (target - x) * (1 - exp(-dt * k))`, with `k` between 3 (heavy camera) and 8 (light UI). This is frame-rate independent, unlike a fixed `0.1` lerp.

**13. Hold gates last 0.6 to 1.4 seconds.** Shorter feels like a click, longer feels broken. Show progress from the first frame, snap a color change at about 200 ms, and pay off at the end. Releasing early cancels cleanly.

**14. Stagger letters by 0.08 to 0.15 seconds.** A headline that rises letter by letter uses a stagger in that range with each letter taking 0.6 to 0.9 s and a cubic ease out. Longer staggers read as a typewriter, shorter as a block.

**15. Idle motion is slow and small.** Ambient sway runs at 0.1 to 0.35 Hz with an amplitude you barely notice (a camera drift of 0.1 to 0.25 units, an object rotation of 0.05 rad). If someone can describe the idle motion, it is too big.

## D. Restraint

**16. Two typefaces, one accent, near-black or paper.** Most award sites use one or two colors plus a neutral. A quiet default makes the big moment heavier.

**17. Fake what is expensive.** Contact shadows from a gradient plane, glass on a flat card, depth of field from a smoothstep, city windows from a shader hash, fluid at a quarter of screen resolution. Spend the saved frame time on interaction.

**18. Remove before you add.** At the end of each dressing pass, list every effect on screen and delete the weakest one. Most strong sites are the result of subtraction.

**19. Transitions are designed, not defaulted.** Use the clicked thing as the transition object, morph one form into the next, or move the camera. A generic crossfade between sections is a missed beat.

**20. Small rewards, one each.** One hidden gesture, one idle state, one clever 404, one loader that becomes the hero. Not five of each.

## E. Film, sound and assets

**21. Film and live layers share a grade.** When a video hands over to a still or a 3D scene, the still uses the same color grade (same contrast, black point and saturation) so the cut is invisible.

**22. Play-once films end on a still.** A hero film that plays once must end on a frame that matches a high-resolution still exactly, then dissolve to it over 0.3 to 0.6 s. The still is what the visitor studies, so it must be sharper than the film.

**23. Sound is opt-in and synthesized.** Offer sound with a clear control, start the `AudioContext` only after a user gesture, synthesize voices with oscillators and noise so they cost no bytes, and muffle with a low-pass filter on transitions.

**24. Budget before beauty.** The whole page under 10 MB, the first screen under 2.5 MB. WebP or AVIF stills, short-GOP MP4 films, canvas-drawn textures wherever text or line art is involved. Device pixel ratio capped at 1.75 on desktop and 1.5 on phones.

**25. AI art gets a human finish.** Redraw lettering, unify the style across plates, fix hands, logos and mechanical details. Nothing generated ships unreviewed.

## F. Access and robustness

**26. Real HTML underneath.** Content, nav and forms stay in the DOM for search engines, screen readers and people without WebGL. The canvas is `aria-hidden="true"` unless it carries meaning, in which case it gets a label.

**27. A pause control and reduced motion, always.** Any continuous motion longer than 5 seconds gets a visible, keyboard-reachable pause control. `prefers-reduced-motion: reduce` turns the story into stills that carry the same information.

**28. Phone is a first-class shot list.** Phones get their own camera poses and a view offset that lifts the subject above the copy. Phone text is at least 11 px, tap targets at least 44 x 44 px, and nothing scrolls sideways.

**29. A quality ladder with the same story on every rung.** Tier 0 static, tier 1 minimal, tier 2 reduced, tier 3 full. Step down when the rolling frame time stays above 22 ms, step up below 12 ms, and judge the 95th percentile, not the median.

**30. Zero console errors, and stop when hidden.** No errors or warnings you caused. Cancel the render loop when the tab is hidden and pause films and loops when their section is off screen.
