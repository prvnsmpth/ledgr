<script lang="ts">
    import { isMobile } from './responsive';

    import * as Sheet from '$lib/components/ui/sheet'
    import * as Dialog from '$lib/components/ui/dialog'

    export let open = false
</script>

{#if $isMobile}
    <Sheet.Root bind:open {...$$restProps}>
        <slot />
    </Sheet.Root>
{:else}
    <Dialog.Root bind:open {...$$restProps}>
        <slot />
    </Dialog.Root>
{/if}

