<script lang="ts">
    import { SupportedBank, AccountType } from '$lib/db'
    import { type Selected } from 'bits-ui'
    import * as Select from '$lib/components/ui/select'
    import { cn } from '$lib/utils'
    import { Label } from '$lib/components/ui/label'
    import { Input } from '$lib/components/ui/input'
    import { BankIcons } from './common'
    import * as RadioGroup from '$lib/components/ui/radio-group'

    export let bank: SupportedBank | undefined
    export let bankError: string | null = null
    let selectedBank: Selected<SupportedBank>
    $: bank = selectedBank?.value || undefined
    $: console.log(`Selected bank:`, selectedBank?.value, bank)

    export let accountName: string | null = null
    export let accountNameError: string | null = null

    export let accountType: AccountType = AccountType.Bank
</script>

<div class="flex flex-col gap-1.5">
    <Label class="text-xs text-muted-foreground uppercase font-bold">Bank</Label>
    <Select.Root
        selected={selectedBank}
        onSelectedChange={(v) => {
            v && (selectedBank = v)
            bankError = null
        }}>
        <Select.Trigger
            class={cn(
                'w-full col-span-3 justify-start gap-2',
                bankError && 'border-2 border-red-500 animate-shake'
            )}>
            <svelte:component this={BankIcons[bank]} />
            <Select.Value placeholder='Select your bank' class="flex-1 text-left" />
        </Select.Trigger>
        <Select.Content>
            {#each Object.entries(SupportedBank) as [key, val]}
                <Select.Item value={val} label={key} class="relative">
                    <div class="relative top-0 -left-2">
                        <svelte:component this={BankIcons[val]} />
                    </div>
                    {key}
                </Select.Item>
            {/each}
        </Select.Content>
    </Select.Root>
    <p class={cn('text-xs', bankError ? 'text-red-500' : 'text-muted-foreground')}>
        {bankError || "This will help parse bank statements correctly."}
    </p>
</div>
<div class="flex flex-col gap-1.5">
    <Label for="accountName" class="text-xs text-muted-foreground uppercase font-bold">
        Account Name (optional)
    </Label>
    <Input id="accountName"
        class="text-base focus-visible:ring-0"
        type="text"
        bind:value={accountName} />
    <p class={cn('text-xs', accountNameError ? 'text-red-500' : 'text-muted-foreground')}>
        {accountNameError || "An optional display name for this account."}
    </p>
    <p class={cn('text-xs text-muted-foreground')}>
    </p>
</div>
<div class="flex flex-col gap-1.5">
    <Label class="text-xs text-muted-foreground uppercase font-bold">Account Type</Label>
    <RadioGroup.Root class="col-span-3 flex gap-4" bind:value={accountType}>
        <div class="flex items-center gap-1">
            <RadioGroup.Item id="bank" value={AccountType.Bank} />
            <Label for="bank">Bank</Label>
        </div>
        <div class="flex items-center gap-1">
            <RadioGroup.Item id="creditCard" value={AccountType.CreditCard} />
            <Label for="creditCard">Credit Card</Label>
        </div>
    </RadioGroup.Root>
</div>