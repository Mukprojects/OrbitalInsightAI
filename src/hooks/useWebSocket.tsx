import { useEffect, useState, useCallback } from 'react';
import { webSocketService, WebSocketEventHandler, SatelliteUpdate, SpaceWeatherUpdate, AlertNotification } from '../services/websocket';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeSatellite: (satelliteId: string) => void;
  unsubscribeSatellite: (satelliteId: string) => void;
  subscribeGlobal: () => void;
  unsubscribeGlobal: () => void;
  subscribeAlerts: () => void;
  subscribeWeather: () => void;
  unsubscribeWeather: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');

  const updateConnectionState = useCallback(() => {
    const state = webSocketService.getConnectionState();
    const connected = webSocketService.isConnected();
    
    setConnectionState(state);
    setIsConnected(connected);
  }, []);

  const connect = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn('Cannot connect WebSocket: user not authenticated');
      return;
    }

    try {
      await webSocketService.connect();
      updateConnectionState();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      updateConnectionState();
    }
  }, [isAuthenticated, updateConnectionState]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    updateConnectionState();
  }, [updateConnectionState]);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && !isConnected) {
      connect();
    } else if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, isConnected, connect, disconnect]);

  // Set up connection state monitoring
  useEffect(() => {
    const interval = setInterval(updateConnectionState, 1000);
    return () => clearInterval(interval);
  }, [updateConnectionState]);

  // WebSocket event handlers
  const subscribeSatellite = useCallback((satelliteId: string) => {
    webSocketService.subscribeSatellite(satelliteId);
  }, []);

  const unsubscribeSatellite = useCallback((satelliteId: string) => {
    webSocketService.unsubscribeSatellite(satelliteId);
  }, []);

  const subscribeGlobal = useCallback(() => {
    webSocketService.subscribeGlobal();
  }, []);

  const unsubscribeGlobal = useCallback(() => {
    webSocketService.unsubscribeGlobal();
  }, []);

  const subscribeAlerts = useCallback(() => {
    webSocketService.subscribeAlerts();
  }, []);

  const subscribeWeather = useCallback(() => {
    webSocketService.subscribeWeather();
  }, []);

  const unsubscribeWeather = useCallback(() => {
    webSocketService.unsubscribeWeather();
  }, []);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    subscribeSatellite,
    unsubscribeSatellite,
    subscribeGlobal,
    unsubscribeGlobal,
    subscribeAlerts,
    subscribeWeather,
    unsubscribeWeather,
  };
}

// Hook for satellite updates
export function useSatelliteUpdates(satelliteId?: string) {
  const [updates, setUpdates] = useState<SatelliteUpdate[]>([]);
  const { subscribeSatellite, unsubscribeSatellite } = useWebSocket();

  useEffect(() => {
    if (!satelliteId) return;

    const handleUpdate = (update: SatelliteUpdate) => {
      if (update.satelliteId === satelliteId) {
        setUpdates(prev => [update, ...prev.slice(0, 99)]); // Keep last 100 updates
      }
    };

    webSocketService.onSatelliteUpdate(handleUpdate);
    subscribeSatellite(satelliteId);

    return () => {
      webSocketService.off('satellite:update', handleUpdate);
      unsubscribeSatellite(satelliteId);
    };
  }, [satelliteId, subscribeSatellite, unsubscribeSatellite]);

  return updates;
}

// Hook for space weather updates
export function useSpaceWeatherUpdates() {
  const [currentWeather, setCurrentWeather] = useState<SpaceWeatherUpdate | null>(null);
  const [weatherHistory, setWeatherHistory] = useState<SpaceWeatherUpdate[]>([]);
  const { subscribeWeather } = useWebSocket();

  useEffect(() => {
    const handleUpdate = (update: SpaceWeatherUpdate) => {
      setCurrentWeather(update);
      setWeatherHistory(prev => [update, ...prev.slice(0, 99)]); // Keep last 100 updates
      
      // Show toast for significant weather events
      if (update.data.alertLevel !== 'GREEN') {
        toast.warning(`Space Weather Alert: ${update.data.alertLevel}`, {
          description: update.data.description,
          duration: 5000,
        });
      }
    };

    webSocketService.onSpaceWeatherUpdate(handleUpdate);
    subscribeWeather();

    return () => {
      webSocketService.off('weather:update', handleUpdate);
    };
  }, [subscribeWeather]);

  return { currentWeather, weatherHistory };
}

// Hook for alert notifications
export function useAlertNotifications() {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const { subscribeAlerts } = useWebSocket();

  useEffect(() => {
    const handleAlert = (alert: AlertNotification) => {
      setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
      
      // Show toast notification
      const toastOptions = {
        duration: alert.severity === 'CRITICAL' ? 10000 : 5000,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to alerts page
            window.location.hash = '#/alerts';
          },
        },
      };

      switch (alert.severity) {
        case 'CRITICAL':
          toast.error(alert.title, { description: alert.message, ...toastOptions });
          break;
        case 'HIGH':
          toast.warning(alert.title, { description: alert.message, ...toastOptions });
          break;
        case 'MEDIUM':
          toast.info(alert.title, { description: alert.message, ...toastOptions });
          break;
        default:
          toast(alert.title, { description: alert.message, ...toastOptions });
      }
    };

    webSocketService.onAlert(handleAlert);
    subscribeAlerts();

    return () => {
      webSocketService.off('alert', handleAlert);
    };
  }, [subscribeAlerts]);

  return alerts;
}

// Hook for global updates
export function useGlobalUpdates() {
  const [updates, setUpdates] = useState<any[]>([]);
  const { subscribeGlobal } = useWebSocket();

  useEffect(() => {
    const handleUpdate = (update: any) => {
      setUpdates(prev => [update, ...prev.slice(0, 99)]); // Keep last 100 updates
    };

    webSocketService.onGlobalUpdate(handleUpdate);
    subscribeGlobal();

    return () => {
      webSocketService.off('global:update', handleUpdate);
    };
  }, [subscribeGlobal]);

  return updates;
}

// Hook for connection heartbeat
export function useHeartbeat() {
  const [heartbeat, setHeartbeat] = useState<any>(null);

  useEffect(() => {
    const handleHeartbeat = (data: any) => {
      setHeartbeat(data);
    };

    webSocketService.onHeartbeat(handleHeartbeat);

    return () => {
      webSocketService.off('heartbeat', handleHeartbeat);
    };
  }, []);

  return heartbeat;
}

export default useWebSocket;