# Ultimate Tool Directory

A searchable, cyberpunk-styled directory of AI tools, developer resources, design apps, productivity utilities, learning platforms, and useful web experiments. Fully client-side: no build step, no backend, no frameworks.

## Features

- **300+ tools** across 26 categories, from AI Agents to 3D & CAD
- **Live client-side search** that filters by name, purpose, URL, or category
- **Category filter dropdown** dynamically populated from the data
- **Real-time result counter** showing visible vs total counts
- **One-click copy** for tool URLs (Clipboard API with fallback)
- **Dark/light mode toggle** persisted in localStorage
- **Accessible**: ARIA labels, `aria-live` regions, `sr-only` text, keyboard navigation, focus-visible styles
- **Responsive** with horizontally scrollable table on mobile
- **Loading spinner** and friendly error messages for fetch failures
- **Styled empty state** with context-aware messages
- **CI validation** via GitHub Actions on every PR/push touching `tools.json`

## File Structure

```
.
├── index.html              # Page shell: search input, filter, table, toast
├── style.css               # Themes (dark/light), layout, responsive, components
├── script.js               # Fetch, sort, filter, render, copy, theme toggle
├── tools.json              # Tool catalog (~270 records)
├── README.md               # This file
├── scripts/
│   ├── validate-tools-json.py   # Python validation script for CI and local use
│   └── check-links.py           # Link health checker
└── .github/workflows/
    ├── validate-tools-json.yml   # GitHub Actions workflow
    └── check-links.yml           # Link check workflow
```

## Tool Record Format

Each entry in `tools.json` is an object with four required fields:

```json
{
    "name": "Tool Name",
    "url": "https://example.com",
    "purpose": "Short description of what the tool does",
    "category": "AI Coding"
}
```

- `name`: Display name (must be unique, case-insensitive)
- `url`: Link to the tool (must start with `http://` or `https://`)
- `purpose`: Brief one-line description
- `category`: Must be one of the approved categories (see below)

## Approved Categories

| Category | Category | Category |
|---|---|---|
| AI Agents | AI Chat | AI Writing |
| AI Coding | Web Builder | Design |
| Image Editing | Image Generation | Video |
| Audio & Music | Presentation | Research |
| Learning | Coding Practice | Developer Tools |
| Productivity | Automation | Jobs & Career |
| Travel | 3D & CAD | Games |
| Utilities | Cybersecurity | Hardware & Simulation |
| Marketplaces | Other | |

## Adding or Editing a Tool

1. Open `tools.json` in any text editor.
2. Add a new object to the top-level array (order does not matter as tools are sorted alphabetically at runtime).
3. Ensure all four fields are present and valid (see record format above).
4. Make sure the `name` is not already used by another tool.
5. Make sure the `url` is not a duplicate of an existing entry.
6. Run validation before committing (see below).

## Local Setup

No installation required. Serve the directory from any static HTTP server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

Do **not** open `index.html` directly via `file://` - `fetch()` requires HTTP.

## Validating tools.json

Before committing changes, run the validation script from the repo root:

```bash
python3 -m json.tool tools.json > /tmp/tools.valid.json
python3 scripts/validate-tools-json.py
```

The validator checks:
- Valid JSON syntax
- Top-level array structure
- All required fields present (`name`, `url`, `purpose`, `category`)
- No empty required fields
- Valid URL format (must start with `http://` or `https://`)
- No duplicate tool names (case-insensitive)
- No duplicate URLs (trailing-slash tolerant)
- Category is in the approved list

Expected output on success:

```
tools.json validation passed. Total tools: 270
```

## Checking Links

To check whether tool URLs are reachable, run:

```bash
python3 scripts/check-links.py
```

The link checker follows redirects and treats `200-399`, `401`, `403`, and `429` as acceptable responses. This avoids marking bot-blocked or rate-limited sites as broken too aggressively.

To fail with a non-zero exit code when broken links are found, run:

```bash
python3 scripts/check-links.py --strict
```

A GitHub Actions workflow is also available under **Actions > Check links**. It can be triggered manually and also runs monthly.

## GitHub Pages Deployment

The site is deployed from the `main` branch via **GitHub Pages**:

1. Go to your repository **Settings > Pages**.
2. Under "Branch", select `main` and the root `/` folder.
3. Save: the site will be available at `https://<username>.github.io/<repo>/`.

Changes pushed to `main` are automatically deployed. The CI workflow (`.github/workflows/validate-tools-json.yml`) runs on every push and pull request that modifies `tools.json` to catch issues before deployment.

## Troubleshooting

| Problem | Cause / Fix |
|---|---|
| Table shows "Failed to load tools" | You opened `index.html` via `file://`. Use `python3 -m http.server 8000` instead. |
| Validation fails with "duplicate name" | Two tools have the same name (case-insensitive). Rename one. |
| Validation fails with "unknown category" | The tool uses a category not in the approved list. Fix the spelling or add the category. |
| Filter dropdown is empty or tools missing | `tools.json` may have a JSON syntax error. Run `python3 -m json.tool tools.json` to check. |
| Theme preference not saved | localStorage may be unavailable (private browsing restrictions). The toggle still works for the session. |

## Maintenance Notes

- `tools.json` is the single source of truth. Do not edit `script.js` to add tools.
- Tool names and URLs must be unique. Run validation to catch duplicates.
- Commits that only change `tools.json` will trigger CI. Fix any validation failures before merging.
- When adding a new category, update the `ALLOWED_CATEGORIES` set in `scripts/validate-tools-json.py` and the approved categories table in this README.
- The site has no build step: deploy by pushing to `main`.


## Disclaimer

This directory is maintained as a personal collection of useful web tools and resources. Some entries are included for learning, testing, archival, awareness, or personal-reference purposes. Users are responsible for following applicable laws, platform terms, and ethical usage guidelines.

---

#### Non deployable
- <a href="https://apk4all.com.im/">APK4All</a>
- <a href="https://www.oxaam.com/">Oxaam</a>
- <a href="https://purehd.cc/">PureHD</a>
- <a href="https://flixer.su/">Flixer</a>
- <a href="https://cinezo.net/">CineZo</a>
- <a href="https://flikhub.net/">FlikHub</a>
- <a href="https://yenime.net/">Yenime</a>
- <a href="https://arrowtv.net/">Arrow Tv</a>
