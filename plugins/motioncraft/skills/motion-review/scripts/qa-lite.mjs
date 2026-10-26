#!/usr/bin/env node
// qa-lite.mjs: the blocking QA checks for a motion page, at desktop (1440x900) and phone (390x844).
// Part of MotionCraft Skills by LIKE A KING INC. MIT licensed.
// What each check means and how to fix a FAIL: ../references/qa-checklist.md
//
// Usage:
//   node qa-lite.mjs <folder|url> [options]
// Options:
//   --page index.html     page inside the folder (default index.html)
//   --wait 3000           ms to wait after load (raise it if your intro runs longer)
//   --budget-mb 10        page weight budget per size, in MB of transferred bytes
//   --only desktop|phone  test one size only
//   --json <file>         also write the results as JSON
//   --out <dir>           save evidence frames for failed motion and scroll checks
//   --gpu                 use the real GPU instead of software rendering
//   --chrome <path>       browser executable (else Playwright's own Chromium, then Chrome or Edge)
//
// Prints PASS or FAIL per check with the measured numbers and exits with code 1 if anything fails.
// Requires Node 18+, and playwright (npm i -D playwright && npx playwright install chromium)
// or playwright-core with an installed Chrome or Edge.

import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// ---------- arguments ----------
const BOOL = new Set(["gpu", "help"]);
const flags = {}, pos = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) { pos.push(a); continue; }
  const k = a.slice(2);
  flags[k] = BOOL.has(k) ? true : argv[++i];
}
const target = pos[0];
if (flags.help || !target) {
  console.log("usage: node qa-lite.mjs <folder|url> [--page index.html] [--wait 3000] [--budget-mb 10]\n" +
    "       [--only desktop|phone] [--json out.json] [--out evidence/] [--gpu] [--chrome <path>]");
  process.exit(flags.help ? 0 : 1);
}
const WAIT = Math.max(0, parseInt(flags.wait ?? "3000", 10));
const BUDGET_MB = Number(flags["budget-mb"] ?? 10);
const MOTION = 0.003;   // mean pixel change (0..1) that counts as "the page is moving by itself"
const MIN_TEXT = 11, MIN_TAP = 44;

// ---------- module loading from the project (cwd) first, then next to this script ----------
function load(name) {
  for (const base of [join(process.cwd(), "noop.js"), fileURLToPath(import.meta.url)]) {
    try { return createRequire(base)(name); } catch { /* try the next base */ }
  }
  return null;
}

// ---------- tiny static server with byte ranges ----------
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".avif": "image/avif", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".mp4": "video/mp4",
  ".webm": "video/webm", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json", ".bin": "application/octet-stream", ".ktx2": "image/ktx2", ".wasm": "application/wasm",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf", ".txt": "text/plain",
};
function serve(root) {
  const base = resolve(root);
  const srv = createServer((req, res) => {
    let path;
    try { path = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname); } catch { res.writeHead(400).end(); return; }
    let file = resolve(base, "." + path);
    if (file !== base && !file.startsWith(base + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    const body = readFileSync(file);
    const head = { "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream", "Accept-Ranges": "bytes" };
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (!m || (m[1] === "" && m[2] === "")) { res.writeHead(200, { ...head, "Content-Length": body.length }).end(body); return; }
    let start, end;
    if (m[1] === "") { start = Math.max(0, body.length - Number(m[2])); end = body.length - 1; }
    else { start = Number(m[1]); end = m[2] === "" ? body.length - 1 : Math.min(Number(m[2]), body.length - 1); }
    if (start > end || start >= body.length) { res.writeHead(416, { "Content-Range": `bytes */${body.length}` }).end(); return; }
    res.writeHead(206, { ...head, "Content-Range": `bytes ${start}-${end}/${body.length}`, "Content-Length": end - start + 1 });
    res.end(body.subarray(start, end + 1));
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

// ---------- browser ----------
const CHROMES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge",
].filter(Boolean);
async function launch() {
  const pw = load("playwright") || load("playwright-core");
  if (!pw?.chromium) throw new Error("Playwright not found. Run: npm i -D playwright && npx playwright install chromium");
  const args = ["--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist", "--disable-smooth-scrolling"];
  if (!flags.gpu) args.push("--use-angle=swiftshader", "--enable-unsafe-swiftshader");
  const opts = { headless: true, args };
  if (flags.chrome) return pw.chromium.launch({ ...opts, executablePath: flags.chrome });
  try { return await pw.chromium.launch(opts); } catch (first) {
    const exe = CHROMES.find((p) => existsSync(p));
    if (!exe) throw new Error(`No browser found (${first.message.split("\n")[0]}). Pass --chrome <path> or run npx playwright install chromium`);
    return pw.chromium.launch({ ...opts, executablePath: exe });
  }
}

// ---------- image math, done in a blank page with a 2D canvas (no image library needed) ----------
let imgPage = null;
const shoot = (page) => page.screenshot({ type: "jpeg", quality: 85 });
// Returns mean luminance (0..1), its spread, and the mean absolute difference to a second image (0..1).
async function measure(a, b = null) {
  return imgPage.evaluate(async ([a64, b64]) => {
    const W = 240;
    const pixels = async (s) => {
      const im = new Image();
      im.src = "data:image/jpeg;base64," + s;
      await im.decode();
      const h = Math.max(1, Math.round((W * im.naturalHeight) / im.naturalWidth));
      const c = new OffscreenCanvas(W, h), g = c.getContext("2d");
      g.drawImage(im, 0, 0, W, h);
      return g.getImageData(0, 0, W, h).data;
    };
    const A = await pixels(a64);
    let sum = 0, sum2 = 0;
    const n = A.length / 4;
    for (let i = 0; i < A.length; i += 4) {
      const l = (0.2126 * A[i] + 0.7152 * A[i + 1] + 0.0722 * A[i + 2]) / 255;
      sum += l; sum2 += l * l;
    }
    const mean = sum / n, spread = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
    let diff = null;
    if (b64) {
      const B = await pixels(b64), len = Math.min(A.length, B.length);
      let d = 0;
      for (let i = 0; i < len; i += 4) d += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
      diff = d / ((len / 4) * 3 * 255);
    }
    return { mean, spread, diff };
  }, [a.toString("base64"), b ? b.toString("base64") : null]);
}
function evidence(name, buf) {
  if (!flags.out) return;
  mkdirSync(flags.out, { recursive: true });
  writeFileSync(join(flags.out, name), buf);
}
const pct = (x) => `${(x * 100).toFixed(2)}%`;

// ---------- in-page probes ----------
// Playwright sends each probe to the page as source text, so every probe is self-contained
// (the one-line `desc` helper is repeated on purpose) and takes its limits as an argument.

function probeOverflow() {
  const desc = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : "");
  const vw = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth;
  const wide = [...document.querySelectorAll("body *")].map((el) => [el, el.getBoundingClientRect()])
    .filter(([, r]) => r.width > 0 && r.right > vw + 1).sort((a, b) => b[1].right - a[1].right)
    .slice(0, 4).map(([el, r]) => `${desc(el)} (right ${Math.round(r.right)})`);
  return { vw, sw, wide };
}

function probeText(minText) {
  const desc = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : "");
  const out = [], seen = new Set();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) {
    const t = walk.currentNode, el = t.parentElement;
    if (!el || seen.has(el) || !t.textContent.trim() || el.closest("script,style,noscript,template")) continue;
    seen.add(el);
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (cs.display === "none" || cs.visibility === "hidden" || r.width < 2 || r.height < 2) continue;
    const fs = parseFloat(cs.fontSize);
    if (fs < minText) out.push(`${desc(el)} ${fs.toFixed(1)}px "${t.textContent.trim().slice(0, 28)}"`);
  }
  return out;
}

function probeTaps(minTap) {
  const desc = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : "");
  const sel = "a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[tabindex]:not([tabindex='-1'])";
  const bad = [];
  let n = 0;
  for (const el of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || el.disabled) continue;
    let r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1 || r.right <= 0 || r.left >= innerWidth || r.bottom + scrollY <= 0) continue;
    // links inside running text are exempt (WCAG target size exception)
    if (el.tagName === "A" && cs.display === "inline" && (el.parentElement?.textContent.trim().length || 0) > el.textContent.trim().length + 10) continue;
    // a checkbox or radio is tapped through its label
    if (/^(checkbox|radio)$/.test(el.type) && el.labels?.length) r = el.labels[0].getBoundingClientRect();
    n++;
    if (Math.min(r.width, r.height) < minTap - 0.5) bad.push(`${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return { n, bad };
}

async function probeFonts() {
  await document.fonts.ready;
  const faces = [...document.fonts], strip = (s) => s.trim().replace(/^["']|["']$/g, "").toLowerCase();
  const failed = faces.filter((f) => f.status === "error").map((f) => `${f.family} ${f.weight} ${f.style}`);
  const loaded = new Map();
  for (const f of faces) loaded.set(strip(f.family), (loaded.get(strip(f.family)) || false) || f.status === "loaded");
  const used = new Set();
  for (const el of document.querySelectorAll("body *")) {
    if (!el.getClientRects().length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    used.add(strip(getComputedStyle(el).fontFamily.split(",")[0]));
  }
  const notLoaded = [...used].filter((f) => loaded.has(f) && !loaded.get(f));
  return { faces: faces.length, failed, notLoaded, used: [...used] };
}

function probeNames() {
  const desc = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : "");
  const issues = [];
  for (const img of document.querySelectorAll("img"))
    if (!img.hasAttribute("alt")) issues.push(`img without alt: ${((img.currentSrc || img.src || "").split("/").pop() || desc(img)).slice(0, 50)}`);
  const named = (el) => (el.getAttribute("aria-label") || "").trim() || (el.getAttribute("title") || "").trim() ||
    (el.getAttribute("aria-labelledby") || "").split(/\s+/).some((id) => document.getElementById(id)?.textContent.trim()) ||
    el.textContent.trim() || [...el.querySelectorAll("img[alt]")].some((i) => i.alt.trim()) ||
    el.querySelector("svg title")?.textContent.trim() || (el.tagName === "INPUT" && (el.value || "").trim());
  for (const el of document.querySelectorAll("a[href],button,[role=button],input[type=submit],input[type=button]")) {
    if (el.closest("[aria-hidden=true]") || getComputedStyle(el).display === "none") continue;
    if (!named(el)) issues.push(`control without a name: ${desc(el)}`);
  }
  for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]),select,textarea")) {
    if (getComputedStyle(el).display === "none") continue;
    if (!(el.labels?.length || (el.getAttribute("aria-label") || "").trim() || el.getAttribute("aria-labelledby") || (el.title || "").trim()))
      issues.push(`field without a label: ${desc(el)}`);
  }
  return issues;
}

// Focus probes compare a style fingerprint of the element, its ::before and ::after, and its parent
// (for :focus-within rings) while focused and while not focused.
function probeFocused(i) {
  const desc = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : "");
  const pick = (cs) => [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.color, cs.textDecorationLine, cs.opacity, cs.transform].join("|");
  const snap = (el) => [pick(getComputedStyle(el)), pick(getComputedStyle(el, "::before")), pick(getComputedStyle(el, "::after")), el.parentElement ? pick(getComputedStyle(el.parentElement)) : ""].join("#");
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  if (el.hasAttribute("data-qa-focus")) return { repeat: true };
  el.setAttribute("data-qa-focus", String(i));
  return { i, name: desc(el), snap: snap(el) };
}
function probeUnfocused() {
  const pick = (cs) => [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.color, cs.textDecorationLine, cs.opacity, cs.transform].join("|");
  const snap = (el) => [pick(getComputedStyle(el)), pick(getComputedStyle(el, "::before")), pick(getComputedStyle(el, "::after")), el.parentElement ? pick(getComputedStyle(el.parentElement)) : ""].join("#");
  document.activeElement?.blur();
  const out = {};
  for (const el of document.querySelectorAll("[data-qa-focus]")) { out[el.getAttribute("data-qa-focus")] = snap(el); el.removeAttribute("data-qa-focus"); }
  return out;
}

function findPause() {
  return [...document.querySelectorAll("button,[role=button],[aria-pressed]")].find((el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const name = `${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""} ${el.textContent || ""}`;
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && /pause|stop|freeze|still|motion/i.test(name);
  }) || null;
}

// ---------- page helpers ----------
function watch(page) {
  const errors = [], requests = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.split("\n")[0]}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 160)}`); });
  page.on("requestfailed", (r) => { const why = r.failure()?.errorText || ""; if (!/ERR_ABORTED/.test(why)) errors.push(`failed: ${r.url().slice(0, 120)} ${why}`); });
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url().slice(0, 120)}`); });
  page.on("requestfinished", (r) => requests.push(r));
  return { errors, requests };
}
async function open(page, url) {
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true));
  await page.waitForTimeout(WAIT);
}
async function bytesOf(requests) {
  const sizes = await Promise.allSettled(requests.map((r) => r.sizes()));
  return sizes.reduce((s, x) => s + (x.status === "fulfilled" ? x.value.responseBodySize : 0), 0);
}
// Scrolls in half-screen steps with programmatic scrolling. Wheel input is applied by the compositor and can
// land late under software rendering, which would make the round trip unrepeatable. Scroll events still fire.
async function settle(page) {
  let last = await page.evaluate(() => scrollY), same = 0;
  for (let k = 0; k < 30 && same < 2; k++) {
    await page.waitForTimeout(100);
    const now = await page.evaluate(() => scrollY);
    same = now === last ? same + 1 : 0;
    last = now;
  }
  return last;
}
async function scrollTowards(page, y) {
  for (let k = 0; k < 200; k++) {
    const { cur, vh } = await page.evaluate(() => ({ cur: scrollY, vh: innerHeight }));
    const gap = y - cur;
    if (Math.abs(gap) < 4) return;
    const step = Math.abs(gap) <= vh * 0.5 ? gap : Math.sign(gap) * Math.round(vh * 0.5);
    await page.evaluate((d) => scrollBy(0, d), step);
    await page.waitForTimeout(150);
    if ((await settle(page)) === cur) return; // the page will not scroll further
  }
}

// ---------- results ----------
const CHECKS = ["Console errors", "Horizontal overflow", "Reversible scroll", "Pause control", "Reduced motion",
  "Phone text size", "Tap targets", "No white flash", "Fonts loaded", "Alt text and names", "Focus states", "Page weight"];
const results = [];
const record = (id, view, pass, detail) => results.push({ id, check: CHECKS[id - 1], view, pass, detail });

// ---------- one size ----------
async function runView(browser, url, v) {
  const ctx = await browser.newContext({ ...v.ctx, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  const w = watch(page);
  await open(page, url);
  const loadReqs = [...w.requests];

  // 2. overflow
  const o = await page.evaluate(probeOverflow);
  record(2, v.name, o.sw <= o.vw + 1, o.sw <= o.vw + 1 ? `${o.sw} px wide in ${o.vw} px` : `page ${o.sw} px wide in ${o.vw} px; ${o.wide.join(", ") || "no single culprit"}`);

  // 9. fonts
  const f = await page.evaluate(probeFonts);
  const fOk = !f.failed.length && !f.notLoaded.length;
  record(9, v.name, fOk, fOk ? `${f.faces} faces declared, none failed` : [f.failed.length && `failed: ${f.failed.slice(0, 4).join(", ")}`, f.notLoaded.length && `used but never loaded: ${f.notLoaded.join(", ")}`].filter(Boolean).join("; "));

  // 10. alt text and names
  const names = await page.evaluate(probeNames);
  record(10, v.name, !names.length, names.length ? `${names.length} issue(s): ${names.slice(0, 4).join("; ")}` : "all images and controls named");

  // 6, 7. phone text and tap targets
  if (v.name === "phone") {
    const small = await page.evaluate(probeText, MIN_TEXT);
    record(6, v.name, !small.length, small.length ? `${small.length} element(s) under ${MIN_TEXT} px: ${small.slice(0, 4).join("; ")}` : `no visible text under ${MIN_TEXT} px`);
    const t = await page.evaluate(probeTaps, MIN_TAP);
    record(7, v.name, !t.bad.length, t.bad.length ? `${t.bad.length} of ${t.n} under ${MIN_TAP} px: ${t.bad.slice(0, 5).join(", ")}` : `${t.n} targets, all at least ${MIN_TAP} px`);
  }

  // 4. pause control for continuous motion (first screen)
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(400);
  const a = await shoot(page); await page.waitForTimeout(1000); const b = await shoot(page);
  const moving = (await measure(a, b)).diff;
  const pauseBtn = moving > MOTION ? (await page.evaluateHandle(findPause)).asElement() : null;
  if (moving <= MOTION) record(4, v.name, true, `n/a: first screen is still (${pct(moving)} change in 1 s)`);
  else if (!pauseBtn) {
    record(4, v.name, false, `first screen moves (${pct(moving)} in 1 s) and no visible pause control was found`);
    evidence(`${v.name}-motion-a.jpg`, a); evidence(`${v.name}-motion-b.jpg`, b);
  } else {
    await pauseBtn.click();
    await page.waitForTimeout(600);
    const c = await shoot(page); await page.waitForTimeout(1000); const d = await shoot(page);
    const after = (await measure(c, d)).diff;
    record(4, v.name, after <= MOTION, `moving ${pct(moving)} in 1 s, after pause ${pct(after)} (limit ${pct(MOTION)})`);
    if (after > MOTION) { evidence(`${v.name}-paused-a.jpg`, c); evidence(`${v.name}-paused-b.jpg`, d); }
    await pauseBtn.click().catch(() => {});
    await page.waitForTimeout(300);
  }

  // 11. focus states (keyboard, desktop only)
  if (v.name === "desktop") {
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    const stops = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(60);
      const s = await page.evaluate(probeFocused, i);
      if (!s || s.repeat) break;
      stops.push(s);
    }
    const rest = await page.evaluate(probeUnfocused);
    const flat = stops.filter((s) => rest[s.i] === s.snap).map((s) => s.name);
    record(11, v.name, stops.length > 0 && !flat.length, !stops.length ? "no keyboard stops found" :
      flat.length ? `${flat.length} of ${stops.length} stops show no focus style: ${flat.slice(0, 5).join(", ")}` : `${stops.length} stops, all show a focus style`);
  }

  // 3. reversible scroll. Ambient motion is paused first when the page offers a control, and the page's own
  // drift over 3 s sets the noise floor, so only scroll state is compared.
  const { max, vh } = await page.evaluate(() => ({ max: document.documentElement.scrollHeight - innerHeight, vh: innerHeight }));
  if (max < vh * 0.5) record(3, v.name, true, "n/a: page does not scroll");
  else {
    const y = Math.round(max * 0.4);
    if (pauseBtn) { await pauseBtn.click().catch(() => {}); await page.waitForTimeout(300); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
    await scrollTowards(page, y); await page.waitForTimeout(1200);
    const down = await shoot(page); await page.waitForTimeout(3000); const down2 = await shoot(page);
    await scrollTowards(page, max); await page.waitForTimeout(800);
    await scrollTowards(page, y); await page.waitForTimeout(1200);
    const up = await shoot(page);
    if (pauseBtn) await pauseBtn.click().catch(() => {});
    const noise = (await measure(down, down2)).diff, round = (await measure(down, up)).diff;
    const limit = 0.015 + 2 * noise;
    record(3, v.name, round <= limit, `round trip ${pct(round)} vs limit ${pct(limit)} (own drift ${pct(noise)}${pauseBtn ? ", motion paused" : ""}) at ${y} px`);
    if (round > limit) { evidence(`${v.name}-scroll-down.jpg`, down); evidence(`${v.name}-scroll-up.jpg`, up); }
  }

  // 12. page weight (load and wait period only)
  const bytes = await bytesOf(loadReqs);
  record(12, v.name, bytes <= BUDGET_MB * 1048576, `${bytes < 104858 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(2)} MB`} in ${loadReqs.length} requests (budget ${BUDGET_MB} MB)`);

  // 1. console errors (everything seen during this run)
  const errs = [...new Set(w.errors)];
  record(1, v.name, !errs.length, errs.length ? `${errs.length}: ${errs.slice(0, 4).join(" | ")}` : "none");
  await ctx.close();

  // 5. reduced motion
  const rctx = await browser.newContext({ ...v.ctx, reducedMotion: "reduce" });
  const rp = await rctx.newPage();
  const rw = watch(rp);
  await open(rp, url);
  const r1 = await shoot(rp); await rp.waitForTimeout(1000); const r2 = await shoot(rp);
  const rm = await measure(r1, r2);
  const loops = await rp.evaluate(() => (document.getAnimations ? document.getAnimations() : [])
    .filter((x) => x.playState === "running" && x.effect?.getTiming().iterations === Infinity).length);
  const rErr = [...new Set(rw.errors)];
  const rOk = !rErr.length && rm.diff <= MOTION && rm.spread > 0.02;
  record(5, v.name, rOk, [`change ${pct(rm.diff)} in 1 s`, `contrast ${rm.spread.toFixed(3)}${rm.spread <= 0.02 ? " (looks blank)" : ""}`,
    `${loops} endless CSS animation(s) running`, rErr.length ? `errors: ${rErr.slice(0, 2).join(" | ")}` : "no errors"].join(", "));
  await rctx.close();

  // 8. white flash
  const fctx = await browser.newContext({ ...v.ctx });
  const fp = await fctx.newPage();
  await fp.goto(url, { waitUntil: "commit", timeout: 60000 });
  const early = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 2000) {
    const painted = await fp.evaluate(() => performance.getEntriesByType("paint").length > 0).catch(() => false);
    if (painted) early.push((await measure(await shoot(fp))).mean);
    else await fp.waitForTimeout(30);
  }
  await fp.waitForLoadState("load", { timeout: 60000 }).catch(() => {});
  await fp.waitForTimeout(WAIT);
  const settled = (await measure(await shoot(fp))).mean;
  const bg = await fp.evaluate(() => [document.documentElement, document.body].map((el) => getComputedStyle(el).backgroundColor));
  const noBg = bg.every((c) => c === "rgba(0, 0, 0, 0)" || c === "transparent");
  const peak = early.length ? Math.max(...early) : 0;
  if (settled >= 0.35) record(8, v.name, true, `n/a: light page (brightness ${settled.toFixed(2)})`);
  else {
    const ok = peak <= 0.8 && !noBg;
    record(8, v.name, ok, `settled ${settled.toFixed(2)}, brightest early frame ${peak.toFixed(2)} of ${early.length}` + (noBg ? ", html and body have no background color" : ""));
  }
  await fctx.close();
}

// ---------- run ----------
let server = null, url;
if (/^https?:\/\//i.test(target)) url = target;
else {
  const page = flags.page || "index.html";
  if (!existsSync(join(resolve(target), page))) { console.error(`Not found: ${join(resolve(target), page)}`); process.exit(1); }
  server = await serve(target);
  url = `http://127.0.0.1:${server.address().port}/${page.replace(/\\/g, "/")}`;
}
const VIEWS = [
  { name: "desktop", ctx: { viewport: { width: 1440, height: 900 } } },
  { name: "phone", ctx: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
].filter((v) => !flags.only || v.name === flags.only);

const browser = await launch();
try {
  imgPage = await (await browser.newContext()).newPage();
  for (const v of VIEWS) {
    try { await runView(browser, url, v); } catch (e) { record(1, v.name, false, `run stopped: ${e.message.split("\n")[0]}`); }
  }
} finally {
  await browser.close();
  server?.close();
}

console.log(`\nqa-lite  ${/^https?:/i.test(target) ? target : resolve(target)}  (${VIEWS.map((v) => v.name).join(" + ")})\n`);
let passed = 0, ran = 0;
CHECKS.forEach((name, k) => {
  const rows = results.filter((r) => r.id === k + 1);
  if (!rows.length) return;
  ran++;
  const ok = rows.every((r) => r.pass);
  if (ok) passed++;
  console.log(`${String(k + 1).padStart(2)} ${(name + " ").padEnd(22, ".")} ${ok ? "PASS" : "FAIL"}`);
  for (const r of rows) console.log(`     ${r.view.padEnd(8)}${r.pass ? "ok  " : "FAIL"}  ${r.detail}`);
});
console.log(`\n${passed} of ${ran} checks passed. Manual checks still to do: see references/qa-checklist.md`);
if (flags.json) writeFileSync(flags.json, JSON.stringify({ target, budgetMb: BUDGET_MB, results }, null, 2));
process.exit(passed === ran ? 0 : 1);
