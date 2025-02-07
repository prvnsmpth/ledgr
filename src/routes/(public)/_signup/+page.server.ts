import { fail } from '@sveltejs/kit'
import { userService, sessionService } from '$lib/server/db'
import { ulid } from 'ulid'

export const actions = {
    default: async ({ request, cookies }) => {
        const formData = await request.formData()
        const email = formData.get('email')
        const password = formData.get('password')
        const confirmPassword = formData.get('confirmPassword')

        console.log(email, password, confirmPassword)

        if (password !== confirmPassword) {
            return fail(400, { error: 'Passwords do not match' })
        }

        if (!email || !password || !confirmPassword) {
            return fail(400, { error: 'All fields are required' })
        }

        try {
            const userId = await userService.createOrUpdateUser(ulid(), email as string, password as string)
            if (!userId) {
                return fail(500, { error: 'Oops! We couldn\'t create your account. Please try again later or contact support if the problem persists.' })
            }

            const session = await sessionService.createSession(userId)
            cookies.set('session', session, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            })
        } catch (error) {
            console.error(error)
            return fail(500, { error: 'Failed to create user' })
        }

        return { success: true }
    }
}