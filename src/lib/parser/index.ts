import { AccountType, SupportedBank, type Transaction } from '$lib/db'
import { HdfcBankStatementParser, HdfcCreditCardStatementParser } from './hdfc'
import { ICICIBankStatementParser, ICICICreditCardStatementParser } from './icici'
import { XLSXReader } from './xlsx'

async function parseStatement(
    file: File,
    accountId: IDBValidKey,
    accountBank: SupportedBank,
    accountType: AccountType
): Promise<Transaction[]> {
    switch (accountBank) {
        case SupportedBank.SBI:
        case SupportedBank.ICICI:
            switch (accountType) {
                case AccountType.Bank:
                    return await new ICICIBankStatementParser(file, accountId).parse()
                case AccountType.CreditCard:
                    return await new ICICICreditCardStatementParser(file, accountId).parse()
                default:
                    throw new Error(`Unknown account type: ${accountType}`)
            }
        case SupportedBank.HDFC:
            switch (accountType) {
                case AccountType.Bank:
                    return await new HdfcBankStatementParser(file, accountId).parse()
                case AccountType.CreditCard:
                    return await new HdfcCreditCardStatementParser(file, accountId).parse()
                default:
                    throw new Error(`Unknown account type: ${accountType}`)
            }
        default:
            throw new Error(`Unknown bank: ${accountBank}`)
    }
}

export class ParseError extends Error {
    file: File
    line?: string

    constructor(message: string, file: File, line?: string) {
        super(message)
        Object.setPrototypeOf(this, ParseError.prototype)

        this.file = file
        this.line = line
    }
}

async function readBytes(file: File, numBytes: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                const buffer = new Uint8Array(reader.result)
                resolve(buffer)
            } else {
                reject(new Error('Failed to read file'))
            }
        }
        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }
        reader.readAsArrayBuffer(file.slice(0, numBytes))
    })
}

export async function isSupportedFile(file: File): Promise<boolean> {
    if (file.type === 'text/csv' || file.type === 'text/plain' || file.type === 'application/vnd.ms-excel') {
        return true
    }

    // Try to read the first few bytes and check if it's a text file
    const bytes = await readBytes(file, 100)
    const isPlainText = bytes.every((byte) => byte <= 127)
    return isPlainText
}

export { parseStatement }
