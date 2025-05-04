
import { useEffect, useState } from "react";
import { useView } from "../contexts/ViewContext";

// Import all view components
import DashboardView from "./views/DashboardView";
import SatellitesView from "./views/SatellitesView";
import DebrisTrackerView from "./views/DebrisTrackerView";
import AnalyticsView from "./views/AnalyticsView";
import WeatherView from "./views/WeatherView";
import NavigationView from "./views/NavigationView";
import EventsView from "./views/EventsView";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const { activeView } = useView();

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="relative h-24 w-24 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-t-space-accent border-r-space-accent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-2 border-t-space-highlight border-r-transparent border-b-transparent border-l-space-highlight animate-spin animation-delay-200"></div>
          </div>
          <p className="text-xl font-semibold text-space-accent font-space">Loading Orbital Insight AI</p>
          <p className="text-sm text-muted-foreground mt-2">Initializing satellite telemetry...</p>
        </div>
      </div>
    );
  }

  // Render the appropriate view based on active selection
  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "satellites":
        return <SatellitesView />;
      case "debris":
        return <DebrisTrackerView />;
      case "analytics":
        return <AnalyticsView />;
      case "weather":
        return <WeatherView />;
      case "navigation":
        return <NavigationView />;
      case "events":
        return <EventsView />;
      default:
        return <DashboardView />;
    }
  };

  return renderActiveView();
};

export default Dashboard;
