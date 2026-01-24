import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

class PuppeteerYouTubeDownloader {
    private downloadPath: string

    constructor() {
        this.downloadPath = path.join(process.cwd(), 'storage', 'downloads')
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true })
        }
    }

    /**
     * Emergency fallback downloader using Puppeteer
     * This tries to use a secondary service if direct download is blocked
     */
    async downloadVideo(url: string, projectId: number): Promise<{ success: boolean; filePath?: string; error?: string }> {
        console.log(`🕵️ Puppeteer: Attempting emergency download for project ${projectId}`)

        let browser
        try {
            // Path where 'npx puppeteer browsers install chrome' puts it on Render
            const renderChromePath = '/opt/render/.cache/puppeteer/chrome/linux-144.0.7559.96/chrome-linux64/chrome'
            const executablePath = (fs as any).existsSync(renderChromePath) ? renderChromePath : undefined

            browser = await puppeteer.launch({
                headless: true,
                executablePath,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            })

            const page = await browser.newPage()

            // We'll use a public downloader service as a proxy
            // This is more reliable for Cloud IPs which are blocked by YouTube
            console.log(`🔗 Puppeteer: Navigating to downloader service...`)
            await page.goto('https://en.savefrom.net/1-youtube-video-downloader-524/', { waitUntil: 'networkidle2' })

            await page.type('#id_url', url)
            await page.click('#sf_submit')

            console.log(`⏳ Puppeteer: Waiting for download links...`)
            await page.waitForSelector('.download-icon', { timeout: 30000 })

            const downloadUrl = await page.evaluate(() => {
                const link = (globalThis as any).document.querySelector('.download-icon')
                return link ? link.href : null
            })

            if (!downloadUrl) {
                throw new Error('Could not find download link')
            }

            console.log(`✅ Puppeteer: Found download URL, downloading file...`)

            // Download the file
            const videoPath = path.join(this.downloadPath, `project_${projectId}_puppeteer.mp4`)
            const response = await page.goto(downloadUrl)
            const buffer = await response?.buffer()

            if (buffer) {
                fs.writeFileSync(videoPath, buffer)
                await browser.close()
                return { success: true, filePath: videoPath }
            }

            throw new Error('Failed to download video buffer')

        } catch (error: any) {
            console.error(`❌ Puppeteer download failed: ${error.message}`)
            if (browser) await browser.close()
            return { success: false, error: error.message }
        }
    }
}

export default new PuppeteerYouTubeDownloader()
