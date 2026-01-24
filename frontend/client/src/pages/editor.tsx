import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Download, Share2, Scissors,
  Play, Pause, SkipBack, SkipForward, Settings2,
  Type, Music, Wand2, Loader2, AlertCircle, Check, Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useProject, useDownloadStatus, useResumeDownload, useProjectClips } from "@/hooks/use-projects";
import { useRenderClip, useClipStatus } from "@/hooks/use-clips";
import { VideoPlayer } from "@/components/video-player";

interface ClipItem {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  status: 'pending' | 'processing' | 'completed';
  downloadUrl?: string;
  score?: number;
}

export default function Editor() {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id) : null;
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: downloadStatus } = useDownloadStatus(projectId);
  const { data: autoClips } = useProjectClips(projectId);
  const resumeDownload = useResumeDownload();
  const renderClip = useRenderClip();

  const [localClips, setLocalClips] = useState<ClipItem[]>([]);
  const [selectedClip, setSelectedClip] = useState<ClipItem | null>(null);
  const [clipTitle, setClipTitle] = useState("My Clip");
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);

  // Combine local and auto clips
  const clips = [
    ...localClips,
    ...(autoClips || []).map(c => ({
      id: c.id.toString(),
      title: c.title,
      startTime: c.startTime,
      endTime: c.endTime,
      aspectRatio: '9:16' as const,
      status: c.status as any,
      score: c.score,
      downloadUrl: c.outputUrl
    }))
  ].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Clip rendering state
  const [pendingClipStart, setPendingClipStart] = useState<number | null>(null);
  const [pendingClipEnd, setPendingClipEnd] = useState<number | null>(null);

  // Poll clip status
  const { data: clipStatus } = useClipStatus(currentClipId);

  // Update clip when status changes
  useEffect(() => {
    if (clipStatus?.status === 'completed' && currentClipId) {
      setLocalClips(prev => prev.map(c =>
        c.id === currentClipId
          ? { ...c, status: 'completed', downloadUrl: clipStatus.downloadUrl }
          : c
      ));
      toast({
        title: "Clip Ready!",
        description: "Your clip has been rendered and is ready for download.",
      });
      setCurrentClipId(null);
    }
  }, [clipStatus, currentClipId, toast]);

  const handleClipSelect = (start: number, end: number) => {
    setPendingClipStart(start);
    setPendingClipEnd(end);
  };

  const handleCreateClip = async () => {
    if (pendingClipStart === null || pendingClipEnd === null) {
      toast({
        title: "Select clip range",
        description: "Use the video player to set start and end points",
        variant: "destructive",
      });
      return;
    }

    const clipId = `clip_${Date.now()}`;
    const newClip: ClipItem = {
      id: clipId,
      title: clipTitle || `Clip ${clips.length + 1}`,
      startTime: pendingClipStart,
      endTime: pendingClipEnd,
      aspectRatio,
      status: 'processing',
    };

    setLocalClips(prev => [newClip, ...prev]);
    setSelectedClip(newClip);

    try {
      const result = await renderClip.mutateAsync({
        videoUrl: project?.youtubeUrl || '',
        startTime: pendingClipStart,
        endTime: pendingClipEnd,
        aspectRatio,
      });

      // Update clip with real ID from server
      setLocalClips(prev => prev.map(c =>
        c.id === clipId
          ? { ...c, id: result.clipId }
          : c
      ));
      setCurrentClipId(result.clipId);

      toast({
        title: "Rendering clip...",
        description: result.estimatedTime,
      });

      // Reset pending clip
      setPendingClipStart(null);
      setPendingClipEnd(null);
      setClipTitle("My Clip");
    } catch (error) {
      setLocalClips(prev => prev.filter(c => c.id !== clipId));
      toast({
        title: "Failed to render clip",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClip = (clipId: string) => {
    setLocalClips(prev => prev.filter(c => c.id !== clipId));
    if (selectedClip?.id === clipId) {
      setSelectedClip(null);
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Determine state - handle demo mode where clips exist but video doesn't
  const isReady = downloadStatus?.readyForEditing;
  const isDownloading = downloadStatus?.status === 'downloading' || downloadStatus?.status === 'processing';
  const isFailed = project?.status === 'failed';
  const isCompleted = project?.status === 'completed' || project?.status === 'clips_ready';
  const hasClips = clips && clips.length > 0;
  const isDemoMode = isCompleted && hasClips && !isReady;


  const handleResume = async () => {
    if (!projectId) return;
    try {
      await resumeDownload.mutateAsync(projectId);
      toast({ title: "Download resumed" });
    } catch (error) {
      toast({
        title: "Failed to resume",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-red-400 text-xl">Project not found</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      {/* Editor Header */}
      <div className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="hover:bg-white/5">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-white leading-tight">{project.title}</h2>
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold">
              {isReady ? 'Ready for editing' : isDownloading ? `Downloading... ${downloadStatus?.progress || 0}%` : 'Analysis Active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex bg-transparent border-white/10 hover:bg-white/5 text-white">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          <Button
            size="sm"
            className="bg-primary text-black font-bold"
            disabled={!selectedClip?.downloadUrl}
            onClick={() => selectedClip?.downloadUrl && window.open(selectedClip.downloadUrl)}
          >
            <Download className="w-4 h-4 mr-2" /> Export Clip
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Player & Timeline */}
        <div className="flex-1 flex flex-col">

          {/* Video Player or Loading State */}
          {isReady && projectId ? (
            <VideoPlayer
              projectId={projectId}
              onClipSelect={handleClipSelect}
              className="flex-1"
            />
          ) : isDemoMode ? (
            /* Demo Mode: Video not available but clips are ready */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
              <div className="text-center p-8 max-w-xl">
                {project?.thumbnail && (
                  <div className="relative w-64 h-36 mx-auto mb-6 rounded-lg overflow-hidden border border-primary/30">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Wand2 className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-white">AI Clips Ready!</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Your AI-generated viral clips are ready to download!
                  <br />
                  <span className="text-sm text-yellow-400/80">
                    (Video preview unavailable due to YouTube restrictions)
                  </span>
                </p>
                <p className="text-sm text-primary mb-6">
                  Check out the {clips.length} clips in the sidebar →
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="text-center p-8">
                {isDownloading ? (
                  <>
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Downloading Video</h3>
                    <p className="text-muted-foreground mb-4">
                      {downloadStatus?.progress || 0}% complete
                    </p>
                    <div className="w-64 mx-auto bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${downloadStatus?.progress || 0}%` }}
                      />
                    </div>
                  </>
                ) : isFailed ? (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-red-400 mb-2">Download Failed</h3>
                    <p className="text-muted-foreground mb-4">
                      There was an error downloading the video
                    </p>
                    <Button onClick={handleResume} disabled={resumeDownload.isPending}>
                      {resumeDownload.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Retry Download
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Processing</h3>
                    <p className="text-muted-foreground">Generating AI clips from your video...</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Clip Creation Bar */}
          {isReady && (
            <div className="h-24 bg-card border-t border-border p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {pendingClipStart !== null && pendingClipEnd !== null ? (
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        {formatTime(pendingClipStart)} - {formatTime(pendingClipEnd)}
                      </Badge>
                      <Input
                        value={clipTitle}
                        onChange={(e) => setClipTitle(e.target.value)}
                        placeholder="Clip title"
                        className="max-w-xs bg-secondary/30 border-white/10"
                      />
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as any)}
                        className="bg-secondary/30 border border-white/10 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="9:16">Portrait (9:16)</option>
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="1:1">Square (1:1)</option>
                      </select>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Use the video player to select start and end points for your clip
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleCreateClip}
                  disabled={pendingClipStart === null || pendingClipEnd === null || renderClip.isPending}
                  className="bg-primary text-black font-bold"
                >
                  {renderClip.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Scissors className="w-4 h-4 mr-2" />
                  )}
                  Create Clip
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar Panel */}
        <div className="w-96 bg-card border-l border-border flex flex-col">
          <Tabs defaultValue="clips" className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <TabsList className="w-full grid grid-cols-2 bg-secondary/50">
                <TabsTrigger value="clips">My Clips ({clips.length})</TabsTrigger>
                <TabsTrigger value="edit">Settings</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="clips" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {clips.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Scissors className="w-10 h-10 mx-auto mb-4 opacity-30" />
                      <p>No clips yet</p>
                      <p className="text-sm">Select a section in the video to create a clip</p>
                    </div>
                  ) : (
                    clips.map((clip) => (
                      <div
                        key={clip.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedClip?.id === clip.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-secondary/20 border-transparent hover:bg-secondary/40'
                          }`}
                        onClick={() => setSelectedClip(clip)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <h4 className={`font-bold text-sm ${selectedClip?.id === clip.id ? 'text-primary' : 'text-white'}`}>
                              {clip.title}
                            </h4>
                            {clip.score && (
                              <Badge variant="outline" className="mt-1 text-[10px] py-0 h-4 bg-primary/20 text-primary border-primary/30">
                                Viral Score: {clip.score}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {clip.status === 'processing' && (
                              <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                            )}
                            {clip.status === 'completed' && (
                              <Check className="w-4 h-4 text-green-400" />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClip(clip.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span className="font-mono">
                            {formatTime(clip.endTime - clip.startTime)}
                          </span>
                          <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
                        </div>
                        {clip.status === 'completed' && clip.downloadUrl && (
                          <Button
                            size="sm"
                            className="w-full mt-2 bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(clip.downloadUrl);
                            }}
                          >
                            <Download className="w-3 h-3 mr-2" /> Download
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="edit" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full p-6 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold mb-2">
                    <Type className="w-4 h-4 text-primary" /> Captions
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-primary bg-primary/10 p-2 rounded text-center text-xs text-white font-bold cursor-pointer">Viral Style</div>
                    <div className="border border-border p-2 rounded text-center text-xs text-muted-foreground hover:bg-secondary cursor-pointer">Minimal</div>
                    <div className="border border-border p-2 rounded text-center text-xs text-muted-foreground hover:bg-secondary cursor-pointer">Typewriter</div>
                    <div className="border border-border p-2 rounded text-center text-xs text-muted-foreground hover:bg-secondary cursor-pointer">Karaoke</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold mb-2">
                    <Settings2 className="w-4 h-4 text-primary" /> Default Layout
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className={`aspect-[9/16] bg-secondary border rounded flex items-center justify-center text-xs cursor-pointer ${aspectRatio === '9:16' ? 'border-primary' : 'border-border'}`}
                      onClick={() => setAspectRatio('9:16')}
                    >
                      Portrait
                    </div>
                    <div
                      className={`aspect-square bg-secondary border rounded flex items-center justify-center text-xs cursor-pointer ${aspectRatio === '1:1' ? 'border-primary' : 'border-border'}`}
                      onClick={() => setAspectRatio('1:1')}
                    >
                      Square
                    </div>
                    <div
                      className={`aspect-video bg-secondary border rounded flex items-center justify-center text-xs cursor-pointer ${aspectRatio === '16:9' ? 'border-primary' : 'border-border'}`}
                      onClick={() => setAspectRatio('16:9')}
                    >
                      Land..
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button className="w-full bg-secondary hover:bg-secondary/80 text-white justify-start" disabled>
                    <Wand2 className="w-4 h-4 mr-2" /> AI Auto-Emoji (Coming Soon)
                  </Button>
                  <Button className="w-full bg-secondary hover:bg-secondary/80 text-white justify-start" disabled>
                    <Music className="w-4 h-4 mr-2" /> Add Background Music (Coming Soon)
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
