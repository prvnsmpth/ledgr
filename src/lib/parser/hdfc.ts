import { type Transaction, TransactionType } from "$lib/db";
import { isSupportedFile, ParseError } from "$lib/parser";
import { TransactionUtils } from "$lib/utils";
import { ExpenseCategoryTagger } from "./tagger";
import { XLSXReader } from "./xlsx";

class HdfcBankStatementParser {
    private file: File;
    private accountId: IDBValidKey
    private readonly DELIMITER = ","
    private tagger: ExpenseCategoryTagger

    constructor(file: File, accountId: IDBValidKey) {
        this.file = file;
        this.accountId = accountId;
        this.tagger = new ExpenseCategoryTagger();
    }

    private async parseXLS(): Promise<Transaction[]> {
        const rows = await XLSXReader.readFile(this.file)
        let headerFound = false
        const txns: Transaction[] = []
        for (const row of rows) {
            let i = 0
            while (i < row.length && row[i] === undefined) {
                i++
            }
            const values = row.slice(i)
            console.log('Row:', values)

            if (values.length < 7) {
                continue
            }

            if (!headerFound) {
                console.log('Checking for header:', values)
                if (values.indexOf("Date") >= 0
                    && values.indexOf("Narration") >= 0
                    && values.indexOf("Withdrawal Amt.") >= 0
                    && values.indexOf("Deposit Amt.") >= 0) {
                    headerFound = true
                }
            } else {
                const dateStr = values[0]
                if (typeof dateStr !== "string") {
                    continue
                }
                const dateParts = dateStr.split("/")
                if (dateParts.length !== 3) {
                    continue
                }

                const day = parseInt(dateParts[0])
                const month = parseInt(dateParts[1]) - 1
                let year = parseInt(dateParts[2])
                if (year < 100 && year >= 50) {
                    year += 1900
                } else if (year < 50) {
                    year += 2000
                }
                const date = new Date(year, month, day)

                const description = values[1]
                if (!description) {
                    throw new ParseError("Description could not be read.", this.file);
                }

                const debit = parseFloat(values[4])
                const credit = parseFloat(values[5])
                if (!debit && !credit) {
                    throw new ParseError("Amount could not be read.", this.file);
                }
                const txnType = debit ? TransactionType.Debit : TransactionType.Credit

                const txnData = {
                    date,
                    description,
                    amount: debit || credit,
                    txnType,
                }

                const expenseCategory = this.tagger.categorize(description)
                txns.push({
                    id: TransactionUtils.getTransactionHash(txnData),
                    accountId: this.accountId,
                    ...txnData,
                    expenseCategory,
                })
            }
        }
        return txns
    }

    private async parseCSV(): Promise<Transaction[]> {
        const text = await this.file.text();
        const lines = text.split("\n");

        let headerFound = false;

        const txns = [];
        for (let line of lines) {
            line = line.trim();
            if (!line) {
                continue;
            }

            const parts = line.split(this.DELIMITER);
            if (parts.length < 5) {
                throw new ParseError("Invalid transaction line: " + line, this.file, line);
            }

            let [dateStr, description, , debit, credit, ...rest] = parts
            dateStr = dateStr.trim();
            description = description.trim();
            debit = debit.trim();
            credit = credit.trim();
            if (!headerFound && dateStr.toLowerCase() === "date") {
                headerFound = true;
                continue;
            } else if (!headerFound) {
                continue;
            }

            const debitAmount = parseFloat(debit);
            const creditAmount = parseFloat(credit);
            const type = debitAmount ? TransactionType.Debit : TransactionType.Credit;

            const dateParts = dateStr.split("/");
            if (dateParts.length !== 3) {
                throw new ParseError(`Expected date in format DD/MM/YY, but found: ${dateStr}`, this.file, line);
            }

            let year = parseInt(dateParts[2]);
            let month = parseInt(dateParts[1]) - 1;
            let day = parseInt(dateParts[0]);
            if (year < 100 && year >= 50) {
                year += 1900;
            } else if (year < 50) {
                year += 2000;
            }

            if (!description) {
                throw new ParseError("Description could not be read.", this.file, line);
            }

            if (!debitAmount && !creditAmount) {
                throw new ParseError("Amount could not be read.", this.file, line);
            }

            const txnData = {
                date: new Date(year, month, day),
                description: description,
                amount: debitAmount || creditAmount,
                txnType: type,
            };

            const expenseCategory = this.tagger.categorize(description);

            txns.push({
                id: TransactionUtils.getTransactionHash(txnData),
                accountId: this.accountId,
                ...txnData,
                expenseCategory,
            });
        }

        return txns;
    }

    async parse(): Promise<Transaction[]> {
        if (!await isSupportedFile(this.file)) {
            throw new ParseError("The file you uploaded is not a text/CSV/Excel file.", this.file);
        }

        console.log(`File type:`, this.file.type)
        if (this.file.type === "application/vnd.ms-excel") {
            return await this.parseXLS();
        } else {
            return await this.parseCSV();
        }
    }
}

class HdfcCreditCardStatementParser {
    private file: File;
    private accountId: IDBValidKey
    private tagger: ExpenseCategoryTagger

    constructor(file: File, accountId: IDBValidKey) {
        this.file = file;
        this.accountId = accountId;
        this.tagger = new ExpenseCategoryTagger();
    }

    async parse(): Promise<Transaction[]> {
        if (!await isSupportedFile(this.file)) {
            throw new ParseError("The file you uploaded is not a plain text/CSV/Excel file.", this.file);
        }

        const text = await this.file.text();
        const lines = text.split("\n");

        // Auto-detect format based on delimiter
        // New format (Sep 2025+): uses ~|~ delimiter
        // Old format (pre-Sep 2025): uses ~ delimiter
        const isNewFormat = text.includes('~|~');
        const delimiter = isNewFormat ? '~|~' : '~';

        // Column mappings differ between formats:
        // Old format: [Type, Name, Date, Description, RewardPoints, Amount, Debit/Credit]
        // New format: [Type, Name, Date, Description, Amount, Debit/Credit, Rewards]
        const cols = isNewFormat
            ? { date: 2, description: 3, amount: 4, debitCredit: 5 }
            : { date: 2, description: 3, amount: 5, debitCredit: 6 };

        let headerFound = false;

        const txns = [];
        for (let line of lines) {
            line = line.trim();
            if (!line) {
                continue;
            }

            const parts = line.split(delimiter)
            if (!headerFound && parts[0].toLowerCase() === "transaction type") {
                headerFound = true;
                continue;
            } else if (!headerFound) {
                continue;
            }

            if (parts[0].toLowerCase() !== "domestic" && parts[0].toLowerCase() !== "international") {
                break;
            }

            const minParts = isNewFormat ? 6 : 7;
            if (parts.length < minParts) {
                throw new ParseError("Failed to parse transaction from line." + line, this.file, line);
            }

            let dateStr = parts[cols.date];
            const description = parts[cols.description];
            const amtStr = parts[cols.amount];
            const isCredit = parts[cols.debitCredit] || '';

            // Parse date
            let timeStr
            if (dateStr.split(" ").length > 1) {
                let [d, t] = dateStr.split(" ")
                dateStr = d
                timeStr = t
            }
            const dateParts = dateStr.split("/");
            if (dateParts.length !== 3) {
                throw new ParseError(`Expected date in format DD/MM/YYYY, but found: ${dateStr}`, this.file, line);
            }

            const timeParts = timeStr ? timeStr.split(":") : []
            if (timeStr && timeParts.length !== 3) {
                throw new ParseError(`Expected time in format HH:MM:SS, but found: ${timeStr}`, this.file, line);
            }

            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const year = parseInt(dateParts[2]);

            const hour = timeParts.length > 0 ? parseInt(timeParts[0]) : 0
            const minute = timeParts.length > 0 ? parseInt(timeParts[1]) : 0
            const second = timeParts.length > 0 ? parseInt(timeParts[2]) : 0

            const txnData = {
                date: new Date(year, month, day, hour, minute, second),
                description: description.trim(),
                amount: parseFloat(amtStr.trim().replace(/,/g, "")),
                txnType: isCredit.trim() === "Cr" ? TransactionType.Credit : TransactionType.Debit,
            };

            const expenseCategory = this.tagger.categorize(description);

            txns.push({
                id: TransactionUtils.getTransactionHash(txnData),
                accountId: this.accountId,
                ...txnData,
                expenseCategory,
            });
        }

        return txns;
    }
}

export {
    HdfcBankStatementParser,
    HdfcCreditCardStatementParser
};
