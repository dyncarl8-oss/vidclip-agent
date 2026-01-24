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
            // ROBUST CHROME DISCOVERY
            let executablePath: string | undefined = undefined

            const scanForChrome = (dir: string, depth = 0): string | null => {
                if (depth > 5 || !fs.existsSync(dir)) return null
                try {
                    const entries = fs.readdirSync(dir, { withFileTypes: true })

                    // Priority 1: Check for 'chrome' files in current dir
                    for (const entry of entries) {
                        if (!entry.isDirectory() && (entry.name === 'chrome' || entry.name === 'google-chrome')) {
                            const fullPath = path.join(dir, entry.name)
                            try {
                                if (fs.statSync(fullPath).mode & 0o111) return fullPath
                            } catch (e) { }
                        }
                    }

                    // Priority 2: Recurse into directories
                    for (const entry of entries) {
                        if (entry.isDirectory()) {
                            const found = scanForChrome(path.join(dir, entry.name), depth + 1)
                            if (found) return found
                        }
                    }
                } catch (e) { }
                return null
            }

            // Target locations where Puppeteer or Render installs Chrome
            const searchRoots = [
                '/opt/render/.cache/puppeteer',
                '/opt/render/project/src/.cache/puppeteer',
                '/home/render/.cache/puppeteer',
                '/usr/bin/google-chrome',
                '/usr/bin'
            ]

            for (const root of searchRoots) {
                if (root.startsWith('/usr/bin/google-chrome')) {
                    if (fs.existsSync(root)) { executablePath = root; break; }
                } else {
                    const found = scanForChrome(root)
                    if (found) { executablePath = found; break; }
                }
            }

            console.log(`🚀 Puppeteer: Init engine... ${executablePath ? `Found binary at ${executablePath}` : 'Using system default'}`)

            browser = await puppeteer.launch({
                headless: true,
                executablePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process' // Better for resource-constrained environments like Render
                ]
            })

            const page = await browser.newPage()
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36')

            // Try SaveFrom as a proxy to bypass YouTube IP blocks
            console.log(`🔗 Puppeteer: Navigating to SaveFrom proxy...`)
            await page.goto('https://en.savefrom.net/1-youtube-video-downloader-524/', {
                waitUntil: 'networkidle2',
                timeout: 60000
            })

            await page.type('#id_url', url)
            await page.click('#sf_submit')

            console.log(`⏳ Puppeteer: Waiting for result...`)
            // Wait for download link or error
            try {
                await page.waitForSelector('.download-icon', { timeout: 40000 })
            } catch (e) {
                // Check if it's already there or if we can find it by class
                const hasLink = await page.evaluate(() => !!(globalThis as any).document.querySelector('.download-icon'))
                if (!hasLink) throw new Error('Download button timed out or not found')
            }

            const downloadUrl = await page.evaluate(() => {
                const link = (globalThis as any).document.querySelector('.download-icon')
                return link ? link.href : null
            })

            if (!downloadUrl) {
                throw new Error('Could not extract download URL')
            }

            console.log(`✅ Puppeteer: Got download URL, fetching buffer...`)

            const videoPath = path.join(this.downloadPath, `project_${projectId}_puppeteer.mp4`)

            // Navigate directly to download link to get buffer
            const response = await page.goto(downloadUrl, { timeout: 90000, waitUntil: 'networkidle2' })
            const buffer = await response?.buffer()

            if (buffer && buffer.length > 0) {
                fs.writeFileSync(videoPath, buffer)
                await browser.close()
                console.log(`✅ Puppeteer: Download complete: ${videoPath} (${buffer.length} bytes)`)
                return { success: true, filePath: videoPath }
            }

            throw new Error('Video buffer empty or null')

        } catch (error: any) {
            console.error(`❌ Puppeteer engine failure: ${error.message}`)
            if (browser) await browser.close()
            return { success: false, error: error.message }
        }
    }
}

export default new PuppeteerYouTubeDownloader()
