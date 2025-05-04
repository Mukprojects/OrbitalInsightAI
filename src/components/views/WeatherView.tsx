
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Cloud, CloudRain, CloudSun, Thermometer, Wind, Droplets, CloudFog, AlertTriangle, ArrowRight } from "lucide-react";
import Globe from "../Globe";

const WeatherView = () => {
  const [selectedRegion, setSelectedRegion] = useState("global");
  
  const weatherAlerts = [
    {
      id: "alert-1",
      type: "Hurricane",
      location: "Atlantic Ocean",
      severity: "high",
      description: "Tropical storm forming with sustained winds of 75mph",
      time: "3 hours ago"
    },
    {
      id: "alert-2",
      type: "Flooding",
      location: "Southeast Asia",
      severity: "high",
      description: "Heavy rainfall causing flash floods in coastal regions",
      time: "5 hours ago"
    },
    {
      id: "alert-3",
      type: "Drought",
      location: "Central Africa",
      severity: "medium",
      description: "Extended dry period affecting agricultural production",
      time: "1 day ago"
    },
    {
      id: "alert-4",
      type: "Wildfire Risk",
      location: "Western United States",
      severity: "medium",
      description: "Dry conditions creating elevated fire risk",
      time: "12 hours ago"
    }
  ];
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-space-alert";
      case "medium": return "text-space-warning";
      case "low": return "text-space-success";
      default: return "text-muted-foreground";
    }
  };
  
  const getWeatherIcon = (type: string) => {
    switch (type) {
      case "Hurricane": return <CloudRain className="h-5 w-5" />;
      case "Flooding": return <Droplets className="h-5 w-5" />;
      case "Drought": return <Thermometer className="h-5 w-5" />;
      case "Wildfire Risk": return <CloudSun className="h-5 w-5" />;
      default: return <Cloud className="h-5 w-5" />;
    }
  };

  return (
    <div className="grid-pattern h-full flex flex-col">
      <div className="p-4 mb-2">
        <h2 className="text-2xl font-bold font-space text-space-accent">Global Weather Systems</h2>
        <p className="text-muted-foreground">Real-time satellite weather monitoring and predictions</p>
      </div>
      
      <div className="flex-1 px-4 pb-4 grid grid-cols-12 gap-4">
        {/* Weather stats */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="card-gradient">
            <CardContent className="p-3 flex items-center">
              <div className="p-2 rounded-full bg-space-accent/10 mr-3">
                <CloudSun className="h-6 w-6 text-space-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Global Temp</div>
                <div className="text-lg font-bold font-space">+0.8°C</div>
                <div className="text-xs text-space-warning">Above Average</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-3 flex items-center">
              <div className="p-2 rounded-full bg-space-accent/10 mr-3">
                <CloudRain className="h-6 w-6 text-space-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Storm Systems</div>
                <div className="text-lg font-bold font-space">7</div>
                <div className="text-xs text-space-alert">2 Severe</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-3 flex items-center">
              <div className="p-2 rounded-full bg-space-accent/10 mr-3">
                <Wind className="h-6 w-6 text-space-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Jet Stream</div>
                <div className="text-lg font-bold font-space">Normal</div>
                <div className="text-xs text-space-success">Stable</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-3 flex items-center">
              <div className="p-2 rounded-full bg-space-accent/10 mr-3">
                <Droplets className="h-6 w-6 text-space-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Humidity</div>
                <div className="text-lg font-bold font-space">61%</div>
                <div className="text-xs text-muted-foreground">Global Avg</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-3 flex items-center">
              <div className="p-2 rounded-full bg-space-accent/10 mr-3">
                <CloudFog className="h-6 w-6 text-space-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Cloud Cover</div>
                <div className="text-lg font-bold font-space">42%</div>
                <div className="text-xs text-muted-foreground">Global Avg</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main view */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-4">
          <div className="card-gradient rounded-lg p-1 h-[450px] relative">
            <Globe onSatelliteSelect={() => {}} />
            <div className="absolute top-2 right-2 bg-space-dark-blue/80 rounded px-3 py-1 text-xs">
              <div className="text-space-accent font-space">WEATHER VIEW ACTIVE</div>
            </div>
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <button className={`px-3 py-1 rounded text-xs ${selectedRegion === 'global' ? 'bg-space-accent text-space-dark-blue' : 'bg-space-dark-blue/80'}`}>
                Global
              </button>
              <button className={`px-3 py-1 rounded text-xs ${selectedRegion === 'na' ? 'bg-space-accent text-space-dark-blue' : 'bg-space-dark-blue/80'}`}>
                N. America
              </button>
              <button className={`px-3 py-1 rounded text-xs ${selectedRegion === 'eu' ? 'bg-space-accent text-space-dark-blue' : 'bg-space-dark-blue/80'}`}>
                Europe
              </button>
              <button className={`px-3 py-1 rounded text-xs ${selectedRegion === 'asia' ? 'bg-space-accent text-space-dark-blue' : 'bg-space-dark-blue/80'}`}>
                Asia
              </button>
            </div>
          </div>
          
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center text-sm font-space">
                <AlertTriangle className="h-4 w-4 mr-2 text-space-warning" />
                ACTIVE WEATHER ALERTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weatherAlerts.map(alert => (
                  <div key={alert.id} className="bg-muted/20 rounded-md p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        {getWeatherIcon(alert.type)}
                        <span className="ml-2 font-medium font-space">{alert.type}</span>
                      </div>
                      <div className={`text-xs ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()} SEVERITY
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="text-muted-foreground">{alert.description}</div>
                      <div className="flex justify-between text-xs mt-2">
                        <span className="font-medium">{alert.location}</span>
                        <span className="text-muted-foreground">{alert.time}</span>
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
              <CardTitle className="text-space-accent flex items-center justify-between text-sm font-space">
                <div className="flex items-center">
                  <CloudRain className="h-4 w-4 mr-2" />
                  HURRICANE TRACKER
                </div>
                <button className="text-xs bg-muted/20 px-2 py-1 rounded hover:bg-muted/30 transition-colors flex items-center">
                  <span>View</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-3 border-b border-muted/20">
                <div className="text-sm font-medium mb-1">Tropical Storm Elena</div>
                <div className="text-xs text-muted-foreground">Category 2 - Atlantic Ocean</div>
                <div className="flex items-center mt-1">
                  <div className="w-full bg-muted/20 h-1 rounded-full overflow-hidden">
                    <div className="bg-space-warning h-1" style={{width: '40%'}}></div>
                  </div>
                  <span className="text-xs ml-2">40%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Path prediction confidence</div>
              </div>
              
              <div className="p-3 border-b border-muted/20">
                <div className="text-sm font-medium mb-1">Hurricane Marcus</div>
                <div className="text-xs text-muted-foreground">Category 3 - Gulf of Mexico</div>
                <div className="flex items-center mt-1">
                  <div className="w-full bg-muted/20 h-1 rounded-full overflow-hidden">
                    <div className="bg-space-warning h-1" style={{width: '75%'}}></div>
                  </div>
                  <span className="text-xs ml-2">75%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Path prediction confidence</div>
              </div>
              
              <div className="p-3">
                <div className="text-sm font-medium mb-1">Cyclone Nisha</div>
                <div className="text-xs text-muted-foreground">Category 4 - Indian Ocean</div>
                <div className="flex items-center mt-1">
                  <div className="w-full bg-muted/20 h-1 rounded-full overflow-hidden">
                    <div className="bg-space-alert h-1" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-xs ml-2">85%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Path prediction confidence</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center text-sm font-space">
                <Thermometer className="h-4 w-4 mr-2" />
                GLOBAL TEMPERATURE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>North America</span>
                    <span className="text-space-warning">+1.2°C</span>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-space-success via-space-warning to-space-alert h-full" style={{width: '65%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Europe</span>
                    <span className="text-space-warning">+1.5°C</span>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-space-success via-space-warning to-space-alert h-full" style={{width: '70%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Asia</span>
                    <span className="text-space-warning">+0.9°C</span>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-space-success via-space-warning to-space-alert h-full" style={{width: '55%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Africa</span>
                    <span className="text-space-alert">+1.8°C</span>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-space-success via-space-warning to-space-alert h-full" style={{width: '80%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Oceania</span>
                    <span className="text-space-warning">+1.1°C</span>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-space-success via-space-warning to-space-alert h-full" style={{width: '60%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>South America</span>
                    <span className="text-space-success">+0.7°C</span>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-space-success via-space-warning to-space-alert h-full" style={{width: '45%'}}></div>
                  </div>
                </div>
                
                <div className="pt-2 text-xs text-center text-muted-foreground">
                  Temperature deviation from pre-industrial average
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WeatherView;
