import { CHARACTER_FRANCHISE_MAP } from '../constants';

export { CHARACTER_FRANCHISE_MAP };

export function getCardFranchise(cardName: string): string {
    const characterName = cardName.split(' - ')[0].trim();
    if (CHARACTER_FRANCHISE_MAP[characterName])
        return CHARACTER_FRANCHISE_MAP[characterName];
    for (const key of Object.keys(CHARACTER_FRANCHISE_MAP)) {
        if (characterName.includes(key)) return CHARACTER_FRANCHISE_MAP[key];
    }
    return 'Other';
}
