<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import { cn } from '$lib/utils'
    import * as Card from '$lib/components/ui/card'
    import { ExpenseCategory } from '$lib/db'
    import { cashFlowStats } from '$lib/db/store'
    import { fromMonthStr, toMonthStr } from '$lib/utils'
    import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
    import { scaleBand } from 'd3-scale'
    import {
        Axis,
        Bars,
        Chart,
        Highlight,
        Labels,
        Svg,
        Tooltip,
        TooltipItem
    } from 'layerchart'
    import { TriangleAlert } from 'lucide-svelte'
    import { cubicInOut } from 'svelte/easing'
    import ExpenseDistribution from './expense-distribution.svelte'
    import CashFlow from './cash-flow.svelte'

    const fromDate = (dt: Date): CalendarDate => {
        return new CalendarDate(dt.getFullYear(), dt.getMonth() + 1, 1)
    }

    $: numTxns =
        $cashFlowStats?.categoryCashFlow
            ?.map((s) => s.cashFlow.outgoingCount)
            .reduce((a, b) => a + b, 0) || 0
    $: numUntaggedTxns =
        $cashFlowStats?.categoryCashFlow?.filter(
            (s) => s.groupKey === ExpenseCategory.Untagged
        )?.[0]?.cashFlow?.outgoingCount || 0

    let numMonths = 3

    const startMonth = $cashFlowStats
        ? fromDate(fromMonthStr($cashFlowStats?.aggCashFlow?.[0]?.aggKey?.[0]))
        : today(getLocalTimeZone())
    const endMonth = $cashFlowStats
        ? fromDate(fromMonthStr($cashFlowStats?.aggCashFlow?.slice(-1)?.[0]?.aggKey?.[0]))
        : today(getLocalTimeZone())
    
    let months: string[]
    $: console.log('months:', months)
    $: {
        if (numMonths === -1) {
            let newMonths = []
            let currMonth = startMonth
            while (currMonth.compare(endMonth) >= 0) {
                newMonths.push(toMonthStr(currMonth.toDate(getLocalTimeZone())))
                currMonth = currMonth.subtract({ months: 1 })
            }
            months = newMonths
        } else {
            months = Array.from({ length: numMonths }, (_, i) => {
                const month = startMonth.subtract({ months: i }).set({ day: 1 }).toDate(getLocalTimeZone())
                return toMonthStr(month)
            })
        }
    }
    $: monthlyExpenses = months.map((month) => {
        const amountSpent =
            $cashFlowStats?.aggCashFlow
                ?.filter((row) => row.aggKey[0] === month)
                ?.reduce((acc, row) => acc + row.cashFlow.outgoing, 0) || 0
        return { month: fromMonthStr(month), amount: amountSpent }
    })

    const amtFmt = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        notation: 'compact',
        compactDisplay: 'long',
    })

    enum TimePeriod {
        LastThreeMonths = '3M',
        LastSixMonths = '6M',
        LastYear = '1Y',
        AllTime = 'ALL',
    }
    let selectedTimePeriod: TimePeriod = TimePeriod.LastThreeMonths
    $: {
        switch (selectedTimePeriod) {
            case TimePeriod.LastThreeMonths:
                numMonths = 3
                break
            case TimePeriod.LastSixMonths:
                numMonths = 6
                break
            case TimePeriod.LastYear:
                numMonths = 12
                break
            case TimePeriod.AllTime:
                numMonths = -1
                break
        }
    }
</script>

<div class="font-bold text-3xl bg-gray-50 py-2 mt-10 md:mt-5">Analytics</div>

{#if numTxns === 0}
    <Card.Root class="max-w-96">
        <Card.Header>
            <Card.Title class="flex gap-2 items-center">wow, such empty 👀</Card.Title>
        </Card.Header>
        <Card.Content class="flex flex-col">
            <p class="text-sm text-muted-foreground">
                Import your transactions to dive deeper into your expenses and figure out where your
                money is going.
            </p>
            <Button class="mt-4" href="/transactions">Go to transactions</Button>
        </Card.Content>
    </Card.Root>
{:else}
    {#if numUntaggedTxns > 0}
        <div
            class="flex items-center gap-3 border border-yellow-300
            p-2 rounded-lg text-sm bg-yellow-100 text-yellow-600 w-fit"
        >
            <TriangleAlert size={24} class="shrink-0" />
            <div>
                <b>{numUntaggedTxns}</b> out of <b>{numTxns}</b> expenses are currently untagged.
                <a href="/transactions?tags=untagged&type=debit" class="text-yellow-800 underline">
                    Go forth and tag!
                </a>
            </div>
        </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-40 md:mb-10">
        <Card.Root>
            <Card.Header>
                <Card.Title>Monthly Expenses</Card.Title>
                <Card.Description>Total spend by month</Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="flex gap-4 mb-8">
                    {#each Object.entries(TimePeriod) as [key, value]}
                        <button
                            class={cn(
                                'text-xs font-bold rounded-lg uppercase',
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
                <div class="h-[400px]">
                    <Chart
                        data={monthlyExpenses}
                        x="month"
                        xScale={scaleBand().padding(0.2)}
                        y="amount"
                        yDomain={[0, null]}
                        yNice={2}
                        padding={{ left: 16, bottom: 24 }}
                        tooltip={{ mode: 'band' }}
                    >
                        <Svg>
                            <Axis placement="left"
                                format={(d) => amtFmt.format(d)}
                                grid rule />
                            <Axis placement="bottom"
                                format={(d) => toMonthStr(d)}
                                tickLabelProps={{ rotate: 0, textAnchor: 'middle' }}
                                rule />
                            <Bars radius={4} class="fill-[hsl(var(--chart-2))]"
                                initialY={400 - 24}
                                initialHeight={0}
                                tweened={{
                                    y: { duration: 1000, easing: cubicInOut },
                                    height: { duration: 1000, easing: cubicInOut }
                                }} />
                            <Labels format={d => amtFmt.format(d)} />
                            <Highlight area />
                        </Svg>

                        <Tooltip header={d => toMonthStr(d.month)} let:data>
                            <TooltipItem label="amount" value={amtFmt.format(data.amount)} />
                        </Tooltip>
                    </Chart>
                </div>
            </Card.Content>
        </Card.Root>

        <ExpenseDistribution />

        <CashFlow class="mb-40 md:col-span-2" />
    </div>
{/if}
