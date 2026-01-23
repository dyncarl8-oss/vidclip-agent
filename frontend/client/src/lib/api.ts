// Pocat.io API Service
// Centralized API calls for frontend-backend communication

import type {
    VideoInfo,
    Project,
    DownloadStatus,
    ClipRenderRequest,
    ClipRenderResponse,
    CreateProjectRequest,
    CreateProjectResponse,
    ApiResponse,
} from './types';

// API base URL - in production, this will be the same origin
const API_BASE = '';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.message || data.error || `HTTP ${response.status}`,
            };
        }

        return data;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

// ============================================
// VIDEO INFO
// ============================================

/**
 * Get video information from YouTube URL
 */
export async function getVideoInfo(url: string): Promise<ApiResponse<VideoInfo>> {
    return fetchApi<VideoInfo>(`/video/info?url=${encodeURIComponent(url)}`);
}

// ============================================
// PROJECTS
// ============================================

/**
 * Get all projects
 */
export async function getProjects(): Promise<ApiResponse<Project[]>> {
    return fetchApi<Project[]>('/v2/projects');
}

/**
 * Create a new project and start video download
 */
export async function createProject(
    request: CreateProjectRequest
): Promise<CreateProjectResponse> {
    const response = await fetchApi<CreateProjectResponse['data']>('/v2/projects', {
        method: 'POST',
        body: JSON.stringify(request),
    });

    return {
        success: response.success,
        message: response.error || 'Project created',
        data: response.data!,
    };
}

/**
 * Get download status for a project
 */
export async function getDownloadStatus(
    projectId: number
): Promise<ApiResponse<DownloadStatus>> {
    return fetchApi<DownloadStatus>(`/v2/projects/${projectId}/download-status`);
}

/**
 * Resume a failed/stuck download
 */
export async function resumeDownload(
    projectId: number
): Promise<ApiResponse<{ status: string }>> {
    return fetchApi<{ status: string }>(`/v2/projects/${projectId}/resume`, {
        method: 'POST',
    });
}

/**
 * Get video stream URL for a project
 */
export function getVideoStreamUrl(projectId: number): string {
    return `${API_BASE}/v2/projects/${projectId}/stream`;
}

// ============================================
// CLIPS
// ============================================

/**
 * Render a clip from video
 */
export async function renderClip(
    request: ClipRenderRequest
): Promise<ClipRenderResponse> {
    const response = await fetchApi<ClipRenderResponse['data']>('/clips/render', {
        method: 'POST',
        body: JSON.stringify(request),
    });

    return {
        success: response.success,
        message: response.error || 'Clip rendering started',
        data: response.data!,
    };
}

/**
 * Check clip rendering status
 */
export async function getClipStatus(
    clipId: string
): Promise<ApiResponse<{
    status: 'processing' | 'completed';
    downloadUrl?: string;
    fileSize?: number;
    createdAt?: string;
}>> {
    return fetchApi(`/clips/status/${clipId}`);
}

/**
 * Batch process clips from AI analysis
 */
export async function batchProcessClips(
    projectId: number,
    clips: Array<{
        startTime: number;
        endTime: number;
        title: string;
        aspectRatio: string;
    }>
): Promise<ApiResponse<{
    clipsCount: number;
    estimatedTime: string;
}>> {
    return fetchApi(`/v2/projects/${projectId}/batch-clips`, {
        method: 'POST',
        body: JSON.stringify({ clips }),
    });
}

// ============================================
// STORAGE & SYSTEM
// ============================================

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<ApiResponse<{
    totalVideos: number;
    totalClips: number;
    storageUsed: string;
    spaceSaved: string;
}>> {
    return fetchApi('/v2/storage/stats');
}

/**
 * Health check
 */
export async function healthCheck(): Promise<ApiResponse<{
    version: string;
    uptime: string;
}>> {
    return fetchApi('/health');
}
