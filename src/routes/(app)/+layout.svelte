<script lang="ts">
    import '../../app.css'

    import { page } from '$app/stores'
    import { PUBLIC_APP_HOST } from '$env/static/public'
    import { ClientSyncService } from '$lib/client/sync'
    import Import from '$lib/components/import.svelte'
    import Loader from '$lib/components/loader.svelte'
    import { storeInitialized } from '$lib/db/store'
    import { cn } from '$lib/utils'
    import {
        ChartLine,
        CircleX,
        ExternalLink,
        Home,
        IndianRupee,
        Settings,
        SquarePlus,
        Tags,
        Wand2
    } from 'lucide-svelte'
    import { onDestroy } from 'svelte'
    import { quintInOut } from 'svelte/easing'
    import { slide } from 'svelte/transition'
    import type { LayoutData } from './$types'

    const navItems = {
        '/': {
            name: 'Dashboard',
            icon: Home,
            isLink: true,
            showOnDesktop: true
        },
        '/transactions': {
            name: 'Transactions',
            icon: IndianRupee,
            isLink: true,
            showOnDesktop: true
        },
        '/categories': {
            name: 'Categories',
            icon: Tags,
            isLink: true,
            showOnDesktop: true
        },
        '/smart-tagging': {
            name: 'Smart Tag',
            icon: Wand2,
            isLink: true,
            showOnDesktop: true
        },
        '/add': {
            name: 'Add',
            icon: SquarePlus,
            isLink: false,
            showOnDesktop: false
        },
        '/analytics': {
            name: 'Analytics',
            icon: ChartLine,
            isLink: true,
            showOnDesktop: true
        },
        '/settings': {
            name: 'Settings',
            icon: Settings,
            isLink: true,
            showOnDesktop: true
        }
    }

    $: currentPath = $page.url.pathname

    let uploadDialogOpen: boolean = false

    const currentHostname = window.location.host
    const isDemo = currentHostname.startsWith('demo.')

    let showDemoBanner = true
    let syncService: ClientSyncService
    export let data: LayoutData

    $: if (data.user) {
        syncService = new ClientSyncService()
        syncService.start()
    }

    onDestroy(() => {
        if (syncService) {
            syncService.close()
        }
    })
</script>

<svelte:head>
    <script defer data-domain={window.location.hostname} src="https://stats.ledgr.money/js/script.tagged-events.js"></script>
    <script>window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }</script>
</svelte:head>

{#if !$storeInitialized}
    <div class="flex flex-1 h-svh justify-center items-center">
        <Loader />
    </div>
{:else}
    {#if isDemo && showDemoBanner}
        <div 
            transition:slide={{ delay: 250, duration: 300, easing: quintInOut, axis: 'y' }}
            class="flex gap-8 justify-center items-center bg-lime-600 text-primary-foreground py-2 px-2">
            <div class="flex-1 font-semibold text-xs md:text-center">
                This is a demo site. To get started with your own data:
                <a target="_blank" href={`https://${PUBLIC_APP_HOST}`} class="inline-flex gap-1">
                    <span class="underline">click here</span>
                    <ExternalLink size={14} />
                </a>
            </div>
            <button class="justify-self-end text-xs font-semibold underline" on:click={() => showDemoBanner = false}>
                <CircleX size={18} />
            </button>
        </div>
    {/if}
    <div class="flex md:grid min-h-svh w-svw md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <!-- Desktop Nav -->
        <div class="hidden md:block border-r bg-card">
            <div class="flex h-full max-h-screen flex-col gap-2">
                <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <a href="/" class="flex items-center gap-2 font-bold tracking-wide text-2xl">
                        <!-- <Wallet class="h-7 w-7" /> -->
                        <img src="/ledgr-favicon-2.png" alt="Ledgr" class="h-7 w-7" />
                        <span class="">ledgr</span>
                    </a>
                    <!-- <Button variant="outline" size="icon" class="ml-auto h-8 w-8">
                        <Bell class="h-4 w-4" />
                        <span class="sr-only">Toggle notifications</span>
                    </Button> -->
                </div>
                <div class="flex-1">
                    <nav class="grid items-start px-2 text-sm font-medium lg:px-4">
                        {#each Object.entries(navItems) as [path, entry]}
                            {#if entry.showOnDesktop}
                                <a href={path} class={cn(
                                    `flex items-center gap-3 rounded-lg px-3 py-2 transition-all`,
                                    currentPath === path
                                        ? 'bg-muted text-primary'
                                        : 'text-muted-foreground hover:text-primary'
                                )}>
                                    <svelte:component this={entry.icon} class="h-4 w-4" />
                                    {entry.name}
                                </a>
                            {/if}
                        {/each}
                    </nav>
                </div>
                <!-- <div class="mt-auto p-4">
                    <Card.Root>
                        <Card.Header class="p-2 pt-0 md:p-4">
                            <Card.Title>Upgrade to Pro</Card.Title>
                            <Card.Description>
                                Unlock all features and get unlimited access to our support team.
                            </Card.Description>
                        </Card.Header>
                        <Card.Content class="p-2 pt-0 md:p-4 md:pt-0">
                            <Button size="sm" class="w-full">Upgrade</Button>
                        </Card.Content>
                    </Card.Root>
                </div> -->
            </div>
        </div>

        <!-- Desktop -->
        <div class="hidden md:flex flex-col h-screen">
            <!-- <header class="flex shrink-0 h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6">
                <div class="w-full flex-1">
                    <form>
                        <div class="relative">
                            <Search class="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                            <Input
                                type="search"
                                placeholder="Search transactions..."
                                class="bg-background w-full appearance-none pl-8 shadow-none md:w-2/3 lg:w-1/3"
                            />
                        </div>
                    </form>
                </div>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                        <Button builders={[builder]} variant="secondary" size="icon" class="rounded-full">
                            <CircleUser class="h-5 w-5" />
                            <span class="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        <DropdownMenu.Label>My Account</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item>Settings</DropdownMenu.Item>
                        <DropdownMenu.Item>Support</DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item>Logout</DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </header> -->
            <main class="flex flex-1 min-h-0 flex-col gap-4 px-4 lg:gap-6 lg:px-6 bg-muted/40 overflow-y-auto">
                <slot />
            </main>
        </div>

        <!-- Mobile -->
        <div class="flex flex-1 min-h-0 max-w-full flex-col md:hidden">
            <main class="flex flex-1 min-h-0 max-w-full flex-col gap-4 px-4 bg-muted/40">
                <slot />
            </main>
            <nav class={cn("flex border-t justify-between fixed bottom-0 w-full bg-card z-50 transition-all")}>
                {#each Object.entries(navItems) as [path, entry]}
                    {#if entry.isLink}
                        <a href={path} class={cn(
                            `flex items-center gap-3 px-3 py-2 transition-all`,
                            currentPath === path ? 'bg-muted text-primary border-t-2 border-primary' : 'text-muted-foreground/60 hover:text-primary'
                        )}>
                            <svelte:component this={entry.icon} class="h-6 w-6 m-2" strokeWidth={2.5} />
                        </a>
                    {:else}
                        <button class={cn(
                            `flex items-center gap-3 px-3 py-2 transition-all plausible-event-name=ImportModalOpen`,
                            currentPath === path ? 'bg-muted text-primary border-t-2 border-primary' : 'text-muted-foreground/60 hover:text-primary'
                            )}
                            on:click={() => uploadDialogOpen = true}
                        >
                            <svelte:component this={entry.icon} class="h-6 w-6 m-2" strokeWidth={2.5} />
                        </button>
                    {/if}
                {/each}
            </nav>

            <!-- Txn upload sheet -->
            <Import bind:open={uploadDialogOpen} />
        </div>
    </div>
{/if}
