/**
 * Default category seed data for the expense categories database.
 * This file contains all the default categories that are pre-populated
 * when the database is first initialized.
 */

export type CategorySeedData = {
    value: string;
    name: string;
    iconName: string;
    color: string;
    emoji: string;
    parentValue: string | null;
    excludeFromCashFlow?: boolean;
};

// Super categories (top-level groupings)
export const SUPER_CATEGORY_SEEDS: CategorySeedData[] = [
    { value: 'food_and_dining', name: 'Food & Dining', iconName: 'Utensils', color: 'hsl(var(--yellow-200))', emoji: '🍽️', parentValue: null },
    { value: 'entertainment', name: 'Entertainment', iconName: 'Popcorn', color: 'hsl(var(--pink-300))', emoji: '🎬', parentValue: null },
    { value: 'transportation', name: 'Transportation', iconName: 'Car', color: 'hsl(var(--purple-200))', emoji: '🚗', parentValue: null },
    { value: 'shopping', name: 'Shopping', iconName: 'ShoppingBag', color: 'hsl(var(--green-300))', emoji: '🛍️', parentValue: null },
    { value: 'health_and_wellness', name: 'Health & Wellness', iconName: 'HeartPulse', color: 'hsl(var(--rose-400))', emoji: '❤️', parentValue: null },
    { value: 'housing', name: 'Housing', iconName: 'Home', color: 'hsl(var(--blue-200))', emoji: '🏠', parentValue: null },
    { value: 'utilities', name: 'Utilities', iconName: 'Lightbulb', color: 'hsl(var(--yellow-400))', emoji: '💡', parentValue: null },
    { value: 'travel', name: 'Travel', iconName: 'Plane', color: 'hsl(var(--rose-500))', emoji: '✈️', parentValue: null },
    { value: 'education', name: 'Education', iconName: 'GraduationCap', color: 'hsl(var(--indigo-500))', emoji: '🎓', parentValue: null },
    { value: 'finance', name: 'Finance & Insurance', iconName: 'ReceiptIndianRupee', color: 'hsl(var(--purple-400))', emoji: '💰', parentValue: null },
    { value: 'personal_care', name: 'Personal Care', iconName: 'HeartPulse', color: 'hsl(var(--teal-500))', emoji: '💆', parentValue: null },
    { value: 'family', name: 'Family', iconName: 'PawPrint', color: 'hsl(var(--sky-600))', emoji: '👨‍👩‍👧', parentValue: null },
    { value: 'gifts_and_donations', name: 'Gifts & Donations', iconName: 'Gift', color: 'hsl(var(--rose-500))', emoji: '🎁', parentValue: null },
    { value: 'taxes', name: 'Taxes', iconName: 'ReceiptIndianRupee', color: 'hsl(var(--fuchsia-700))', emoji: '🧾', parentValue: null },
    { value: 'investments', name: 'Investments', iconName: 'TrendingUp', color: 'hsl(var(--indigo-700))', emoji: '📈', parentValue: null, excludeFromCashFlow: true },
    { value: 'business_expenses', name: 'Business Expenses', iconName: 'Briefcase', color: 'hsl(var(--purple-600))', emoji: '💼', parentValue: null },
    { value: 'subscriptions_and_memberships', name: 'Subscriptions & Memberships', iconName: 'Dumbbell', color: 'hsl(var(--lime-800))', emoji: '📱', parentValue: null },
];

// Special categories (no parent, handled specially)
export const SPECIAL_CATEGORY_SEEDS: CategorySeedData[] = [
    { value: 'untagged', name: 'Untagged', iconName: 'FileQuestion', color: 'hsl(var(--neutral-400))', emoji: '❓', parentValue: null },
    { value: 'self_transfer', name: 'Self Transfer', iconName: 'TrendingUp', color: 'hsl(var(--neutral-500))', emoji: '🔄', parentValue: null, excludeFromCashFlow: true },
    { value: 'credit_card_payment', name: 'Credit Card Payment', iconName: 'CreditCard', color: 'hsl(var(--stone-200))', emoji: '💳', parentValue: null, excludeFromCashFlow: true },
];

// Sub-categories (grouped by parent)
export const SUB_CATEGORY_SEEDS: CategorySeedData[] = [
    // Food & Dining
    { value: 'groceries', name: 'Groceries', iconName: 'ShoppingBag', color: 'hsl(var(--green-200))', emoji: '🛒', parentValue: 'food_and_dining' },
    { value: 'restaurants', name: 'Restaurants', iconName: 'Utensils', color: 'hsl(var(--yellow-200))', emoji: '🍽️', parentValue: 'food_and_dining' },
    { value: 'cafes', name: 'Cafes', iconName: 'Carrot', color: 'hsl(var(--amber-200))', emoji: '☕', parentValue: 'food_and_dining' },
    { value: 'alcohol_and_bars', name: 'Alcohol & Bars', iconName: 'Wine', color: 'hsl(var(--orange-300))', emoji: '🍻', parentValue: 'food_and_dining' },
    { value: 'food_delivery', name: 'Food Delivery', iconName: 'Bike', color: 'hsl(var(--yellow-300))', emoji: '🛵', parentValue: 'food_and_dining' },

    // Entertainment
    { value: 'movies', name: 'Movies', iconName: 'Popcorn', color: 'hsl(var(--pink-300))', emoji: '🎬', parentValue: 'entertainment' },
    { value: 'concerts_and_events', name: 'Concerts & Events', iconName: 'HeartPulse', color: 'hsl(var(--fuchsia-300))', emoji: '🎤', parentValue: 'entertainment' },
    { value: 'gaming', name: 'Gaming', iconName: 'Gamepad', color: 'hsl(var(--lime-300))', emoji: '🎮', parentValue: 'entertainment' },
    { value: 'nightlife', name: 'Nightlife', iconName: 'Moon', color: 'hsl(var(--rose-300))', emoji: '🌃', parentValue: 'entertainment' },
    { value: 'streaming_services', name: 'Streaming Services', iconName: 'Tv', color: 'hsl(var(--sky-300))', emoji: '🍿', parentValue: 'entertainment' },

    // Transportation
    { value: 'public_transport', name: 'Public Transport', iconName: 'Bus', color: 'hsl(var(--purple-200))', emoji: '🚇', parentValue: 'transportation' },
    { value: 'ride_sharing', name: 'Ride Sharing', iconName: 'Car', color: 'hsl(var(--violet-200))', emoji: '🚕', parentValue: 'transportation' },
    { value: 'fuel', name: 'Fuel', iconName: 'Fuel', color: 'hsl(var(--red-200))', emoji: '⛽', parentValue: 'transportation' },
    { value: 'vehicle_maintenance', name: 'Vehicle Maintenance', iconName: 'Car', color: 'hsl(var(--red-300))', emoji: '🛠️', parentValue: 'transportation' },
    { value: 'parking', name: 'Parking', iconName: 'ParkingSquare', color: 'hsl(var(--stone-300))', emoji: '🅿️', parentValue: 'transportation' },
    { value: 'tolls', name: 'Tolls', iconName: 'Route', color: 'hsl(var(--amber-300))', emoji: '🛣️', parentValue: 'transportation' },

    // Shopping
    { value: 'clothing_and_accessories', name: 'Clothing & Accessories', iconName: 'ShoppingBag', color: 'hsl(var(--green-300))', emoji: '👚', parentValue: 'shopping' },
    { value: 'electronics', name: 'Electronics', iconName: 'Smartphone', color: 'hsl(var(--blue-400))', emoji: '📱', parentValue: 'shopping' },
    { value: 'home_and_furniture', name: 'Home & Furniture', iconName: 'Home', color: 'hsl(var(--indigo-300))', emoji: '🛋️', parentValue: 'shopping' },
    { value: 'online_shopping', name: 'Online Shopping', iconName: 'ShoppingCart', color: 'hsl(var(--pink-400))', emoji: '🛍️', parentValue: 'shopping' },

    // Health & Wellness
    { value: 'medical_bills', name: 'Medical Bills', iconName: 'ReceiptIndianRupee', color: 'hsl(var(--rose-400))', emoji: '⚕️', parentValue: 'health_and_wellness' },
    { value: 'prescription_medications', name: 'Prescription Medications', iconName: 'Pill', color: 'hsl(var(--fuchsia-400))', emoji: '💊', parentValue: 'health_and_wellness' },
    { value: 'therapy_and_counseling', name: 'Therapy & Counseling', iconName: 'HeartPulse', color: 'hsl(var(--teal-300))', emoji: '🫂', parentValue: 'health_and_wellness' },
    { value: 'dental_care', name: 'Dental Care', iconName: 'Utensils', color: 'hsl(var(--cyan-300))', emoji: '🦷', parentValue: 'health_and_wellness' },
    { value: 'vision_care', name: 'Vision Care', iconName: 'Lightbulb', color: 'hsl(var(--indigo-400))', emoji: '👓', parentValue: 'health_and_wellness' },

    // Housing
    { value: 'rent', name: 'Rent', iconName: 'Home', color: 'hsl(var(--blue-200))', emoji: '🏠', parentValue: 'housing' },
    { value: 'mortgage', name: 'Mortgage', iconName: 'Home', color: 'hsl(var(--blue-300))', emoji: '🏡', parentValue: 'housing' },
    { value: 'home_repairs_and_maintenance', name: 'Home Repairs & Maintenance', iconName: 'Home', color: 'hsl(var(--sky-400))', emoji: '🔧', parentValue: 'housing' },
    { value: 'home_security', name: 'Home Security', iconName: 'Home', color: 'hsl(var(--violet-300))', emoji: '🔒', parentValue: 'housing' },

    // Utilities
    { value: 'electricity', name: 'Electricity', iconName: 'Lightbulb', color: 'hsl(var(--yellow-400))', emoji: '💡', parentValue: 'utilities' },
    { value: 'water', name: 'Water', iconName: 'GlassWater', color: 'hsl(var(--blue-500))', emoji: '💧', parentValue: 'utilities' },
    { value: 'gas', name: 'Gas', iconName: 'Fuel', color: 'hsl(var(--orange-400))', emoji: '🔥', parentValue: 'utilities' },
    { value: 'internet', name: 'Internet', iconName: 'Router', color: 'hsl(var(--purple-300))', emoji: '🌐', parentValue: 'utilities' },
    { value: 'mobile_phone', name: 'Mobile Phone', iconName: 'Smartphone', color: 'hsl(var(--violet-400))', emoji: '📞', parentValue: 'utilities' },

    // Travel
    { value: 'flights', name: 'Flights', iconName: 'Plane', color: 'hsl(var(--rose-500))', emoji: '✈️', parentValue: 'travel' },
    { value: 'hotels', name: 'Hotels', iconName: 'Hotel', color: 'hsl(var(--fuchsia-500))', emoji: '🏨', parentValue: 'travel' },
    { value: 'car_rentals', name: 'Car Rentals', iconName: 'Car', color: 'hsl(var(--lime-500))', emoji: '🚗', parentValue: 'travel' },
    { value: 'travel_insurance', name: 'Travel Insurance', iconName: 'Plane', color: 'hsl(var(--teal-400))', emoji: '⛱️', parentValue: 'travel' },
    { value: 'tours_and_excursions', name: 'Tours & Excursions', iconName: 'Plane', color: 'hsl(var(--cyan-400))', emoji: '🗺️', parentValue: 'travel' },

    // Education
    { value: 'tuition', name: 'Tuition', iconName: 'GraduationCap', color: 'hsl(var(--indigo-500))', emoji: '🎓', parentValue: 'education' },
    { value: 'books_and_supplies', name: 'Books & Supplies', iconName: 'ShoppingBag', color: 'hsl(var(--sky-500))', emoji: '📚', parentValue: 'education' },
    { value: 'online_courses', name: 'Online Courses', iconName: 'Lightbulb', color: 'hsl(var(--violet-500))', emoji: '👨‍💻', parentValue: 'education' },
    { value: 'school_fees', name: 'School Fees', iconName: 'GraduationCap', color: 'hsl(var(--yellow-500))', emoji: '🏫', parentValue: 'education' },
    { value: 'educational_subscriptions', name: 'Educational Subscriptions', iconName: 'Lightbulb', color: 'hsl(var(--orange-500))', emoji: '📰', parentValue: 'education' },

    // Finance & Insurance
    { value: 'loan_payments', name: 'Loan Payments', iconName: 'ReceiptIndianRupee', color: 'hsl(var(--purple-400))', emoji: '💸', parentValue: 'finance' },
    { value: 'credit_card_fees', name: 'Credit Card Fees', iconName: 'CreditCard', color: 'hsl(var(--violet-600))', emoji: '💳', parentValue: 'finance' },
    { value: 'bank_fees', name: 'Bank Fees', iconName: 'ReceiptIndianRupee', color: 'hsl(var(--pink-600))', emoji: '🏦', parentValue: 'finance' },
    { value: 'insurance_premiums', name: 'Insurance Premiums', iconName: 'HeartPulse', color: 'hsl(var(--rose-600))', emoji: '🛡️', parentValue: 'finance' },
    { value: 'investment_fees', name: 'Investment Fees', iconName: 'TrendingUp', color: 'hsl(var(--fuchsia-600))', emoji: '📈', parentValue: 'finance' },

    // Personal Care
    { value: 'haircuts_and_grooming', name: 'Haircuts & Grooming', iconName: 'HeartPulse', color: 'hsl(var(--lime-600))', emoji: '💇‍♂️', parentValue: 'personal_care' },
    { value: 'skincare', name: 'Skincare', iconName: 'HeartPulse', color: 'hsl(var(--teal-500))', emoji: '🧴', parentValue: 'personal_care' },
    { value: 'cosmetics', name: 'Cosmetics', iconName: 'HeartPulse', color: 'hsl(var(--cyan-500))', emoji: '💄', parentValue: 'personal_care' },
    { value: 'spa_and_massage', name: 'Spa & Massage', iconName: 'HeartPulse', color: 'hsl(var(--indigo-600))', emoji: '💆‍♀️', parentValue: 'personal_care' },

    // Family & Children
    { value: 'childcare', name: 'Childcare', iconName: 'PawPrint', color: 'hsl(var(--sky-600))', emoji: '👶', parentValue: 'family' },
    { value: 'baby_supplies', name: 'Baby Supplies', iconName: 'PawPrint', color: 'hsl(var(--violet-700))', emoji: '🍼', parentValue: 'family' },
    { value: 'school_fees_and_supplies', name: 'School Fees & Supplies', iconName: 'GraduationCap', color: 'hsl(var(--yellow-600))', emoji: '🎒', parentValue: 'family' },
    { value: 'pet_care', name: 'Pet Care', iconName: 'PawPrint', color: 'hsl(var(--orange-600))', emoji: '🐾', parentValue: 'family' },

    // Gifts & Donations
    { value: 'gifts', name: 'Gifts', iconName: 'Gift', color: 'hsl(var(--rose-500))', emoji: '🎁', parentValue: 'gifts_and_donations' },
    { value: 'donations', name: 'Charitable Donations', iconName: 'Gift', color: 'hsl(var(--purple-500))', emoji: '🙏', parentValue: 'gifts_and_donations' },

    // Taxes
    { value: 'income_tax', name: 'Income Tax', iconName: 'ReceiptIndianRupee', color: 'hsl(var(--fuchsia-700))', emoji: '🧾', parentValue: 'taxes' },
    { value: 'property_tax', name: 'Property Tax', iconName: 'Home', color: 'hsl(var(--lime-700))', emoji: '🏘️', parentValue: 'taxes' },
    { value: 'vehicle_tax', name: 'Vehicle Tax', iconName: 'Car', color: 'hsl(var(--teal-600))', emoji: '🚘', parentValue: 'taxes' },
    { value: 'sales_tax', name: 'Sales Tax', iconName: 'Percent', color: 'hsl(var(--cyan-600))', emoji: '🏷️', parentValue: 'taxes' },

    // Investments
    { value: 'stocks', name: 'Stocks', iconName: 'TrendingUp', color: 'hsl(var(--indigo-700))', emoji: '📊', parentValue: 'investments', excludeFromCashFlow: true },
    { value: 'mutual_funds', name: 'Mutual Funds', iconName: 'TrendingUp', color: 'hsl(var(--sky-700))', emoji: '💹', parentValue: 'investments', excludeFromCashFlow: true },
    { value: 'bonds', name: 'Bonds', iconName: 'TrendingUp', color: 'hsl(var(--violet-900))', emoji: '💱', parentValue: 'investments', excludeFromCashFlow: true },
    { value: 'cryptocurrency', name: 'Cryptocurrency', iconName: 'TrendingUp', color: 'hsl(var(--yellow-700))', emoji: '🪙', parentValue: 'investments', excludeFromCashFlow: true },
    { value: 'real_estate_investments', name: 'Real Estate Investments', iconName: 'Home', color: 'hsl(var(--orange-700))', emoji: '🏢', parentValue: 'investments', excludeFromCashFlow: true },

    // Business Expenses
    { value: 'office_supplies', name: 'Office Supplies', iconName: 'Briefcase', color: 'hsl(var(--purple-600))', emoji: '📎', parentValue: 'business_expenses' },
    { value: 'software_tools', name: 'Software Tools', iconName: 'Briefcase', color: 'hsl(var(--violet-500))', emoji: '⚙️', parentValue: 'business_expenses' },
    { value: 'advertising_and_marketing', name: 'Advertising & Marketing', iconName: 'TrendingUp', color: 'hsl(var(--pink-800))', emoji: '📢', parentValue: 'business_expenses' },
    { value: 'business_travel', name: 'Business Travel', iconName: 'Briefcase', color: 'hsl(var(--rose-800))', emoji: '💼', parentValue: 'business_expenses' },
    { value: 'professional_services', name: 'Professional Services', iconName: 'Briefcase', color: 'hsl(var(--fuchsia-800))', emoji: '🧑‍💼', parentValue: 'business_expenses' },

    // Subscriptions & Memberships
    { value: 'gym_memberships', name: 'Gym Memberships', iconName: 'Dumbbell', color: 'hsl(var(--lime-800))', emoji: '💪', parentValue: 'subscriptions_and_memberships' },
    { value: 'magazine_and_newspapers', name: 'Magazine & Newspapers', iconName: 'FileQuestion', color: 'hsl(var(--teal-700))', emoji: '📰', parentValue: 'subscriptions_and_memberships' },
    { value: 'professional_memberships', name: 'Professional Memberships', iconName: 'Briefcase', color: 'hsl(var(--cyan-700))', emoji: '🧑‍🎓', parentValue: 'subscriptions_and_memberships' },
    { value: 'software_subscriptions', name: 'Software Subscriptions', iconName: 'Briefcase', color: 'hsl(var(--indigo-800))', emoji: '💻', parentValue: 'subscriptions_and_memberships' },

    // Miscellaneous (no parent - standalone)
    { value: 'unexpected_expenses', name: 'Unexpected Expenses', iconName: 'CircleSlash', color: 'hsl(var(--sky-800))', emoji: '⚠️', parentValue: null },
    { value: 'other', name: 'Other', iconName: 'FileQuestion', color: 'hsl(var(--neutral-200))', emoji: '💰', parentValue: null },
];

// Combined list of all default categories
export const ALL_DEFAULT_CATEGORY_SEEDS: CategorySeedData[] = [
    ...SPECIAL_CATEGORY_SEEDS,
    ...SUPER_CATEGORY_SEEDS,
    ...SUB_CATEGORY_SEEDS,
];

// Categories that should be excluded from cash flow calculations
export const EXCLUDED_FROM_CASHFLOW_CATEGORIES = [
    'self_transfer',
    'credit_card_payment',
    'stocks',
    'mutual_funds',
    'bonds',
    'cryptocurrency',
    'real_estate_investments',
];

// Legacy category mapping for migration
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
    'credit_card_payment': 'credit_card_payment',
    'dining': 'restaurants',
    'entertainment': 'movies',
    'gift': 'gifts',
    'groceries': 'groceries',
    'gym': 'gym_memberships',
    'health': 'untagged',
    'internet': 'internet',
    'investment': 'untagged',
    'emi': 'loan_payments',
    'netflix': 'streaming_services',
    'other': 'other',
    'pets': 'pet_care',
    'phone': 'mobile_phone',
    'rent': 'rent',
    'self_transfer': 'self_transfer',
    'shopping': 'untagged',
    'streaming': 'streaming_services',
    'swiggy': 'food_delivery',
    'travel': 'untagged',
    'untagged': 'untagged',
    'utilities': 'untagged',
    'transport': 'untagged',
    'work': 'untagged',
};
