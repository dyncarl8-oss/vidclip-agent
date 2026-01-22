import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md mx-4 bg-card border-border">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-2">404 Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The page you are looking for doesn't exist or has been moved.
          </p>
          
          <Link href="/">
            <Button className="w-full bg-primary text-black font-bold">
              <ArrowLeft className="mr-2 w-4 h-4" /> Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
