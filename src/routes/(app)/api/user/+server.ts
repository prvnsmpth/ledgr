import { sessionService, userService } from "$lib/server/db";
import { json } from "@sveltejs/kit";

export const GET = async ({ request, cookies }) => {
    const sessionId = cookies.get('session')
    if (!sessionId) {
        console.log('No sessionId')
        return json({ user: null })
    }

    const session = await sessionService.getSession(sessionId)
    if (!session) {
        console.log('Session ID not found')
        return json({ user: null })
    }

    const user = await userService.getUser(session.userId)
    if (!user) {
        console.log('User not found')
        return json({ user: null })
    }

    console.log('User found', user)
    return json({ user })
}