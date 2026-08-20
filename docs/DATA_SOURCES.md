# Lorcana Data Sources & APIs

This document outlines the external data sources, community APIs, and internal synchronization pipelines used in the Lorcana Tracker & Deck Builder project.

---

## 1. Summary of Data Sources

| Source                                                                                                | Role                                | Endpoint / URL                                           | Status / Notes                                                      |
| :---------------------------------------------------------------------------------------------------- | :---------------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------ |
| **LorcanaJSON** ([`great-illuminary/lorcana-data`](https://github.com/great-illuminary/lorcana-data)) | Primary Card Database & Catalog     | `https://lorcanajson.org/files/current/en/allCards.json` | **Active** — Synced via `npm run sync:cards` to `public/cards.json` |
| **Ravensburger Official CDN**                                                                         | Card Artwork & High-Res Images      | `https://api.lorcana.ravensburger.com/images/...`        | **Active** — Extracted via LorcanaJSON dataset                      |
| **[api-lorcana.com](https://api-lorcana.com)**                                                        | Trending & Metagame Decks           | `https://api-lorcana.com/decks/trending`                 | **Active** — Dynamic fetch in `dbService.getDecksWithProgress()`    |
| **Appwrite Database**                                                                                 | User Inventory, Custom Decks & Auth | Managed Backend (Cloud / Self-hosted)                    | **Active** — Primary persistent storage with cookie fallback        |
| **[lorcana-api.com](https://lorcana-api.com)**                                                        | Alternative Card API                | `https://api.lorcana-api.com`                            | _Evaluated / Inactive_ (Superseded by LorcanaJSON)                  |
| **[Lorcast](https://lorcast.com)**                                                                    | Alternative Card & Set API          | `https://api.lorcast.com`                                | _Evaluated / Inactive_ (Available as alternative)                   |

---

## 2. Card Catalog & Metadata Pipeline

### Source: LorcanaJSON ([`great-illuminary/lorcana-data`](https://github.com/great-illuminary/lorcana-data))

- **Why LorcanaJSON?**
    - Ravensburger does not provide a public, versioned developer API. The official Disney Lorcana Companion mobile app uses internal, undocumented endpoints that are prone to sudden changes.
    - The `great-illuminary/lorcana-data` project continuously mines and curates official card text, errata, franchise classifications, and high-resolution image URLs into a standardized JSON distribution.
- **Sync Script:** [`scripts/sync-cards.js`](../scripts/sync-cards.js)
    - Run command: `npm run sync:cards`
    - Normalized data is saved to [`public/cards.json`](../public/cards.json).
    - Generates consistent, canonical URL slugs (e.g. `ariel-on-human-legs`, `stitch-rock-star-p1-1` for promos).
    - Maps promo set codes (`P1`, `P2`, `D23`, `CP`, etc.) into readable set names.
- **Runtime In-Memory Caching:**
    - [`appwrite.server.ts`](../app/services/appwrite.server.ts) loads `public/cards.json` on first request via `getCardsCatalog()`.
    - Runs legality post-processing (`postProcessCardLegality()`) to annotate `formats: ['core', 'infinity']`.
    - Keeps the card catalog cached in memory for sub-millisecond lookups during collection filtering and deck progress calculations.

---

## 3. Card Images & Assets

### Ravensburger CDN

- Card images link directly to Ravensburger's official CDN URLs (`https://api.lorcana.ravensburger.com/images/...`) provided within the LorcanaJSON records.
- In the frontend, card images are rendered with:
    - Loading state fallbacks and aspect-ratio maintenance.
    - Foil shimmer overlay effects in [`ShinyCardImage.tsx`](../app/routes/collection/components/ShinyCardImage.tsx).

---

## 4. Trending & Metagame Decks

### Source: [api-lorcana.com](https://api-lorcana.com)

- Endpoint: `https://api-lorcana.com/decks/trending`
- Used in: [`app/services/appwrite.server.ts`](../app/services/appwrite.server.ts) (`dbService.getDecksWithProgress()`).
- **Integration Details:**
    - Returns popular community decks containing metadata (title, author, views, likes, YouTube video ID) and cards using Dreamborn ID formatting (e.g., `"1-45"` for Set 1, Card 45).
    - The application maps Dreamborn identifiers to our local card database using `SET_INDEX_MAP` in [`app/types/lorcana.ts`](../app/types/lorcana.ts).
    - Computes missing cards and ownership percentages against the user's current collection in real time.

---

## 5. User Data & Authentication (Appwrite)

- **Backend:** Appwrite Databases & Accounts SDK.
- **Collections:**
    - `user_collections`: User inventory records (`user_id`, `card_id`, `quantity`, `is_foil`).
    - `decks`: Custom user-created decks (`title`, `description`, `creator_id`, `is_public`).
    - `deck_cards`: Junction collection linking decks to cards (`deck_id`, `card_id`, `quantity`).
- **Local Fallback:** If Appwrite environment variables are not configured, the app seamlessly falls back to cookie-based session and inventory management for development and offline testing.
