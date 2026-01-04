import type { Transaction } from '$lib/db'

export type TransactionGroup = {
    signature: string
    displayPattern: string
    transactions: Transaction[]
    totalValue: number
    count: number
}

// Common financial terms and stop words to ignore when grouping
export const FINANCIAL_STOP_WORDS = new Set([
    // Payment methods and channels
    'upi', 'neft', 'imps', 'rtgs', 'ach', 'ecs', 'nach',
    // Common transaction terms
    'transfer', 'txn', 'ref', 'no', 'payment', 'paid', 'pay',
    'to', 'from', 'for', 'the', 'a', 'an', 'of', 'in', 'on', 'at', 'by',
    // Bank names
    'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes', 'pnb', 'bob', 'canara',
    'union', 'idbi', 'rbl', 'federal', 'indusind', 'bandhan', 'au', 'idfc',
    // Transaction metadata
    'debit', 'credit', 'card', 'account', 'ac', 'bank', 'ltd', 'pvt', 'private',
    'limited', 'india', 'inr', 'rs',
    // Date/time related
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    // Common filler words
    'via', 'through', 'using', 'with', 'and', 'or'
])

/**
 * Normalizes a transaction description by:
 * - Converting to lowercase
 * - Removing punctuation
 * - Removing long numbers (transaction IDs, reference numbers)
 * - Collapsing whitespace
 */
export function normalizeDescription(desc: string): string {
    return desc
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')  // Remove punctuation
        .replace(/\d{4,}/g, '')        // Remove long numbers (IDs, refs)
        .replace(/\s+/g, ' ')          // Collapse whitespace
        .trim()
}

/**
 * Extracts a signature from a description that can be used for grouping.
 * Returns sorted significant words (after removing stop words).
 */
export function getDescriptionSignature(desc: string): string {
    const normalized = normalizeDescription(desc)
    const words = normalized.split(' ')
    const significantWords = words.filter(w =>
        w.length > 2 && !FINANCIAL_STOP_WORDS.has(w)
    )
    // Sort for consistent grouping regardless of word order
    return significantWords.sort().join(' ')
}

/**
 * Generates a human-readable display pattern from a group of transactions.
 * Uses the shortest description as it's likely the most canonical form.
 */
function generateDisplayPattern(txns: Transaction[]): string {
    // Find the shortest description as the representative
    let shortest = txns[0].description
    for (const txn of txns) {
        if (txn.description.length < shortest.length) {
            shortest = txn.description
        }
    }
    // Truncate if too long
    const maxLen = 60
    if (shortest.length > maxLen) {
        return shortest.slice(0, maxLen) + '...'
    }
    return shortest
}

/**
 * Groups transactions by their description signature.
 * Returns groups sorted by total value (highest first).
 */
export function groupTransactionsBySignature(
    transactions: Transaction[],
    limit?: number
): TransactionGroup[] {
    // Group by signature
    const groups = new Map<string, Transaction[]>()

    for (const txn of transactions) {
        const sig = getDescriptionSignature(txn.description)
        if (!sig) continue // Skip empty signatures

        if (!groups.has(sig)) {
            groups.set(sig, [])
        }
        groups.get(sig)!.push(txn)
    }

    // Convert to TransactionGroup array
    const result: TransactionGroup[] = []
    for (const [signature, txns] of groups) {
        result.push({
            signature,
            displayPattern: generateDisplayPattern(txns),
            transactions: txns,
            totalValue: txns.reduce((sum, t) => sum + Math.abs(t.amount), 0),
            count: txns.length
        })
    }

    // Sort by total value descending
    result.sort((a, b) => b.totalValue - a.totalValue)

    // Apply limit if specified
    if (limit !== undefined && limit > 0) {
        return result.slice(0, limit)
    }

    return result
}

/**
 * Filters transactions to only untagged ones.
 */
export function filterUntaggedTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.filter(
        t => !t.expenseCategory || t.expenseCategory === 'untagged'
    )
}

/**
 * Gets grouped untagged transactions, sorted by total value.
 */
export function getUntaggedTransactionGroups(
    transactions: Transaction[],
    limit?: number
): TransactionGroup[] {
    const untagged = filterUntaggedTransactions(transactions)
    return groupTransactionsBySignature(untagged, limit)
}
