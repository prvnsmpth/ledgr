<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import { Calendar } from '$lib/components/ui/calendar'
    import * as Dialog from '$lib/components/ui/dialog'
    import { Input } from '$lib/components/ui/input'
    import { Label } from '$lib/components/ui/label'
    import * as Popover from '$lib/components/ui/popover'
    import * as RadioGroup from '$lib/components/ui/radio-group'
    import * as Select from '$lib/components/ui/select'
    import * as Modal from '$lib/components/ui/responsive-modal'
    import * as Tabs from '$lib/components/ui/tabs'
    import { Combobox } from '$lib/components/ui/combobox'

    import { BankIcons, getCategoryIcon } from '$lib/components/common'
    import CircleLoader from '$lib/components/loader-circle.svelte'
    import { Toaster } from '$lib/components/ui/sonner'
    import {
        AccountType,
        SupportedBank,
        StoreError,
        TransactionType,
        type Transaction,
        type TransactionKey
    } from '$lib/db'
    import { accounts, store, categories } from '$lib/db/store'
    import { ParseError, parseStatement } from '$lib/parser'
    import { cn, dateFormatter, TransactionUtils } from '$lib/utils'
    import { getLocalTimeZone, type DateValue } from '@internationalized/date'
    import type { Selected } from 'bits-ui'
    import {
        Calendar as CalendarIcon,
        CheckCheck,
        CheckCircle,
        CircleX,
        FileWarning,
        X,
        Plus
    } from 'lucide-svelte'
    import CreateAccountForm from '$lib/components/create-account-form.svelte'

    export let open: boolean
    export let preSelectedAccountId: IDBValidKey | null = null
    export let preSelectedAccountName: string | null = null

    let files: FileList | null = null
    $: selectedAccountId = preSelectedAccountId
        ? ({
              value: preSelectedAccountId,
              label: preSelectedAccountName as string
          } as Selected<IDBValidKey | null>)
        : undefined

    let accountId: IDBValidKey | null = null
    let accountName: string | undefined
    let bank: SupportedBank | undefined
    let accountType: AccountType = AccountType.Bank
    $: if (selectedAccountId?.value) {
        accountId = selectedAccountId.value
        accountError = null
        const selectedAccount = $accounts.find((acc) => acc.id === accountId)
        accountType = selectedAccount?.type || AccountType.Bank
        bank = selectedAccount?.bank || undefined
    }
    let selectedBank: Selected<SupportedBank | null> = { value: null }
    $: if (selectedBank?.value) {
        bank = selectedBank.value
        bankError = null
    }

    let fileError: string | null = null
    let accountError: string | null = null
    let bankError: string | null = null
    let accountNameError: string | null = null
    let busy = false
    let resultsDialogOpen = false
    type FileResult = {
        file: File
        numTransactions: number
        success: boolean
        error?: any
    }
    let fileResults: FileResult[] = []
    $: numSuccessfulFiles = fileResults.filter((fr) => fr.success).length
    $: numTxnsRead = fileResults.reduce((acc, fr) => acc + fr.numTransactions, 0)
    $: numFailedFiles = fileResults.filter((fr) => !fr.success).length
    $: allSuccess = numFailedFiles === 0
    $: partialSuccess = numSuccessfulFiles > 0 && numFailedFiles > 0

    // Add single transaction
    let date: DateValue | undefined
    let dateEl: HTMLDivElement
    let amount: number | undefined
    let amountEl: HTMLDivElement
    let description: string | undefined
    let descriptionEl: HTMLDivElement
    let txnType: TransactionType | undefined
    let txnTypeEl: HTMLDivElement
    let expenseCategory: string = 'untagged'
    let dateError: string | null = null
    let descriptionError: string | null = null
    let amountError: string | null = null
    let txnTypeError: string | null = null

    function handleInput(e: Event) {
        files = (e.target as HTMLInputElement)?.files
        if (files) {
            fileError = null
        }
    }

    async function handleUpload() {
        if (!selectedAccountId) {
            console.log('No account selected')
            accountError = 'Please select an account.'
            return
        } else if (selectedAccountId.value === null && !bank) {
            bankError = 'Please select your bank.'
            return
        }

        if (!files) {
            console.log('No files selected')
            fileError = 'Please select a file to upload.'
            return
        }

        if (!accountId && bank) {
            try {
                accountId = await createAccount(bank, accountName)
            } catch {
                return
            }
        } else if (!accountId) {
            accountError = 'Please select an account.'
            return
        } else if (!bank) {
            bankError = 'Please select your bank.'
            return
        }

        fileError = null
        accountError = null
        bankError = null

        fileResults = await store.importFiles(files, accountId, bank, accountType)
        await store.getTransactions()

        files = null
        accountId = null
        accountName = undefined
        bank = undefined
        open = false
        resultsDialogOpen = true
    }

    async function createAccount(bank: SupportedBank, name?: string): Promise<IDBValidKey> {
        try {
            return await store.createAccount({ name, bank, type: accountType })
        } catch (e: unknown) {
            console.log(`Error creating account: ${e}`, e)
            if (e instanceof StoreError) {
                accountNameError = 'Account with this name already exists.'
            }
            throw e
        }
    }

    async function handleAddSingle() {
        if (!date) {
            dateError = 'Please select a date.'
            dateEl?.scrollIntoView({ behavior: 'smooth' })
            return
        }

        if (!amount) {
            amountError = 'Please enter an amount.'
            amountEl?.scrollIntoView({ behavior: 'smooth' })
            return
        }

        if (!description) {
            descriptionError = 'Please enter a description.'
            descriptionEl?.scrollIntoView({ behavior: 'smooth' })
            return
        }

        if (!txnType) {
            txnTypeError = 'Please select a transaction type.'
            txnTypeEl?.scrollIntoView({ behavior: 'smooth' })
            return
        }

        if (!accountId && bank) {
            try {
                accountId = await createAccount(bank, accountName)
            } catch (e) {
                return
            }
        } else if (!accountId) {
            accountError = 'Please select an account.'
            return
        }

        const txnKey: TransactionKey = {
            date: date.toDate(getLocalTimeZone()),
            amount: typeof amount === 'number' ? amount : parseFloat(amount),
            description,
            txnType
        }

        const txn: Transaction = {
            id: TransactionUtils.getTransactionHash(txnKey),
            ...txnKey,
            accountId,
            expenseCategory: expenseCategory
        }

        try {
            await store.addTransactions([txn])
        } catch (e) {
            console.error(`Error saving transaction: ${e}`, e)
        }

        open = false
        date = undefined
        amount = undefined
        description = undefined
    }
</script>

<Modal.Root bind:open>
    <Modal.Content class="flex h-svh max-h-svh md:h-auto">
        <Tabs.Root value="import" class="flex-1 min-h-0 flex flex-col">
            <Tabs.List class="grid w-full grid-cols-2 mt-4 mb-1">
                <Tabs.Trigger value="import">Import</Tabs.Trigger>
                <Tabs.Trigger value="add_single">Add transaction</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="import" class="flex-1 min-h-0 overflow-y-auto">
                <Modal.Header>
                    <Modal.Title>Import bank statements</Modal.Title>
                    <Modal.Description>
                        <p class="my-1">Choose one or more bank/credit card statements downloaded from your Netbanking website.</p>
                        <p class="my-1">The statements should be in <b>Excel/CSV format</b>. Duplicate transactions will be overwritten.</p>
                    </Modal.Description>
                </Modal.Header>
                <div class="grid gap-6 py-4">
                    <div class="flex flex-col gap-1.5">
                        <Label class="text-xs text-muted-foreground uppercase font-bold">Account</Label>
                        <Select.Root
                            selected={selectedAccountId}
                            onSelectedChange={(v) => {
                                if (v) {
                                    selectedAccountId = v
                                }
                                accountError = null
                            }}>
                            <Select.Trigger
                                class={cn(
                                    'w-full col-span-3 justify-start gap-2',
                                    accountError && 'border-2 border-red-500 animate-shake'
                                )}>
                                {#if selectedAccountId?.value !== null && bank}
                                    <svelte:component this={BankIcons[bank]} width={16} height={16} />
                                {/if}
                                <Select.Value placeholder={'Select account'} class="flex-1 text-left" />
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value={null} class="flex gap-2">
                                    <Plus size={16} />
                                    New Account
                                </Select.Item>
                                {#each $accounts as acc}
                                    <Select.Item value={acc.id} label={acc.name || acc.bank.toUpperCase()}
                                    class="flex gap-2">
                                        <svelte:component this={BankIcons[acc.bank]} width={16} height={16} />
                                        {#if acc.name}
                                            <span>{acc.name}</span>
                                            <span class="text-xs uppercase text-muted-foreground">{acc.type.replaceAll("_", " ")}</span>
                                        {:else}
                                            <span class="uppercase">{acc.bank}</span>
                                            <span class="text-xs uppercase text-muted-foreground">{acc.type.replaceAll("_", " ")}</span>
                                        {/if}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                        <p class={cn('text-xs', accountError ? 'text-red-500' : 'text-muted-foreground')}>
                            {accountError || "The transactions will be imported under this account."}
                        </p>
                    </div>
                    {#if selectedAccountId?.value === null}
                        <CreateAccountForm bind:bank bind:bankError
                            bind:accountName bind:accountNameError bind:accountType />
                    {/if}
                    <div class={cn('flex flex-col gap-1.5')}>
                        <Label for="file" class="text-xs text-muted-foreground uppercase font-bold">
                            File(s)
                        </Label>
                        <Input
                            id="file"
                            class={cn(
                                'cursor-pointer',
                                fileError && 'border-2 border-red-500 animate-shake'
                            )}
                            type="file"
                            multiple
                            on:input={handleInput}
                        />
                        <p class={cn('text-red-500 text-xs', fileError ? 'visible' : 'invisible')}>
                            {fileError}
                        </p>
                    </div>
                </div>
                <Modal.Footer class="flex flex-col gap-4">
                    <Button 
                        class="plausible-event-name=ImportCancel"
                        variant="outline" on:click={() => (open = false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={busy}
                        on:click={async () => {
                            busy = true
                            try {
                                await handleUpload()
                                // @ts-ignore
                                window.plausible('ImportSuccess')
                            } catch (e) {
                                console.log(`Unhandled error: ${e}`, e)
                                // @ts-ignore
                                window.plausible('ImportFailure')
                            }
                            busy = false
                        }}
                        class="active:scale-95 transition-transform plausible-event-name=ImportSubmit"
                    >
                        {#if busy}
                            <CircleLoader />
                        {:else}
                            Import
                        {/if}
                    </Button>
                </Modal.Footer>
            </Tabs.Content>

            <!-- Add single transaction -->
            <Tabs.Content value="add_single" class="flex-1 min-h-0 overflow-y-auto">
                <Modal.Header>
                    <Modal.Title>Add a transaction</Modal.Title>
                    <Modal.Description>
                        Record transactions that are not covered by your bank statements.
                    </Modal.Description>
                </Modal.Header>
                <div class="flex flex-col gap-4 py-4">
                    <div class="flex flex-col gap-1.5" bind:this={dateEl}>
                        <Label class="text-xs text-muted-foreground uppercase font-bold">Date</Label>
                        <Popover.Root openFocus>
                            <Popover.Trigger asChild let:builder>
                                <Button
                                    variant="outline"
                                    class={cn(
                                        'justify-start text-left font-base',
                                        !date && 'text-muted-foreground',
                                        dateError && 'border-2 border-red-500 animate-shake'
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
                                    onValueChange={(v) => {
                                        if (v) {
                                            date = v
                                            dateError = null
                                        }
                                    }}
                                    initialFocus
                                />
                            </Popover.Content>
                        </Popover.Root>
                        <p class={cn('text-red-500 text-xs', dateError ? 'visible' : 'invisible')}>
                            {dateError}
                        </p>
                    </div>
                    <div class="flex flex-col gap-1.5" bind:this={amountEl}>
                        <Label
                            for="amount"
                            class="text-xs text-muted-foreground uppercase font-bold">
                            Amount
                        </Label>
                        <div class="flex items-center gap-1.5 relative">
                            <span class="absolute left-0 h-full top-1.5 text-xl px-3">₹</span>
                            <Input
                                id="amount"
                                type="number"
                                class={cn(
                                    'text-base pl-8 focus-visible:ring-0',
                                    amountError && 'border-2 border-red-500 animate-shake'
                                )}
                                bind:value={amount}
                                step="0.01"
                                on:input={(e) => {
                                    // @ts-expect-error: Ignore the error
                                    if (e.target?.value) {
                                        amountError = null
                                    }
                                }}
                            />
                        </div>
                        <p
                            class={cn(
                                'text-red-500 text-xs',
                                amountError ? 'visible' : 'invisible'
                            )}
                        >
                            {amountError}
                        </p>
                    </div>
                    <div class="flex flex-col gap-1.5" bind:this={descriptionEl}>
                        <Label
                            for="description"
                            class="text-xs text-muted-foreground uppercase font-bold">
                            Description
                        </Label>
                        <Input
                            id="description"
                            class={cn(
                                'text-base focus-visible:ring-0',
                                descriptionError && 'border-2 border-red-500 animate-shake'
                            )}
                            type="text"
                            bind:value={description}
                            on:input={(e) => {
                                // @ts-ignore
                                if (e.target?.value) {
                                    descriptionError = null
                                }
                            }}
                        />
                        <p
                            class={cn(
                                'text-red-500 text-xs',
                                descriptionError ? 'visible' : 'invisible'
                            )}
                        >
                            {descriptionError}
                        </p>
                    </div>
                    <div class="flex flex-col gap-2" bind:this={txnTypeEl}>
                        <Label class="text-xs text-muted-foreground uppercase font-bold">Transaction Type</Label>
                        <RadioGroup.Root
                            class="flex gap-4"
                            bind:value={txnType}
                            onValueChange={() => (txnTypeError = null)}
                        >
                            <div class="flex items-center gap-1">
                                <RadioGroup.Item id="debit" value={TransactionType.Debit} />
                                <Label for="debit">Debit</Label>
                            </div>
                            <div class="flex items-center gap-1">
                                <RadioGroup.Item id="credit" value={TransactionType.Credit} />
                                <Label for="credit">Credit</Label>
                            </div>
                        </RadioGroup.Root>
                        <p
                            class={cn(
                                'text-red-500 text-xs',
                                txnTypeError ? 'visible' : 'invisible'
                            )}
                        >
                            {txnTypeError}
                        </p>
                    </div>
                    <div class="flex flex-col gap-2 pb-4">
                        <Label class="text-xs text-muted-foreground uppercase font-bold">
                            Expense Category
                        </Label>
                        <div class="flex flex-wrap gap-2 max-h-72 overflow-y-auto">
                            {#each $categories as category}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    class={cn(
                                        'flex gap-1.5 text-muted-foreground font-bold text-xs focus-visible:ring-0',
                                        expenseCategory === category.value
                                            ? 'bg-gray-300 hover:bg-gray-300 text-primary'
                                            : ''
                                    )}
                                    on:click={() => {
                                        if (expenseCategory === category.value) {
                                            expenseCategory = 'untagged'
                                        } else {
                                            // @ts-ignore
                                            expenseCategory = category
                                        }
                                    }}
                                >
                                    <!-- <svelte:component this={icon} size={18} /> -->
                                    <span>{category.value.replaceAll("_", " ")}</span>
                                </Button>
                            {/each}
                        </div>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <Label class="text-xs text-muted-foreground uppercase font-bold">Account</Label>
                        <Select.Root
                            selected={selectedAccountId}
                            onSelectedChange={(v) => {
                                v && (selectedAccountId = v)
                                accountError = null
                            }}
                        >
                            <Select.Trigger
                                class={cn(
                                    'w-full col-span-3 justify-start gap-2',
                                    accountError && 'border-2 border-red-500 animate-shake'
                                )}>
                                {#if selectedAccountId?.value !== null && bank}
                                    <svelte:component this={BankIcons[bank]} width={16} height={16} />
                                {/if}
                                <Select.Value placeholder={'Select account'} class="flex-1 text-left" />
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value={null} class="flex gap-2">
                                    <Plus size={16} />
                                    New Account
                                </Select.Item>
                                {#each $accounts as acc}
                                    <Select.Item value={acc.id} label={acc.name || acc.bank.toUpperCase()}
                                    class="flex gap-2">
                                        <svelte:component this={BankIcons[acc.bank]} width={16} height={16} />
                                        {#if acc.name}
                                            <span>{acc.name}</span>
                                        {:else}
                                            <span class="uppercase">{acc.bank}</span>
                                        {/if}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                        <p
                            class={cn(
                                'text-red-500 text-xs',
                                accountError ? 'visible' : 'invisible'
                            )}
                        >
                            {accountError}
                        </p>
                    </div>
                    {#if selectedAccountId?.value === null}
                        <CreateAccountForm bind:bank bind:bankError
                            bind:accountName bind:accountNameError bind:accountType />
                    {/if}
                </div>
                <Modal.Footer class="flex flex-col gap-4">
                    <Button variant="outline" on:click={() => (open = false)}>Cancel</Button>
                    <Button
                        disabled={busy}
                        on:click={async () => {
                            busy = true
                            try {
                                await handleAddSingle()
                                // @ts-ignore
                                window.plausible('AddSingleTxnSuccess')
                            } catch (e) {
                                console.log(`Unhandled error: ${e}`, e)
                                // @ts-ignore
                                window.plausible('AddSingleTxnFailure')
                            }
                            busy = false
                        }}
                        class="active:scale-95 transition-transform plausible-event-name=AddSingleTxnSubmit"
                    >
                        {#if busy}
                            <CircleLoader />
                        {:else}
                            Add
                        {/if}
                    </Button>
                </Modal.Footer>
            </Tabs.Content>
        </Tabs.Root>
    </Modal.Content>
</Modal.Root>

<!-- Dialog to show the result -->
<Dialog.Root bind:open={resultsDialogOpen} onOpenChange={(o) => !o && (fileResults = [])}>
    <Dialog.Content class="max-w-xs md:max-w-fit max-h-full flex flex-col">
        <Dialog.Header class="pt-4">
            <Dialog.Title class="flex items-center gap-2">
                {#if allSuccess}
                    <CheckCircle class="text-green-500" />
                    Import successful
                {:else if partialSuccess}
                    <FileWarning class="text-yellow-500" />
                    So close, yet so far
                {:else}
                    <CircleX class="text-red-500" />
                    Aw, snap!
                {/if}
            </Dialog.Title>
            <Dialog.Description class="text-left">
                {#if allSuccess}
                    All transactions successfully imported
                {:else if partialSuccess}
                    We ran into some issues importing some files
                {:else}
                    We couldn't import your transactions
                {/if}
            </Dialog.Description>
        </Dialog.Header>
        {#if allSuccess}
            <div class="text-md text-muted-foreground font-semibold">
                Imported {numTxnsRead} transactions from {numSuccessfulFiles} file(s)
            </div>
        {/if}
        <div class="flex flex-col gap-1.5 overflow-y-auto max-h-96">
            {#each fileResults as fr}
                {#if fr.success}
                    <div
                        class="flex flex-col gap-2 items-start p-2 border-2 border-green-500 rounded-md"
                    >
                        <div class="font-semibold flex gap-1.5 break-all">
                            <CheckCheck class="text-green-500" />
                            {fr.file.name.slice(0, 50)}{fr.file.name.length > 50 ? '...' : ''}
                        </div>
                        <div class="text-xs">Imported {fr.numTransactions} transactions.</div>
                    </div>
                {:else}
                    <div
                        class="flex flex-col gap-2 items-start p-2 border-2 border-red-500 rounded-md"
                    >
                        <div class="font-semibold flex gap-1.5 break-all">
                            <X class="text-red-500" />
                            {fr.file.name.slice(0, 50)}{fr.file.name.length > 50 ? '...' : ''}
                        </div>
                        <div class="text-xs">
                            {#if fr.error instanceof ParseError || fr.error instanceof StoreError}
                                <span>{fr.error.message}</span>
                            {:else}
                                <span>Unknown error</span>
                            {/if}
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
        <Dialog.Footer>
            <Button
                on:click={() => {
                    resultsDialogOpen = false
                    fileResults = []
                }}>Close</Button
            >
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<Toaster position="top-center" />
