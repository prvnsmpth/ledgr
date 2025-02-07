import * as XLSX from 'xlsx'
import { isSupportedFile, ParseError } from '.';
import { TransactionType, type Transaction } from '$lib/db';
import { ExpenseCategoryTagger } from './tagger';
import { TransactionUtils } from '$lib/utils';
import { XLSXReader } from "./xlsx";

class ICICIBankStatementParser {
    private file: File
    private accountId: IDBValidKey
    private tagger: ExpenseCategoryTagger

    constructor(file: File, accountId: IDBValidKey) {
        this.file = file;
        this.tagger = new ExpenseCategoryTagger();
        this.accountId = accountId;
    }

    async parse(): Promise<Transaction[]> {
        if (!isSupportedFile(this.file)) {
            throw new ParseError("The file you uploaded is not a text/CSV/Excel file.", this.file);
        }

        const rows = await XLSXReader.readFile(this.file)
        let headerFound = false
        const txns: Transaction[] = []
        for (const row of rows) {
            let i = 0
            while (i < row.length && row[i] === undefined) {
                i++
            }
            const values = row.slice(i)
            console.log(`Row:`, values)
            if (values.length < 8) {
                continue
            }

            if (!headerFound) {
                if (values.indexOf("Transaction Date") >= 0
                    && values.indexOf("Transaction Remarks") >= 0) {
                    headerFound = true
                }
            } else {
                const txnDateStr = values[2]
                const dateParts = txnDateStr.split('/')
                if (dateParts.length !== 3) {
                    throw new ParseError(`Expected date in format DD/MM/YYYY, got ${txnDateStr}`, this.file)
                }
                const day = parseInt(dateParts[0])
                const month = parseInt(dateParts[1]) - 1
                const year = parseInt(dateParts[2])
                const txnDate = new Date(year, month, day)

                const txnDesc = values[4].trim()
                const debit = parseFloat(values[5])
                const credit = parseFloat(values[6])
                const txnType = debit ? TransactionType.Debit : TransactionType.Credit

                const txnData = {
                    date: txnDate,
                    description: txnDesc,
                    amount: debit || credit,
                    txnType,
                }
                const expenseCategory = this.tagger.categorize(txnDesc)

                txns.push({
                    id: TransactionUtils.getTransactionHash(txnData),
                    accountId: this.accountId,
                    ...txnData,
                    expenseCategory,
                });
            }
        }

        return txns
    }
}

class ICICICreditCardStatementParser {
    private file: File
    private accountId: IDBValidKey
    private tagger: ExpenseCategoryTagger

    constructor(file: File, accountId: IDBValidKey) {
        this.file = file;
        this.tagger = new ExpenseCategoryTagger();
        this.accountId = accountId;
    }

    async parse(): Promise<Transaction[]> {
        if (!isSupportedFile(this.file)) {
            throw new ParseError("The file you uploaded is not a text/CSV/Excel file.", this.file);
        }

        const rows = await XLSXReader.readFile(this.file)
        let headerFound = false
        const txns: Transaction[] = []
        for (const row of rows) {
            let i = 0
            while (i < row.length && row[i] === undefined) {
                i++
            }
            const values = row.slice(i)
            console.log(`Row:`, values)
            if (values.length < 8) {
                continue
            }

            if (!headerFound) {
                console.log('Checking for header:', values)
                if (values.indexOf("Transaction Date") >= 0
                    && values.indexOf("Details") >= 0) {
                    headerFound = true
                }
            } else {
                const txnDateStr = values[0]
                const dateParts = txnDateStr.split('/')
                if (dateParts.length !== 3) {
                    throw new ParseError(`Expected date in format DD/MM/YYYY, got ${txnDateStr}`, this.file)
                }
                const day = parseInt(dateParts[0])
                const month = parseInt(dateParts[1]) - 1
                const year = parseInt(dateParts[2])
                const txnDate = new Date(year, month, day)

                const txnDesc = values[1].trim()
                const amountStr = values[5].trim()
                const amountParts = amountStr.split(' ')
                if (amountParts.length !== 2) {
                    throw new ParseError(`Expected amount in format '123.45 <Dr|Cr>', got ${amountStr}`, this.file)
                }

                const amount = parseFloat(amountParts[0])
                const txnType = amountParts[1] === "Dr." ? TransactionType.Debit : TransactionType.Credit

                const txnData = {
                    date: txnDate,
                    description: txnDesc,
                    amount,
                    txnType,
                }
                const expenseCategory = this.tagger.categorize(txnDesc)

                txns.push({
                    id: TransactionUtils.getTransactionHash(txnData),
                    accountId: this.accountId,
                    ...txnData,
                    expenseCategory,
                });
            }
        }

        return txns
    }
}

export {
    ICICIBankStatementParser,
    ICICICreditCardStatementParser,
}