// React Query hooks for projects

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProjects,
    createProject,
    getDownloadStatus,
    getVideoInfo,
    resumeDownload,
    getProjectClips,
} from '@/lib/api';
import type { CreateProjectRequest, Project } from '@/lib/types';

/**
 * Fetch all projects
 */
export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await getProjects();
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch projects');
            }
            return response.data || [];
        },
        refetchInterval: 10000, // Poll every 10 seconds for status updates
    });
}

/**
 * Get video info before creating project
 */
export function useVideoInfo(url: string, enabled: boolean = true) {
    return useQuery({
        queryKey: ['videoInfo', url],
        queryFn: async () => {
            const response = await getVideoInfo(url);
            if (!response.success) {
                throw new Error(response.error || 'Failed to get video info');
            }
            return response.data!;
        },
        enabled: enabled && url.length > 0,
        retry: false,
    });
}

/**
 * Create a new project
 */
export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: CreateProjectRequest) => {
            const response = await createProject(request);
            if (!response.success) {
                throw new Error(response.message || 'Failed to create project');
            }
            return response.data;
        },
        onSuccess: () => {
            // Invalidate projects list to refetch
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

/**
 * Poll download status for a project
 */
export function useDownloadStatus(projectId: number | null) {
    return useQuery({
        queryKey: ['downloadStatus', projectId],
        queryFn: async () => {
            if (!projectId) return null;
            const response = await getDownloadStatus(projectId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to get download status');
            }
            return response.data!;
        },
        enabled: projectId !== null,
        refetchInterval: (query) => {
            // Stop polling when download is complete
            const data = query.state.data;
            if (data?.readyForEditing || data?.status === 'completed') {
                return false;
            }
            return 2000; // Poll every 2 seconds while downloading
        },
    });
}

/**
 * Resume a failed download
 */
export function useResumeDownload() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (projectId: number) => {
            const response = await resumeDownload(projectId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to resume download');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['downloadStatus'] });
        },
    });
}

/**
 * Get a single project from the cache or refetch
 */
export function useProject(projectId: number | null) {
    const { data: projects } = useProjects();

    const project = projects?.find((p: Project) => p.id === projectId);

    return {
        data: project,
        isLoading: !projects,
    };
}

/**
 * Fetch clips for a specific project
 */
export function useProjectClips(projectId: number | null) {
    return useQuery({
        queryKey: ['projectClips', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const response = await getProjectClips(projectId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch clips');
            }
            return response.data || [];
        },
        enabled: projectId !== null,
        refetchInterval: (query) => {
            // Poll for new clips if project is still processing
            const clips = query.state.data;
            if (!clips || clips.length === 0) return 5000;
            return false;
        },
    });
}
