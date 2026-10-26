#!/usr/bin/env node
// section-shots.mjs: screenshot every section of a page at desktop (1440x900) and phone (390x844).
// Part of MotionCraft Skills by LIKE A KING INC. MIT licensed.
//
// The page must jump to section N when opened with ?shot=N (see ../SKILL.md for a five-line hook).
//
// Usage:
//   node section-shots.mjs <folder|url> <sections> <outDir> [options]
// Options:
//   --page index.html     page inside the folder (default index.html)
//   --wait 4000           ms to wait after load before each screenshot (software WebGL is slow)
//   --only desktop|phone  shoot one size only
//   --scale 1             device scale factor (2 for crisp retina frames, bigger files)
//   --reduced-motion      emulate prefers-reduced-motion: reduce
//   --gpu                 use the real GPU instead of software rendering (faster, less repeatable)
//   --chrome <path>       browser executable (else Playwright's own Chromium, then Chrome or Edge)
//
// Writes d0.png, d1.png ... (desktop) and p0.png ... (phone). With sharp installed it also writes
// desk-sheet.png and phone-sheet.png contact sheets (left to right, top to bottom = section order).
// Prints every page error, console error and failed request it saw.
//
// Requires Node 18+, and playwright (npm i -D playwright && npx playwright install chromium)
// or playwright-core with an installed Chrome or Edge. Optional: npm i -D sharp.

import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// ---------- arguments ----------
const BOOL = new Set(["reduced-motion", "gpu", "help"]);
const flags = {}, pos = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) { pos.push(a); continue; }
  const k = a.slice(2);
  flags[k] = BOOL.has(k) ? true : argv[++i];
}
const [target, countArg, outDirArg] = pos;
if (flags.help || !target || !countArg || !outDirArg) {
  console.log("usage: node section-shots.mjs <folder|url> <sections> <outDir> [--page index.html] [--wait 4000]\n" +
    "       [--only desktop|phone] [--scale 1] [--reduced-motion] [--gpu] [--chrome <path>]");
  process.exit(flags.help ? 0 : 1);
}
const count = Math.max(1, parseInt(countArg, 10) || 1);
const waitMs = Math.max(0, parseInt(flags.wait ?? "4000", 10));
const scale = Math.max(1, Number(flags.scale ?? 1));
const outDir = resolve(outDirArg);
mkdirSync(outDir, { recursive: true });

// ---------- module loading from the project (cwd) first, then next to this script ----------
function load(name) {
  for (const base of [join(process.cwd(), "noop.js"), fileURLToPath(import.meta.url)]) {
    try { return createRequire(base)(name); } catch { /* try the next base */ }
  }
  return null;
}

// ---------- tiny static server with byte ranges (videos need them to seek) ----------
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
  const args = ["--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist"];
  if (!flags.gpu) args.push("--use-angle=swiftshader", "--enable-unsafe-swiftshader");
  const opts = { headless: true, args };
  if (flags.chrome) return pw.chromium.launch({ ...opts, executablePath: flags.chrome });
  try { return await pw.chromium.launch(opts); } catch (first) {
    const exe = CHROMES.find((p) => existsSync(p));
    if (!exe) throw new Error(`No browser found (${first.message.split("\n")[0]}). Pass --chrome <path> or run npx playwright install chromium`);
    return pw.chromium.launch({ ...opts, executablePath: exe });
  }
}

// ---------- contact sheets (sharp is optional) ----------
async function sheet(files, out, thumbW, cols) {
  const sharp = load("sharp");
  if (!sharp || !files.length) return false;
  const meta = await sharp(files[0]).metadata();
  const thumbH = Math.round((thumbW * meta.height) / meta.width), gap = 12;
  const rows = Math.ceil(files.length / cols), used = Math.min(cols, files.length);
  const tiles = await Promise.all(files.map(async (f, i) => ({
    input: await sharp(f).resize(thumbW, thumbH, { fit: "cover", position: "top" }).png().toBuffer(),
    left: gap + (i % cols) * (thumbW + gap),
    top: gap + Math.floor(i / cols) * (thumbH + gap),
  })));
  await sharp({ create: { width: gap + used * (thumbW + gap), height: gap + rows * (thumbH + gap), channels: 3, background: { r: 22, g: 22, b: 26 } } })
    .composite(tiles).png().toFile(out);
  return true;
}

// ---------- run ----------
let server = null, pageUrl;
if (/^https?:\/\//i.test(target)) pageUrl = target;
else {
  const page = flags.page || "index.html";
  if (!existsSync(join(resolve(target), page))) { console.error(`Not found: ${join(resolve(target), page)}`); process.exit(1); }
  server = await serve(target);
  pageUrl = `http://127.0.0.1:${server.address().port}/${page.replace(/\\/g, "/")}`;
}
const VIEWS = [
  { tag: "d", name: "desktop", ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: scale } },
  { tag: "p", name: "phone", ctx: { viewport: { width: 390, height: 844 }, deviceScaleFactor: scale, isMobile: true, hasTouch: true } },
].filter((v) => !flags.only || v.name === flags.only);

const browser = await launch();
let total = 0;
try {
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ ...v.ctx, reducedMotion: flags["reduced-motion"] ? "reduce" : "no-preference" });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errs.push(`console: ${m.text()}`); });
    page.on("requestfailed", (r) => { const why = r.failure()?.errorText || ""; if (!/ERR_ABORTED/.test(why)) errs.push(`failed: ${r.url()} ${why}`); });
    page.on("response", (r) => { if (r.status() >= 400) errs.push(`HTTP ${r.status()}: ${r.url()}`); });
    const files = [];
    for (let i = 0; i < count; i++) {
      const u = new URL(pageUrl);
      u.searchParams.set("shot", String(i));
      try {
        await page.goto(u.href, { waitUntil: "load", timeout: 60000 });
        await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true));
        await page.waitForTimeout(waitMs);
        const file = join(outDir, `${v.tag}${i}.png`);
        await page.screenshot({ path: file });
        files.push(file);
      } catch (e) { errs.push(`shot ${i}: ${e.message.split("\n")[0]}`); }
    }
    total += files.length;
    const uniq = [...new Set(errs)];
    console.log(`${v.name}: ${files.length} of ${count} shots, errors: ${uniq.length ? "\n  " + uniq.slice(0, 12).join("\n  ") : "none"}`);
    const sheetFile = join(outDir, v.tag === "d" ? "desk-sheet.png" : "phone-sheet.png");
    try {
      if (await sheet(files, sheetFile, v.tag === "d" ? 480 : 195, v.tag === "d" ? 3 : 6)) console.log(`  sheet: ${sheetFile}`);
      else if (files.length) console.log("  no contact sheet (install sharp for one: npm i -D sharp)");
    } catch (e) { console.log(`  contact sheet failed: ${e.message}`); }
    await ctx.close();
  }
} finally {
  await browser.close();
  server?.close();
}
console.log(`${total} screenshots in ${outDir}`);
