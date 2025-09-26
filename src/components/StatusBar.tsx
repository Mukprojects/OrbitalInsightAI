
import { Clock, Wifi, WifiOff, Users, Satellite, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";

interface StatusBarProps {
  connectionState?: string;
  heartbeat?: any;
}

const StatusBar = ({ connectionState = 'disconnected', heartbeat }: StatusBarProps) => {
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

  const getConnectionStatus = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3 mr-1 text-green-400" />,
          text: 'Real-time Connected',
          color: 'bg-green-500',
          animate: 'animate-pulse'
        };
      case 'connecting':
        return {
          icon: <Wifi className="h-3 w-3 mr-1 text-yellow-400" />,
          text: 'Connecting...',
          color: 'bg-yellow-500',
          animate: 'animate-pulse'
        };
      case 'disconnected':
      case 'closed':
        return {
          icon: <WifiOff className="h-3 w-3 mr-1 text-red-400" />,
          text: 'Offline Mode',
          color: 'bg-red-500',
          animate: ''
        };
      default:
        return {
          icon: <WifiOff className="h-3 w-3 mr-1 text-gray-400" />,
          text: 'Unknown',
          color: 'bg-gray-500',
          animate: ''
        };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="h-8 flex items-center justify-between border-t border-border/50 px-4 py-1 text-xs bg-space-dark-blue text-muted-foreground">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className={`h-2 w-2 rounded-full ${connectionStatus.color} mr-1.5 ${connectionStatus.animate}`}></div>
          <span>API Systems Operational</span>
        </div>
        <div className="flex items-center">
          {connectionStatus.icon}
          <span>{connectionStatus.text}</span>
        </div>
        {heartbeat && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              <span>{heartbeat.connectedUsers || 0} users</span>
            </div>
            <div className="flex items-center">
              <Satellite className="h-3 w-3 mr-1" />
              <span>{heartbeat.activeSubscriptions || 0} tracking</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Badge variant="outline" className="text-xs border-green-500/20 text-green-400">
            <Satellite className="h-3 w-3 mr-1" />
            Live Data Feed
          </Badge>
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{formattedTime} UTC</span>
        </div>
        <div>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
