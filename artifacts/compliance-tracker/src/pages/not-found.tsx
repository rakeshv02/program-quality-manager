import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
      <p className="text-gray-500 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved. Check the URL or navigate back to the dashboard.
      </p>
      <Link href="/dashboard">
        <Button className="bg-primary hover:bg-primary/90">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
