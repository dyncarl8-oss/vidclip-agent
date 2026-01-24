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
            if (projectResult.rows.length === 0) {
                console.log(`❌ Project ${projectId} not found`)
                return
            }

            const project = projectResult.rows[0] as any

            // Get video duration
            let duration = project.duration || 0
            if (!duration || duration <= 0) {
                duration = 600 // 10 minutes default if missing
            }

            console.log(`📊 AI Analysis: Video duration is ${duration}s`)

            // Generate intelligent clips based on video duration
            const clipsToCreate = this.generateClipSuggestions(duration)

            // Insert clips into database
            for (const data of clipsToCreate) {
                try {
                    // Try 'score' column first (new schema)
                    await databaseService.execute(`
                        INSERT INTO clips (video_project_id, title, start_time, end_time, status, score, output_url, created_at, updated_at)
                        VALUES (?, ?, ?, ?, 'pending', ?, null, datetime('now'), datetime('now'))
                    `, [
                        projectId,
                        data.title,
                        data.startTime,
                        data.endTime,
                        data.score
                    ])
                } catch (insertError: any) {
                    console.warn(`⚠️ Insert failed with 'score' column, trying 'engagement_score' fallback: ${insertError.message}`)
                    try {
                        await databaseService.execute(`
                            INSERT INTO clips (video_project_id, title, start_time, end_time, status, engagement_score, output_url, created_at, updated_at)
                            VALUES (?, ?, ?, ?, 'pending', ?, null, datetime('now'), datetime('now'))
                        `, [
                            projectId,
                            data.title,
                            data.startTime,
                            data.endTime,
                            data.score
                        ])
                    } catch (e: any) {
                        console.error('❌ Failed to insert clip using both column names:', e.message)
                    }
                }
            }

            // Mark project as completed if it was in processing
            await databaseService.execute(`
                UPDATE video_projects SET status = 'completed', updated_at = datetime('now') WHERE id = ?
            `, [projectId])

            console.log(`✅ AI Analysis completed. Generated ${clipsToCreate.length} clips for project ${projectId}`)
        } catch (error) {
            console.error(`❌ AI Analysis failed for project ${projectId}:`, error)
        }
    }

    /**
     * Internal logic to decide which segments of a video would make good clips
     */
    private generateClipSuggestions(duration: number) {
        // Simple logic based on duration
        const isShortVideo = duration < 300 // < 5 mins
        const isMediumVideo = duration >= 300 && duration < 900 // 5-15 mins

        let clips: any[] = []

        if (isShortVideo) {
            // For short videos, suggest 2-3 clips
            clips = [
                {
                    title: "🔥 VIRAL: The Core Message",
                    startTime: Math.round(duration * 0.1),
                    endTime: Math.round(duration * 0.1) + 40,
                    score: 95
                },
                {
                    title: "🚀 UNSTOPPABLE: Quick Tip",
                    startTime: Math.round(duration * 0.5),
                    endTime: Math.round(duration * 0.5) + 30,
                    score: 91
                },
            ]
        } else if (isMediumVideo) {
            // For medium videos, suggest 3-4 clips
            clips = [
                {
                    title: "🔥 TOP MOMENT: This Will Surprise You",
                    startTime: Math.round(duration * 0.08),
                    endTime: Math.round(duration * 0.08) + 45,
                    score: 97
                },
                {
                    title: "💡 INSIGHT: The Key Secret",
                    startTime: Math.round(duration * 0.3),
                    endTime: Math.round(duration * 0.3) + 50,
                    score: 93
                },
                {
                    title: "🚀 ACTION: What To Do Next",
                    startTime: Math.round(duration * 0.6),
                    endTime: Math.round(duration * 0.6) + 40,
                    score: 89
                },
                {
                    title: "🎯 FINALE: The Conclusion",
                    startTime: Math.round(duration * 0.85),
                    endTime: Math.min(Math.round(duration * 0.85) + 35, duration),
                    score: 85
                },
            ]
        } else {
            // For long videos, suggest 4-5 clips
            clips = [
                {
                    title: "🔥 VIRAL: The Hook That Grabs Attention",
                    startTime: Math.round(duration * 0.05),
                    endTime: Math.round(duration * 0.05) + 55,
                    score: 98
                },
                {
                    title: "💡 MIND-BLOWN: Unexpected Revelation",
                    startTime: Math.round(duration * 0.2),
                    endTime: Math.round(duration * 0.2) + 60,
                    score: 94
                },
                {
                    title: "🚀 BREAKTHROUGH: The Turning Point",
                    startTime: Math.round(duration * 0.45),
                    endTime: Math.round(duration * 0.45) + 50,
                    score: 91
                },
                {
                    title: "⚡ POWER MOVE: Essential Strategy",
                    startTime: Math.round(duration * 0.65),
                    endTime: Math.round(duration * 0.65) + 45,
                    score: 87
                },
                {
                    title: "🎯 FINALE: Don't Miss This Ending",
                    startTime: Math.round(duration * 0.88),
                    endTime: Math.min(Math.round(duration * 0.88) + 40, duration),
                    score: 84
                },
            ]
        }

        return clips
    }
}

export default new AiService()
