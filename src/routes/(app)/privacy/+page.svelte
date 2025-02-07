<script lang="ts">
    import { Lock } from 'lucide-svelte';
</script>

<div class="max-w-3xl mx-auto pb-40">
    <div class="flex flex-col gap-16">
        <div class="flex flex-col gap-2 items-center">
            <Lock class="w-10 h-10 mt-12" />
            <h1 class="text-2xl font-bold">Privacy Policy</h1>
        </div>
    
        <section class="flex flex-col gap-4">
            <h2 class="text-xl font-bold">1. Introduction</h2>
            <p>This Privacy Policy describes how we handle your data when you use ledgr.</p>
        </section>
    
        <section class="flex flex-col gap-4">
            <h2 class="text-xl font-bold">2. Information Collection</h2>
            <p class="font-bold">We do not collect or store any financial data, period.</p>
            <ul>
                <li>All data is stored on your device only. If you so choose, you may connect your Google Drive account to sync your data across devices.</li>
                <li>If you connect your Google Drive account, we will store your name, email address and Google Drive credentials to enable syncing. This data is only used to enable syncing and is not used for any other purpose.</li>
                <li>We also collect usage data to improve the app. We use Plausible - a privacy-friendly web analytics service - to collect usage data. This data is only used to improve the app and is not used for any other purpose.</li>
            </ul>
        </section>

        <section class="flex flex-col gap-4">
            <h2 class="text-xl font-bold">3. Information Use</h2>
            <p>We do not use any data for any purpose.</p>
        </section>

        <section class="flex flex-col gap-4">
            <h2 class="text-xl font-bold">4. Information Sharing</h2>
            <p>We do not share any data with anyone.</p>
        </section>

        <section class="flex flex-col gap-4">
            <h2 class="text-xl font-bold">5. Data Security</h2>
            <p>We do not store any data, so there is no risk of data loss.</p>
        </section>

        <section class="flex flex-col gap-4">
            <h2 class="text-xl font-bold">6. Changes to this Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. If we make any changes, we will notify you via email or by posting the updated policy on our app.</p>
        </section>

        <section class="flex flex-col gap-4">
            <h2 class="text-xl font-bold">7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:hello@ledgr.app" class="underline">hello@ledgr.app</a>.</p>
        </section>
    </div>
</div>
