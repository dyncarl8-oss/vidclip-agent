// API Response Types for Pocat.io

export interface VideoInfo {
    title: string;
    duration: number;
    thumbnail: string;
    description?: string;
    author: string;
    viewCount?: string;
    availableQualities?: Array<{
        quality: string;
        format: string;
        filesize: number;
    }>;
}

export interface Project {
    id: number;
    title: string;
    youtubeUrl: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'clips_ready';
    duration: number;
    thumbnail: string;
    createdAt: string;
    updatedAt: string;
    videoAvailable: boolean;
    source: 'none' | 'fresh' | 'cached' | 'shared';
    clipCount?: number;
}

export interface DownloadStatus {
    readyForEditing: boolean;
    status: 'pending' | 'downloading' | 'processing' | 'completed' | 'failed';
    progress: number;
    video: {
        source: 'fresh' | 'cached' | 'shared' | 'pending';
    };
}

export interface Clip {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    duration: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputUrl?: string;
    score?: number;
}

export interface ClipRenderRequest {
    videoUrl: string;
    startTime: number;
    endTime: number;
    aspectRatio: '9:16' | '16:9' | '1:1';
}

export interface ClipRenderResponse {
    success: boolean;
    message: string;
    data: {
        clipId: string;
        downloadUrl: string;
        status: string;
        estimatedTime: string;
    };
}

export interface CreateProjectRequest {
    title: string;
    youtubeUrl: string;
    userId: number;
    quality?: string;
    downloader?: 'auto' | 'yt-dlp' | 'ytdl-core' | 'puppeteer';
}

export interface CreateProjectResponse {
    success: boolean;
    message: string;
    data: {
        projectId: number;
        title: string;
        status: string;
        downloader: string;
        videoInfo: VideoInfo;
        estimatedTime: string;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
