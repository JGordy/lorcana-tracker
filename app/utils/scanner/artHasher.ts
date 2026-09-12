/**
 * High-Speed Perceptual Image Hashing (dHash) for Real-Time Card Identification
 *
 * Implements ManaBox-style visual feature recognition running directly inside
 * the browser canvas at 60 FPS with zero WASM thread lockup or cloud latency.
 */

export interface CardArtHash {
    id: string;
    name: string;
    set: string;
    number: number;
    rarity: string;
    artHash: string; // 16-character hex string (64-bit binary)
    fullHash: string; // 16-character hex string (64-bit binary)
}

export interface ArtMatchResult {
    cardId: string;
    artDistance: number;
    fullDistance: number;
    totalDistance: number;
    confidence: number; // 0 to 1
    record: CardArtHash;
}

/**
 * Computes bitwise Hamming distance between two 64-bit hex strings.
 * Returns the number of differing bits (0 to 64).
 */
export function hexHammingDistance(hexA: string, hexB: string): number {
    if (!hexA || !hexB || hexA.length !== 16 || hexB.length !== 16) {
        return 64;
    }

    try {
        let xor = BigInt('0x' + hexA) ^ BigInt('0x' + hexB);
        let count = 0;
        while (xor > 0n) {
            count += Number(xor & 1n);
            xor >>= 1n;
        }
        return count;
    } catch {
        return 64;
    }
}

/**
 * Computes difference hash (dHash) from raw 9x8 RGBA or Grayscale pixel buffer.
 * Expects 72 values representing 8 rows of 9 pixels.
 */
export function computeDHashFromGrayscale72(
    pixels: Uint8Array | Uint8ClampedArray,
): string {
    let binary = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const left = pixels[row * 9 + col];
            const right = pixels[row * 9 + col + 1];
            binary += left > right ? '1' : '0';
        }
    }
    return BigInt('0b' + binary)
        .toString(16)
        .padStart(16, '0');
}

/**
 * Reusable offscreen 9x8 canvas to avoid memory allocation on every video frame.
 */
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

function getOffscreenCanvas(): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
} | null {
    if (typeof document === 'undefined') return null;

    if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 9;
        offscreenCanvas.height = 8;
        offscreenCtx = offscreenCanvas.getContext('2d', {
            willReadFrequently: true,
        });
    }

    if (!offscreenCtx) return null;
    return { canvas: offscreenCanvas, ctx: offscreenCtx };
}

/**
/**
 * Calculates standard deviation (contrast/texture metric) of a 72-pixel grayscale array.
 */
export function getGrayscaleStdDev(
    pixels: Uint8Array | Uint8ClampedArray,
): number {
    let sum = 0;
    for (let i = 0; i < pixels.length; i++) {
        sum += pixels[i];
    }
    const mean = sum / pixels.length;
    let variance = 0;
    for (let i = 0; i < pixels.length; i++) {
        const diff = pixels[i] - mean;
        variance += diff * diff;
    }
    return Math.sqrt(variance / pixels.length);
}

/**
 * Extracts a region from a source canvas/video, resizes to 9x8, and returns 64-bit dHash.
 * If minStdDev is specified and texture contrast is too low (e.g. flat wall, skin, solid background), returns null.
 */
export function extractDHashFromCanvas(
    source: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    minStdDev = 0,
): string | null {
    const offscreen = getOffscreenCanvas();
    if (!offscreen) return null;

    const { ctx } = offscreen;

    // Draw and downscale directly onto 9x8 canvas
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, 9, 8);

    const imgData = ctx.getImageData(0, 0, 9, 8);
    const data = imgData.data;

    // Convert 9x8 RGBA (288 bytes) to 72 grayscale pixels
    const gray72 = new Uint8Array(72);
    for (let i = 0; i < 72; i++) {
        const offset = i * 4;
        // Standard Rec. 601 luma formula
        gray72[i] = Math.round(
            data[offset] * 0.299 +
                data[offset + 1] * 0.587 +
                data[offset + 2] * 0.114,
        );
    }

    // Discard flat/uniform surfaces without sufficient image texture
    if (minStdDev > 0) {
        const stdDev = getGrayscaleStdDev(gray72);
        if (stdDev < minStdDev) {
            return null;
        }
    }

    return computeDHashFromGrayscale72(gray72);
}

/**
 * Scans live frame hashes against the precomputed hash database.
 * Returns the best candidate if distance falls within strict dual-hash tolerance thresholds.
 */
export function findBestVisualMatch(
    liveArtHash: string,
    liveFullHash: string | null,
    hashCatalog: CardArtHash[],
    maxArtDistance = 10,
    maxFullDistance = 13,
): ArtMatchResult | null {
    if (!liveArtHash || !hashCatalog || hashCatalog.length === 0) {
        return null;
    }

    let bestResult: ArtMatchResult | null = null;
    let lowestDistance = Infinity;

    for (let i = 0; i < hashCatalog.length; i++) {
        const item = hashCatalog[i];
        const artDist = hexHammingDistance(liveArtHash, item.artHash);

        // Reject if art difference exceeds threshold
        if (artDist > maxArtDistance) {
            continue;
        }

        const fullDist =
            liveFullHash && item.fullHash
                ? hexHammingDistance(liveFullHash, item.fullHash)
                : 0;

        // Strictly enforce fullHash threshold when full card hash is provided
        if (liveFullHash && item.fullHash && fullDist > maxFullDistance) {
            continue;
        }

        // Combined score: art window is weighted higher than full border/text
        const totalDist = artDist * 1.5 + fullDist * 0.8;

        if (totalDist < lowestDistance) {
            lowestDistance = totalDist;

            // Normalize confidence: 0 distance = 1.0
            const confidence = Math.max(
                0,
                Math.min(1, 1 - (artDist * 1.5 + fullDist * 0.8) / (64 * 2.3)),
            );

            bestResult = {
                cardId: item.id,
                artDistance: artDist,
                fullDistance: fullDist,
                totalDistance: totalDist,
                confidence,
                record: item,
            };
        }
    }

    return bestResult;
}
