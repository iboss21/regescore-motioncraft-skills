# Technique index

Twenty-six recipes in five files. Every recipe has the same parts: what it is, when to use it, premium parameter values, a compact working snippet, phone notes, reduced-motion notes and cost. All code is vanilla JavaScript with three.js 0.170 from an import map, no build step.

Wow and effort are 1 to 5. Cost is the per-frame and download price on a mid-range phone: **Free** (no measurable cost), **Low** (under about 1 ms or under 500 KB), **Medium** (1 to 3 ms or 0.5 to 2 MB), **High** (more than that, budget for it).

## All recipes

| ID | Recipe | File | Use it for | Wow | Effort | Cost |
|---|---|---|---|---|---|---|
| R01 | Section-centered scroll value | [scroll-and-camera](scroll-and-camera.md#r01-section-centered-scroll-value) | One number `t` that every system reads | 1 | 1 | Free |
| R02 | Shot list with smoothstep holds | [scroll-and-camera](scroll-and-camera.md#r02-shot-list-with-smoothstep-holds) | Camera that rests on each section and travels between | 4 | 2 | Free |
| R03 | Phone framing with setViewOffset | [scroll-and-camera](scroll-and-camera.md#r03-phone-framing-with-setviewoffset) | Subject above the copy on portrait screens | 3 | 2 | Free |
| R04 | Damped follow for scroll and pointer | [scroll-and-camera](scroll-and-camera.md#r04-damped-follow-for-scroll-and-pointer) | Frame-rate independent easing that feels physical | 3 | 1 | Free |
| R05 | Mode value: one scroll range changes the world | [scroll-and-camera](scroll-and-camera.md#r05-mode-value-one-scroll-range-changes-the-world) | Night to paper, raw to finished, today to the plan | 5 | 2 | Low |
| R06 | DOM callouts anchored to 3D points | [scene-craft](scene-craft.md#r06-dom-callouts-anchored-to-3d-points) | Labels that follow parts of a model | 4 | 2 | Low |
| R07 | Morph-target tube morph | [scene-craft](scene-craft.md#r07-morph-target-tube-morph-3d-route-to-flat-diagram) | A 3D route that becomes its diagram | 5 | 3 | Low |
| R08 | Instanced buildings with shader-lit windows | [scene-craft](scene-craft.md#r08-instanced-buildings-with-shader-lit-windows) | A lit city in one draw call | 4 | 3 | Low |
| R09 | Sky dome that fades with a mode | [scene-craft](scene-craft.md#r09-sky-dome-that-fades-with-a-mode) | Weather instead of a flat background | 2 | 1 | Free |
| R10 | Canvas-drawn faceplate texture | [scene-craft](scene-craft.md#r10-canvas-drawn-faceplate-texture) | Sharp printed type and labels on models | 3 | 2 | Low |
| R11 | Contact shadow from a radial-gradient plane | [scene-craft](scene-craft.md#r11-contact-shadow-from-a-radial-gradient-plane) | Grounding objects without shadow maps | 3 | 1 | Free |
| R12 | Exploded view from one value | [scene-craft](scene-craft.md#r12-exploded-view-from-one-value) | Showing what is inside a product | 4 | 2 | Free |
| R13 | Play-once hero film that hands over to a still | [film-and-photo](film-and-photo.md#r13-play-once-hero-film-that-hands-over-to-a-still) | An arrival moment that lands on a sharp frame | 4 | 2 | Medium |
| R14 | Ping-pong video loop | [film-and-photo](film-and-photo.md#r14-ping-pong-video-loop) | Seamless ambient footage | 3 | 1 | Medium |
| R15 | Film-clock cues | [film-and-photo](film-and-photo.md#r15-film-clock-cues-copy-that-moves-on-the-films-timeline) | Copy that steps aside for the film's best moment | 4 | 2 | Free |
| R16 | Tracked hotspot over a cover-fit video | [film-and-photo](film-and-photo.md#r16-tracked-hotspot-over-a-cover-fit-video) | Spec cards and close-ups pinned inside footage | 5 | 3 | Low |
| R17 | Depth-photo parallax | [film-and-photo](film-and-photo.md#r17-depth-photo-parallax) | A photograph that becomes a small 3D set | 5 | 4 | Medium |
| R18 | Synthesized drum voice set | [sound-and-rhythm](sound-and-rhythm.md#r18-synthesized-drum-voice-set) | Kick, snare, hat and clap with zero bytes | 4 | 2 | Free |
| R19 | Look-ahead scheduler with a visual queue | [sound-and-rhythm](sound-and-rhythm.md#r19-look-ahead-scheduler-with-a-visual-queue) | Sound and light that agree to the millisecond | 3 | 3 | Free |
| R20 | Kick-synced CSS variables and scene pulse | [sound-and-rhythm](sound-and-rhythm.md#r20-kick-synced-css-variables-and-scene-pulse) | Light, bloom, camera and type on the beat | 4 | 1 | Low |
| R21 | Scroll-speed ambience and low-pass muffle | [sound-and-rhythm](sound-and-rhythm.md#r21-scroll-speed-ambience-and-low-pass-muffle) | Sound that follows the visitor and the transitions | 3 | 2 | Free |
| R22 | Pause-motion control | [interaction-and-access](interaction-and-access.md#r22-pause-motion-control) | Required on any page with continuous motion | 1 | 1 | Free |
| R23 | JS-only smooth scrolling for anchor links | [interaction-and-access](interaction-and-access.md#r23-js-only-smooth-scrolling-for-anchor-links) | Gliding nav without slowing scripted jumps | 1 | 1 | Free |
| R24 | Hold-to-trigger gate | [interaction-and-access](interaction-and-access.md#r24-hold-to-trigger-gate) | One climactic action in the customer's verb | 4 | 2 | Free |
| R25 | Drag-to-look room with idle pan | [interaction-and-access](interaction-and-access.md#r25-drag-to-look-room-with-idle-pan) | Rooms and venues you can look around | 3 | 2 | Low |
| R26 | Quality ladder and loop hygiene | [interaction-and-access](interaction-and-access.md#r26-quality-ladder-and-loop-hygiene) | Same story on weak hardware, no wasted frames | 2 | 2 | Free |

## Find by need

| I need to... | Start with |
|---|---|
| Move a camera through a story | R01, R02, then R04 for life and R03 for phones |
| Change the whole world at one point in the story | R05 with R07, R08 and R09 |
| Explain a product | R12 exploded view, R06 callouts, R10 printed faceplate, R11 shadow |
| Make footage feel designed | R13 or R14, then R15 for copy and R16 for pinned cards |
| Make a photo come alive without a film | R17 |
| Give a brand a pulse | R18, R19, R20 |
| Add sound to a story | R21, opt-in, with R18 voices for UI ticks |
| Give the visitor a verb | R24 hold, R25 drag, R03 plus R06 for tappable parts |
| Pass an accessibility review | R22, R23, R26, and the reduced-motion notes on every recipe |
| Ship to weak phones | R26 first, then each recipe's phone notes |

## Recipes that work well together

- **Product launch:** R01 + R02 + R03 + R12 + R06 + R10 + R11, then R18 to R20 if the product makes sound.
- **City or network story:** R01 + R02 + R05 + R07 + R08 + R09, plus a ride-along shot whose pose is computed from a moving train each frame (section type S12 in [page-architecture](../page-architecture.md#section-types)).
- **Film-led hero:** R13 or R14 + R15 + R16, wrapped by R22.
- **Photo-led hero:** R17 with a wordmark plane set between subject and background, plus R22 and R26.

## Writing a new recipe

Use the same headings in the same order, keep the snippet under about 60 lines, and make sure it parses as an ES module. State numbers, not adjectives: "0.15 to 0.85 smoothstep" beats "smooth easing". Every recipe needs phone and reduced-motion notes, even when the answer is "same".
