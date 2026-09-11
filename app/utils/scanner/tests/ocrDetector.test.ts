import { describe, it, expect } from 'vitest';
import {
    cleanOcrText,
    parseCollectorString,
    resolveSetNameFromCode,
    resolveCardFromCollector,
    matchCardFromOcr,
} from '../ocrDetector';
import type { Card } from '../../../types/lorcana';

const mockCatalog: Card[] = [
    {
        $id: 'ariel-on-human-legs',
        id: 'ariel-on-human-legs',
        name: 'Ariel - On Human Legs',
        set: 'The First Chapter',
        number: 1,
        ink_color: 'Amber',
        cost: 4,
        inkwell: true,
        strength: 3,
        willpower: 4,
        lore: 2,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Princess'],
        rarity: 'Uncommon',
        image_url: 'https://api.lorcana.ravensburger.com/images/en/set1/1.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'stitch-carefree-surfer-1-206',
        id: 'stitch-carefree-surfer-1-206',
        name: 'Stitch - Carefree Surfer',
        set: 'The First Chapter',
        number: 206,
        ink_color: 'Amber',
        cost: 7,
        inkwell: false,
        strength: 4,
        willpower: 8,
        lore: 2,
        type: ['Character'],
        classifications: ['Floodborn', 'Hero', 'Alien'],
        rarity: 'Enchanted',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set1/206.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'mickey-mouse-brave-little-tailor-p1-1',
        id: 'mickey-mouse-brave-little-tailor-p1-1',
        name: 'Mickey Mouse - Brave Little Tailor',
        set: 'Promo Set 1',
        number: 1,
        ink_color: 'Ruby',
        cost: 8,
        inkwell: true,
        strength: 5,
        willpower: 5,
        lore: 4,
        type: ['Character'],
        classifications: ['Dreamborn', 'Hero'],
        rarity: 'Promo',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/promo1/1.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'elsa-spirit-of-winter',
        id: 'elsa-spirit-of-winter',
        name: 'Elsa - Spirit of Winter',
        set: 'The First Chapter',
        number: 42,
        ink_color: 'Amethyst',
        cost: 8,
        inkwell: false,
        strength: 4,
        willpower: 6,
        lore: 2,
        type: ['Character'],
        classifications: ['Floodborn', 'Hero', 'Queen', 'Sorcerer'],
        rarity: 'Legendary',
        image_url: 'https://api.lorcana.ravensburger.com/images/en/set1/42.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'azurite-sailor',
        id: 'azurite-sailor',
        name: 'Moana - Kakamora Leader',
        set: 'Azurite Sea',
        number: 42,
        ink_color: 'Ruby',
        cost: 5,
        inkwell: true,
        strength: 4,
        willpower: 5,
        lore: 2,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Princess'],
        rarity: 'Rare',
        image_url: 'https://api.lorcana.ravensburger.com/images/en/set6/42.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'rex-protective-dinosaur',
        id: 'rex-protective-dinosaur',
        name: 'Rex - Protective Dinosaur',
        set: 'Wilds Unknown',
        number: 10,
        ink_color: 'Amber',
        cost: 2,
        inkwell: true,
        strength: 3,
        willpower: 1,
        lore: 1,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Dinosaur'],
        rarity: 'Uncommon',
        image_url: 'https://api.lorcana.ravensburger.com/images/en/set7/10.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'force-of-a-great-typhoon',
        id: 'force-of-a-great-typhoon',
        name: 'Force of a Great Typhoon',
        set: 'Winterspell',
        number: 128,
        ink_color: 'Ruby',
        cost: 2,
        inkwell: true,
        strength: null,
        willpower: null,
        lore: 0,
        type: ['Action'],
        classifications: ['Song'],
        rarity: 'Common',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set11/128.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'typhoon',
        id: 'typhoon',
        name: 'Typhoon',
        set: "Illumineer's Quest: Deep Trouble",
        number: 27,
        ink_color: 'Colorless',
        cost: 5,
        inkwell: false,
        strength: null,
        willpower: null,
        lore: 0,
        type: ['Action'],
        classifications: [],
        rarity: 'Common',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/quest/27.jpg',
        formats: ['infinity'],
    },
    {
        $id: 'hand-in-the-box-sids-toy',
        id: 'hand-in-the-box-sids-toy',
        name: "Hand-in-the-Box - Sid's Toy",
        set: 'Wilds Unknown',
        number: 114,
        ink_color: 'Ruby',
        cost: 2,
        inkwell: true,
        strength: 2,
        willpower: 2,
        lore: 1,
        type: ['Character'],
        classifications: ['Storyborn', 'Ally', 'Toy'],
        rarity: 'Uncommon',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set12/114.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'startle',
        id: 'startle',
        name: 'Startle',
        set: 'Attack of the Vine!',
        number: 169,
        ink_color: 'Sapphire',
        cost: 1,
        inkwell: true,
        strength: null,
        willpower: null,
        lore: 0,
        type: ['Action'],
        classifications: [],
        rarity: 'Common',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set13/169.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'anna-braving-the-storm',
        id: 'anna-braving-the-storm',
        name: 'Anna - Braving the Storm',
        set: "Ursula's Return",
        number: 137,
        ink_color: 'Sapphire',
        cost: 2,
        inkwell: true,
        strength: 1,
        willpower: 4,
        lore: 1,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Queen'],
        rarity: 'Common',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set4/137.jpg',
        formats: ['core', 'infinity'],
        prices: {
            usd: 0.07,
            usd_foil: 0.25,
        },
    },
    {
        $id: 'anna-braving-the-storm-9-146',
        id: 'anna-braving-the-storm-9-146',
        name: 'Anna - Braving the Storm',
        set: 'Fabled',
        number: 146,
        ink_color: 'Sapphire',
        cost: 2,
        inkwell: true,
        strength: 1,
        willpower: 4,
        lore: 1,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Queen'],
        rarity: 'Common',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set9/146.jpg',
        formats: ['core', 'infinity'],
        prices: {
            usd: 0.04,
            usd_foil: 0.2,
        },
    },
    {
        $id: 'anna-braving-the-storm-9-218',
        id: 'anna-braving-the-storm-9-218',
        name: 'Anna - Braving the Storm',
        set: 'Fabled',
        number: 218,
        ink_color: 'Sapphire',
        cost: 2,
        inkwell: true,
        strength: 1,
        willpower: 4,
        lore: 1,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Queen'],
        rarity: 'Epic',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set9/218.jpg',
        formats: ['core', 'infinity'],
        prices: {
            usd: null,
            usd_foil: 15.77,
        },
    },
    {
        $id: 'ursula-sea-witch-9-208',
        id: 'ursula-sea-witch-9-208',
        name: 'Ursula - Sea Witch',
        set: 'Fabled',
        number: 208,
        ink_color: 'Amethyst',
        cost: 3,
        inkwell: true,
        strength: 2,
        willpower: 3,
        lore: 1,
        type: ['Character'],
        classifications: ['Storyborn', 'Villain', 'Sorcerer'],
        rarity: 'Epic',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set9/208.jpg',
        formats: ['core', 'infinity'],
        prices: {
            usd: 8.5,
            usd_foil: 22.0,
        },
    },
    {
        $id: 'anna-true-hearted-4-217',
        id: 'anna-true-hearted-4-217',
        name: 'Anna - True-Hearted',
        set: "Ursula's Return",
        number: 217,
        ink_color: 'Sapphire',
        cost: 4,
        inkwell: true,
        strength: 2,
        willpower: 4,
        lore: 2,
        type: ['Character'],
        classifications: ['Dreamborn', 'Hero', 'Queen', 'Knight'],
        rarity: 'Enchanted',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set4/217.jpg',
        formats: ['core', 'infinity'],
        prices: {
            usd: null,
            usd_foil: 80.6,
        },
    },
];

describe('cleanOcrText', () => {
    it('normalizes bullets, spaces, and line breaks', () => {
        expect(cleanOcrText('115/204\n• EN · 1')).toBe('115/204 • EN • 1');
        expect(cleanOcrText('  42 / 204   -   EN   -   6  ')).toBe(
            '42 / 204 - EN - 6',
        );
    });
});

describe('parseCollectorString', () => {
    it('parses standard set collector codes with bullet separators', () => {
        const result = parseCollectorString('1/204 • EN • 1');
        expect(result).not.toBeNull();
        expect(result?.cardNumber).toBe(1);
        expect(result?.totalCards).toBe(204);
        expect(result?.setCode).toBe('1');
    });

    it('parses standard set codes with middle dot or dash', () => {
        const result = parseCollectorString('42/204 · EN · 6');
        expect(result).not.toBeNull();
        expect(result?.cardNumber).toBe(42);
        expect(result?.setCode).toBe('6');
    });

    it('parses enchanted over-numbered cards', () => {
        const result = parseCollectorString('206/204 • EN • 1');
        expect(result).not.toBeNull();
        expect(result?.cardNumber).toBe(206);
        expect(result?.setCode).toBe('1');
    });

    it('parses over-numbered collector string with set code (e.g. 218/204 • EN • 9)', () => {
        const result = parseCollectorString('218/204 • EN • 9');
        expect(result).not.toBeNull();
        expect(result?.cardNumber).toBe(218);
        expect(result?.totalCards).toBe(204);
        expect(result?.setCode).toBe('9');
    });

    it('parses over-numbered collector string when set code is blurred or missing', () => {
        const result = parseCollectorString('218/204 • EN');
        expect(result).not.toBeNull();
        expect(result?.cardNumber).toBe(218);
        expect(result?.totalCards).toBe(204);
        expect(result?.setCode).toBeUndefined();

        const bareResult = parseCollectorString('218/204');
        expect(bareResult?.cardNumber).toBe(218);
        expect(bareResult?.totalCards).toBe(204);
    });

    it('parses promo codes like 1/P1 or 8/D23', () => {
        const promoP1 = parseCollectorString('1/P1 • EN • 1');
        expect(promoP1?.cardNumber).toBe(1);
        expect(promoP1?.setCode).toBe('P1');

        const promoD23 = parseCollectorString('8/D23');
        expect(promoD23?.cardNumber).toBe(8);
        expect(promoD23?.setCode).toBe('D23');

        const promoCP = parseCollectorString('15/CP');
        expect(promoCP?.cardNumber).toBe(15);
        expect(promoCP?.setCode).toBe('CP');
    });

    it('handles noisy OCR strings with extra text or spaces', () => {
        const noisy = parseCollectorString('Disney 01/204 • EN • 1 © Disney');
        expect(noisy?.cardNumber).toBe(1);
        expect(noisy?.setCode).toBe('1');
    });
});

describe('resolveSetNameFromCode', () => {
    it('resolves numeric set codes to official set names', () => {
        expect(resolveSetNameFromCode('1')).toBe('The First Chapter');
        expect(resolveSetNameFromCode('6')).toBe('Azurite Sea');
        expect(resolveSetNameFromCode('13')).toBe('Attack of the Vine!');
    });

    it('resolves promo codes to promo names', () => {
        expect(resolveSetNameFromCode('P1')).toBe('Promo Set 1');
        expect(resolveSetNameFromCode('D23')).toBe('D23 Collection');
        expect(resolveSetNameFromCode('CP')).toBe('Challenge Promo');
    });
});

describe('resolveCardFromCollector and matchCardFromOcr', () => {
    it('resolves standard card correctly', () => {
        const match = matchCardFromOcr('1/204 • EN • 1', mockCatalog);
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('ariel-on-human-legs');
    });

    it('resolves correct card when multiple cards share the same number across sets', () => {
        const set1Card = matchCardFromOcr('42/204 • EN • 1', mockCatalog);
        expect(set1Card?.card.id).toBe('elsa-spirit-of-winter');

        const set6Card = matchCardFromOcr('42/204 • EN • 6', mockCatalog);
        expect(set6Card?.card.id).toBe('azurite-sailor');
    });

    it('resolves enchanted card correctly', () => {
        const match = matchCardFromOcr('206/204 • EN • 1', mockCatalog);
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('stitch-carefree-surfer-1-206');
    });

    it('resolves promo card correctly', () => {
        const match = matchCardFromOcr('1/P1', mockCatalog);
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('mickey-mouse-brave-little-tailor-p1-1');
    });

    it('resolves card by card title when collector code is blurry', () => {
        const match = matchCardFromOcr(
            'Disney Lorcana Elsa - Spirit of Winter Floodborn Queen',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('elsa-spirit-of-winter');
    });

    it('resolves 3-letter character card like Rex', () => {
        const match = matchCardFromOcr(
            'REX Protective Dinosaur Storyborn Hero',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('rex-protective-dinosaur');
    });

    it('resolves card by character name and version substring', () => {
        const match = matchCardFromOcr(
            'Moana Kakamora Leader Storyborn Princess',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('azurite-sailor');
    });

    it('resolves Rex by collector code in Set 12', () => {
        const match = matchCardFromOcr('10/204 • EN • 12', mockCatalog);
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('rex-protective-dinosaur');
        expect(match?.score).toBeGreaterThanOrEqual(90);
    });

    it('resolves Rex with character name and ability keyword', () => {
        const match = matchCardFromOcr(
            'REX Bodyguard (This character may enter play exerted)',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('rex-protective-dinosaur');
    });

    it('prefers Force of a Great Typhoon over Typhoon when scanning full title', () => {
        // Simulates scanning "Force of a Great Typhoon" where substring "typhoon" is also present
        const match = matchCardFromOcr(
            'FORCE OF A GREAT TYPHOON Action • Song Cost 2',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('force-of-a-great-typhoon');
        expect(match?.score).toBe(100);
    });

    it('prefers Hand-in-the-Box - Sids Toy over Startle when flavor text contains startle', () => {
        // Woody's flavor text contains "Ah! How does that still startle me every time?"
        const match = matchCardFromOcr(
            "HAND-IN-THE-BOX SID'S TOY Character • Storyborn • Ally • Toy Ah! How does that still startle me every time? -Woody 114/204 • EN • 12",
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('hand-in-the-box-sids-toy');
        expect(match?.score).toBe(100);
    });

    it('correctly resolves Startle when scanning the actual Startle action card', () => {
        const match = matchCardFromOcr(
            'STARTLE Action Sapphire Cost 1 169/204 • EN • 13 Chosen character gets -2 this turn',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('startle');
        expect(match?.score).toBeGreaterThanOrEqual(95);
    });

    it('correctly resolves Typhoon when scanning the actual Typhoon card', () => {
        const match = matchCardFromOcr(
            "TYPHOON Action Illumineer's Quest: Deep Trouble",
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('typhoon');
        expect(match?.score).toBeGreaterThanOrEqual(85);
    });

    it('rejects random noise with slashes and does not produce false positives', () => {
        // Simulates noisy text from card stats or low lighting that previously matched HeiHei/Rutt/Kida
        expect(
            matchCardFromOcr('random noise 7/1 • 3', mockCatalog),
        ).toBeNull();
        expect(
            matchCardFromOcr('3 Sivrbare 41) Dnssnars 4/1 5', mockCatalog),
        ).toBeNull();
        expect(
            matchCardFromOcr('pt oy cts mst ho se wth Py 7/2', mockCatalog),
        ).toBeNull();
    });

    it('resolves Epic over-numbered card when scanning full text with set code', () => {
        const match = matchCardFromOcr(
            'ANNA Braving the Storm Storyborn Hero Queen 218/204 • EN • 9',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.card.rarity).toBe('Epic');
        expect(match?.card.number).toBe(218);
    });

    it('resolves Epic over-numbered card when set code is blurred or omitted in collector line', () => {
        // Foil glare often obscures the tiny set number 9 at bottom-right
        const match = matchCardFromOcr(
            'ANNA Braving the Storm Storyborn Hero Queen 218/204 • EN',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.card.rarity).toBe('Epic');
    });

    it('resolves Epic card when only title and over-number 218 appear in OCR', () => {
        const match = matchCardFromOcr(
            'ANNA Braving the Storm Sapphire Cost 2 218',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.card.rarity).toBe('Epic');
    });

    it('resolves Common base version when scanning Set 4 card', () => {
        const match = matchCardFromOcr(
            'ANNA Braving the Storm 137/204 • EN • 4',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm');
        expect(match?.card.rarity).toBe('Common');
        expect(match?.card.number).toBe(137);
    });

    it('resolves Common base version when scanning Fabled Set 9 card #146', () => {
        const match = matchCardFromOcr(
            'ANNA Braving the Storm 146/204 • EN • 9',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-146');
        expect(match?.card.rarity).toBe('Common');
        expect(match?.card.number).toBe(146);
    });

    it('resolves Anna Epic #218 and NEVER Ursula #208 when OCR misreads 218 as 208', () => {
        // Tesseract frequently confuses the narrow middle digit 1 in 218 with 0 (reading 208).
        // Card #208 in Fabled is Ursula - Sea Witch, but the card in frame is Anna!
        const match = matchCardFromOcr(
            'ANNA Braving the Storm Storyborn Hero Queen 208/204 • EN • 9',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.card.id).not.toBe('ursula-sea-witch-9-208');
        expect(match?.card.rarity).toBe('Epic');
        expect(match?.card.number).toBe(218);
    });

    it('resolves Anna Epic #218 and NEVER Ursula when OCR only caught character name ANNA and 208/204', () => {
        const match = matchCardFromOcr('ANNA 208/204 • EN • 9', mockCatalog);
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.card.id).not.toBe('ursula-sea-witch-9-208');
    });

    it('resolves Ursula Sea Witch #208 when scanning Ursula card', () => {
        const match = matchCardFromOcr(
            'URSULA Sea Witch Storyborn Villain Sorcerer 208/204 • EN • 9',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('ursula-sea-witch-9-208');
        expect(match?.card.rarity).toBe('Epic');
        expect(match?.card.number).toBe(208);
    });

    it('resolves Ursula by collector code alone when title is not in frame', () => {
        const match = matchCardFromOcr('208/204 • EN • 9', mockCatalog);
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('ursula-sea-witch-9-208');
    });

    it('resolves Anna Epic #218 and NEVER Anna True-Hearted #217 when OCR misreads 218 as 217 with set 9', () => {
        // Tesseract frequently confuses the curved 8 in 218 with 7 (reading 217).
        // Card #217 in Ursula's Return is Anna - True-Hearted ($80.60 Enchanted),
        // but the card in frame is Anna - Braving the Storm!
        const match = matchCardFromOcr(
            'ANNA Braving the Storm Storyborn Hero Queen 217/204 • EN • 9',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.card.id).not.toBe('anna-true-hearted-4-217');
        expect(match?.card.rarity).toBe('Epic');
        expect(match?.card.number).toBe(218);
    });

    it('resolves Anna Epic #218 and NEVER Anna True-Hearted #217 even when set code is omitted in OCR', () => {
        const match = matchCardFromOcr(
            'ANNA Braving the Storm Storyborn Hero Queen 217/204 • EN',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.card.id).not.toBe('anna-true-hearted-4-217');
        expect(match?.card.rarity).toBe('Epic');
    });

    it('resolves Anna True-Hearted #217 when scanning the actual True-Hearted card', () => {
        const match = matchCardFromOcr(
            'ANNA True-Hearted Dreamborn Hero Queen Knight 217/204 • EN • 4',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-true-hearted-4-217');
        expect(match?.card.rarity).toBe('Enchanted');
        expect(match?.card.number).toBe(217);
    });

    it('TIER 1 GOLDEN MATCH: Simultaneously matches Name and Number, choosing Epic #218 over Base #146', () => {
        const match = matchCardFromOcr(
            'ANNA Braving the Storm Storyborn Hero Queen 218/204 • EN • 9',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.score).toBe(100);
        expect(match?.card.number).toBe(218);
        expect(match?.card.rarity).toBe('Epic');
    });

    it('TIER 1 GOLDEN MATCH: Simultaneously matches Name and Number, choosing Base #146 when 146 is on card', () => {
        const match = matchCardFromOcr(
            'ANNA Braving the Storm Storyborn Hero Queen 146/204 • EN • 9',
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.card.id).toBe('anna-braving-the-storm-9-146');
        expect(match?.score).toBe(100);
        expect(match?.card.number).toBe(146);
        expect(match?.card.rarity).toBe('Common');
    });

    it('TIER 2 COLLECTOR MATCH: When title is not read, Set + Number gives exact card without guessing', () => {
        const matchEpic = matchCardFromOcr('218/204 • EN • 9', mockCatalog);
        expect(matchEpic).not.toBeNull();
        expect(matchEpic?.card.id).toBe('anna-braving-the-storm-9-218');
        expect(matchEpic?.card.rarity).toBe('Epic');

        const matchBase = matchCardFromOcr('146/204 • EN • 9', mockCatalog);
        expect(matchBase).not.toBeNull();
        expect(matchBase?.card.id).toBe('anna-braving-the-storm-9-146');
        expect(matchBase?.card.rarity).toBe('Common');
    });

    it('returns null for unparseable or non-matching text', () => {
        expect(
            matchCardFromOcr('random noise xyz 12345', mockCatalog),
        ).toBeNull();
        expect(matchCardFromOcr('999/204 • EN • 1', mockCatalog)).toBeNull();
    });
});
