
import { useEffect, useState } from "react";
import Globe from "../Globe";
import SatelliteInfo from "../SatelliteInfo";
import PredictionCard from "../PredictionCard";
import MetricsPanel from "../MetricsPanel";
import EventsList from "../EventsList";
import { ScrollArea } from "../ui/scroll-area";
import { Card } from "../ui/card";

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

  // Add an effect to display a welcome toast on component load
  useEffect(() => {
    // The toast would go here if we had Supabase set up
  }, []);

  return (
    <div className="grid-pattern h-full">
      <div className="p-4 gap-4 grid grid-cols-12">
        {/* Left sidebar */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 space-y-4 hidden md:block">
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="pr-3 space-y-4">
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
              <PredictionCard
                title="Satellite Health"
                value="98%"
                trend="stable"
                status="success"
                details="All systems operational"
              />
              <PredictionCard
                title="Network Latency"
                value="38ms"
                trend="down"
                status="success"
                details="Improved by 12ms since yesterday"
              />
            </div>
          </ScrollArea>
        </div>

        {/* Main content - Globe */}
        <Card className="col-span-12 md:col-span-6 lg:col-span-7 relative rounded-lg overflow-hidden border border-space-accent/20 bg-black/30 backdrop-blur-sm">
          <div className="h-[70vh]">
            <Globe onSatelliteSelect={handleSatelliteSelect} />
          </div>
        </Card>

        {/* Right sidebar */}
        <div className="col-span-12 md:col-span-3 lg:col-span-3 space-y-4 hidden md:block">
          <ScrollArea className="h-[calc(70vh-2rem)]">
            <div className="pr-3 space-y-4">
              <SatelliteInfo satellite={selectedSatellite} />
              <MetricsPanel />
            </div>
          </ScrollArea>
        </div>

        {/* Bottom panel */}
        <div className="col-span-12 h-64 mt-4">
          <Card className="h-full border border-space-accent/20 bg-black/30 backdrop-blur-sm p-2">
            <ScrollArea className="h-full">
              <EventsList />
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
