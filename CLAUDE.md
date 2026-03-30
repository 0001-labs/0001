# 0001-website

Marketing and portfolio website for 0001 labs.

## Stack

- Vite + TypeScript
- Notion API for dynamic content
- Cloudflare Pages

## Scripts

- `bun run dev` — Development server
- `bun run build` — Production build (fetches Notion data)
- `bun run fetch-notion` — Sync product data from Notion
- `bun run deploy` — Build and deploy to Cloudflare Pages

## Pages

- index.html (home)
- about.html
- services.html
- contact.html
- products.html (populated from Notion)

## Environment

Requires `NOTION_API_KEY` in `.env`

## Git commits

- Do not add Co-Authored-By lines to commits.
