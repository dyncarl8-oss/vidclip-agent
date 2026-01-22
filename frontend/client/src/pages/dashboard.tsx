import { Navbar, Sidebar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, Link as LinkIcon, Clock, MoreVertical, Play, Film } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const [, setLocation] = useLocation();

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
            
            <NewProjectDialog />
          </div>

          {/* Empty State or Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock Project 1 */}
            <ProjectCard 
              title="Lex Fridman Podcast #452"
              date="2 hours ago"
              duration="2:14:05"
              clips={12}
              thumbnail="https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=800&q=80"
              status="completed"
              onClick={() => setLocation("/editor/1")}
            />
            
            {/* Mock Project 2 */}
            <ProjectCard 
              title="Tech Crunch Disrupt 2025"
              date="Yesterday"
              duration="45:20"
              clips={5}
              thumbnail="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80"
              status="completed"
              onClick={() => setLocation("/editor/2")}
            />

            {/* Mock Project 3 - Processing */}
            <ProjectCard 
              title="Weekly Team Sync"
              date="Just now"
              duration="--"
              clips={0}
              thumbnail=""
              status="processing"
              progress={45}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function NewProjectDialog() {
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState("");

  const handleCreate = () => {
    // Mock create
    setLocation("/editor/new");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-primary text-black font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <Plus className="mr-2 w-5 h-5" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold">Import Video</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="url">YouTube / Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-10 flex flex-col items-center justify-center text-center bg-secondary/20 cursor-pointer" onClick={handleCreate}>
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-white mb-2">Click to upload video</p>
              <p className="text-sm text-muted-foreground">MP4, MOV up to 2GB</p>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Video URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="https://youtube.com/watch?v=..." 
                    className="pl-10 bg-secondary/30 border-white/10"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <Button className="bg-primary text-black font-bold" onClick={handleCreate}>Import</Button>
              </div>
              <p className="text-xs text-muted-foreground">Supports YouTube, Vimeo, and direct MP4 links.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ProjectCard({ title, date, duration, clips, thumbnail, status, progress, onClick }: any) {
  return (
    <Card className="overflow-hidden border-white/5 bg-card hover:border-primary/30 transition-all group cursor-pointer" onClick={onClick}>
      <div className="aspect-video bg-black relative">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <Film className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white flex items-center gap-1">
          <Clock className="w-3 h-3" /> {duration}
        </div>

        {status === 'processing' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6">
             <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
             <p className="font-bold text-white mb-2">Analyzing...</p>
             <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
             </div>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-white line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-white">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{date}</span>
          <div className="flex items-center gap-1">
             <Play className="w-3 h-3 text-primary" />
             <span className="text-white font-medium">{clips} Clips</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
