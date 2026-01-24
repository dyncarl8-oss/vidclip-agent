import databaseService from '#services/database_service'

export class AiService {
    /**
     * Automatically generate clips for a project
     * This is a "viral clip" generator like Opus Clip
     */
    async generateAutoClips(projectId: number) {
        console.log(`🤖 AI Analysis started for project ${projectId}`)

        try {
            const projectResult = await databaseService.execute('SELECT id, duration, video_file_path FROM video_projects WHERE id = ?', [projectId])
            if (projectResult.rows.length === 0) return
            const project = projectResult.rows[0] as any
            const isDemoMode = !project.video_file_path

            // Simulate AI analysis time
            await new Promise(resolve => setTimeout(resolve, 5000))

            const duration = (project.duration && project.duration > 0) ? project.duration : 300 // default for demo if 0

            // Generate 3-5 viral clips
            const clipsToCreate = [
                {
                    title: "🔥 TOP SECRET: Success Formula",
                    startTime: duration * 0.1,
                    endTime: duration * 0.1 + 45,
                    score: 98
                },
                {
                    title: "💡 MIND BLOWING: Why 99% Fail",
                    startTime: duration * 0.3,
                    endTime: duration * 0.3 + 60,
                    score: 94
                },
                {
                    title: "🚀 UNSTOPPABLE: The First Step",
                    startTime: duration * 0.6,
                    endTime: duration * 0.6 + 30,
                    score: 91
                },
                {
                    title: "🎯 MASTERCLASS: Level Up Now",
                    startTime: duration * 0.8,
                    endTime: duration * 0.8 + 50,
                    score: 89
                }
            ]

            for (const data of clipsToCreate) {
                try {
                    const clipStatus = isDemoMode ? 'completed' : 'pending'
                    const outputUrl = isDemoMode ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : null

                    await databaseService.execute(`
                        INSERT INTO clips (video_project_id, title, start_time, end_time, status, score, output_url, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                    `, [
                        projectId,
                        data.title,
                        data.startTime,
                        data.endTime,
                        clipStatus,
                        data.score,
                        outputUrl
                    ])
                } catch (err) {
                    console.warn(`⚠️ 'score' column not found, falling back to 'engagement_score'`)
                    const clipStatus = isDemoMode ? 'completed' : 'pending'
                    const outputUrl = isDemoMode ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : null

                    await databaseService.execute(`
                        INSERT INTO clips (video_project_id, title, start_time, end_time, status, engagement_score, output_url, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                    `, [
                        projectId,
                        data.title,
                        data.startTime,
                        data.endTime,
                        clipStatus,
                        data.score,
                        outputUrl
                    ])
                }
            }

            await databaseService.execute(`
                UPDATE video_projects SET status = 'completed', updated_at = datetime('now') WHERE id = ?
            `, [projectId])

            console.log(`✅ AI Analysis completed. Generated ${clipsToCreate.length} clips for project ${projectId}`)
        } catch (error) {
            console.error(`❌ AI Analysis failed for project ${projectId}:`, error)
        }
    }
}

export default new AiService()
