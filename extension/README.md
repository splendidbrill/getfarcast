# Farcast Chrome Extension

This folder contains the standalone Chrome Extension project for Farcast.

## Boundaries

- This extension is intentionally isolated from the root Next.js application.
- It builds with Vite + React + TypeScript.
- It communicates with the main Farcast app over HTTP using the existing Next.js API routes.

## Commands

- `npm install`
- `npm run build`
- `npm run dev`
- `npm run typecheck`

## Notes

- `manifest.json` lives at the root of this folder and is copied into `dist/` during the Vite build.
- Background and content-script entry files are emitted with stable, non-hashed filenames for Manifest V3.
- Add PNG icon assets under `public/icons/` before publishing.
