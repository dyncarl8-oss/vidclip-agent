import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import fs_sync from 'fs'
import env from '#start/env'

const execAsync = promisify(exec)

export class YtDlpDownloader {
  private downloadDir: string
  private cookiesPath: string | null = null

  constructor() {
    this.downloadDir = path.join(process.cwd(), 'storage', 'downloads')
    this.setupCookies()
  }

  private setupCookies(): void {
    const staticCookiesPath = path.join(process.cwd(), 'cookies.txt')
    const tempCookiesPath = path.join(process.cwd(), 'storage', 'temp_cookies.txt')

    if (fs_sync.existsSync(staticCookiesPath)) {
      console.log('🍪 Using cookies.txt for yt-dlp')
      this.cookiesPath = staticCookiesPath
    } else if (process.env.YOUTUBE_COOKIES) {
      console.log('🍪 Parsing YOUTUBE_COOKIES environment variable for yt-dlp')
      try {
        // Ensure storage directory exists
        const storageDir = path.dirname(tempCookiesPath)
        if (!fs_sync.existsSync(storageDir)) {
          fs_sync.mkdirSync(storageDir, { recursive: true })
        }

        // Parse the cookie string properly - handle escaped newlines
        let cookieContent = process.env.YOUTUBE_COOKIES
        if (cookieContent) {
          // Replace literal \n with actual newlines
          cookieContent = cookieContent.replace(/\\n/g, '\n')
          // Replace literal \t with actual tabs
          cookieContent = cookieContent.replace(/\\t/g, '\t')
          // Replace literal \t with actual tabs
          cookieContent = cookieContent.replace(/\\t/g, '\t')
          fs_sync.writeFileSync(tempCookiesPath, cookieContent, 'utf8')
          this.cookiesPath = tempCookiesPath
          console.log('✅ Cookies file written successfully')

          // Debug Verify: show first line of cookie file (sanitized) to confirm format
          const firstLine = cookieContent.split('\n')[0]
          console.log(`🍪 Cookie Debug: First line starts with: ${firstLine.substring(0, 20)}...`)
        }
      } catch (e) {
        console.error('❌ Failed to write temp cookies:', e)
      }
    } else {
      console.log('⚠️ No cookies configured for yt-dlp')
    }
  }

  private buildCommand(additionalArgs: string = ''): string {
    const binary = env.get('YT_DLP_PATH') || 'yt-dlp'

    const baseArgs = [
      '--no-check-certificates',
      '--no-cache-dir',
      '--socket-timeout 30',
      '--retries 5', // Increase retries
      '--fragment-retries 5',
      '--no-warnings',
      '--no-playlist',
      '--geo-bypass',
      '--add-header "Accept-Language: en-US,en;q=0.9"',
      '--add-header "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"',
    ]

    // Add cookies if available
    if (this.cookiesPath && fs_sync.existsSync(this.cookiesPath)) {
      baseArgs.push(`--cookies "${this.cookiesPath}"`)
    }

    return `${binary} ${baseArgs.join(' ')} ${additionalArgs}`
  }

  async downloadVideo(url: string, filename?: string, quality: string = '720p'): Promise<string> {
    await fs.mkdir(this.downloadDir, { recursive: true })

    const outputTemplate = filename
      ? `${filename}.%(ext)s`
      : '%(title)s.%(ext)s'

    const outputPath = path.join(this.downloadDir, outputTemplate)

    // Try multiple strategies in order
    const strategies = [
      // Strategy 1: High-fidelity Desktop Chrome (Matches most exported cookies)
      () => this.tryDownload(url, outputPath, quality, [
        '--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"',
        '--extractor-args "youtube:player-client=web"',
      ]),
      // Strategy 2: Alternate Desktop UA
      () => this.tryDownload(url, outputPath, quality, [
        '--user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"',
        '--extractor-args "youtube:player-client=web,mweb"',
      ]),
      // Strategy 3: Android client (bypass some restrictions)
      () => this.tryDownload(url, outputPath, quality, [
        '--extractor-args "youtube:player-client=android"',
      ]),
      // Strategy 4: TV embed client
      () => this.tryDownload(url, outputPath, quality, [
        '--extractor-args "youtube:player-client=tv_embedded"',
      ]),
      // Strategy 5: iOS client
      () => this.tryDownload(url, outputPath, quality, [
        '--extractor-args "youtube:player-client=ios"',
      ]),
    ]

    let lastError: Error | null = null
    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`📥 yt-dlp: Trying strategy ${i + 1}/${strategies.length}...`)
        const result = await strategies[i]()
        console.log(`✅ yt-dlp: Strategy ${i + 1} succeeded!`)
        return result
      } catch (error: any) {
        console.log(`❌ yt-dlp: Strategy ${i + 1} failed: ${error.message}`)
        lastError = error
      }
    }

    throw lastError || new Error('All yt-dlp download strategies failed')
  }

  private async tryDownload(url: string, outputPath: string, quality: string, extraArgs: string[]): Promise<string> {
    const formatSelector = this.getFormatSelector(quality)
    const command = this.buildCommand([
      ...extraArgs,
      `-f "${formatSelector}"`,
      `--output "${outputPath}"`,
      `"${url}"`,
    ].join(' '))

    console.log(`🚀 Running: ${command.substring(0, 200)}...`)

    try {
      await execAsync(command, {
        timeout: 300000, // 5 minute timeout
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      })

      // Find the actual downloaded file
      const files = await fs.readdir(this.downloadDir)
      const downloadedFile = files.find(file => {
        const base = path.parse(outputPath).name.replace('.%(ext)s', '')
        return file.startsWith(base) &&
          (file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv'))
      })

      if (!downloadedFile) {
        // Try finding by extension
        const anyVideo = files.find(f =>
          f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mkv')
        )
        if (anyVideo) return path.join(this.downloadDir, anyVideo)
        throw new Error('Downloaded file not found')
      }

      const filePath = path.join(this.downloadDir, downloadedFile)
      const stats = fs_sync.statSync(filePath)
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      return filePath
    } catch (error: any) {
      throw new Error(`Download attempt failed: ${error.message}`)
    }
  }

  private getFormatSelector(quality: string): string {
    // Use more flexible format selectors that work across different client responses
    switch (quality.toLowerCase()) {
      case '144p':
        return 'bestvideo[height<=144]+bestaudio/best[height<=144]/worst'
      case '240p':
        return 'bestvideo[height<=240]+bestaudio/best[height<=240]/worst'
      case '360p':
        return 'bestvideo[height<=360]+bestaudio/best[height<=360]'
      case '480p':
        return 'bestvideo[height<=480]+bestaudio/best[height<=480]'
      case '720p':
        return 'bestvideo[height<=720]+bestaudio/best[height<=720]/best'
      case '1080p':
        return 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best'
      case '1440p':
        return 'bestvideo[height<=1440]+bestaudio/best[height<=1440]/best'
      case '2160p':
      case '4k':
        return 'bestvideo[height<=2160]+bestaudio/best[height<=2160]/best'
      case 'best':
        return 'bestvideo+bestaudio/best'
      case 'worst':
        return 'worstvideo+worstaudio/worst'
      default:
        return 'bestvideo[height<=720]+bestaudio/best[height<=720]/best'
    }
  }

  async getVideoInfo(url: string): Promise<any> {
    // Try to get info with multiple strategies
    const strategies = [
      '--extractor-args "youtube:player-client=web"',
      '--extractor-args "youtube:player-client=mweb"',
      '--extractor-args "youtube:player-client=android"',
    ]

    let lastError: Error | null = null
    for (const strategy of strategies) {
      try {
        const command = this.buildCommand(`${strategy} --dump-json "${url}"`)
        const { stdout } = await execAsync(command, { timeout: 30000 })
        return JSON.parse(stdout)
      } catch (error: any) {
        lastError = error
      }
    }

    throw lastError || new Error('Failed to get video info')
  }

  async getAvailableFormats(url: string): Promise<string> {
    const command = this.buildCommand(`-F "${url}"`)

    try {
      const { stdout } = await execAsync(command, { timeout: 30000 })
      return stdout
    } catch (error: any) {
      throw new Error(`Failed to get available formats: ${error.message}`)
    }
  }
}
