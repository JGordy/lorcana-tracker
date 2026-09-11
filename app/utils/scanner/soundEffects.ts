/**
 * Web Audio API Synthesizer for tiered audio feedback based on card market value:
 * - Tier 1 (< $1.00): Plain, soft confirmation blip (low pitch, single tone).
 * - Tier 2 ($1.00 - $9.99): Bright, ascending higher-pitched dual chime.
 * - Tier 3 ($10.00+): Premium triumphant major arpeggio fanfare with shimmer.
 */
export function playCardChime(price: number = 0): void {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx =
            window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        if (price >= 10.0) {
            // Tier 3: $10+ High-Value Fanfare (C5 -> E5 -> G5 -> C6 -> E6 bell chord arpeggio)
            const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const startTime = now + idx * 0.055;
                const duration = 0.38 - idx * 0.03;

                osc.type = idx === notes.length - 1 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.12, startTime);
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    startTime + duration,
                );

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + duration);
            });
        } else if (price >= 1.0) {
            // Tier 2: $1 - $9.99 "Little Treasure" sparkling chime (A5 -> C#6 -> E6 music-box arpeggio)
            const notes = [880.0, 1108.73, 1318.51];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const startTime = now + idx * 0.065;
                const duration = idx === notes.length - 1 ? 0.28 : 0.18;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.11, startTime);
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    startTime + duration,
                );

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + duration);
            });
        } else {
            // Tier 1: Under $1 Plain, gentle neutral blip (A4 -> C5)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.08); // C5

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.16);
        }
    } catch {
        // AudioContext autoplay restrictions or unsupported
    }
}
