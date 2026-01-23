import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize } from 'lucide-react';
import { getVideoStreamUrl } from '@/lib/api';

interface VideoPlayerProps {
    projectId: number;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onClipSelect?: (start: number, end: number) => void;
    className?: string;
}

export function VideoPlayer({
    projectId,
    onTimeUpdate,
    onClipSelect,
    className = '',
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Clip selection state
    const [clipStart, setClipStart] = useState<number | null>(null);
    const [clipEnd, setClipEnd] = useState<number | null>(null);

    const streamUrl = getVideoStreamUrl(projectId);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadStart = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleError = () => {
            setError('Failed to load video. The video may still be processing.');
            setIsLoading(false);
        };
        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };
        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            onTimeUpdate?.(video.currentTime, video.duration);
        };
        const handleEnded = () => setIsPlaying(false);

        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleError);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('loadstart', handleLoadStart);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
        };
    }, [onTimeUpdate]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (value: number[]) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = value[0];
        setCurrentTime(value[0]);
    };

    const handleVolumeChange = (value: number[]) => {
        const video = videoRef.current;
        if (!video) return;
        video.volume = value[0];
        setVolume(value[0]);
        setIsMuted(value[0] === 0);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const skip = (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
    };

    const setClipPoint = () => {
        if (clipStart === null) {
            setClipStart(currentTime);
        } else if (clipEnd === null) {
            const end = currentTime;
            setClipEnd(end);
            onClipSelect?.(clipStart, end);
        } else {
            // Reset
            setClipStart(currentTime);
            setClipEnd(null);
        }
    };

    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const toggleFullscreen = () => {
        const video = videoRef.current;
        if (!video) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            video.requestFullscreen();
        }
    };

    return (
        <div className={`flex flex-col bg-black rounded-lg overflow-hidden ${className}`}>
            {/* Video Element */}
            <div className="relative flex-1 flex items-center justify-center bg-gray-900">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <p className="text-white text-sm">Loading video...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="text-center p-6">
                            <p className="text-red-400 mb-2">{error}</p>
                            <Button variant="outline" onClick={() => window.location.reload()}>
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                <video
                    ref={videoRef}
                    src={streamUrl}
                    className="max-h-full max-w-full"
                    playsInline
                    onClick={togglePlay}
                />

                {/* Play/Pause Overlay */}
                {!isLoading && !error && (
                    <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={togglePlay}
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                            {isPlaying ? (
                                <Pause className="w-8 h-8 text-black" />
                            ) : (
                                <Play className="w-8 h-8 text-black ml-1" />
                            )}
                        </div>
                    </div>
                )}

                {/* Clip Selection Indicator */}
                {(clipStart !== null || clipEnd !== null) && (
                    <div className="absolute top-4 left-4 bg-primary/90 text-black px-3 py-1 rounded-full text-sm font-bold">
                        {clipEnd !== null
                            ? `Clip: ${formatTime(clipStart!)} - ${formatTime(clipEnd)}`
                            : `Start: ${formatTime(clipStart!)}`}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-card p-4 space-y-3">
                {/* Timeline */}
                <div className="relative">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="w-full"
                    />

                    {/* Clip markers */}
                    {clipStart !== null && duration > 0 && (
                        <div
                            className="absolute top-0 w-1 h-full bg-green-500 -translate-x-1/2"
                            style={{ left: `${(clipStart / duration) * 100}%` }}
                        />
                    )}
                    {clipEnd !== null && duration > 0 && (
                        <div
                            className="absolute top-0 w-1 h-full bg-red-500 -translate-x-1/2"
                            style={{ left: `${(clipEnd / duration) * 100}%` }}
                        />
                    )}
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => skip(-10)}>
                            <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={togglePlay}
                            className="w-10 h-10"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5" />
                            )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => skip(10)}>
                            <SkipForward className="w-4 h-4" />
                        </Button>

                        <span className="text-sm text-muted-foreground font-mono ml-2">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={clipStart !== null ? 'default' : 'outline'}
                            size="sm"
                            onClick={setClipPoint}
                            className={clipStart !== null && clipEnd === null ? 'bg-green-600' : ''}
                        >
                            {clipStart === null
                                ? 'Set Start'
                                : clipEnd === null
                                    ? 'Set End'
                                    : 'New Clip'}
                        </Button>

                        <div className="flex items-center gap-1 ml-4">
                            <Button variant="ghost" size="icon" onClick={toggleMute}>
                                {isMuted ? (
                                    <VolumeX className="w-4 h-4" />
                                ) : (
                                    <Volume2 className="w-4 h-4" />
                                )}
                            </Button>
                            <Slider
                                value={[isMuted ? 0 : volume]}
                                max={1}
                                step={0.1}
                                onValueChange={handleVolumeChange}
                                className="w-20"
                            />
                        </div>

                        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                            <Maximize className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
