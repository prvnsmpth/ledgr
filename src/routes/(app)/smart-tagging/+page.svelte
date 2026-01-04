<script lang="ts">
    import { onMount } from 'svelte'
    import { Wand2, RefreshCw, Inbox, ArrowDownWideNarrow } from 'lucide-svelte'
    import { store } from '$lib/db/store'
    import type { TransactionGroup } from '$lib/smart-grouping'
    import TransactionGroupCard from '$lib/components/transaction-group.svelte'
    import SelectCategory from '$lib/components/select-category.svelte'
    import Loader from '$lib/components/loader.svelte'
    import { Button } from '$lib/components/ui/button'
    import { cn } from '$lib/utils'

    let groups: TransactionGroup[] = []
    let loading = true
    let selectedGroup: TransactionGroup | null = null
    let categorySheetOpen = false

    type SortOption = 'value' | 'count'
    let sortBy: SortOption = 'value'

    const GROUPS_LIMIT = 20

    $: sortedGroups = [...groups].sort((a, b) => {
        if (sortBy === 'value') {
            return b.totalValue - a.totalValue
        } else {
            return b.count - a.count
        }
    })

    async function loadGroups() {
        loading = true
        try {
            groups = await store.getUntaggedGroups(GROUPS_LIMIT)
        } catch (e) {
            console.error('Error loading untagged groups:', e)
        } finally {
            loading = false
        }
    }

    onMount(() => {
        loadGroups()
    })

    function handleTagClick(group: TransactionGroup) {
        selectedGroup = group
        categorySheetOpen = true
    }

    function handleCategorySelect() {
        // Remove the tagged group from the list
        if (selectedGroup) {
            groups = groups.filter(g => g.signature !== selectedGroup!.signature)
            selectedGroup = null
        }
        // Reload to get new groups that may have moved up
        loadGroups()
    }

    $: selectedTransactionIds = selectedGroup?.transactions.map(t => t.id) || null
</script>

<svelte:head>
    <title>Smart Tagging | ledgr</title>
</svelte:head>

<div class="flex flex-col gap-6 py-6 pb-20 md:pb-6">
    <!-- Header -->
    <div class="flex flex-col gap-4">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold flex items-center gap-2">
                    <Wand2 size={24} />
                    Smart Tagging
                </h1>
                <p class="text-muted-foreground text-sm mt-1">
                    Tag similar transactions in bulk.
                </p>
            </div>
            <Button
                variant="outline"
                size="sm"
                on:click={loadGroups}
                disabled={loading}
            >
                <RefreshCw size={16} class="mr-1 {loading ? 'animate-spin' : ''}" />
                Refresh
            </Button>
        </div>

        <!-- Sort options -->
        <div class="flex items-center gap-2">
            <ArrowDownWideNarrow size={16} class="text-muted-foreground" />
            <span class="text-sm text-muted-foreground">Sort by:</span>
            <div class="flex gap-1">
                <button
                    class={cn(
                        "px-3 py-1 text-sm rounded-md transition-colors",
                        sortBy === 'value'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    on:click={() => sortBy = 'value'}
                >
                    Total Value
                </button>
                <button
                    class={cn(
                        "px-3 py-1 text-sm rounded-md transition-colors",
                        sortBy === 'count'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    on:click={() => sortBy = 'count'}
                >
                    Transaction Count
                </button>
            </div>
        </div>
    </div>

    <!-- Content -->
    {#if loading}
        <div class="flex justify-center items-center py-12">
            <Loader />
        </div>
    {:else if sortedGroups.length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-center">
            <Inbox size={48} class="text-muted-foreground mb-4" />
            <h2 class="text-lg font-semibold">All caught up!</h2>
            <p class="text-muted-foreground text-sm mt-1">
                No untagged transaction groups to display.
            </p>
        </div>
    {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each sortedGroups as group (group.signature)}
                <TransactionGroupCard {group} onTagClick={handleTagClick} />
            {/each}
        </div>
    {/if}
</div>

<!-- Category selection sheet -->
<SelectCategory
    bind:open={categorySheetOpen}
    transactionIds={selectedTransactionIds}
    count={selectedGroup?.count || 0}
    onCategorySelect={handleCategorySelect}
/>
