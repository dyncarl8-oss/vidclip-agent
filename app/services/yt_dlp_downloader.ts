import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import fs_sync from 'fs'
import env from '#start/env'

const execAsync = promisify(exec)

export class YtDlpDownloader {
  private downloadDir: string
  private ytDlpPath: string

  constructor() {
    this.downloadDir = path.join(process.cwd(), 'storage', 'downloads')

    // Check for cookies file or environment variable
    const cookiesPath = path.join(process.cwd(), 'cookies.txt')
    let cookieFlag = ''

    if (fs_sync.existsSync(cookiesPath)) {
      console.log('🍪 Using cookies.txt for yt-dlp')
      cookieFlag = `--cookies "${cookiesPath}"`
    } else if (process.env.YOUTUBE_COOKIES) {
      console.log('🍪 Using YOUTUBE_COOKIES environment variable for yt-dlp')
      const tempCookiesPath = path.join(process.cwd(), 'storage', 'temp_cookies.txt')

      cookieFlag = `--cookies "${tempCookiesPath}"`

      // Attempt to write if it doesn't exist
      try {
        if (!fs_sync.existsSync(path.dirname(tempCookiesPath))) {
          fs_sync.mkdirSync(path.dirname(tempCookiesPath), { recursive: true })
        }
        fs_sync.writeFileSync(tempCookiesPath, process.env.YOUTUBE_COOKIES)
      } catch (e) {
        console.error('Failed to write temp cookies:', e)
      }
    }

    // Base yt-dlp command with Mobile Web identity (excellent reliability)
    const baseArgs = [
      '--no-check-certificates',
      '--no-cache-dir',
      '--user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"',
      '--extractor-args "youtube:player-client=mweb,web"',
      '--no-warnings',
      cookieFlag
    ].filter(Boolean).join(' ')

    const binary = env.get('YT_DLP_PATH') || 'yt-dlp'
    this.ytDlpPath = `${binary} ${baseArgs}`
  }

  async downloadVideo(url: string, filename?: string, quality: string = '720p'): Promise<string> {
    await fs.mkdir(this.downloadDir, { recursive: true })

    const outputTemplate = filename
      ? `${filename}.%(ext)s`
      : '%(title)s.%(ext)s'

    const outputPath = path.join(this.downloadDir, outputTemplate)

    // Map quality to yt-dlp format selection
    const formatSelector = this.getFormatSelector(quality)
    const command = `${this.ytDlpPath} -f "${formatSelector}" --output "${outputPath}" "${url}"`

    try {
      await execAsync(command)

      // Find the actual downloaded file
      const files = await fs.readdir(this.downloadDir)
      const downloadedFile = files.find(file =>
        file.includes(filename || 'video') ||
        file.endsWith('.mp4') ||
        file.endsWith('.webm')
      )

      if (!downloadedFile) {
        throw new Error('Downloaded file not found')
      }

      return path.join(this.downloadDir, downloadedFile)
    } catch (error) {
      throw new Error(`yt-dlp download failed: ${error.message}`)
    }
  }

  private getFormatSelector(quality: string): string {
    switch (quality.toLowerCase()) {
      case '144p':
        return 'worst[height<=144]'
      case '240p':
        return 'best[height<=240]'
      case '360p':
        return 'best[height<=360]'
      case '480p':
        return 'best[height<=480]'
      case '720p':
        return 'best[height<=720]'
      case '1080p':
        return 'best[height<=1080]'
      case '1440p':
        return 'best[height<=1440]'
      case '2160p':
      case '4k':
        return 'best[height<=2160]'
      case 'best':
        return 'best'
      case 'worst':
        return 'worst'
      default:
        return 'best[height<=720]' // Default to 720p
    }
  }

  async getVideoInfo(url: string): Promise<any> {
    const command = `${this.ytDlpPath} --dump-json "${url}"`

    try {
      const { stdout } = await execAsync(command)
      return JSON.parse(stdout)
    } catch (error) {
      throw new Error(`Failed to get video info: ${error.message}`)
    }
  }

  async getAvailableFormats(url: string): Promise<string> {
    const command = `${this.ytDlpPath} -F "${url}"`

    try {
      const { stdout } = await execAsync(command)
      return stdout
    } catch (error) {
      throw new Error(`Failed to get available formats: ${error.message}`)
    }
  }
}
