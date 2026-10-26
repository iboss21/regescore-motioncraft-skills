---
name: motioncraft-builder
description: Build a cinematic, award-level motion website or hero section (scroll-driven three.js scenes, film-led heroes, depth-photo parallax, synthesized sound, live 3D callouts) from one idea taken from the customer's own world. Use when someone asks for a premium animated landing page, a scroll story, a 3D product page, a video hero, an "Awwwards-style" or "expensive feeling" site, or wants a brief turned into a beat sheet, a grey-boxed mechanic and a dressed, accessible, fast page. Do not use for flat SaaS layouts, simple CSS fade-ins or static brochure pages.
---

# MotionCraft Builder

This skill teaches an agent to build motion websites the way small studios ship award work: one idea, a written plan, a working mechanic in grey boxes, then dressing, then a hard look and a fix pass. The craft lives in the references. This file is the workflow.

**Default stack:** semantic HTML, CSS, vanilla JavaScript modules, three.js 0.170 through an import map, no build step. Add GSAP or Lenis only when a recipe needs them. Every page must work, read and convert with WebGL turned off.

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>
```

## The workflow

Run these steps in order. Do not skip ahead to effects. Each step has an output you can show the person before moving on.

### Step 1. Find the one idea

Read the brief and list the customer's real world: the objects they handle, the paperwork they print, the sounds of the place, the verbs their staff use all day. Then write one sentence:

> **[Brand] is a site where you [verb] the [object from their world], and it shows you [the value they sell].**

Examples with fictional brands:

- Cinderford Coffee Roasters: you scroll a single bean through the roast, green to first crack to full city, and the flavor notes print on the roast log as the color changes.
- Lakemont Bike Fitters: you drag a rider's saddle height and the knee angle arc redraws on the live side view.
- Halvorsen Tide Charters: you scrub the tide clock and the boat rises and falls against the real dock.

Rules for the idea (see [craft rules 1 to 3](references/craft-rules.md#a-the-idea)):

- One object, one verb, one world. If you need "and" twice, it is two ideas. Pick one.
- The metaphor comes from the customer's world, never from a trend. A garage speaks in repair orders, a grocer in weekly circulars, a transit agency in line diagrams.
- Give the accent color one job. If red means "a fault was found", it means nothing else anywhere on the page.
- The loader, cursor, nav, hover states, transitions and the 404 all speak the same language.

**Output:** the sentence, the verb, the accent color and its meaning, and three rejected ideas with one line on why each lost.

### Step 2. Choose a page architecture

Open [page-architecture.md](references/page-architecture.md). Pick a nav archetype, a hero composition and a section sequence that come from the same world as the idea. Never reuse the previous project's skeleton. Log the choice in the project README so the next build can avoid it.

**Output:** a short architecture card (nav, hero, section list, footer, 404) with the named patterns you used.

### Step 3. Write the beat sheet

Write the screenplay before any code. Use the template in [beat-sheet.md](references/beat-sheet.md). Each beat states its scroll range, what the visitor sees, what moves, the copy, the camera, the phone framing, the reduced-motion version and the cost. The worked example shows the level of detail expected.

**Output:** the filled beat sheet. Every later decision is checked against it. If a section does not serve the sentence from Step 1, cut it here, where it is cheap.

### Step 4. Grey-box the mechanic

Build the motion with placeholder geometry and placeholder copy. This step proves timing, camera and interaction before any asset exists.

1. Write the DOM first: real headings, real copy blocks, real buttons and forms, one `<section class="shot">` per beat. The page must read top to bottom with scripts off.
2. Add one fixed canvas behind the DOM and one render loop. Scroll, pointer, audio and render share that loop (rule 8).
3. Map scroll to a single float `t` that counts beats, and move the camera through a shot list with smoothstep holds ([scroll and camera recipes](references/techniques/scroll-and-camera.md)).
4. Use grey boxes, spheres and planes for every object. If the story does not work in grey, dressing will not save it.
5. Add the pause control and the reduced-motion branch now, not at the end ([interaction recipes](references/techniques/interaction-and-access.md)).

Grey-box starter. The page needs the import map above, a fixed canvas and one `.shot` section per entry in `SHOTS`:

```html
<style>
  #gl { position: fixed; inset: 0; width: 100%; height: 100%; z-index: -1; display: block; }
  .shot { min-height: 100svh; display: grid; align-items: center; padding: 16px 6vw; }
  .no-gl #gl { display: none; }
</style>
<canvas id="gl" aria-hidden="true"></canvas>
<main>
  <section class="shot" id="top"><h1>Headline from beat 0</h1></section>
  <section class="shot" id="detail"><h2>Beat 1</h2></section>
  <section class="shot" id="side"><h2>Beat 2</h2></section>
</main>
<script type="module" src="main.js"></script>
```

`main.js`:

```js
import * as THREE from "three";

const canvas = document.getElementById("gl");
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
catch { document.body.classList.add("no-gl"); } // the DOM page stands on its own

if (renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111114);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 1.4));
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  // grey stand-in for the hero object until the beat sheet is signed off
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1.2), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.6 })));

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const SHOTS = [
    { pos: V(4, 3, 8), at: V(-1.5, 0, 0) },  // hero: object right of the headline
    { pos: V(0, 9, 0.1), at: V(0, 0, 0) },   // top-down detail
    { pos: V(-6, 1.2, 3), at: V(1.5, 0, 0) }, // low side, copy on the right
  ];
  const sections = [...document.querySelectorAll(".shot")];
  let centers = [];
  const measure = () => { centers = sections.map((s) => s.offsetTop + s.offsetHeight / 2); };
  const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  function scrollT() {
    const c = scrollY + innerHeight / 2;
    if (!centers.length || c <= centers[0]) return 0;
    for (let i = 0; i < centers.length - 1; i++) if (c < centers[i + 1]) return i + (c - centers[i]) / (centers[i + 1] - centers[i]);
    return centers.length - 1;
  }
  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 1.75));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    measure();
  }
  addEventListener("resize", resize);
  document.fonts?.ready.then(measure);
  resize();

  const pos = new THREE.Vector3(), at = new THREE.Vector3();
  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    const t = scrollT(), i0 = Math.floor(t), i1 = Math.min(SHOTS.length - 1, i0 + 1);
    const f = smooth(0.15, 0.85, t - i0); // hold on each shot, travel in the middle
    pos.lerpVectors(SHOTS[i0].pos, SHOTS[i1].pos, f);
    at.lerpVectors(SHOTS[i0].at, SHOTS[i1].at, f);
    camera.position.copy(pos);
    camera.lookAt(at);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf); // never run two loops
    if (!document.hidden) raf = requestAnimationFrame(frame);
  });
}
```

**Exit criteria for Step 4:** scroll forward and backward through every beat and the camera lands the same way both directions; every shot leaves room for its copy; the phone framing works at 390 x 844; the pause control stops all continuous motion; the page reads with WebGL disabled.

### Step 5. Dress it

Now replace the grey with the world. Pull recipes from the [technique index](references/techniques/INDEX.md). Dress in this order, checking the beat sheet after each layer:

1. **Form:** the hero object, built from primitives, a glTF, a film or a depth photo.
2. **Light:** key, rim and one motivated accent light. Contact shadows under anything that sits on a surface.
3. **Material and texture:** canvas-drawn labels and faceplates before photo textures. They are sharp, tiny and editable.
4. **Type:** two typefaces at most. Headline motion tied to the page's rhythm, never a generic fade.
5. **Sound:** optional, opt-in, synthesized with Web Audio so it costs no bytes.
6. **Small rewards:** one hidden gesture, an idle state, a 404 in the brand's language.

Spend frame time on interaction, not on physics nobody notices. Fake what is expensive (rule 17).

### Step 6. Look and fix

You have not finished until you have looked. Hand the page to the **motion-review** skill ([../motion-review/SKILL.md](../motion-review/SKILL.md)) for the rubric, the QA checklist and section screenshots at desktop and phone sizes, and to the **motion-analytics** skill ([../motion-analytics/SKILL.md](../motion-analytics/SKILL.md)) for frame-time, weight and reference-comparison grading. Then fix the worst finding first and look again. Two full look-and-fix passes is the minimum for anything you call finished.

Fast self-checks before a formal review:

- Scroll down, then all the way back up. Every reveal must reverse cleanly.
- Press the pause control mid-motion. Everything continuous must stop, and the page must still look composed.
- Turn on reduced motion in the OS. The page must tell the same story with stills.
- Open the console. Zero errors, zero warnings you caused.
- Phone width 390 px: no text under 11 px, no tap target under 44 px, no horizontal scroll.

### Step 7. Ship

Deliver the page folder (`index.html`, `style.css`, `main.js` plus modules, `assets/`), a README with the one-sentence idea, the architecture card, the beat sheet, the asset list with licenses, and the tuning values worth changing. Keep the whole page under 10 MB.

## Non-negotiables

- Real HTML underneath. Content, nav and forms live in the DOM. WebGL is an enhancement with a `no-gl` fallback.
- One clock. Never put per-frame values in framework state. Use plain variables, uniforms and CSS custom properties.
- A visible pause control for any motion that runs longer than 5 seconds, plus a full `prefers-reduced-motion` branch.
- Scroll is never hijacked. The native scrollbar works, keyboard scrolling works, and anchor links jump.
- Fictional brands and invented people in demos. Never copy code, copy text, assets or a hero concept from a reference site. Study the idea, write your own.
- Every number in the page (prices, hours, stats) is plausible, consistent and in the customer's locale.

## Reference map

| File | Use it when |
|---|---|
| [references/craft-rules.md](references/craft-rules.md) | Making any taste call. 30 numbered rules with concrete values. |
| [references/beat-sheet.md](references/beat-sheet.md) | Planning the story. Template plus a worked example. |
| [references/page-architecture.md](references/page-architecture.md) | Choosing nav, hero and sections without template sameness. |
| [references/techniques/INDEX.md](references/techniques/INDEX.md) | Looking up a recipe by need, cost or wow. |
| [techniques/scroll-and-camera.md](references/techniques/scroll-and-camera.md) | Scroll mapping, camera shots, phone framing, mode values. |
| [techniques/scene-craft.md](references/techniques/scene-craft.md) | three.js dressing: callouts, morphs, cities, skies, labels, shadows. |
| [techniques/film-and-photo.md](references/techniques/film-and-photo.md) | Video heroes, loops, film-timed copy, tracked hotspots, depth photos. |
| [techniques/sound-and-rhythm.md](references/techniques/sound-and-rhythm.md) | Web Audio voices, scheduling, beat-synced visuals. |
| [techniques/interaction-and-access.md](references/techniques/interaction-and-access.md) | Pause control, anchors, hold gates, drag views, quality tiers. |

---

Part of [RegesCore AI MotionCraft Skills](https://github.com/iboss21/regescore-motioncraft-skills) by LIKE A KING INC. Free motion templates and the full catalog live at [animatedwebs.com](https://animatedwebs.com).
