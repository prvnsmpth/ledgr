<script lang="ts">
    import { ArrowDown, ArrowUp } from 'lucide-svelte'
    import { cn, getDayOfWeek, getMonth, formatAmount } from '$lib/utils'
    import { ExpenseCategory, type Transaction, TransactionType } from '$lib/db'
    import { ExpenseCategoryIcons } from '$lib/components/common'
    import * as Card from '$lib/components/ui/card'
    import * as Tooltip from '$lib/components/ui/tooltip'

    export let txn: Transaction
</script>

<a
    class="hidden md:flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center
    md:hover:bg-muted/40 transition-colors cursor-pointer border rounded-xl bg-card shadow-sm text-left"
    href={`/transactions/${txn.id}`}
>
    <div class="text-xs md:text-sm font-semibold text-muted-foreground p-2 md:p-4 md:w-32">
        <div>{getDayOfWeek(txn.date)}, {getMonth(txn.date)} {txn.date.getDate()}</div>
    </div>
    <div class="flex flex-1 flex-col md:flex-row items-start md:items-center gap-2 self-stretch">
        <div class="flex flex-1 gap-2 items-center p-2 md:p-4">
            <button
                class="p-2 flex justify-center items-center rounded-sm text-3xl border-solid text-muted-foreground"
            >
                <svelte:component
                    this={ExpenseCategoryIcons[txn.expenseCategory || ExpenseCategory.Untagged]}
                />
            </button>
            <div
                class="text-xs md:text-sm flex flex-1 gap-1.5 items-center md:break-words font-semibold text-muted-foreground"
            >
                {txn.description}
            </div>
        </div>
        <div
            class={cn(
                txn.txnType === TransactionType.Credit ? 'text-green-800' : 'text-red-800',
                'text-right font-bold text-xl self-end md:self-center border-t md:border-none w-full md:w-auto p-2 md:p-4'
            )}
        >
            <sup>₹</sup>
            {formatAmount(txn.amount)}
            {#if txn.txnType === TransactionType.Credit}
                <ArrowUp size={16} class="inline" strokeWidth={3} />
            {:else}
                <ArrowDown size={16} class="inline" strokeWidth={3} />
            {/if}
        </div>
    </div>
</a>

<a href={`/transactions/${txn.id}`} class="block md:hidden">
    <Card.Root>
        <Card.Header class="p-0 md:p-4">
            <Card.Description>
                <div class="text-xs font-semibold text-muted-foreground p-2">
                    {getDayOfWeek(txn.date)}, {getMonth(txn.date)}
                    {txn.date.getDate()}
                </div>
            </Card.Description>
        </Card.Header>
        <Card.Content class="p-0">
            <div class="flex flex-1 gap-2 items-center p-2 md:p-4">
                <Tooltip.Root>
                    <Tooltip.Trigger>
                        <div
                            class="p-2 flex justify-center
                            items-center rounded-sm text-3xl border-solid text-muted-foreground"
                        >
                            <svelte:component
                                this={ExpenseCategoryIcons[
                                    txn.expenseCategory || ExpenseCategory.Untagged
                                ]}
                                size={28}
                            />
                        </div>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p>{txn.expenseCategory || ExpenseCategory.Untagged}</p>
                    </Tooltip.Content>
                </Tooltip.Root>
                <div
                    class="text-xs md:text-sm flex flex-1 gap-1.5 items-center md:break-words font-semibold text-muted-foreground"
                >
                    {txn.description}
                </div>
            </div>
        </Card.Content>
        <Card.Footer class="p-0">
            <div
                class={cn(
                    txn.txnType === TransactionType.Credit ? 'text-green-800' : 'text-red-800',
                    'text-right font-bold text-xl self-end md:self-center border-t md:border-none w-full md:w-auto p-2 md:p-4'
                )}
            >
                <sup>₹</sup>
                {formatAmount(txn.amount)}
                {#if txn.txnType === TransactionType.Credit}
                    <ArrowUp size={16} class="inline" strokeWidth={3} />
                {:else}
                    <ArrowDown size={16} class="inline" strokeWidth={3} />
                {/if}
            </div>
        </Card.Footer>
    </Card.Root>
</a>
