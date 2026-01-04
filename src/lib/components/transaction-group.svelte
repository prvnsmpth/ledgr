<script lang="ts">
    import { ChevronDown, ChevronUp, Tag } from 'lucide-svelte'
    import { cn, formatAmount, getDayOfWeek, getMonth } from '$lib/utils'
    import { TransactionType, type Transaction } from '$lib/db'
    import type { TransactionGroup } from '$lib/smart-grouping'
    import * as Card from '$lib/components/ui/card'
    import { Button } from '$lib/components/ui/button'

    export let group: TransactionGroup
    export let onTagClick: (group: TransactionGroup) => void

    let expanded = false

    function toggleExpand() {
        expanded = !expanded
    }

    // Show at most 5 transactions when expanded
    $: visibleTransactions = expanded ? group.transactions.slice(0, 10) : []
    $: hasMore = group.transactions.length > 10
</script>

<Card.Root class="overflow-hidden">
    <Card.Header class="p-4 pb-2">
        <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
                <Card.Title class="text-sm font-semibold text-foreground truncate">
                    {group.displayPattern}
                </Card.Title>
                <Card.Description class="text-xs mt-1">
                    {group.count} transaction{group.count !== 1 ? 's' : ''} &middot;
                    <span class="font-semibold text-red-700">₹{formatAmount(group.totalValue)}</span>
                </Card.Description>
            </div>
            <Button
                variant="default"
                size="sm"
                class="shrink-0"
                on:click={() => onTagClick(group)}
            >
                <Tag size={16} class="mr-1" />
                Tag All
            </Button>
        </div>
    </Card.Header>
    <Card.Content class="p-4 pt-2">
        <button
            class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            on:click={toggleExpand}
        >
            {#if expanded}
                <ChevronUp size={16} />
                <span>Hide transactions</span>
            {:else}
                <ChevronDown size={16} />
                <span>Show transactions</span>
            {/if}
        </button>

        {#if expanded}
            <div class="mt-3 space-y-2">
                {#each visibleTransactions as txn}
                    <a
                        href={`/transactions/${txn.id}`}
                        class="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                        <div class="flex-1 min-w-0">
                            <div class="text-xs text-muted-foreground">
                                {getDayOfWeek(txn.date)}, {getMonth(txn.date)} {txn.date.getDate()}, {txn.date.getFullYear()}
                            </div>
                            <div class="text-sm truncate text-muted-foreground">
                                {txn.description}
                            </div>
                        </div>
                        <div class={cn(
                            "text-sm font-semibold shrink-0",
                            txn.txnType === TransactionType.Credit ? 'text-green-700' : 'text-red-700'
                        )}>
                            ₹{formatAmount(txn.amount)}
                        </div>
                    </a>
                {/each}
                {#if hasMore}
                    <div class="text-xs text-center text-muted-foreground py-2">
                        ... and {group.transactions.length - 10} more
                    </div>
                {/if}
            </div>
        {/if}
    </Card.Content>
</Card.Root>
