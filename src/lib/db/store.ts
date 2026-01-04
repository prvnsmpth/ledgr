import { MessageType, type Filters, type Message } from '$lib/types'
import { derived, writable } from 'svelte/store'
import {
    AccountType,
    StoreError,
    SupportedBank,
    LedgrDB,
    type Account,
    type CashFlow,
    type GroupedTransactions,
    type Transaction,
    type CashFlowStats,
    type LedgrMetadata,
    type ExpenseCategory
} from '.'
import { getMonth } from '$lib/utils'
import type { LedgrData } from '$lib/server/types'
import type { TransactionGroup } from '$lib/smart-grouping'

export const accounts = writable<Account[]>([])
export const cashFlowStats = writable<CashFlowStats | null>(null)
export const categories = writable<ExpenseCategory[]>([])

// Derived stores for efficient category lookups
export const categoryByValue = derived(categories, ($categories) => {
    const map = new Map<string, ExpenseCategory>()
    for (const cat of $categories) {
        map.set(cat.value, cat)
    }
    return map
})

export const categoriesByParent = derived(categories, ($categories) => {
    const map = new Map<string | null, ExpenseCategory[]>()
    for (const cat of $categories) {
        const parentKey = cat.parentId?.toString() || null
        if (!map.has(parentKey)) {
            map.set(parentKey, [])
        }
        map.get(parentKey)!.push(cat)
    }
    return map
})

// Helper to get display name for a category value
export function getCategoryDisplayName(value: string, categoryMap: Map<string, ExpenseCategory>): string {
    return categoryMap.get(value)?.name || value.replaceAll('_', ' ')
}

// Holds transactions currently displayed on the transactions page
export const transactions = writable<Transaction[]>([])
export const monthlyTransactions = derived(transactions, ($transactions) =>
    groupTransactionsByMonth($transactions)
)
export const transactionsCashFlow = writable<CashFlow>({
    count: 0,
    incomingCount: 0,
    incoming: 0,
    outgoingCount: 0,
    outgoing: 0
})

function groupTransactionsByMonth(txns: Transaction[]): GroupedTransactions[] {
    const groups: GroupedTransactions[] = []
    for (const txn of txns) {
        const month = `${getMonth(txn.date)} ${txn.date.getFullYear()}`
        if (groups.length === 0) {
            groups.push({ groupKey: month, transactions: [txn] })
        } else {
            const lastGroup = groups[groups.length - 1]
            const lastMonth = lastGroup.groupKey
            if (lastMonth === month) {
                lastGroup.transactions.push(txn)
            } else {
                groups.push({ groupKey: month, transactions: [txn] })
            }
        }
    }
    return groups
}

export class Store {
    private db: LedgrDB
    private worker: Worker

    constructor() {
        this.db = new LedgrDB()
        this.worker = new Worker(new URL('./db.worker.ts', import.meta.url), { type: 'module' })
    }

    // Send a message to the worker
    private async dispatchToWorker(msg: Message): Promise<any> {
        return new Promise((resolve, reject) => {
            const messageId = Date.now() + Math.random() // Unique identifier for the message
            msg.id = messageId // Assuming Message type has an optional id field

            const handleMessage = (e: MessageEvent) => {
                if (e.data.id === messageId) {
                    this.worker.removeEventListener('message', handleMessage)
                    this.worker.removeEventListener('error', handleError)
                    resolve(e.data.payload)
                }
            }

            const handleError = (e: ErrorEvent) => {
                console.log('Worker error', e)
                this.worker.removeEventListener('message', handleMessage)
                this.worker.removeEventListener('error', handleError)
                reject(new Error(`Worker error: ${e.message}`))
            }

            this.worker.addEventListener('message', handleMessage)
            this.worker.addEventListener('error', handleError)

            this.worker.postMessage(msg)
        })
    }

    async init(): Promise<void> {
        console.log('initing store..')
        await this.db.init()
        console.log('DB initialized')

        // Seed default categories if the store is empty
        await this.db.seedDefaultCategoriesIfEmpty()
        console.log('Categories seeded')

        await this.dispatchToWorker({ type: MessageType.Init })
        console.log('Worker initialized')

        const currentHostname = window.location.host
        const isDemo = currentHostname.startsWith('demo.')
        if (isDemo) {
            await this.loadDemoData()
        }
        accounts.set(await this.db.getAllAccounts())

        // Load cached stats, but recompute if missing yearlyCashFlow (added in later version)
        const cachedStats = await this.db.getCashFlowStats()
        if (cachedStats && !cachedStats.yearlyCashFlow) {
            // Stats are outdated, recompute
            const freshStats = await this.dispatchToWorker({ type: MessageType.ComputeTransactionStats })
            cashFlowStats.set(freshStats)
        } else {
            cashFlowStats.set(cachedStats)
        }

        const allCategories = await this.db.getAllCategories()
        categories.set(allCategories)
        storeInitialized.set(true)
    }

    private async loadDemoData() {
        const isStoreEmpty = await store.isEmpty()
        if (isStoreEmpty) {
            const demoData = await import('../../demo.json')
            const transactions = demoData.transactions.map((txn: any) => ({
                ...txn,
                date: new Date(txn.date)
            }))
            const accounts = demoData.accounts.map((account: any) => ({
                ...account,
                bank: account.bank as SupportedBank,
            }))
            const version = Date.now()
            await store.import({ version, transactions, accounts })
        }
    }

    async close() {
        await this.db.close()
    }

    async isEmpty(): Promise<boolean> {
        const accounts = await this.db.getAllAccounts()
        console.log(`Accounts:`, accounts)
        return accounts.length === 0
    }

    async createAccount(account: Account): Promise<IDBValidKey> {
        try {
            const accountId = await this.db.createAccount(account)
            await this.bumpVersion()
            const accountWithId = { ...account, id: accountId }
            accounts.update((a) => [...a, accountWithId])
            return accountId
        } catch (e: unknown) {
            if (e instanceof DOMException) {
                console.log('Error creating account', e)
                console.log('Error code', e.name)
                throw new StoreError(e.message)
            }
            throw e
        }
    }

    async deleteAllData() {
        await this.dispatchToWorker({ type: MessageType.Close })
        await this.db.close()
        try {
            await this.db.deleteDB()
        } catch (e) {
            console.log('Error deleting DB', e)
        }
        await this.init()
    }

    async getTransactions(filters?: Filters) {
        const res = await this.dispatchToWorker({
            type: MessageType.GetTransactions,
            payload: { filters }
        })
        transactions.set(res.transactions)
        transactionsCashFlow.set(res.cashFlow)
    }

    async export(): Promise<LedgrData> {
        const { transactions } = await this.dispatchToWorker({
            type: MessageType.GetTransactions,
            payload: { limit: -1 }
        })
        const accounts = await this.dispatchToWorker({ type: MessageType.GetAllAccounts })
        const allCategories = await this.db.getAllCategories()
        const version = await this.getVersion()
        return { version, transactions, accounts, categories: allCategories }
    }

    // Import transactions and accounts from a JSON object created by the export method
    async import(data: LedgrData) {
        const transactions = data.transactions.map((txn: any) => ({
            ...txn,
            date: new Date(txn.date)
        }))
        const accounts = data.accounts.map((account: any) => ({
            ...account,
            bank: account.bank as SupportedBank,
        }))
        await this.dispatchToWorker({ type: MessageType.LoadTransactions, payload: transactions })
        await this.dispatchToWorker({ type: MessageType.LoadAccounts, payload: accounts })

        // Import categories if present in the data
        if (data.categories && data.categories.length > 0) {
            await this.dispatchToWorker({ type: MessageType.LoadCategories, payload: data.categories })
            categories.set(data.categories)
        }

        await this.dispatchToWorker({ type: MessageType.ComputeTransactionStats })
        await this.setVersion(data.version)
    }

    async fetchMoreTransactions(offset: number, limit: number = 50, filters?: Filters) {
        const res = await this.dispatchToWorker({
            type: MessageType.fetchMoreTransactions,
            payload: { filters, offset, limit }
        })
        transactions.update((txns) => [...txns, ...res.transactions])
        return res.transactions.length
    }

    async importFiles(
        files: FileList,
        accountId: IDBValidKey,
        bank: SupportedBank,
        accountType: AccountType
    ) {
        const res = await this.dispatchToWorker({
            type: MessageType.ImportFiles,
            payload: { files, accountId, bank, accountType }
        })
        await this.bumpVersion()
        this.dispatchToWorker({ type: MessageType.ComputeTransactionStats }).then((res) => {
            console.log('Transaction stats', res)
            cashFlowStats.set(res)
        })
        return res.fileResults
    }

    async addTransactions(txns: Transaction[]): Promise<IDBValidKey[]> {
        const txnIds = await this.db.saveTransactions(txns)
        await this.bumpVersion()
        transactions.update((t) => {
            const existingTxnIds = new Set(t.map((txn) => txn.id))
            const newTxns = [...t]
            txns.forEach((txn) => {
                if (!existingTxnIds.has(txn.id)) {
                    newTxns.push(txn)
                }
            })
            newTxns.sort((a, b) => b.date.getTime() - a.date.getTime())
            return newTxns
        })
        this.dispatchToWorker({ type: MessageType.ComputeTransactionStats }).then((res) => {
            cashFlowStats.set(res)
        })
        return txnIds
    }

    async updateTransaction(txnId: IDBValidKey, updates: Partial<Transaction>) {
        const existing = await this.db.getTransactionById(txnId)
        if (!existing) {
            throw new Error(`Transaction with id ${txnId} not found`)
        }
        await this.db.updateTransaction(txnId, updates)
        await this.bumpVersion()
        transactions.update((txns) =>
            txns.map((t) => (t.id === txnId ? { ...existing, ...updates } : t))
        )
        this.dispatchToWorker({ type: MessageType.ComputeTransactionStats }).then((res) => {
            console.log('Transaction stats', res)
            cashFlowStats.set(res)
        })
    }

    async tagSingleTransaction(txnId: IDBValidKey, expenseCategory: string) {
        await this.db.tagTransaction(txnId, expenseCategory)
        await this.bumpVersion()
        transactions.update((txns) =>
            txns.map((t) => (t.id === txnId ? { ...t, expenseCategory } : t))
        )
        this.dispatchToWorker({ type: MessageType.ComputeTransactionStats }).then((res) => {
            console.log('Transaction stats', res)
            cashFlowStats.set(res)
        })
    }

    async tagAllTransactions(filters: Filters, expenseCategory: string, transactionIds?: IDBValidKey[]) {
        console.log('Tagging transactions', filters, expenseCategory, transactionIds)
        const txnIds = new Set(
            await this.dispatchToWorker({
                type: MessageType.TagTransactions,
                payload: { filters, expenseCategory, transactionIds }
            })
        )
        await this.bumpVersion()
        transactions.update((txns) =>
            txns.map((t) => (txnIds.has(t.id) ? { ...t, expenseCategory } : t))
        )
        this.dispatchToWorker({ type: MessageType.ComputeTransactionStats }).then((res) => {
            console.log('Transaction stats', res)
            cashFlowStats.set(res)
        })
    }

    async getUntaggedGroups(limit?: number): Promise<TransactionGroup[]> {
        return await this.dispatchToWorker({
            type: MessageType.GetUntaggedGroups,
            payload: { limit }
        })
    }

    async deleteTransaction(txnId: IDBValidKey) {
        await this.db.deleteTransaction(txnId)
        await this.bumpVersion()
        transactions.update((txns) => txns.filter((t) => t.id !== txnId))
        this.dispatchToWorker({ type: MessageType.ComputeTransactionStats }).then((res) => {
            cashFlowStats.set(res)
        })
    }

    async getTransaction(txnId: IDBValidKey): Promise<Transaction | null> {
        return await this.db.getTransactionById(txnId)
    }

    async getAccount(accountId: IDBValidKey): Promise<Account | null> {
        return await this.db.getAccountById(accountId)
    }

    async getMetadata(): Promise<LedgrMetadata> {
        return await this.db.getMetadata()
    }

    // Category management methods
    async getAllCategories(): Promise<ExpenseCategory[]> {
        const allCategories = await this.db.getAllCategories()
        categories.set(allCategories)
        return allCategories
    }

    async getCategoryById(id: IDBValidKey): Promise<ExpenseCategory | null> {
        return await this.db.getCategoryById(id)
    }

    async addCategory(category: Omit<ExpenseCategory, 'id'>): Promise<IDBValidKey> {
        try {
            const categoryId = await this.db.addCategory(category)
            await this.bumpVersion()
            const categoryWithId = { ...category, id: categoryId }
            categories.update((cats) => [...cats, categoryWithId])
            return categoryId
        } catch (e: unknown) {
            console.error('Error adding category', e)
            throw e
        }
    }

    async updateCategory(id: IDBValidKey, updates: Partial<ExpenseCategory>): Promise<IDBValidKey> {
        try {
            const categoryId = await this.db.updateCategory(id, updates)
            await this.bumpVersion()
            categories.update((cats) =>
                cats.map((c) => (c.id === id ? { ...c, ...updates } : c))
            )
            return categoryId
        } catch (e: unknown) {
            console.error('Error updating category', e)
            throw e
        }
    }

    async deleteCategory(id: IDBValidKey): Promise<void> {
        try {
            await this.db.deleteCategory(id)
            await this.bumpVersion()
            categories.update((cats) => cats.filter((c) => c.id !== id))
        } catch (e: unknown) {
            console.error('Error deleting category', e)
            throw e
        }
    }

    /**
     * Deletes a category and resets all transactions with that category to 'untagged'.
     * Returns the number of transactions that were reset.
     */
    async deleteCategoryWithReset(id: IDBValidKey): Promise<number> {
        try {
            // Get category value before deletion
            const category = await this.db.getCategoryById(id)
            if (!category) {
                return 0
            }
            const categoryValue = category.value

            const resetCount = await this.db.deleteCategoryWithTransactionReset(id)
            await this.bumpVersion()
            categories.update((cats) => cats.filter((c) => c.id !== id))

            // Update local transaction store - any that had this category now have 'untagged'
            transactions.update((txns) =>
                txns.map((t) =>
                    t.expenseCategory === categoryValue
                        ? { ...t, expenseCategory: 'untagged' }
                        : t
                )
            )

            // Recompute stats
            this.dispatchToWorker({ type: MessageType.ComputeTransactionStats }).then((res) => {
                cashFlowStats.set(res)
            })
            return resetCount
        } catch (e: unknown) {
            console.error('Error deleting category with reset', e)
            throw e
        }
    }

    async setLastSync(lastSync: number) {
        const metadata = await this.db.getMetadata()
        await this.db.setMetadata({ ...metadata, lastSync })
    }

    async getVersion(): Promise<number> {
        const metadata = await this.db.getMetadata()
        return metadata.version
    }

    async setVersion(version: number) {
        const metadata = await this.db.getMetadata()
        await this.db.setMetadata({ ...metadata, version })
    }

    async bumpVersion() {
        await this.setVersion(Date.now())
    }
}

export const store = new Store()
export const storeInitialized = writable(false);
(async () => {
    await store.init()
})()

// @ts-ignore
// window.export = async () => {
//     const data = await store.export()
//     console.log(`data:`, data)
// }