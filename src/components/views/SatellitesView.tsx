
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Satellite, Signal, ShieldAlert, BarChart } from "lucide-react";
import Globe from "../Globe";
import SatelliteInfo from "../SatelliteInfo";
import { satelliteList, SatelliteData } from "../../utils/satelliteData";

const SatellitesView = () => {
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData | null>(null);
  
  const handleSatelliteSelect = (satellite: SatelliteData) => {
    setSelectedSatellite(satellite);
  };

  return (
    <div className="grid-pattern h-full flex flex-col">
      <div className="p-4 mb-4">
        <h2 className="text-2xl font-bold font-space text-space-accent">Satellite Network</h2>
        <p className="text-muted-foreground">Monitor and manage satellite fleet in real-time</p>
      </div>
      
      <div className="flex-1 px-4 pb-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 flex flex-col">
          {/* Map */}
          <div className="relative h-[500px] mb-4 rounded-lg overflow-hidden">
            <Globe 
              onSatelliteSelect={handleSatelliteSelect} 
              selectedSatelliteId={selectedSatellite?.id}
            />
          </div>
          
          {/* Satellite list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {satelliteList.map((sat) => (
              <Card 
                key={sat.id} 
                className={`card-gradient hover-glow cursor-pointer ${selectedSatellite?.id === sat.id ? 'border-space-accent' : ''}`}
                onClick={() => handleSatelliteSelect(sat)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Satellite className="h-5 w-5 text-space-accent mr-2" />
                      <h3 className="font-space font-medium">{sat.name}</h3>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs ${
                      sat.status === 'active' ? 'bg-space-success/20 text-space-success' :
                      sat.status === 'warning' ? 'bg-space-warning/20 text-space-warning' :
                      'bg-space-alert/20 text-space-alert'
                    }`}>
                      {sat.status}
                    </div>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{sat.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Altitude:</span>
                      <span>{sat.altitude} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inclination:</span>
                      <span>{sat.inclination}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position:</span>
                      <span>{sat.latitude.toFixed(1)}°, {sat.longitude.toFixed(1)}°</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <SatelliteInfo satellite={selectedSatellite} />
          
          {selectedSatellite && (
            <>
              <Card className="card-gradient">
                <CardHeader className="pb-2">
                  <CardTitle className="text-space-accent flex items-center text-sm">
                    <Signal className="h-4 w-4 mr-2" />
                    Telemetry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mission</p>
                      <p>{selectedSatellite.mission}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Owner</p>
                      <p>{selectedSatellite.owner}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Launch Date</p>
                      <p>{selectedSatellite.launchDate}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex space-x-2">
                        <button className="bg-space-bright-blue hover:bg-space-blue text-white py-1 px-3 rounded text-xs transition-colors">
                          Track
                        </button>
                        <button className="bg-muted/30 hover:bg-muted/40 py-1 px-3 rounded text-xs transition-colors">
                          Details
                        </button>
                      </div>
                      <div className="flex items-center text-space-warning">
                        <ShieldAlert className="h-4 w-4 mr-1" />
                        <span className="text-xs">Secure Channel</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="card-gradient">
                <CardHeader className="pb-2">
                  <CardTitle className="text-space-accent flex items-center text-sm">
                    <BarChart className="h-4 w-4 mr-2" />
                    Health Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Battery</span>
                        <span>87%</span>
                      </div>
                      <div className="h-1.5 bg-muted/20 rounded-full mt-1">
                        <div className="h-full bg-space-success rounded-full" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Signal Strength</span>
                        <span>92%</span>
                      </div>
                      <div className="h-1.5 bg-muted/20 rounded-full mt-1">
                        <div className="h-full bg-space-accent rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Temperature</span>
                        <span>Normal</span>
                      </div>
                      <div className="h-1.5 bg-muted/20 rounded-full mt-1">
                        <div className="h-full bg-space-success rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SatellitesView;
