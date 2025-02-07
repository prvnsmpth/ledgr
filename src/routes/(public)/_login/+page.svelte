<script lang="ts">
    import '../../../app.css'

    import { Button } from '$lib/components/ui/button'
    import { Input } from '$lib/components/ui/input'
    import { Label } from '$lib/components/ui/label'
    import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public'

    const CLIENT_ID = PUBLIC_GOOGLE_CLIENT_ID
</script>

<svelte:head>
    <script src="https://accounts.google.com/gsi/client" async></script>
    <meta name="google-signin-client_id" content={CLIENT_ID}> 
</svelte:head>

<div class="w-full md:grid md:grid-cols-2 h-svh">
    <div class="flex items-center justify-center py-12">
        <div class="mx-auto grid w-[350px] gap-6">
            <div class="grid gap-2 text-center">
                <h1 class="text-3xl font-bold">Log in</h1>
                <p class="text-muted-foreground text-balance">
                    Log in to your ledgr account to access your synced data
                </p>
            </div>
            <div class="grid gap-8">
                <!-- <Button variant="outline" class="w-full">Login with Google</Button> -->
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
                        data-text="signin_with"
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
                    <div class="grid gap-8">
                        <div class="grid gap-2">
                            <Label for="email">Email</Label>
                            <Input id="email" type="email" placeholder="Your email address" required />
                        </div>
                        <div class="grid gap-2">
                            <div class="flex items-center">
                                <Label for="password">Password</Label>
                                <a href="##" class="ml-auto inline-block text-sm underline">
                                    Forgot your password?
                                </a>
                            </div>
                            <Input id="password" type="password" placeholder="Your password" required />
                        </div>
                        <Button type="submit" class="w-full">Log in</Button>
                    </div>
                </form>
            </div>
            <div class="mt-4 text-center text-sm">
                Don&apos;t have an account?
                <a href="/signup" class="underline">Sign up</a>
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
