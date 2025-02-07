import type { LayoutLoad } from "./$types"
import type { User } from "$lib/server/types"

export const prerender = true
export const ssr = false

export const load: LayoutLoad = async () => {
    const resp = await fetch('/api/user')
    const respData = await resp.json()
    const user = respData.user as User
    return {
        user
    }
}
