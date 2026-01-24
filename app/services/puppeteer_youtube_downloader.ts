import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

class PuppeteerYouTubeDownloader {
    private downloadPath: string
    private chromeAvailable: boolean | null = null

    constructor() {
        this.downloadPath = path.join(process.cwd(), 'storage', 'downloads')
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true })
        }
    }

    /**
     * Check if Chrome is available for puppeteer
     */
    private async checkChromeAvailability(): Promise<boolean> {
        if (this.chromeAvailable !== null) {
            return this.chromeAvailable
        }

        try {
            // Try to launch puppeteer with minimal config to test
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                timeout: 5000,
            })
            await browser.close()
            this.chromeAvailable = true
            console.log('✅ Puppeteer: Chrome is available')
            return true
        } catch (error) {
            this.chromeAvailable = false
            console.log('⚠️ Puppeteer: Chrome is not available on this system')
            return false
        }
    }

    /**
     * Emergency fallback downloader using Puppeteer
     */
    async downloadVideo(url: string, projectId: number): Promise<{ success: boolean; filePath?: string; error?: string }> {
        console.log(`🕵️ Puppeteer: Attempting emergency download for project ${projectId}`)

        // First check if Chrome is available
        const chromeAvailable = await this.checkChromeAvailability()
        if (!chromeAvailable) {
            return {
                success: false,
                error: 'Chrome/Puppeteer not available on this system. Please use yt-dlp or ytdl-core.'
            }
        }

        let browser
        try {
            // Find Chrome executable
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
                            } else if (entry.name === 'chrome' || entry.name === 'google-chrome' || entry.name.includes('chrome')) {
                                try {
                                    const stats = fs.statSync(fullPath)
                                    if (stats.mode & 0o111) return fullPath
                                } catch { }
                            }
                        } catch { }
                    }
                } catch { }
                return null
            }

            // Potential locations on various systems
            const roots = [
                '/opt/render/.cache/puppeteer',
                '/root/.cache/puppeteer',
                '/home/.cache/puppeteer',
                '/usr/bin',
                '/usr/local/bin',
                process.env.PUPPETEER_EXECUTABLE_PATH || ''
            ].filter(Boolean)

            for (const root of roots) {
                executablePath = scan(root) || undefined
                if (executablePath) break
            }

            console.log(`🚀 Puppeteer: ${executablePath ? `Found binary at ${executablePath}` : 'Using system default path'}`)

            browser = await puppeteer.launch({
                headless: true,
                executablePath: executablePath || undefined,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-features=VizDisplayCompositor'
                ],
                timeout: 30000
            })

            const page = await browser.newPage()

            // Set a realistic user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')

            // Try multiple proxy download services
            const downloadServices = [
                {
                    name: 'SaveFrom',
                    url: 'https://en.savefrom.net/1-youtube-video-downloader-524/',
                    inputSelector: '#id_url',
                    submitSelector: '#sf_submit',
                    linkSelector: '.download-icon'
                },
                {
                    name: 'Y2mate',
                    url: 'https://www.y2mate.com/youtube/',
                    inputSelector: '#txt-url',
                    submitSelector: '#btn-submit',
                    linkSelector: 'a.btn-success'
                }
            ]

            for (const service of downloadServices) {
                try {
                    console.log(`🔗 Puppeteer: Trying ${service.name}...`)
                    await page.goto(service.url, {
                        waitUntil: 'networkidle2',
                        timeout: 30000
                    })

                    await page.type(service.inputSelector, url)
                    await page.click(service.submitSelector)

                    console.log(`⏳ Puppeteer: Waiting for download links from ${service.name}...`)
                    await page.waitForSelector(service.linkSelector, { timeout: 30000 })

                    const downloadUrl = await page.evaluate((selector) => {
                        const link = (globalThis as any).document.querySelector(selector)
                        return link ? link.href : null
                    }, service.linkSelector)

                    if (!downloadUrl) continue

                    console.log(`✅ Puppeteer: Found download URL from ${service.name}, downloading file...`)

                    const videoPath = path.join(this.downloadPath, `project_${projectId}_puppeteer.mp4`)
                    const response = await page.goto(downloadUrl, { timeout: 120000 })
                    const buffer = await response?.buffer()

                    if (buffer && buffer.length > 1000) {
                        fs.writeFileSync(videoPath, buffer)
                        await browser.close()
                        return { success: true, filePath: videoPath }
                    }
                } catch (serviceError: any) {
                    console.log(`⚠️ ${service.name} failed: ${serviceError.message}`)
                    continue
                }
            }

            throw new Error('All download services failed')

        } catch (error: any) {
            console.error(`❌ Puppeteer download failed: ${error.message}`)
            if (browser) {
                try { await browser.close() } catch { }
            }
            return { success: false, error: error.message }
        }
    }
}

export default new PuppeteerYouTubeDownloader()

