<script lang="ts">
    import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public'
    import { ClientSyncService } from '$lib/client/sync'
    import { BankIcons } from '$lib/components/common'
    import CreateAccount from '$lib/components/create-account.svelte'
    import * as Avatar from '$lib/components/ui/avatar'
    import { Button } from '$lib/components/ui/button'
    import * as Card from '$lib/components/ui/card'
    import * as Dialog from '$lib/components/ui/dialog'
    import * as Modal from '$lib/components/ui/responsive-modal'
    import { accounts, store, storeInitialized } from '$lib/db/store'
    import { dateTimeFormatter } from '$lib/utils'
    import { CheckCheck, Plus, X } from 'lucide-svelte'
    import { onMount } from 'svelte'
    import type { PageData } from './$types'

    function sanitizeName(name: string): string {
        return name.replace(/[^a-zA-Z0-9]/g, ' ')
    }

    let resultDialogOpen = false
    let confirmationSheetOpen = false
    let createAccountDialogOpen = false
    let deleteAllError = false

    function reset() {
        resultDialogOpen = false
        confirmationSheetOpen = false
        createAccountDialogOpen = false
        deleteAllError = false
    }

    async function deleteAllData() {
        try {
            console.log(`Attempting to delete all data...`)
            await store.deleteAllData()
            confirmationSheetOpen = false
            resultDialogOpen = true
            console.log(`Successfully deleted all data`)
        } catch (e) {
            console.error(`Failed to delete all data:`, e)
            deleteAllError = true
        }
    }

    const CLIENT_ID = PUBLIC_GOOGLE_CLIENT_ID
    export let data: PageData

    let checkingLastSync = true
    let lastSync: number

    onMount(async () => {
        if ($storeInitialized) {
            await fetchLastSync()
        }
    })

    async function fetchLastSync() {
        checkingLastSync = true
        const metadata = await store.getMetadata()
        lastSync = metadata.lastSync
        checkingLastSync = false
    }

    let syncing = false
    const syncService = new ClientSyncService()
    async function handleSyncNow() {
        syncing = true
        await syncService.sync()
        syncing = false
        await fetchLastSync()
    }

    let googleLoginEnabled = true
</script>

<svelte:head>
    <script src="https://accounts.google.com/gsi/client" async></script>
    <meta name="google-signin-client_id" content={CLIENT_ID}> 
</svelte:head>

<div class="font-bold text-3xl bg-gray-50 sticky top-0 z-50 py-2 mt-10 w-full">Settings</div>

<div class="flex flex-1 min-h-0 flex-col gap-8 md:gap-16">
    <div class="flex flex-col gap-2">
        <h1 class="text-xl">Your Accounts</h1>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-screen-md auto-rows-fr">
            {#each $accounts as account}
                <div class="flex gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                    <div class="p-1">
                        <svelte:component this={BankIcons[account.bank]} width={24} height={24} />
                    </div>
                    <div class="flex-1 flex flex-col">
                        <span class="text-md font-semibold uppercase">{account.name || account.bank}</span>
                        <span class="text-xs uppercase font-semibold text-muted-foreground">
                            {sanitizeName(account.type)}
                        </span>
                    </div>
                </div>
            {/each}
            <button
                class="flex items-center bg-card p-4 rounded-lg border-2 border-dashed shadow-sm gap-1.5 text-muted-foreground font-semibold active:scale-95 transition-transform"
                on:click={e => createAccountDialogOpen = true}>
                <Plus size={18} />
                Create account
            </button>
        </div>
    </div>

    {#if googleLoginEnabled}
        <div class="flex flex-col gap-2">
            <h1 class="text-xl">Sync</h1>
            <p class="text-muted-foreground text-sm">Sync data to your Google Drive to access it across all your devices.</p>
            {#if data.userId}
                <div class="flex flex-col gap-2 my-4">
                    <Card.Root class="max-w-96">
                        <Card.Header class="p-4">
                            <Card.Title>
                                <div class="">Logged in as </div>
                            </Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <div class="flex items-center gap-4">
                                <Avatar.Root>
                                    <Avatar.Image src={data.userProfilePictureUrl} alt="User Profile Picture" />
                                    <Avatar.Fallback>
                                        {data.userName.charAt(0).toUpperCase()}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                                <div class="flex flex-col">
                                    <div class="text-md font-semibold">{data.userName} </div>
                                    <div class="text-muted-foreground text-sm">{data.userEmail}</div>
                                </div>
                            </div>
                        </Card.Content>
                        <Card.Footer class="p-4 pt-0">
                            <form method="POST" action="?/disconnectGoogleDrive">
                                <Button type="submit" variant="outline" size="sm" class="max-w-60 flex gap-2 active:scale-95 transition-transform">
                                    Disconnect Account
                                </Button>
                            </form>
                        </Card.Footer>
                    </Card.Root>
                </div>

                <div class="flex flex-col gap-2 my-4">
                    <Card.Root class="max-w-96">
                        <Card.Header class="p-4">
                            <Card.Title class="flex items-center gap-2">
                                Sync status
                            </Card.Title>
                            <Card.Description>
                                {#if checkingLastSync}
                                    <div class="text-sm">Checking for backups...</div>
                                {:else if !lastSync}
                                    <div class="text-sm">No sync history</div>
                                {:else}
                                    <div class="text-sm">Last sync: {dateTimeFormatter.format(new Date(lastSync))}</div>
                                {/if}
                            </Card.Description>
                        </Card.Header>
                        <Card.Footer class="p-4 pt-0">
                            <Button variant="outline" size="sm" class="max-w-60 flex gap-2 active:scale-95 transition-transform" disabled={syncing} on:click={handleSyncNow}>
                                {#if syncing}
                                    Syncing...
                                {:else}
                                    Sync now
                                {/if}
                            </Button>
                        </Card.Footer>
                    </Card.Root>
                </div>
            {:else}
                <form method="POST" action="?/connectGoogleDrive">
                    <Button type="submit" variant="outline" size="lg" class="max-w-60 flex gap-2">
                        <img src="https://zapier-images.imgix.net/storage/services/a5b8a9920e9dae8a73711590e7090d3d.png?auto=format&fit=crop&ixlib=react-9.8.1&q=50&w=30&h=30&dpr=1" alt="Google Drive Icon" />
                        Connect Google Drive
                    </Button>
                </form>
            {/if}
        </div>
    {/if}

    <div class="flex flex-col gap-2">
        <h1 class="text-xl">Danger Zone</h1>
        <div class="flex flex-col border p-4 rounded-lg gap-4 max-w-96 bg-card">
            <div class="flex flex-1 flex-col">
                <h1 class="text-lg font-semibold">Delete all data</h1>
                <p class="text-xs text-muted-foreground">This action is irreversible.</p>
            </div>
            <Button variant="destructive" size="sm" on:click={e => confirmationSheetOpen = true}>
                Delete all data
            </Button>
        </div>
    </div>

    <div class="h-24"></div>
</div>

<!-- Confirmation -->
<Modal.Root bind:open={confirmationSheetOpen}>
    <Modal.Content class="flex flex-col gap-4 justify-center">
        <Modal.Header>
            <Modal.Title>Confirm deletion</Modal.Title>
            <Modal.Description>
                <p class="text-sm my-1">All data stored on this device will be deleted. </p>
                <p class="text-sm my-1">Your backups on Google Drive, if any, will not be deleted. You can restore them later.</p>
                <p class="text-sm my-1">Are you sure you want to proceed?</p>
            </Modal.Description>
        </Modal.Header>
        <Modal.Footer class="flex flex-col gap-4">
            <Button variant="outline" on:click={() => confirmationSheetOpen = false}>Cancel</Button>
            <Button variant="destructive" on:click={deleteAllData}>
                Yes, delete everything
            </Button>
        </Modal.Footer>
    </Modal.Content>
</Modal.Root>

<!-- Show this after all data is deleted -->
<Dialog.Root bind:open={resultDialogOpen}>
    <Dialog.Content class="max-w-xs max-h-full flex flex-col">
        <Dialog.Header class="pt-4">
            <Dialog.Title class="flex items-center gap-2">
                {#if deleteAllError}
                    <X size={24} class="text-red-500" />
                    Oops, something went wrong.
                {:else}
                    <CheckCheck size={24} class="text-green-500" />
                    All data deleted
                {/if}
            </Dialog.Title>
            <Dialog.Description class="text-left">
                {#if deleteAllError}
                    <p class="mb-2">Please try again.</p>
                    <p>If it still doesn't work, clear browser storage for this website and your data will be removed.</p>
                {:else}
                    <p>Sometimes you have to start afresh.</p>
                {/if}
            </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
            <Button variant="outline" on:click={reset}>OK</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<CreateAccount bind:open={createAccountDialogOpen} />

