# Agent & LLM Context Guide

Welcome to the **Lorcana Tracker & Deck Builder** codebase. This file provides AI assistants and automated coding agents with essential context, domain concepts, architecture patterns, and conventions.

---

## 1. Project Overview & Tech Stack

- **Type:** Full-stack Disney Lorcana TCG collection tracker and deck builder.
- **Framework:** React Router v8 (SSR / Framework Mode).
- **UI & Styling:** Mantine v9 (`@mantine/core`, `@mantine/hooks`), Tabler Icons (`@tabler/icons-react`), Tailwind CSS v4.
- **Backend:** Appwrite (`node-appwrite` on server, `appwrite` client SDK), with an automatic cookie-based local fallback when unconfigured.
- **Testing:** Vitest (`npm run test`), React Testing Library, jsdom.

---

## 2. Data Sources & Synchronization

> For deep architectural details, see [`docs/DATA_SOURCES.md`](./docs/DATA_SOURCES.md) and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

- **Card Catalog:** We do NOT query Ravensburger's private mobile app endpoints at runtime. Instead, card data is sourced in bulk from **LorcanaJSON** ([`great-illuminary/lorcana-data`](https://github.com/great-illuminary/lorcana-data)) via `npm run sync:cards` (`scripts/sync-cards.js`) and saved to `public/cards.json`.
- **Card Images:** Uses official Ravensburger CDN links (`https://api.lorcana.ravensburger.com/images/...`) extracted in the card dataset.
- **Trending Decks:** Live trending decks are fetched from `https://api-lorcana.com/decks/trending` inside `dbService.getDecksWithProgress()`. Cards in these decks use Dreamborn ID format (`<setNum>-<cardNum>`) and are mapped to local cards via `SET_INDEX_MAP`.
- **User Data:** Stored in Appwrite collections: `user_collections`, `decks`, `deck_cards`.

---

## 3. Key Conventions & Rules

1. **Card Identification & Slugs:**
    - Cards have canonical `$id` / `id` slugs (e.g. `ariel-on-human-legs`, `stitch-rock-star-p1-1`).
    - Use `buildCardsLookup(cards)` from `app/utils/deck.ts` to map varied card identifiers (including legacy IDs or set/number combos) to canonical `Card` objects.
2. **Server vs. Client Services:**
    - Server-side database and auth logic resides in `app/services/appwrite.server.ts`.
    - Never import `.server.ts` files directly in client components.
3. **Mantine & React Router v8:**
    - Follow Mantine v9 conventions (`@mantine/core`).
    - React Router route definitions and loaders are organized in `app/routes/<route-name>/`.
4. **Testing:**
    - Run tests using `npm run test`. Always ensure tests pass when modifying utilities, hooks, or loaders.
