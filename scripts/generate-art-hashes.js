import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const CARDS_FILE = path.resolve(process.cwd(), 'public/cards.json');
const OUTPUT_FILE = path.resolve(process.cwd(), 'public/art-hashes.json');
const CONCURRENCY = 20;

/**
 * Computes 64-bit dHash (difference hash) from a raw 9x8 grayscale buffer.
 */
function computeDHashFromRaw9x8(rawBuffer) {
    let binary = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const left = rawBuffer[row * 9 + col];
            const right = rawBuffer[row * 9 + col + 1];
            binary += left > right ? '1' : '0';
        }
    }
    // Convert 64-bit binary to 16-character hex string
    return BigInt('0b' + binary)
        .toString(16)
        .padStart(16, '0');
}

/**
 * Downloads image buffer and computes both art-window dHash and full-card dHash.
 */
async function computeCardHashes(imageUrl) {
    const res = await fetch(imageUrl, {
        headers: {
            'User-Agent': 'LorcanaTracker/1.0',
        },
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching ${imageUrl}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const meta = await sharp(buffer).metadata();

    if (!meta.width || !meta.height) {
        throw new Error('Invalid image dimensions');
    }

    // 1. Art crop: In Lorcana cards, illustration sits at X: ~8-92%, Y: ~10-54%
    const artLeft = Math.round(meta.width * 0.08);
    const artTop = Math.round(meta.height * 0.1);
    const artWidth = Math.round(meta.width * 0.84);
    const artHeight = Math.round(meta.height * 0.44);

    const rawArt = await sharp(buffer)
        .extract({
            left: artLeft,
            top: artTop,
            width: artWidth,
            height: artHeight,
        })
        .resize(9, 8, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer();

    const artHash = computeDHashFromRaw9x8(rawArt);

    // 2. Full card overview: captures the entire card face, borders, ink banner, and art
    const rawFull = await sharp(buffer)
        .resize(9, 8, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer();

    const fullHash = computeDHashFromRaw9x8(rawFull);

    return { artHash, fullHash };
}

async function main() {
    if (!fs.existsSync(CARDS_FILE)) {
        console.error('Cards file not found at:', CARDS_FILE);
        process.exit(1);
    }

    const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
    console.log(`Loaded ${cards.length} cards from ${CARDS_FILE}`);

    // Load existing hashes if resuming
    const existingHashesMap = new Map();
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
            for (const item of existing) {
                if (item.id && item.artHash) {
                    existingHashesMap.set(item.id, item);
                }
            }
            console.log(
                `Resuming with ${existingHashesMap.size} existing cached hashes.`,
            );
        } catch {
            console.log(
                'Existing art-hashes.json could not be parsed. Starting fresh.',
            );
        }
    }

    const cardsToProcess = cards.filter(
        (c) => c.image_url && !existingHashesMap.has(c.id),
    );
    console.log(`Cards left to process: ${cardsToProcess.length}`);

    let completed = 0;
    let failed = 0;
    let index = 0;

    async function worker() {
        while (index < cardsToProcess.length) {
            const currentIndex = index++;
            const card = cardsToProcess[currentIndex];

            try {
                const { artHash, fullHash } = await computeCardHashes(
                    card.image_url,
                );
                existingHashesMap.set(card.id, {
                    id: card.id,
                    name: card.name,
                    set: card.set,
                    number: card.number,
                    rarity: card.rarity,
                    artHash,
                    fullHash,
                });
                completed++;
            } catch (_err) {
                failed++;
                // Non-fatal, keep going
            }

            if (
                (completed + failed) % 50 === 0 ||
                completed + failed === cardsToProcess.length
            ) {
                const pct = (
                    ((completed + failed) / cardsToProcess.length) *
                    100
                ).toFixed(1);
                console.log(
                    `Progress: ${completed + failed}/${cardsToProcess.length} (${pct}%) - Done: ${completed}, Failed: ${failed}`,
                );
                // Periodic save
                saveProgress(Array.from(existingHashesMap.values()));
            }
        }
    }

    function saveProgress(results) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    }

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);
    saveProgress(Array.from(existingHashesMap.values()));

    console.log(
        `\nFinished generating art hashes! Total: ${existingHashesMap.size} records in ${OUTPUT_FILE}`,
    );
}

main().catch((err) => {
    console.error('Fatal error in generate-art-hashes:', err);
    process.exit(1);
});
