# BeanZz

A manhwa, manga and manhua discovery and reading site built on the official [MangaDex API](https://api.mangadex.org/docs/).

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4 and Lucide icons.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

Checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

### Optional environment variables

| Variable | Purpose |
| --- | --- |
| `MANGADEX_USER_AGENT` | User-Agent sent to MangaDex. Defaults to an honest BeanZz identifier. Never spoof a browser UA. |
| `SITE_URL` | Public base URL, used to resolve Open Graph image URLs. |

## Routes

| Route | Description |
| --- | --- |
| `/` | Featured carousel, continue reading, latest updates, popular rankings, genres, rising series |
| `/comics` | Full catalog: title filter, genres (multi-select), status, type, sort, pagination |
| `/latest` | Newest English chapters grouped by series |
| `/popular` | Most followed / top rated / rising (MangaDex data) |
| `/genres` | Genre, theme and format directory |
| `/search?q=` | Title search with the same filters as the catalog |
| `/manga/[id]` | Series details and chapter list (sort, language, load more) |
| `/read/[chapterId]` | Vertical reader |
| `/library` | Saved series and reading history (stored on the device) |

## Architecture

```
app/
  (site)/…            pages with the site header/footer
  read/[chapterId]/   immersive reader (own chrome)
  api/
    cover/…           cover image proxy
    chapter-image/…   chapter page proxy (MangaDex@Home)
    search/           instant search JSON
    manga/[id]/chapters/  paginated chapter list JSON
components/           layout, manga, catalog, reader, library, search, ui
lib/
  mangadex/           API client, data functions ("use cache"), mappers
  storage/            library repository (localStorage implementation)
  catalog.ts, reader.ts, utils/
hooks/                useLibrary, useReaderPrefs
constants/            site config, removal list
types/                raw MangaDex types and app view models
```

- **Data access** lives in `lib/mangadex`. Every function uses `"use cache"` with an explicit `cacheLife`, so identical requests are deduplicated and pages prerender into a static shell. UI components only see the view models in `types/manga.ts`.
- **Rate limits**: the client spaces upstream requests (~4 req/s, under MangaDex's ~5 req/s per IP), backs off together on HTTP 429 using MangaDex's retry headers, and batches lookups (one request for all cards' latest chapters, one for all statistics).
- **Storage**: favorites, history and progress go through the `LibraryRepository` interface (`lib/storage/types.ts`). Replacing `local-library.ts` with an API-backed implementation is the path to accounts and a database.

## MangaDex compliance

- **Proxying is required.** MangaDex sends no CORS headers to third-party sites and serves wrong images to hotlinked requests, so all API calls and images go through this server.
- **The image proxies are not open proxies.** They accept only validated IDs. Upstream URLs are built server-side from fixed hosts or from the at-home server response, never from user input.
- **MangaDex@Home**: base URLs are cached for at most 10 minutes (MangaDex guarantees about 15), refreshed when a node fails, and every image retrieval from a non-`mangadex.org` node is reported to `api.mangadex.network/report`.
- **Attribution**: MangaDex is credited in the footer and on every series page. Scanlation groups are credited on every chapter, and fan translations are labelled as unofficial.
- **Removal requests**: add group, chapter or series UUIDs to `constants/removals.ts`. They are excluded from feeds and blocked in the reader and image proxy.
- **No monetization**: the MangaDex usage policy forbids ads and paid services on sites that use its content.
- **Content rating**: only titles MangaDex rates `safe` or `suggestive` are listed.
