<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import { Calendar } from '$lib/components/ui/calendar'
    import * as Dialog from '$lib/components/ui/dialog'
    import * as Command from '$lib/components/ui/command'
    import * as Sheet from '$lib/components/ui/sheet'
    import { Input } from '$lib/components/ui/input'
    import { Textarea } from '$lib/components/ui/textarea'
    import { Label } from '$lib/components/ui/label'
    import * as Popover from '$lib/components/ui/popover'
    import { ExpenseCategory, type Transaction, TransactionType } from '$lib/db'
    import { cn } from '$lib/utils'
    import { ExpenseCategoryEmojis } from '$lib/components/common'
    import type { Selected } from 'bits-ui'
    import { Calendar as CalendarIcon, ChevronsUpDown } from 'lucide-svelte'
    import {
        CalendarDate,
        DateFormatter,
        getLocalTimeZone,
        type DateValue
    } from '@internationalized/date'
    import { store } from '$lib/db/store'
    import { tick } from 'svelte'

    export let open: boolean
    export let txn: Transaction

    const dateFormatter = new DateFormatter('en-IN', { dateStyle: 'short' })

    $: date = new CalendarDate(
        txn.date.getFullYear(),
        txn.date.getMonth() + 1,
        txn.date.getDate()
    ) as DateValue
    $: description = txn.description
    $: amount = txn.amount
    $: selectedExpenseCategory = getSelectedExpenseCategory()

    let expenseCategoryDropdownOpen = false
    let selectedExpCategory: ExpenseCategory | undefined

    function getSelectedExpenseCategory(): Selected<ExpenseCategory> | undefined {
        const entry = Object.entries(ExpenseCategory).find(([k, v]) => v === txn.expenseCategory)
        if (!entry) {
            return undefined
        }
        const [key, value] = entry
        const icon = ExpenseCategoryEmojis[value]

        return {
            value,
            label: `${icon} ${key}`
        }
    }

    async function handleUpdate() {
        const updatedTxn: Transaction = {
            ...txn,
            date: date.toDate(getLocalTimeZone()),
            description,
            amount,
            expenseCategory: selectedExpenseCategory?.value || txn.expenseCategory
        }

        await store.updateTransaction(txn.id, updatedTxn)
        open = false
    }

    function handleDescChange(e: Event) {
        const el = e.target as HTMLInputElement
        description = el.value
    }

    function handleAmountChange(e: Event) {
        const el = e.target as HTMLInputElement
        amount = parseFloat(el.value)
    }

    function closeAndFocusDropdown(triggerId: string) {
        expenseCategoryDropdownOpen = false
        tick().then(() => {
            document.getElementById(triggerId)?.focus()
        })
    }
</script>

<Sheet.Root bind:open>
    <Sheet.Content class="w-full">
        <Sheet.Header>
            <Sheet.Title>Edit transaction</Sheet.Title>
        </Sheet.Header>
        <div class="grid gap-8 py-4">
            <div class="flex flex-col items-start max-w-48 gap-1.5">
                <Label for="date" class="text-right">Date</Label>
                <div class="col-span-3">
                    <Popover.Root openFocus>
                        <Popover.Trigger asChild let:builder>
                            <Button
                                variant="outline"
                                class={cn(
                                    'justify-start bg-muted border-none text-left font-normal',
                                    !date && 'text-muted-foreground'
                                )}
                                builders={[builder]}
                            >
                                <CalendarIcon class="mr-2 h-4 w-4" />
                                {date
                                    ? dateFormatter.format(date.toDate(getLocalTimeZone()))
                                    : 'Select a date'}
                            </Button>
                        </Popover.Trigger>
                        <Popover.Content class="w-auto p-0" align="start">
                            <Calendar
                                value={date}
                                onValueChange={(v) => v && (date = v)}
                                initialFocus
                            />
                        </Popover.Content>
                    </Popover.Root>
                </div>
            </div>
            <div class="flex flex-col items-start gap-1.5">
                <Label for="description" class="text-right">Description</Label>
                <Textarea
                    id="description"
                    class="text-base bg-muted border-none"
                    value={description}
                    on:input={handleDescChange}
                />
            </div>
            <div class="flex flex-col items-start gap-1.5 max-w-48">
                <Label for="amount" class="text-right">Amount</Label>
                <div class="flex items-center gap-1.5 relative">
                    <span class="absolute left-0 h-full top-1.5 text-xl px-3">₹</span>
                    <Input
                        id="amount"
                        type="number"
                        class="text-base pl-8 bg-muted border-none"
                        value={amount}
                        on:input={handleAmountChange}
                        step="0.01"
                    />
                </div>
            </div>
            {#if txn.txnType === TransactionType.Debit}
                <div class="flex flex-col items-start gap-1.5 max-w-48">
                    <Label for="category" class="text-right">Expense Category</Label>
                    <Popover.Root bind:open={expenseCategoryDropdownOpen} let:ids>
                        <Popover.Trigger asChild let:builder>
                            <Button
                                builders={[builder]}
                                variant="outline"
                                class="w-48 justify-between"
                                role="combobox"
                                aria-expanded={expenseCategoryDropdownOpen}
                            >
                                {selectedExpCategory
                                    ? `${ExpenseCategoryEmojis[selectedExpCategory]} ${selectedExpCategory}`
                                    : 'Select a category'}
                                <ChevronsUpDown class="mr-2 h-4 w-4" />
                            </Button>
                        </Popover.Trigger>
                        <Popover.Content class="w-48">
                            <Command.Root>
                                <Command.Input placeholder="Search..." class="text-base" />
                                <Command.Empty>No category found</Command.Empty>
                                <Command.Group>
                                    {#each Object.entries(ExpenseCategory) as [key, value]}
                                        <Command.Item {value}>
                                            <div class="text-xl mr-2">
                                                {ExpenseCategoryEmojis[value]}
                                            </div>
                                            {key}
                                        </Command.Item>
                                    {/each}
                                </Command.Group>
                            </Command.Root>
                        </Popover.Content>
                    </Popover.Root>
                </div>
            {/if}
        </div>
        <Sheet.Footer class="flex flex-col gap-2">
            <Button on:click={handleUpdate}>Update</Button>
            <Button variant="outline" on:click={() => (open = false)}>Cancel</Button>
        </Sheet.Footer>
    </Sheet.Content>
</Sheet.Root>
