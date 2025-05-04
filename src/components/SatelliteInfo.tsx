
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { toast } from "sonner";

interface SatelliteInfoProps {
  satellite: {
    id: string;
    name: string;
    type: string;
    altitude: number;
    velocity: number;
    inclination: number;
    status: "active" | "inactive" | "warning";
  } | null;
}

const SatelliteInfo = ({ satellite }: SatelliteInfoProps) => {
  if (!satellite) {
    return (
      <Card className="card-gradient">
        <CardHeader className="pb-2">
          <CardTitle className="text-space-accent flex items-center text-sm">
            <Info className="h-4 w-4 mr-2" />
            Satellite Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>Select a satellite to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-space-success" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-space-warning" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-space-alert" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Operational";
      case "warning":
        return "Minor Issues";
      case "inactive":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const handleViewTelemetry = () => {
    toast.success(`Accessing telemetry for ${satellite.name}`, {
      description: `ID: ${satellite.id}, Type: ${satellite.type}`,
      duration: 5000,
    });
  };

  return (
    <Card className="card-gradient">
      <CardHeader className="pb-2">
        <CardTitle className="text-space-accent flex items-center text-sm">
          <Info className="h-4 w-4 mr-2" />
          Satellite Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{satellite.name}</h3>
            <div className="flex items-center bg-muted/20 px-2 py-1 rounded text-xs">
              {getStatusIcon(satellite.status)}
              <span className="ml-1">{getStatusText(satellite.status)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">ID</div>
              <div>{satellite.id}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Type</div>
              <div>{satellite.type}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Altitude</span>
              <span>{satellite.altitude} km</span>
            </div>
            <Progress value={satellite.altitude / 10} className="h-1.5 bg-muted/20" />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Velocity</span>
              <span>{satellite.velocity} km/h</span>
            </div>
            <Progress value={satellite.velocity / 300} className="h-1.5 bg-muted/20" />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Inclination</span>
              <span>{satellite.inclination}°</span>
            </div>
            <Progress value={satellite.inclination} className="h-1.5 bg-muted/20" />
          </div>

          <div className="pt-2">
            <button 
              onClick={handleViewTelemetry}
              className="w-full bg-space-bright-blue hover:bg-space-blue text-white py-1 px-2 rounded text-sm transition-colors">
              View Detailed Telemetry
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SatelliteInfo;
