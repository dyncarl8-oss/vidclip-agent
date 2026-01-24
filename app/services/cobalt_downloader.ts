import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'

/**
 * CobaltDownloader - Uses the Cobalt.tools API to download YouTube videos.
 * This service handles all bot detection externally, bypassing Render IP blocks.
 */
class CobaltDownloader {
    private downloadDir: string
    private apiEndpoint: string = 'https://api.cobalt.tools/api/json'

    constructor() {
        this.downloadDir = path.join(process.cwd(), 'storage', 'downloads')
        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true })
        }
    }

    /**
     * Download a YouTube video using Cobalt API
     */
    async downloadVideo(youtubeUrl: string, projectId: number, quality: string = '720'): Promise<{ success: boolean; filePath?: string; error?: string }> {
        console.log(`🌐 Cobalt: Attempting download for project ${projectId}`)

        try {
            // Step 1: Get download URL from Cobalt API
            console.log(`🔗 Cobalt: Requesting download link...`)
            const downloadInfo = await this.getDownloadUrl(youtubeUrl, quality)

            if (!downloadInfo.url) {
                throw new Error(downloadInfo.error || 'Failed to get download URL from Cobalt')
            }

            console.log(`✅ Cobalt: Got download URL, starting file download...`)

            // Step 2: Download the file
            const videoId = this.extractVideoId(youtubeUrl)
            const filename = `${videoId}_${quality}p_cobalt.mp4`
            const filePath = path.join(this.downloadDir, filename)

            await this.downloadFile(downloadInfo.url, filePath)

            // Verify file
            if (!fs.existsSync(filePath)) {
                throw new Error('Downloaded file not found')
            }

            const stats = fs.statSync(filePath)
            if (stats.size < 10000) { // Less than 10KB is probably an error
                fs.unlinkSync(filePath)
                throw new Error('Downloaded file is too small, likely an error page')
            }

            console.log(`✅ Cobalt: Download complete! File: ${filePath} (${Math.round(stats.size / 1024 / 1024)}MB)`)
            return { success: true, filePath }

        } catch (error: any) {
            console.error(`❌ Cobalt download failed: ${error.message}`)
            return { success: false, error: error.message }
        }
    }

    /**
     * Request download URL from Cobalt API
     */
    private async getDownloadUrl(youtubeUrl: string, quality: string): Promise<{ url?: string; error?: string }> {
        return new Promise((resolve) => {
            const postData = JSON.stringify({
                url: youtubeUrl,
                vQuality: quality,
                aFormat: 'mp3',
                filenamePattern: 'basic',
                isAudioOnly: false,
                tiktokFullAudio: false,
                isNoTTWatermark: true,
                isTTFullHD: false,
                disableMetadata: false
            })

            const options = {
                hostname: 'api.cobalt.tools',
                port: 443,
                path: '/api/json',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 30000
            }

            const req = https.request(options, (res) => {
                let data = ''
                res.on('data', chunk => data += chunk)
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data)
                        if (json.status === 'stream' || json.status === 'redirect') {
                            resolve({ url: json.url })
                        } else if (json.status === 'picker' && json.picker && json.picker.length > 0) {
                            // Multiple formats available, pick the first video
                            const videoItem = json.picker.find((p: any) => p.type === 'video') || json.picker[0]
                            resolve({ url: videoItem.url })
                        } else if (json.status === 'error') {
                            resolve({ error: json.text || 'Cobalt API error' })
                        } else {
                            resolve({ error: `Unknown Cobalt response: ${json.status}` })
                        }
                    } catch (e) {
                        resolve({ error: `Failed to parse Cobalt response: ${data.substring(0, 200)}` })
                    }
                })
            })

            req.on('error', (e) => resolve({ error: `Request failed: ${e.message}` }))
            req.on('timeout', () => {
                req.destroy()
                resolve({ error: 'Request timed out' })
            })

            req.write(postData)
            req.end()
        })
    }

    /**
     * Download file from URL to disk
     */
    private async downloadFile(url: string, destPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destPath)
            const protocol = url.startsWith('https') ? https : http

            const request = protocol.get(url, { timeout: 300000 }, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location
                    if (redirectUrl) {
                        file.close()
                        fs.unlinkSync(destPath)
                        return this.downloadFile(redirectUrl, destPath).then(resolve).catch(reject)
                    }
                }

                if (response.statusCode !== 200) {
                    file.close()
                    fs.unlinkSync(destPath)
                    return reject(new Error(`HTTP ${response.statusCode}`))
                }

                response.pipe(file)

                file.on('finish', () => {
                    file.close()
                    resolve()
                })
            })

            request.on('error', (err) => {
                file.close()
                if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
                reject(err)
            })

            request.on('timeout', () => {
                request.destroy()
                file.close()
                if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
                reject(new Error('Download timed out'))
            })
        })
    }

    private extractVideoId(url: string): string {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
        return match ? match[1] : `video_${Date.now()}`
    }
}

export default new CobaltDownloader()
