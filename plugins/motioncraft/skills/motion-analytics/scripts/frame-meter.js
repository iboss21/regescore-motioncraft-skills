/*! frame-meter.js: a drop-in frame-time meter for motion pages.
 * Part of MotionCraft Skills by LIKE A KING INC. MIT licensed.
 *
 * Usage
 *   <script src="frame-meter.js" defer></script>
 *   Open the page with ?meter to show a small readout and log a summary every 5 seconds,
 *   or add data-auto to the script tag. From the console or an automated test:
 *     frameMeter.start()              begin a clean measurement (clears earlier frames)
 *     frameMeter.report()             { frames, p50, p95, p99, max, fps, refresh, longFrames, jank, tier, suggest }
 *     await frameMeter.measure(10000) measure for 10 s, then resolve with the report
 *     frameMeter.tier = 2             tell the meter which quality tier the page runs, for the suggestion
 *     frameMeter.show() / hide()      toggle the readout
 *     frameMeter.stop()               stop measuring
 *
 * What it measures: the interval between animation frames, which is what the visitor sees.
 * On a 60 Hz screen a healthy frame is about 16.7 ms. A p95 above 22 ms means frames are missed regularly.
 * Gaps over 1 s (hidden tab, debugger) are ignored. The meter adds almost no cost: one number per frame.
 */
(function () {
  "use strict";
  if (typeof window === "undefined" || window.frameMeter) return;

  var SIZE = 1200; // rolling window, about 20 s at 60 Hz
  var gaps = new Float32Array(SIZE);
  var n = 0, i = 0, prev = 0, raf = 0, running = false, panel = null, panelTimer = 0, logTimer = 0;
  var auto = /[?&]meter(=|&|$)/.test(location.search) ||
    !!(document.currentScript && document.currentScript.hasAttribute("data-auto"));

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (prev) {
      var gap = now - prev;
      if (gap > 0 && gap < 1000) {
        gaps[i % SIZE] = gap;
        i++;
        if (n < SIZE) n++;
      }
    }
    prev = now;
  }

  function start() {
    reset();
    if (!running) { running = true; raf = requestAnimationFrame(frame); }
    return api;
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    prev = 0;
    return api;
  }
  function reset() {
    n = 0; i = 0; prev = 0;
    return api;
  }

  // Display interval from the fastest tenth of frames, snapped to a real refresh rate (144, 120, 90, 75, 60 Hz),
  // so a page that misses every frame is not mistaken for a slow display.
  function displayInterval(fast) {
    var rates = [6.94, 8.33, 11.11, 13.33, 16.67], best = rates[0];
    for (var r = 0; r < rates.length; r++) if (rates[r] <= fast * 1.05) best = rates[r];
    return best;
  }

  function round(x, d) { var k = Math.pow(10, d || 1); return Math.round(x * k) / k; }

  function suggest(p95, refresh) {
    var step, text;
    if (p95 <= refresh * 1.15) { step = 1; text = "holds the display refresh: keep this tier, or try one higher and re-measure"; }
    else if (p95 <= 22) { step = 0; text = "occasional missed frames: hold this tier"; }
    else if (p95 <= 40) { step = -1; text = "misses frames regularly: step down one tier"; }
    else { step = -2; text = "heavy stutter: step down two tiers, or go static if it stays here"; }
    return { tier: Math.max(0, Math.min(3, api.tier + step)), text: text };
  }

  function report() {
    var a = Array.prototype.slice.call(gaps.subarray(0, n)).sort(function (x, y) { return x - y; });
    if (!a.length) return { frames: 0, suggest: "no frames yet: call frameMeter.start() and interact with the page" };
    var q = function (p) { return a[Math.min(a.length - 1, Math.floor(a.length * p))]; };
    var sum = 0, longFrames = 0, janky = 0, refresh = displayInterval(q(0.1));
    for (var k = 0; k < a.length; k++) {
      sum += a[k];
      if (a[k] > 50) longFrames++;
      if (a[k] > refresh * 1.5) janky++;
    }
    var p95 = q(0.95), s = suggest(p95, refresh);
    return {
      frames: a.length,
      p50: round(q(0.5)), p95: round(p95), p99: round(q(0.99)), max: round(a[a.length - 1]),
      fps: Math.round(1000 / (sum / a.length)),
      refresh: round(refresh),          // estimated display interval, ms
      longFrames: longFrames,           // frames over 50 ms
      jank: round(janky / a.length, 3), // share of frames over 1.5x the display interval
      tier: s.tier,
      suggest: s.text,
    };
  }

  function measure(ms) {
    start();
    return new Promise(function (done) { setTimeout(function () { done(report()); }, ms || 5000); });
  }

  function line() {
    var r = report();
    if (!r.frames) return "frame meter: waiting for frames";
    return "p50 " + r.p50 + " ms  p95 " + r.p95 + " ms  long " + r.longFrames + "  tier " + api.tier + " -> " + r.tier;
  }

  function show() {
    if (!panel) {
      panel = document.createElement("div");
      panel.setAttribute("aria-hidden", "true");
      panel.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;pointer-events:none;" +
        "font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#e8ffe8;background:rgba(0,0,0,.72);" +
        "padding:6px 9px;border-radius:6px;white-space:nowrap";
      document.body.appendChild(panel);
    }
    panel.style.display = "block";
    clearInterval(panelTimer);
    panelTimer = setInterval(function () { panel.textContent = line(); }, 500);
    return api;
  }
  function hide() {
    clearInterval(panelTimer);
    if (panel) panel.style.display = "none";
    return api;
  }

  // A hidden tab stops animation frames; drop the gap so it is not counted as one huge frame.
  document.addEventListener("visibilitychange", function () { prev = 0; });

  var api = { tier: 3, start: start, stop: stop, reset: reset, report: report, measure: measure, show: show, hide: hide };
  window.frameMeter = api;

  if (auto) {
    var boot = function () {
      start();
      show();
      logTimer = setInterval(function () {
        var r = report();
        if (r.frames) console.info("[frame-meter]", line(), "|", r.suggest);
      }, 5000);
    };
    if (document.body) boot();
    else document.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();
