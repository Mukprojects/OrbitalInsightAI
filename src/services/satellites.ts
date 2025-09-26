import { ApiService } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Satellite {
  id: string;
  noradId: number;
  name: string;
  commonName?: string;
  type: string;
  country?: string;
  owner?: string;
  launchDate?: string;
  decayDate?: string;
  period?: number;
  inclination?: number;
  apogee?: number;
  perigee?: number;
  rcs?: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isTracked?: boolean;
  currentPosition?: SatellitePosition;
  riskLevel?: string;
}

export interface SatellitePosition {
  id: string;
  satelliteId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: string;
}

export interface SatelliteDetails extends Satellite {
  tleData?: TLEData[];
  positions: SatellitePosition[];
  collisionRisks: CollisionRisk[];
  events: SatelliteEvent[];
  orbitPath: {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: string;
  }[];
}

export interface TLEData {
  id: string;
  satelliteId: string;
  line0: string;
  line1: string;
  line2: string;
  epoch: string;
  isLatest: boolean;
  createdAt: string;
}

export interface CollisionRisk {
  id: string;
  primarySatId: string;
  secondaryObjId?: string;
  secondaryObjName?: string;
  probability: number;
  timeOfClosest: string;
  missDistance: number;
  riskLevel: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SatelliteEvent {
  id: string;
  satelliteId: string;
  type: string;
  title: string;
  description?: string;
  severity: string;
  timestamp: string;
  metadata?: string;
  isResolved: boolean;
}

export interface SatelliteQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SatelliteListResponse {
  satellites: Satellite[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SatelliteStats {
  overview: {
    totalSatellites: number;
    activeSatellites: number;
    inactiveSatellites: number;
    recentLaunches: number;
    highRiskCollisions: number;
  };
  distribution: {
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

class SatelliteService extends ApiService {
  async getSatellites(query: SatelliteQuery = {}): Promise<SatelliteListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.SATELLITES.BASE}${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<SatelliteListResponse>(url);
  }

  async getSatellite(id: string): Promise<{ satellite: SatelliteDetails }> {
    return this.get<{ satellite: SatelliteDetails }>(`${API_ENDPOINTS.SATELLITES.BASE}/${id}`);
  }

  async getSatellitePositions(
    id: string,
    hours: number = 24
  ): Promise<{
    satellite: { id: string; name: string };
    positions: SatellitePosition[];
    timeRange: { hours: number; since: string; until: string };
  }> {
    return this.get<any>(`${API_ENDPOINTS.SATELLITES.POSITIONS(id)}?hours=${hours}`);
  }

  async trackSatellite(id: string): Promise<{
    message: string;
    isTracked: boolean;
    satellite: Pick<Satellite, 'id' | 'name' | 'type' | 'status'>;
  }> {
    return this.post<any>(API_ENDPOINTS.SATELLITES.TRACK(id));
  }

  async getTrackedSatellites(): Promise<{
    trackedSatellites: (Satellite & { trackedAt: string })[];
    count: number;
  }> {
    return this.get<any>(API_ENDPOINTS.SATELLITES.USER_TRACKED);
  }

  async getSatelliteStats(): Promise<SatelliteStats> {
    return this.get<SatelliteStats>(API_ENDPOINTS.SATELLITES.STATS);
  }

  async searchSatellites(query: string): Promise<{
    query: string;
    results: Pick<Satellite, 'id' | 'name' | 'commonName' | 'type' | 'status' | 'noradId' | 'owner' | 'launchDate'>[];
    count: number;
  }> {
    return this.get<any>(`${API_ENDPOINTS.SATELLITES.SEARCH}?q=${encodeURIComponent(query)}`);
  }

  // Real-time position calculation (client-side)
  calculateSatellitePosition(satellite: Satellite, time?: Date): SatellitePosition | null {
    // This would require satellite.js library for TLE propagation
    // For now, return null - the server will handle real calculations
    return null;
  }

  // Utility methods
  getSatelliteTypeColor(type: string): string {
    const colors: Record<string, string> = {
      EARTH_OBSERVATION: '#10b981',
      COMMUNICATION: '#3b82f6',
      NAVIGATION: '#8b5cf6',
      WEATHER: '#f59e0b',
      SCIENTIFIC: '#ef4444',
      MILITARY: '#6b7280',
      COMMERCIAL: '#06b6d4',
      AMATEUR: '#84cc16',
      DEBRIS: '#f97316',
      UNKNOWN: '#9ca3af',
    };
    return colors[type] || colors.UNKNOWN;
  }

  getSatelliteStatusColor(status: string): string {
    const colors: Record<string, string> = {
      ACTIVE: '#10b981',
      INACTIVE: '#6b7280',
      DECAYED: '#ef4444',
      MANEUVERING: '#f59e0b',
      TUMBLING: '#f97316',
      UNKNOWN: '#9ca3af',
    };
    return colors[status] || colors.UNKNOWN;
  }

  getRiskLevelColor(riskLevel: string): string {
    const colors: Record<string, string> = {
      LOW: '#10b981',
      MEDIUM: '#f59e0b',
      HIGH: '#f97316',
      CRITICAL: '#ef4444',
    };
    return colors[riskLevel] || colors.LOW;
  }

  formatOrbitPeriod(period?: number): string {
    if (!period) return 'Unknown';
    
    const hours = Math.floor(period / 60);
    const minutes = Math.round(period % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatAltitude(altitude?: number): string {
    if (!altitude) return 'Unknown';
    
    if (altitude > 1000) {
      return `${(altitude / 1000).toFixed(1)}k km`;
    }
    return `${altitude.toFixed(0)} km`;
  }

  getOrbitType(apogee?: number, perigee?: number): string {
    if (!apogee || !perigee) return 'Unknown';
    
    const avgAltitude = (apogee + perigee) / 2;
    
    if (avgAltitude < 2000) return 'LEO';
    if (avgAltitude < 35786) return 'MEO';
    if (Math.abs(avgAltitude - 35786) < 100) return 'GEO';
    return 'HEO';
  }
}

export const satelliteService = new SatelliteService();
export default satelliteService;