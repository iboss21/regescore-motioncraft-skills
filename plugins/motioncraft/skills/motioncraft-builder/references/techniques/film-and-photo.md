# Film and photo

Recipes R13 to R17. Footage and photographs carry realism no real-time scene can match on a phone. These recipes make them feel directed rather than dropped in: a film that plays once and lands on a sharper still, a loop with no seam, copy that moves to the film's own clock, labels pinned to things inside the footage, and a photograph that turns into a small 3D set.

---

## R13. Play-once hero film that hands over to a still

**What it is.** A short hero film (an arrival, a landing, a reveal) plays one time, ends exactly on a frame that matches a high-resolution still, then dissolves into that still. The visitor sees motion first, then studies a frame twice as sharp as the film.

**When to use.** Heroes with a natural arrival: a bird landing, a door opening, a product settling, a dish being plated. Not for ambient footage (use R14).

**Premium values.** Film 4 to 8 seconds, H.264, no audio track, `+faststart`. Still exported from the same master at twice the film's width (3840 for a 1920 film). Dissolve 0.3 to 0.6 seconds. Copy arrives 0.3 to 0.6 seconds before the end, while the subject is still settling, like a title cut to the action. Film and still share one color grade (rule 21).

```html
<div class="hero-media" id="heroMedia">
  <img class="hero-still" src="assets/hero-1920.webp" srcset="assets/hero-1920.webp 1920w, assets/hero-3840.webp 3840w"
       sizes="100vw" alt="A heron settling on a cedar piling at sunrise" fetchpriority="high">
  <video class="hero-film" id="heroFilm" muted playsinline preload="auto" poster="assets/poster.webp"
         src="assets/hero-once.mp4" aria-hidden="true"></video>
</div>
```

```css
.hero-media { position: relative; overflow: hidden; min-height: 100svh; }
.hero-media > img, .hero-media > video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero-film { transition: opacity .45s ease; }
.hero-media.landed .hero-film { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .hero-film { display: none; } }
```

```js
const media = document.getElementById("heroMedia"), film = document.getElementById("heroFilm");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
let landed = false;
function land() {
  if (landed) return;
  landed = true;
  media.classList.add("landed");
  document.body.classList.add("arrive");
  media.dispatchEvent(new CustomEvent("landed"));
  setTimeout(() => film.remove(), 700); // free the decoder once the dissolve is done
}
if (reduce.matches) land();
else {
  film.addEventListener("ended", land);
  film.addEventListener("error", land);
  film.addEventListener("timeupdate", () => { if (film.duration - film.currentTime < 0.5) document.body.classList.add("arrive"); });
  film.play().catch(land); // autoplay refused (low power mode): go straight to the still
  setTimeout(() => { if (film.readyState < 2) land(); }, 4000); // a stalled film never strands the visitor
}
```

The poster is the film's first frame; the still is its last. Encode with `ffmpeg -i master.mov -an -c:v libx264 -crf 21 -preset slow -pix_fmt yuv420p -movflags +faststart -vf scale=1920:-2 hero-once.mp4`.

**Phone.** Serve the 1920 still, not the 3840. Set `object-position` so the subject stays in the visible slice of a portrait screen.

**Reduced motion.** The film never loads. The still is there from the first paint.

**Cost.** One film download (aim for 1.5 to 3 MB) and one still. Decoder freed after landing.

---

## R14. Ping-pong video loop

**What it is.** A loop made from a clip played forward, then backward, encoded as one file. A forward-only loop jumps at the seam; a forward-and-back loop has no seam at all.

**When to use.** Subjects with no obvious direction of time: hovering, breathing, hair or fabric in wind, water surfaces, slow light changes, a camera drift. Avoid it for walking, pouring, smoke or anything with gravity, where reversal is obvious.

**Premium values.** 4 to 6 seconds forward, so 8 to 12 seconds per loop. Drop the duplicate frame at the turn. Keep the camera move slow so the reversal reads as a drift, not a rewind.

```bash
# forward then reversed, minus the duplicated turnaround frame; the reverse filter holds every frame in memory,
# so keep the source clip short
ffmpeg -i take.mp4 -filter_complex \
  "[0:v]trim=start=0:end=5,setpts=PTS-STARTPTS,split[f][r];[r]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[rv];[f][rv]concat=n=2:v=1:a=0[out]" \
  -map "[out]" -an -c:v libx264 -crf 22 -pix_fmt yuv420p -movflags +faststart loop.mp4
```

```html
<video class="loop" autoplay muted loop playsinline preload="auto" poster="assets/loop-poster.webp" src="assets/loop.mp4" aria-hidden="true"></video>
```

```js
// pause when off screen, when the tab is hidden, or when the visitor pauses motion
const film = document.querySelector(".loop");
let paused = matchMedia("(prefers-reduced-motion: reduce)").matches, onScreen = true;
export const syncLoop = () => { if (!paused && onScreen && !document.hidden) film.play().catch(() => {}); else film.pause(); };
export const setLoopPaused = (p) => { paused = p; syncLoop(); };
new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; syncLoop(); }).observe(film);
document.addEventListener("visibilitychange", syncLoop);
syncLoop();

// frame index into forward-only tracking data, for a loop of n forward frames at fps
export function pingPongFrame(t, fps, n) {
  let f = ((t * fps) % (2 * n) + 2 * n) % (2 * n);
  if (f > n) f = 2 * n - f;
  return f;
}
```

`pingPongFrame` lets you track a subject over the forward half only (R15, R16) and reuse the data for the reversed half.

**Phone.** Same file, or a 1280 wide version under 2 MB. Follow the subject with `object-position` on narrow screens.

**Reduced motion.** Do not autoplay. Show the poster.

**Cost.** One looping decode. Pause it whenever it is off screen.

---

## R15. Film-clock cues: copy that moves on the film's timeline

**What it is.** Hero copy enters and leaves on the film's own clock (`video.currentTime`), not on a timer, so every loop has a stretch where the subject is alone on screen at its best moment, and the copy returns before the next one.

**When to use.** Film heroes where the subject crosses the area the copy sits in, or where one moment in the loop deserves a clean frame.

**Premium values.** Stagger cues by about 0.12 seconds (eyebrow, headline lines, paragraph, buttons, cards). Leave the frame clean for 1.5 to 2.5 seconds per 10 second loop. Never hide copy while it has keyboard focus.

```js
// seconds on the loop for each .cue in order: [in on the first loop, in on later loops, out]
const CUES = [[0.6, 6.7, 3.85], [0.72, 6.82, 3.9], [0.84, 6.94, 3.95], [0.96, 7.06, 4.0], [1.08, 7.18, 4.05]];
const film = document.getElementById("film"), cues = [...document.querySelectorAll(".hero .cue")];
let loops = 0, lastT = 0, raf = 0;
function tick() {
  raf = requestAnimationFrame(tick);
  const t = film.currentTime;
  if (t < lastT - 1) loops++; // the loop wrapped
  lastT = t;
  CUES.forEach(([first, later, out], i) =>
    cues[i]?.classList.toggle("on", (loops ? t < out : t >= first && t < out) || t >= later));
}
export function filmClock(on) {
  document.documentElement.classList.toggle("filmclock", on);
  cancelAnimationFrame(raf);
  if (on) raf = requestAnimationFrame(tick);
}
film.addEventListener("playing", () => filmClock(true));
film.addEventListener("error", () => filmClock(false));
setTimeout(() => { if (film.readyState < 2) filmClock(false); }, 3500); // a film that never starts never hides the copy
```

```css
/* without the clock (paused, reduced motion, no film) every cue is simply visible */
.filmclock .hero .cue { opacity: 0; transform: translateY(10px); transition: opacity .6s ease, transform .8s cubic-bezier(.2,.7,.2,1); }
.filmclock .hero .cue.on, .filmclock .hero:focus-within .cue { opacity: 1; transform: none; }
.filmclock .hero .cue:not(.on) :is(a, button) { pointer-events: none; }
.filmclock .hero:focus-within .cue :is(a, button) { pointer-events: auto; }
```

When the visitor pauses motion, call `filmClock(false)` so all copy shows and stays.

**Phone.** Same cues. Check that the clean stretch still exists when the frame is cropped to portrait.

**Reduced motion.** No clock, all copy visible, no film.

**Cost.** A class toggle per cue per frame. Free.

---

## R16. Tracked hotspot over a cover-fit video

**What it is.** A pin, card or close-up that follows a point inside the footage (a headset visor, a product, a bird's head) using a per-frame track of normalized coordinates stored as JSON. The math converts film coordinates to page pixels through the same cover-fit the CSS applies.

**When to use.** Product films and people films where one part deserves a spec card. It turns stock footage into an interface.

**Premium values.** A track sampled at 12 fps is enough with interpolation. Decide which side the card sits on from the track's widest point, so an open card never jumps sides mid-loop. A thin SVG leader line from pin to card. A real hover on the pin takes over from any scripted demo cursor for good. Live close-up crops redraw at about 12 fps (every 80 ms), not every frame.

```js
// matches CSS object-fit: cover with object-position posX posY (0.5 0.5 is centered)
export function coverFit(frameEl, video, posX = 0.5, posY = 0.5) {
  const W = frameEl.clientWidth, H = frameEl.clientHeight;
  const vw = video.videoWidth || 1920, vh = video.videoHeight || 1080;
  const s = Math.max(W / vw, H / vh);
  return { W, H, vw, vh, s, ox: (W - vw * s) * posX, oy: (H - vh * s) * posY };
}
// track: [[u, v], ...] in 0..1 of the film frame, evenly spaced over the clip
export function trackAt(track, video) {
  const d = video.duration || 1, f = ((video.currentTime % d) / d) * (track.length - 1);
  const i = Math.floor(f), a = f - i, p = track[i], q = track[Math.min(track.length - 1, i + 1)];
  return [p[0] + (q[0] - p[0]) * a, p[1] + (q[1] - p[1]) * a];
}
export function placeHotspot(el, track, video, geo) {
  const [u, v] = trackAt(track, video);
  el.style.transform = `translate(${(u * geo.vw * geo.s + geo.ox).toFixed(1)}px, ${(v * geo.vh * geo.s + geo.oy).toFixed(1)}px)`;
}
// a live close-up card cut from the playing film around the tracked point
export function drawCrop(canvas, video, cx, cy, frac) {
  const W = video.videoWidth, H = video.videoHeight;
  if (!W) return;
  const sw = frac * W, sh = sw / (canvas.width / canvas.height);
  const sx = Math.min(W - sw, Math.max(0, cx * W - sw / 2)), sy = Math.min(H - sh, Math.max(0, cy * H - sh / 2));
  canvas.getContext("2d").drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
}
```

Drive `placeHotspot` from `video.requestVideoFrameCallback` where it exists (frame-exact), and fall back to `requestAnimationFrame`. Recompute `coverFit` on `resize`, `loadedmetadata` and `document.fonts.ready`. For ping-pong loops, index the track with `pingPongFrame` (R14).

**Phone.** The film is cropped harder, so check that the tracked point stays inside the visible slice. Move the card above the subject when the side has no room.

**Reduced motion.** Show the card open at a fixed point on the poster frame.

**Cost.** One transform per frame, one small `drawImage` per crop every 80 ms. The track JSON is a few kilobytes.

---

## R17. Depth-photo parallax

**What it is.** A photograph becomes a shallow 3D set. A dense plane grid is pushed along each pixel's view ray by a grayscale depth map (white is near), so a small camera move shows real parallax: the subject slides against the background and occludes it. A second layer, the background with the subject removed and filled, sits just behind to cover what the front layer uncovers.

**When to use.** Photo-led heroes (places, animals, food, interiors) that need life without a film. It also hosts real 3D layers: a wordmark set between the subject and the background, drifting motes at true depths.

**Inputs.** The photo, its depth map (half or quarter resolution, 8-bit is fine), a filled background plate and that plate's depth. Any depth source works: a 3D render's Z pass, a depth estimator of your choice, or a hand-painted map for simple scenes. Retouch the depth edges by hand on hair, fur and thin branches.

**Premium values.** Grid 256 x 144 on desktop and phones (a portrait screen magnifies the photo, so coarse cells show), 96 x 54 on software renderers. Depth mapped through inverse distance between near 2.5 and far 90. A skirt 4 percent past the frame so edges smear instead of showing black. Overscan 1.1 so the camera never sees past the photo. Camera limits small: about 0.16 sideways and 0.3 to 0.4 forward, clamped inside an ellipsoid. Scroll poses eased with `k = 5`, idle sway at 0.33 and 0.57 Hz.

```js
const vert = /* glsl */ `
  uniform sampler2D uDepth; uniform float uNear, uFar, uTanX, uTanY, uPush; uniform vec2 uCell;
  varying vec2 vUv; varying float vD;
  float distOf(float d) { return 1.0 / mix(1.0 / uFar, 1.0 / uNear, d); }
  void main() {
    vec2 g = mix(vec2(-0.04), vec2(1.04), uv);
    vUv = clamp(g, 0.0, 1.0);
    float d = 0.0; // nearest depth around the vertex, so cells on a subject's edge move rigidly with it
    for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++)
      d = max(d, texture2D(uDepth, clamp(g + vec2(float(i), float(j)) * uCell, 0.0, 1.0)).r);
    vD = d;
    vec3 dir = vec3((g.x * 2.0 - 1.0) * uTanX, (g.y * 2.0 - 1.0) * uTanY, -1.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(dir * distOf(d) * uPush, 1.0);
  }`;
const frag = /* glsl */ `
  uniform sampler2D uPhoto, uDepth; uniform float uCut, uFront;
  varying vec2 vUv; varying float vD;
  void main() {
    // background pixels carried by a raised edge cell are dropped, so the silhouette follows the photo exactly
    if (uFront > 0.5 && texture2D(uDepth, vUv).r < vD - uCut) discard;
    gl_FragColor = vec4(texture2D(uPhoto, vUv).rgb, 1.0);
    #include <colorspace_fragment>
  }`;

export function depthLayer(THREE, photoTex, depthTex, { front, tanX, tanY, seg = [256, 144] }) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide,
    uniforms: {
      uPhoto: { value: photoTex }, uDepth: { value: depthTex },
      uNear: { value: 2.5 }, uFar: { value: 90 }, uTanX: { value: tanX }, uTanY: { value: tanY },
      uCell: { value: new THREE.Vector2(1 / seg[0], 1 / seg[1]) },
      uCut: { value: 0.05 }, uFront: { value: front ? 1 : 0 },
      uPush: { value: front ? 1 : 1.012 }, // the back plate sits a hair behind, so flat areas never z-fight
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, seg[0], seg[1]), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = front ? 1 : 0;
  return mesh;
}

// fit the lens so the view never passes the overscanned photo, then keep the camera inside its limits
export function fitDepthCamera(THREE, camera, photoAspect, viewAspect, fov0 = 42, overscan = 1.1) {
  const tanY0 = Math.tan(THREE.MathUtils.degToRad(fov0) / 2), tanX0 = tanY0 * photoAspect;
  const tanY = Math.min(tanY0 / overscan, tanX0 / overscan / viewAspect);
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(tanY));
  camera.aspect = viewAspect;
  camera.updateProjectionMatrix();
  return { tanX0, tanY0 };
}
export function poseCamera(camera, x, y, z, maxXY = 0.16, maxZ = 0.35) {
  const n = Math.hypot(x, y, z);
  if (n > 1) { x /= n; y /= n; z /= n; } // the limit ellipsoid: past it the camera would reveal holes
  camera.position.set(x * maxXY, y * maxXY * 0.7, -z * maxZ);
  camera.lookAt(camera.position.x, camera.position.y, camera.position.z - 1);
}
```

Load the photo with `colorSpace = THREE.SRGBColorSpace` and mipmaps, the depth maps with `THREE.NoColorSpace`, `LinearFilter` and no mipmaps. Pass the same `tanX0` and `tanY0` from `fitDepthCamera` into both layers.

For QA, add a debug flag that paints the back plate magenta: any magenta visible during the camera's full range is a hole to fix in the plate or the limits.

To combine with R13, play the film as a `VideoTexture` on both layers with the camera locked at its rest pose (flat footage has no parallax), then swap in the still and ease the camera motion in over about 1.6 seconds with a cubic ease out.

**Phone.** Same grid, render at 30 fps (skip frames by accumulated time), pixel ratio 1.25, and 1.3 times the idle sway since there is no pointer.

**Reduced motion.** Render one frame at the rest pose. It is still sharper and better graded than a plain image.

**Cost.** Two draw calls of about 37,000 vertices with 9 depth taps per vertex. Four images, about 1 to 2 MB total. Handle `webglcontextlost` by removing the canvas and showing the still.
