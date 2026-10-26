# Security policy

## Supported versions

| Version | Supported |
|---|---|
| 1.x | Yes |
| Older | No |

Security fixes land on the default branch and in the next tagged release.

## Reporting a vulnerability

Please do not open a public issue, discussion or pull request for a security problem.

Report it privately through the enquiry form on the LIKE A KING INC. website:

**[likeakinginc.com/#enquiries](https://likeakinginc.com/#enquiries)**

Start the message with `SECURITY: regescore-motioncraft-skills` and include:

- What the problem is and where it is (file and line, or the command you ran)
- Steps to reproduce, with the smallest example that shows it
- What an attacker could do with it
- Your name or handle if you would like credit

We aim to acknowledge reports within five business days and to keep you updated until the issue is resolved. Please give us a reasonable time to ship a fix before you disclose it publicly. We are glad to credit reporters in the release notes.

## Scope

In scope:

- The scripts in `plugins/motioncraft/skills/*/scripts/`. Two of them (`section-shots.mjs` and `qa-lite.mjs`) start a temporary static file server bound to `127.0.0.1` on a random port and refuse paths outside the folder you pass. A way to read files outside that folder, reach the server from another machine, or run code through crafted arguments or pages is in scope.
- The plugin manifests in `.claude-plugin/` and `plugins/motioncraft/.claude-plugin/`.
- Instructions in a `SKILL.md` or reference file that would lead an agent to do something unsafe, such as running untrusted code or leaking secrets.
- The free templates in `templates/`.

Out of scope:

- Third-party services and libraries (three.js, Playwright, sharp, browsers). Report those to their maintainers.
- The AnimatedWebs website, MCP server and other LIKE A KING INC. products. Report those through the same enquiry form, and say which product it is.
- Findings that need a compromised machine or a malicious browser extension to work.

## Safe use of the scripts

- Run the QA and screenshot scripts on pages you trust. They load the page in a real browser and execute its JavaScript.
- Keep Node, Playwright and your browser up to date.
- The scripts never need API keys or network access beyond loading the page you point them at.
