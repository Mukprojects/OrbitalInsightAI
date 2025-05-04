
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Bell, Calendar, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const EventsList = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      type: "Satellite Launch",
      time: "2024-05-05T14:30:00Z",
      location: "Kennedy Space Center, FL",
      priority: "high",
      tracked: false
    },
    {
      id: 2,
      type: "Solar Flare Warning",
      time: "2024-05-06T09:15:00Z",
      location: "Global",
      priority: "medium",
      tracked: false
    },
    {
      id: 3,
      type: "Debris Near Miss",
      time: "2024-05-05T20:45:00Z",
      location: "LEO Orbit, 570km",
      priority: "high",
      tracked: true
    },
    {
      id: 4,
      type: "Wildfire Detection",
      time: "2024-05-05T12:10:00Z",
      location: "Northern California",
      priority: "medium",
      tracked: false
    },
    {
      id: 5,
      type: "Satellite Maintenance",
      time: "2024-05-07T08:00:00Z",
      location: "GlobalSat-1",
      priority: "low",
      tracked: false
    }
  ]);

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

  const handleTrack = (id: number) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === id ? { ...event, tracked: !event.tracked } : event
      )
    );
    const event = events.find(e => e.id === id);
    if (event) {
      if (!event.tracked) {
        toast.success(`Now tracking: ${event.type}`);
      } else {
        toast.info(`Stopped tracking: ${event.type}`);
      }
    }
  };

  const handleViewDetails = (event: any) => {
    toast.info(`Viewing details for: ${event.type}`, {
      description: `Location: ${event.location}, Time: ${formatTime(event.time)}`
    });
  };

  return (
    <Card className="card-gradient h-full">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-space-accent flex items-center text-sm">
          <Bell className="h-4 w-4 mr-2" />
          Recent Events & Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-40px)] overflow-hidden">
        <div className="flex overflow-x-auto space-x-2 p-4 h-full">
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex-shrink-0 w-64 rounded border ${getPriorityClass(event.priority)} p-3`}
            >
              <h4 className="font-medium text-sm">{event.type}</h4>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatTime(event.time)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {event.location}
              </div>
              <div className="mt-2 text-xs">
                <button 
                  onClick={() => handleViewDetails(event)}
                  className="bg-muted/30 hover:bg-muted/40 px-2 py-1 rounded transition-colors mr-1">
                  Details
                </button>
                <button 
                  onClick={() => handleTrack(event.id)}
                  className={`${event.tracked ? 'bg-space-accent text-space-dark-blue' : 'bg-muted/30 hover:bg-muted/40'} px-2 py-1 rounded transition-colors`}>
                  {event.tracked ? 'Tracking' : 'Track'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsList;
