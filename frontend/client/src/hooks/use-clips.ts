// React Query hooks for clips

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { renderClip, getClipStatus, batchProcessClips } from '@/lib/api';
import type { ClipRenderRequest } from '@/lib/types';

/**
 * Render a single clip
 */
export function useRenderClip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: ClipRenderRequest) => {
            const response = await renderClip(request);
            if (!response.success) {
                throw new Error(response.message || 'Failed to render clip');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clips'] });
        },
    });
}

/**
 * Poll clip status
 */
export function useClipStatus(clipId: string | null) {
    return useQuery({
        queryKey: ['clipStatus', clipId],
        queryFn: async () => {
            if (!clipId) return null;
            const response = await getClipStatus(clipId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to get clip status');
            }
            return response.data!;
        },
        enabled: clipId !== null,
        refetchInterval: (data) => {
            // Stop polling when clip is complete
            if (data?.state?.data?.status === 'completed') {
                return false;
            }
            return 2000; // Poll every 2 seconds while processing
        },
    });
}

/**
 * Batch process clips
 */
export function useBatchProcessClips() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            projectId,
            clips,
        }: {
            projectId: number;
            clips: Array<{
                startTime: number;
                endTime: number;
                title: string;
                aspectRatio: string;
            }>;
        }) => {
            const response = await batchProcessClips(projectId, clips);
            if (!response.success) {
                throw new Error(response.error || 'Failed to batch process clips');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clips'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}
