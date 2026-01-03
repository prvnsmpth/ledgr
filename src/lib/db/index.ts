import type { Filters } from "$lib/types"
import {
    ALL_DEFAULT_CATEGORY_SEEDS,
    LEGACY_CATEGORY_MAP,
    type CategorySeedData
} from "./category-seed-data"

export enum TransactionType {
    Debit = 'debit',
    Credit = 'credit'
}

export enum AccountType {
    Bank = 'bank',
    CreditCard = 'credit_card'
}

export enum SupportedBank {
    HDFC = 'hdfc',
    ICICI = 'icici',
    SBI = 'sbi'
}

export type Account = {
    id?: IDBValidKey
    name?: string
    bank: SupportedBank
    type: AccountType
}

export type Transaction = {
    id: IDBValidKey
    date: Date
    amount: number
    description: string
    txnType: TransactionType
    accountId: IDBValidKey
    expenseCategory?: string
    excludeFromCashFlow?: boolean
}

// Input to hash function that generates a unique id for a transaction
export type TransactionKey = {
    date: Date
    amount: number
    description: string
    txnType: TransactionType
}

export type CashFlow = {
    count: number
    incomingCount: number
    incoming: number
    outgoingCount: number
    outgoing: number
}

export type CashFlowStats = {
    monthlyCashFlow: GroupedCashFlow[]
    categoryCashFlow: GroupedCashFlow[],
    aggCashFlow: AggregatedCashFlow[]
}

export type GroupedCashFlow = {
    groupKey: string
    cashFlow: CashFlow
}

export type AggregatedCashFlow = {
    aggKey: [string, string], // [month, category]
    cashFlow: CashFlow
}

export type GroupedTransactions = {
    groupKey: string
    transactions: Transaction[]
}

// (User-defined + default) categories
export type ExpenseCategory = {
    id?: IDBValidKey
    name: string
    value: string
    icon?: string
    color?: string
    emoji?: string
    isDefault: boolean
    isEnabled: boolean
    parentId?: IDBValidKey | null
}

export type LedgrMetadata = {
    version: number
    lastSync: number
}

export class LedgrDB {
    private readonly DB_NAME = 'transaction_db'

    // Stores transaction data
    private readonly TXN_STORE = 'transactions'
    private readonly TXN_UNIQ_INDEX = 'txn_index'
    private readonly TXN_ACCNT_INDX = 'txn_account_index'
    private readonly TXN_DATE_INDEX = 'txn_date_index'

    // Stores account data (an account represents a source of transaction data - could be a bank account, credit card, etc.)
    private readonly ACCOUNT_STORE = 'accounts'
    private readonly ACCOUNT_UNIQ_INDEX = 'account_index'
    private readonly ACCOUNT_NAME_INDEX = 'account_name_index'

    private readonly METADATA_STORE = 'metadata'

    private readonly TXN_STATS_STORE = 'txn_stats'

    // Stores expense categories, allowing the user to add/remove categories
    private readonly EXPENSE_CATEGORY_STORE = 'expense_categories'
    private readonly EXPENSE_CATEGORY_VAL_IDX = 'expense_category_value_idx'

    private db: IDBDatabase | undefined

    constructor() {}

    private async openDB(): Promise<IDBDatabase> {
        const req = indexedDB.open(this.DB_NAME, 4)
        return new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
            req.onupgradeneeded = (event) => {
                console.log('Upgrading database...')
                const db = req.result
                const oldVersion = event.oldVersion
                console.log('Old version:', oldVersion)

                if (oldVersion < 1) {
                    // Initial database setup
                    if (!db.objectStoreNames.contains(this.TXN_STORE)) {
                        const store = db.createObjectStore(this.TXN_STORE, { keyPath: 'id' })
                        store.createIndex(this.TXN_UNIQ_INDEX, 'id', { unique: true })
                        store.createIndex(this.TXN_ACCNT_INDX, 'accountId', { unique: false })
                        store.createIndex(this.TXN_DATE_INDEX, 'date', { unique: false })
                    }

                    if (!db.objectStoreNames.contains(this.ACCOUNT_STORE)) {
                        const accountStore = db.createObjectStore(this.ACCOUNT_STORE, {
                            keyPath: 'id',
                            autoIncrement: true
                        })
                        accountStore.createIndex(this.ACCOUNT_UNIQ_INDEX, 'id', { unique: true })
                        accountStore.createIndex(this.ACCOUNT_NAME_INDEX, 'name', { unique: true })
                    }

                    if (!db.objectStoreNames.contains(this.TXN_STATS_STORE)) {
                        db.createObjectStore(this.TXN_STATS_STORE, { autoIncrement: true })
                    }

                    if (!db.objectStoreNames.contains(this.METADATA_STORE)) {
                        db.createObjectStore(this.METADATA_STORE, { autoIncrement: true })
                    }
                }

                if (oldVersion < 2) {
                    // Version 2 added the expense category store
                    if (!db.objectStoreNames.contains(this.EXPENSE_CATEGORY_STORE)) {
                        db.createObjectStore(this.EXPENSE_CATEGORY_STORE, { autoIncrement: true })
                    }
                }

                if (oldVersion < 3) {
                    // Version 3 updates the expense category store to use keyPath
                    if (db.objectStoreNames.contains(this.EXPENSE_CATEGORY_STORE)) {
                        db.deleteObjectStore(this.EXPENSE_CATEGORY_STORE)
                    }

                    const categoryStore = db.createObjectStore(this.EXPENSE_CATEGORY_STORE, {
                        keyPath: 'id',
                    })
                    categoryStore.createIndex(this.EXPENSE_CATEGORY_VAL_IDX, 'value', { unique: true })

                    // Initialize with default categories from seed data
                    const transaction = req.transaction;
                    if (transaction) {
                        const store = transaction.objectStore(this.EXPENSE_CATEGORY_STORE)

                        // Add all categories from seed data
                        for (const seed of ALL_DEFAULT_CATEGORY_SEEDS) {
                            const category: ExpenseCategory = {
                                id: seed.value,
                                name: seed.name,
                                value: seed.value,
                                icon: seed.iconName,
                                color: seed.color,
                                emoji: seed.emoji,
                                isDefault: true,
                                isEnabled: true,
                                parentId: seed.parentValue
                            }

                            console.log('Adding category:', category)
                            store.add(category)
                        }

                        // Migrate legacy category values in transactions
                        const transactionStore = transaction.objectStore(this.TXN_STORE)
                        const idbReq = transactionStore.getAll()
                        idbReq.onsuccess = () => {
                            const transactions = idbReq.result

                            // Iterate over transactions, update the store if the category is set
                            for (const txn of transactions) {
                                if (txn.expenseCategory) {
                                    const newCategory = LEGACY_CATEGORY_MAP[txn.expenseCategory]
                                    if (newCategory && newCategory !== txn.expenseCategory) {
                                        console.log('Migrating transaction category:', txn.expenseCategory, '->', newCategory)
                                        txn.expenseCategory = newCategory
                                        transactionStore.put(txn)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    }

    async deleteDB(): Promise<void> {
        await this.close()
        console.log(`Returning promise to delete db ${this.DB_NAME}`)
        return new Promise((resolve, reject) => {
            console.log(`Making request to delete db ${this.DB_NAME}`)
            const req = indexedDB.deleteDatabase(this.DB_NAME)
            req.onsuccess = () => {
                console.log('Successfully deleted db')
                resolve()
            }
            req.onerror = () => {
                console.log('Error deleting db', req.error)
                reject(req.error)
            }
            req.onblocked = () => {
                console.log('Blocked from deleting db')
                reject('Blocked from deleting db')
            }
            req.onupgradeneeded = () => {
                console.log('Upgrade needed to delete db')
            }
        })
    }

    isInitialized(): boolean {
        return !!this.db
    }

    async init() {
        try {
            this.db = await this.openDB()
        } catch (e) {
            console.error('Error opening db', e)
        }
    }

    async close() {
        console.log(`db.close() called`)
        if (this.db) {
            console.log(`Closing db ${this.DB_NAME}`)
            this.db.close()
            console.log(`Closed db ${this.DB_NAME}`)
            this.db = undefined
        }
    }

    private async getStore(storeName: string): Promise<IDBObjectStore> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('DB not initialized')
                return
            }
            const txn = this.db.transaction(storeName, 'readwrite')
            resolve(txn.objectStore(storeName))
        })
    }

    async saveTransactions(txns: Transaction[]): Promise<IDBValidKey[]> {
        const store = await this.getStore(this.TXN_STORE)

        return Promise.all(
            txns.map((txn) => {
                return new Promise<IDBValidKey>((resolve, reject) => {
                    const req = store.add(txn)
                    req.onsuccess = () => resolve(req.result)
                    req.onerror = () => {
                        console.log('Error saving txn:', req.error, txn)
                        reject(req.error)
                    }
                })
            })
        )
    }

    async saveCashFlowStats(stats: CashFlowStats): Promise<void> {
        const store = await this.getStore(this.TXN_STATS_STORE)
        return new Promise((resolve, reject) => {
            const req = store.put(stats, 1)
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    }

    async getCashFlowStats(): Promise<CashFlowStats | null> {
        const store = await this.getStore(this.TXN_STATS_STORE)
        return new Promise((resolve, reject) => {
            const req = store.get(1)
            req.onsuccess = () => resolve(req.result || null)
            req.onerror = () => reject(req.error)
        })
    }

    async getMetadata(): Promise<LedgrMetadata> {
        const store = await this.getStore(this.METADATA_STORE)
        return new Promise((resolve, reject) => {
            const req = store.get(1)
            req.onsuccess = () => resolve(req.result || { version: 0, lastSync: 0 })
            req.onerror = () => reject(req.error)
        })
    }

    async setMetadata(metadata: LedgrMetadata): Promise<void> {
        const store = await this.getStore(this.METADATA_STORE)
        return new Promise((resolve, reject) => {
            const req = store.put(metadata, 1)
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    }

    async getAllTransactions(): Promise<Transaction[]> {
        return await this.getTransactions({ 
            searchFilter: null, 
            dateFilter: null, 
            categoryFilter: [], 
            typeFilter: null 
        }, 0, -1)
    }

    private filtersMatch(txn: Transaction, filters?: Filters): boolean {
        const searchFilter = filters?.searchFilter
        const dateFilter = filters?.dateFilter
        const categoryFilter = filters?.categoryFilter || []
        const typeFilter = filters?.typeFilter

        if (!searchFilter && !dateFilter && !categoryFilter) {
            return true
        }

        let m = true
        if (searchFilter) {
            m = m && txn.description.toLowerCase().includes(searchFilter.toLowerCase())
        }
        if (dateFilter) {
            m = m && txn.date >= dateFilter.start && txn.date <= dateFilter.end
        }
        if (typeFilter) {
            m = m && txn.txnType === typeFilter
        }
        if (categoryFilter.length > 0) {
            m = m && categoryFilter.includes(txn.expenseCategory || 'untagged')
        }
        return m
    }

    async getCashFlow(filters: Filters): Promise<CashFlow> {
        const store = await this.getStore(this.TXN_STORE)
        const index = store.index(this.TXN_DATE_INDEX)
        const cashFlow: CashFlow = {
            count: 0,
            incomingCount: 0,
            incoming: 0,
            outgoingCount: 0,
            outgoing: 0,
        }
        return new Promise((resolve, reject) => {
            const req = index.openCursor(null, 'prev')
            req.onsuccess = (evt) => {
                const cursor = (evt.target as IDBRequest).result
                if (cursor) {
                    if (this.filtersMatch(cursor.value, filters)) {
                        cashFlow.count++
                        if (cursor.value.txnType === TransactionType.Credit) {
                            cashFlow.incomingCount++
                            cashFlow.incoming += cursor.value.amount
                        } else {
                            cashFlow.outgoingCount++
                            cashFlow.outgoing += cursor.value.amount
                        }
                    }
                    cursor.continue()
                } else {
                    resolve(cashFlow)
                }
            }
            req.onerror = () => reject(req.error)
        })
    }

    async getTransactions(
        filters?: Filters,
        offset: number = 0,
        limit: number = 50
    ): Promise<Transaction[]> {
        const store = await this.getStore(this.TXN_STORE)
        const index = store.index(this.TXN_DATE_INDEX)
        return new Promise((resolve, reject) => {
            const req = index.openCursor(null, 'prev')
            const txns: Transaction[] = []
            let remainingOffset = offset
            req.onsuccess = (evt) => {
                const cursor = (evt.target as IDBRequest).result
                if (cursor) {
                    const match = this.filtersMatch(cursor.value, filters)
                    if (match && (limit < 0 || txns.length < limit) && remainingOffset-- <= 0) {
                        txns.push(cursor.value)
                    }
                    cursor.continue()
                } else {
                    resolve(txns)
                }
            }
            req.onerror = () => reject(req.error)
        })
    }

    async getAllTransactionsByAccount(accountId: IDBValidKey): Promise<Transaction[]> {
        const store = await this.getStore(this.TXN_STORE)
        return new Promise((resolve, reject) => {
            const index = store.index(this.TXN_ACCNT_INDX)
            const req = index.getAll(accountId)
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async getTransactionById(id: IDBValidKey): Promise<Transaction | null> {
        const store = await this.getStore(this.TXN_STORE)
        const index = store.index(this.TXN_UNIQ_INDEX)
        return new Promise((resolve, reject) => {
            const req = index.get(id)
            req.onsuccess = () => resolve(req.result || null)
            req.onerror = () => reject(req.error)
        })
    }

    async updateTransaction(txnId: IDBValidKey, txn: Partial<Transaction>): Promise<IDBValidKey> {
        const existing = await this.getTransactionById(txnId)
        const store = await this.getStore(this.TXN_STORE)
        return new Promise((resolve, reject) => {
            const updated = { ...existing, ...txn }
            console.log('Updating txn:', updated)
            const req = store.put(updated)
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async getExpenseCategoryById(id: IDBValidKey): Promise<ExpenseCategory | null> {
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)
        return new Promise((resolve, reject) => {
            const req = store.get(id)
            req.onsuccess = () => resolve(req.result || null)
            req.onerror = () => reject(req.error)
        })
    }

    async createExpenseCategory(category: ExpenseCategory): Promise<IDBValidKey> {
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)
        return new Promise((resolve, reject) => {
            const req = store.add(category)
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async tagTransaction(
        txnId: IDBValidKey,
        expenseCategory: string
    ): Promise<IDBValidKey> {
        const category = await this.getExpenseCategoryById(expenseCategory)
        if (!category) {
            throw new Error(`Expense category with id ${expenseCategory} not found`)
        }
        return this.updateTransaction(txnId, { expenseCategory })
    }

    async tagAllTransactions(
        filters: Filters,
        expenseCategory: string
    ): Promise<IDBValidKey[]> {
        const exists = await this.getExpenseCategoryById(expenseCategory)
        if (!exists) {
            throw new Error(`Expense category with id ${expenseCategory} not found`)
        }

        const store = await this.getStore(this.TXN_STORE)
        const index = store.index(this.TXN_DATE_INDEX)
        return new Promise((resolve, reject) => {
            const req = index.openCursor(null, 'prev')
            const txnIds: IDBValidKey[] = []
            req.onsuccess = (evt) => {
                const cursor = (evt.target as IDBRequest).result
                if (cursor) {
                    if (this.filtersMatch(cursor.value, filters)) {
                        txnIds.push(cursor.value.id)
                        cursor.update({ ...cursor.value, expenseCategory })
                    }
                    cursor.continue()
                } else {
                    resolve(txnIds)
                }
            }
            req.onerror = () => reject(req.error)
        })
    }

    async deleteTransaction(txnId: IDBValidKey): Promise<void> {
        const store = await this.getStore(this.TXN_STORE)
        return new Promise((resolve, reject) => {
            const req = store.delete(txnId)
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    }

    async createAccount(account: Account): Promise<IDBValidKey> {
        const store = await this.getStore(this.ACCOUNT_STORE)
        return new Promise((resolve, reject) => {
            const req = store.add(account)
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async getAllAccounts(): Promise<Account[]> {
        const store = await this.getStore(this.ACCOUNT_STORE)
        return new Promise((resolve, reject) => {
            const req = store.getAll()
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async deleteAllAccounts() {
        const store = await this.getStore(this.ACCOUNT_STORE)
        return new Promise((resolve, reject) => {
            const req = store.clear()
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async deleteAllTransactions() {
        const store = await this.getStore(this.TXN_STORE)
        return new Promise((resolve, reject) => {
            const req = store.clear()
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async deleteStats() {
        const store = await this.getStore(this.TXN_STATS_STORE)
        return new Promise((resolve, reject) => {
            const req = store.clear()
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async getAccountById(id: IDBValidKey): Promise<Account | null> {
        const store = await this.getStore(this.ACCOUNT_STORE)
        return new Promise((resolve, reject) => {
            const req = store.get(id)
            req.onsuccess = () => resolve(req.result || null)
            req.onerror = () => reject(req.error)
        })
    }

    // Category management methods
    async getAllCategories(): Promise<ExpenseCategory[]> {
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)
        return new Promise((resolve, reject) => {
            const req = store.getAll()
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async getCategoryById(id: IDBValidKey): Promise<ExpenseCategory | null> {
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)
        return new Promise((resolve, reject) => {
            const req = store.get(id)
            req.onsuccess = () => resolve(req.result || null)
            req.onerror = () => reject(req.error)
        })
    }

    async addCategory(category: Omit<ExpenseCategory, 'id'>): Promise<IDBValidKey> {
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)
        return new Promise((resolve, reject) => {
            const req = store.add(category)
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async updateCategory(id: IDBValidKey, updates: Partial<ExpenseCategory>): Promise<IDBValidKey> {
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)
        const existing = await this.getCategoryById(id)
        if (!existing) {
            throw new Error(`Category with id ${id} not found`)
        }
        return new Promise((resolve, reject) => {
            const updated = { ...existing, ...updates }
            const req = store.put(updated)
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async deleteCategory(id: IDBValidKey): Promise<void> {
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)
        return new Promise((resolve, reject) => {
            const req = store.delete(id)
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    }

    /**
     * Seeds default categories if the category store is empty.
     * Called on app initialization to ensure default categories exist.
     */
    async seedDefaultCategoriesIfEmpty(): Promise<void> {
        const existingCategories = await this.getAllCategories()
        if (existingCategories.length > 0) {
            return
        }

        console.log('Seeding default categories...')
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)

        for (const seed of ALL_DEFAULT_CATEGORY_SEEDS) {
            const category: ExpenseCategory = {
                id: seed.value,
                name: seed.name,
                value: seed.value,
                icon: seed.iconName,
                color: seed.color,
                emoji: seed.emoji,
                isDefault: true,
                isEnabled: true,
                parentId: seed.parentValue
            }

            await new Promise<void>((resolve, reject) => {
                const req = store.add(category)
                req.onsuccess = () => resolve()
                req.onerror = () => {
                    console.error('Error adding category:', req.error)
                    reject(req.error)
                }
            })
        }

        console.log('Default categories seeded successfully')
    }

    /**
     * Clears all categories from the store.
     * Used during sync import to replace with synced categories.
     */
    async clearAllCategories(): Promise<void> {
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)
        return new Promise((resolve, reject) => {
            const req = store.clear()
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    }

    /**
     * Deletes a category and resets all transactions with that category to 'untagged'.
     * Returns the number of transactions that were reset.
     */
    async deleteCategoryWithTransactionReset(categoryId: IDBValidKey): Promise<number> {
        const category = await this.getCategoryById(categoryId)
        if (!category) {
            return 0
        }

        const categoryValue = category.value
        let resetCount = 0

        // Reset all transactions with this category to 'untagged'
        const txnStore = await this.getStore(this.TXN_STORE)
        await new Promise<void>((resolve, reject) => {
            const req = txnStore.openCursor()
            req.onsuccess = (evt) => {
                const cursor = (evt.target as IDBRequest).result
                if (cursor) {
                    if (cursor.value.expenseCategory === categoryValue) {
                        cursor.update({ ...cursor.value, expenseCategory: 'untagged' })
                        resetCount++
                    }
                    cursor.continue()
                } else {
                    resolve()
                }
            }
            req.onerror = () => reject(req.error)
        })

        // Delete the category
        await this.deleteCategory(categoryId)

        console.log(`Deleted category ${categoryValue}, reset ${resetCount} transactions to untagged`)
        return resetCount
    }

    /**
     * Gets a category by its value (the string identifier used in transactions).
     */
    async getCategoryByValue(value: string): Promise<ExpenseCategory | null> {
        const store = await this.getStore(this.EXPENSE_CATEGORY_STORE)
        const index = store.index(this.EXPENSE_CATEGORY_VAL_IDX)
        return new Promise((resolve, reject) => {
            const req = index.get(value)
            req.onsuccess = () => resolve(req.result || null)
            req.onerror = () => reject(req.error)
        })
    }
}

export class StoreError extends Error {
    constructor(message: string) {
        super(message)
        Object.setPrototypeOf(this, StoreError.prototype)
    }
}