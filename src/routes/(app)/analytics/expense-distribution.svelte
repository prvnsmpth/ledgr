<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import * as Card from '$lib/components/ui/card'
    import * as Select from '$lib/components/ui/select'
    import { cashFlowStats } from '$lib/db/store'
    import { scaleOrdinal } from 'd3-scale'
    import { Chart, Pie, Svg, Tooltip, TooltipItem, Text } from 'layerchart'
    import { ChevronLeft, ChevronRight } from 'lucide-svelte'
    import { cubicOut } from 'svelte/easing'

    import { ExpenseCategory, type CashFlowStats } from '$lib/db'
    import { MONTHS, fromMonthStr } from '$lib/utils'
    import { CalendarDate } from '@internationalized/date'
    import type { Selected } from 'bits-ui'
    import { getCategoryIcon } from '$lib/components/common'

    const amtFmt = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        notation: 'compact',
        compactDisplay: 'long',
    })

    const fromDate = (dt: Date): CalendarDate => {
        return new CalendarDate(dt.getFullYear(), dt.getMonth() + 1, 1)
    }

    const latestMonth = $cashFlowStats ? fromDate(fromMonthStr($cashFlowStats.aggCashFlow[0].aggKey[0])) : undefined
    function getDataYears(stats: CashFlowStats) {
        const years = new Set(stats.aggCashFlow.map((row) => parseInt(row.aggKey[0].split(' ')[1])))
        return [...years].sort((a, b) => b - a)
    }

    function getDataMonths(stats: CashFlowStats): [CalendarDate, CalendarDate] {
        let maxDate = fromMonthStr(stats.aggCashFlow[0].aggKey[0])
        let minDate = fromMonthStr(stats.aggCashFlow[stats.aggCashFlow.length - 1].aggKey[0])

        const fromDate = (dt: Date): CalendarDate => {
            return new CalendarDate(dt.getFullYear(), dt.getMonth() + 1, 1)
        }

        return [fromDate(minDate), fromDate(maxDate)]
    }

    let dataYears: number[] = []
    let maxDataMonth: CalendarDate | undefined = undefined
    let minDataMonth: CalendarDate | undefined = undefined
    let leftDisabled: boolean = true
    let rightDisabled: boolean = true
    $: if ($cashFlowStats) {
        dataYears = getDataYears($cashFlowStats)
        let [minDt, maxDt] = getDataMonths($cashFlowStats)

        minDataMonth = minDt
        maxDataMonth = maxDt
    }

    let selectedMonth: Selected<string> | undefined = latestMonth ? { value: MONTHS[latestMonth.month - 1], label: MONTHS[latestMonth.month - 1] } : undefined
    let selectedYear: Selected<number> = {
        value: new Date().getFullYear(),
        label: new Date().getFullYear().toString()
    }
    $: selectedMonthYear =
        selectedYear && selectedMonth
            ? new CalendarDate(
                selectedYear.value,
                selectedMonth.value === "all" ? 1 : MONTHS.indexOf(selectedMonth.value) + 1,
                1)
            : undefined
    $: if (selectedMonthYear && selectedMonth) {
        if (selectedMonth.value === 'all') {
            if (dataYears.length > 0) {
                const minDataYear = dataYears[dataYears.length - 1]
                const maxDataYear = dataYears[0]

                leftDisabled = selectedYear.value === minDataYear
                rightDisabled = selectedYear.value === maxDataYear
            }
        } else {
            leftDisabled = (minDataMonth?.compare(selectedMonthYear) || 0) >= 0
            rightDisabled = (maxDataMonth?.compare(selectedMonthYear) || 0) <= 0
        }
    }

    function handleMonthChange(direction: 'left' | 'right') {
        const currMonth = selectedMonthYear
        if (!currMonth) return

        let newMonth
        if (selectedMonth?.value === "all") {
            if (direction === 'left') {
                newMonth = currMonth.subtract({ years: 1 })
            } else {
                newMonth = currMonth.add({ years: 1 })
            }
        } else {
            if (direction === 'left') {
                newMonth = currMonth.subtract({ months: 1 })
            } else {
                newMonth = currMonth.add({ months: 1 })
            }
        }

        selectedYear = { value: newMonth.year, label: newMonth.year.toString() }
        if (selectedMonth?.value !== "all") {
            let m = MONTHS[newMonth.month - 1]
            selectedMonth = { value: m, label: m }
        }
    }

    $: expenseByCategory =
        $cashFlowStats?.aggCashFlow
            ?.filter(row => {
                const my = row.aggKey[0] // "<month> <year>"
                const year = parseInt(my.split(' ')[1])
                if (selectedMonth?.value === "all" && selectedYear) {
                    return year === selectedYear.value
                } else if (selectedYear) {
                    return my === `${selectedMonth?.value} ${selectedYear.value}`
                }
                return true
            })
            ?.map(row => ({
                category: row.aggKey[1],
                amount: row.cashFlow.outgoing,
            }))
            ?.reduce((acc: { category: string, amount: number }[], row) => {
                const idx = acc.findIndex((r) => r.category === row.category)
                if (idx === -1) {
                    acc.push(row)
                } else {
                    acc[idx].amount += row.amount
                }
                return acc
            }, [])
            ?.sort((a, b) => b.amount - a.amount) || []
    $: colorKeys = expenseByCategory.map((row) => row.category) as ExpenseCategory[]

    let categoryToColor = {
        [ExpenseCategory.CreditCardPayment]: 'hsl(var(--stone-400))',       // Neutral color
        [ExpenseCategory.Dining]: 'hsl(var(--rose-400))',                   // Rose
        [ExpenseCategory.Entertainment]: 'hsl(var(--fuchsia-400))',         // Fuchsia
        [ExpenseCategory.Gift]: 'hsl(var(--violet-400))',                   // Violet
        [ExpenseCategory.Groceries]: 'hsl(var(--green-400))',               // Green
        [ExpenseCategory.Gym]: 'hsl(var(--emerald-400))',                   // Emerald
        [ExpenseCategory.Health]: 'hsl(var(--teal-400))',                   // Teal
        [ExpenseCategory.Internet]: 'hsl(var(--cyan-400))',                 // Cyan
        [ExpenseCategory.Investment]: 'hsl(var(--blue-400))',               // Blue
        [ExpenseCategory.LoanEMI]: 'hsl(var(--slate-400))',                 // Slate
        [ExpenseCategory.Netflix]: 'hsl(var(--red-400))',                   // Red
        [ExpenseCategory.Other]: 'hsl(var(--neutral-400))',                 // Neutral
        [ExpenseCategory.Pets]: 'hsl(var(--pink-400))',                     // Pink
        [ExpenseCategory.Phone]: 'hsl(var(--indigo-400))',                  // Indigo
        [ExpenseCategory.Rent]: 'hsl(var(--zinc-400))',                     // Zinc
        [ExpenseCategory.SelfTransfer]: 'hsl(var(--gray-400))',             // Gray
        [ExpenseCategory.Shopping]: 'hsl(var(--purple-400))',               // Purple
        [ExpenseCategory.Streaming]: 'hsl(var(--fuchsia-400))',             // Fuchsia (alternative for entertainment)
        [ExpenseCategory.Swiggy]: 'hsl(var(--orange-400))',                 // Orange
        [ExpenseCategory.Transport]: 'hsl(var(--amber-400))',               // Amber
        [ExpenseCategory.Travel]: 'hsl(var(--sky-400))',                    // Sky
        [ExpenseCategory.Untagged]: 'hsl(var(--stone-400))',                // Stone (neutral)
        [ExpenseCategory.Utilities]: 'hsl(var(--yellow-400))',              // Yellow
        [ExpenseCategory.Work]: 'hsl(var(--lime-400))',                     // Lime
    };

    $: keyColors = colorKeys.map((key: ExpenseCategory) => categoryToColor[key])
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Expense Distribution</Card.Title>
        <Card.Description>Break down of expenses by category</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-8">
        <div class="flex gap-1.5 justify-center">
            <Button variant="outline"
                disabled={leftDisabled}
                class="px-2.5" on:click={() => handleMonthChange('left')}>
                <ChevronLeft size={16} />
            </Button>
            <div class="flex gap-1.5 justify-center">
                <!-- Select month -->
                <Select.Root bind:selected={selectedMonth}>
                    <Select.Trigger class="w-24">
                        <Select.Value placeholder="Month" />
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="all" label="All">All</Select.Item>
                        {#each MONTHS as month}
                            <Select.Item value={month} label={month}>{month}</Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>

                <!-- Select year -->
                <Select.Root bind:selected={selectedYear}>
                    <Select.Trigger class="w-24">
                        <Select.Value placeholder="Year" />
                    </Select.Trigger>
                    <Select.Content>
                        {#each dataYears as year}
                            <Select.Item value={year} label={year.toString()}>{year}</Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>
            <Button variant="outline"
                disabled={rightDisabled}
                class="px-2.5" on:click={() => handleMonthChange('right')}>
                <ChevronRight size={16} />
            </Button>
        </div>
        {#if expenseByCategory.length === 0}
            <div class="h-full flex items-center justify-center">
                <p class="text-center text-muted-foreground">No data available</p>
            </div>
        {/if}
        <div class="h-[300px]">
            <Chart
                data={expenseByCategory}
                x="amount"
                r="category"
                rScale={scaleOrdinal()}
                rDomain={colorKeys}
                rRange={keyColors}
                let:tooltip
            >
                <Svg>
                    <Pie innerRadius={80} tweened={{
                        duration: 1500, easing: cubicOut
                    }} {tooltip}>
                    </Pie>
                </Svg>
                <Tooltip header={d => d.category} let:data>
                    <TooltipItem label="amount" value={data.amount} format={d => amtFmt.format(d)} />
                </Tooltip>
            </Chart>
        </div>
        <div class="flex flex-wrap justify-center gap-4 max-w-96 mx-auto">
            {#each expenseByCategory as { category, amount }, i}
                <div class="flex items-center gap-1">
                    <div class="w-4 h-4 rounded" style="background-color: {keyColors[i]}"></div>
                    <span class="text-xs font-bold uppercase text-muted-foreground">{category.replaceAll("_", " ")}</span>
                </div>
            {/each}
        </div>
    </Card.Content>
</Card.Root>
