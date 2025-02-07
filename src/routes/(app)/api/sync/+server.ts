import { sessionService } from "$lib/server/db"
import { syncService } from "$lib/server/sync"
import type { LedgrData } from "$lib/server/types.js"
import { json } from "@sveltejs/kit"

// Called by the client to sync the server with the client
export const POST = async ({ request, cookies }) => {
    const sessionId = cookies.get('session')
    if (!sessionId) {
        return new Response('Unauthorized', { status: 401 })
    }

    const session = await sessionService.getSession(sessionId)
    if (!session) {
        return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.userId
    const data = await request.json()
    const resp = await syncService.sync(userId, data) as LedgrData
    return json(resp)
}