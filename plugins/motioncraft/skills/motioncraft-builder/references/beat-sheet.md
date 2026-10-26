# Beat sheet

A beat sheet is the screenplay of a motion site. It is written before any code and every build decision is checked against it. One beat is one scroll section (one `.shot` element) or one deliberate moment inside it.

## Why it matters

- It forces the one idea to survive contact with real content. Weak sections die on paper, not after a day of shader work.
- It gives the camera a shot list, the copywriter a word budget and the reviewer a contract to check against.
- It makes the phone and reduced-motion versions part of the design instead of an afterthought.

## The template

Copy this block once per beat. Keep each field to one or two lines. If a field needs a paragraph, the beat is doing too much.

```text
BEAT [n]: [name in the customer's language]
Scroll range:   t = [a] to [b]        (t counts sections, 0 is the hero)
Visitor sees:   [the frame a screenshot would capture at the hold]
What moves:     [the one thing that changes, and what drives it: scroll, pointer, time, film clock, beat]
Verb:           [what the visitor does here, or "watch"]
Copy:           [headline, up to 8 words] / [body, up to 30 words] / [action label]
Camera:         [shot name, position idea, where the subject sits in frame, where the copy sits]
Phone:          [pose change, view offset, what is dropped]
Reduced motion: [the still that carries the same information]
Sound:          [optional synthesized cue, or none]
Cost:           [draw calls, texture bytes, per-frame work, risk]
Exit test:      [how a reviewer knows this beat works]
```

And one header block for the whole page:

```text
SENTENCE:   [Brand] is a site where you [verb] the [object], and it shows you [value].
WORLD:      [the artifact the page is built from: a repair order, a plan set, a roast log]
ACCENT:     [color] means [one thing]
TYPE:       [display face] + [text face]
BUDGET:     [total MB], first screen [MB], target [fps] on a mid phone
LOADER:     [how the loader speaks the world and becomes the hero]
404:        [the line in the brand's language]
```

## Worked example: Cinderford Coffee Roasters

A fictional small-batch roaster in Asheville, North Carolina, selling whole-bean subscriptions in the US.

```text
SENTENCE:   Cinderford is a site where you scroll one bean through the roast, and it shows you
            why a Tuesday roast tastes better on Thursday.
WORLD:      The roast log: a printed sheet with time, bean temperature and notes columns,
            clipped to the roaster.
ACCENT:     Ember orange #E2582B means "heat is being applied right now". Nothing else uses it.
TYPE:       A condensed grotesk for headlines, a typewriter mono for log entries.
BUDGET:     4.5 MB total, 1.6 MB first screen, 60 fps desktop, 30 fps floor on a mid phone.
LOADER:     The log's temperature column counts up from 72 F to 400 F. At 400 F the drum
            door "opens" and the loader slides away as the hero bean drops into frame.
404:        "Batch not found. It went to the cooling tray early."
```

### Timeline at a glance

| Beat | t range | Name | One line |
|---|---|---|---|
| 0 | 0 to 1 | Charge | A green bean drops onto a steel tray. Scroll applies heat. |
| 1 | 1 to 2 | Drying | The bean yellows, the log line starts, notes read "hay, fresh bread". |
| 2 | 2 to 3 | First crack | The bean splits along its seam, chaff lifts, notes turn to citrus and caramel. |
| 3 | 3 to 4 | Development | Pick light, medium or dark. The bean and the flavor bars follow. |
| 4 | 4 to 5 | The lineup | Three bags hang on the roaster rail as tags with USD prices. |
| 5 | 5 | Drop the batch | Hold to drop: the subscription form is the bottom of the log. |

### The beats

```text
BEAT 0: Charge
Scroll range:   t = 0 to 1
Visitor sees:   One pale green bean on a brushed steel tray, right third of the frame. Headline
                and log sheet on the left. Faint heat shimmer above the tray.
What moves:     Idle: the bean rocks 0.03 rad at 0.2 Hz. Scroll: uHeat rises 0 to 0.25, the bean
                warms from green toward pale straw.
Verb:           Scroll.
Copy:           "Roasted Tuesday. Brewed Thursday." / "Every bag is roasted in batches of 12
                pounds and shipped within 24 hours. Scroll to roast one bean." / "Start a
                subscription"
Camera:         Shot A, three-quarter from above, bean at 66 percent of width, slight push-in.
Phone:          Bean centered in the top 45 percent via setViewOffset (offset 0.22 x height),
                copy below, log sheet collapses to two rows.
Reduced motion: Still of the green bean with the full roast strip (green to dark) as an image
                under the headline.
Sound:          None until the visitor turns sound on. Then a low drum rumble, filtered noise at
                180 Hz low-pass.
Cost:           6 draw calls, one 1024 canvas texture for the tray label, about 0.2 ms per frame.
Exit test:      Within the first 300 px of scroll the bean visibly changes color.

BEAT 1: Drying
Scroll range:   t = 1 to 2
Visitor sees:   Close shot, bean filling 40 percent of frame, color now straw yellow. The log
                draws its first line: "4:30  310 F  hay, fresh bread".
What moves:     uHeat 0.25 to 0.5. The log line types in on scroll (characters revealed from
                scroll progress, so it reverses on scroll up).
Verb:           Scroll.
Copy:           "Drying." / "For the first four minutes the bean loses water, not flavor. This
                is where cheap roasts get rushed." / none
Camera:         Shot B, low and close, rim light catching the bean's seam.
Phone:          Same pose, closer by 15 percent, log line under the bean.
Reduced motion: Straw-yellow still and the full log line printed.
Sound:          Rumble rises 2 dB.
Cost:           Same scene, one extra DOM line. Free.
Exit test:      Scrolling back up un-types the log line and returns the green.

BEAT 2: First crack
Scroll range:   t = 2 to 3
Visitor sees:   The bean split along its seam, 40 flecks of chaff lifting and drifting up, color
                light brown. The log prints "8:10  385 F  FIRST CRACK" with the time in ember
                orange, the only accent on screen.
What moves:     At t = 2.5 a morph target opens the seam (influence 0 to 1 over 0.2 of a section).
                Chaff points rise from the seam, driven by scroll, not time, so they rewind.
Verb:           Scroll.
Copy:           "First crack." / "At 385 F the bean pops like popcorn. We listen for it, then
                decide how far to go." / none
Camera:         Shot C, push in 10 percent at the crack, then settle. A kick-style pulse of the
                key light, 2 ms attack, 300 ms release.
Phone:          Chaff count halved to 20.
Reduced motion: Still of the split bean, log line printed, no chaff.
Sound:          One synthesized crack: a 20 ms burst of high-passed noise at 2.5 kHz.
Cost:           One Points draw call, 40 vertices. Morph target on a 2,000 vertex mesh.
Exit test:      The crack lands at the same scroll position going down and up.

BEAT 3: Development
Scroll range:   t = 3 to 4
Visitor sees:   The bean centered over a three-stop scale: Light, Medium, Dark. Flavor bars
                (acidity, body, sweetness) beside it.
What moves:     A segmented control sets the roast. The bean color and the flavor bars ease to
                the new values with k = 5 damping. Spamming the control never breaks the ease.
Verb:           Choose.
Copy:           "You choose where it stops." / "Light keeps the fruit. Dark trades it for
                chocolate and body. Medium is our Tuesday default." / "Light", "Medium", "Dark"
Camera:         Shot D, straight on, bean slightly left, controls right.
Phone:          Controls become a full-width segmented row, 48 px tall.
Reduced motion: Choice still works, values jump instead of easing.
Sound:          A soft tick per selection.
Cost:           Uniform changes only.
Exit test:      The choice persists into Beat 4 (the matching bag is highlighted).

BEAT 4: The lineup
Scroll range:   t = 4 to 5
Visitor sees:   Three bags hanging on the roaster's rail as paper hang tags: "Blue Ridge
                Breakfast $17", "Tuesday Medium $18", "Cinder Dark $18", each 12 oz.
What moves:     Tags swing in on their strings from scroll, with a damped sway after.
Verb:           Pick a bag.
Copy:           "Three roasts. One schedule." / "Ships every 2 or 4 weeks. Skip or cancel from
                the email." / "Add to subscription"
Camera:         Shot E, wide, rail across the top third.
Phone:          Tags stack vertically as DOM cards, no 3D.
Reduced motion: Tags shown at rest.
Sound:          A paper flutter on hover, if sound is on.
Cost:           DOM and CSS transforms only.
Exit test:      Each tag is a real button with a 44 px or taller target and a visible focus ring.

BEAT 5: Drop the batch
Scroll range:   t = 5 (final hold)
Visitor sees:   The bottom of the roast log, with the subscription form filled in as the
                customer section: name, email, roast, cadence.
What moves:     "Hold to drop the batch" fills the button over 1.0 s. On completion the beans
                pour into the cooling tray and the form confirms.
Verb:           Hold.
Copy:           "Your batch roasts Tuesday." / "First bag ships within 24 hours of roasting.
                Free shipping in the US." / "Hold to drop the batch"
Camera:         Shot F, top-down onto the cooling tray.
Phone:          Same, the hold works with touch.
Reduced motion: A normal submit button. No pour animation.
Sound:          A rising rumble during the hold, a pour of filtered noise at release.
Cost:           One instanced mesh of 300 beans for 1.5 s, then hidden.
Exit test:      Releasing early cancels with no side effects. Keyboard users can submit with Enter.
```

## Checks before you build

- The sentence names a verb the visitor actually performs in at least two beats.
- Every beat has exactly one "What moves". Two means split the beat or cut one.
- The accent color appears only where the WORLD line says it means something.
- Total copy is under about 250 words above the footer. Motion sites die under walls of text.
- Every beat has a reduced-motion still that carries the same information.
- The sum of the Cost lines fits the BUDGET line.
- The phone column never says "same" for a beat with a wide 3D composition.
