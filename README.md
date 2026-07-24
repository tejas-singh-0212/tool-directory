# Ultimate Tool Directory

350+ tools across 26 categories. Static site, no build step, no backend, no frameworks.

## Tool Record

```json
{"name": "Unique Name", "url": "https://...", "purpose": "One-line description", "category": "One of 26 categories"}
```

**Categories:** AI Agents, AI Chat, AI Writing, AI Coding, Web Builder, Design, Image Editing, Image Generation, Video, Audio & Music, Presentation, Research, Learning, Coding Practice, Developer Tools, Productivity, Automation, Jobs & Career, Travel, 3D & CAD, Games, Utilities, Cybersecurity, Hardware & Simulation, Marketplaces, Other.

## Local Setup

```bash
python3 -m http.server 8000
# then http://localhost:8000 — do NOT open index.html via file://
```

## Validation

```bash
python3 -m json.tool tools.json > /tmp/tools.valid.json
python3 scripts/validate-tools-json.py
# Expected: "tools.json validation passed. Total tools: <N>"
```

## Link Checking

```bash
python3 scripts/check-links.py           # summary
python3 scripts/check-links.py --strict  # exit non-zero on broken links
```

## Deployment

Push to `main` — GitHub Pages auto-deploys at `tejastools.qd.je`. CI validates every push/PR touching `tools.json`.

## Disclaimer

Personal collection. Users are responsible for following applicable laws, platform terms, and ethical guidelines.

#### Non-deployable

[APK4All](https://apk4all.com.im/) · [Oxaam](https://www.oxaam.com/) · [PureHD](https://purehd.cc/) · [Flixer](https://flixer.su/) · [CineZo](https://cinezo.net/) · [FlikHub](https://flikhub.net/) · [Yenime](https://yenime.net/) · [Arrow Tv](https://arrowtv.net/)
