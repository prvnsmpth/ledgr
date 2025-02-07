import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { cubicOut } from 'svelte/easing'
import type { TransitionConfig } from 'svelte/transition'
import { TransactionType, type CashFlow, type Transaction, type TransactionKey } from '$lib/db'
import { DateFormatter } from '@internationalized/date'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

type FlyAndScaleParams = {
    y?: number
    x?: number
    start?: number
    duration?: number
}

export const flyAndScale = (
    node: Element,
    params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
    const style = getComputedStyle(node)
    const transform = style.transform === 'none' ? '' : style.transform

    const scaleConversion = (
        valueA: number,
        scaleA: [number, number],
        scaleB: [number, number]
    ) => {
        const [minA, maxA] = scaleA
        const [minB, maxB] = scaleB

        const percentage = (valueA - minA) / (maxA - minA)
        const valueB = percentage * (maxB - minB) + minB

        return valueB
    }

    const styleToString = (style: Record<string, number | string | undefined>): string => {
        return Object.keys(style).reduce((str, key) => {
            if (style[key] === undefined) return str
            return str + `${key}:${style[key]};`
        }, '')
    }

    return {
        duration: params.duration ?? 200,
        delay: 0,
        css: (t) => {
            const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0])
            const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0])
            const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1])

            return styleToString({
                transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                opacity: t
            })
        },
        easing: cubicOut
    }
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getMonth(date: Date): string {
    const month = date.getMonth()
    return MONTHS[month]
}

export function toMonthStr(date: Date): string {
	return `${getMonth(date)} ${date.getFullYear()}`
}

export function fromMonthStr(monthStr: string): Date {
    let [m, y] = monthStr.split(' ')
    const month = MONTHS.indexOf(m)
    const year = parseInt(y)
    return new Date(year, month)
}

export function getDayOfWeek(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const day = date.getDay()
    return days[day]
}

export function getFormattedDate(date: Date): string {
    const day = date.getDate()
    const month = getMonth(date)
    const year = date.getFullYear()
    return `${getDayOfWeek(date)}, ${day} ${month} ${year}`
}

export function formatAmount(x: number) {
    // return x.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
    return x.toLocaleString('en-IN', {
        style: 'decimal',
        maximumFractionDigits: 2
    })
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn.apply(this, args), delay)
    }
}

export class TransactionUtils {
    static getTransactionHash(txnKey: TransactionKey): string {
        const jsonString = JSON.stringify(txnKey)

        let hash = 0
        for (let i = 0; i < jsonString.length; i++) {
            const char = jsonString.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash |= 0 // Convert to 32bit integer
        }

        // Convert to an unsigned 32-bit integer to avoid negative hash values
        hash = hash >>> 0

        return hash.toString(16).padStart(8, '0')
    }

    static groupTransactionsByMonth(txns: Transaction[]): Transaction[][] {
        const groups: Transaction[][] = []
        if (txns.length === 0) return groups
        for (const txn of txns) {
            const month = `${getMonth(txn.date)} ${txn.date.getFullYear()}`
            if (groups.length === 0) {
                groups.push([txn])
            } else {
                const lastGroup = groups[groups.length - 1]
                const lastTxn = lastGroup[lastGroup.length - 1]
                const lastMonth = `${getMonth(lastTxn.date)} ${lastTxn.date.getFullYear()}`
                if (lastMonth === month) {
                    lastGroup.push(txn)
                } else {
                    groups.push([txn])
                }
            }
        }
        return groups
    }

    static computeCashFlow(txns: Transaction[]): CashFlow {
        return txns.reduce(
            (acc, txn) => {
                acc.count++
                if (txn.txnType === TransactionType.Credit) {
                    acc.incomingCount++
                    acc.incoming += txn.amount
                } else {
                    acc.outgoingCount++
                    acc.outgoing += txn.amount
                }
                return acc
            },
            { count: 0, outgoingCount: 0, outgoing: 0, incomingCount: 0, incoming: 0 }
        )
    }
}

export type DateFilter = {
    start: Date
    end: Date
}

export const dateFormatter = new DateFormatter('en-IN', { dateStyle: 'short' })
export const dateTimeFormatter = new DateFormatter('en-IN', { dateStyle: 'short', timeStyle: 'long' })
