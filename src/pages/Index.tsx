
import { useEffect } from "react";
import { Toaster } from "sonner";
import Dashboard from "../components/Dashboard";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import { ViewProvider } from "../contexts/ViewContext";
import { ScrollArea } from "../components/ui/scroll-area";

const Index = () => {
  // We're removing the overflow-hidden from the body to allow proper scrolling
  // Instead, we'll handle overflow within our components

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
        <StatusBar />
      </div>
    </ViewProvider>
  );
};

export default Index;
