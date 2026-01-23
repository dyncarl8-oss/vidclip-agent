import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
    async run() {
        // Create a default user with ID 1
        const user = await User.query().where('id', 1).first()
        if (!user) {
            await User.create({
                id: 1,
                fullName: 'Default User',
                email: 'user@example.com',
                password: 'password123'
            })
            console.log('✅ Default user created')
        }
    }
}
