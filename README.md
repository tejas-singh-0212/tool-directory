# tool-directory
A searchable cyberpunk-styled directory of AI tools, developer resources, and useful web applications.

## Current Architecture
This site is now data-driven:
- UI shell: `index.html`
- Styling: `style.css`
- Dynamic logic (fetch + render + search + theme): `script.js`
- Tool database: `tools.json`

The page loads tool records from `tools.json` at runtime and renders the table dynamically. Clicking the copy button copies a tool's URL to the clipboard and shows an animated "Link copied to clipboard!" toast notification in the bottom-right corner.

## Deployment Notes
As long as all files are deployed in the same directory the following fetch path works:

```js
fetch('tools.json')
```

## Tool Record Format
Each item in `tools.json` follows this shape:

```json
{
  "name": "Tool Name",
  "url": "https://example.com",
  "purpose": "Short description",
  "category": "Category Name"
}

## Validating tools.json

Before committing changes to `tools.json`, run:

```bash
python3 -m json.tool tools.json > /tmp/tools.valid.json
python3 scripts/validate-tools-json.py
```

The validation checks JSON syntax, required fields, duplicate names, duplicate URLs, URL format, and approved categories.

## Disclaimer

This directory is maintained as a personal collection of useful web tools and resources. Some entries are included for learning, testing, archival, awareness, or personal-reference purposes. Users are responsible for following applicable laws, platform terms, and ethical usage guidelines.
