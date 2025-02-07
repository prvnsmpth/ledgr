import type { Account, Transaction } from "$lib/db"

export type User = {
    id: string
    googleId?: string
    name: string
    email: string
    profilePictureUrl?: string
    accessToken?: string
    refreshToken?: string
}

export type Session = {
    id: string
    userId: string
    expiresAt: number
}

export type LedgrData = {
    version: number
    accounts: Account[]
    transactions: Transaction[]
}

export type BackupFile = {
    id: string
    name: string
    createdAt: string
    modifiedAt: string
}
