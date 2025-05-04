
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface PredictionCardProps {
  title: string;
  value: string;
  trend: "up" | "down" | "stable";
  status: "success" | "warning" | "danger" | "neutral";
  details: string;
}

const PredictionCard = ({ title, value, trend, status, details }: PredictionCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-space-success/20 border-space-success/30 text-space-success";
      case "warning":
        return "bg-space-warning/20 border-space-warning/30 text-space-warning";
      case "danger":
        return "bg-space-alert/20 border-space-alert/30 text-space-alert";
      default:
        return "bg-muted/20 border-muted/30 text-muted-foreground";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return (
          <div className={`flex items-center ${status === "warning" || status === "danger" ? "text-space-alert" : "text-space-success"}`}>
            <ArrowUpIcon className="h-3 w-3 mr-1" />
            <span className="text-xs">Increasing</span>
          </div>
        );
      case "down":
        return (
          <div className={`flex items-center ${status === "success" ? "text-space-success" : "text-space-alert"}`}>
            <ArrowDownIcon className="h-3 w-3 mr-1" />
            <span className="text-xs">Decreasing</span>
          </div>
        );
      default:
        return <span className="text-xs text-muted-foreground">Stable</span>;
    }
  };

  return (
    <Card className={`card-gradient border ${getStatusColor()} hover-glow`}>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-1">{title}</h3>
        <div className="flex justify-between items-baseline mb-2">
          <p className="text-2xl font-bold">{value}</p>
          {getTrendIcon()}
        </div>
        <p className="text-xs text-muted-foreground">{details}</p>
      </CardContent>
    </Card>
  );
};

export default PredictionCard;
