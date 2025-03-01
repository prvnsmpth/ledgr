<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import * as Popover from '$lib/components/ui/popover'
    import { Label } from '$lib/components/ui/label'
    import { RangeCalendar } from '$lib/components/ui/range-calendar'
    import * as Sheet from '$lib/components/ui/sheet'
    import type { Filters } from '$lib/types'
    import { cn } from '$lib/utils'
    import { DateFormatter, endOfMonth, endOfYear, getLocalTimeZone, startOfMonth, startOfYear, today, type CalendarDate } from '@internationalized/date'
    import { Calendar as CalendarIcon, Radio } from 'lucide-svelte'
    import { ExpenseCategoryIcons, getCategoryIcon } from './common'
    import { isMobile } from './ui/responsive-modal/responsive'
    import * as RadioGroup from '$lib/components/ui/radio-group'
    import { TransactionType, type CategoryItem } from '$lib/db'
    import { categories, store } from '$lib/db/store'
    import { onMount } from 'svelte'

    const dateFormatter = new DateFormatter('en-IN', { dateStyle: 'short' })

    type DateRange = {
        start: CalendarDate,
        end: CalendarDate
    }

    export let open: boolean;
    export let filters: Filters
    
    // Make sure we load categories when the component is mounted
    onMount(async () => {
        if ($categories.length === 0) {
            await store.getAllCategories()
        }
    })

    let selectedQuickFilter: string | null = null

    let dateRange: DateRange | undefined
    $: dateStart = dateRange?.start ? dateRange.start.toDate(getLocalTimeZone()) : undefined
    $: dateEnd = dateRange?.end ? dateRange.end.toDate(getLocalTimeZone()) : undefined
    $: localDateFilter = dateStart && dateEnd ? { start: dateStart, end: dateEnd } : undefined

    let localCategoryFilter: string[] = filters.categoryFilter || []
    let localTypeFilter: string | undefined = filters.typeFilter || "both"

    function toggleCategory(category: string) {
        const idx = localCategoryFilter.indexOf(category)
        if (idx === -1) {
            localCategoryFilter = [...localCategoryFilter, category]
        } else if (idx >= 0) {
            localCategoryFilter = [...localCategoryFilter.slice(0, idx), ...localCategoryFilter.slice(idx + 1)]
        }
    }

    function selectQuickFilter(filter: string) {
        if (selectedQuickFilter === filter) {
            selectedQuickFilter = null
            dateRange = undefined
        } else {
            selectedQuickFilter = filter
            dateRange = quickDateFilters[filter]
        }
    }

    const tday = today(getLocalTimeZone())

    const quickDateFilters: Record<string, DateRange> = {
        "this month": {
            start: startOfMonth(tday),
            end: tday
        },
        "last 3 months": {
            start: startOfMonth(tday.subtract({ months: 3 })),
            end: startOfMonth(tday)
        },
        "last 6 months": {
            start: startOfMonth(tday.subtract({ months: 6 })),
            end: startOfMonth(tday)
        },
        "last month": {
            start: startOfMonth(tday.subtract({ months: 1 })),
            end: endOfMonth(tday.subtract({ months: 1 }))
        },
        "this year": {
            start: startOfYear(tday),
            end: tday
        },
        "last year": {
            start: startOfYear(tday.subtract({ years: 1 })),
            end: endOfYear(tday.subtract({ years: 1 }))
        }
    }

    async function applyFilters() {
        let searchFilter = filters?.searchFilter || null
        let dateFilter = localDateFilter || null
        let categoryFilter = localCategoryFilter
        let typeFilter = localTypeFilter === "both" ? null : (localTypeFilter || null)
        filters = {
            searchFilter,
            dateFilter,
            categoryFilter,
            typeFilter
        }
        open = false
    }

    let side: 'bottom' | 'right'
    $: side = $isMobile ? 'bottom' : 'right'
</script>

<Sheet.Root bind:open>
    <Sheet.Content {side} class="flex flex-col max-h-svh">
        <Sheet.Header>
            <Sheet.Title>Filter transactions</Sheet.Title>
        </Sheet.Header>
        <div class="flex-1 min-h-0 flex flex-col gap-8 overflow-y-auto">
            <div class="flex flex-col gap-1.5">
                <div class="uppercase text-muted-foreground font-bold text-xs">Quick Date filters</div>
                <div class="flex flex-wrap gap-1.5">
                    {#each Object.keys(quickDateFilters) as filter}
                        <Button variant="outline" size="sm"
                            class={cn("inline bg-muted text-muted-foreground uppercase font-bold text-xs focus-visible:ring-0",
                                selectedQuickFilter === filter ? 'bg-primary hover:bg-primary text-primary-foreground hover:text-primary-foreground' : ''
                            )}
                            on:click={() => selectQuickFilter(filter)}
                        >
                            {filter}
                        </Button>
                    {/each}
                </div>
            </div>

            <div class="flex flex-col gap-1.5">
                <div class="uppercase text-muted-foreground font-bold text-xs">Date Range</div>
                <Popover.Root>
                    <Popover.Trigger>
                        <Button variant="outline" class="flex items-center gap-2">
                            <CalendarIcon size={18} />
                            <span>{ dateStart && dateEnd ? `${dateFormatter.format(dateStart)} - ${dateFormatter.format(dateEnd)}` : "Select a date range" }</span>
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content>
                        <RangeCalendar bind:value={dateRange} />
                    </Popover.Content>
                </Popover.Root>
            </div>

            <div class="flex flex-col gap-1.5">
                <div class="uppercase text-muted-foreground font-bold text-xs">Type</div>
                <RadioGroup.Root bind:value={localTypeFilter} class="flex gap-4">
                    <div class="flex gap-1.5">
                        <RadioGroup.Item id="credit" value="both" />
                        <Label for="credit" class="">All</Label>
                    </div>
                    <div class="flex gap-1.5">
                        <RadioGroup.Item id="credit" value={TransactionType.Credit} />
                        <Label for="credit" class="">Credit</Label>
                    </div>
                    <div class="flex gap-1.5">
                        <RadioGroup.Item id="debit" value={TransactionType.Debit} />
                        <Label for="debit" class="">Debit</Label>
                    </div>
                </RadioGroup.Root>
            </div>

            <div class="flex flex-col gap-1.5">
                <div class="uppercase text-muted-foreground font-bold text-xs">Category</div>
                <div class="flex flex-wrap gap-1.5">
                    {#each $categories.filter(cat => cat.isEnabled) as category}
                        <Button
                            variant="secondary"
                            size="sm"
                            class={cn("flex gap-1.5 text-muted-foreground font-bold text-sm focus-visible:ring-0",
                                localCategoryFilter.indexOf(category.value) !== -1 ? 'bg-primary hover:bg-primary text-primary-foreground' : ''
                            )}
                            on:click={() => toggleCategory(category.value)}
                        >
                            <svelte:component this={getCategoryIcon(category.value)} size={18} />
                            <span>{category.name}</span>
                        </Button>
                    {/each}
                </div>
            </div>

        </div>
        <Sheet.Footer class="flex flex-col gap-4">
            <Button variant="outline" on:click={() => open = false}>Cancel</Button>
            <Button on:click={applyFilters}>Apply</Button>
        </Sheet.Footer>
    </Sheet.Content>
</Sheet.Root>