import { KNOWN_SETS } from '../../../constants';
import type { Card as LorcanaCard } from '../../../types/lorcana';

export const INK_COLORS: Record<string, string> = {
    amber: '#F5B041',
    amethyst: '#AF7AC5',
    emerald: '#2ECC71',
    ruby: '#EC7063',
    sapphire: '#5DADE2',
    steel: '#A6ACAF',
};

export function getInkBadgeStyle(inkColorString: string | null) {
    if (!inkColorString) {
        return {
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            textTransform: 'uppercase' as const,
            fontWeight: 700,
            letterSpacing: '0.5px',
        };
    }

    const primaryInk = inkColorString.split('/')[0].trim().toLowerCase();
    const hex = INK_COLORS[primaryInk] || '#ffffff';

    return {
        backgroundColor: `${hex}1F`, // ~12% opacity background
        borderColor: `${hex}66`, // ~40% opacity border
        color: hex,
        textTransform: 'uppercase' as const,
        fontWeight: 700,
        letterSpacing: '0.5px',
    };
}

export const SPECIAL_RARITIES = new Set([
    'Enchanted',
    'Epic',
    'Iconic',
    'Promo',
]);

export function sortSets(databaseSets: string[]): string[] {
    return [...databaseSets].sort((a, b) => {
        const idxA = KNOWN_SETS.indexOf(a);
        const idxB = KNOWN_SETS.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
}

export function sortCards(cards: LorcanaCard[]): LorcanaCard[] {
    return [...cards].sort((a, b) => {
        const idxA = KNOWN_SETS.indexOf(a.set);
        const idxB = KNOWN_SETS.indexOf(b.set);
        if (idxA !== -1 && idxB !== -1) {
            if (idxA !== idxB) {
                return idxA - idxB;
            }
        } else if (idxA !== -1) {
            return -1;
        } else if (idxB !== -1) {
            return 1;
        } else {
            const setComp = a.set.localeCompare(b.set);
            if (setComp !== 0) return setComp;
        }
        return a.number - b.number;
    });
}
