<script lang="ts">
    import URLs from "$lib/urls.svelte";
    import { BarLoader } from "svelte-loading-spinners";
</script>

<div class="w-full h-full flex justify-center text-white">
    <div class="flex flex-col justify-center gap-2">
        <div class="p-5 rounded-lg bg-foreground flex flex-col"
            style="width: min(1000px, 90vw); min-height: min(250px, 90vh);">
            {#if URLs.errored}
                <div class="text-base sm:text-xl md:text-3xl font-bold">Failed to load urls</div>
            {:else if URLs.currentUrl}
                <div class="text-base sm:text-xl md:text-3xl font-bold wrap-break-word">
                    {URLs.currentUrl.url}
                </div>
                <div class="grow mb-5 text-sm sm:text-base">
                    {URLs.currentUrl.category}
                </div>
                <div class="flex w-full items-center gap-2.5 text-base sm:text-lg
                *:rounded-md sm:*:rounded-xl *:bg-white *:text-black *:px-2 *:py-1 sm:*:px-5 sm:*:py-2.5">
                    {#if URLs.backStack.length > 0}
                        <button onclick={() => URLs.back()}>Back</button>
                    {/if}
                    <div class="grow bg-transparent!"></div>
                    <a target="_blank" href={URLs.currentUrl.url}>Open</a>
                    <a target="_blank" href="https://web.archive.org/web/*/{URLs.currentUrl.url}">Archive.org</a>
                    <button onclick={() => URLs.next()}>Next</button>
                </div>
            {:else}
                <div class="text-3xl font-bold mb-1">
                    Loading urls...
                </div>
                <BarLoader size="120" color="white" />
            {/if}
        </div>
        {#if URLs.categories.length > 0}
            <select class="bg-foreground p-2 w-60 rounded-lg"
                bind:value={URLs.category} onchange={() => URLs.updateCategory()}>
                <option value="*">All sites</option>
                {#each URLs.categories as category}
                    <option value={category}>{category}</option>
                {/each}
            </select>
        {/if}
    </div>
</div>