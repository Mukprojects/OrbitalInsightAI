
export interface SatelliteData {
  id: string;
  name: string;
  type: string;
  altitude: number;
  velocity: number;
  inclination: number;
  status: "active" | "inactive" | "warning";
  longitude: number;  // longitude in degrees
  latitude: number;   // latitude in degrees
  mission?: string;
  owner?: string;
  launchDate?: string;
}

// This is our satellite database with real-world positions
export const satelliteList: SatelliteData[] = [
  {
    id: "sat-001",
    name: "GlobalSat-1",
    type: "Earth Observation",
    altitude: 705,
    velocity: 27600,
    inclination: 98.2,
    status: "active",
    longitude: 45.3,
    latitude: 67.2,
    mission: "Environmental monitoring",
    owner: "Global Space Agency",
    launchDate: "2022-05-14"
  },
  {
    id: "sat-002",
    name: "OceanMonitor-3",
    type: "Weather",
    altitude: 824,
    velocity: 27100,
    inclination: 35.6,
    status: "active", 
    longitude: -120.4,
    latitude: 25.7,
    mission: "Ocean temperature mapping",
    owner: "Oceanic Research Institute",
    launchDate: "2023-02-28"
  },
  {
    id: "sat-003",
    name: "CommRelay-7",
    type: "Communications",
    altitude: 780,
    velocity: 27300,
    inclination: 45.1,
    status: "warning",
    longitude: 10.9,
    latitude: -35.4,
    mission: "Global internet coverage",
    owner: "TechComm Systems",
    launchDate: "2021-11-15"
  },
  {
    id: "sat-004",
    name: "DefenseSat-2",
    type: "Military",
    altitude: 410,
    velocity: 28100,
    inclination: 51.6,
    status: "inactive",
    longitude: 150.5,
    latitude: 80.3,
    mission: "Surveillance",
    owner: "Defense Network",
    launchDate: "2020-07-22"
  },
  {
    id: "sat-005",
    name: "ScienceOrb-1",
    type: "Scientific",
    altitude: 620,
    velocity: 27800,
    inclination: 62.3,
    status: "active",
    longitude: -60.2,
    latitude: -15.8,
    mission: "Atmospheric research",
    owner: "International Space Coalition",
    launchDate: "2023-08-10"
  }
];

// Helper function to convert lat/long to 3D coordinates
export const latLongToVector3 = (
  latitude: number, 
  longitude: number, 
  radius: number, 
  height: number
): [number, number, number] => {
  const phi = (90 - latitude) * (Math.PI / 180);
  const theta = (longitude + 180) * (Math.PI / 180);

  const x = -((radius + height) * Math.sin(phi) * Math.cos(theta));
  const z = ((radius + height) * Math.sin(phi) * Math.sin(theta));
  const y = ((radius + height) * Math.cos(phi));

  return [x, y, z];
};

// Find satellite by ID
export const findSatelliteById = (id: string): SatelliteData | undefined => {
  return satelliteList.find(sat => sat.id === id);
};
