import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle2, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
        <div className="absolute inset-0 z-0 opacity-40">
           <img src="/hero-bg.png" alt="Background" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/80 to-background" />
        </div>

        <div className="container mx-auto relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Video Clipping 2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Turn Long Videos into <br />
            <span className="orange-gradient-text text-glow">Viral Shorts</span> Instantly
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Upload your podcast, interview, or stream. Our AI detects the best moments, adds captions, and reformats for TikTok & Reels in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-black w-full sm:w-auto shadow-[0_0_20px_rgba(255,102,0,0.4)] transition-all hover:scale-105">
                Start Creating Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg w-full sm:w-auto border-white/10 hover:bg-white/5">
              <Play className="mr-2 w-5 h-5" /> Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-6 font-medium tracking-wide">TRUSTED BY 10,000+ CREATORS</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
             {/* Mock Logos */}
             <div className="text-xl font-bold font-display">PODCAST.IO</div>
             <div className="text-xl font-bold font-display">STREAMIFY</div>
             <div className="text-xl font-bold font-display">CREATOR+</div>
             <div className="text-xl font-bold font-display">VIRALCLIPS</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-primary" />}
              title="AI Highlight Detection"
              description="Automatically finds the most engaging hooks and funny moments in your footage."
            />
            <FeatureCard 
              icon={<div className="font-bold text-2xl text-primary">Tt</div>}
              title="Auto-Captions"
              description="99% accurate transcriptions with customizable animated styles for social media."
            />
            <FeatureCard 
              icon={<div className="w-8 h-8 rounded border-2 border-primary flex items-center justify-center font-bold text-xs text-primary">9:16</div>}
              title="Smart Reframe"
              description="Intelligently keeps speakers in frame for vertical video formats automatically."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="p-8 rounded-2xl bg-card border border-white/5 hover:border-primary/50 transition-all duration-300 group hover:bg-white/[0.02]">
      <div className="mb-6 p-4 rounded-full bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold mb-3 text-white">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
