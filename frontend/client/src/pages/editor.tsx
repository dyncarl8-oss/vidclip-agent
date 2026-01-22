import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Download, Share2, Scissors, 
  Play, Pause, SkipBack, SkipForward, Settings2,
  Type, Music, Wand2
} from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "wouter";

// Mock data for clips
const MOCK_CLIPS = [
  { id: 1, title: "The Future of AI is Here", duration: "0:58", score: 98, start: "12:30", end: "13:28" },
  { id: 2, title: "Why Startups Fail", duration: "0:45", score: 92, start: "04:15", end: "05:00" },
  { id: 3, title: "Funny Moment: Coffee Spilled", duration: "0:23", score: 85, start: "22:10", end: "22:33" },
  { id: 4, title: "Coding in 2026", duration: "1:02", score: 78, start: "45:00", end: "46:02" },
];

export default function Editor() {
  const [selectedClip, setSelectedClip] = useState(MOCK_CLIPS[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <Navbar />
      
      {/* Editor Header */}
      <div className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-4 pt-16">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-white leading-tight">Lex Fridman Podcast #452</h2>
            <p className="text-xs text-muted-foreground">Processed 2 hours ago</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex">
             <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          <Button size="sm" className="bg-primary text-black font-bold">
             <Download className="w-4 h-4 mr-2" /> Export Clip
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Player & Timeline */}
        <div className="flex-1 flex flex-col bg-black relative">
          
          {/* Main Player Area */}
          <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=800&q=80')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* The Actual Player Frame */}
            <div className="relative z-10 aspect-[9/16] h-full max-h-[600px] bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-white/10 group">
              {/* Fake Video Content */}
              <img 
                src="https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=800&q=80" 
                className="w-full h-full object-cover" 
                alt="Video Preview"
              />
              
              {/* Overlay Captions Mock */}
              <div className="absolute bottom-20 left-4 right-4 text-center">
                <span className="bg-black/50 text-white text-xl font-display font-bold px-2 py-1 rounded shadow-lg backdrop-blur-md">
                   The thing about AGI is...
                </span>
              </div>

              {/* Player Controls Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" className="w-16 h-16 rounded-full bg-primary/90 text-black hover:bg-primary hover:scale-105 transition-all" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline & Tools Bar */}
          <div className="h-32 bg-card border-t border-border p-4 flex flex-col gap-2">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><SkipBack className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><SkipForward className="w-4 h-4" /></Button>
                  <span className="font-mono text-xs ml-2 text-muted-foreground">00:12:34 / 02:14:05</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5 cursor-pointer hover:bg-primary/10">
                    <Scissors className="w-3 h-3 mr-1" /> Trim Mode
                  </Badge>
                </div>
             </div>
             
             {/* Fake Waveform */}
             <div className="w-full h-12 bg-secondary/30 rounded flex items-center px-2 gap-1 overflow-hidden relative">
               {Array.from({ length: 100 }).map((_, i) => (
                 <div 
                   key={i} 
                   className={`w-1 rounded-full ${i > 40 && i < 60 ? 'bg-primary h-8' : 'bg-muted-foreground/30 h-4'}`}
                 />
               ))}
               <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_10px_white]" />
             </div>
          </div>
        </div>

        {/* Right: Sidebar Panel */}
        <div className="w-96 bg-card border-l border-border flex flex-col">
          <Tabs defaultValue="clips" className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <TabsList className="w-full grid grid-cols-2 bg-secondary/50">
                <TabsTrigger value="clips">AI Clips</TabsTrigger>
                <TabsTrigger value="edit">Edit Styling</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="clips" className="flex-1 overflow-hidden m-0">
               <ScrollArea className="h-full">
                 <div className="p-4 space-y-3">
                   {MOCK_CLIPS.map((clip) => (
                     <div 
                       key={clip.id}
                       className={`p-3 rounded-lg border transition-all cursor-pointer ${
                         selectedClip.id === clip.id 
                           ? 'bg-primary/10 border-primary' 
                           : 'bg-secondary/20 border-transparent hover:bg-secondary/40'
                       }`}
                       onClick={() => setSelectedClip(clip)}
                     >
                       <div className="flex justify-between items-start mb-1">
                         <h4 className={`font-bold text-sm ${selectedClip.id === clip.id ? 'text-primary' : 'text-white'}`}>
                           {clip.title}
                         </h4>
                         <Badge className={`${
                           clip.score > 90 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                         } border-0 text-[10px] px-1.5`}>
                           {clip.score} Score
                         </Badge>
                       </div>
                       <div className="flex justify-between text-xs text-muted-foreground mt-2">
                         <span className="font-mono">{clip.duration}</span>
                         <span>{clip.start} - {clip.end}</span>
                       </div>
                     </div>
                   ))}
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
                     <Settings2 className="w-4 h-4 text-primary" /> Layout
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                     <div className="aspect-[9/16] bg-secondary border border-primary rounded flex items-center justify-center text-xs">Portrait</div>
                     <div className="aspect-square bg-secondary border border-border rounded flex items-center justify-center text-xs">Square</div>
                     <div className="aspect-video bg-secondary border border-border rounded flex items-center justify-center text-xs">Land..</div>
                   </div>
                 </div>
                 
                 <div className="space-y-4">
                    <Button className="w-full bg-secondary hover:bg-secondary/80 text-white justify-start">
                       <Wand2 className="w-4 h-4 mr-2" /> AI Auto-Emoji
                    </Button>
                    <Button className="w-full bg-secondary hover:bg-secondary/80 text-white justify-start">
                       <Music className="w-4 h-4 mr-2" /> Add Background Music
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
