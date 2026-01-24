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
     */
    async downloadVideo(url: string, projectId: number): Promise<{ success: boolean; filePath?: string; error?: string }> {
        console.log(`🕵️ Puppeteer: Attempting emergency download for project ${projectId}`)

        let browser
        try {
            // AGGRESSIVE PERMISSION-AWARE SCANNER
            let executablePath: string | undefined = undefined

            const scan = (dir: string, depth = 0): string | null => {
                if (depth > 4 || !fs.existsSync(dir)) return null
                try {
                    const entries = fs.readdirSync(dir, { withFileTypes: true })
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry.name)
                        try {
                            if (entry.isDirectory()) {
                                const found = scan(fullPath, depth + 1)
                                if (found) return found
                            } else if (entry.name === 'chrome' || entry.name === 'google-chrome') {
                                if (fs.statSync(fullPath).mode & 0o111) return fullPath
                            }
                        } catch (e) { }
                    }
                } catch (e) { }
                return null
            }

            // Potential locations on Render
            const roots = ['/opt/render/.cache/puppeteer', '/usr/bin', '/usr/local/bin']
            for (const root of roots) {
                executablePath = scan(root) || undefined
                if (executablePath) break
            }

            console.log(`🚀 Puppeteer: System check... ${executablePath ? `Found binary at ${executablePath}` : 'Using system default path'}`)

            browser = await puppeteer.launch({
                headless: true,
                executablePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    '--no-zygote'
                ]
            })

            const page = await browser.newPage()

            // Try SaveFrom as a proxy to bypass YouTube IP blocks
            console.log(`🔗 Puppeteer: Navigating through proxy downloader...`)
            await page.goto('https://en.savefrom.net/1-youtube-video-downloader-524/', {
                waitUntil: 'networkidle2',
                timeout: 60000
            })

            await page.type('#id_url', url)
            await page.click('#sf_submit')

            console.log(`⏳ Puppeteer: Waiting for download links...`)
            await page.waitForSelector('.download-icon', { timeout: 45000 })

            const downloadUrl = await page.evaluate(() => {
                const link = (globalThis as any).document.querySelector('.download-icon')
                return link ? link.href : null
            })

            if (!downloadUrl) {
                throw new Error('Could not find download link')
            }

            console.log(`✅ Puppeteer: Found download URL, downloading file...`)

            const videoPath = path.join(this.downloadPath, `project_${projectId}_puppeteer.mp4`)
            const response = await page.goto(downloadUrl, { timeout: 90000 })
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
