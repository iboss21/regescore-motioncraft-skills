#!/usr/bin/env node
// compare-sheet.mjs: side-by-side contact sheet from two folders of screenshots, for grading a page against a reference.
// Part of MotionCraft Skills by LIKE A KING INC. MIT licensed. Method: ../references/reference-grading.md
//
// Usage:
//   node compare-sheet.mjs <leftDir> <rightDir> <outDir> [--labels "Ours,Reference"] [--blind] [--title "..."]
//
// Pairs images (png, jpg, jpeg, webp) that have the same file name in both folders, in file name order.
// Writes to outDir:
//   compare.html  always: every pair side by side, with a verdict form for graders (no dependencies)
//   compare.png   when sharp is installed (npm i -D sharp): all pairs in one image, left column = left folder (A with --blind)
//   img/          copies of the images with neutral names, so the sheet folder can be sent as is
//   key.json      with --blind: sides are shuffled per row and labeled A and B; this file says which is which
// Requires Node 18+.

import { createRequire } from "node:module";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, parse, resolve } from "node:path";
import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";

const BOOL = new Set(["blind", "help"]);
const flags = {}, pos = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) { pos.push(a); continue; }
  const k = a.slice(2);
  flags[k] = BOOL.has(k) ? true : argv[++i];
}
const [leftDir, rightDir, outArg] = pos;
if (flags.help || !leftDir || !rightDir || !outArg) {
  console.log('usage: node compare-sheet.mjs <leftDir> <rightDir> <outDir> [--labels "Ours,Reference"] [--blind] [--title "..."]');
  process.exit(flags.help ? 0 : 1);
}
for (const d of [leftDir, rightDir]) if (!existsSync(d) || !statSync(d).isDirectory()) { console.error(`Not a folder: ${d}`); process.exit(1); }
const [labelL, labelR] = (flags.labels || "Left,Right").split(",").map((s) => s.trim());
const title = flags.title || `${labelL} vs ${labelR}`;
const outDir = resolve(outArg);
mkdirSync(join(outDir, "img"), { recursive: true });

// ---------- pair files by name ----------
const IMG = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const list = (d) => readdirSync(d).filter((f) => IMG.has(extname(f).toLowerCase()) && statSync(join(d, f)).isFile());
const L = list(leftDir), R = new Set(list(rightDir));
const names = L.filter((f) => R.has(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const onlyL = L.filter((f) => !R.has(f)), onlyR = [...R].filter((f) => !L.includes(f));
if (!names.length) { console.error("No matching file names in the two folders."); process.exit(1); }

const rows = names.map((name, k) => {
  const swap = flags.blind ? randomInt(2) === 1 : false;
  const files = swap ? [join(rightDir, name), join(leftDir, name)] : [join(leftDir, name), join(rightDir, name)];
  const ext = extname(name).toLowerCase();
  const copies = ["a", "b"].map((side, j) => {
    const rel = `img/${String(k + 1).padStart(2, "0")}-${side}${ext}`;
    copyFileSync(files[j], join(outDir, rel));
    return rel;
  });
  const labels = flags.blind ? ["A", "B"] : [labelL, labelR];
  return { row: k + 1, moment: parse(name).name, files, copies, labels, key: swap ? { A: labelR, B: labelL } : { A: labelL, B: labelR } };
});

// ---------- HTML sheet ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rowHtml = rows.map((r) => `
<section class="row" data-row="${r.row}" data-moment="${esc(r.moment)}">
  <h2><span>${r.row}</span> ${esc(r.moment)}</h2>
  <div class="pair">
    <figure><img src="${r.copies[0]}" alt="${esc(r.labels[0])}, ${esc(r.moment)}" loading="lazy"><figcaption>${esc(r.labels[0])}</figcaption></figure>
    <figure><img src="${r.copies[1]}" alt="${esc(r.labels[1])}, ${esc(r.moment)}" loading="lazy"><figcaption>${esc(r.labels[1])}</figcaption></figure>
  </div>
  <fieldset>
    <legend>Verdict for row ${r.row}</legend>
    ${["close", "partial", "different"].map((v) => `<label><input type="radio" name="v${r.row}" value="${v}"> ${v}</label>`).join("\n    ")}
    <input type="text" name="e${r.row}" placeholder="One sentence of evidence" aria-label="Evidence for row ${r.row}">
  </fieldset>
</section>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { color-scheme: dark; --bg: #121214; --panel: #1c1c20; --line: #2e2e34; --text: #ececf0; --muted: #a2a2ad; --accent: #7cc4ff; }
  * { box-sizing: border-box; }
  html { background: var(--bg); }
  body { margin: 0; padding: 24px 16px 64px; font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--text); background: var(--bg); }
  main { max-width: 1600px; margin: 0 auto; }
  header p { color: var(--muted); max-width: 70ch; }
  .row { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin: 20px 0; }
  .row h2 { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
  .row h2 span { display: inline-grid; place-items: center; min-width: 28px; height: 28px; margin-right: 8px; border-radius: 6px; background: var(--line); }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
  figure { margin: 0; }
  figure img { display: block; width: 100%; height: auto; border-radius: 6px; background: #000; }
  figcaption { margin-top: 6px; color: var(--muted); font-size: 13px; }
  fieldset { border: 0; padding: 12px 0 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; }
  legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  label { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; cursor: pointer; }
  input[type=text] { flex: 1 1 280px; min-height: 44px; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); font: inherit; }
  button { min-height: 44px; padding: 0 18px; border: 0; border-radius: 8px; background: var(--accent); color: #06131f; font: 600 15px/1 system-ui, sans-serif; cursor: pointer; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  textarea { width: 100%; min-height: 160px; margin-top: 12px; padding: 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); font: 13px/1.5 ui-monospace, Consolas, monospace; }
  @media (max-width: 700px) { .pair { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
<header>
  <h1>${esc(title)}</h1>
  <p>${rows.length} matched moment${rows.length === 1 ? "" : "s"}.${flags.blind ? " Sides are shuffled per row and labeled A and B. Do not try to guess which is which." : ""}
  For each row choose <b>close</b> (same look and caliber, differences need side by side to notice), <b>partial</b> (same idea, at least one gap noticed without side by side) or <b>different</b> (a different look, a lower tier of craft, or missing or broken), and write one sentence of evidence.</p>
</header>
${rowHtml}
<section class="row">
  <button type="button" id="collect">Collect verdicts</button>
  <textarea id="out" readonly aria-label="Collected verdicts"></textarea>
</section>
</main>
<script>
  document.getElementById("collect").addEventListener("click", async () => {
    const lines = [...document.querySelectorAll("section[data-row]")].map((s) => {
      const r = s.dataset.row, v = s.querySelector("input[name=v" + r + "]:checked");
      return r + "\\t" + s.dataset.moment + "\\t" + (v ? v.value : "(none)") + "\\t" + s.querySelector("input[name=e" + r + "]").value.trim();
    });
    const out = document.getElementById("out");
    out.value = "row\\tmoment\\tverdict\\tevidence\\n" + lines.join("\\n");
    try { await navigator.clipboard.writeText(out.value); } catch (e) { out.select(); }
  });
</script>
</body>
</html>
`;
writeFileSync(join(outDir, "compare.html"), html);
if (flags.blind) writeFileSync(join(outDir, "key.json"), JSON.stringify(rows.map((r) => ({ row: r.row, moment: r.moment, ...r.key })), null, 2));

// ---------- PNG sheet (sharp is optional) ----------
function load(name) {
  for (const base of [join(process.cwd(), "noop.js"), fileURLToPath(import.meta.url)]) {
    try { return createRequire(base)(name); } catch { /* try the next base */ }
  }
  return null;
}
const sharp = load("sharp");
let png = false;
if (sharp) {
  const gap = 16, tiles = [];
  let y = gap, width = 0;
  for (const r of rows) {
    const metas = await Promise.all(r.files.map((f) => sharp(f).metadata()));
    const portrait = metas.some((m) => m.height > m.width);
    const h = portrait ? 780 : 450;
    const bufs = await Promise.all(r.files.map((f) => sharp(f).resize({ height: h }).png().toBuffer({ resolveWithObject: true })));
    let x = gap;
    for (const { data, info } of bufs) { tiles.push({ input: data, left: x, top: y }); x += info.width + gap; }
    width = Math.max(width, x);
    y += h + gap;
  }
  await sharp({ create: { width, height: y, channels: 3, background: { r: 18, g: 18, b: 20 } } }).composite(tiles).png().toFile(join(outDir, "compare.png"));
  png = true;
}

console.log(`${rows.length} pair(s): ${join(outDir, "compare.html")}`);
console.log(png ? `sheet: ${join(outDir, "compare.png")}` : "no compare.png (npm i -D sharp to get one)");
if (flags.blind) console.log(`key: ${join(outDir, "key.json")} (keep it away from graders)`);
if (onlyL.length) console.log(`only in ${leftDir}: ${onlyL.join(", ")}`);
if (onlyR.length) console.log(`only in ${rightDir}: ${onlyR.join(", ")}`);
