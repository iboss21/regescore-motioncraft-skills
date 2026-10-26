# Tools

MotionCraft Skills work on their own: the craft, the checks and the scripts are all in this repository. These tools from the same team give your agent a head start, with real template prompts, ready three.js components and a design workspace you can reach from your editor.

| Tool | Link | What it does |
|---|---|---|
| AnimatedWebs | [animatedwebs.com](https://animatedwebs.com) | 1,500+ motion website templates with live demos and build prompts |
| Templates | [animatedwebs.com/templates](https://animatedwebs.com/templates) | The catalog, by industry, style and kind. Play every demo before you pick |
| AnimatedWebs MCP | [animatedwebs.com/mcp](https://animatedwebs.com/mcp) | Templates, UI components, cinematic backgrounds and style references inside your AI editor |
| AnimatedWebs Tools | [tools.animatedwebs.com](https://tools.animatedwebs.com) | three.js hero components, interactive shaders and prompts with variants you can tune |
| AnimatedWebs Designer | [design.animatedwebs.com](https://design.animatedwebs.com) | A private design workspace with AnimatedWebs AI, with its own MCP |
| AnimatedWebs for Claude Code | [github.com/iboss21/animatedwebs-claude](https://github.com/iboss21/animatedwebs-claude) | The official Claude Code plugin: the MCP plus site, hero and browse commands |

## AnimatedWebs MCP

**Endpoint:** `https://mcp.animatedwebs.com` · **Transport:** Streamable HTTP · **Sign-in:** your browser opens on first use, no API key to paste.

### Claude Code

Plugin (MCP plus skills and commands), run inside Claude Code:

```text
/plugin marketplace add iboss21/animatedwebs-claude
/plugin install animatedwebs@animatedwebs
```

Or the MCP server only, from a terminal:

```bash
claude mcp add --transport http animatedwebs https://mcp.animatedwebs.com
```

Add `--scope user` to make it available in every project.

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "animatedwebs": { "url": "https://mcp.animatedwebs.com" }
  }
}
```

### Codex

```bash
codex mcp add animatedwebs --url https://mcp.animatedwebs.com
codex mcp login animatedwebs
```

### VS Code (Copilot agent mode)

```bash
code --add-mcp '{"name":"animatedwebs","type":"http","url":"https://mcp.animatedwebs.com"}'
```

### Claude Desktop

Settings, then Connectors, then Add custom connector. Paste `https://mcp.animatedwebs.com`.

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`, then refresh:

```json
{
  "mcpServers": {
    "animatedwebs": { "serverUrl": "https://mcp.animatedwebs.com" }
  }
}
```

### Reges Code

[Reges Code](https://regescode.com), the AI code editor from the same family, comes with AnimatedWebs already set up.

### Anything else

Any client that speaks Streamable HTTP (Zed, Cline, Roo, Goose, n8n and others):

```json
{
  "mcpServers": {
    "animatedwebs": { "url": "https://mcp.animatedwebs.com" }
  }
}
```

The [MCP page](https://animatedwebs.com/mcp) always has the current command for each editor, plus one-click buttons for Cursor and VS Code.

### What the MCP gives your agent

| Area | Tools |
|---|---|
| Templates | `search_templates`, `get_template`, `get_template_prompt`, `list_categories`, `open_in_builder`, `request_template` |
| UI library | `search_components`, `list_component_categories`, `get_component`, `get_component_source`, `generate_component`, `refine_component` |
| Cinematic backgrounds | `search_backgrounds`, `get_background` |
| Styles | `search_styles`, `get_style_reference` |
| Design and account | `get_design_workspace`, `search_everything`, `get_account`, `get_pricing`, `search_creators`, `get_creator` |

Ready-made prompts show up as slash commands in most editors: `build_animated_site`, `upgrade_hero`, `add_ui_component`, `generate_ui` and `design_with_animatedwebs`.

Free accounts open every free prompt. Pro unlocks the whole catalog. Pro templates, prompts and code are licensed for AnimatedWebs members only, see [pricing](https://animatedwebs.com/pricing) and the [terms](https://animatedwebs.com/terms).

## AnimatedWebs Tools

[tools.animatedwebs.com](https://tools.animatedwebs.com) is a library of three.js hero components and interactive shaders with variants you can tune. They are framework agnostic: copy, paste and ship. Pair them with the `motion-analytics` skill: drop [frame-meter.js](../plugins/motioncraft/skills/motion-analytics/scripts/frame-meter.js) on the page and confirm the component fits your frame budget on a phone before you commit to it.

## AnimatedWebs Designer

[design.animatedwebs.com](https://design.animatedwebs.com) is your own Design Studio workspace with AnimatedWebs AI: create design projects, generate artifacts and run them. Free accounts get a daily allowance of AI requests, and Pro gets more. It has its own MCP: ask your agent to run `get_design_workspace` (or the `design_with_animatedwebs` prompt) and it returns a personal one-line setup for Claude Code, Cursor and VS Code.

## Three workflows that use the tools and the skills together

**1. From a template to a site that belongs to the customer.**
Search with `search_templates`, open the live demo, pull the prompt with `get_template_prompt`. Then run Steps 1 to 3 of [motioncraft-builder](../plugins/motioncraft/skills/motioncraft-builder/SKILL.md): find the one idea in the customer's own world, choose a page architecture and write the beat sheet, so the result is theirs and not a reskin. Finish with [motion-review](../plugins/motioncraft/skills/motion-review/SKILL.md).

**2. Upgrade a hero without hurting speed.**
Run the `upgrade_hero` prompt, then measure before and after with [motion-analytics](../plugins/motioncraft/skills/motion-analytics/SKILL.md). Ship only if p95 frame time stays under budget on a phone and the page passes `qa-lite.mjs`.

**3. Grade a build against its design.**
Export frames from your Designer project, shoot the build with `section-shots.mjs`, and build a side-by-side sheet with `compare-sheet.mjs --blind`. Follow the three-grader method in [reference-grading.md](../plugins/motioncraft/skills/motion-analytics/references/reference-grading.md).

---

Back to the [main README](../README.md) · See the whole [LIKE A KING INC. ecosystem](../docs/ecosystem.md)
