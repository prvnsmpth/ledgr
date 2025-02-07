import sqlite3 from 'sqlite3'
import type { Session, User } from './types'
import { ulid } from 'ulid'
import { OAuth2Client } from 'google-auth-library'
import { env } from '$env/dynamic/private'
import fs from 'fs'

export class UserService {

    private db: sqlite3.Database

    constructor() {
        fs.mkdirSync('ledgr_data', { recursive: true })
        this.db = new sqlite3.Database('ledgr_data/ledgr.db')

        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    google_id TEXT,
                    name TEXT,
                    email TEXT,
                    profile_picture_url TEXT,
                    access_token TEXT,
                    refresh_token TEXT
                )
            `)
        })
    }

    private createUserFromRow(row: any): User | null {
        return row ? {
            id: row.id,
            googleId: row.google_id,
            name: row.name,
            email: row.email,
            profilePictureUrl: row.profile_picture_url,
            accessToken: row.access_token,
            refreshToken: row.refresh_token
        } : null;
    }

    getUser(id: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.createUserFromRow(row));
                }
            });
        });
    }

    getUserByGoogleId(googleId: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM users WHERE google_id = ?`, [googleId], (err, row: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(this.createUserFromRow(row));
                }
            })
        })
    }

    getUserByEmail(email: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(this.createUserFromRow(row));
                }
            })
        })
    }

    createOrUpdateUser(
        id: string,
        name: string, 
        email: string, 
        googleId?: string,
        profilePictureUrl?: string,
        accessToken?: string, 
        refreshToken?: string
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            let query = `INSERT OR REPLACE INTO users (id, name, email`;
            let params = [id, name, email];

            if (googleId) {
                query += `, google_id`;
                params.push(googleId);
            }

            if (profilePictureUrl) {
                query += `, profile_picture_url`;
                params.push(profilePictureUrl);
            }

            if (accessToken) {
                query += `, access_token`;
                params.push(accessToken);
            }

            if (refreshToken) {
                query += `, refresh_token`;
                params.push(refreshToken);
            }

            query += `) VALUES (${params.map(() => '?').join(', ')})`;

            this.db.run(query, params, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(id);
                }
            });
        });
    }
}

export class SessionService {
    private db: sqlite3.Database

    constructor() {
        this.db = new sqlite3.Database('ledgr_data/sessions.db')

        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    expires_at INTEGER,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `)
        })
    }

    async createSession(userId: string, expiresAt: number = Date.now() + 1000 * 60 * 60 * 24 * 30): Promise<string> {
        const existingSession = await this.getSessionByUserId(userId)
        if (existingSession) {
            this.deleteSession(existingSession.id)
        }

        const id = ulid()
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`, [id, userId, expiresAt], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(id);
                }
            });
        });
    }

    getSession(id: string): Promise<Session | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM sessions WHERE id = ?`, [id], (err, row: any) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        if (row.expires_at < Date.now()) {
                            this.deleteSession(id)
                            resolve(null)
                        } else {
                        const session = {
                            id: row.id,
                            userId: row.user_id,
                            expiresAt: row.expires_at
                        }
                        resolve(session);
                    }
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    getSessionByUserId(userId: string): Promise<Session | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM sessions WHERE user_id = ?`, [userId], (err, row: any) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        if (row.expires_at < Date.now()) {
                            this.deleteSession(row.id)
                            resolve(null)
                        } else {
                            const session = {
                                id: row.id,
                                userId: row.user_id,
                                expiresAt: row.expires_at
                            }
                            resolve(session);
                        }
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    deleteSession(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM sessions WHERE id = ?`, [id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

export class OAuth2Service {
    private maxEntries: number = 50
    private clientMap: Map<string, OAuth2Client>
    private lruList: string[]
    private userService: UserService

    private CLIENT_ID = env.PUBLIC_GOOGLE_CLIENT_ID
    private CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET
    private REDIRECT_URI = env.PUBLIC_GOOGLE_REDIRECT_URI

    constructor(userService: UserService) {
        this.userService = userService
        this.clientMap = new Map()
        this.lruList = []
    }

    async getClient(userId: string): Promise<OAuth2Client | null> {
        let client = this.clientMap.get(userId)
        if (!client) {
            const user = await this.userService.getUser(userId)
            if (!user) {
                return null
            }
            client = new OAuth2Client(this.CLIENT_ID, this.CLIENT_SECRET, this.REDIRECT_URI)
            client.setCredentials({
                access_token: user.accessToken,
                refresh_token: user.refreshToken
            })
            this.setClient(userId, client)
        }
        this.updateLRU(userId)
        return client
    }

    setClient(userId: string, client: OAuth2Client) {
        if (this.clientMap.size >= this.maxEntries && !this.clientMap.has(userId)) {
            const lruUserId = this.lruList.shift()
            if (lruUserId) this.clientMap.delete(lruUserId)
        }

        this.clientMap.set(userId, client)
        this.updateLRU(userId)
    }

    newClient(): OAuth2Client {
        return new OAuth2Client(this.CLIENT_ID, this.CLIENT_SECRET, this.REDIRECT_URI)
    }

    private updateLRU(userId: string) {
        const index = this.lruList.indexOf(userId)
        if (index > -1) {
            this.lruList.splice(index, 1)
        }
        this.lruList.push(userId)
    }
}

const userService = new UserService()
const sessionService = new SessionService()
const oauth2Service = new OAuth2Service(userService)

export { userService, sessionService, oauth2Service }
