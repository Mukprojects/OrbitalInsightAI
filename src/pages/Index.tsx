
import { useEffect } from "react";
import { Toaster } from "sonner";
import Dashboard from "../components/Dashboard";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import { ViewProvider } from "../contexts/ViewContext";

const Index = () => {
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  return (
    <ViewProvider>
      <div className="flex flex-col h-screen w-full overflow-hidden bg-space-dark-blue text-foreground">
        <Toaster position="top-right" richColors closeButton />
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden bg-space-gradient">
            <Dashboard />
          </main>
        </div>
        <StatusBar />
      </div>
    </ViewProvider>
  );
};

export default Index;
