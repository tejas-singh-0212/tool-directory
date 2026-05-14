# tool-directory
A searchable cyberpunk-styled directory of AI tools, developer resources, and useful web applications.

## Current Architecture
This site is now data-driven:
- UI shell: `index.html`
- Styling: `style.css`
- Dynamic logic (fetch + render + search + theme): `script.js`
- Tool database: `tools.json`

The page loads tool records from `tools.json` at runtime and renders the table dynamically.

## Deployment Notes
Ensure `tools.json` is deployed in the same directory level as `index.html` so this fetch path works:

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
