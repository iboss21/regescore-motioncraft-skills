# Page architecture

Template sameness is the fastest way to make expensive motion look cheap. The same sticky top bar, centered hero, three feature cards, logo strip and pricing table under a new shader reads as a theme, not a site. This file gives an agent named patterns to pick from, a rule for picking them, and a check that catches repeats.

## The rule

**The structure comes from the same world as the idea.** If the idea is a roast log, the page is a roast log: its columns are the sections, its header is the hero, its footer is the form. Pick the artifact first, then map each pattern below onto it. A pattern that has no counterpart in the customer's world is the wrong pattern.

## Nav archetypes

| ID | Pattern | What it is | Fits | Motion hook | Watch out |
|---|---|---|---|---|---|
| N1 | **Line diagram** | Sections are stops on a vertical or horizontal transit line. A marker travels between stops with scroll. | Transit, logistics, timelines, onboarding | Marker position is `t` from the scroll mapping, so it is exact both ways. | Labels must stay readable at 11 px on phones. Collapse to the current stop on narrow screens. |
| N2 | **Sheet tabs** | Tabs down the right edge like a drawing set (C-1, C-2). The current sheet's tab sticks out. | Construction, architecture, engineering, legal | The tab offset eases with the current section. | Keep tabs at least 44 px tall. |
| N3 | **Agenda** | Sections are numbered agenda items (Item 4.1). The nav is the agenda itself, expanded on hover or focus. | Cities, boards, events, conferences | Item numbers tick as you pass them. | Do not hide the agenda behind a hamburger on desktop. |
| N4 | **Pattern banks** | A row of bank buttons (A B C D) like a drum machine. The current bank lights. | Music, audio gear, studios, creative tools | The lit bank can pulse on the beat. | Pair every bank letter with a visible text label. |
| N5 | **Registration marks** | Print crop and registration marks in the margin act as anchors. | Print shops, resumes, publishers, design studios | Marks rotate slightly when their section is current. | Marks are decorative to sighted users; give each link real text for screen readers. |
| N6 | **Ticket number** | One control shows the order or ticket number with colored copy tabs (white, yellow, pink) that jump to sections. | Garages, repair, dry cleaning, service desks | The current copy tab lifts. | Only 3 to 5 sections fit this pattern. |
| N7 | **Vital strip** | A thin status strip with live readouts (clinicians on shift, wait time) that doubles as nav. | Telehealth, support, operations, dashboards | Numbers update from real local time. | Live numbers must be honest or clearly labeled as a demo. |
| N8 | **Command bar** | A search field opened with `/` that lists sections and actions, arrow keys to choose, Enter to go. | Software, real estate tours, catalogs, docs | Results filter as you type. | Needs full combobox semantics (`aria-expanded`, `aria-activedescendant`). |
| N9 | **Lap button** | One button that advances to the next section and shows "Lap 2 of 4". | Fitness, cycling, running, racing | The lap counter flips like a split timer. | Also provide a plain list of sections in the footer. |
| N10 | **Floor plan** | A small plan of the place with rooms as anchors. "You are here" moves with scroll. | Hotels, galleries, restaurants, venues | A view cone rotates toward the current room. | The plan must be an accessible list underneath the SVG. |

## Hero compositions

| ID | Pattern | What it is | Motion hook | Phone treatment |
|---|---|---|---|---|
| H1 | **Object in the right third** | One hero object sits in the right third of a live 3D frame; headline and action on the left. | Camera holds, idle sway, cursor look. | `setViewOffset` lifts the object above the copy. |
| H2 | **Subject over huge type** | Giant wordmark on a 3D plane between the subject and the background, so the subject occludes it by depth. | Letters rise one by one after the subject settles. | Fit the wordmark to the visible slice of the frame. |
| H3 | **Film with timed copy** | Full-bleed loop or play-once film. Copy enters and leaves on the film's own clock so the best moment is clean. | Copy cues keyed to `video.currentTime`. | The film's object position follows the subject. |
| H4 | **Tabletop** | Straight top-down view of objects on a surface, like a product shot on a table. | Objects respond to the pointer as if nudged. | Tighter crop, fewer objects. |
| H5 | **The document** | The hero is the artifact itself: a repair order header, a roast log, a plan title block, filled with brand facts. | Fields type in, stamps land. | The document reflows to one column. |
| H6 | **Split world** | Two states of one place side by side or behind a draggable divider: today and the plan, raw and finished. | Drag the divider, or hold to switch. | The divider becomes a hold or a toggle. |
| H7 | **Loader becomes hero** | The loading indicator is a domain object (a temperature count, a gauge, a departures board) that turns into the hero instead of disappearing. | One continuous transition, no fade to white. | Same, shorter. |
| H8 | **Porthole** | The scene is framed by a domain frame: a headset visor, a ship porthole, a camera viewfinder, a shop window. | The frame tracks or breathes with the scene. | The frame thickens to keep the scene readable. |

## Section types

Pick each section from this list or invent one from the customer's world. Never use the same section type twice in a row.

| ID | Pattern | What it shows | Motion hook |
|---|---|---|---|
| S1 | **Exploded view** | The product's internals lifted apart with pinned DOM callouts. | One `explode` value from 0 to 1 drives every part. |
| S2 | **Mode morph** | The 3D world turns into its diagram: city into transit map, terrain into contour plan. | Morph targets and a mode value fade sky, fog and lights together. |
| S3 | **Live tool** | A working planner, calculator, symptom check or configurator. | Results animate in, but the tool works without motion. |
| S4 | **Spec plate** | Numbers set like a stamped metal plate or a nutrition label. | Digits roll to value when the section becomes current. |
| S5 | **Hang tags** | Products or plans as paper tags on strings with prices. | Tags swing in and settle with damped sway. |
| S6 | **Departures board** | Live rows with times computed from the visitor's clock. | Rows tick each second, "Now" replaces a minute count. |
| S7 | **Look-around room** | Drag a wide photo to look around a room; a plan shows the view cone. | Idle pan after 2 seconds without input, turning at the walls. |
| S8 | **Roster by your clock** | Who is on shift now, computed from local time. | Badges change state as shifts start. |
| S9 | **Ledger** | A log or ledger table that fills as you scroll (roast log, ride log, ship's log). | Characters revealed from scroll progress so it reverses. |
| S10 | **Field guide** | Cards like a naturalist's guide with a specimen illustration and notes. | Cards flip from sketch to color. |
| S11 | **Contact sheet** | Work samples as a photographic contact sheet with grease-pencil marks. | The chosen frame enlarges into the next section. |
| S12 | **Ride along** | The camera follows one moving object (a train, a courier, a boat) for one section. | The shot pose is computed from the object's path each frame. |
| S13 | **Back panel** | The rear of the product with every port and connection labeled. | The camera orbits around to it; labels pin to 3D anchors. |
| S14 | **Title block form** | The contact or order form is the last block of the artifact (the customer section of a repair order, the bid block of a plan set). | Fields are the artifact's own fields, the submit is a stamp. |

## Footers and 404s

| ID | Pattern | Example line |
|---|---|---|
| F1 | **End of the line** | The nav's last stop is the footer: hours, address, contact. "Last stop: Harbor Point. Doors on the right." |
| F2 | **Signed and stamped** | The artifact gets its signature line and a dated stamp. |
| F3 | **404 in the trade's words** | "Part on backorder." "Batch not found." "This stop is not in service." |
| F4 | **Idle reward** | After 60 seconds idle the hero object returns as a small screensaver until moved. |

## Example combinations

| Fictional brand | World | Nav | Hero | Sections | Footer |
|---|---|---|---|---|---|
| Cinderford Coffee Roasters, Asheville | Roast log | N9 Lap button | H7 Loader becomes hero | S9, S3, S5, S14 | F3 |
| Lakemont Transit Authority, Milwaukee | Station | N1 Line diagram | H1 Object in the right third | S2, S3, S12, S6 | F1 |
| Brightwater Dental, Tucson | Patient chart | N7 Vital strip | H3 Film with timed copy | S8, S3, S4, S14 | F2 |
| Coldspring Audio, Austin | Studio patch bay | N4 Pattern banks | H1 Object in the right third | S1, S3, S13, S4, S14 | F3 |
| Westbrook Home Scans, Denver | Floor plan | N8 Command bar | H8 Porthole | S7, S3, S14 | F4 |

## Sameness check

Before building, compare the plan with the last five sites you built or saw in the same catalog. Score one point for each match:

1. Nav in the same place with the same shape.
2. Same hero composition ID.
3. Same first three section IDs in the same order.
4. Same card shape (radius, border, shadow) for repeated items.
5. Same typeface pairing.
6. Same accent hue within 20 degrees.
7. Same button shape and label style.
8. Same footer pattern.

**Three or more points means change the plan.** Swap the two highest-impact items (usually nav and hero) for patterns from the customer's world, then score again.

## Architecture card

Record this in the project README so later builds can run the sameness check against it.

```text
ARCHITECTURE: [brand]
World:     [artifact]
Nav:       [ID and name], [one line on how it maps to the world]
Hero:      [ID and name]
Sections:  [ID list in order]
Footer:    [ID], 404 line: "[text]"
Type:      [display] + [text]
Accent:    [hex] = [meaning]
Shape:     [corner radius, border style, card style in one line]
```
