# 📡 Orbital Insight AI - API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this standard format:
```json
{
  "data": {}, // Response data
  "message": "Success message", // Optional
  "timestamp": "2024-01-01T00:00:00.000Z",
  "pagination": {} // For paginated responses
}
```

## Error Format
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "method": "GET"
}
```

---

## 🔐 Authentication Endpoints

### POST /auth/login
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "John", // Optional
  "lastName": "Doe"    // Optional
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "role": "USER"
  }
}
```

### GET /auth/me
Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "trackingRadius": 1000.0
    },
    "trackedSatellites": [...],
    "unreadAlerts": 5
  }
}
```

### POST /auth/logout
Logout and invalidate the current session.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

## 🛰️ Satellite Endpoints

### GET /satellites
Get a list of satellites with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `type` (string): Filter by satellite type
- `status` (string): Filter by satellite status
- `search` (string): Search by name or owner
- `sortBy` (string): Sort field (name, altitude, inclination, launchDate)
- `sortOrder` (string): Sort direction (asc, desc)

**Example:**
```
GET /satellites?page=1&limit=10&type=COMMUNICATION&status=ACTIVE
```

**Response:**
```json
{
  "satellites": [
    {
      "id": "sat_id",
      "noradId": 25544,
      "name": "ISS (ZARYA)",
      "commonName": "International Space Station",
      "type": "SCIENTIFIC",
      "status": "ACTIVE",
      "altitude": 408,
      "inclination": 51.64,
      "isTracked": true,
      "currentPosition": {
        "latitude": 45.123,
        "longitude": -123.456,
        "altitude": 408.5,
        "velocity": 7.66,
        "timestamp": "2024-01-01T12:00:00.000Z"
      },
      "riskLevel": "LOW"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /satellites/:id
Get detailed information about a specific satellite.

**Response:**
```json
{
  "satellite": {
    "id": "sat_id",
    "noradId": 25544,
    "name": "ISS (ZARYA)",
    "commonName": "International Space Station",
    "type": "SCIENTIFIC",
    "country": "MULTINATIONAL",
    "owner": "International",
    "launchDate": "1998-11-20T00:00:00.000Z",
    "period": 92.68,
    "inclination": 51.64,
    "apogee": 408,
    "perigee": 398,
    "status": "ACTIVE",
    "isTracked": true,
    "currentPosition": {...},
    "orbitPath": [
      {
        "latitude": 45.123,
        "longitude": -123.456,
        "altitude": 408.5,
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ],
    "collisionRisks": [...],
    "events": [...]
  }
}
```

### POST /satellites/:id/track
Track or untrack a satellite for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Satellite tracked successfully",
  "isTracked": true,
  "satellite": {
    "id": "sat_id",
    "name": "ISS (ZARYA)",
    "type": "SCIENTIFIC",
    "status": "ACTIVE"
  }
}
```

### GET /satellites/user/tracked
Get all satellites tracked by the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "trackedSatellites": [
    {
      "id": "sat_id",
      "name": "ISS (ZARYA)",
      "type": "SCIENTIFIC",
      "status": "ACTIVE",
      "trackedAt": "2024-01-01T10:00:00.000Z",
      "currentPosition": {...},
      "riskLevel": "LOW"
    }
  ],
  "count": 5
}
```

### GET /satellites/stats/overview
Get satellite statistics and overview.

**Response:**
```json
{
  "overview": {
    "totalSatellites": 5000,
    "activeSatellites": 4800,
    "inactiveSatellites": 200,
    "recentLaunches": 25,
    "highRiskCollisions": 3
  },
  "distribution": {
    "byType": {
      "COMMUNICATION": 2000,
      "EARTH_OBSERVATION": 1500,
      "NAVIGATION": 500,
      "WEATHER": 300,
      "SCIENTIFIC": 700
    },
    "byStatus": {
      "ACTIVE": 4800,
      "INACTIVE": 200
    }
  }
}
```

---

## 🌦️ Space Weather Endpoints

### GET /weather/current
Get current space weather conditions.

**Response:**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "solarFluxIndex": 120.5,
  "geomagneticIndex": 2.3,
  "solarWindSpeed": 450.0,
  "protonFlux": 0.5,
  "electronFlux": 100.0,
  "xrayFlux": 1.2e-6,
  "alertLevel": "GREEN",
  "description": "Normal space weather conditions"
}
```

### GET /weather/history
Get historical space weather data.

**Query Parameters:**
- `hours` (number): Hours of history to retrieve (default: 24, max: 168)
- `alertLevel` (string): Filter by alert level

**Response:**
```json
{
  "timeRange": {
    "hours": 24,
    "since": "2024-01-01T00:00:00.000Z",
    "until": "2024-01-02T00:00:00.000Z"
  },
  "data": [
    {
      "timestamp": "2024-01-01T12:00:00.000Z",
      "solarFluxIndex": 120.5,
      "alertLevel": "GREEN",
      "description": "Normal conditions"
    }
  ],
  "count": 48
}
```

### GET /weather/forecast
Get space weather forecast predictions.

**Response:**
```json
{
  "currentConditions": {
    "alertLevel": "GREEN",
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "trends": {
    "solarFlux": "stable",
    "geomagneticActivity": "increasing",
    "solarWind": "decreasing"
  },
  "forecast": [
    {
      "hours": 6,
      "predictedAlertLevel": "YELLOW",
      "confidence": "medium",
      "description": "Predicted conditions in 6 hours"
    }
  ]
}
```

---

## 📊 Analytics Endpoints

### GET /analytics/overview
Get system overview analytics.

**Response:**
```json
{
  "overview": {
    "satellites": {
      "total": 5000,
      "active": 4800,
      "inactive": 200,
      "newThisWeek": 15
    },
    "debris": {
      "total": 34000,
      "tracked": 34000
    },
    "risks": {
      "current": 25,
      "newThisWeek": 8
    },
    "events": {
      "critical": 3,
      "thisWeek": 12
    },
    "spaceWeather": {
      "alerts24h": 2
    }
  },
  "systemHealth": {
    "uptime": 86400,
    "memoryUsage": {
      "rss": 123456789,
      "heapTotal": 98765432,
      "heapUsed": 87654321
    },
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET /analytics/satellites
Get satellite distribution analytics.

**Response:**
```json
{
  "distribution": {
    "byType": {
      "COMMUNICATION": 2000,
      "EARTH_OBSERVATION": 1500,
      "NAVIGATION": 500
    },
    "byStatus": {
      "ACTIVE": 4800,
      "INACTIVE": 200
    },
    "byCountry": {
      "US": 2000,
      "RUSSIA": 800,
      "CHINA": 600
    },
    "byAltitude": {
      "LEO (< 2000km)": 3000,
      "MEO (2000-35786km)": 500,
      "GEO (35786km)": 1000,
      "HEO (> 35786km)": 500
    }
  },
  "trends": {
    "launches": [
      {
        "date": "2024-01-01",
        "count": 5
      }
    ]
  }
}
```

---

## 🚀 Launch Endpoints

### GET /launches
Get launch events with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by launch status
- `upcoming`: Show only upcoming launches (true/false)
- `sortBy`: Sort field
- `sortOrder`: Sort direction

**Response:**
```json
{
  "launches": [
    {
      "id": "launch_id",
      "name": "Falcon 9 Block 5 | Starlink Group 7-1",
      "launchDate": "2024-01-15T10:30:00.000Z",
      "rocket": "Falcon 9 Block 5",
      "launchSite": "Kennedy Space Center LC-39A",
      "mission": "Starlink constellation deployment",
      "status": "SCHEDULED",
      "payloads": ["Starlink v2.0 x23"],
      "description": "SpaceX will launch 23 Starlink satellites",
      "liveStream": "https://www.spacex.com/launches/",
      "isUpcoming": true,
      "timeUntilLaunch": 864000000
    }
  ],
  "pagination": {...}
}
```

### GET /launches/upcoming/next
Get upcoming launches in the next specified period.

**Query Parameters:**
- `days` (number): Days ahead to look (default: 30)

**Response:**
```json
{
  "upcomingLaunches": [
    {
      "id": "launch_id",
      "name": "Falcon 9 Block 5 | Starlink Group 7-1",
      "launchDate": "2024-01-15T10:30:00.000Z",
      "status": "SCHEDULED",
      "timeUntilLaunch": 864000000,
      "daysUntilLaunch": 10
    }
  ],
  "timeRange": {
    "days": 30,
    "until": "2024-01-31T00:00:00.000Z"
  },
  "count": 5
}
```

---

## 🛸 Debris Endpoints

### GET /debris
Get space debris objects with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: Filter by debris type
- `minSize`, `maxSize`: Filter by size range
- `sortBy`: Sort field
- `sortOrder`: Sort direction

**Response:**
```json
{
  "debris": [
    {
      "id": "debris_id",
      "noradId": 12345,
      "name": "COSMOS 2251 DEB",
      "type": "FRAGMENTATION_DEBRIS",
      "size": 0.5,
      "mass": 2.3,
      "lastObserved": "2024-01-01T12:00:00.000Z",
      "decayPrediction": "2025-01-01T00:00:00.000Z",
      "currentPosition": {
        "latitude": 45.123,
        "longitude": -123.456,
        "altitude": 650.0,
        "velocity": 7.5
      }
    }
  ],
  "pagination": {...}
}
```

### GET /debris/decays/upcoming
Get upcoming debris decay events.

**Query Parameters:**
- `days` (number): Days ahead to look (default: 30)

**Response:**
```json
{
  "upcomingDecays": [
    {
      "id": "debris_id",
      "name": "COSMOS 2251 DEB",
      "type": "FRAGMENTATION_DEBRIS",
      "decayPrediction": "2024-01-15T00:00:00.000Z",
      "daysUntilDecay": 10,
      "currentPosition": {...}
    }
  ],
  "timeRange": {
    "days": 30,
    "until": "2024-01-31T00:00:00.000Z"
  },
  "count": 15
}
```

---

## 🚨 Alert Endpoints

### GET /alerts
Get user alerts with filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: Filter by alert type
- `severity`: Filter by severity
- `isRead`: Filter by read status (true/false)
- `sortBy`: Sort field
- `sortOrder`: Sort direction

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_id",
      "type": "COLLISION_RISK",
      "title": "High Collision Risk Detected",
      "message": "Satellite ISS has a 15% collision probability",
      "severity": "HIGH",
      "isRead": false,
      "metadata": {
        "satelliteId": "sat_id",
        "probability": 0.15
      },
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {...},
  "summary": {
    "total": 25,
    "unread": 5,
    "read": 20
  }
}
```

### PUT /alerts/:id/read
Mark an alert as read.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Alert marked as read",
  "alert": {
    "id": "alert_id",
    "isRead": true,
    "readAt": "2024-01-01T12:30:00.000Z"
  }
}
```

### PUT /alerts/read/all
Mark all alerts as read.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "All alerts marked as read",
  "updatedCount": 5
}
```

---

## 🔄 WebSocket Events

### Connection
Connect to WebSocket at `ws://localhost:3001` with authentication:

```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'authenticate',
    data: { token: 'your-jwt-token' }
  }));
};
```

### Event Types

#### satellite:update
Real-time satellite position updates.

```json
{
  "type": "satellite:update",
  "data": {
    "satelliteId": "sat_id",
    "data": {
      "latitude": 45.123,
      "longitude": -123.456,
      "altitude": 408.5,
      "velocity": 7.66,
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### weather:update
Space weather condition updates.

```json
{
  "type": "weather:update",
  "data": {
    "data": {
      "timestamp": "2024-01-01T12:00:00.000Z",
      "solarFluxIndex": 120.5,
      "alertLevel": "YELLOW",
      "description": "Elevated solar activity detected"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### alert
Critical system alerts.

```json
{
  "type": "alert",
  "data": {
    "id": "alert_id",
    "type": "COLLISION_RISK",
    "title": "Critical Collision Warning",
    "message": "High probability collision detected",
    "severity": "CRITICAL"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### heartbeat
Connection monitoring and system status.

```json
{
  "type": "heartbeat",
  "data": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "connectedUsers": 25,
    "activeSubscriptions": 150
  }
}
```

### Subscription Management

#### Subscribe to satellite updates
```json
{
  "type": "subscribe:satellite",
  "data": "satellite_id"
}
```

#### Subscribe to global updates
```json
{
  "type": "subscribe:global"
}
```

#### Subscribe to alerts
```json
{
  "type": "subscribe:alerts"
}
```

#### Subscribe to space weather
```json
{
  "type": "subscribe:weather"
}
```

---

## 📝 Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | Authentication token required |
| `INVALID_TOKEN` | Authentication token is invalid |
| `TOKEN_EXPIRED` | Authentication token has expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `USER_NOT_FOUND` | User account not found |
| `SATELLITE_NOT_FOUND` | Satellite not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DATABASE_ERROR` | Database operation failed |
| `EXTERNAL_API_ERROR` | External service unavailable |
| `INTERNAL_ERROR` | Internal server error |

---

## 📊 Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|---------|
| Authentication | 10 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| WebSocket | 1000 messages | 1 minute |

---

## 🔧 SDK Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get satellites
const satellites = await api.get('/satellites?limit=10&type=COMMUNICATION');

// Track a satellite
await api.post(`/satellites/${satelliteId}/track`);

// Get current user
const user = await api.get('/auth/me');
```

### Python
```python
import requests

headers = {'Authorization': f'Bearer {token}'}
base_url = 'http://localhost:3001/api'

# Get satellites
response = requests.get(f'{base_url}/satellites', headers=headers)
satellites = response.json()

# Track a satellite
requests.post(f'{base_url}/satellites/{satellite_id}/track', headers=headers)
```

### cURL
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@orbital-insight.ai","password":"demo123"}'

# Get satellites
curl -X GET http://localhost:3001/api/satellites \
  -H "Authorization: Bearer YOUR_TOKEN"

# Track satellite
curl -X POST http://localhost:3001/api/satellites/SATELLITE_ID/track \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

This API documentation provides comprehensive coverage of all available endpoints, real-time features, and integration examples for the Orbital Insight AI platform.