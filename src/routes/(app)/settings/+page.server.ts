import { syncService } from "$lib/server/sync"
import { oauth2Service, sessionService, userService } from "$lib/server/db"
import type { LedgrData } from "$lib/server/types"
import { type RequestEvent, fail, redirect } from "@sveltejs/kit"
import { OAuth2Client } from "google-auth-library"
import type { PageServerLoad } from "./$types"
import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_GOOGLE_REDIRECT_URI } from "$env/static/public"
import { env } from '$env/dynamic/private'

export const load: PageServerLoad = async ({ cookies }: RequestEvent) => {
    const sessionId = cookies.get('session')
    if (!sessionId) {
        return {}
    }

    const session = await sessionService.getSession(sessionId)
    if (!session) {
        return {}
    }

    const user = await userService.getUser(session.userId)
    if (!user) {
        return {}
    }

    return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userProfilePictureUrl: user.profilePictureUrl,
    }
}

export const actions = {
    connectGoogleDrive: async ({ cookies }: RequestEvent) => {
        const CLIENT_ID = PUBLIC_GOOGLE_CLIENT_ID
        const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET
        const REDIRECT_URI = PUBLIC_GOOGLE_REDIRECT_URI

        const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/drive.file'
            ],
            prompt: 'consent',
        })

        console.log('Redirecting to:', url)
        redirect(302, url)
    },

    disconnectGoogleDrive: async ({ cookies }: RequestEvent) => {
        const sessionId = cookies.get('session')
        if (!sessionId) {
            return {}
        }

        console.log('Disconnecting Google Drive for session:', sessionId)
        await sessionService.deleteSession(sessionId)
        cookies.delete('session', { path: '/' })
        return { success: true }
    },

    backupData: async ({ request, cookies }: RequestEvent) => {
        console.log('Backup data')
        const formData = await request.formData()
        const jsonString = formData.get('data') as string
        let backupData: LedgrData
        try {
            backupData = JSON.parse(jsonString) as LedgrData
            console.log('Backup data:', backupData)
        } catch (error) {
            console.error('Error parsing backup data:', error)
            return fail(400, { success: false, error: 'Invalid backup data' })
        }

        const sessionId = cookies.get('session')
        if (!sessionId) {
            console.log('No session ID')
            return {}
        }

        const session = await sessionService.getSession(sessionId)
        if (!session) {
            console.log('No session')
            return {}
        }

        const user = await userService.getUser(session.userId)
        if (!user) {
            console.log('No user')
            return {}
        }

        const oauth2Client = await oauth2Service.getClient(user.id)
        if (!oauth2Client) {
            console.log('No oauth2 client')
            return {}
        }

        console.log('Creating backup')
        try {
            const filename = await syncService.createBackup(user.id, backupData)
            console.log('Backup created:', filename)
        } catch (error) {
            console.error('Error creating backup:', error)
            return fail(500, { success: false, error: 'Failed to create backup' })
        }

        return { success: true }
    }
}