# Contributing to MotionCraft Skills

Thank you for helping. MotionCraft is useful because every rule has a number behind it and every snippet runs. Contributions that keep it that way are very welcome.

## What we are looking for

| Welcome | Please open an issue first |
|---|---|
| New technique recipes in the house format | New skills or a new top-level folder |
| Sharper craft rules with concrete values | Changes to the rubric bar or the blocking checks |
| Fixes and new options for the four scripts | New free templates (they are curated by the maintainers) |
| New QA checks that can be measured | Ports to a framework (React Three Fiber, Vue, Svelte) |
| Clearer wording, typo fixes, broken links | Anything that adds a dependency or a build step |

Bug fixes to the templates in `templates/` are welcome. Templates keep their own license, see [templates/LICENSE.md](templates/LICENSE.md).

## Ground rules

1. **Your own work only.** Never copy code, text, shaders, images, video or a hero concept from another site, template, course or skill, even if it is open source under a license that would allow it. Study the idea and write your own version. Pull requests that copy will be closed.
2. **Fictional brands and people.** Examples use invented American businesses and names, for example "Cinderford Coffee Roasters" or "Lakemont Bike Fitters". Never use a real company, a real person or a real customer.
3. **Numbers, not adjectives.** "A 0.15 to 0.85 smoothstep hold" beats "smooth easing". "p95 under 16.7 ms on a mid-range phone" beats "fast".
4. **Phones and access are part of the recipe.** Every recipe states what changes on a phone and what the reduced-motion version is, even when the answer is "same".
5. **No secrets.** No API keys, tokens, private URLs, internal hostnames or personal file paths in code, examples or screenshots.

## Writing a technique recipe

Add the recipe to the matching file in `plugins/motioncraft/skills/motioncraft-builder/references/techniques/` under a heading like `## R27. Name of the recipe`, and add a row to [INDEX.md](plugins/motioncraft/skills/motioncraft-builder/references/techniques/INDEX.md) with its wow, effort and cost. Inside the recipe, use these bold labels in this order:

1. **What it is.** One or two sentences.
2. **When to use.** The story moments it serves, and when not to use it.
3. **Premium values.** The parameter values that make it look expensive.
4. A code snippet: under about 60 lines, a valid ES module.
5. **Phone.** What changes on a portrait screen.
6. **Reduced motion.** What the visitor sees instead.
7. **Cost.** Free, Low, Medium or High, as defined in the index.

Code rules:

- Vanilla JavaScript modules, no build step.
- three.js 0.170 from an import map:
  ```html
  <script type="importmap">
  { "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  } }
  </script>
  ```
- One render loop per page. Stop it when the tab is hidden or the canvas is off screen.
- Respect `prefers-reduced-motion` and the page's pause control.
- Cap device pixel ratio (1.5 on phones is a good default).

## House style

- American English, plain and confident. Short sentences.
- No em dashes or en dashes anywhere. Use commas, colons and periods.
- No hype words ("revolutionary", "game-changing", "magic"). Show the result instead.
- No emojis in headings.
- Sentence case for headings.

## Before you open a pull request

Run these from the repo root:

```bash
# every script parses
for f in $(git ls-files '*.js' '*.mjs'); do node --check "$f" || exit 1; done

# every JSON file is valid
for f in $(git ls-files '*.json'); do python -c "import json,sys; json.load(open(sys.argv[1], encoding='utf-8'))" "$f" || exit 1; done

# no em or en dashes slipped in (prints file:line for each one and fails; works on Windows, macOS and Linux)
python -c "import subprocess,sys; fs=subprocess.run(['git','ls-files','*.md','*.js','*.mjs','*.json','*.html','*.css'],capture_output=True,text=True).stdout.split(); bad=[f'{f}:{n}' for f in fs for n,l in enumerate(open(f,encoding='utf-8'),1) if chr(8211) in l or chr(8212) in l]; bad and print('\n'.join(bad)); sys.exit(1 if bad else 0)"
```

If you changed a script, run it against a real page and paste the output in the pull request. If you changed a template, run `qa-lite.mjs` on its folder: all 12 blocking checks must still pass. If you changed a recipe, paste the snippet into a blank page with the import map above and confirm there are no console errors at 1440x900 and 390x844.

Pull request checklist:

- [ ] One topic per pull request
- [ ] Recipe or rule follows the format above, with phone and reduced-motion notes
- [ ] Scripts parse and run, JSON is valid, no em or en dashes
- [ ] No copied material, no real brands or people, no secrets
- [ ] Links between files resolve

## Reporting bugs and asking for features

Open an [issue](https://github.com/iboss21/regescore-motioncraft-skills/issues) with what you ran, what you expected and what happened. Include the browser, the device and the script output when it is relevant.

Found a security problem? Do not open a public issue. Follow [SECURITY.md](SECURITY.md).

## Code of conduct

Be kind, be specific and assume good intent. Critique the work, not the person. Maintainers may remove comments or contributions that are hostile, harassing or off topic.

## License

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE) of this repository, or under [templates/LICENSE.md](templates/LICENSE.md) when it changes a file in `templates/`.
