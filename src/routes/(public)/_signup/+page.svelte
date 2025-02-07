<script lang="ts">
    import '../../../app.css'

    import { Button } from '$lib/components/ui/button'
    import { Input } from '$lib/components/ui/input'
    import { Label } from '$lib/components/ui/label'
    import { cn } from '$lib/utils'
    import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public'

    const CLIENT_ID = PUBLIC_GOOGLE_CLIENT_ID

    export let form

    let email = ''
    let password = ''
    let confirmPassword = ''
    let passwordError: string | null = null
</script>

<svelte:head>
    <script src="https://accounts.google.com/gsi/client" async></script>
    <meta name="google-signin-client_id" content={CLIENT_ID}> 
</svelte:head>

<div class="w-full md:grid md:grid-cols-2 h-svh">
    <div class="flex items-center justify-center py-12">
        <div class="mx-auto grid w-[350px] gap-6">
            <div class="grid gap-2 text-center">
                <h1 class="text-3xl font-bold">Sign up</h1>
                <p class="text-muted-foreground text-balance">
                    Create an account with ledgr to enable data sync across devices
                </p>
            </div>
            <div class="grid gap-8">
                <div>
                    <div id="g_id_onload" 
                        data-client_id={CLIENT_ID}
                        data-login_uri="http://localhost:5151/auth/callback"
                        >
                    </div>
                    <div class="g_id_signin"
                        data-type="standard"
                        data-size="large"
                        data-theme="outline"
                        data-text="signup_with"
                        data-width=400
                        data-shape="rectangular"
                        data-logo_alignment="left">
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex-1 border-t border-solid h-0"></div>
                    <div class="text-xs">OR</div>
                    <div class="flex-1 border-t border-solid"></div>
                </div>
                <form method="POST">
                    <div class="grid gap-6">
                        <div class="grid gap-2">
                            <Label for="email">Email</Label>
                            <Input id="email"
                                name="email"
                                type="email"
                                bind:value={email}
                                placeholder="Your email address"
                                required />
                        </div>
                        <div class="grid gap-2">
                            <div class="flex items-center">
                                <Label for="password">Password</Label>
                            </div>
                            <Input id="password"
                                name="password"
                                type="password"
                                bind:value={password}
                                placeholder="Your password"
                                minlength={12}
                                maxlength={256}
                                required />
                        </div>
                        <div class="grid gap-2">
                            <Label for="confirmPassword">Confirm password</Label>
                            <Input id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                bind:value={confirmPassword}
                                on:input={() => {
                                    if (password !== confirmPassword) {
                                        passwordError = 'Passwords do not match'
                                    } else {
                                        passwordError = null
                                    }
                                }}
                                minlength={12}
                                maxlength={256}
                                placeholder="Confirm your password"
                                required />
                            <p class={cn("text-red-500 text-sm opacity-0", passwordError && "opacity-100")}>{passwordError}</p>
                        </div>
                        {#if form?.error}
                            <p class="text-red-500 text-sm">{form.error}</p>
                        {/if}
                        <Button type="submit" class="w-full">Sign up</Button>
                    </div>
                </form>
            </div>
            <div class="mt-4 text-center text-sm">
                Already have an account?
                <a href="/login" class="underline">Log in</a>
            </div>
        </div>
    </div>
    <div class="bg-muted hidden lg:block">
        <img src="bg.svg" alt="background" class="h-full w-full object-cover" />
        <!-- <img
            src="/images/placeholder.svg"
            alt="placeholder"
            width="1920"
            height="1080"
            class="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        /> -->
    </div>
</div>
