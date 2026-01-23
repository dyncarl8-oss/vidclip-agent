import type { HttpContext } from '@adonisjs/core/http'
import videoProcessor from '#services/enhanced_video_processor'

export default class VideosController {
  // Disable streaming for now - YouTube blocks it
  async stream({ response }: HttpContext) {
    response.header('Access-Control-Allow-Origin', '*')
    return response.status(503).json({
      success: false,
      message: 'Video streaming temporarily disabled due to YouTube restrictions. Use clip rendering instead.',
      suggestion: 'Use POST /clips/render to create clips directly'
    })
  }

  async streamTest({ response }: HttpContext) {
    response.header('Access-Control-Allow-Origin', '*')
    return response.status(503).json({
      success: false,
      message: 'Video streaming temporarily disabled due to YouTube restrictions. Use clip rendering instead.',
      suggestion: 'Use POST /clips/render to create clips directly'
    })
  }

  async info({ request, response }: HttpContext) {
    const url = request.input('url')

    if (!url) {
      return response.badRequest({
        success: false,
        message: 'YouTube URL is required'
      })
    }

    try {
      const result = await videoProcessor.getVideoInfo(url)

      // Set CORS headers
      response.header('Access-Control-Allow-Origin', '*')

      if (!result.success) {
        return response.internalServerError({
          success: false,
          message: 'Error getting video info',
          error: result.error
        })
      }

      return response.json({
        success: true,
        data: {
          ...result.data,
          // Add streaming status
          streamingAvailable: false,
          message: 'Video info available, but streaming disabled due to YouTube restrictions'
        }
      })

    } catch (error) {
      console.error('Video info error:', error)
      return response.internalServerError({
        success: false,
        message: 'Error getting video info',
        error: error.message
      })
    }
  }
}