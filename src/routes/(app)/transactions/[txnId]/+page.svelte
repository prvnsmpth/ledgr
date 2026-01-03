<script lang="ts">
    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import { getCategoryIcon } from '$lib/components/common'
    import Loader from '$lib/components/loader.svelte'
    import SelectCategory from '$lib/components/select-category.svelte'
    import { Button } from '$lib/components/ui/button'
    import * as Card from '$lib/components/ui/card'
    import * as Sheet from '$lib/components/ui/sheet'
    import { Switch } from '$lib/components/ui/switch'
    import { Label } from '$lib/components/ui/label'
    import { type Account, type Transaction, TransactionType } from '$lib/db'
    import { store, storeInitialized, categoryByValue } from '$lib/db/store'
    import { cn, getFormattedDate, formatAmount } from '$lib/utils'
    import {
        ArrowDown,
        ArrowUp,
        Calendar as CalendarIcon,
        ChevronLeft,
        FileQuestion,
        Icon,
        Trash2
    } from 'lucide-svelte'
    import { BankIcons } from '$lib/components/common'
    import * as Modal from '$lib/components/ui/responsive-modal'
    import { onMount, SvelteComponent } from 'svelte'

    let txnId = $page.params.txnId
    let txn: Transaction | null
    let account: Account | null
    let icon: typeof FileQuestion

    onMount(async () => {
        console.log(`Mounting Transaction page`)
        await fetchData()
    })

    async function fetchData() {
        console.log(`Fetching data`)
        txn = await store.getTransaction(txnId)
        if (txn) {
            icon = getCategoryIcon(txn.expenseCategory || 'untagged')
            account = await store.getAccount(txn.accountId)
        }
    }

    let deleteConfirmationOpen = false
    async function deleteTransaction() {
        try {
            await store.deleteTransaction(txnId)
            goto('/transactions')
        } catch (e) {}
    }

    let selectCategoryOpen = false

    async function handleExcludeChange(checked: boolean) {
        if (txn) {
            const updated = { ...txn, excludeFromCashFlow: checked }
            await store.updateTransaction(txn.id, updated)
        }
    }
</script>

<button on:click={(e) => history.back()} class="sticky top-0 left-0 bg-gray-50 py-2 z-50">
    <ChevronLeft class="w-8 h-8" />
</button>

{#if !$storeInitialized || txn === undefined || account === undefined}
    <div class="flex flex-1 h-svh justify-center items-center">
        <Loader />
    </div>
{:else if txn === null}
    <div class="flex flex-col flex-1 gap-1.5 h-svh justify-center items-center">
        <h1 class="text-2xl font-semibold">Oops, something's not right</h1>
        <p class="text-muted-foreground text-center">
            We should have found this transaction in local storage, but we didn't.
        </p>
        <p class="text-muted-foreground text-center">
            Try deleting all data from the accounts page and re-importing your transactions. Sorry!
        </p>
    </div>
{:else}
    <Card.Root class="max-w-2xl">
        <Card.Header class="p-2 border-b">
            <Card.Description>
                <div class="flex items-center justify-center">
                    <CalendarIcon size={18} class="text-muted-foreground" />
                    <div class="text-sm font-semibold text-muted-foreground p-2">
                        {getFormattedDate(txn.date)}
                    </div>
                </div>
            </Card.Description>
        </Card.Header>
        <Card.Content class="p-4 border-b">
            <div class="flex flex-col items-center gap-4">
                <div
                    class={cn(
                        txn.txnType === TransactionType.Credit ? 'text-green-800' : 'text-red-800',
                        'text-right font-bold text-3xl'
                    )}
                >
                    <sup>₹</sup>
                    {formatAmount(txn.amount)}
                    {#if txn.txnType === TransactionType.Credit}
                        <ArrowUp size={16} class="inline" strokeWidth={3} />
                    {:else}
                        <ArrowDown size={16} class="inline" strokeWidth={3} />
                    {/if}
                </div>
                <button
                    class="flex items-center gap-2 text-md font-semibold p-2 rounded-lg text-muted-foreground bg-accent active:scale-95 transition-transform plausible-event-name=TagSingleOpen"
                    on:click={() => (selectCategoryOpen = true)}
                >
                    <svelte:component this={icon} size={24} />
                    <div>{$categoryByValue.get(txn.expenseCategory || 'untagged')?.name || (txn.expenseCategory || 'Untagged').replaceAll("_", " ")}</div>
                </button>
            </div>
        </Card.Content>
        <Card.Footer class="flex flex-col items-start gap-4 p-4">
            <div>
                <div class="uppercase text-xs font-bold">Description</div>
                <div class="text-sm">{txn.description}</div>
            </div>
            <div>
                <div class="uppercase text-xs font-bold">Account</div>
                <div class="text-sm flex items-center gap-1.5">
                    {#if account}
                        <div>
                            <svelte:component this={BankIcons[account?.bank]} width={16} height={16} />
                        </div>
                        {#if account.name}
                            <span>{account.name}</span>
                        {:else}
                            <span class="uppercase">{account.bank}</span>
                        {/if}
                    {/if}
                </div>
            </div>
        </Card.Footer>
    </Card.Root>

    <Card.Root class="max-w-2xl">
        <Card.Content class="p-4">
            <div class="flex items-center justify-between">
                <div class="flex flex-col gap-1.5">
                    <div class="font-semibold">Exclude from cash flow</div>
                    <p class="text-sm text-muted-foreground">
                        Mark this transaction as excluded from cash flow calculations.
                    </p>
                </div>
                <Switch id="exclude-txn" checked={txn.excludeFromCashFlow} onCheckedChange={handleExcludeChange} />
            </div>
        </Card.Content>
    </Card.Root>

    <Button
        variant="outline"
        size="lg"
        class="flex items-center gap-1.5 text-red-500 max-w-2xl"
        on:click={(e) => (deleteConfirmationOpen = true)}
    >
        <Trash2 class="h-6 w-6" />
        Delete transaction
    </Button>

    <div class="h-20"></div>

    <Modal.Root bind:open={deleteConfirmationOpen}>
        <Modal.Content class="flex flex-col gap-4 justify-center">
            <Modal.Header>
                <Modal.Title>Confirm deletion</Modal.Title>
                <Modal.Description>
                    This transaction is stored only on your device, and so cannot be recovered once
                    deleted. Are you sure you want to proceed?
                </Modal.Description>
            </Modal.Header>
            <Modal.Footer class="flex flex-col gap-4">
                <Button variant="outline" on:click={() => (deleteConfirmationOpen = false)}>Cancel</Button>
                <Button variant="destructive" on:click={deleteTransaction}>Yes, delete it</Button>
            </Modal.Footer>
        </Modal.Content>
    </Modal.Root>

    <SelectCategory bind:open={selectCategoryOpen}
        {txnId}
        onCategorySelect={fetchData}
    />
{/if}
