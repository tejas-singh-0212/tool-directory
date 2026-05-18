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
  "purpose": "Short description"
}
```
