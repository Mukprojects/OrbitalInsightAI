
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

const MetricsPanel = () => {
  const metrics = [
    {
      name: "System Resources",
      value: 68,
      color: "bg-space-bright-blue"
    },
    {
      name: "Network Bandwidth",
      value: 42,
      color: "bg-space-success"
    },
    {
      name: "AI Processing Load",
      value: 92,
      color: "bg-space-warning"
    },
    {
      name: "Storage Capacity",
      value: 24,
      color: "bg-space-accent"
    }
  ];

  const aiInsights = [
    {
      type: "Weather",
      prediction: "Hurricane pattern forming in the Atlantic",
      confidence: 89
    },
    {
      type: "Deforestation",
      prediction: "Increased activity in Amazon region",
      confidence: 73
    },
    {
      type: "Maritime",
      prediction: "Unusual shipping patterns detected",
      confidence: 65
    }
  ];

  return (
    <Card className="card-gradient">
      <CardHeader className="pb-2">
        <CardTitle className="text-space-accent flex items-center justify-between text-sm">
          <span>System Metrics</span>
          <ExternalLink className="h-4 w-4" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{metric.name}</span>
                <span>{metric.value}%</span>
              </div>
              <Progress
                value={metric.value}
                className={`h-1.5 bg-muted/20 ${metric.color}`}
              />
            </div>
          ))}

          <div className="pt-2">
            <h4 className="text-sm font-medium mb-2">AI Insights</h4>
            <div className="space-y-3">
              {aiInsights.map((insight) => (
                <div key={insight.type} className="bg-muted/20 rounded p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">{insight.type}</span>
                    <span className="text-space-accent">{insight.confidence}% confidence</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{insight.prediction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsPanel;
