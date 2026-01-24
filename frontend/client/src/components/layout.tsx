import { Link, useLocation } from "wouter";
import { LayoutDashboard, Settings, LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  // Navbar is removed as per user request
  return null;
}

export function Sidebar() {
  const [location] = useLocation();

  const SidebarLink = ({ href, icon: Icon, children }: any) => {
    const isActive = location.startsWith(href);
    return (
      <Link href={href}>
        <a className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${isActive
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
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-card/50 hidden md:flex flex-col p-4 z-50">
      <div className="mb-8 px-2">
        <Link href="/">
          <a className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Zap className="w-5 h-5 text-primary fill-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white uppercase italic">ClipForge</span>
          </a>
        </Link>
      </div>

      <div className="space-y-1">
        <SidebarLink href="/dashboard" icon={LayoutDashboard}>Projects</SidebarLink>
        <SidebarLink href="/settings" icon={Settings}>Settings</SidebarLink>
      </div>

      <div className="mt-auto">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white gap-3">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
