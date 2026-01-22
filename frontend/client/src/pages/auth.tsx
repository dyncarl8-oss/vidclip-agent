import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <img src="/hero-bg.png" className="w-full h-full object-cover opacity-20" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit mb-2">
             <Zap className="w-8 h-8 text-primary fill-primary" />
          </div>
          <CardTitle className="text-3xl font-display font-bold text-white">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access ClipForge</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="creator@example.com" className="bg-secondary/50 border-white/10" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" className="bg-secondary/50 border-white/10" required />
            </div>
            <Button type="submit" className="w-full bg-primary text-black font-bold h-11" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/5 pt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account? <Link href="/auth"><a className="text-primary hover:underline">Sign up</a></Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
