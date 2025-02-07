<script lang="ts">
    import { isMobile } from './responsive';

    import * as Sheet from '$lib/components/ui/sheet'
    import * as Dialog from '$lib/components/ui/dialog'
</script>

{#if $isMobile}
    <Sheet.Title>
        <slot />
    </Sheet.Title>
{:else}
    <Dialog.Title>
        <slot />
    </Dialog.Title>
{/if}

