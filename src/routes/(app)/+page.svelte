<script lang="ts">
    import Import from '$lib/components/import.svelte'
    import Loader from '$lib/components/loader.svelte'
    import { Button } from '$lib/components/ui/button'
    import * as Card from '$lib/components/ui/card'
    import { type CashFlow, type GroupedCashFlow } from '$lib/db'
    import { storeInitialized, cashFlowStats } from '$lib/db/store'
    import { cn, formatAmount, getMonth } from '$lib/utils'
    import {
        ArrowDown,
        ArrowUp,
        ArrowUpDown,
        ChevronLeft,
        ChevronRight,
        Coins
    } from 'lucide-svelte'
    import { cubicOut } from 'svelte/easing'
    import { tweened } from 'svelte/motion'
    import { getCategoryIcon, getCategoryColor } from '$lib/components/common'
    import { derived } from 'svelte/store'
    import { getLocalTimeZone, today } from '@internationalized/date'
    import type { PageData } from './$types'

    $: monthlyCashFlow = $cashFlowStats?.monthlyCashFlow || []
    $: numMonths = monthlyCashFlow.length
    let selectedMonthIdx: number = 0
    let selectedMonthCashFlow: GroupedCashFlow
    $: untaggedCashFlow = $cashFlowStats?.categoryCashFlow.filter(
        (s) => s.groupKey === 'untagged'
    )?.[0]
    const selInCashFlow = tweened(0, { duration: 800, easing: cubicOut })
    const selOutCashFlow = tweened(0, { duration: 800, easing: cubicOut })
    $: if (monthlyCashFlow.length > 0) {
        selectedMonthCashFlow = monthlyCashFlow[selectedMonthIdx]
        let selectedCashFlowProportions = computeCashFlowProportions(selectedMonthCashFlow.cashFlow)
        selInCashFlow.set(Math.max(1, selectedCashFlowProportions.incoming))
        selOutCashFlow.set(Math.max(1, selectedCashFlowProportions.outgoing))
    }

    let importDialogOpen = false

    // Expense summary
    enum TimePeriod {
        ThisMonth = 'this month',
        LastMonth = 'last month',
        ThisYear = 'this year',
        All = 'all'
    }
    let selectedTimePeriod = TimePeriod.ThisMonth
    const tday = today(getLocalTimeZone())
    const tdayDate = tday.toDate(getLocalTimeZone())
    const currMonthYear = `${getMonth(tdayDate)} ${tday.year}`
    const lastMonth = tday.subtract({ months: 1 }).toDate(getLocalTimeZone())
    const lastMonthYear = `${getMonth(lastMonth)} ${tday.year}`
    $: expensesByCategory =
        $cashFlowStats?.aggCashFlow
            ?.filter((row) => {
                const monthYear = row.aggKey[0]
                const year = parseInt(monthYear.split(' ')[1])
                if (selectedTimePeriod === TimePeriod.ThisMonth) {
                    return monthYear === currMonthYear
                }
                if (selectedTimePeriod === TimePeriod.LastMonth) {
                    return monthYear === lastMonthYear
                } else if (selectedTimePeriod === TimePeriod.ThisYear) {
                    return tday.year === year
                } else {
                    return true
                }
            })
            ?.map((row) => {
                return row
            })
            ?.map((row) => ({ category: row.aggKey[1], amount: row.cashFlow.outgoing }))
            ?.reduce((acc: { category: string; amount: number }[], row) => {
                const idx = acc.findIndex((e) => e.category === row.category)
                if (idx === -1) {
                    acc.push(row)
                } else {
                    acc[idx].amount += row.amount
                }
                return acc
            }, [])
            ?.sort((a, b) => b.amount - a.amount) || []
    $: console.log(`Expenses by category:`, expensesByCategory)
    $: categoryExpenseProportions = expensesByCategory.map((e) =>
        tweened(0, { duration: 800, easing: cubicOut })
    )
    $: categoryExpensePropValues = derived(categoryExpenseProportions, (x) => x)
    $: if (expensesByCategory.length > 0) {
        const proportions = computeProportions(expensesByCategory.map((e) => e.amount))
        proportions.forEach((p, i) => categoryExpenseProportions[i].set(Math.max(1, p)))
    }

    function computeCashFlowProportions(cashFlow: CashFlow) {
        const [incoming] = computeProportions([cashFlow.incoming, cashFlow.outgoing])
        return {
            incoming,
            outgoing: 100 - incoming
        }
    }

    function computeProportions(amounts: number[]): number[] {
        const total = amounts.reduce((a, b) => a + b, 0)
        return amounts.map((a) => Math.round((a / total) * 100))
    }

    export let data: PageData
</script>

<div class="font-bold text-3xl bg-gray-50 sticky top-0 z-50 py-2 mt-10 md:mt-5">Home</div>

{#if !$storeInitialized}
    <div class="flex flex-1 justify-center items-center">
        <Loader />
    </div>
{:else}
    {@const noData = monthlyCashFlow.length === 0}
    {@const dataAvailable = monthlyCashFlow.length > 0}
    {@const untaggedExpensesFound = (untaggedCashFlow?.cashFlow.outgoing || 0) > 0}
    <div class="flex-1 min-h-0 flex flex-col gap-8 pb-40">

        <Card.Root class="max-w-96 md:max-w-3xl">
            <Card.Header>
                <Card.Title>Hey there! 👋</Card.Title>
                <Card.Description></Card.Description>
            </Card.Header>
            <Card.Content class="flex flex-col md:flex-row gap-8">
                <div class="flex flex-col gap-2">
                    <h3 class="text-lg">What is ledgr?</h3>
                    <p class="text-sm text-muted-foreground">
                        ledgr is a privacy-first personal finance manager that helps you track your
                        expenses and income.
                    </p>
                    <p class="text-sm text-muted-foreground font-bold">
                        On ledgr, your data is stored only on your device and is not sent to any server for storage.
                    </p>
                    <p class="text-sm text-muted-foreground">
                        You may choose to connect your Google Drive account to sync your data across devices.
                    </p>
                    <p class="text-sm text-muted-foreground font-bold">
                        Read our <a href="/privacy" class="underline">privacy policy</a> to learn more.
                    </p>
                </div>
                <div class="flex flex-col gap-2">
                    <h3 class="text-lg">How it works</h3>
                    <ol class="list-decimal list-inside text-sm text-muted-foreground [&_li]:mb-2">
                        <li>Download your bank/credit card statements from your bank's website (Excel/CSV format).</li>
                        <li>Import your statements into ledgr.</li>
                        <li>Tag your transactions into expense categories.</li>
                        <li>View and analyze your expenses by category, month, and year.</li>
                        <li>Connect your Google Drive account to sync your data across devices.</li>
                    </ol>
                    <p class="text-sm text-muted-foreground">
                        Import transactions from your bank/credit card accounts to get started.
                    </p>
                </div>
            </Card.Content>
            <Card.Footer class="flex justify-end">
                <Button
                    class="plausible-event-name=ImportModalOpen"
                    on:click={() => {
                        importDialogOpen = true
                    }}>
                    Import transactions
                </Button>
            </Card.Footer>
        </Card.Root>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-screen-xl">
            <div class="flex flex-col gap-1.5">
                <div class="text-muted-foreground uppercase text-xs font-bold">
                    <Coins size={18} class="inline" />
                    Expense Summary
                </div>
                <Card.Root>
                    <Card.Header class="p-0">
                        {#if dataAvailable}
                            <Card.Title class="flex items-start p-3 border-b text-xs">
                                <div class="flex gap-1.5">
                                    {#each Object.entries(TimePeriod) as [key, value]}
                                        <button
                                            class={cn(
                                                'p-1.5 rounded-lg uppercase',
                                                selectedTimePeriod === value
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground/60'
                                            )}
                                            on:click={() => (selectedTimePeriod = value)}
                                        >
                                            {value}
                                        </button>
                                    {/each}
                                </div>
                            </Card.Title>
                        {/if}
                    </Card.Header>
                    {#if noData}
                        <Card.Content
                            class="flex flex-col p-4 min-h-48 items-center justify-center"
                        >
                            <p class="text-sm text-muted-foreground p-8 text-center">
                                Once you import your transactions and tag them, you'll see a
                                breakdown of your recent expenses by category here.
                            </p>
                        </Card.Content>
                    {:else}
                        <Card.Content class="p-0">
                            {#if expensesByCategory.length > 0}
                                <div
                                    class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 p-4 place-items-center"
                                >
                                    {#each expensesByCategory as { category, amount }, idx}
                                        <a
                                            href={`/transactions?tags=${category}`}
                                            class="flex justify-end items-center gap-1.5 text-sm text-muted-foreground uppercase font-bold m-1 p-1 w-full"
                                        >
                                            <svelte:component
                                                this={getCategoryIcon(category)}
                                                size={18}
                                                class="inline"
                                            />
                                            {category}
                                        </a>
                                        <div class="m-1 p-1 relative w-full">
                                            <div
                                                style:width={`${$categoryExpensePropValues[idx]}%`}
                                                style:background-color={getCategoryColor(category)}
                                                class={cn('absolute top-0 left-0 h-full rounded-lg')}
                                            ></div>
                                            <div class="relative z-10 p-1 font-bold">
                                                <sup>₹</sup>
                                                {formatAmount(amount)}
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <div class="flex items-center justify-center p-9">
                                    <p class="text-muted-foreground font-semibold text-sm">
                                        Nothing to see here 😴
                                    </p>
                                </div>
                            {/if}
                        </Card.Content>
                    {/if}
                </Card.Root>
            </div>
            <div class="flex flex-col gap-1.5">
                <div class="text-muted-foreground uppercase text-xs font-bold">
                    <ArrowUpDown size={18} class="inline" />
                    Monthly Cash Flow
                </div>
                <Card.Root>
                    <Card.Header class="p-0">
                        {#if dataAvailable}
                            <Card.Title class="flex items-start border-b">
                                <div class="flex-1 text-sm p-3">
                                    {selectedMonthCashFlow.groupKey}
                                </div>
                                <div class="flex gap-1.5 p-3">
                                    <button
                                        disabled={selectedMonthIdx === numMonths - 1}
                                        on:click={(e) =>
                                            (selectedMonthIdx = Math.min(
                                                numMonths - 1,
                                                selectedMonthIdx + 1
                                            ))}
                                    >
                                        <ChevronLeft
                                            size={20}
                                            strokeWidth={2.5}
                                            class={cn(
                                                selectedMonthIdx === numMonths - 1
                                                    ? 'opacity-20'
                                                    : 'opacity-100'
                                            )}
                                        />
                                    </button>
                                    <button
                                        disabled={selectedMonthIdx === 0}
                                        on:click={(e) =>
                                            (selectedMonthIdx = Math.max(0, selectedMonthIdx - 1))}
                                    >
                                        <ChevronRight
                                            size={20}
                                            strokeWidth={2.5}
                                            class={cn(
                                                selectedMonthIdx === 0
                                                    ? 'opacity-20'
                                                    : 'opacity-100'
                                            )}
                                        />
                                    </button>
                                </div>
                            </Card.Title>
                        {/if}
                    </Card.Header>
                    {#if noData}
                        <Card.Content
                            class="flex flex-col p-4 min-h-48 items-center justify-center"
                        >
                            <p class="text-sm text-muted-foreground p-8 text-center">
                                ...and here you'll see the overall inflow and outflow of money from
                                all your accounts.
                            </p>
                        </Card.Content>
                    {:else}
                        <Card.Content class="flex flex-col gap-4 justify-evenly p-4">
                            <div class="relative w-full">
                                <div
                                    style:width={`${$selInCashFlow}%`}
                                    class={cn(
                                        'absolute top-0 left-0 h-full bg-green-100 rounded-lg'
                                    )}
                                ></div>
                                <div class="relative z-10 p-1 text-green-800 text-xl font-bold">
                                    <sup>₹</sup>
                                    {formatAmount(selectedMonthCashFlow.cashFlow.incoming)}
                                    <ArrowUp size={16} class="inline" strokeWidth={3} />
                                </div>
                            </div>
                            <div class="relative w-full">
                                <div
                                    style:width={`${$selOutCashFlow}%`}
                                    class={cn('absolute top-0 left-0 h-full bg-red-100 rounded-lg')}
                                ></div>
                                <div class="relative z-10 p-1 text-red-800 text-xl font-bold">
                                    <sup>₹</sup>
                                    {formatAmount(selectedMonthCashFlow.cashFlow.outgoing)}
                                    <ArrowDown size={16} class="inline" strokeWidth={3} />
                                </div>
                            </div>
                        </Card.Content>
                    {/if}
                </Card.Root>
            </div>
        </div>

        {#if !data.user}
            <Card.Root class="max-w-96">
                <Card.Header>
                    <Card.Title>Sync your data</Card.Title>
                </Card.Header>
                <Card.Content>
                    <p class="text-sm text-muted-foreground">
                        Sign in with your Google account to sync your data to Google Drive and access it across devices.
                    </p>
                </Card.Content>
                <Card.Footer>
                    <form method="POST" action="/settings?/connectGoogleDrive">
                        <Button type="submit" variant="outline" size="lg" class="max-w-60 flex gap-2">
                            <img src="https://zapier-images.imgix.net/storage/services/a5b8a9920e9dae8a73711590e7090d3d.png?auto=format&fit=crop&ixlib=react-9.8.1&q=50&w=30&h=30&dpr=1" alt="Google Drive Icon" />
                            Connect Google Drive
                        </Button>
                    </form>
                </Card.Footer>
            </Card.Root>
        {/if}

        {#if untaggedExpensesFound}
            <Card.Root class="max-w-96">
                <Card.Header>
                    <Card.Title>You're on track 🎯</Card.Title>
                </Card.Header>
                <Card.Content class="flex flex-col">
                    <p class="text-sm text-muted-foreground">
                        Tag all your transactions to get a complete picture of where your money is
                        going.
                    </p>
                    <p class="text-sm text-muted-foreground mt-4">
                        One step closer to controlling your finances!
                    </p>
                    <Button href="/transactions?tags=untagged&type=debit" class="mt-4">
                        View untagged expenses
                    </Button>
                </Card.Content>
            </Card.Root>
        {/if}

    </div>
{/if}

{#if $storeInitialized}
    <Import bind:open={importDialogOpen} />
{/if}
