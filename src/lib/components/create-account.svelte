<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import * as Modal from '$lib/components/ui/responsive-modal'
    import { AccountType, StoreError, SupportedBank } from '$lib/db'
    import { store } from '$lib/db/store'
    import CreateAccountForm from './create-account-form.svelte'

    export let open = false

    let bank: SupportedBank | undefined
    let bankError: string | null = null

    let accountName: string
    let accountNameError: string | null = null

    let accountType: AccountType = AccountType.Bank

    async function handleCreate() {
        if (!bank) {
            bankError = 'Please select a bank'
            return
        }

        try {
            await store.createAccount({ name: accountName, bank, type: accountType })
        } catch (e) {
            if (e instanceof StoreError) {
                accountNameError = "An account with this name already exists"
            }
        }
        open = false
    }
</script>

<!-- <Dialog.Root bind:open={open}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Add account</Dialog.Title>
            <Dialog.Description>Add a bank or credit card account to track transactions under it.</Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="accountName" class="text-right">Account Name</Label>
                <Input id="accountName" class="col-span-3" type="text" bind:value={accountName} />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="accountName" class="text-right">Account Type</Label>
                <RadioGroup.Root class="col-span-3 flex gap-4" bind:value={accountType}>
                    <div class="flex items-center gap-1">
                        <RadioGroup.Item id="bank" value={AccountType.Bank}>Bank</RadioGroup.Item>
                        <Label for="bank">Bank</Label>
                    </div>
                    <div class="flex items-center gap-1">
                        <RadioGroup.Item id="creditCard" value={AccountType.CreditCard}>Credit Card</RadioGroup.Item>
                        <Label for="creditCard">Credit Card</Label>
                    </div>
                </RadioGroup.Root>
            </div>
        </div>
        <Dialog.Footer>
            <Button variant="outline" size="sm" on:click={() => open = false}>Cancel</Button>
            <Button size="sm" on:click={handleCreate}>Add account</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root> -->

<Modal.Root bind:open={open}>
    <Modal.Content>
        <Modal.Header>
            <Modal.Title>Add account</Modal.Title>
            <Modal.Description>Add a bank or credit card account to track transactions under it.</Modal.Description>
        </Modal.Header>
        <div class="flex flex-col gap-4 pt-4 pb-8">
            <CreateAccountForm bind:bank bind:bankError bind:accountName bind:accountNameError bind:accountType />
        </div>
        <Modal.Footer class="flex flex-col gap-4">
            <Button variant="outline" on:click={() => open = false}>Cancel</Button>
            <Button on:click={handleCreate}>Add account</Button>
        </Modal.Footer>
    </Modal.Content>
</Modal.Root>