<script lang="ts">
    import { ExpenseCategoryIcons } from '$lib/components/common'
    import { Input } from '$lib/components/ui/input'
    import * as Sheet from '$lib/components/ui/sheet'
    import { ExpenseCategory } from '$lib/db'
    import { store } from '$lib/db/store'
    import { cn } from '$lib/utils'
    import { CircleX, Search } from 'lucide-svelte'
    import { isMobile } from './ui/responsive-modal/responsive'
    import type { Filters } from '$lib/types'

    export let open: boolean
    export let filters: Filters | null = null
    export let txnId: IDBValidKey | null = null
    export let count: number = 1
    export let onCategorySelect: () => void

    let categoryFilter: string | null = null
    $: categories = Object.keys(ExpenseCategoryIcons) as ExpenseCategory[]
    $: sortedCategories = categoryFilter
        ? categories.sort((a, b) => {
              const ma = a.toLowerCase().includes(categoryFilter!.toLowerCase())
              const mb = b.toLowerCase().includes(categoryFilter!.toLowerCase())
              if (ma && !mb) return -1
              if (!ma && mb) return 1
              return 0
          })
        : categories

    function handleCategoryFilterChange(e: InputEvent) {
        categoryFilter = (e.target as HTMLInputElement).value
    }

    async function handleCategorySelect(category: string) {
        try {
            if (filters) {
                await store.tagAllTransactions(filters, category as ExpenseCategory)
                // @ts-ignore
                window.plausible('TagAllSuccess')
            } else if (txnId) {
                await store.tagSingleTransaction(txnId, category as ExpenseCategory)
                // @ts-ignore
                window.plausible('TagSingleSuccess')
            }
            open = false
            categoryFilter = null
            onCategorySelect()
        } catch (e) {}
    }

    let side: 'bottom' | 'right'
    $: side = $isMobile ? 'bottom' : 'right'
</script>

<Sheet.Root bind:open>
    <Sheet.Content {side} class="flex flex-col gap-4 justify-center max-h-svh">
        <Sheet.Header class="p-4">
            <Sheet.Title>Select category</Sheet.Title>
            {#if count === 1}
                <Sheet.Description>
                    Choose a category for this transaction.
                </Sheet.Description>
            {:else}
                <Sheet.Description>
                    Choose a category for the <b>{count}</b> selected transactions.
                </Sheet.Description>
            {/if}
        </Sheet.Header>

        <div class="relative">
            <Search size={18} class="absolute left-3 top-3 text-muted-foreground" />
            <Input
                value={categoryFilter}
                on:input={handleCategoryFilterChange}
                placeholder="Search..."
                type="text"
                class="pl-9 bg-gray-200 border-none rounded-xl text-base focus-visible:ring-0"
            />
            {#if categoryFilter && categoryFilter.length > 0}
                <button
                    on:click={(e) => (categoryFilter = null)}
                    class="absolute right-3 top-3 cursor-pointer"
                >
                    <CircleX size={18} class="text-muted-foreground cursor-pointer" />
                </button>
            {/if}
        </div>
        <div class="flex flex-wrap gap-2 overflow-y-auto">
            {#each sortedCategories as category}
                {@const matches =
                    categoryFilter === null ||
                    category.toLowerCase().includes(categoryFilter.toLowerCase())}
                <button
                    class={cn(
                        'inline-flex items-center gap-2 text-md font-semibold p-2 rounded-lg text-muted-foreground bg-accent',
                        matches ? 'opacity-100' : 'opacity-25'
                    )}
                    on:click={(e) => handleCategorySelect(category)}
                >
                    <svelte:component this={ExpenseCategoryIcons[category]} size={24} />
                    <div>{category.replaceAll("_", " ")}</div>
                </button>
            {/each}
        </div>
        <Sheet.Footer class="flex flex-col gap-4"></Sheet.Footer>
    </Sheet.Content>
</Sheet.Root>
