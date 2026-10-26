# Scene craft

Recipes R06 to R12. These dress a three.js scene so it reads as product photography or a living place, while staying cheap: labels that follow the model, a 3D route that becomes a diagram, a whole lit city in one draw call, a sky that steps aside, sharp printed graphics without image files, shadows without shadow maps, and an exploded view driven by a single value.

All snippets assume `import * as THREE from "three"` with three.js 0.170.

---

## R06. DOM callouts anchored to 3D points

**What it is.** Real HTML labels (text, numbers, links) that sit on exact points of a 3D model and follow it as the camera moves. Each label is tied to an empty `Object3D` placed on the part it describes, so it also follows the part when the model explodes or animates.

**When to use.** Exploded views, back panels, spec walkthroughs, maps with station names. Anywhere the visitor should read text about a specific spot on the model.

**Premium values.** A label fades in over about 0.4 of a section around its own shot (`1 - |t - shot| * 2.4`). A 12 px nudge left of the anchor with a short leader line reads better than text centered on the point. Hide labels on phones where they would cover the subject, and keep the same facts in the section copy.

```js
const tmp = new THREE.Vector3();
// pins: [{ el, anchor: THREE.Object3D, shot: number }]
export function placePins(pins, camera, t) {
  for (const p of pins) {
    const w = 1 - Math.min(1, Math.abs(t - p.shot) * 2.4);
    if (w <= 0.01) { if (p.el.style.opacity !== "0") p.el.style.opacity = "0"; continue; }
    p.anchor.getWorldPosition(tmp).project(camera);
    if (tmp.z > 1) { p.el.style.opacity = "0"; continue; } // the point is behind the camera
    const x = (tmp.x * 0.5 + 0.5) * innerWidth, y = (-tmp.y * 0.5 + 0.5) * innerHeight;
    p.el.style.opacity = w.toFixed(2);
    p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-12px, -50%)`;
  }
}

// an anchor is an empty child of the part, so it rides along with explode and animation
export function addAnchor(parent, x, y, z) {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}
```

```css
.pin { position: fixed; left: 0; top: 0; opacity: 0; pointer-events: none; will-change: transform, opacity; }
.pin::before { content: ""; display: inline-block; width: 24px; height: 1px; margin-right: 8px; vertical-align: middle; background: currentColor; }
```

`Vector3.project` uses the camera's current projection, including a phone view offset (R03), so labels stay locked on phones too. Call `placePins` after the camera is final for the frame and before rendering.

**Phone.** Show at most two labels per shot, or move the facts into the copy and hide the pins below 760 px.

**Reduced motion.** Show each label at its shot with no fade.

**Cost.** One matrix multiply and one style write per visible label per frame. Keep it under about 12 labels.

---

## R07. Morph-target tube morph: 3D route to flat diagram

**What it is.** A line that runs as a curved, elevated tube through a 3D city and morphs into a straight-angled, flat diagram line. Both shapes are `TubeGeometry` with the same segment count, so they have the same vertex count, and the flat one becomes a morph target of the curved one.

**When to use.** Transit, logistics, delivery routes, utility networks, hiking trails, any story where the real world turns into its map. Pairs with the mode value (R05).

**Premium values.** 360 tubular segments, 8 radial. Street tube radius about 0.085, diagram tube about 0.2, since diagram lines read thicker. Emissive intensity 1.2 at night, fading to about 0.05 on paper. Use a centripetal Catmull-Rom so the street curve never overshoots at stations.

```js
export function morphRoute(streetPts, diagramPts, color) {
  const street = new THREE.CatmullRomCurve3(streetPts, false, "centripetal");
  const diagram = new THREE.CurvePath();
  for (let i = 0; i < diagramPts.length - 1; i++) diagram.add(new THREE.LineCurve3(diagramPts[i], diagramPts[i + 1]));
  const SEG = 360;
  const geo = new THREE.TubeGeometry(street, SEG, 0.085, 8, false);
  const flat = new THREE.TubeGeometry(diagram, SEG, 0.2, 8, false); // same counts, so a valid morph target
  geo.morphAttributes.position = [flat.attributes.position];
  geo.morphAttributes.normal = [flat.attributes.normal];
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.45 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.morphTargetInfluences = [0];
  return { mesh, mat, street, diagram };
}

// per frame, with m from the mode value: trains ride the same blend as the tube
const a = new THREE.Vector3(), b = new THREE.Vector3();
export function updateRoute(route, trains, m) {
  route.mesh.morphTargetInfluences[0] = m;
  route.mat.emissiveIntensity = 0.85 * (1 - m) + 0.05;
  for (const tr of trains) {
    route.street.getPointAt(tr.u, a);
    route.diagram.getPointAt(tr.u, b);
    tr.mesh.position.lerpVectors(a, b, m);
  }
}
```

Station markers work the same way: store each one's street and diagram positions and `lerpVectors` between them with `m`. Pillars under the elevated line can be one `InstancedMesh` whose `scale.y` goes to `1 - m`.

**Phone.** Same geometry. Raise the camera instead of thinning the lines.

**Reduced motion.** Show `m = 0` in the city section and `m = 1` in the map section, no blend.

**Cost.** One draw call per line. Morph targets add one attribute read per vertex in the vertex shader.

---

## R08. Instanced buildings with shader-lit windows

**What it is.** A whole city as one `InstancedMesh` of unit boxes. Windows are not geometry or textures: a few lines injected into `MeshStandardMaterial` with `onBeforeCompile` draw a window grid in world units and light a random 30 percent of panes from a hash of the cell id. A `uFlat` uniform squashes every building to the ground for a map mode.

**When to use.** Night skylines, real estate, transit, smart-city and logistics stories. Anything that needs density at near-zero cost.

**Premium values.** About 30 percent of windows lit (`step(0.7, hash)`), 15 percent of those cool white, the rest warm 2700 K amber. A downtown peak from a Gaussian, plus about 6 percent tall outliers, so the skyline has a silhouette. Flatten to 3 percent height, not zero, to avoid z-fighting with the ground.

```js
// deterministic, so every load and every screenshot builds the same skyline
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export function skylineCells() {
  const cells = [];
  for (let i = -14; i < 13; i++) for (let j = -11; j < 10; j++) {
    const h = 0.35 + 7.2 * Math.exp(-((i - 1) ** 2 + (j + 1) ** 2) / 26) + rnd() * 1.6 + (rnd() < 0.06 ? 3 : 0);
    cells.push([i + 0.5, j + 0.5, h, 0.55 + rnd() * 0.3, 0.55 + rnd() * 0.3]);
  }
  return cells;
}

export function city(cells, uniforms /* { uFlat: { value: 0 } } */) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x182133, roughness: 0.8, metalness: 0.2 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    const decl = "#include <common>\nuniform float uFlat;\nvarying vec3 vWP;\nvarying float vUp;";
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", decl)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        transformed.y *= mix(1.0, 0.03, uFlat);
        vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        vUp = normal.y;`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", decl)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        vec2 g = vec2((vWP.x + vWP.z) * 5.2, vWP.y * 6.2);
        vec2 id = floor(g), f = fract(g);
        float pane = step(0.26, f.x) * step(f.x, 0.74) * step(0.3, f.y) * step(f.y, 0.7);
        float h = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
        float lit = step(0.7, h) * pane * (1.0 - step(0.5, vUp)) * step(0.3, vWP.y);
        vec3 tint = mix(vec3(1.0, 0.76, 0.45), vec3(0.6, 0.8, 1.0), step(0.85, h));
        totalEmissiveRadiance += tint * lit * 0.62 * (1.0 - uFlat);`);
  };
  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0); // pivot at the base, so scaling y grows the building upward
  const mesh = new THREE.InstancedMesh(box, mat, cells.length);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  cells.forEach(([x, z, h, sx, sz], i) => {
    mesh.setMatrixAt(i, m4.makeScale(sx, h, sz).setPosition(x, 0, z));
    mesh.setColorAt(i, c.setHSL(0.6 + rnd() * 0.05, 0.22, 0.13 + rnd() * 0.08));
  });
  return mesh;
}
```

Keep buildings low near the routes and clear of station sites, so lines and labels stay visible. With bloom (threshold about 0.85, strength about 0.42), lit windows glow without any extra lights.

**Phone.** Drop to about 60 percent of the cells by skipping the outer ring. The shader cost is per pixel, so fewer, larger buildings on screen are cheaper.

**Reduced motion.** The city is static anyway. Freeze any window flicker if you add one.

**Cost.** One draw call for the whole city. About 15 shader instructions per pixel.

---

## R09. Sky dome that fades with a mode

**What it is.** A large back-faced sphere with a three-stop vertical gradient (warm horizon, cool mid, deep zenith) that follows the camera and fades out through a `uFade` uniform, so the scene background color can take over when the world changes mode.

**When to use.** Night-to-day, world-to-diagram or outdoor-to-studio changes. A flat background color looks like a void; a dome with a horizon glow looks like weather.

**Premium values.** Horizon band from 0 to 0.18 of the dome height, then into the zenith by 0.7. A horizon only slightly warmer than the mid tone (city light pollution) is more convincing than a bright sunset. Radius well inside the camera far plane.

```js
export function skyDome(radius = 150) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, transparent: true, fog: false,
    uniforms: {
      uFade: { value: 1 },
      uHorizon: { value: new THREE.Color(0.16, 0.12, 0.17) },
      uMid: { value: new THREE.Color(0.06, 0.09, 0.17) },
      uZenith: { value: new THREE.Color(0.012, 0.018, 0.04) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uFade; uniform vec3 uHorizon, uMid, uZenith; varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.18, h));
        c = mix(c, uZenith, smoothstep(0.18, 0.7, h));
        gl_FragColor = vec4(c, uFade);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  return sky;
}
// per frame: sky.position.copy(camera.position); sky.material.uniforms.uFade.value = 1 - m; sky.visible = m < 0.99;
```

**Phone.** Same.

**Reduced motion.** Same, the fade follows the section, not time.

**Cost.** One draw call, a few instructions per pixel. Hide it when fully faded.

---

## R10. Canvas-drawn faceplate texture

**What it is.** Printed graphics (brand mark, step numbers, knob labels, port names, a battery label, a live readout) drawn with the 2D canvas API into a `CanvasTexture` and laid on a plane over the model. Positions come from the same units as the 3D controls, so print and geometry line up exactly.

**When to use.** Hardware, appliances, packaging, signage, dashboards on devices, any surface with type on it. Sharper and lighter than a photo texture, and editable in code.

**Premium values.** 2048 px across the faceplate. Hairline frames at 14 percent opacity. Use the page's own fonts and wait for them before drawing, or the fallback font gets baked in. Anisotropy 8 so the print stays crisp at grazing angles. Redraw live screens only when their state changes.

```js
export function canvasTexture(w, h, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { canvas, ctx, tex };
}

// faceplate of a fictional Coldspring CS-8 sampler: plate units map to canvas pixels
export async function faceplate(PW, PD, padX) {
  await document.fonts.load('800 64px "Archivo"');
  const W = 2048, H = Math.round((W * PD) / PW);
  const fx = (x) => ((x + PW / 2) / PW) * W, fz = (z) => ((z + PD / 2) / PD) * H;
  const face = canvasTexture(W, H, (x) => {
    x.fillStyle = "#151518"; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(239,233,223,.9)"; x.font = '800 64px "Archivo", sans-serif'; x.textBaseline = "middle";
    x.fillText("COLDSPRING", fx(-2.7), fz(-0.1));
    x.fillStyle = "#ff5a1f"; x.fillText("CS-8", fx(-2.7) + x.measureText("COLDSPRING").width + 26, fz(-0.1));
    x.font = '600 26px "JetBrains Mono", monospace'; x.fillStyle = "rgba(239,233,223,.55)"; x.textAlign = "center";
    for (let i = 0; i < 8; i++) x.fillText(String(i + 1), fx(padX(i)), fz(0.8));
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshStandardMaterial({ map: face.tex, roughness: 0.66, metalness: 0.2 }));
  mesh.rotation.x = -Math.PI / 2; // lies flat on the top face; lift it about 0.001 above the plate to avoid z-fighting
  return mesh;
}
```

For a live screen, keep a separate small canvas (512 x 256), draw the readout with `toneMapped: false` on a `MeshBasicMaterial` so it glows at its true color, and set `tex.needsUpdate = true` only from a `dirty` flag.

**Phone.** Drop to 1024 px across. Text on the model is decoration; the real values must also exist in the DOM.

**Reduced motion.** Static by nature.

**Cost.** Zero download bytes. A 2048 x 1100 texture uses about 9 MB of GPU memory, so use one faceplate, not ten.

---

## R11. Contact shadow from a radial-gradient plane

**What it is.** A soft dark ellipse under an object, drawn once as a radial gradient on a 256 px canvas and mapped to a transparent plane just above the floor. It grounds the object with no shadow map, no extra pass and no shimmer.

**When to use.** Every object that rests on a surface in a product or tabletop scene. Add a real shadow map only if the object casts shadows onto other objects, which is rare.

**Premium values.** Plane about 1.6 times the object's footprint. Center opacity 0.85. Lift 0.002 above the floor. When the object lifts (explode, hover), scale the shadow up by `1 + lift * 0.4` and fade it by `1 - lift * 0.6`. For extra weight, stack a second plane at 0.6 of the footprint with 0.9 opacity.

```js
export function contactShadow(width, depth, strength = 0.85) {
  const s = 256, c = document.createElement("canvas");
  c.width = c.height = s;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(s / 2, s / 2, s * 0.04, s / 2, s / 2, s / 2);
  g.addColorStop(0, `rgba(0,0,0,${strength})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, s, s);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
// const shadow = contactShadow(9.5, 5.6); shadow.position.y = floorY + 0.002; scene.add(shadow);
```

**Phone.** Same.

**Reduced motion.** Same.

**Cost.** One draw call and a 256 KB texture in GPU memory. Nothing to download.

---

## R12. Exploded view from one value

**What it is.** The product's layers (lid, board, speaker, battery) lift apart along one axis, driven by a single value `e` from 0 to 1. Each part has its own lift distance so the stack opens like a diagram, and labels anchored to the parts (R06) ride along.

**When to use.** Hardware, appliances, packaging, furniture, food built in layers. It is the clearest way to sell "what is inside".

**Premium values.** The top part travels farthest (about 5.5 times the body height), the parts below in decreasing order, so nothing collides. A slight tilt on the lid (about 0.08 rad) makes it feel lifted by hand, not by a crane. Peak the explosion on its own shot: `e = smooth(0.35, 0.85, t) * (1 - smooth(1.15, 1.65, t))` for shot 1.

```js
// parts: [{ obj, lift, tilt }]; positions are measured from where each part sits at rest
export function explodeRig(parts) {
  for (const p of parts) p.base = p.obj.position.y;
  let last = -1;
  return (e) => {
    if (Math.abs(e - last) < 1e-4) return; // skip identical frames
    last = e;
    const s = e * e * (3 - 2 * e);
    for (const p of parts) {
      p.obj.position.y = p.base + s * p.lift;
      p.obj.rotation.x = -s * (p.tilt || 0);
    }
  };
}
// const explode = explodeRig([{ obj: lid, lift: 2.75, tilt: 0.08 }, { obj: speaker, lift: 1.95 }, { obj: board, lift: 1.3 }, { obj: battery, lift: 0.78 }]);
```

**Phone.** Reduce lifts by about 20 percent so the stack fits the narrower frame, or move the camera back with the phone shot list.

**Reduced motion.** Show the exploded state as a still in its section.

**Cost.** A few transform writes per frame, skipped when `e` has not changed.
