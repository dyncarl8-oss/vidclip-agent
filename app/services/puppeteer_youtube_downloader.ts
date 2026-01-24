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
            // DYNAMIC PATH DISCOVERY for Render (Version-Agnostic)
            let executablePath: string | undefined = undefined

            const findChromeInDir = (dir: string): string | null => {
                if (!fs.existsSync(dir)) return null
                try {
                    const files = fs.readdirSync(dir)
                    for (const file of files) {
                        const fullPath = path.join(dir, file)
                        const stat = fs.statSync(fullPath)
                        if (stat.isDirectory()) {
                            const found = findChromeInDir(fullPath)
                            if (found) return found
                        } else if (file === 'chrome' && (fullPath.includes('chrome-linux') || dir.endsWith('chrome-linux64'))) {
                            return fullPath
                        }
                    }
                } catch (e) { /* ignore restricted dirs */ }
                return null
            }

            const possibleRoots = ['/opt/render/.cache/puppeteer', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']
            for (const root of possibleRoots) {
                if (root.startsWith('/usr/bin')) {
                    if (fs.existsSync(root)) { executablePath = root; break; }
                } else {
                    const found = findChromeInDir(root)
                    if (found) { executablePath = found; break; }
                }
            }

            console.log(`🚀 Puppeteer: System check... ${executablePath ? `Found Chrome at ${executablePath}` : 'Chrome not found, using default'}`)

            browser = await puppeteer.launch({
                headless: true,
                executablePath,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
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
