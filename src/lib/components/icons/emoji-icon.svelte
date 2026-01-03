<script lang="ts">
    export let emoji: string = '❓';
    export let size: number = 24;
</script>

<span
    class="inline-flex items-center justify-center"
    style="font-size: {size * 0.75}px; width: {size}px; height: {size}px; line-height: 1;"
>
    {emoji}
</span>
