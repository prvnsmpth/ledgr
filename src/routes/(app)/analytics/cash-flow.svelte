<script lang="ts">
    import * as Card from '$lib/components/ui/card'
    import { cashFlowStats } from '$lib/db/store'
    import { scaleOrdinal } from 'd3-scale'
    import {
        Axis,
        Chart,
        Highlight,
        Spline,
        Svg,
        Text,
        Tooltip,
        TooltipItem
    } from 'layerchart'

    import { formatAmount, fromMonthStr, toMonthStr } from '$lib/utils'
    import { scaleBand } from 'd3-scale'

    const amtFmt = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        notation: 'compact',
        compactDisplay: 'long'
    })

    let classes: string
    export { classes as class }

    $: cashFlow =
        $cashFlowStats?.aggCashFlow
            ?.flatMap((row) => [{
                month: row.aggKey[0],
                key: 'outgoing',
                value: row.cashFlow.outgoing,
            }, {
                month: row.aggKey[0],
                key: 'incoming',
                value: row.cashFlow.incoming,
            }])
            ?.reduce((acc: { month: string; key: string; value: number }[], row) => {
                const en = acc.find((r) => r.month === row.month && r.key === row.key)
                if (en) {
                    en.value += row.value
                } else {
                    acc.push(row)
                }
                return acc
            }, [])
            ?.map(row => ({
                ...row,
                month: fromMonthStr(row.month),
            }))
            ?.sort((a, b) => a.month.getTime() - b.month.getTime()) || []
    let keyColors: { [key: string]: string } = {
        'incoming': 'hsl(var(--chart-1))',
        'outgoing': 'hsl(var(--chart-2))',
    }
</script>

<Card.Root class={classes}>
    <Card.Header>
        <Card.Title>Cash Flow</Card.Title>
        <Card.Description>Inflow and outflow of cash from all your accounts</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-8">
        <div class="h-[400px]">
            <Chart
                data={cashFlow}
                x="month"
                xScale={scaleBand().padding(0.1)}
                y="value"
                yDomain={[0, null]}
                yNice
                r="key"
                rScale={scaleOrdinal()}
                rDomain={['incoming', 'outgoing']}
                rRange={Object.values(keyColors)}
                padding={{ left: 16, bottom: 24, right: 48 }}
                tooltip={{ mode: 'voronoi' }}
                let:rScale
            >
                <Svg>
                    <Axis placement="left" 
                        format={(d) => amtFmt.format(d)}
                        grid rule />
                    <Axis
                        placement="bottom"
                        format={(d) => toMonthStr(d)}
                        tickLabelProps={{ 
                            rotate: 0, textAnchor: 'middle' 
                        }}
                        rule
                    />
                    {#each ['incoming', 'outgoing'] as key}
                        <Spline data={cashFlow.filter(r => r.key === key)} class="stroke-2" stroke={keyColors[key]}>
                            <svelte:fragment slot="end">
                                <circle r={4} fill={keyColors[key]} />
                                <Text
                                    value={key}
                                    verticalAnchor="middle"
                                    dx={6}
                                    dy={-2}
                                    class="text-xs"
                                    fill={keyColors[key]}
                                />
                            </svelte:fragment>
                        </Spline>
                    {/each}
                    <Highlight points lines />
                </Svg>
                <Tooltip header={(data) => toMonthStr(data.month)} let:data>
                    <TooltipItem label={data.key} value={amtFmt.format(data.value)} />
                </Tooltip>
            </Chart>
        </div>
    </Card.Content>
</Card.Root>
