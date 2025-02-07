import { sessionService } from '$lib/server/db'
import { syncService } from '$lib/server/sync'
import type { BackupFile } from '$lib/server/types'
import { json } from '@sveltejs/kit'

export const GET = async ({ request, cookies }) => {
    const sessionId = cookies.get('session')
    if (!sessionId) {
        return new Response('Unauthorized', { status: 401 })
    }

    const session = await sessionService.getSession(sessionId)
    if (!session) {
        return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.userId
    const backups = await syncService.listBackups(userId)
    const backupFiles: BackupFile[] = backups.map(backup => ({
        id: backup.id!,
        name: backup.name!,
        createdAt: backup.createdTime!,
        modifiedAt: backup.modifiedTime!
    }))

    return json(backupFiles)
}