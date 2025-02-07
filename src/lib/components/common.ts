import { ExpenseCategory, SupportedBank } from '$lib/db';
import {
    Car,
    Carrot,
    CreditCard,
    FileQuestion,
    HeartPulse,
    Home,
    Lightbulb,
    Plane,
    Popcorn,
    ReceiptIndianRupee,
    ShoppingBag,
    Utensils,
    TrendingUp,
    Dumbbell,
    Gift,
    Smartphone,
    PawPrint,
    Briefcase,
    Router,
    Percent,
    CircleSlash
} from 'lucide-svelte';
import HDFCIcon from '$lib/components/icons/hdfc.svelte';
import ICICIIcon from '$lib/components/icons/icici.svelte';
import SBIIcon from '$lib/components/icons/sbi.svelte';
import SwiggyIcon from '$lib/components/icons/swiggy.svelte';
import NetflixIcon from '$lib/components/icons/netflix.svelte';
import StreamingIcon from '$lib/components/icons/streaming.svelte';

export const ExpenseCategoryIcons = {
    [ExpenseCategory.CreditCardPayment]: CreditCard,
    [ExpenseCategory.Dining]: Utensils,
    [ExpenseCategory.Entertainment]: Popcorn,
    [ExpenseCategory.Gift]: Gift,
    [ExpenseCategory.Groceries]: Carrot,
    [ExpenseCategory.Gym]: Dumbbell,
    [ExpenseCategory.Health]: HeartPulse,
    [ExpenseCategory.Internet]: Router,
    [ExpenseCategory.Investment]: TrendingUp,
    [ExpenseCategory.LoanEMI]: Percent,
    [ExpenseCategory.Netflix]: NetflixIcon,
    [ExpenseCategory.Other]: ReceiptIndianRupee,
    [ExpenseCategory.Pets]: PawPrint,
    [ExpenseCategory.Phone]: Smartphone,
    [ExpenseCategory.Rent]: Home,
    [ExpenseCategory.SelfTransfer]: CircleSlash,
    [ExpenseCategory.Shopping]: ShoppingBag,
    [ExpenseCategory.Streaming]: StreamingIcon,
    [ExpenseCategory.Swiggy]: SwiggyIcon,
    [ExpenseCategory.Transport]: Car,
    [ExpenseCategory.Travel]: Plane,
    [ExpenseCategory.Untagged]: FileQuestion,
    [ExpenseCategory.Utilities]: Lightbulb,
    [ExpenseCategory.Work]: Briefcase,
}

export const ExpenseCategoryColors = {
    [ExpenseCategory.CreditCardPayment]: 'hsl(var(--stone-200))',
    [ExpenseCategory.Dining]: 'hsl(var(--rose-200))',
    [ExpenseCategory.Entertainment]: 'hsl(var(--fuchsia-200))',
    [ExpenseCategory.Gift]: 'hsl(var(--violet-200))',
    [ExpenseCategory.Groceries]: 'hsl(var(--green-200))',
    [ExpenseCategory.Gym]: 'hsl(var(--emerald-200))',
    [ExpenseCategory.Health]: 'hsl(var(--teal-200))',
    [ExpenseCategory.Internet]: 'hsl(var(--cyan-200))',
    [ExpenseCategory.Investment]: 'hsl(var(--blue-200))',
    [ExpenseCategory.LoanEMI]: 'hsl(var(--slate-200))',
    [ExpenseCategory.Netflix]: 'hsl(var(--red-200))',
    [ExpenseCategory.Other]: 'hsl(var(--neutral-200))',
    [ExpenseCategory.Pets]: 'hsl(var(--pink-200))',
    [ExpenseCategory.Phone]: 'hsl(var(--indigo-200))',
    [ExpenseCategory.Rent]: 'hsl(var(--zinc-200))',
    [ExpenseCategory.SelfTransfer]: 'hsl(var(--gray-200))',
    [ExpenseCategory.Shopping]: 'hsl(var(--purple-200))',
    [ExpenseCategory.Streaming]: 'hsl(var(--fuchsia-200))',
    [ExpenseCategory.Swiggy]: 'hsl(var(--orange-200))',
    [ExpenseCategory.Transport]: 'hsl(var(--amber-200))',
    [ExpenseCategory.Travel]: 'hsl(var(--sky-200))',
    [ExpenseCategory.Untagged]: 'hsl(var(--stone-200))',
    [ExpenseCategory.Utilities]: 'hsl(var(--yellow-200))',
    [ExpenseCategory.Work]: 'hsl(var(--lime-200))',
};

export function getCategoryIcon(category: string) {
    return ExpenseCategoryIcons[category as ExpenseCategory] || FileQuestion
}

export function getCategoryColor(category: string) {
    return ExpenseCategoryColors[category as ExpenseCategory] || 'hsl(var(--neutral-400))'
}

export const ExpenseCategoryEmojis = {
    [ExpenseCategory.CreditCardPayment]: '💳',
    [ExpenseCategory.Dining]: '🍽️',
    [ExpenseCategory.Entertainment]: '🍿',
    [ExpenseCategory.Gift]: '🎁',
    [ExpenseCategory.Groceries]: '🥕',
    [ExpenseCategory.Gym]: '🏋️',
    [ExpenseCategory.Health]: '💓',
    [ExpenseCategory.Internet]: '📶',
    [ExpenseCategory.Investment]: '📈',
    [ExpenseCategory.LoanEMI]: '💸',
    [ExpenseCategory.Netflix]: '🎥',
    [ExpenseCategory.Other]: '💸',
    [ExpenseCategory.Pets]: '🐾',
    [ExpenseCategory.Phone]: '📱',
    [ExpenseCategory.Rent]: '🏠',
    [ExpenseCategory.SelfTransfer]: '🔄',
    [ExpenseCategory.Shopping]: '🛍',
    [ExpenseCategory.Streaming]: '🎥',
    [ExpenseCategory.Swiggy]: '🍔',
    [ExpenseCategory.Transport]: '🚗',
    [ExpenseCategory.Travel]: '✈️',
    [ExpenseCategory.Untagged]: '❓',
    [ExpenseCategory.Utilities]: '💡',
    [ExpenseCategory.Work]: '💼',
}

export const BankIcons = {
    [SupportedBank.HDFC]: HDFCIcon,
    [SupportedBank.ICICI]: ICICIIcon,
    [SupportedBank.SBI]: SBIIcon,
}
