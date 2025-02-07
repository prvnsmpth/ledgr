import type { Account, AggregatedCashFlow, GroupedCashFlow } from '.'
import { parseStatement } from '../parser'
import { MessageType, type Message } from '../types'
import { getMonth } from '../utils'
import {
    AccountType,
    ExpenseCategory,
    SupportedBank,
    LedgrDB,
    TransactionType,
    type CashFlow,
    type CashFlowStats,
    type Transaction
} from './index'

const db = new LedgrDB()

// Categories to exclude from cash flow calculations
const excludedCategories = [
    ExpenseCategory.Investment,
    ExpenseCategory.SelfTransfer,
    ExpenseCategory.CreditCardPayment
]

function groupCashFlowByKey<K>(
    txns: Transaction[],
    keyFn: (txn: Transaction) => K,
    keyComp: (a: K, b: K) => number,
    keyFmt: (key: K) => any
): AggregatedCashFlow[] {
    const groups: Map<string, CashFlow> = new Map()
    for (const txn of txns) {
        if (txn.excludeFromCashFlow) {
            continue
        }

        if (txn.expenseCategory && excludedCategories.includes(txn.expenseCategory)) {
            continue
        }

        const groupKey = JSON.stringify(keyFn(txn))
        if (!groups.has(groupKey)) {
            groups.set(groupKey, {
                count: 0,
                incomingCount: 0,
                incoming: 0,
                outgoingCount: 0,
                outgoing: 0
            })
        }

        const incoming = txn.txnType === TransactionType.Credit ? txn.amount : 0
        const outgoing = txn.txnType === TransactionType.Debit ? txn.amount : 0

        const cashFlow = groups.get(groupKey)!
        cashFlow.count++
        cashFlow.incomingCount += incoming > 0 ? 1 : 0
        cashFlow.outgoingCount += outgoing > 0 ? 1 : 0
        cashFlow.incoming += incoming
        cashFlow.outgoing += outgoing
        groups.set(groupKey, cashFlow)
    }

    const keys = Array.from(groups.keys()).map((k) => JSON.parse(k) as K)
    keys.sort(keyComp)

    const aggCashFlow = []
    for (const key of keys) {
        const cashFlow = groups.get(JSON.stringify(key))!
        aggCashFlow.push({
            aggKey: keyFmt(key),
            cashFlow: cashFlow
        })
    }

    return aggCashFlow
}

function computeCashFlowByKey<K>(
    txns: Transaction[],
    keyFn: (txn: Transaction) => K,
    keyComp: (a: K, b: K) => number,
    keyFmt: (key: K) => string
): GroupedCashFlow[] {
    const groups: Map<K, CashFlow> = new Map()
    for (const txn of txns) {
        if (txn.excludeFromCashFlow) {
            continue
        }

        if (txn.expenseCategory && excludedCategories.includes(txn.expenseCategory)) {
            continue
        }

        const groupKey = keyFn(txn)
        if (!groups.has(groupKey)) {
            groups.set(groupKey, {
                count: 0,
                incomingCount: 0,
                incoming: 0,
                outgoingCount: 0,
                outgoing: 0
            })
        }

        const incoming = txn.txnType === TransactionType.Credit ? txn.amount : 0
        const outgoing = txn.txnType === TransactionType.Debit ? txn.amount : 0

        const cashFlow = groups.get(groupKey)!
        cashFlow.count++
        cashFlow.incomingCount += incoming > 0 ? 1 : 0
        cashFlow.outgoingCount += outgoing > 0 ? 1 : 0
        cashFlow.incoming += incoming
        cashFlow.outgoing += outgoing
        groups.set(groupKey, cashFlow)
    }

    const keys = Array.from(groups.keys())
    keys.sort(keyComp)

    const groupedCashFlow = []
    for (const key of keys) {
        const cashFlow = groups.get(key)!
        groupedCashFlow.push({
            groupKey: keyFmt(key),
            cashFlow: cashFlow
        })
    }

    return groupedCashFlow
}

function computeCashFlowByMonth(txns: Transaction[]): GroupedCashFlow[] {
    return computeCashFlowByKey(
        txns,
        (txn: Transaction) => {
            const year = txn.date.getFullYear()
            const month = txn.date.getMonth()
            const d = new Date(year, month, 1)
            return d.getTime()
        },
        (a: number, b: number) => b - a,
        (ts: number) => {
            const d = new Date(ts)
            return `${getMonth(d)} ${d.getFullYear()}`
        }
    )
}

function computeCashFlowByCategory(txns: Transaction[]): GroupedCashFlow[] {
    return computeCashFlowByKey(
        txns,
        (txn: Transaction) => txn.expenseCategory || ExpenseCategory.Untagged,
        (a: ExpenseCategory, b: ExpenseCategory) => a.localeCompare(b),
        (a: ExpenseCategory) => a
    )
}

function computeAggCashFlow(txns: Transaction[]): AggregatedCashFlow[] {
    return groupCashFlowByKey(
        txns,
        (txn: Transaction) => {
            const year = txn.date.getFullYear()
            const month = txn.date.getMonth()
            const monthTs = new Date(year, month, 1).getTime()
            const category = txn.expenseCategory || ExpenseCategory.Untagged
            return [monthTs, category] as [number, ExpenseCategory]
        },
        ([aTs, aCat], [bTs, bCat]) => {
            if (aTs !== bTs) {
                return bTs - aTs
            }
            return aCat.localeCompare(bCat)
        },
        ([ts, cat]: [number, ExpenseCategory]) => {
            const d = new Date(ts)
            const monthStr = `${getMonth(d)} ${d.getFullYear()}`
            return [monthStr, cat] as [string, string]
        }
    )
}

function computeTransactionStats(txns: Transaction[]): CashFlowStats {
    return {
        monthlyCashFlow: computeCashFlowByMonth(txns),
        categoryCashFlow: computeCashFlowByCategory(txns),
        aggCashFlow: computeAggCashFlow(txns)
    }
}

export type ImportRequest = {
    files: File[]
    accountId: IDBValidKey
    bank: SupportedBank
    accountType: AccountType
}

type FileResult = {
    file: File
    numTransactions: number
    success: boolean
    error?: any
}

async function handleMessage(message: Message) {
    const id = message.id!
    const type = message.type
    switch (type) {
        case MessageType.Init:
            db.init().then(() => {
                self.postMessage({ id, type })
            })
            break
        case MessageType.Close:
            db.close().then(() => {
                self.postMessage({ id, type })
            })
            break
        case MessageType.ImportFiles: {
            const { files, accountId, bank, accountType } = message.payload as ImportRequest
            let fileResults: FileResult[] = []
            for (const file of files) {
                let txns: Transaction[]
                try {
                    txns = await parseStatement(file, accountId, bank, accountType)
                } catch (e) {
                    fileResults.push({ file, numTransactions: 0, success: false, error: e })
                    continue
                }

                let txnIds
                try {
                    txnIds = await db.saveTransactions(txns)
                    fileResults.push({ file, numTransactions: txns.length, success: true })
                } catch (e) {
                    fileResults.push({
                        file,
                        numTransactions: txns.length,
                        success: false,
                        error: e
                    })
                }
            }
            console.log(`[WORKER] Imported files. Responding with:`, fileResults)
            self.postMessage({ id, type, payload: { fileResults } })
            break
        }
        case MessageType.GetTransactions: {
            const { filters, offset, limit } = message.payload
            const transactions = await db.getTransactions(filters, offset, limit)
            const cashFlow = await db.getCashFlow(filters)
            self.postMessage({
                id,
                type,
                payload: {
                    transactions,
                    cashFlow
                }
            })
            break
        }
        case MessageType.LoadTransactions: {
            const transactions = message.payload as Transaction[]
            console.log(`LoadTransactions:`, transactions.length)
            await db.saveTransactions(transactions)
            self.postMessage({ id, type })
            break
        }
        case MessageType.fetchMoreTransactions: {
            const { filters, offset, limit } = message.payload
            const transactions = await db.getTransactions(filters, offset, limit)
            self.postMessage({
                id,
                type,
                payload: {
                    transactions
                }
            })
            break
        }
        case MessageType.GetAllAccounts:
            db.getAllAccounts().then((res) => {
                self.postMessage({ id, type, payload: res })
            })
            break
        case MessageType.LoadAccounts: {
            const accounts = message.payload as Account[]
            console.log(`LoadAccounts:`, accounts)
            for (const account of accounts) {
                await db.createAccount(account)
            }
            self.postMessage({ id, type })
            break
        }
        case MessageType.GetTransactionStats:
            db.getCashFlowStats().then((res) => {
                self.postMessage({ id, type, payload: res })
            })
            break
        case MessageType.ComputeTransactionStats: {
            const txns = await db.getAllTransactions()
            const stats = computeTransactionStats(txns)
            await db.saveCashFlowStats(stats)
            self.postMessage({ id, type, payload: stats })
            break
        }
        case MessageType.TagTransactions: {
            const { filters, expenseCategory } = message.payload
            const txnIds = await db.tagAllTransactions(filters, expenseCategory)
            self.postMessage({ id, type, payload: txnIds })
            break
        }
        default:
    }
}

self.onmessage = (e: MessageEvent<Message>) => handleMessage(e.data)
