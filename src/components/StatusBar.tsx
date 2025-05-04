
import { Clock, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

const StatusBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true
  }).format(currentTime);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(currentTime);

  return (
    <div className="h-8 flex items-center justify-between border-t border-border/50 px-4 py-1 text-xs bg-space-dark-blue text-muted-foreground">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-space-success mr-1.5 animate-pulse"></div>
          <span>Systems Operational</span>
        </div>
        <div className="flex items-center">
          <Wifi className="h-3 w-3 mr-1" />
          <span>Connected</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span>Satellites: 24 Active</span>
        </div>
        <div className="flex items-center">
          <span>Debris Objects: 157 Tracking</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{formattedTime}</span>
        </div>
        <div>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
