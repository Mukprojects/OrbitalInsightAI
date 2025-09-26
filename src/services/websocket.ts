import { API_CONFIG } from '../config/api';
import { authService } from './auth';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface SatelliteUpdate {
  satelliteId: string;
  data: {
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    timestamp: string;
  };
}

export interface SpaceWeatherUpdate {
  data: {
    timestamp: string;
    solarFluxIndex?: number;
    geomagneticIndex?: number;
    solarWindSpeed?: number;
    alertLevel: string;
    description?: string;
  };
}

export interface AlertNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  timestamp: string;
}

export type WebSocketEventHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private isConnecting = false;
  private shouldReconnect = true;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = () => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            resolve();
          } else if (this.ws?.readyState === WebSocket.CLOSED) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;
      const token = authService.getStoredToken();
      
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      try {
        this.ws = new WebSocket(API_CONFIG.WS_URL);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Authenticate with the server
          this.send('authenticate', { token });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.ws = null;

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(console.error);
      }
    }, delay);
  }

  private send(type: string, data?: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket not connected, cannot send message:', type);
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }
  }

  // Event subscription methods
  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  // Satellite tracking
  subscribeSatellite(satelliteId: string): void {
    this.send('subscribe:satellite', satelliteId);
  }

  unsubscribeSatellite(satelliteId: string): void {
    this.send('unsubscribe:satellite', satelliteId);
  }

  // Global updates
  subscribeGlobal(): void {
    this.send('subscribe:global');
  }

  unsubscribeGlobal(): void {
    this.send('unsubscribe:global');
  }

  // Alerts
  subscribeAlerts(): void {
    this.send('subscribe:alerts');
  }

  // Space weather
  subscribeWeather(): void {
    this.send('subscribe:weather');
  }

  unsubscribeWeather(): void {
    this.send('unsubscribe:weather');
  }

  // Convenience methods for common event types
  onSatelliteUpdate(handler: (update: SatelliteUpdate) => void): void {
    this.on('satellite:update', handler);
  }

  onSpaceWeatherUpdate(handler: (update: SpaceWeatherUpdate) => void): void {
    this.on('weather:update', handler);
  }

  onAlert(handler: (alert: AlertNotification) => void): void {
    this.on('alert', handler);
  }

  onGlobalUpdate(handler: (update: any) => void): void {
    this.on('global:update', handler);
  }

  onHeartbeat(handler: (data: any) => void): void {
    this.on('heartbeat', handler);
  }

  // Connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;