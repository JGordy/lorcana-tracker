# System Architecture & Technical Overview

This document provides a technical overview of the Lorcana Tracker & Deck Builder application, covering the frontend architecture, backend services, data flow, and external integrations.

---

## 1. High-Level Architecture

```mermaid
graph TD
    A[LorcanaJSON / great-illuminary] -->|npm run sync:cards| B[public/cards.json]
    B -->|getCardsCatalog| C[In-Memory Card Catalog on Server]

    D[api-lorcana.com] -->|Trending Decks API| E[appwrite.server.ts]
    F[Appwrite Cloud / Self-Hosted] <-->|Auth & DB Queries| E

    E -->|SSR Data Loader| G[React Router v8 Routes]
    G --> H[Collection View]
    G --> I[Deck Builder & Community Decks]
    G --> J[User Custom Decks & Import]
```

---

## 2. Technology Stack

- **Framework:** React Router v8 (Framework Mode / SSR)
- **Language:** TypeScript
- **UI Components & Styling:** Mantine v9 (`@mantine/core`, `@mantine/hooks`), Tabler Icons (`@tabler/icons-react`), Tailwind CSS v4
- **Backend & Auth:** Appwrite (`node-appwrite` on server, `appwrite` web SDK on client)
- **Data Sources:** LorcanaJSON (`great-illuminary/lorcana-data`), `api-lorcana.com`, Ravensburger CDN
- **Testing:** Vitest, React Testing Library, jsdom

---

## 3. Directory Structure

```
├── app/
│   ├── components/         # Shared UI components (Navbar, AuthModal, etc.)
│   ├── constants/          # Card attributes, ink colors, franchises, sets
│   ├── routes/             # Route modules (collection, decks, my-decks, home)
│   │   ├── collection/     # Collection inventory management & filters
│   │   ├── decks/          # Trending & community decks with progress calculation
│   │   └── my-decks/       # User deck builder, deck import/export, and deck actions
│   ├── services/           # Server-side Appwrite & database service layer
│   ├── types/              # Domain models (Card, Deck, UserCollection, etc.)
│   └── utils/              # Calculation helpers (deck completion, inventory lookup)
├── docs/                   # Architecture & Data source documentation
├── public/                 # Static assets and synced cards catalog (cards.json)
└── scripts/                # Data synchronization scripts (sync-cards.js)
```

---

## 4. Key Workflows & Data Flows

### A. Card Data Synchronization (`sync:cards`)

1. **Fetch:** Pulls the complete card catalog from `https://lorcanajson.org/files/current/en/allCards.json`.
2. **Normalize:** Computes canonical card slugs (handling duplicates/promos), maps promo set names, formats classifications, and attaches official Ravensburger CDN image URLs.
3. **Persist:** Saves formatted cards into `public/cards.json`.
4. **Serve:** `appwrite.server.ts` loads this file into memory once upon startup, eliminating third-party card API latency and rate-limiting.

### B. Deck Progress Calculation

When a user views community decks or their own custom decks:

1. `getUserInventory(userId)` fetches the user's owned card quantities and foil statuses.
2. `getDecksWithProgress()` correlates required deck cards against the owned card inventory.
3. `calculateDeckProgress()` computes:
    - Total cards required vs. owned
    - Percentage of completion
    - List of missing cards with quantities needed
    - Estimated missing card cost / count

### C. Appwrite Database Layer & Local Fallback

- When configured, the app uses Appwrite for authentication sessions and document persistence (`user_collections`, `decks`, `deck_cards`).
- If unconfigured (`appwriteConfig.isConfigured === false`), the app smoothly operates with a local cookie-based fallback, allowing full development, offline usage, and isolated test execution.

---

## 5. Additional Documentation

- See [`docs/DATA_SOURCES.md`](./DATA_SOURCES.md) for details on external APIs, CDN links, and third-party tools.
