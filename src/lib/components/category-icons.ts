/**
 * Icon mapping module for expense categories.
 * Maps icon name strings to Lucide Svelte components for default categories.
 * Custom categories use emoji display instead.
 */

import {
    FileQuestion,
    TrendingUp,
    CreditCard,
    ShoppingBag,
    Utensils,
    Carrot,
    Popcorn,
    Wine,
    Bike,
    HeartPulse,
    Gamepad,
    Moon,
    Tv,
    Bus,
    Car,
    Fuel,
    ParkingSquare,
    Route,
    Smartphone,
    Home,
    ShoppingCart,
    ReceiptIndianRupee,
    Pill,
    Dumbbell,
    Lightbulb,
    GlassWater,
    Router,
    Plane,
    Hotel,
    GraduationCap,
    Percent,
    Briefcase,
    CircleSlash,
    Gift,
    PawPrint
} from 'lucide-svelte';
import type { ComponentType, SvelteComponent } from 'svelte';
import type { ExpenseCategory } from '$lib/db';

// Map of icon name strings to Lucide components
export const LUCIDE_ICON_MAP: Record<string, ComponentType<SvelteComponent>> = {
    'FileQuestion': FileQuestion,
    'TrendingUp': TrendingUp,
    'CreditCard': CreditCard,
    'ShoppingBag': ShoppingBag,
    'Utensils': Utensils,
    'Carrot': Carrot,
    'Popcorn': Popcorn,
    'Wine': Wine,
    'Bike': Bike,
    'HeartPulse': HeartPulse,
    'Gamepad': Gamepad,
    'Moon': Moon,
    'Tv': Tv,
    'Bus': Bus,
    'Car': Car,
    'Fuel': Fuel,
    'ParkingSquare': ParkingSquare,
    'Route': Route,
    'Smartphone': Smartphone,
    'Home': Home,
    'ShoppingCart': ShoppingCart,
    'ReceiptIndianRupee': ReceiptIndianRupee,
    'Pill': Pill,
    'Dumbbell': Dumbbell,
    'Lightbulb': Lightbulb,
    'GlassWater': GlassWater,
    'Router': Router,
    'Plane': Plane,
    'Hotel': Hotel,
    'GraduationCap': GraduationCap,
    'Percent': Percent,
    'Briefcase': Briefcase,
    'CircleSlash': CircleSlash,
    'Gift': Gift,
    'PawPrint': PawPrint,
};

/**
 * Get the Lucide icon component for a category.
 * For default categories with a known icon name, returns the Lucide component.
 * For custom categories or unknown icons, returns FileQuestion as fallback.
 */
export function getCategoryIconComponent(category: ExpenseCategory): ComponentType<SvelteComponent> {
    if (category.icon && LUCIDE_ICON_MAP[category.icon]) {
        return LUCIDE_ICON_MAP[category.icon];
    }
    return FileQuestion;
}

/**
 * Get the icon component directly by name string.
 * Useful when you only have the icon name, not the full category object.
 */
export function getIconByName(iconName: string): ComponentType<SvelteComponent> {
    return LUCIDE_ICON_MAP[iconName] ?? FileQuestion;
}

/**
 * List of available icon names for UI dropdowns when creating custom categories.
 * These are the most commonly useful icons for expense categories.
 */
export const AVAILABLE_ICON_NAMES = Object.keys(LUCIDE_ICON_MAP);
