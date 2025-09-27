
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Dashboard from "../components/Dashboard";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import { ViewProvider } from "../contexts/ViewContext";
import { ScrollArea } from "../components/ui/scroll-area";
import { useAuth } from "../hooks/useAuth";
import useWebSocket, { useAlertNotifications, useSpaceWeatherUpdates, useHeartbeat } from "../hooks/useWebSocket";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { connect, isConnected, connectionState } = useWebSocket();
  
  // Initialize WebSocket connection and real-time features
  useAlertNotifications(); // This will show toast notifications for alerts
  useSpaceWeatherUpdates(); // This will show weather alerts
  const heartbeat = useHeartbeat(); // Connection monitoring

  useEffect(() => {
    if (isAuthenticated && !isConnected) {
      connect().catch(console.error);
    }
  }, [isAuthenticated, isConnected, connect]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-space-dark-blue">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-space-accent" />
          <p className="text-white text-xl font-space">Loading Orbital Insight AI...</p>
          <p className="text-space-accent mt-2">Initializing satellite telemetry systems</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ViewProvider>
      <div className="flex flex-col h-screen w-full bg-space-dark-blue text-foreground">
        <Toaster position="top-right" richColors closeButton />
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <ScrollArea className="flex-1 h-full bg-space-gradient">
            <main className="min-h-full">
              <Dashboard />
            </main>
          </ScrollArea>
        </div>
        <StatusBar 
          connectionState={connectionState}
          heartbeat={heartbeat}
        />
      </div>
    </ViewProvider>
  );
};

export default Index;
