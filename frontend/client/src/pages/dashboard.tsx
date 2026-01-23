import { Navbar, Sidebar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, Link as LinkIcon, Clock, MoreVertical, Play, Film, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProjects, useCreateProject, useVideoInfo } from "@/hooks/use-projects";
import type { Project, VideoInfo } from "@/lib/types";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: projects, isLoading, error, refetch } = useProjects();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Sidebar />

      <main className="pt-20 md:pl-64 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-6xl">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">My Projects</h1>
              <p className="text-muted-foreground">Manage your videos and generated clips.</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <NewProjectDialog />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-red-400">Failed to load projects</p>
                <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && projects?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                <Film className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No projects yet</h2>
              <p className="text-muted-foreground mb-6">Create your first project to start clipping videos</p>
              <NewProjectDialog />
            </div>
          )}

          {/* Projects Grid */}
          {!isLoading && !error && projects && projects.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: Project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setLocation(`/editor/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NewProjectDialog() {
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data: videoInfo, isLoading: isLoadingInfo, error: infoError } = useVideoInfo(url, url.includes('youtube.com') || url.includes('youtu.be'));
  const createProject = useCreateProject();

  // Auto-fill title from video info
  useEffect(() => {
    if (videoInfo && !title) {
      setTitle(videoInfo.title);
    }
  }, [videoInfo, title]);

  const handleCreate = async () => {
    if (!url) {
      toast({ title: "Error", description: "Please enter a YouTube URL", variant: "destructive" });
      return;
    }

    try {
      const result = await createProject.mutateAsync({
        title: title || videoInfo?.title || "Untitled Project",
        youtubeUrl: url,
        userId: 1, // TODO: Get from auth
        quality: '720p',
        downloader: 'auto',
      });

      toast({
        title: "Project Created!",
        description: "Video download started. This may take a few minutes.",
      });

      setIsOpen(false);
      setUrl("");
      setTitle("");

      // Navigate to editor
      setLocation(`/editor/${result.projectId}`);
    } catch (error) {
      toast({
        title: "Failed to create project",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-primary text-black font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <Plus className="mr-2 w-5 h-5" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold">Import Video</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="url" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
            <TabsTrigger value="url">YouTube / Link</TabsTrigger>
            <TabsTrigger value="upload" disabled>Upload File</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  className="pl-10 bg-secondary/30 border-white/10"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Video Preview */}
            {isLoadingInfo && url && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching video info...</span>
              </div>
            )}

            {infoError && (
              <div className="text-red-400 text-sm">
                Failed to fetch video info. Please check the URL.
              </div>
            )}

            {videoInfo && (
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <div className="flex gap-4">
                  {videoInfo.thumbnail && (
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate">{videoInfo.title}</h4>
                    <p className="text-sm text-muted-foreground">{videoInfo.author}</p>
                    <p className="text-sm text-primary">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatDuration(videoInfo.duration)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter project title"
                    className="bg-secondary/30 border-white/10"
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full bg-primary text-black font-bold"
              onClick={handleCreate}
              disabled={!url || createProject.isPending}
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Video will be downloaded and processed. This may take 2-5 minutes.
            </p>
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center bg-secondary/20">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-white mb-2">Upload coming soon</p>
              <p className="text-sm text-muted-foreground">Currently only YouTube links are supported</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  const isProcessing = project.status === 'processing' || project.status === 'pending';
  const isFailed = project.status === 'failed';

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <Card
      className={`overflow-hidden border-white/5 bg-card transition-all group cursor-pointer ${isFailed ? 'border-red-500/30 hover:border-red-500/50' : 'hover:border-primary/30'
        }`}
      onClick={onClick}
    >
      <div className="aspect-video bg-black relative">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <Film className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white flex items-center gap-1">
          <Clock className="w-3 h-3" /> {formatDuration(project.duration)}
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="font-bold text-white mb-2">Processing...</p>
            <p className="text-xs text-muted-foreground">Video is being downloaded</p>
          </div>
        )}

        {isFailed && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6">
            <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
            <p className="font-bold text-red-400 mb-2">Failed</p>
            <p className="text-xs text-muted-foreground">Click to retry</p>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-white line-clamp-1 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-white" onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatDate(project.createdAt)}</span>
          <div className="flex items-center gap-1">
            <Play className="w-3 h-3 text-primary" />
            <span className="text-white font-medium">{project.clipCount || 0} Clips</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
