# Lorcana Tracker & Deck Builder - Gemini Agent Guide

This file provides system context, architectural guidelines, development rules, and domain conventions for Gemini AI coding assistants working in this repository.

---

## 1. Project Overview & Tech Stack

- **Purpose:** Full-stack Disney Lorcana Trading Card Game (TCG) collection inventory tracker and deck builder.
- **Framework:** React Router v8 in Framework / SSR Mode.
- **Language:** TypeScript (`strict: true`).
- **UI Components:** Mantine v9 (`@mantine/core`, `@mantine/hooks`), Tabler Icons (`@tabler/icons-react`).
- **Styling:** Tailwind CSS v4 with Mantine integration.
- **Backend & Auth:** Appwrite (`node-appwrite` server SDK, `appwrite` client SDK), featuring an automatic cookie-based fallback for unconfigured/offline environments.
- **Testing:** Vitest (`npm run test`), React Testing Library, jsdom.

---

## 2. Directory Layout & Architecture

```
lorcana-tracker/
├── app/
│   ├── components/            # Reusable UI components (Navbar, AuthModal, etc.)
│   ├── constants/             # Domain constants (franchises, sets, ink colors)
│   ├── routes/                # React Router v8 route modules
│   │   ├── collection/        # Collection inventory grid, filters, and cards
│   │   ├── decks/             # Community & trending metagame decks
│   │   ├── my-decks/          # User custom deck builder, modal actions, import/export
│   │   └── home/              # Landing page and features
│   ├── services/              # Server-side business logic and Appwrite data layer
│   │   ├── appwrite.server.ts # Database services, in-memory card cache, query pagination
│   │   └── auth.server.ts     # User authentication and session handlers
│   ├── types/                 # Domain types & interfaces (Card, Deck, UserCollection)
│   └── utils/                 # Utilities (deck calculations, lookup maps, Appwrite clients)
├── docs/                      # Technical documentation
│   ├── ARCHITECTURE.md        # Detailed system architecture and data flow
│   └── DATA_SOURCES.md        # External APIs and data synchronization reference
├── public/                    # Static assets & synchronized card catalog (cards.json)
├── scripts/                   # Tooling scripts (sync-cards.js)
├── AGENTS.md                  # Generic agent context guide
└── GEMINI.md                  # Gemini assistant instructions & project rules
```

---

## 3. Data Sources & External APIs

Detailed technical reference is available in [`docs/DATA_SOURCES.md`](./docs/DATA_SOURCES.md).

1. **Card Catalog (LorcanaJSON):**
    - Source: `https://lorcanajson.org/files/current/en/allCards.json` maintained by [`great-illuminary/lorcana-data`](https://github.com/great-illuminary/lorcana-data).
    - Sync script: `npm run sync:cards` (`scripts/sync-cards.js`) fetches, normalizes, and saves the database to `public/cards.json`.
    - In-memory caching: Loaded into server memory on first request via `getCardsCatalog()` in `app/services/appwrite.server.ts` to avoid runtime latency or rate limits.
    - Do **NOT** make direct runtime API calls to Ravensburger's private mobile companion endpoints.
2. **Card Images:**
    - Official Ravensburger CDN URLs (`https://api.lorcana.ravensburger.com/images/...`) extracted in the card dataset.
3. **Trending Decks:**
    - Sourced dynamically from `https://api-lorcana.com/decks/trending` in `dbService.getDecksWithProgress()`.
    - Cards use Dreamborn format (`<setNum>-<cardNum>`) and are mapped to local cards using `SET_INDEX_MAP`.
4. **Appwrite Database Collections:**
    - `user_collections`: User inventory records (`user_id`, `card_id`, `quantity`, `is_foil`).
    - `decks`: User created decks (`title`, `description`, `creator_id`, `is_public`).
    - `deck_cards`: Junction linking decks to cards (`deck_id`, `card_id`, `quantity`).

---

## 4. Key Conventions & Implementation Rules

### A. Server vs. Client Code Isolation

- Server database and authentication code resides in `*.server.ts` files (e.g., `app/services/appwrite.server.ts`).
- **NEVER** import `*.server.ts` files or Node-only packages into client components, hooks, or browser bundles.
- Route actions and loaders in `app/routes/*/` pass data from server services to UI components.

### B. Canonical Card Identification & Slugs

- All cards utilize a canonical `$id` / `id` slug format (e.g. `ariel-on-human-legs`, `stitch-rock-star-p1-1` for promos).
- When resolving cards from diverse ID formats (e.g. legacy IDs, set/number combinations, or Dreamborn tags), always use `buildCardsLookup(cards)` from `app/utils/deck.ts`.

### C. UI & Styling Guidelines

- Use Mantine v9 components (`@mantine/core`, `@mantine/hooks`) and Tabler Icons (`@tabler/icons-react`).
- For custom layouts, combine Tailwind CSS utility classes with Mantine design primitives.
- Follow responsive design patterns with dark/light mode compatibility.

### D. Appwrite & Local Cookie Fallback

- The application automatically switches to cookie-based session and inventory storage when Appwrite credentials are not configured.
- Ensure any modifications to `dbService` or `authService` maintain parity with both Appwrite and the local fallback behavior.

---

## 5. Development & Testing Commands

| Command              | Purpose                                                                    |
| :------------------- | :------------------------------------------------------------------------- |
| `npm run dev`        | Start local Vite/React Router development server (`http://localhost:5173`) |
| `npm run build`      | Create production build (`build/client` & `build/server`)                  |
| `npm run test`       | Run complete Vitest unit and component test suite                          |
| `npm run typecheck`  | Run React Router typegen and TypeScript compiler checks                    |
| `npm run lint`       | Run ESLint across the codebase                                             |
| `npm run format`     | Format code with Prettier                                                  |
| `npm run sync:cards` | Sync latest cards from LorcanaJSON into `public/cards.json`                |

---

## 6. Pre-Commit / Pre-Push Expectations

- Husky hooks enforce `lint-staged` on commit, and `eslint` + `vitest run` on push.
- When creating or modifying features, always write or update corresponding unit tests in `*.test.ts` / `*.test.tsx`.
- Ensure all 65+ test suites pass before proposing commits or pull requests.
