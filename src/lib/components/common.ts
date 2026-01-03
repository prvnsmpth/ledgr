import { SupportedBank } from '$lib/db';
import { get } from 'svelte/store';
import { categoryByValue } from '$lib/db/store';
import { getIconByName, LUCIDE_ICON_MAP } from './category-icons';
import { FileQuestion } from 'lucide-svelte';
import HDFCIcon from '$lib/components/icons/hdfc.svelte';
import ICICIIcon from '$lib/components/icons/icici.svelte';
import SBIIcon from '$lib/components/icons/sbi.svelte';

// Default fallback values for when category is not found
const DEFAULT_COLOR = 'hsl(var(--neutral-200))';
const DEFAULT_EMOJI = '💰';

/**
 * Gets the Lucide icon component for a category value.
 * Looks up the category from the database store and returns the appropriate icon.
 */
export function getCategoryIcon(categoryValue: string) {
    const map = get(categoryByValue);
    const category = map.get(categoryValue);
    if (category?.icon && LUCIDE_ICON_MAP[category.icon]) {
        return LUCIDE_ICON_MAP[category.icon];
    }
    return FileQuestion;
}

/**
 * Gets the color for a category value.
 * Looks up the category from the database store and returns its color.
 */
export function getCategoryColor(categoryValue: string): string {
    const map = get(categoryByValue);
    const category = map.get(categoryValue);
    return category?.color || DEFAULT_COLOR;
}

/**
 * Gets the emoji for a category value.
 * Looks up the category from the database store and returns its emoji.
 */
export function getCategoryEmoji(categoryValue: string): string {
    const map = get(categoryByValue);
    const category = map.get(categoryValue);
    return category?.emoji || DEFAULT_EMOJI;
}

export const BankIcons = {
    [SupportedBank.HDFC]: HDFCIcon,
    [SupportedBank.ICICI]: ICICIIcon,
    [SupportedBank.SBI]: SBIIcon,
}
