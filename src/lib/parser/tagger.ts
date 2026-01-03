export class ExpenseCategoryTagger {

    // TODO: Make this configurable (potentially load patterns from database)
    private PATTERNS: Record<string, RegExp> = {
        'streaming_services': /netflix/i,
        'food_delivery': /swiggy/i,
        'rent': /rent/i,
    }

    categorize(desc: string): string {
        for (const [category, pattern] of Object.entries(this.PATTERNS)) {
            if (pattern.test(desc)) {
                return category
            }
        }
        return 'untagged'
    }
}