# Scroll and camera

Recipes R01 to R05. These are the skeleton of every scroll story: one number from the scroll position, a camera that holds and travels, a phone framing that is designed rather than squeezed, damping that feels physical, and a mode value that lets one scroll range change the whole world.

All snippets assume the import map from the [skill](../../SKILL.md) and `import * as THREE from "three"`.

---

## R01. Section-centered scroll value

**What it is.** A single float `t` that counts sections: `t = 0` when the first section's center is at the middle of the viewport, `t = 2.5` halfway between the centers of sections 2 and 3. Every system on the page reads `t`.

**When to use.** Any story where sections have different heights. Better than raw `scrollY / maxScroll`, because each beat gets the scroll room its content needs and the camera lands exactly when its copy is centered.

**Premium values.** Sections at least `100svh` tall, the hero about `120svh` so the first hold has room. Remeasure after fonts load and whenever the body resizes (images arriving change offsets).

```js
// t counts sections; t = 2.5 is halfway between the centers of sections 2 and 3
export function createScrollT(selector = ".shot") {
  const sections = [...document.querySelectorAll(selector)];
  let centers = [];
  const measure = () => {
    centers = sections.map((s) => { const r = s.getBoundingClientRect(); return r.top + scrollY + r.height / 2; });
  };
  addEventListener("resize", measure);
  addEventListener("load", measure);
  document.fonts?.ready.then(measure);
  new ResizeObserver(measure).observe(document.body);
  measure();
  return {
    sections,
    measure,
    get() {
      const c = scrollY + innerHeight / 2;
      if (!centers.length || c <= centers[0]) return 0;
      for (let i = 0; i < centers.length - 1; i++) {
        if (c < centers[i + 1]) return i + (c - centers[i]) / (centers[i + 1] - centers[i]);
      }
      return centers.length - 1;
    },
  };
}
```

**Phone.** Use `svh` units, not `vh`, so the collapsing address bar does not shift every center.

**Reduced motion.** `t` still works. It drives which still or which copy state is shown, with no tweening.

**Cost.** One loop over a handful of numbers per frame. Free.

---

## R02. Shot list with smoothstep holds

**What it is.** The camera moves between named shots, one per section. Inside each segment a smoothstep from 0.15 to 0.85 makes the camera hold at both ends and travel in the middle, so every shot has a resting frame for its copy.

**When to use.** Any 3D scroll story with a hero object. Write the shots from the beat sheet, one comment per shot naming where the subject and the copy sit.

**Premium values.** Hold window 0.12 to 0.18 per side. Lens 30 to 35 degrees on desktop for product work (long lenses look expensive), 42 to 48 on portrait screens. Keep consecutive shots on the same side of the subject or route through a waypoint.

```js
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const SHOTS = [
  { pos: V(3.8, 4.9, 10.2), at: V(-2.9, -0.35, 0.2) }, // hero: subject right of the copy
  { pos: V(8.4, 5.6, 6.6), at: V(-1.5, 1.35, 0.3) },   // exploded view, panel on the left
  { pos: V(-2.0, 14.8, 4.0), at: V(-2.3, 0, 2.25) },   // top-down detail
];
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const pos = new THREE.Vector3(), at = new THREE.Vector3();

export function placeCamera(camera, shots, t, hold = 0.15) {
  const i0 = Math.min(shots.length - 1, Math.floor(t)), i1 = Math.min(shots.length - 1, i0 + 1);
  const f = smooth(hold, 1 - hold, t - i0);
  pos.lerpVectors(shots[i0].pos, shots[i1].pos, f);
  at.lerpVectors(shots[i0].at, shots[i1].at, f);
  camera.position.copy(pos);
  camera.lookAt(at);
}
```

When two shots sit on opposite sides of the subject, a straight lerp cuts through it. Interpolate around the subject instead:

```js
const sA = new THREE.Spherical(), sB = new THREE.Spherical(), tA = new THREE.Vector3(), tB = new THREE.Vector3();
// orbit from a to b around pivot, taking the short way round
export function orbitLerp(out, a, b, pivot, f) {
  sA.setFromVector3(tA.subVectors(a, pivot));
  sB.setFromVector3(tB.subVectors(b, pivot));
  let d = sB.theta - sA.theta;
  if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
  return out.setFromSphericalCoords(
    sA.radius + (sB.radius - sA.radius) * f, sA.phi + (sB.phi - sA.phi) * f, sA.theta + d * f,
  ).add(pivot);
}
```

Add life after the lerp, never instead of it: a damped cursor look (R04), an idle drift at 0.2 to 0.35 Hz with 0.1 to 0.25 units of amplitude, and on beat-driven pages a push toward the target of about 2 percent on each kick (R20).

A capture hook makes review screenshots exact. `?shot=3` lands on the hold of section 3:

```js
const q = new URLSearchParams(location.search).get("shot");
if (q !== null) addEventListener("load", () => {
  const s = document.querySelectorAll(".shot")[+q];
  if (s) scrollTo(0, s.offsetTop + s.offsetHeight / 2 - innerHeight / 2);
});
```

**Phone.** Use a separate shot list (R03).

**Reduced motion.** Snap to the nearest shot (`Math.round(t)`) with no lerp, or render one still per section.

**Cost.** Free. The shot list is data.

---

## R03. Phone framing with setViewOffset

**What it is.** On a portrait phone the copy usually covers the bottom half of the screen. Instead of squeezing the desktop shot, aim the camera from the same side but far enough to fit the subject's width, then shift the projection with `camera.setViewOffset` so the subject renders in the top part of the screen, above the copy.

**When to use.** Every 3D page that has copy over the canvas on phones.

**Premium values.** View offset `0.18` to `0.24` of the screen height. Lens 42 to 48 degrees when `aspect < 1`. Subject width fills 80 to 90 percent of the screen width at the hold.

```js
const PHONE_WIDTH = 760;
// fit an object of the given width inside the horizontal field of view, with a margin
export function fitDistance(width, camera, margin = 1.25) {
  const v = THREE.MathUtils.degToRad(camera.fov);
  const h = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
  return (width / 2 / Math.tan(h / 2)) * margin;
}
// phone shots: same sides as desktop, built from a direction and a distance
export const makePhoneShots = (list) =>
  list.map((p) => ({ at: p.at, pos: p.at.clone().add(p.dir.clone().normalize().multiplyScalar(p.dist)) }));

export function frameForDevice(camera, renderer) {
  const phone = innerWidth < PHONE_WIDTH;
  renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? 42 : 30;
  // shifting the view window down moves the picture up, above the copy
  if (phone) camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.22, innerWidth, innerHeight);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  return phone;
}
```

Usage: build `PHONE` with `makePhoneShots([{ at: new THREE.Vector3(0, 0, 0), dir: new THREE.Vector3(0.25, 0.55, 1), dist: 19 }])`, compute `dist` once from `fitDistance(subjectWidth, camera)` after the first resize, and pick `phone ? PHONE : SHOTS` in the frame loop.

**Phone.** This is the phone recipe. Also drop bloom resolution to half the screen and cap the pixel ratio at 1.5.

**Reduced motion.** Same framing, fixed shot.

**Cost.** Free. A view offset is a projection change, not a second render.

---

## R04. Damped follow for scroll and pointer

**What it is.** Exponential damping that behaves the same at 30, 60 and 120 fps: `x += (target - x) * (1 - exp(-k * dt))`. A fixed `x += (target - x) * 0.1` runs twice as fast on a 120 Hz screen.

**When to use.** Cursor look on cameras, eased scroll for photo stages, UI that chases a value, color and material changes when a variant is picked.

**Premium values.** `k = 3` for a heavy camera look, `k = 5` for eased scroll and material changes, `k = 6` to `8` for small UI followers. Cursor look amplitude about 0.9 units sideways and 0.5 vertically on a 10 unit camera distance.

```js
export const damp = (x, target, k, dt) => x + (target - x) * (1 - Math.exp(-k * dt));

const look = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return; // fingers scroll, they do not aim the camera
  look.tx = e.clientX / innerWidth - 0.5;
  look.ty = e.clientY / innerHeight - 0.5;
}, { passive: true });

// inside the frame loop, after placeCamera() and before lookAt is final:
export function applyLook(camera, target, dt, still) {
  look.x = damp(look.x, look.tx, 3, dt);
  look.y = damp(look.y, look.ty, 3, dt);
  if (still) return;
  camera.position.x += look.x * 0.9;
  camera.position.y -= look.y * 0.5;
  camera.lookAt(target);
}
```

Eased scroll is a choice, not a default. Ease `t` (with `k = 5`) when the canvas is a photo or a slow world and nothing on it must line up with DOM text. Use raw `t` when DOM callouts or labels are pinned to 3D points (R06), or they will float against the copy.

**Phone.** Skip the cursor look on touch input. Idle drift can run 1.3 times larger, since phones have no pointer life.

**Reduced motion.** Freeze the look at zero.

**Cost.** Free.

---

## R05. Mode value: one scroll range changes the world

**What it is.** A single 0 to 1 value derived from `t` that turns the whole scene from one mode to another: night city to paper map, raw product to finished, today to the plan. Everything that differs between the modes reads the same value, so they can never drift out of sync, and scrolling back reverses all of it.

**When to use.** Any beat where the world itself changes, not just the camera. It pairs with morph targets (R07), the sky dome (R09) and shader uniforms (R08).

**Premium values.** Enter over about 0.6 of a section, leave over about 0.55, never instantly. Toggle CSS classes at `m > 0.5` and only when the state changes. Hide meshes whose contribution is invisible (`m > 0.995`) to save draw calls.

```js
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const NIGHT = new THREE.Color(0x070b14), PAPER = new THREE.Color(0xf3efe6);
const fogNight = new THREE.Color(0x0b1222);

// the map mode rises through section 1 and falls away at the end of section 2
export function applyMode(t, { scene, uniforms, bloom, town, sky }) {
  const m = smooth(0.25, 0.85, t) * (1 - smooth(2.3, 2.85, t));
  uniforms.uFlat.value = m;                       // buildings flatten in their shader
  scene.background.copy(NIGHT).lerp(PAPER, m);
  scene.fog.color.copy(fogNight).lerp(PAPER, m);
  scene.fog.near = 30 + m * 200;                  // fog pushes away so the paper reads clean
  scene.fog.far = 75 + m * 300;
  bloom.strength = 0.42 * (1 - m);                // glow belongs to the night only
  sky.material.uniforms.uFade.value = 1 - m;
  sky.visible = m < 0.99;
  town.visible = m < 0.995;
  const paper = m > 0.5;
  if (paper !== document.body.classList.contains("paper")) document.body.classList.toggle("paper", paper);
  return m;
}
```

`scene.background` must be a `THREE.Color` and `scene.fog` a `THREE.Fog` for this to work.

**Phone.** Same values. The mode is cheap.

**Reduced motion.** Treat `m` as a step at the section boundary: show the night still before, the paper still after.

**Cost.** A few uniform writes per frame. The win is consistency, not speed.
