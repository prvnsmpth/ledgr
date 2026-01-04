<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import * as Card from '$lib/components/ui/card'
    import type { Filters } from '$lib/types'
    import { cn, debounce, formatAmount, type DateFilter } from '$lib/utils'
    import { ArrowDown, ArrowUp, CircleX, ListFilter, Plus, Search, Wand2 } from 'lucide-svelte'

    import { page } from '$app/stores'
    import CreateAccount from '$lib/components/create-account.svelte'
    import FilterTransactions from '$lib/components/filter-transactions.svelte'
    import Upload from '$lib/components/import.svelte'
    import Loader from '$lib/components/loader.svelte'
    import SelectCategory from '$lib/components/select-category.svelte'
    import TransactionComponent from '$lib/components/transaction.svelte'
    import Input from '$lib/components/ui/input/input.svelte'
    import { isMobile } from '$lib/components/ui/responsive-modal/responsive'
    import { TransactionType } from '$lib/db'
    import { accounts, monthlyTransactions, store, transactions, transactionsCashFlow } from '$lib/db/store'
    import { DateFormatter } from '@internationalized/date'
    import { goto } from '$app/navigation'

    const dateFormatter = new DateFormatter('en-IN', { dateStyle: 'short' })

    let searchFilter: string | null = null
    let dateFilter: DateFilter | null = null
    let categoryFilter: string[] = []
    let typeFilter: string | null = null
    let filters: Filters = { 
        searchFilter,
        dateFilter,
        categoryFilter,
        typeFilter
    }

    $: searchFilter = filters.searchFilter
    $: dateFilter = filters.dateFilter
    $: categoryFilter = filters.categoryFilter
    $: typeFilter = filters.typeFilter
    $: filtersActive = dateFilter !== null || categoryFilter.length > 0 || typeFilter !== null

    if ($page.url.searchParams.has('tags')) {
        console.log(`Setting category filter from URL`)
        let cf = $page.url.searchParams.get('tags')!.split(',')
        filters = {
            ...filters,
            categoryFilter: cf,
        }
    }

    if ($page.url.searchParams.has('type')) {
        console.log(`Setting type filter from URL`)
        let tf = $page.url.searchParams.get('type')!
        console.log($page.url.searchParams)
        filters = {
            ...filters,
            typeFilter: tf
        }
    }

    if ($page.url.searchParams.has('q')) {
        console.log(`Setting search filter from URL`)
        let q = $page.url.searchParams.get('q')!
        filters = {
            ...filters,
            searchFilter: q
        }
    }

    let selectedAccountId: IDBValidKey | null = null
    $: selectedAccount = $accounts.find(acc => acc.id === selectedAccountId)

    let uploadDialogOpen: boolean = false
    let createAccountDialogOpen: boolean = false
    let filterTxnsOpen: boolean = false
    let tagAllSelectionOpen: boolean = false

    let fetchingData = true

    const handleSearchFilterChange = debounce((e: Event) => {
        const el = e.target as HTMLInputElement
        const query = el.value;
        filters = {
            ...filters,
            searchFilter: query
        }
        const params = new URLSearchParams($page.url.searchParams);
        if (query) {
            params.set('q', query);
        } else {
            params.delete('q');
        }
        goto(`?${params.toString()}`, { replaceState: true });
    }, 300)

    async function applyFilters(filters?: Filters) {
        fetchingData = true
        await store.getTransactions(filters)
        fetchingData = false
        hideLoadMore = false
    }

    function clearFilters() {
        filters = {
            searchFilter: null,
            dateFilter: null,
            categoryFilter: [],
            typeFilter: null
        }
        const url = new URL(window.location.href)
        url.searchParams.delete('tags')
        url.searchParams.delete('type')
        goto(url.toString(), { replaceState: true })
    }

    $: applyFilters(filters)

    let hideLoadMore = false

    async function loadMoreTransactions() {
        if (!fetchingData) {
            const offset = $transactions.length
            const limit = 50
            const numAdded = await store.fetchMoreTransactions(offset, limit, filters)
            if (numAdded === 0) {
                hideLoadMore = true
            }
        }
    }
</script>

<div class="flex items-center font-bold text-3xl bg-gray-50 sticky top-0 z-50 py-2 mt-10 md:mt-5 w-full">
    <div class="flex-1">Transactions</div>
    <div class="flex items-center gap-3">
        <a href="/smart-tagging" class="text-muted-foreground hover:text-foreground transition-colors" title="Smart Tagging">
            <Wand2 size={22} />
        </a>
        <button on:click={e => filterTxnsOpen = true} class="relative">
            <ListFilter size={24} class="text-muted-foreground" />
            {#if filtersActive}
                <div class="absolute -top-0 -right-0 rounded-full bg-primary w-3.5 h-3.5 border-2 border-muted" />
            {/if}
        </button>
    </div>
</div>

<div class="flex w-full">
    <div class="flex-1 relative max-w-lg">
        <Search size={18} class="absolute left-3 top-3 text-muted-foreground" />
        <Input value={searchFilter}
            on:input={handleSearchFilterChange}
            placeholder="Search..."
            type="text"
            class="pl-9 bg-gray-200 border-none rounded-xl text-base focus-visible:ring-0"
        />
        {#if searchFilter !== null && searchFilter.length > 0}
            <button on:click={e => {
                filters = {
                    ...filters,
                    searchFilter: null
                }
            }} class="absolute right-3 top-3 cursor-pointer">
                <CircleX size={18} class="text-muted-foreground cursor-pointer" />
            </button>
        {/if}
    </div>
    {#if !$isMobile}
        <Button class="ml-auto hidden md:flex justify-center items-center" on:click={() => { uploadDialogOpen = true }}>
            <Plus size={24} />
            Add
        </Button>
    {/if}
</div>

{#if filtersActive}
    <div class="flex items-center">
        <div class="flex-1 flex flex-wrap items-center gap-1.5">
            <div class="text-muted-foreground text-xs uppercase">Filters:</div>
            {#if dateFilter}
                <div class="text-xs bg-gray-200 text-muted-foreground p-1 inline rounded-md font-semibold">
                    {dateFormatter.format(dateFilter.start)} - {dateFormatter.format(dateFilter.end)}
                </div>
            {/if}
            {#each categoryFilter as cf}
                <div class="text-xs bg-gray-200 text-muted-foreground p-1 inline rounded-md font-semibold uppercase">{cf.replaceAll("_", " ")}</div>
            {/each}
            {#if typeFilter}
                <div class={cn(
                    "text-xs p-1 px-2 text-primary-foreground inline rounded-md font-semibold uppercase", 
                    typeFilter === TransactionType.Credit ? "bg-green-800/70" : "bg-red-800/70" 
                )}>
                    {typeFilter}
                </div>
            {/if}
        </div>
        {#if filtersActive}
            <Button variant="ghost" class="p-0 h-fit text-xs inline rounded-md font-semibold uppercase"
                on:click={clearFilters}
            >
                Clear
            </Button>
        {/if}
    </div>
{/if}

<div class="flex flex-col flex-1 min-h-0">
    <!-- <div class="hidden md:flex gap-2 mb-2">
        <div class="flex gap-2 flex-wrap">
            {#each $accounts as account}
                <Button
                    variant="outline"
                    class={cn(`active:scale-95 text-sm text-muted-foreground text-center`,
                        selectedAccountId === account.id ? 'bg-accent' : ''
                    )} on:click={e => {
                        if (selectedAccountId === account.id) {
                            selectedAccountId = null
                        } else if (account.id) {
                            selectedAccountId = account.id
                        }
                    }}>
                    {#if account.name}
                        <span>{account.name}</span>
                    {:else}
                        <span class="uppercase">{account.bank}</span>
                    {/if}
                </Button>
            {/each}
        </div>
        <button
            class={cn(
                `px-2 flex justify-center items-center gap-1 border-2 border-dashed
                rounded-lg cursor-pointer hover:bg-muted transition-all
                active:scale-95 text-muted-foreground text-center`
            )}
            on:click={() => createAccountDialogOpen = true}
        >
            <Plus size={18} />
            <div class="text-sm">Add account</div>
        </button>
        <Button class="ml-auto hidden md:flex justify-center items-center" on:click={() => { uploadDialogOpen = true }}>
            <Plus size={24} />
            Import
        </Button>
    </div> -->
    {#if (filtersActive || searchFilter) && $transactions.length > 0}
        <Card.Root class="mb-2 rounded-xl">
            <Card.Content class="p-4 bg-gray-200 rounded-xl">
                <div class="flex items-center">
                    <div class="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                        <div class="text-xs text-muted-foreground uppercase font-bold">
                            {$transactionsCashFlow.count} transactions
                        </div>
                        {#if $transactionsCashFlow.incoming > 0}
                            <div class="flex items-center">
                                <span class="text-green-800">₹ {formatAmount($transactionsCashFlow.incoming)}</span>
                                <ArrowUp size={14} class="text-green-800" />
                            </div>
                        {/if}
                        {#if $transactionsCashFlow.outgoing > 0}
                            <div class="flex items-center">
                                <span class="text-red-800">₹ {formatAmount($transactionsCashFlow.outgoing)}</span>
                                <ArrowDown size={14} class="text-red-800" />
                            </div>
                        {/if}
                    </div>
                    <div>
                        <Button variant="outline"
                            class="h-fit text-xs inline rounded-md font-semibold uppercase active:scale-95 transition-transform plausible-event-name=TagAllOpen"
                            on:click={() => tagAllSelectionOpen = true}
                        >
                            Tag all
                        </Button>
                    </div>
                </div>
            </Card.Content>
        </Card.Root>
    {/if}
    <div class="flex flex-1 flex-col rounded-lg pb-20 gap-5">
        {#if fetchingData}
            <div class="h-full w-full flex flex-col justify-center items-center">
                <Loader />
            </div>
        {:else}
            {#each $monthlyTransactions as txnGroup (txnGroup.groupKey)}
                <div class="flex flex-col">
                    <div class="flex text-xs font-bold bg-gray-50 text-muted-foreground p-2 uppercase sticky top-11 z-40">
                        <div class="flex-1">
                            {txnGroup.groupKey}
                        </div>
                        <div>{txnGroup.transactions.length} {txnGroup.transactions.length === 1 ? "transaction" : "transactions"}</div>
                    </div>
                    <div class="flex flex-col gap-2">
                        {#each txnGroup.transactions as txn}
                            <TransactionComponent {txn} />
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="h-full w-full flex flex-col justify-center items-center">
                    {#if searchFilter}
                        <div class="flex flex-col flex-1 items-center">
                            <h3 class="text-lg font-semibold tracking-tight justify-start text-center pb-3">No transactions found matching "{searchFilter}"</h3>
                            <Button on:click={clearFilters}>Clear filters</Button>
                        </div>
                    {:else if filtersActive}
                        <div class="flex flex-col flex-1 items-center">
                            <h3 class="text-lg font-semibold tracking-tight justify-start text-center pb-3">No transactions found for the applied filters</h3>
                            <Button on:click={clearFilters}>Clear filters</Button>
                        </div>
                    {:else}
                        <h3 class="text-2xl font-bold tracking-tight">You have no transactions {selectedAccount ? `in ${selectedAccount.name}` : ''}</h3>
                        <p class="text-sm text-muted-foreground text-center">Upload your bank/credit card statements to import transactions.</p>
                        <Button class="mt-4 plausible-event-name=ImportModalOpen" on:click={() => { uploadDialogOpen = true }}>
                            Import transactions
                        </Button>
                    {/if}
                </div>
            {/each}
            {#if $monthlyTransactions.length > 0 && !hideLoadMore}
                <Button variant="outline" class="max-w-96 self-center" on:click={loadMoreTransactions}>Load more</Button> 
            {/if}
        {/if}
    </div>
</div>

<Upload bind:open={uploadDialogOpen} />
<CreateAccount bind:open={createAccountDialogOpen} />
<FilterTransactions bind:open={filterTxnsOpen} bind:filters />
<SelectCategory bind:open={tagAllSelectionOpen}
    {filters}
    count={$transactionsCashFlow.count}
    onCategorySelect={() => {}} />