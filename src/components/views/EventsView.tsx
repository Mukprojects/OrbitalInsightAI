
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Calendar, Clock, AlertTriangle, MapPin, Users, Filter, Search, Plus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const EventsView = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const events = [
    {
      id: "evt-001",
      type: "Satellite Launch",
      time: "2024-05-05T14:30:00Z",
      location: "Kennedy Space Center, FL",
      priority: "high",
      category: "launch",
      details: "SpaceX Falcon 9 launch of communication satellites",
      organization: "SpaceX",
      impact: "Network expansion",
      status: "scheduled",
      tracked: false
    },
    {
      id: "evt-002",
      type: "Solar Flare Warning",
      time: "2024-05-06T09:15:00Z",
      location: "Global",
      priority: "medium",
      category: "space-weather",
      details: "Class M2 solar flare detected, potential communications disruption",
      organization: "NOAA Space Weather",
      impact: "Possible radio blackouts",
      status: "monitoring",
      tracked: false
    },
    {
      id: "evt-003",
      type: "Debris Near Miss",
      time: "2024-05-05T20:45:00Z",
      location: "LEO Orbit, 570km",
      priority: "high",
      category: "debris",
      details: "Close approach between defunct satellite and debris cluster",
      organization: "Space Debris Monitor",
      impact: "Collision risk assessment",
      status: "active",
      tracked: true
    },
    {
      id: "evt-004",
      type: "Wildfire Detection",
      time: "2024-05-05T12:10:00Z",
      location: "Northern California",
      priority: "medium",
      category: "disaster",
      details: "Thermal anomaly detected in remote forested area",
      organization: "Forest Service",
      impact: "Early warning system triggered",
      status: "active",
      tracked: false
    },
    {
      id: "evt-005",
      type: "Satellite Maintenance",
      time: "2024-05-07T08:00:00Z",
      location: "GlobalSat-1",
      priority: "low",
      category: "maintenance",
      details: "Scheduled software update and orbital adjustments",
      organization: "Global Space Agency",
      impact: "Brief service interruption",
      status: "scheduled",
      tracked: false
    },
    {
      id: "evt-006",
      type: "Humanitarian Response",
      time: "2024-05-04T15:20:00Z",
      location: "Coastal Bangladesh",
      priority: "high",
      category: "humanitarian",
      details: "Flood monitoring and relief coordination",
      organization: "UN OCHA",
      impact: "Aid distribution planning",
      status: "active",
      tracked: false
    },
    {
      id: "evt-007",
      type: "Sea Ice Monitoring",
      time: "2024-05-06T11:30:00Z",
      location: "Arctic Circle",
      priority: "medium",
      category: "climate",
      details: "Seasonal melt pattern analysis",
      organization: "Climate Research Institute",
      impact: "Climate model input",
      status: "scheduled",
      tracked: false
    },
    {
      id: "evt-008",
      type: "Maritime Security Alert",
      time: "2024-05-05T07:45:00Z",
      location: "Gulf of Aden",
      priority: "high",
      category: "security",
      details: "Unusual vessel movement patterns detected",
      organization: "Maritime Security Agency",
      impact: "Commercial shipping advisory",
      status: "active",
      tracked: false
    }
  ];
  
  const categories = [
    { id: "launch", name: "Launches", count: 1 },
    { id: "space-weather", name: "Space Weather", count: 1 },
    { id: "debris", name: "Debris Events", count: 1 },
    { id: "maintenance", name: "Maintenance", count: 1 },
    { id: "disaster", name: "Disasters", count: 1 },
    { id: "humanitarian", name: "Humanitarian", count: 1 },
    { id: "climate", name: "Climate", count: 1 },
    { id: "security", name: "Security", count: 1 }
  ];
  
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-space-alert/20 text-space-alert border-space-alert/50";
      case "medium":
        return "bg-space-warning/20 text-space-warning border-space-warning/50";
      case "low":
        return "bg-space-accent/20 text-space-accent border-space-accent/50";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/50";
    }
  };
  
  const getStatusDot = (status: string) => {
    switch (status) {
      case "active":
        return "bg-space-success";
      case "scheduled":
        return "bg-space-accent";
      case "monitoring":
        return "bg-space-warning";
      default:
        return "bg-muted";
    }
  };
  
  const filteredEvents = selectedCategory 
    ? events.filter(event => event.category === selectedCategory)
    : events;

  const handleTrackEvent = (id: string) => {
    const event = events.find(e => e.id === id);
    if (event) {
      event.tracked = !event.tracked;
      if (event.tracked) {
        toast.success(`Now tracking: ${event.type}`, {
          description: `Priority: ${event.priority.toUpperCase()}, Status: ${event.status}`,
        });
      } else {
        toast.info(`Stopped tracking: ${event.type}`);
      }
    }
  };

  const handleViewDetails = (event: any) => {
    toast.info(`Viewing details for: ${event.type}`, {
      description: `${event.details}`,
      duration: 5000,
    });
  };

  const handleRespond = (event: any) => {
    toast.success(`Response initiated for: ${event.type}`, {
      description: `Contacting: ${event.organization}`,
      duration: 5000,
    });
  };

  const handleCreateNewEvent = () => {
    toast.info("Opening event creation form", {
      description: "Please fill in all required fields to create a new event",
    });
  };

  return (
    <div className="grid-pattern h-full flex flex-col">
      <div className="p-4 mb-2">
        <h2 className="text-2xl font-bold font-space text-space-accent">Events & Alerts</h2>
        <p className="text-muted-foreground">Mission critical events and global alert monitoring</p>
      </div>
      
      <div className="flex-1 px-4 pb-4 grid grid-cols-12 gap-4">
        {/* Filter sidebar */}
        <div className="col-span-12 md:col-span-3 space-y-4">
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center justify-between text-sm font-space">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  FILTERS
                </div>
                <div className="p-1 hover:bg-muted/20 rounded cursor-pointer">
                  <Search className="h-4 w-4" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={`flex justify-between items-center w-full p-2 rounded text-sm ${selectedCategory === null ? 'bg-space-accent text-space-dark-blue' : 'hover:bg-muted/20'}`}
                >
                  <span>All Events</span>
                  <span className="bg-muted/20 px-2 py-0.5 rounded-full text-xs">{events.length}</span>
                </button>
                
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex justify-between items-center w-full p-2 rounded text-sm ${selectedCategory === category.id ? 'bg-space-accent text-space-dark-blue' : 'hover:bg-muted/20'}`}
                  >
                    <span>{category.name}</span>
                    <span className="bg-muted/20 px-2 py-0.5 rounded-full text-xs">{category.count}</span>
                  </button>
                ))}
              </div>
              
              <div className="pt-4 mt-4 border-t border-muted/20">
                <div className="text-xs text-muted-foreground mb-2">Priority Level</div>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <input id="priority-high" type="checkbox" className="h-4 w-4 accent-space-accent" defaultChecked />
                    <label htmlFor="priority-high" className="ml-2 text-sm flex items-center">
                      <span className="h-2 w-2 rounded-full bg-space-alert mr-1.5"></span>
                      High
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input id="priority-medium" type="checkbox" className="h-4 w-4 accent-space-accent" defaultChecked />
                    <label htmlFor="priority-medium" className="ml-2 text-sm flex items-center">
                      <span className="h-2 w-2 rounded-full bg-space-warning mr-1.5"></span>
                      Medium
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input id="priority-low" type="checkbox" className="h-4 w-4 accent-space-accent" defaultChecked />
                    <label htmlFor="priority-low" className="ml-2 text-sm flex items-center">
                      <span className="h-2 w-2 rounded-full bg-space-accent mr-1.5"></span>
                      Low
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-4">
                <button 
                  onClick={handleCreateNewEvent}
                  className="flex items-center justify-center w-full bg-space-bright-blue hover:bg-space-blue text-white py-2 rounded text-sm transition-colors">
                  <Plus className="h-4 w-4 mr-1" />
                  Create New Event
                </button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center text-sm font-space">
                <AlertTriangle className="h-4 w-4 mr-2" />
                PRIORITY ALERTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events.filter(e => e.priority === "high").slice(0, 3).map(event => (
                  <div key={event.id} className="bg-muted/20 p-2 rounded text-xs">
                    <div className="font-medium">{event.type}</div>
                    <div className="text-muted-foreground">{event.location}</div>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span>{formatTime(event.time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Events list */}
        <div className="col-span-12 md:col-span-9">
          <Card className="card-gradient h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center justify-between text-sm font-space">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  EVENTS & ALERTS
                </div>
                <div className="flex items-center space-x-1">
                  <button className="bg-muted/20 px-3 py-1 rounded text-xs hover:bg-muted/30">Today</button>
                  <button className="bg-muted/20 px-3 py-1 rounded text-xs hover:bg-muted/30">This Week</button>
                  <button className="bg-space-accent text-space-dark-blue px-3 py-1 rounded text-xs">All</button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {filteredEvents.map(event => (
                  <div 
                    key={event.id} 
                    className={`rounded border ${getPriorityClass(event.priority)} p-4 hover:bg-muted/10 transition-colors`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full ${getStatusDot(event.status)} mr-2`}></div>
                        <h3 className="font-medium font-space">{event.type}</h3>
                      </div>
                      <div className="bg-muted/20 px-2 py-0.5 rounded-full text-xs capitalize">
                        {event.status}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{event.details}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{formatTime(event.time)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{event.organization}</span>
                      </div>
                      <div className="flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{event.impact}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <button 
                        onClick={() => handleViewDetails(event)}
                        className="bg-muted/30 hover:bg-muted/40 px-2 py-1 rounded text-xs flex items-center">
                        <span>Details</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </button>
                      
                      <div className="space-x-1">
                        <button 
                          onClick={() => handleTrackEvent(event.id)}
                          className={`${event.tracked ? 'bg-space-accent text-space-dark-blue' : 'bg-muted/30 hover:bg-muted/40'} px-2 py-1 rounded text-xs`}>
                          {event.tracked ? 'Tracking' : 'Track'}
                        </button>
                        <button 
                          onClick={() => handleRespond(event)}
                          className="bg-space-bright-blue hover:bg-space-blue text-white px-2 py-1 rounded text-xs">
                          Respond
                        </button>
                      </div>
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

export default EventsView;
