import { ExpenseCategory } from "$lib/db";

export class ExpenseCategoryTagger {

    private PATTERNS = {
        [ExpenseCategory.Netflix]: /netflix/i,
        [ExpenseCategory.Swiggy]: /swiggy/i,
        [ExpenseCategory.Rent]: /rent/i,
    }

    categorize(desc: string): ExpenseCategory {
        for (const [category, pattern] of Object.entries(this.PATTERNS)) {
            if (pattern.test(desc)) {
                return category as ExpenseCategory
            }
        }
        return ExpenseCategory.Untagged
    }
}