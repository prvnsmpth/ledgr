<script lang="ts">
    import { isMobile } from './responsive';

    import * as Sheet from '$lib/components/ui/sheet'
    import * as Dialog from '$lib/components/ui/dialog'

	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	type $$Props = HTMLAttributes<HTMLDivElement>;

	let className: $$Props["class"] = undefined;
	export { className as class };
</script>

{#if $isMobile}
    <Sheet.Footer class={className} {...$$restProps}>
        <slot />
    </Sheet.Footer>
{:else}
    <Dialog.Footer class={className} {...$$restProps}>
        <slot />
    </Dialog.Footer>
{/if}

