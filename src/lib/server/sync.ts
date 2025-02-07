import { drive, type drive_v3 } from "@googleapis/drive"
import { oauth2Service } from "./db"
import type { LedgrData } from "./types"

type DataOrVersion = LedgrData | { version: number }

function isLedgrData(data: DataOrVersion): data is LedgrData {
    return (data as LedgrData).transactions !== undefined && (data as LedgrData).accounts !== undefined
}

export class SyncService {
    private folderName: string = 'ledgr_data'
    private numBackupsToKeep: number = 10

    constructor() {
    }

    async listBackups(userId: string, numBackups: number = 1): Promise<drive_v3.Schema$File[]> {
        const oauth2Client = await oauth2Service.getClient(userId)
        if (!oauth2Client) {
            throw new Error('No client found for user')
        }
        const gdrive = drive({ version: 'v3', auth: oauth2Client })
        const folderId = await this.getOrCreateFolder(gdrive, this.folderName)
        const filesRes = await gdrive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
            orderBy: 'modifiedTime desc',
            pageSize: numBackups
        })
        
        return filesRes.data.files || []
    }

    async sync(userId: string, data: DataOrVersion): Promise<DataOrVersion> {
        const oauth2Client = await oauth2Service.getClient(userId)
        if (!oauth2Client) {
            throw new Error('No client found for user')
        }

        const latestBackup = await this.listBackups(userId, 1)
        if (latestBackup.length === 0) {
            if (isLedgrData(data)) {
                await this.createBackup(userId, data)
                return { version: data.version }
            } else {
                return { version: 0 } // Signal to the client to send data in the next call
            }
        } else {
            const latestBackupFile = latestBackup[0]
            const latestBackupFileName = latestBackupFile.name
            const latestBackupFileId = latestBackupFile.id
            if (!latestBackupFileId || !latestBackupFileName || !latestBackupFileName.startsWith('backup_')) {
                throw new Error('Invalid backup file')
            }
            const latestBackupVersion = parseInt(latestBackupFileName.split('_')[1])
            const clientVersion = data.version

            if (latestBackupVersion < clientVersion) {
                if (isLedgrData(data)) {
                    await this.createBackup(userId, data)
                    return { version: clientVersion }
                } else {
                    return { version: latestBackupVersion } // Signal to the client to send data in the next call
                }
            } else if (latestBackupVersion > clientVersion) {
                // Server has a newer backup, send it to the client
                return await this.downloadBackup(userId, latestBackupFileId)
            } else {
                // Client and server are in sync
                return { version: clientVersion }
            }
        }
    }

    async createBackup(userId: string, data: LedgrData): Promise<string> {
        const oauth2Client = await oauth2Service.getClient(userId)
        if (!oauth2Client) {
            throw new Error('No client found for user')
        }
        const gdrive = drive({ version: 'v3', auth: oauth2Client })
        const folderId = await this.getOrCreateFolder(gdrive, this.folderName)
        const res = await gdrive.files.create({
            requestBody: {
                name: `backup_${data.version}.json`,
                mimeType: 'application/json',
                parents: [folderId],
            },
            media: {
                body: JSON.stringify(data),
            },
        })

        await this.deleteOldBackups(gdrive, folderId)

        return res.data.name!
    }

    async downloadBackup(userId: string, backupName: string): Promise<LedgrData> {
        const oauth2Client = await oauth2Service.getClient(userId)
        if (!oauth2Client) {
            throw new Error('No client found for user')
        }
        const gdrive = drive({ version: 'v3', auth: oauth2Client })
        const res = await gdrive.files.get({
            fileId: backupName,
            alt: 'media'
        }, { responseType: 'arraybuffer' })
        const backupData = Buffer.from(res.data as ArrayBuffer).toString('utf-8')
        return JSON.parse(backupData) as LedgrData
    }

    private async getOrCreateFolder(gdrive: drive_v3.Drive, folderName: string): Promise<string> {
        const res = await gdrive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
            fields: 'files(id, name)',
        })

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!
        }

        const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        }

        const folder = await gdrive.files.create({
            requestBody: folderMetadata,
            fields: 'id',
        })

        return folder.data.id!
    }

    private async deleteOldBackups(gdrive: drive_v3.Drive, folderId: string): Promise<void> {
        const res = await gdrive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name)',
            orderBy: 'modifiedTime desc',
        })

        if (res.data.files && res.data.files.length > this.numBackupsToKeep) {
            const filesToDelete = res.data.files.slice(this.numBackupsToKeep)
            for (const file of filesToDelete) {
                await gdrive.files.delete({ fileId: file.id! })
            }
        }
    }
    
}

export const syncService = new SyncService()
