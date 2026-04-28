# 0001 Link

Link is the private, read-only workspace for client-facing Notion data. It
lives on the same origin at `/client-login/`. Public pages under the site root
are unchanged.

## Architecture

- **Frontend:** React SPA under `client/client-login/`, built by the same
  `vite build` as a second rollup entry. Hash routing (e.g. `#/clients/:id`)
  avoids Cloudflare Pages SPA-fallback fragility.
- **Backend:** Convex (`convex/`). Auth is `@convex-dev/auth` with a Resend
  email-OTP provider (`convex/ResendOTP.ts`). Admin queries/mutations call
  `requireAdmin(ctx)` (`convex/admin.ts`); emails in `ADMIN_EMAILS` can see all
  records. Non-admin users can sign in and are matched to synced client records
  by normalized email from the Notion `1.1 Leads` database `Email` property.
- **Sync:** `internal.notion.pull.run` (`convex/notion/pull.ts`) paginates the
  configured Notion databases, maps each page, and upserts by `notionId`. By
  default it syncs `1.1 Leads` into clients, the Clients-tab Projects database into projects, and
  project page bodies into project detail content. A cron (`convex/crons.ts`) runs it every 5 minutes.
  Manual sync can be run through Convex with `bunx convex run --push notion/pull:run '{}'`.
- **Cached tables:** `clients`, `projects`, `sows`, `contracts`, `backOffice`,
  plus `syncRuns` for observability. All mirror Notion property
  JSON under a `raw` column so schema drift doesn't break the Link.
  Related client-facing rows store `clientId` as the Notion Client relation page
  ID, matching `clients.notionId`.

## Setup

1. Install deps (already done if you have a fresh `bun install`):

   ```
   bun install
   ```

2. Provision a Convex deployment for this repo:

   ```
   bunx convex dev
   ```

   This writes `CONVEX_DEPLOYMENT` to `.env.local` and prints a
   `https://…convex.cloud` URL. Copy that into `.env.local` as
   `VITE_CONVEX_URL=…`.

3. Set Convex-side env (kept in Convex, not in `.env`):

   ```
   bunx convex env set AUTH_RESEND_KEY re_xxx
   bunx convex env set NOTION_API_KEY secret_xxx
   bunx convex env set SITE_URL http://localhost:5173/client-login/
   ```

   The Resend key must belong to a verified sender for `noreply@0001.dev` (or
   change the `from` address in `convex/ResendOTP.ts`).

   For production, set `SITE_URL` to the deployed Link path, e.g.
   `https://0001.dev/client-login/`.

   Optional databases can be configured in the same Convex env store. If
   omitted, sync skips those tables without failing:

   ```
   bunx convex env set NOTION_BACK_OFFICE_DATABASE_ID notion_database_id
   bunx convex env set NOTION_SOWS_DATABASE_ID notion_database_id
   bunx convex env set NOTION_CONTRACTS_DATABASE_ID notion_database_id
   ```

4. Generate Convex Auth signing keys for the deployment:

   ```
   bun run auth:keys
   ```

   For production, use:

   ```
   bun run auth:keys -- --prod
   ```

5. Share `1.1 Leads` and the Clients-tab Projects database with the Notion integration
   whose token you stored in `NOTION_API_KEY`. The database IDs live in
   `convex/notion/pull.ts` under `DB_IDS`.

6. Start the full stack in two terminals:

   ```
   bunx convex dev     # backend + cron + codegen into convex/_generated/
   bun run dev         # Vite; served at http://localhost:5173/client-login/
   ```

## Roles and access

- Admin access is limited to `joachim@0001.dev` in `shared/adminEmails.ts`.
  The admin UI shows only the Figma-style clients list.
- Clients can request an OTP for any valid email. After sign-in, Convex matches
  the normalized email to `clients.emailNormalized`, derived from the Notion
  `1.1 Leads` database `Email` property. Matched clients see only their client
  dashboard and records related through Notion Client relation fields.
- Signed-in users with no admin role and no matching client record see a
  no-access state. They do not receive global list data.

## Adding a new admin

Edit `ADMIN_EMAILS` in `shared/adminEmails.ts`. Convex will hot-redeploy on
save.

## Seeding data

The first run of `bunx convex dev` starts the cron. To pull immediately:

```
bunx convex run notion:pull:run '{}'
```

The old sidebar sync control has been removed from the Link UI.

## Deploying

- **Convex:** `bunx convex deploy` (from CI or locally).
- **Pages:** `bun run deploy` (runs `fetch-notion` + `vite
  build` + `wrangler pages deploy`). Cloudflare Pages env must include
  `VITE_CONVEX_URL` pointing at the production Convex URL.

## Notes

- The Notion property parsers in `convex/notion/properties.ts` duplicate parts
  of `scripts/fetch-notion.ts` because one runs under Bun at build-time and the
  other under the Convex runtime — unify in a later pass once the need is
  clearer.
- No `_redirects` changes are needed — hash routing inside the Link handles
  client-side navigation.
- All `/client-login/` assets are behind `noindex, nofollow`. The public
  product table continues to be generated statically at build time by
  `scripts/fetch-notion.ts`.
