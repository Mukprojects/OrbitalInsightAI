
import { useEffect, useRef, useState } from "react";
import Globe from "./Globe";
import SatelliteInfo from "./SatelliteInfo";
import PredictionCard from "./PredictionCard";
import MetricsPanel from "./MetricsPanel";
import EventsList from "./EventsList";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedSatellite, setSelectedSatellite] = useState<null | {
    id: string;
    name: string;
    type: string;
    altitude: number;
    velocity: number;
    inclination: number;
    status: "active" | "inactive" | "warning";
  }>(null);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSatelliteSelect = (satellite: any) => {
    setSelectedSatellite(satellite);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="relative h-24 w-24 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-t-space-accent border-r-space-accent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-2 border-t-space-highlight border-r-transparent border-b-transparent border-l-space-highlight animate-spin animation-delay-200"></div>
          </div>
          <p className="text-xl font-semibold text-space-accent">Loading Orbital Insight AI</p>
          <p className="text-sm text-muted-foreground mt-2">Initializing satellite telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-pattern h-full flex flex-col">
      <div className="flex-1 p-4 overflow-hidden grid grid-cols-12 gap-4">
        {/* Left sidebar */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 space-y-4 overflow-y-auto hidden md:block">
          <PredictionCard
            title="Debris Collision Risk"
            value="12%"
            trend="up"
            status="warning"
            details="3 objects requiring attention"
          />
          <PredictionCard
            title="Weather Anomalies"
            value="4"
            trend="up"
            status="warning"
            details="Tropical storm forming in Pacific"
          />
          <PredictionCard
            title="Deforestation Alert"
            value="1.2km²"
            trend="down"
            status="success"
            details="Reduced by 0.3km² from last week"
          />
        </div>

        {/* Main content - Globe */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 relative">
          <div className="absolute inset-0">
            <Globe onSatelliteSelect={handleSatelliteSelect} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="col-span-12 md:col-span-3 lg:col-span-3 space-y-4 overflow-y-auto hidden md:block">
          <SatelliteInfo satellite={selectedSatellite} />
          <MetricsPanel />
        </div>

        {/* Bottom panel */}
        <div className="col-span-12 h-36 hidden lg:block">
          <EventsList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
