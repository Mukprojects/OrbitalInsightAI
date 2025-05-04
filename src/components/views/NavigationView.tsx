
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Compass, Navigation, Map, MapPin, LocateFixed, Route, ArrowRight, AlertTriangle } from "lucide-react";
import Globe from "../Globe";

const NavigationView = () => {
  const [selectedRoute, setSelectedRoute] = useState("route-1");
  
  const routes = [
    {
      id: "route-1",
      name: "Atlantic Shipping Lane",
      origin: "Port of New York",
      destination: "Port of Rotterdam",
      distance: "5,842 km",
      status: "clear",
      traffic: "medium",
      weather: "favorable"
    },
    {
      id: "route-2",
      name: "Pacific Trade Route",
      origin: "Shanghai Port",
      destination: "Port of Los Angeles",
      distance: "10,564 km",
      status: "warning",
      traffic: "high",
      weather: "storm warning"
    },
    {
      id: "route-3",
      name: "Suez Canal Passage",
      origin: "Port Said",
      destination: "Suez",
      distance: "193 km",
      status: "clear",
      traffic: "high",
      weather: "favorable"
    },
    {
      id: "route-4",
      name: "Northwest Passage",
      origin: "Baffin Bay",
      destination: "Beaufort Sea",
      distance: "2,400 km",
      status: "warning",
      traffic: "low",
      weather: "ice conditions"
    }
  ];
  
  const pointsOfInterest = [
    {
      id: "poi-1",
      name: "Tropical Storm Elena",
      type: "weather",
      location: "North Atlantic",
      impact: "high",
      description: "Active storm system affecting shipping lanes"
    },
    {
      id: "poi-2",
      name: "Port Congestion",
      type: "logistics",
      location: "Los Angeles",
      impact: "medium",
      description: "43 ships waiting for berth assignment"
    },
    {
      id: "poi-3",
      name: "Piracy Risk Zone",
      type: "security",
      location: "Gulf of Guinea",
      impact: "high",
      description: "Elevated security concerns for commercial vessels"
    }
  ];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "warning": return "text-space-warning";
      case "danger": return "text-space-alert";
      case "clear": return "text-space-success";
      default: return "text-muted-foreground";
    }
  };
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-space-alert";
      case "medium": return "text-space-warning";
      case "low": return "text-space-success";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="grid-pattern h-full flex flex-col">
      <div className="p-4 mb-2">
        <h2 className="text-2xl font-bold font-space text-space-accent">Navigation & Routing</h2>
        <p className="text-muted-foreground">Global maritime traffic and optimal route planning</p>
      </div>
      
      <div className="flex-1 px-4 pb-4 grid grid-cols-12 gap-4">
        {/* Navigation stats */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-gradient">
            <CardContent className="p-3 flex items-center">
              <div className="p-2 rounded-full bg-space-accent/10 mr-3">
                <Navigation className="h-6 w-6 text-space-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Active Vessels</div>
                <div className="text-lg font-bold font-space">12,842</div>
                <div className="text-xs text-space-success">+3% from avg</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-3 flex items-center">
              <div className="p-2 rounded-full bg-space-accent/10 mr-3">
                <Route className="h-6 w-6 text-space-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Active Routes</div>
                <div className="text-lg font-bold font-space">147</div>
                <div className="text-xs text-muted-foreground">Major sea lanes</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-3 flex items-center">
              <div className="p-2 rounded-full bg-space-accent/10 mr-3">
                <AlertTriangle className="h-6 w-6 text-space-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Route Alerts</div>
                <div className="text-lg font-bold font-space">8</div>
                <div className="text-xs text-space-warning">2 high priority</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-3 flex items-center">
              <div className="p-2 rounded-full bg-space-accent/10 mr-3">
                <Map className="h-6 w-6 text-space-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ports Monitored</div>
                <div className="text-lg font-bold font-space">314</div>
                <div className="text-xs text-muted-foreground">Global network</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main view */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-4">
          <div className="card-gradient rounded-lg p-1 h-[450px] relative">
            <Globe onSatelliteSelect={() => {}} />
            <div className="absolute top-2 right-2 bg-space-dark-blue/80 rounded px-3 py-1 text-xs">
              <div className="text-space-accent font-space">NAVIGATION VIEW ACTIVE</div>
            </div>
          </div>
          
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center justify-between text-sm font-space">
                <div className="flex items-center">
                  <Route className="h-4 w-4 mr-2" />
                  MAJOR SHIPPING ROUTES
                </div>
                <button className="text-xs bg-muted/20 px-2 py-1 rounded hover:bg-muted/30 transition-colors flex items-center">
                  <span>All Routes</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {routes.map(route => (
                  <div 
                    key={route.id} 
                    className={`bg-muted/20 rounded-md p-3 hover:bg-muted/30 transition-colors cursor-pointer ${
                      selectedRoute === route.id ? 'border border-space-accent' : ''
                    }`}
                    onClick={() => setSelectedRoute(route.id)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium font-space">{route.name}</div>
                      <div className={`text-xs ${getStatusColor(route.status)}`}>
                        {route.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="text-muted-foreground mr-1">From:</span>
                        <span>{route.origin}</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <LocateFixed className="h-3 w-3 mr-1" />
                        <span className="text-muted-foreground mr-1">To:</span>
                        <span>{route.destination}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-2">
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Distance:</span>
                          <span>{route.distance}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Traffic:</span>
                          <span>{route.traffic}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center text-sm font-space">
                <Compass className="h-4 w-4 mr-2" />
                NAVIGATION DETAILS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRoute ? (
                <div>
                  <div className="text-lg font-medium font-space mb-3">
                    {routes.find(r => r.id === selectedRoute)?.name}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Route Statistics</div>
                      <div className="bg-muted/20 rounded-md p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Average Transit Time:</span>
                          <span>8.2 days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Vessels Currently:</span>
                          <span>47</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Weather Conditions:</span>
                          <span>{routes.find(r => r.id === selectedRoute)?.weather}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Optimal Departure Times</div>
                      <div className="bg-muted/20 rounded-md p-3 text-sm">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/30 p-2 rounded">
                            <div className="font-medium">May 5, 08:00 UTC</div>
                            <div className="text-space-success">Ideal Conditions</div>
                          </div>
                          <div className="bg-muted/30 p-2 rounded">
                            <div className="font-medium">May 7, 14:00 UTC</div>
                            <div className="text-space-success">Ideal Conditions</div>
                          </div>
                          <div className="bg-muted/30 p-2 rounded">
                            <div className="font-medium">May 9, 22:00 UTC</div>
                            <div className="text-space-warning">Moderate Weather</div>
                          </div>
                          <div className="bg-muted/30 p-2 rounded">
                            <div className="font-medium">May 12, 10:00 UTC</div>
                            <div className="text-space-success">Ideal Conditions</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <button className="w-full bg-space-bright-blue hover:bg-space-blue text-white py-1.5 px-4 rounded text-sm transition-colors font-space">
                        Get Detailed Navigation
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <p>Select a route to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center text-sm font-space">
                <MapPin className="h-4 w-4 mr-2" />
                POINTS OF INTEREST
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pointsOfInterest.map(poi => (
                  <div key={poi.id} className="bg-muted/20 rounded-md p-3">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{poi.name}</div>
                      <div className={`text-xs ${getImpactColor(poi.impact)}`}>
                        {poi.impact.toUpperCase()} IMPACT
                      </div>
                    </div>
                    <div className="text-xs mb-2">
                      <span className="bg-muted/30 px-2 py-0.5 rounded-full">{poi.type}</span>
                      <span className="text-muted-foreground ml-2">{poi.location}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{poi.description}</div>
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

export default NavigationView;
