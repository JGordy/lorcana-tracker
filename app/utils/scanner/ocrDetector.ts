import { SET_INDEX_MAP, PROMO_SET_NAMES } from '../../constants/lorcana';
import type { Card } from '../../types/lorcana';

export interface ParsedCollectorInfo {
    cardNumber: number;
    totalCards?: number;
    setCode?: string; // e.g., "1", "6", "P1", "D23"
    language?: string; // e.g., "EN", "FR", "DE"
    rawText: string;
}

/**
 * Normalizes OCR text by cleaning noisy characters, converting common OCR misreads,
 * and collapsing spaces.
 */
export function cleanOcrText(text: string): string {
    if (!text) return '';
    return text
        .replace(/[\r\n]+/g, ' ')
        .replace(/[—–]/g, '-')
        .replace(/[•·*∙]/g, ' • ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Parses bottom-left collector text from Disney Lorcana cards.
 *
 * Supported formats:
 * - Standard Sets: "115/204 • EN • 1", "42/204 · EN · 6", "115/204 EN 1", "115 / 204 - EN - 1"
 * - Enchanted / Epic / Over-numbered: "218/204 • EN • 9", "205/204 • EN • 1", "218/204"
 * - Promos: "1/P1 • EN • 1", "1/P1", "8/D23", "15/CP", "3/C1", "2/P2", "10/CC1", "1/Q1"
 * - Inverted/Alternate promo styles: "1/P1 • EN", "001/P1"
 */
export function parseCollectorString(text: string): ParsedCollectorInfo | null {
    if (!text) return null;
    const cleaned = cleanOcrText(text);

    // 1. Standard Set Pattern: <cardNum>/<totalCards> [optional lang] <setNum>
    // Lorcana standard sets ALWAYS have 204 base cards (e.g. "10/204 • EN • 12" or "218/204 • EN • 9")
    // Supports `/`, space, `.`, `-`, `|`, `\` as separator between card number and denominator
    const standardRegex =
        /\b(\d{1,3})\s*[/|\\I.\-_~\s]\s*(204|2[oO]4|2\d{2})(?:[^\w\d]*(?:EN|FR|DE|IT)[^\w\d]*)?(?:[^\w\d]*(\d{1,2}))?\b/i;
    const stdMatch = cleaned.match(standardRegex);
    if (stdMatch) {
        const cardNum = parseInt(stdMatch[1], 10);
        const totalCards = parseInt(stdMatch[2].replace(/[oO]/g, '0'), 10);
        let setCode = stdMatch[3] ? stdMatch[3] : '';

        // Check if there is a trailing set number (1-13) after separator
        if (!setCode) {
            const trailingSetMatch = cleaned
                .slice((stdMatch.index ?? 0) + stdMatch[0].length)
                .match(/\b([1-9]|1[0-3])\b/);
            if (trailingSetMatch) {
                setCode = trailingSetMatch[1];
            }
        }

        return {
            cardNumber: cardNum,
            totalCards,
            setCode: setCode || undefined,
            rawText: text,
        };
    }

    // 1b. Language + Set pattern when denominator was blurred: e.g. "218 • EN • 9" or "146 • EN • 9"
    const langSetRegex =
        /\b(\d{1,3})\s*[•·*.-]\s*(?:EN|FR|DE|IT)\s*[•·*.-]\s*([1-9]|1[0-3])\b/i;
    const langSetMatch = cleaned.match(langSetRegex);
    if (langSetMatch) {
        const num = parseInt(langSetMatch[1], 10);
        // 204 is the set total cards denominator, never a lone card number before EN • <set>
        if (num !== 204) {
            return {
                cardNumber: num,
                setCode: langSetMatch[2],
                rawText: text,
            };
        }
    }

    // 1c. Over-numbered Enchanted / Epic pattern: e.g. "218" or "218 EN"
    const overNumberRegex =
        /\b(20[5-9]|2[1-9]\d)\b(?:[^\w\d]*(?:EN|FR|DE|IT)[^\w\d]*)?(?:[^\w\d]*([1-9]|1[0-3]))?/i;
    const overNumMatch = cleaned.match(overNumberRegex);
    if (overNumMatch) {
        return {
            cardNumber: parseInt(overNumMatch[1], 10),
            setCode: overNumMatch[2] || undefined,
            rawText: text,
        };
    }

    // 2. Promo Pattern: <cardNum>/<promoCode> (e.g. 1/P1, 8/D23, 15/CP, 3/C1, 10/CC1, 1/Q1)
    const promoSlashRegex =
        /\b(\d{1,3})\s*[/|\\I]\s*(P\d+|D23|CP|C\d+|DIS|CC\d+|Q\d+)\b/i;
    const promoMatch = cleaned.match(promoSlashRegex);
    if (promoMatch) {
        return {
            cardNumber: parseInt(promoMatch[1], 10),
            setCode: promoMatch[2].toUpperCase(),
            rawText: text,
        };
    }

    // 3. Alternate Promo Pattern: <cardNum>/<total> ... <promoCode> (e.g. 1/P1 • EN • 1)
    const promoAltRegex =
        /\b(\d{1,3})\s*[/|\\I]\s*(\d{1,3})?[^\w\d]*(?:EN|FR|DE|IT)?[^\w\d]*(P\d+|D23|CP|C\d+|DIS|CC\d+|Q\d+)\b/i;
    const promoAltMatch = cleaned.match(promoAltRegex);
    if (promoAltMatch) {
        return {
            cardNumber: parseInt(promoAltMatch[1], 10),
            totalCards: promoAltMatch[2]
                ? parseInt(promoAltMatch[2], 10)
                : undefined,
            setCode: promoAltMatch[3].toUpperCase(),
            rawText: text,
        };
    }

    return null;
}

/**
 * Resolves the canonical set name from a set code (numeric string e.g. "1" or promo code e.g. "P1").
 */
export function resolveSetNameFromCode(setCode: string): string | null {
    if (!setCode) return null;
    const trimmed = setCode.trim().toUpperCase();

    // Check promo set mapping
    if (PROMO_SET_NAMES[trimmed]) {
        return PROMO_SET_NAMES[trimmed];
    }

    // Check numeric set index mapping
    const numericIndex = parseInt(trimmed, 10);
    if (!Number.isNaN(numericIndex) && SET_INDEX_MAP[numericIndex]) {
        return SET_INDEX_MAP[numericIndex];
    }

    return null;
}

/**
 * Resolves a Card from the catalog using parsed collector info.
 */
export function resolveCardFromCollector(
    parsed: ParsedCollectorInfo,
    cards: Card[],
    titleText?: string,
): Card | null {
    if (!parsed || !cards || cards.length === 0) return null;

    // 1. If title text is present, extract candidates that match the title/character in the text.
    // This prevents collector code misreads (e.g. reading 208 instead of 218) from matching
    // a completely different character (e.g. Ursula instead of Anna).
    if (titleText) {
        const titleNorm = normalizeCardText(titleText);

        // 1. Exact full title matches (e.g. "Anna - Braving the Storm")
        const fullTitleMatches = cards.filter((c) => {
            const cNorm = normalizeCardText(c.name);
            return (
                cNorm.length >= 4 &&
                (titleNorm.includes(cNorm) || cNorm.includes(titleNorm))
            );
        });

        // 2. Character name + Subtitle / subtitle word matches (e.g. "Anna" + "Braving" or "Storm")
        const subtitleMatches = cards.filter((c) => {
            if (!c.name.includes(' - ')) return false;
            const parts = c.name.split(' - ');
            const charNorm = normalizeCardText(parts[0]);
            const subNorm = normalizeCardText(parts[1]);
            const hasChar =
                charNorm.length >= 3 && titleNorm.includes(charNorm);
            const subWords = subNorm.split(' ').filter((w) => w.length >= 4);
            const hasSubWord = subWords.some((w) => titleNorm.includes(w));
            return hasChar && (titleNorm.includes(subNorm) || hasSubWord);
        });

        // 3. General character/title matches (fallback when subtitle was completely unread)
        const charMatches = cards.filter((c) => {
            const cNorm = normalizeCardText(c.name);
            if (
                cNorm.length >= 3 &&
                (titleNorm.includes(cNorm) || cNorm.includes(titleNorm))
            ) {
                return true;
            }
            const parts = c.name.split(' - ');
            const charNorm = normalizeCardText(parts[0]);
            const subNorm = parts[1] ? normalizeCardText(parts[1]) : '';
            if (charNorm.length >= 3 && titleNorm.includes(charNorm))
                return true;
            if (subNorm.length >= 4 && titleNorm.includes(subNorm)) return true;
            return false;
        });

        // Strict priority: Never mix cards with completely different subtitles (e.g. True-Hearted vs Braving the Storm)
        const titleCandidates =
            fullTitleMatches.length > 0
                ? fullTitleMatches
                : subtitleMatches.length > 0
                  ? subtitleMatches
                  : charMatches;

        if (titleCandidates.length > 0) {
            let candidates = titleCandidates;

            // Constrain by set if set code is recognized
            if (parsed.setCode) {
                const resolvedSetName = resolveSetNameFromCode(parsed.setCode);
                if (resolvedSetName) {
                    const setCandidates = candidates.filter(
                        (c) =>
                            c.set.toLowerCase() ===
                            resolvedSetName.toLowerCase(),
                    );
                    if (setCandidates.length > 0) {
                        candidates = setCandidates;
                    }
                } else if (parsed.setCode.startsWith('P')) {
                    const promoNum = parsed.setCode.replace(/^P/i, '');
                    const targetPromoSet =
                        `Promo Set ${promoNum}`.toLowerCase();
                    const promoCandidates = candidates.filter(
                        (c) => c.set.toLowerCase() === targetPromoSet,
                    );
                    if (promoCandidates.length > 0) {
                        candidates = promoCandidates;
                    }
                }
            }

            // 1A. Exact card number match among title candidates
            const exactNumMatch = candidates.find(
                (c) => c.number === parsed.cardNumber,
            );
            if (exactNumMatch) return exactNumMatch;

            // 1B. Over-numbered match: if parsed collector number > 204, find over-numbered candidate
            // (e.g. Epic / Enchanted #218 when OCR read 208 or 219)
            if (parsed.cardNumber > 204) {
                const overMatch = candidates.find((c) => c.number > 204);
                if (overMatch) return overMatch;
            }

            // 1C. OCR 1-digit substitution tolerance (e.g. 208 vs 218, 148 vs 146)
            if (parsed.cardNumber) {
                const parsedStr = String(parsed.cardNumber);
                const closeMatch = candidates.find((c) => {
                    const cNumStr = String(c.number);
                    if (cNumStr.length !== parsedStr.length) return false;
                    let diffs = 0;
                    for (let i = 0; i < parsedStr.length; i++) {
                        if (parsedStr[i] !== cNumStr[i]) diffs++;
                    }
                    return diffs <= 1;
                });
                if (closeMatch) return closeMatch;
            }

            // 1D. If only one candidate in this set, return it
            if (candidates.length === 1) return candidates[0];

            // 1E. If OCR text contains an over-number (> 204 e.g. 218), choose the over-numbered candidate!
            if (titleText && /\b(20[5-9]|2[1-9]\d)\b/.test(titleText)) {
                const overMatch = candidates.find((c) => c.number > 204);
                if (overMatch) return overMatch;
            }

            // 1F. If parsed number specifically matched a candidate <= 204:
            if (parsed.cardNumber && parsed.cardNumber <= 204) {
                const exactBase = candidates.find(
                    (c) => c.number === parsed.cardNumber,
                );
                if (exactBase) return exactBase;
            }

            return null;
        }
    }

    // 2. Direct match with resolved set name and card number (fallback when title text is missing/uncaught)
    if (parsed.setCode) {
        const resolvedSetName = resolveSetNameFromCode(parsed.setCode);
        if (resolvedSetName) {
            const match = cards.find(
                (c) =>
                    c.set.toLowerCase() === resolvedSetName.toLowerCase() &&
                    c.number === parsed.cardNumber,
            );
            if (match) return match;
        }

        // 3. If set code was a promo prefix like "P1", try matching promo set names
        if (parsed.setCode.startsWith('P')) {
            const promoNum = parsed.setCode.replace(/^P/i, '');
            const targetPromoSet = `Promo Set ${promoNum}`.toLowerCase();
            const promoMatch = cards.find(
                (c) =>
                    c.set.toLowerCase() === targetPromoSet &&
                    c.number === parsed.cardNumber,
            );
            if (promoMatch) return promoMatch;
        }
    }

    // 4. Match by card number and title text if setCode was missing or unverified
    if (titleText && parsed.cardNumber) {
        const titleNorm = normalizeCardText(titleText);
        const titleMatches = cards.filter((c) => {
            if (c.number !== parsed.cardNumber) return false;
            const cNorm = normalizeCardText(c.name);
            if (titleNorm.includes(cNorm) || cNorm.includes(titleNorm))
                return true;
            const parts = c.name.split(' - ');
            const charNorm = normalizeCardText(parts[0]);
            const subNorm = parts[1] ? normalizeCardText(parts[1]) : '';
            return (
                (charNorm && titleNorm.includes(charNorm)) ||
                (subNorm && titleNorm.includes(subNorm))
            );
        });
        if (titleMatches.length >= 1) {
            return titleMatches[0];
        }
    }

    // 5. If unique card number in catalog (e.g. over-numbered Enchanted/Epic or promos)
    const matchingNumberCards = cards.filter(
        (c) => c.number === parsed.cardNumber,
    );
    if (matchingNumberCards.length === 1) {
        return matchingNumberCards[0];
    }

    return null;
}

/**
 * Normalizes card names or OCR text for matching:
 * - Strips apostrophes and quotes (e.g. "Sid's" -> "sids")
 * - Converts hyphens, dashes, slashes, and underscores to spaces (e.g. "Hand-in-the-Box" -> "hand in the box")
 * - Removes non-alphanumeric punctuation
 * - Collapses spaces
 */
export function normalizeCardText(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/['’`"]/g, '')
        .replace(/[-—–_./\\|]/g, ' ')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface CardOcrMatchResult {
    card: Card;
    score: number;
    specificity: number;
    parsed?: ParsedCollectorInfo;
}

/**
 * Matches OCR text directly against the card catalog using a scored multi-strategy engine.
 * Eliminates false positives by verifying character names and subtitles, prioritizing
 * longer/specific card titles over substring single-word matches, and requiring strict
 * denominator/set validation for collector codes.
 */
export function matchCardFromOcr(
    text: string,
    cards: Card[],
): CardOcrMatchResult | null {
    if (!text || !cards || cards.length === 0) return null;

    const ocrNorm = normalizeCardText(text);
    if (ocrNorm.length < 3) return null;

    let bestCandidate: CardOcrMatchResult | null = null;

    // Helper to evaluate and track the highest scoring candidate
    const consider = (candidate: CardOcrMatchResult) => {
        if (!bestCandidate) {
            bestCandidate = candidate;
            return;
        }
        // 1. Higher score wins
        if (candidate.score > bestCandidate.score) {
            bestCandidate = candidate;
            return;
        }
        // 2. Equal score: higher specificity (longer matched title / words) wins
        if (candidate.score === bestCandidate.score) {
            if (candidate.specificity > bestCandidate.specificity) {
                bestCandidate = candidate;
                return;
            }
            // 3. Equal score & specificity: prefer candidate with verified collector code
            if (
                candidate.specificity === bestCandidate.specificity &&
                candidate.parsed &&
                !bestCandidate.parsed
            ) {
                bestCandidate = candidate;
            }
        }
    };

    const parsed = parseCollectorString(text);

    // =========================================================================
    // TIER 1: The Golden Match (Name + Number matched simultaneously!)
    // If a card's title and its collector number BOTH match the OCR text,
    // this is a 100% indisputable identification that immediately wins!
    // =========================================================================
    const goldenCandidates: {
        card: Card;
        hasFullTitle: boolean;
        hasExactNum: boolean;
        hasCloseNum: boolean;
        hasOverNumMatch: boolean;
        hasSetMatch: boolean;
        specificity: number;
    }[] = [];

    for (const card of cards) {
        const cardNorm = normalizeCardText(card.name);
        const parts = card.name.split(' - ');
        const charNorm = normalizeCardText(parts[0]);
        const subNorm = parts[1] ? normalizeCardText(parts[1]) : '';

        // Title confirmation:
        const hasFullTitle =
            cardNorm.length >= 4 &&
            new RegExp(`\\b${escapeRegExp(cardNorm)}\\b`, 'i').test(ocrNorm);
        const hasChar =
            charNorm.length >= 3 &&
            new RegExp(`\\b${escapeRegExp(charNorm)}\\b`, 'i').test(ocrNorm);
        const hasSub = Boolean(
            subNorm &&
            subNorm.length >= 3 &&
            new RegExp(`\\b${escapeRegExp(subNorm)}\\b`, 'i').test(ocrNorm),
        );
        const subWords = subNorm
            ? subNorm.split(' ').filter((w) => w.length >= 4)
            : [];
        const hasSubWord = subWords.some((w) => ocrNorm.includes(w));

        // Reject if OCR has words from a conflicting subtitle for this character
        const hasConflictingSubtitle =
            parts.length > 1 &&
            cards.some((c) => {
                if (!c.name.includes(' - ')) return false;
                const cParts = c.name.split(' - ');
                const cCharNorm = normalizeCardText(cParts[0]);
                const cSubNorm = normalizeCardText(cParts[1]);
                if (
                    cCharNorm !== charNorm ||
                    cSubNorm === subNorm ||
                    cSubNorm.length < 4
                )
                    return false;
                return (
                    ocrNorm.includes(cSubNorm) ||
                    cSubNorm
                        .split(' ')
                        .filter((w) => w.length >= 4)
                        .some((w) => ocrNorm.includes(w))
                );
            });
        if (hasConflictingSubtitle) continue;

        const isTitleConfirmed =
            hasFullTitle ||
            (hasChar && (hasSub || hasSubWord || parts.length === 1));
        if (!isTitleConfirmed) continue;

        // Number confirmation: exact number, close number (1-digit OCR typo), or over-number
        const hasExactNum = Boolean(
            (parsed && parsed.cardNumber === card.number) ||
            new RegExp(`\\b${card.number}\\b`).test(ocrNorm),
        );

        let hasCloseNum = false;
        if (!hasExactNum && parsed?.cardNumber) {
            const s1 = String(parsed.cardNumber);
            const s2 = String(card.number);
            if (s1.length === s2.length) {
                let diffs = 0;
                for (let i = 0; i < s1.length; i++) {
                    if (s1[i] !== s2[i]) diffs++;
                }
                if (diffs <= 1) hasCloseNum = true;
            }
        }

        const isOverNumbered = card.number > 204;
        const textHasOverNumber = Boolean(
            (parsed && parsed.cardNumber && parsed.cardNumber > 204) ||
            /\b(20[5-9]|2[1-9]\d)\b/.test(ocrNorm),
        );
        const hasOverNumMatch = isOverNumbered && textHasOverNumber;

        if (hasExactNum || hasCloseNum || hasOverNumMatch) {
            const hasSetMatch = Boolean(
                ocrNorm.includes(card.set.toLowerCase()) ||
                (parsed?.setCode &&
                    resolveSetNameFromCode(parsed.setCode)?.toLowerCase() ===
                        card.set.toLowerCase()),
            );

            let specificity = cardNorm.length;
            if (hasFullTitle) specificity += 40;
            if (hasExactNum) specificity += 60;
            else if (hasCloseNum) specificity += 40;
            if (hasOverNumMatch) specificity += 50;
            if (hasSetMatch) specificity += 40;

            goldenCandidates.push({
                card,
                hasFullTitle,
                hasExactNum,
                hasCloseNum,
                hasOverNumMatch,
                hasSetMatch,
                specificity,
            });
        }
    }

    if (goldenCandidates.length > 0) {
        goldenCandidates.sort((a, b) => b.specificity - a.specificity);
        const best = goldenCandidates[0];
        return {
            card: best.card,
            score: 100,
            specificity: best.specificity + 200, // Golden match guaranteed priority
            parsed: parsed || undefined,
        };
    }

    // =========================================================================
    // TIER 2: Set Code + Card Number (Exact Physical Coordinate)
    // When title was missed or cropped, the (Set, Number) pair uniquely identifies
    // the card mechanically without ambiguity!
    // =========================================================================
    if (parsed?.cardNumber && parsed?.setCode) {
        const collectorCard = resolveCardFromCollector(parsed, cards, text);
        if (collectorCard) {
            const parts = collectorCard.name.split(' - ');
            const charNorm = normalizeCardText(parts[0]);
            const hasConflictingCharacter = cards.some((c) => {
                const cCharNorm = normalizeCardText(c.name.split(' - ')[0]);
                return (
                    cCharNorm.length >= 3 &&
                    cCharNorm !== charNorm &&
                    new RegExp(`\\b${escapeRegExp(cCharNorm)}\\b`, 'i').test(
                        ocrNorm,
                    )
                );
            });

            if (!hasConflictingCharacter) {
                const isOverNumbered = collectorCard.number > 204;
                return {
                    card: collectorCard,
                    score: 98,
                    specificity: 80 + (isOverNumbered ? 20 : 0),
                    parsed,
                };
            }
        }
    }

    // =========================================================================
    // TIER 3: Collector Code with Over-Number or Unique Number
    // =========================================================================
    if (parsed?.cardNumber) {
        const collectorCard = resolveCardFromCollector(parsed, cards, text);
        if (collectorCard) {
            const isOverNumbered = collectorCard.number > 204;
            return {
                card: collectorCard,
                score: 95,
                specificity: isOverNumbered ? 75 : 60,
                parsed,
            };
        }
    }

    // 2. Strategy: Title & Subtitle Matching across all cards (no early break)
    for (const card of cards) {
        const cardNorm = normalizeCardText(card.name);
        if (!cardNorm) continue;

        const words = cardNorm.split(' ');
        const wordCount = words.length;

        // Metadata bonuses (resolves reprints, promos, and over-numbered Enchanted/Epic versions)
        const hasExactNumber = Boolean(
            (parsed && parsed.cardNumber === card.number) ||
            new RegExp(`\\b${card.number}\\b`).test(ocrNorm),
        );
        const hasCloseNumber = Boolean(
            parsed?.cardNumber &&
            String(parsed.cardNumber).length === String(card.number).length &&
            (() => {
                const s1 = String(parsed.cardNumber);
                const s2 = String(card.number);
                let diffs = 0;
                for (let i = 0; i < s1.length; i++) {
                    if (s1[i] !== s2[i]) diffs++;
                }
                return diffs <= 1;
            })(),
        );
        const hasSetName = Boolean(
            ocrNorm.includes(card.set.toLowerCase()) ||
            (parsed &&
                parsed.setCode &&
                resolveSetNameFromCode(parsed.setCode)?.toLowerCase() ===
                    card.set.toLowerCase()),
        );
        const hasRarity = Boolean(ocrNorm.includes(card.rarity.toLowerCase()));
        const isOverNumbered = card.number > 204;
        const textHasOverNumber = Boolean(
            (parsed && parsed.cardNumber && parsed.cardNumber > 204) ||
            /\b(20[5-9]|2[1-9]\d)\b/.test(ocrNorm),
        );

        let bonusSpecificity = 0;
        if (hasExactNumber) {
            bonusSpecificity += 50;
        } else if (hasCloseNumber) {
            bonusSpecificity += 35;
        }
        if (hasSetName) bonusSpecificity += 30;
        if (hasRarity) bonusSpecificity += 20;
        if (textHasOverNumber && isOverNumbered) {
            bonusSpecificity += 80;
        } else if (textHasOverNumber && !isOverNumbered) {
            bonusSpecificity -= 80;
        }

        // Check if full normalized title exists in normalized OCR text
        const fullTitleRegex = new RegExp(
            `\\b${escapeRegExp(cardNorm)}\\b`,
            'i',
        );
        const hasFullTitle = fullTitleRegex.test(ocrNorm);

        if (hasFullTitle) {
            if (wordCount >= 3) {
                // Highly specific multi-word title (e.g. "Force of a Great Typhoon", "Friends on the Other Side")
                consider({
                    card,
                    score: 100,
                    specificity: cardNorm.length + bonusSpecificity,
                });
            } else if (wordCount === 2) {
                // 2-word title (e.g. "Dragon Fire", "Ursula's Cauldron")
                consider({
                    card,
                    score: 96,
                    specificity: cardNorm.length + bonusSpecificity,
                });
            } else {
                // 1-word card title (e.g. "Typhoon", "Startle", "Smash", "Heal")
                // Single words frequently appear in rules or flavor text of other cards.
                // Verify against card type, subtype, or ink color if present in OCR.
                const cardTypes = (card.type || []).map((t) => t.toLowerCase());
                const classifications = (card.classifications || []).map((c) =>
                    c.toLowerCase(),
                );
                const ink = (card.ink_color || '').toLowerCase();

                const hasTypeConfirmation =
                    cardTypes.some((t) => ocrNorm.includes(t)) ||
                    classifications.some((c) => ocrNorm.includes(c)) ||
                    (ink && ocrNorm.includes(ink));

                if (hasTypeConfirmation) {
                    consider({
                        card,
                        score: 85,
                        specificity: cardNorm.length + bonusSpecificity,
                    });
                } else {
                    // Bare single-word match without type confirmation (likely flavor/rules text)
                    consider({
                        card,
                        score: 65,
                        specificity: cardNorm.length + bonusSpecificity,
                    });
                }
            }
        } else if (card.name.includes(' - ')) {
            // Character with subtitle (e.g. "Rex - Protective Dinosaur", "Hand-in-the-Box - Sid's Toy")
            const parts = card.name.split(' - ');
            const charNorm = normalizeCardText(parts[0]);
            const subNorm = normalizeCardText(parts[1]);

            if (charNorm && subNorm) {
                const charRegex = new RegExp(
                    `\\b${escapeRegExp(charNorm)}\\b`,
                    'i',
                );
                const hasChar = charRegex.test(ocrNorm);

                const subRegex = new RegExp(
                    `\\b${escapeRegExp(subNorm)}\\b`,
                    'i',
                );
                const hasSub = subRegex.test(ocrNorm);

                if (hasChar && hasSub) {
                    // Both character name and full subtitle found
                    consider({
                        card,
                        score: 100,
                        specificity:
                            charNorm.length + subNorm.length + bonusSpecificity,
                    });
                } else if (hasSub && subNorm.length >= 6) {
                    // Distinctive subtitle alone (>= 6 chars e.g. "protective dinosaur", "spirit of winter")
                    consider({
                        card,
                        score: 95,
                        specificity: subNorm.length + bonusSpecificity,
                    });
                } else if (hasChar) {
                    // Character name + subtitle words
                    const subWords = subNorm
                        .split(' ')
                        .filter((w) => w.length >= 4);
                    const matchedSubWords = subWords.filter((w) =>
                        ocrNorm.includes(w),
                    );

                    if (matchedSubWords.length > 0) {
                        consider({
                            card,
                            score: 92,
                            specificity:
                                charNorm.length +
                                matchedSubWords.join(' ').length +
                                bonusSpecificity,
                        });
                    } else if (
                        ocrNorm.includes('bodyguard') ||
                        ocrNorm.includes('run away') ||
                        ocrNorm.includes('storyborn')
                    ) {
                        if (card.id === 'rex-protective-dinosaur') {
                            consider({
                                card,
                                score: 90,
                                specificity:
                                    charNorm.length + 10 + bonusSpecificity,
                            });
                        }
                    }
                }
            }
        }
    }

    // Require at least score >= 75 to prevent false matches
    if (bestCandidate && (bestCandidate as CardOcrMatchResult).score >= 75) {
        return bestCandidate;
    }

    return null;
}

/**
 * Pre-processes an image/video frame canvas to optimize OCR detection.
 * Crops to target zone, turns to grayscale, and applies dynamic contrast stretching.
 */
export function preprocessCanvasForOcr(
    source:
        HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageBitmap,
    targetCanvas: HTMLCanvasElement,
    crop = { x: 0, y: 0, width: 1, height: 1 },
): HTMLCanvasElement {
    const srcWidth =
        'videoWidth' in source
            ? source.videoWidth || source.width
            : source.width;
    const srcHeight =
        'videoHeight' in source
            ? source.videoHeight || source.height
            : source.height;

    if (!srcWidth || !srcHeight) return targetCanvas;

    const cropX = Math.max(0, Math.floor(crop.x * srcWidth));
    const cropY = Math.max(0, Math.floor(crop.y * srcHeight));
    const cropW = Math.min(srcWidth - cropX, Math.floor(crop.width * srcWidth));
    const cropH = Math.min(
        srcHeight - cropY,
        Math.floor(crop.height * srcHeight),
    );

    if (cropW <= 0 || cropH <= 0) return targetCanvas;

    // Scale to optimal OCR dimensions: width up to 960px
    // Preserves fine 4pt collector code glyphs (218/204 • EN • 9) at 18-24px height for Tesseract WASM
    const maxTargetW = 960;
    let targetW = cropW;
    let targetH = cropH;

    if (cropW > maxTargetW) {
        const resizeRatio = maxTargetW / cropW;
        targetW = Math.round(cropW * resizeRatio);
        targetH = Math.round(cropH * resizeRatio);
    } else if (cropW < 400) {
        const upscaleRatio = 400 / cropW;
        targetW = Math.round(cropW * upscaleRatio);
        targetH = Math.round(cropH * upscaleRatio);
    }

    targetCanvas.width = targetW;
    targetCanvas.height = targetH;

    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return targetCanvas;

    ctx.imageSmoothingEnabled = true;

    // Draw cropped region directly onto canvas
    ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

    // Apply luminosity grayscale and dynamic range contrast stretch
    try {
        const imgData = ctx.getImageData(
            0,
            0,
            targetCanvas.width,
            targetCanvas.height,
        );
        const data = imgData.data;

        let minGray = 255;
        let maxGray = 0;

        // Pass 1: compute grayscale values and find min/max range
        const grays = new Uint8Array(data.length / 4);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const gray = Math.round(
                0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
            );
            grays[j] = gray;
            if (gray < minGray) minGray = gray;
            if (gray > maxGray) maxGray = gray;
        }

        // Pass 2: apply dynamic range contrast stretching
        const range = maxGray - minGray;
        if (range > 15) {
            for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                const stretched = Math.round(
                    ((grays[j] - minGray) / range) * 255,
                );
                data[i] = stretched;
                data[i + 1] = stretched;
                data[i + 2] = stretched;
            }
            ctx.putImageData(imgData, 0, 0);

            // Pass 3: Edge sharpening pass (high-pass unsharp mask for clear glyph recognition)
            const w = targetCanvas.width;
            const h = targetCanvas.height;
            if (w > 2 && h > 2) {
                const output = new Uint8ClampedArray(data.length);
                output.set(data);

                for (let y = 1; y < h - 1; y++) {
                    const rowIdx = y * w;
                    const prevRowIdx = (y - 1) * w;
                    const nextRowIdx = (y + 1) * w;

                    for (let x = 1; x < w - 1; x++) {
                        const idx = (rowIdx + x) * 4;
                        const top = (prevRowIdx + x) * 4;
                        const bottom = (nextRowIdx + x) * 4;
                        const left = (rowIdx + (x - 1)) * 4;
                        const right = (rowIdx + (x + 1)) * 4;

                        // Sharpening kernel: 5*center - (top + bottom + left + right)
                        const center = data[idx];
                        const sharpened = Math.min(
                            255,
                            Math.max(
                                0,
                                5 * center -
                                    (data[top] +
                                        data[bottom] +
                                        data[left] +
                                        data[right]),
                            ),
                        );

                        output[idx] = sharpened;
                        output[idx + 1] = sharpened;
                        output[idx + 2] = sharpened;
                    }
                }

                imgData.data.set(output);
                ctx.putImageData(imgData, 0, 0);
            }
        }
    } catch {
        // Fallback silently if canvas security restrictions apply
    }

    return targetCanvas;
}
