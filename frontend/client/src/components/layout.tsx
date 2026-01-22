import { Link, useLocation } from "wouter";
import { Zap, Menu, X, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <a className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`}>
          {children}
        </a>
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Zap className="w-5 h-5 text-primary fill-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">ClipForge</span>
          </a>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/docs">Docs</NavLink>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-white">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l border-border bg-card">
              <div className="flex flex-col gap-6 mt-8">
                <Link href="/dashboard">
                  <a className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>Dashboard</a>
                </Link>
                <Link href="/pricing">
                  <a className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>Pricing</a>
                </Link>
                <Link href="/docs">
                  <a className="text-lg font-medium" onClick={() => setIsMobileOpen(false)}>Documentation</a>
                </Link>
                <div className="h-px bg-border my-2" />
                <Link href="/auth">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setIsMobileOpen(false)}>Sign In</Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="w-full bg-primary text-black font-bold" onClick={() => setIsMobileOpen(false)}>Get Started</Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  
  const SidebarLink = ({ href, icon: Icon, children }: any) => {
    const isActive = location.startsWith(href);
    return (
      <Link href={href}>
        <a className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
          isActive 
            ? "bg-primary/10 text-primary border-r-2 border-primary" 
            : "text-muted-foreground hover:text-white hover:bg-white/5"
        }`}>
          <Icon className="w-5 h-5" />
          <span className="font-medium">{children}</span>
        </a>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-border bg-card/50 hidden md:flex flex-col p-4">
      <div className="space-y-1">
        <SidebarLink href="/dashboard" icon={LayoutDashboard}>Projects</SidebarLink>
        <SidebarLink href="/settings" icon={Settings}>Settings</SidebarLink>
      </div>
      
      <div className="mt-auto">
        <div className="bg-secondary/50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-muted-foreground">CREDITS</span>
            <span className="text-xs font-bold text-white">45/100 min</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[45%]" />
          </div>
          <Button variant="link" className="text-xs text-primary h-auto p-0 mt-2">Upgrade Plan</Button>
        </div>
        
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white gap-3">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
