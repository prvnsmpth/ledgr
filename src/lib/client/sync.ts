import { store, storeInitialized } from "$lib/db/store"

export class ClientSyncService {

    private intervalTimout: NodeJS.Timeout | null = null
    private lastSyncVersion: number | null = null
    private syncInterval: number = 120_000

    start() {
        storeInitialized.subscribe(async (isInitialized) => {
            if (isInitialized) {
                this.sync()
                this.intervalTimout = setInterval(async () => {
                    this.sync()
                }, this.syncInterval)
            }
        })
    }

    async sync() {
        const currentVersion = await store.getVersion()
        if (currentVersion > 0 && this.lastSyncVersion === currentVersion) {
            console.log('Synced at version:', currentVersion)
            await store.setLastSync(Date.now())
            return
        }

        const resp = await fetch('/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ version: currentVersion })
        })
        const data = await resp.json()

        console.log(`Sync service. Data version: ${data.version}, current version: ${currentVersion}`)
        if (data.version < currentVersion) {
            // Server is behind the client, so we need to send the data to the server
            const ledgrData = await store.export()
            await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ledgrData)
            })
            this.lastSyncVersion = ledgrData.version
        } else if (data.version > currentVersion) {
            // Server is ahead of the client, so we need to update the client
            await store.import(data)
            this.lastSyncVersion = data.version
        } else {
            this.lastSyncVersion = currentVersion
        }

        await store.setLastSync(Date.now())
    }

    async close() {
        if (this.intervalTimout) {
            clearInterval(this.intervalTimout)
        }
    }
}