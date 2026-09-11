export interface Point {
    x: number;
    y: number;
}

export type Quad = [Point, Point, Point, Point]; // TL, TR, BR, BL

export interface CardBoundingBox {
    x: number; // 0..1 normalized
    y: number; // 0..1 normalized
    width: number; // 0..1 normalized
    height: number; // 0..1 normalized
}

export interface DetectedCardBounds {
    quad: Quad; // Normalized 0..1 coordinates for skewed/rotated polygon
    box: CardBoundingBox; // Normalized axis-aligned bounding box for cropping
    angle: number; // Rotation angle in radians
    confidence: number; // 0..1 score
    isLocked: boolean;
}

// Standard Disney Lorcana / TCG aspect ratio (2.5 x 3.5 inches ~= 0.714)
export const TARGET_CARD_ASPECT_RATIO = 0.714;
export const MIN_CARD_ASPECT_RATIO = 0.5;
export const MAX_CARD_ASPECT_RATIO = 0.95;

/**
 * Checks if a width / height aspect ratio matches a standard TCG card in portrait or landscape.
 */
export function isValidCardAspectRatio(width: number, height: number): boolean {
    if (width <= 0 || height <= 0) return false;
    const ratio = width / height;
    const isPortrait =
        ratio >= MIN_CARD_ASPECT_RATIO && ratio <= MAX_CARD_ASPECT_RATIO;
    const isLandscape =
        ratio >= 1 / MAX_CARD_ASPECT_RATIO &&
        ratio <= 1 / MIN_CARD_ASPECT_RATIO;
    return isPortrait || isLandscape;
}

/**
 * Smooths quad corners across animation frames using exponential moving average.
 */
export function smoothQuad(
    prevQuad: Quad | null,
    nextQuad: Quad,
    alpha = 0.4,
): Quad {
    if (!prevQuad) return nextQuad;
    return [
        {
            x: prevQuad[0].x * (1 - alpha) + nextQuad[0].x * alpha,
            y: prevQuad[0].y * (1 - alpha) + nextQuad[0].y * alpha,
        },
        {
            x: prevQuad[1].x * (1 - alpha) + nextQuad[1].x * alpha,
            y: prevQuad[1].y * (1 - alpha) + nextQuad[1].y * alpha,
        },
        {
            x: prevQuad[2].x * (1 - alpha) + nextQuad[2].x * alpha,
            y: prevQuad[2].y * (1 - alpha) + nextQuad[2].y * alpha,
        },
        {
            x: prevQuad[3].x * (1 - alpha) + nextQuad[3].x * alpha,
            y: prevQuad[3].y * (1 - alpha) + nextQuad[3].y * alpha,
        },
    ];
}

/**
 * Detects card boundaries in an image/video frame using localized edge cluster & oriented quad analysis.
 */
export function detectCardBounds(
    source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    processingCanvas?: HTMLCanvasElement,
): DetectedCardBounds | null {
    const srcWidth =
        'videoWidth' in source
            ? source.videoWidth || source.width
            : source.width;
    const srcHeight =
        'videoHeight' in source
            ? source.videoHeight || source.height
            : source.height;

    if (!srcWidth || !srcHeight) return null;

    // Use lightweight processing canvas (320px width)
    const procW = 320;
    const procH = Math.max(180, Math.floor((320 * srcHeight) / srcWidth));

    const canvas = processingCanvas || document.createElement('canvas');
    canvas.width = procW;
    canvas.height = procH;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(source, 0, 0, procW, procH);

    try {
        const imgData = ctx.getImageData(0, 0, procW, procH);
        const data = imgData.data;

        // Convert to luminance array
        const gray = new Uint8Array(procW * procH);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            gray[j] = Math.round(
                0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
            );
        }

        // 16x16 Grid Density Map to locate card foreground cluster
        const gridCols = 16;
        const gridRows = 16;
        const cellW = procW / gridCols;
        const cellH = procH / gridRows;
        const gridDensity = new Float32Array(gridCols * gridRows);

        const edgePoints: Array<{
            x: number;
            y: number;
            gx: number;
            gy: number;
        }> = [];

        // Focus search in central/active viewport (exclude outer 5% border)
        const minScanX = Math.floor(procW * 0.05);
        const maxScanX = Math.floor(procW * 0.95);
        const minScanY = Math.floor(procH * 0.05);
        const maxScanY = Math.floor(procH * 0.95);

        for (let y = minScanY; y < maxScanY; y += 2) {
            const rowOffset = y * procW;
            const gyIdx = Math.floor(y / cellH);
            for (let x = minScanX; x < maxScanX; x += 2) {
                const dy =
                    gray[rowOffset + procW + x] - gray[rowOffset - procW + x];
                const dx = gray[rowOffset + x + 1] - gray[rowOffset + x - 1];
                const mag = Math.abs(dx) + Math.abs(dy);

                if (mag > 40) {
                    edgePoints.push({ x, y, gx: dx, gy: dy });
                    const gxIdx = Math.floor(x / cellW);
                    if (
                        gxIdx >= 0 &&
                        gxIdx < gridCols &&
                        gyIdx >= 0 &&
                        gyIdx < gridRows
                    ) {
                        gridDensity[gyIdx * gridCols + gxIdx] += mag;
                    }
                }
            }
        }

        if (edgePoints.length < 60) return null;

        // Find peak density center (the card)
        let maxDensity = 0;
        let peakGX = Math.floor(gridCols / 2);
        let peakGY = Math.floor(gridRows / 2);

        for (let gy = 2; gy < gridRows - 2; gy++) {
            for (let gx = 2; gx < gridCols - 2; gx++) {
                // 3x3 local density filter
                let localSum = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        localSum +=
                            gridDensity[(gy + dy) * gridCols + (gx + dx)];
                    }
                }
                if (localSum > maxDensity) {
                    maxDensity = localSum;
                    peakGX = gx;
                    peakGY = gy;
                }
            }
        }

        if (maxDensity < 300) return null;

        const cardCenterX = (peakGX + 0.5) * cellW;
        const cardCenterY = (peakGY + 0.5) * cellH;

        // Filter edge points belonging to this local card cluster (within radius)
        const maxClusterRadius = Math.max(procW, procH) * 0.38;
        const clusterPoints = edgePoints.filter((p) => {
            const dist = Math.hypot(p.x - cardCenterX, p.y - cardCenterY);
            return dist <= maxClusterRadius;
        });

        if (clusterPoints.length < 40) return null;

        // Compute localized covariance matrix for card orientation angle
        let sumX = 0;
        let sumY = 0;
        for (const p of clusterPoints) {
            sumX += p.x;
            sumY += p.y;
        }
        const meanX = sumX / clusterPoints.length;
        const meanY = sumY / clusterPoints.length;

        let covXX = 0;
        let covYY = 0;
        let covXY = 0;
        for (const p of clusterPoints) {
            const dx = p.x - meanX;
            const dy = p.y - meanY;
            covXX += dx * dx;
            covYY += dy * dy;
            covXY += dx * dy;
        }

        let theta = 0.5 * Math.atan2(2 * covXY, covXX - covYY);

        // Project cluster edge points along orientation axes
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const uVals = new Float32Array(clusterPoints.length);
        const vVals = new Float32Array(clusterPoints.length);

        for (let i = 0; i < clusterPoints.length; i++) {
            const dx = clusterPoints[i].x - meanX;
            const dy = clusterPoints[i].y - meanY;
            uVals[i] = dx * cosT + dy * sinT;
            vVals[i] = -dx * sinT + dy * cosT;
        }

        uVals.sort();
        vVals.sort();

        const pMin = Math.floor(clusterPoints.length * 0.08);
        const pMax = Math.floor(clusterPoints.length * 0.92);

        let uMin = uVals[pMin];
        let uMax = uVals[pMax];
        let vMin = vVals[pMin];
        let vMax = vVals[pMax];

        let width = uMax - uMin;
        let height = vMax - vMin;

        // Ensure width <= height for portrait orientation
        if (width > height) {
            theta += Math.PI / 2;
            const temp = width;
            width = height;
            height = temp;

            const tempMin = uMin;
            const tempMax = uMax;
            uMin = vMin;
            uMax = vMax;
            vMin = -tempMax;
            vMax = -tempMin;
        }

        // Validate aspect ratio & size
        if (
            width >= procW * 0.2 &&
            height >= procH * 0.25 &&
            isValidCardAspectRatio(width, height)
        ) {
            const cosA = Math.cos(theta);
            const sinA = Math.sin(theta);

            const p0: Point = {
                x: (meanX + uMin * cosA - vMin * sinA) / procW,
                y: (meanY + uMin * sinA + vMin * cosA) / procH,
            };
            const p1: Point = {
                x: (meanX + uMax * cosA - vMin * sinA) / procW,
                y: (meanY + uMax * sinA + vMin * cosA) / procH,
            };
            const p2: Point = {
                x: (meanX + uMax * cosA - vMax * sinA) / procW,
                y: (meanY + uMax * sinA + vMax * cosA) / procH,
            };
            const p3: Point = {
                x: (meanX + uMin * cosA - vMax * sinA) / procW,
                y: (meanY + uMin * sinA + vMax * cosA) / procH,
            };

            const clampP = (p: Point) => ({
                x: Math.max(0, Math.min(1, p.x)),
                y: Math.max(0, Math.min(1, p.y)),
            });

            const normTL = clampP(p0);
            const normTR = clampP(p1);
            const normBR = clampP(p2);
            const normBL = clampP(p3);

            const allX = [normTL.x, normTR.x, normBR.x, normBL.x];
            const allY = [normTL.y, normTR.y, normBR.y, normBL.y];

            const minBoxX = Math.min(...allX);
            const maxBoxX = Math.max(...allX);
            const minBoxY = Math.min(...allY);
            const maxBoxY = Math.max(...allY);

            return {
                quad: [normTL, normTR, normBR, normBL],
                box: {
                    x: minBoxX,
                    y: minBoxY,
                    width: maxBoxX - minBoxX,
                    height: maxBoxY - minBoxY,
                },
                angle: theta,
                confidence: Math.min(1, clusterPoints.length / 500),
                isLocked: true,
            };
        }
    } catch {
        // Silent catch for canvas security
    }

    return null;
}

/**
 * Extracts and crops the isolated card bounding region into a target canvas for OCR.
 */
export function cropCardFromBounds(
    source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    bounds: DetectedCardBounds,
    targetCanvas: HTMLCanvasElement,
): boolean {
    const srcWidth =
        'videoWidth' in source
            ? source.videoWidth || source.width
            : source.width;
    const srcHeight =
        'videoHeight' in source
            ? source.videoHeight || source.height
            : source.height;

    if (!srcWidth || !srcHeight) return false;

    // Pad crop slightly (10%) to ensure full card title and collector codes are included
    const padX = bounds.box.width * 0.08 * srcWidth;
    const padY = bounds.box.height * 0.08 * srcHeight;

    const cropX = Math.max(0, Math.floor(bounds.box.x * srcWidth - padX));
    const cropY = Math.max(0, Math.floor(bounds.box.y * srcHeight - padY));
    const cropW = Math.min(
        srcWidth - cropX,
        Math.floor(bounds.box.width * srcWidth + padX * 2),
    );
    const cropH = Math.min(
        srcHeight - cropY,
        Math.floor(bounds.box.height * srcHeight + padY * 2),
    );

    // Guard against microscopic crops that crash Tesseract
    if (cropW < 60 || cropH < 60) return false;

    targetCanvas.width = cropW;
    targetCanvas.height = cropH;

    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    return true;
}
