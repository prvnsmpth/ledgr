import { oauth2Service, sessionService, userService } from '$lib/server/db';
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { ulid } from 'ulid';
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public'

const CLIENT_ID = PUBLIC_GOOGLE_CLIENT_ID

// Called by Google after successful auth
export const GET: RequestHandler = async ({ request, url, cookies }) => {
    const code = url.searchParams.get('code')
    if (!code) {
        return new Response('Authorization code not found', { status: 400 })
    }

    const oauth2Client = oauth2Service.newClient()

    const getTokenResponse = await oauth2Client.getToken(code)
    console.log('Tokens:', getTokenResponse)

    const { tokens } = getTokenResponse
    if (!tokens.id_token) {
        return new Response('ID token not found', { status: 400 })
    }
    const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID
    })
    const payload = ticket.getPayload()
    if (!payload) {
        return new Response('Invalid ID token', { status: 400 })
    }

    const gUserId = payload['sub']
    const name = payload['name']
    const email = payload['email']
    const profilePictureUrl = payload['picture']
    
    if (!gUserId || !name || !email) {
        return new Response('Missing user information in ID token', { status: 400 })
    }

    const accessToken = tokens.access_token
    const refreshToken = tokens.refresh_token ?? undefined
    if (!accessToken) {
        return new Response('Access token not found', { status: 400 })
    }

    let userId = ulid()
    try {
        const existingGoogleUser = await userService.getUserByGoogleId(gUserId)
        const existingEmailUser = await userService.getUserByEmail(email)
        if (existingGoogleUser) {
            userId = existingGoogleUser.id;
        } else if (existingEmailUser) {
            userId = existingEmailUser.id;
        }
        await userService.createOrUpdateUser(userId, name, email, gUserId, profilePictureUrl, accessToken, refreshToken);
    } catch (error) {
        return new Response('Failed to create user', { status: 500 })
    }

    oauth2Client.setCredentials(tokens)
    oauth2Service.setClient(userId, oauth2Client)

    try {
        const sessionId = await sessionService.createSession(userId, Date.now() + 1000 * 60 * 60 * 24 * 30)

        // Set the session cookie
        cookies.set('session', sessionId, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 30,
            path: '/'
        })
    } catch (error) {
        return new Response(`Failed to create session: ${error}`, { status: 500 })
    }

    return redirect(302, '/settings')
}
