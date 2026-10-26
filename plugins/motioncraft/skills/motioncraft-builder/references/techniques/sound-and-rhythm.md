# Sound and rhythm

Recipes R18 to R21. Sound is half of what makes award sites feel alive, and it can cost zero bytes: every voice here is synthesized with the Web Audio API. The same clock that plays sound also drives light, bloom, camera and type, so the page moves in time.

Rules that apply to every recipe here: sound is opt-in behind a clear control, the `AudioContext` is created or resumed only inside a user gesture, and the page is complete with sound off.

---

## R18. Synthesized drum voice set

**What it is.** Four drum voices (kick, snare, hat, clap) built from oscillators, a shared noise buffer, filters and fast envelopes, mixed through one compressor. No samples, no downloads.

**When to use.** Music gear, studios, venues, fitness, games, any brand with a pulse. Single voices also make good UI sounds: the hat as a tick, the kick as a confirm.

**Premium values.** Kick: sine falling from 165 to 44 Hz in 130 ms, 500 ms decay, plus a 15 ms click of noise high-passed at 2.5 kHz. Snare: triangle body 190 to 140 Hz, 120 ms, under noise high-passed at 1.4 kHz with 200 ms decay. Hat: noise high-passed at 7.6 kHz, 55 ms. Clap: noise band-passed at 1.5 kHz (Q 0.9), three bursts 11 ms apart, then a 210 ms tail. Attack 2 ms on everything (rule 11). Bus compressor: threshold -12 dB, ratio 4, attack 3 ms, release 120 ms.

```js
export function createKit(ac) {
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.12;
  const out = ac.createGain();
  out.gain.value = 0.85;
  out.connect(comp).connect(ac.destination);
  const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  // exponential ramps cannot reach zero, so envelopes start and end at 0.0001
  const env = (g, t, peak, decay) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  };
  const noiseThrough = (t, dur, type, freq, q = 1) => {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f).connect(g).connect(out);
    s.start(t); s.stop(t + dur);
    return g;
  };
  const tone = (t, type, f0, f1, glide, peak, decay) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + glide);
    env(g, t, peak, decay);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + decay + 0.02);
  };

  const kick = (t) => { tone(t, "sine", 165, 44, 0.13, 1, 0.5); env(noiseThrough(t, 0.02, "highpass", 2500), t, 0.25, 0.015); };
  const snare = (t) => { tone(t, "triangle", 190, 140, 0.08, 0.45, 0.12); env(noiseThrough(t, 0.22, "highpass", 1400), t, 0.6, 0.2); };
  const hat = (t) => env(noiseThrough(t, 0.07, "highpass", 7600), t, 0.32, 0.055);
  const clap = (t) => {
    const g = noiseThrough(t, 0.3, "bandpass", 1500, 0.9);
    g.gain.setValueAtTime(0.0001, t);
    for (const o of [0, 0.011, 0.022]) {
      g.gain.setValueAtTime(0.7, t + o);
      g.gain.exponentialRampToValueAtTime(0.08, t + o + 0.009);
    }
    g.gain.setValueAtTime(0.5, t + 0.033);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  };
  return { voices: [kick, snare, hat, clap], out };
}
```

**Phone.** Same. Phones play Web Audio fine once unlocked by a tap, but the hardware mute switch on some phones silences it, so never put meaning in sound alone.

**Reduced motion.** Sound is separate from motion. Keep it opt-in either way.

**Cost.** Each hit creates a few short-lived nodes that are garbage collected after they stop. Fine at 16 steps and 104 BPM. One 1 second noise buffer, generated at start.

---

## R19. Look-ahead scheduler with a visual queue

**What it is.** The standard way to keep Web Audio in time: a timer every 25 ms schedules every step that falls inside the next 120 ms on the audio clock, and pushes each step onto a queue. The render loop pops steps whose time has come and lights them, so sound and light agree to the millisecond. Before the visitor presses play, the same clock runs silently on `performance.now` so the lights still chase.

**When to use.** Sequencers, beat-synced pages, metronomes, any visual that must land on a musical grid.

**Premium values.** Tick every 25 ms, look ahead 0.12 s. In a background tab timers are throttled to about once a second, so look ahead 1.2 s while `document.hidden`. Sixteenth notes: step length `60 / bpm / 4`. Clamp BPM to 40 to 240. Start 50 to 60 ms in the future so the first hit is never late.

```js
// pattern: 4 rows of 16 booleans; createKit from R18 is created on the first play (a user gesture)
export function createSequencer(pattern, createKit, { bpm = 104 } = {}) {
  let ac = null, kit = null, audio = false, running = false, step = 0, next = 0;
  const queue = [];
  const silentNow = () => performance.now() / 1000;
  const now = () => (audio ? ac.currentTime : silentNow());
  const stepDur = () => 60 / bpm / 4;

  function tick() {
    if (!running) return;
    const ahead = document.hidden ? 1.2 : 0.12;
    while (next < now() + ahead) {
      if (audio) for (let v = 0; v < pattern.length; v++) if (pattern[v][step]) kit.voices[v](next);
      queue.push({ step, time: next });
      next += stepDur();
      step = (step + 1) % 16;
    }
  }
  setInterval(tick, 25);

  return {
    get playing() { return audio; },
    get bpm() { return bpm; },
    set bpm(v) { bpm = Math.max(40, Math.min(240, v | 0)); },
    startSilent() { if (!running) { running = true; next = silentNow() + 0.05; tick(); } },
    async play() {
      if (!ac) { ac = new AudioContext(); kit = createKit(ac); }
      if (ac.state === "suspended") await ac.resume();
      queue.length = 0; audio = true; running = true; next = ac.currentTime + 0.06; tick();
    },
    stop(keepSilent = true) { queue.length = 0; audio = false; running = keepSilent; next = silentNow() + 0.05; },
    preview(v) { if (audio) kit.voices[v](ac.currentTime + 0.01); },
    // steps whose time has come, in order; call once per frame and light them
    due() {
      const t = now(), out = [];
      while (queue.length && queue[0].time <= t) out.push(queue.shift().step);
      return out;
    },
  };
}
```

Wire the transport to one button with `aria-pressed`, and give the space bar the same toggle when focus is not in a form field or on another button.

**Phone.** Same.

**Reduced motion.** Do not start the silent clock. Lights stay still until the visitor presses play, and then only the step indicator moves.

**Cost.** One 25 ms interval and a short queue. Negligible.

---

## R20. Kick-synced CSS variables and scene pulse

**What it is.** One decaying `kick` value, set to 1 on each kick step and decayed every frame, drives everything that should breathe with the beat: a point light, bloom strength, a 2 percent camera push, and CSS custom properties that move type and UI in the DOM.

**When to use.** Any page with a beat (R19), or any page with a heartbeat of its own (a live counter, a pulse every few seconds).

**Premium values.** Decay `exp(-dt * 7)` while playing, `exp(-dt * 9)` on the silent clock, with the silent pulse at 35 percent strength. Beat light 0 to 40 intensity. Bloom 0.45 base plus up to 0.35. Headline lift at most 4 px and scale at most 0.8 percent. A logo dot can scale up to 45 percent because it is small.

```js
let kick = 0, lastKick = "";
// call once per frame with the steps returned by seq.due()
export function pulseFrame(dt, steps, { seq, pattern, paused, light, bloom, cssHost }) {
  for (const s of steps) if (pattern[0][s]) kick = 1;
  kick *= Math.exp(-dt * (seq.playing ? 7 : 9));
  const pulse = paused && !seq.playing ? 0 : kick * (seq.playing ? 1 : 0.35);
  light.intensity = pulse * 40;
  bloom.strength = 0.45 + pulse * 0.35;
  const v = pulse.toFixed(3);
  if (v !== lastKick) { cssHost.style.setProperty("--kick", v); lastKick = v; } // skip identical writes
  return pulse; // also use it for the camera: pos.add(dirToTarget.multiplyScalar(pulse * 0.018))
}
```

```css
.masthead { --kick: 0; }
.masthead .logo-dot { transform: scale(calc(1 + var(--kick) * .45)); }
.masthead .kick-type { transform: translateY(calc(var(--kick) * -4px)) scale(calc(1 + var(--kick) * .008)); transform-origin: left bottom; }
@media (prefers-reduced-motion: reduce) { .masthead .logo-dot, .masthead .kick-type { transform: none; } }
```

Set the variable on the smallest element that contains every consumer (`cssHost` above). Set on `:root`, it restyles the whole page every frame.

**Phone.** Same. Transforms only, so it stays on the compositor.

**Reduced motion.** The CSS media query removes the transforms. Keep the light pulse only while the visitor has pressed play.

**Cost.** One style write per frame when the value changes, plus two uniform changes.

---

## R21. Scroll-speed ambience and low-pass muffle

**What it is.** A quiet looping noise bed whose level follows scroll speed (the page "rushes" when you scroll fast) and whose low-pass filter closes on transitions, as if the sound moved behind a wall while the next scene loads.

**When to use.** Immersive stories, film-led pages, galleries and worlds. Pair the muffle with mode changes (R05) and route changes.

**Premium values.** Base level 0.04, up to 0.16 at full speed. Full speed at about 3,000 px per second. Filter open at 900 Hz, muffled at 320 Hz. Close fast (time constant 0.05 s), open slowly (0.25 s). Smooth the speed with `k = 4` so it swells instead of flickering.

```js
export function createAmbience(ac) {
  const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = buf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < d.length; i++) { b = 0.98 * b + 0.02 * (Math.random() * 2 - 1); d[i] = b * 6; } // soft, brown-ish noise
  const src = ac.createBufferSource();
  src.buffer = buf; src.loop = true;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.7;
  const gain = ac.createGain();
  gain.gain.value = 0;
  src.connect(lp).connect(gain).connect(ac.destination);
  src.start();
  return { ac, lp, gain };
}

let lastY = scrollY, speed = 0;
export function updateAmbience(amb, dt) {
  const v = Math.abs(scrollY - lastY) / Math.max(dt, 1e-3);
  lastY = scrollY;
  speed += (Math.min(1, v / 3000) - speed) * (1 - Math.exp(-dt * 4));
  amb.gain.gain.setTargetAtTime(0.04 + speed * 0.12, amb.ac.currentTime, 0.08);
}
export function muffle(amb, on) {
  amb.lp.frequency.setTargetAtTime(on ? 320 : 900, amb.ac.currentTime, on ? 0.05 : 0.25);
}
```

Suspend the context when the tab is hidden (`ac.suspend()`) and resume on return, and fade the bed to zero over 0.3 s when the visitor turns sound off rather than cutting it.

**Phone.** Same, at about 70 percent of the level. Phone speakers exaggerate hiss.

**Reduced motion.** Keep the bed static (no speed swell) if the visitor has sound on.

**Cost.** One looping source and one filter. Negligible.
