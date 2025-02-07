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