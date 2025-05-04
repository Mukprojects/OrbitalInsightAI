
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AlertTriangle, Shield, Search, Filter, ArrowRight } from "lucide-react";
import Globe from "../Globe";
import { Progress } from "../ui/progress";

const DebrisTrackerView = () => {
  const [debrisCount, setDebrisCount] = useState(157);
  const [criticalAlerts, setCriticalAlerts] = useState(3);
  
  const debrisList = [
    {
      id: "deb-001",
      name: "Debris Object Alpha",
      size: "Medium (10-20cm)",
      velocity: 27400,
      altitude: 620,
      risk: "high",
      origin: "Defunct Satellite",
      lastUpdated: "2 hours ago"
    },
    {
      id: "deb-002",
      name: "Rocket Body Fragment",
      size: "Large (>20cm)",
      velocity: 28100,
      altitude: 540,
      risk: "high",
      origin: "Launch Vehicle",
      lastUpdated: "4 hours ago"
    },
    {
      id: "deb-003",
      name: "Microsat Debris",
      size: "Small (1-10cm)",
      velocity: 26800,
      altitude: 710,
      risk: "medium",
      origin: "Satellite Collision",
      lastUpdated: "1 day ago"
    },
    {
      id: "deb-004",
      name: "Unknown Fragment",
      size: "Small (1-10cm)",
      velocity: 27200,
      altitude: 680,
      risk: "low",
      origin: "Unknown",
      lastUpdated: "3 days ago"
    },
    {
      id: "deb-005",
      name: "Solar Panel Fragment",
      size: "Medium (10-20cm)",
      velocity: 26900,
      altitude: 590,
      risk: "medium",
      origin: "Astronaut Activity",
      lastUpdated: "2 days ago"
    }
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDebrisCount(prev => Math.floor(prev + (Math.random() * 2) - 0.5));
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-space-alert";
      case "medium": return "text-space-warning";
      case "low": return "text-space-success";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="grid-pattern h-full flex flex-col">
      <div className="p-4 mb-4">
        <h2 className="text-2xl font-bold font-space text-space-accent">Space Debris Tracker</h2>
        <p className="text-muted-foreground">Monitor and predict orbital debris movement and collision risks</p>
      </div>
      
      <div className="flex-1 px-4 pb-4 grid grid-cols-12 gap-4">
        {/* Stats cards */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm mb-1">Total Objects</div>
              <div className="text-2xl font-bold font-space text-space-accent">{debrisCount}</div>
              <div className="text-xs text-muted-foreground">Currently tracked</div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm mb-1">Critical Alerts</div>
              <div className="text-2xl font-bold font-space text-space-alert">{criticalAlerts}</div>
              <div className="text-xs text-muted-foreground">Require attention</div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm mb-1">Collision Risk</div>
              <div className="text-2xl font-bold font-space text-space-warning">14%</div>
              <div className="text-xs text-muted-foreground">Global assessment</div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm mb-1">AI Predictions</div>
              <div className="text-2xl font-bold font-space text-space-success">8</div>
              <div className="text-xs text-muted-foreground">New mitigation plans</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main view */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-4">
          <div className="card-gradient rounded-lg p-1 h-[500px] relative">
            <Globe onSatelliteSelect={() => {}} />
            <div className="absolute top-2 right-2 bg-space-dark-blue/80 rounded px-3 py-1 text-xs">
              <div className="text-space-accent font-space">DEBRIS VIEW ACTIVE</div>
            </div>
          </div>
          
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center text-sm font-space">
                <AlertTriangle className="h-4 w-4 mr-2 text-space-warning" />
                HIGH RISK COLLISION PREDICTION
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm mb-3">
                    <span className="text-space-warning font-medium">Alert:</span> Potential collision between Debris Object Alpha and GlobalSat-1
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time to closest approach:</span>
                      <span className="font-medium">18h 24m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Probability:</span>
                      <span className="font-medium">12.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Miss distance:</span>
                      <span className="font-medium">143 meters</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-3 text-sm">
                    <div className="font-space text-space-accent mb-1">Recommended Actions</div>
                    <div className="text-muted-foreground">Satellite orbit adjustment required</div>
                  </div>
                  <div className="flex justify-end">
                    <button className="bg-space-blue text-white px-4 py-2 rounded-md text-sm hover:bg-space-bright-blue transition-colors flex items-center">
                      <span>View Collision Scenario</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="card-gradient h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center justify-between text-sm font-space">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  DEBRIS OBJECTS
                </div>
                <div className="flex items-center space-x-2">
                  <Search className="h-3.5 w-3.5" />
                  <Filter className="h-3.5 w-3.5" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-56px)] overflow-y-auto">
              <div className="space-y-3">
                {debrisList.map(debris => (
                  <div key={debris.id} className="bg-muted/20 rounded-md p-3">
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">{debris.name}</div>
                      <div className={`text-xs ${getRiskColor(debris.risk)}`}>
                        {debris.risk.toUpperCase()} RISK
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span>{debris.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Altitude:</span>
                        <span>{debris.altitude} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Velocity:</span>
                        <span>{debris.velocity} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Origin:</span>
                        <span>{debris.origin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span>{debris.lastUpdated}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex space-x-2">
                      <button className="bg-muted/30 hover:bg-muted/40 px-2 py-1 rounded text-xs transition-colors">
                        Track
                      </button>
                      <button className="bg-muted/30 hover:bg-muted/40 px-2 py-1 rounded text-xs transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DebrisTrackerView;
