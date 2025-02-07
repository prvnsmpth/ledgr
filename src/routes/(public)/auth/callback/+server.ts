import { json, redirect } from '@sveltejs/kit'
import { OAuth2Client } from 'google-auth-library'
import { type User } from '$lib/server/types'
import { userService } from '$lib/server/db'
import { ulid } from 'ulid'
import { env } from '$env/dynamic/private'

async function verifyIdToken(idToken: string): Promise<User> {
    const CLIENT_ID = env.PUBLIC_GOOGLE_CLIENT_ID
    const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET
    const REDIRECT_URI = env.PUBLIC_GOOGLE_REDIRECT_URI

    const oauth2Client = new OAuth2Client({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI
    })

    const ticket = await oauth2Client.verifyIdToken({
        idToken,
        audience: CLIENT_ID
    })
    const payload = ticket.getPayload()
    if (!payload) {
        throw new Error('Invalid ID token')
    }
    console.log('Payload:', payload)

    const id = payload['sub']
    const name = payload['name']
    const email = payload['email']

    if (!id || !name || !email) {
        throw new Error('Missing user information in ID token')
    }

    return { id, name, email }
}

// This will be called on login with Google
export async function POST({ request, cookies, url }) {
    const csrfTokenCookie = cookies.get('g_csrf_token')
    if (!csrfTokenCookie) {
        return new Response('CSRF token not found in cookie', { status: 400 })
    }

    const body = await request.formData()
    const csrfToken = body.get('g_csrf_token') as string
    if (!csrfToken) {
        return new Response('CSRF token not found in body', { status: 400 })
    }

    if (csrfToken !== csrfTokenCookie) {
        return new Response('Failed to verify double submit CSRF token', { status: 400 })
    }

    const idToken = body.get('credential') as string 
    const user = await verifyIdToken(idToken)

    console.log('User:', user)
    await userService.createOrUpdateUser(ulid(), user.name, user.email, user.id)

    redirect(302, '/')
}