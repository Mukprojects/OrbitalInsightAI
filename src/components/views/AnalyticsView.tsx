
import { BarChart3, BrainCircuit, TrendingUp, LineChart, Cpu, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsView = () => {
  const predictionData = [
    { name: 'Weather', value: 37 },
    { name: 'Deforest', value: 22 },
    { name: 'Maritime', value: 15 },
    { name: 'Debris', value: 26 },
  ];
  
  const accuracyData = [
    { name: 'Jan', accuracy: 78 },
    { name: 'Feb', accuracy: 81 },
    { name: 'Mar', accuracy: 80 },
    { name: 'Apr', accuracy: 85 },
    { name: 'May', accuracy: 88 },
    { name: 'Jun', accuracy: 92 },
    { name: 'Jul', accuracy: 91 },
    { name: 'Aug', accuracy: 94 },
  ];
  
  const COLORS = ['#4CC9F0', '#06D6A0', '#FFD166', '#FF6B6B'];
  
  const aiInsights = [
    {
      type: "Weather",
      prediction: "Hurricane pattern forming in the Atlantic",
      confidence: 89,
      impact: "High",
      timeframe: "5-7 days"
    },
    {
      type: "Deforestation",
      prediction: "Increased activity in Amazon region",
      confidence: 73,
      impact: "Medium",
      timeframe: "Current"
    },
    {
      type: "Maritime",
      prediction: "Unusual shipping patterns detected",
      confidence: 65,
      impact: "Medium",
      timeframe: "Current"
    },
    {
      type: "Space Debris",
      prediction: "Potential collision cluster forming",
      confidence: 82,
      impact: "High",
      timeframe: "3 days"
    },
    {
      type: "Climate",
      prediction: "Accelerated ice melt in Arctic",
      confidence: 91,
      impact: "High",
      timeframe: "Ongoing"
    }
  ];

  return (
    <div className="grid-pattern h-full flex flex-col">
      <div className="p-4 mb-2">
        <h2 className="text-2xl font-bold font-space text-space-accent">AI Analytics Platform</h2>
        <p className="text-muted-foreground">Advanced predictions and insights from satellite data</p>
      </div>
      
      <div className="flex-1 px-4 pb-4 grid grid-cols-12 gap-4">
        {/* Top stats */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-muted-foreground text-sm">AI Model Accuracy</div>
                  <div className="text-2xl font-bold font-space text-space-accent">94.2%</div>
                </div>
                <div className="p-3 rounded-full bg-space-accent/10">
                  <BrainCircuit className="h-6 w-6 text-space-accent" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Last month: 92.8%</span>
                  <span className="text-space-success">+1.4%</span>
                </div>
                <Progress value={94} className="h-1 bg-muted/20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-muted-foreground text-sm">Active Predictions</div>
                  <div className="text-2xl font-bold font-space text-space-accent">142</div>
                </div>
                <div className="p-3 rounded-full bg-space-accent/10">
                  <TrendingUp className="h-6 w-6 text-space-accent" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Last week: 128</span>
                  <span className="text-space-success">+14</span>
                </div>
                <Progress value={75} className="h-1 bg-muted/20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-muted-foreground text-sm">Processing Power</div>
                  <div className="text-2xl font-bold font-space text-space-accent">92%</div>
                </div>
                <div className="p-3 rounded-full bg-space-accent/10">
                  <Cpu className="h-6 w-6 text-space-accent" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Normal: 65-75%</span>
                  <span className="text-space-warning">High Load</span>
                </div>
                <Progress value={92} className="h-1 bg-muted/20" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-1 gap-4">
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center text-sm font-space">
                <LineChart className="h-4 w-4 mr-2" />
                MODEL ACCURACY TREND
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={accuracyData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#A6E1FA" />
                  <YAxis domain={[70, 100]} stroke="#A6E1FA" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 17, 40, 0.9)', 
                      borderColor: '#A6E1FA',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }} 
                  />
                  <Bar dataKey="accuracy" fill="#4CC9F0" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center justify-between text-sm font-space">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  CRITICAL PREDICTIONS
                </div>
                <button className="text-xs bg-muted/20 px-2 py-1 rounded hover:bg-muted/30 transition-colors flex items-center">
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <div key={index} className="bg-muted/20 rounded p-3 text-sm hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium font-space text-space-accent">{insight.type}</div>
                      <div className="text-xs px-2 py-0.5 rounded-full bg-muted/30">
                        {insight.impact} Impact
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-2">{insight.prediction}</p>
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center">
                        <BrainCircuit className="h-3 w-3 mr-1" />
                        <span>{insight.confidence}% confidence</span>
                      </div>
                      <span>{insight.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-4 space-y-4">
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center text-sm font-space">
                <BarChart3 className="h-4 w-4 mr-2" />
                PREDICTION DISTRIBUTION
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={predictionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {predictionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 17, 40, 0.9)', 
                      borderColor: '#A6E1FA', 
                      borderRadius: '4px',
                      color: '#ffffff'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle className="text-space-accent flex items-center text-sm font-space">
                <BrainCircuit className="h-4 w-4 mr-2" />
                AI MODEL PERFORMANCE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Weather Prediction</span>
                    <span>96%</span>
                  </div>
                  <Progress value={96} className="h-1.5 bg-muted/20" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Deforestation Detection</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-1.5 bg-muted/20" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Debris Collision</span>
                    <span>89%</span>
                  </div>
                  <Progress value={89} className="h-1.5 bg-muted/20" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Maritime Tracking</span>
                    <span>94%</span>
                  </div>
                  <Progress value={94} className="h-1.5 bg-muted/20" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Urban Development</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} className="h-1.5 bg-muted/20" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-muted/20">
                <button className="w-full bg-space-bright-blue hover:bg-space-blue text-white py-1.5 px-4 rounded text-sm transition-colors font-space">
                  Retrain Models
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
