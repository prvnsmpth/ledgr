import type { DateFilter } from "$lib/utils"
import type { TransactionType } from "./db"

export enum MessageType {
    Init = "init",
    Close = "close",
    GetTransactions = "getTransactions",
    fetchMoreTransactions = "fetchMoreTransactions",
    GetAllAccounts = "getAllAccounts",
    LoadAccounts = "loadAccounts",
    GetTransactionStats = "getTransactionStats",
    ComputeTransactionStats = "computeTransactionStats",
    LoadTransactions = "loadTransactions",
    ImportFiles = "importFiles",
    TagTransactions = "tagTransactions",
}

export type Message = {
    id?: number,
    type: MessageType
    payload?: any
}

export type Filters = {
    searchFilter: string | null,
    dateFilter: DateFilter | null,
    categoryFilter: string[],
    typeFilter: string | null
}

