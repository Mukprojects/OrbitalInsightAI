
import Globe from "../Globe";
import SatelliteInfo from "../SatelliteInfo";
import PredictionCard from "../PredictionCard";
import MetricsPanel from "../MetricsPanel";
import EventsList from "../EventsList";
import { useState } from "react";

const DashboardView = () => {
  const [selectedSatellite, setSelectedSatellite] = useState<null | {
    id: string;
    name: string;
    type: string;
    altitude: number;
    velocity: number;
    inclination: number;
    status: "active" | "inactive" | "warning";
  }>(null);

  const handleSatelliteSelect = (satellite: any) => {
    setSelectedSatellite(satellite);
  };

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

export default DashboardView;
