# Fancy Swap Form (Problem 2)

This folder contains a React + TypeScript single page application bundled with Vite that simulates a token swap experience with live price data.

## Getting started

```bash
npm install
npm run dev
```

- The dev server starts on http://localhost:5173 by default.
- Vite provides hot module reload, so edits to `src/main.tsx`, `src/App.tsx`, or the Tailwind stylesheet at `src/style.css` are reflected instantly.

## Production build

```bash
npm run build
npm run preview
```

- `npm run build` outputs static assets in `dist/`.
- `npm run preview` serves the production build so you can verify the bundle locally.

## Implementation notes
- Price data comes from https://interview.switcheo.com/prices.json; pairs with missing prices are skipped.
- Token icons are pulled from https://github.com/Switcheo/token-icons.
- Styling is handled with Tailwind CSS plus a small theme extension for the glassmorphism shadows and mesh gradient.
- The layout adjusts responsively down to small screens, preserving readable spacing and stacking the market insights below the swap form.
- The UI supports theme toggling; user preference defaults to the OS `prefers-color-scheme` setting.
- `script.js` remains as a short notice pointing developers to the new React entry point.

## Known limitations
- Network errors show an inline banner but the page does not retry automatically.
- The theme toggle uses text labels instead of emoji to keep the bundle ASCII-only.
