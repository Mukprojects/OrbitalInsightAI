
import { BarChart3, Boxes, Cloud, Compass, Globe, Layers, Moon, Satellite, Settings, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useView } from "../contexts/ViewContext";

const Sidebar = () => {
  const { activeView, setActiveView } = useView();

  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: <Globe className="h-5 w-5" />
    },
    {
      id: "satellites",
      name: "Satellites",
      icon: <Satellite className="h-5 w-5" />
    },
    {
      id: "debris",
      name: "Debris Tracker",
      icon: <Boxes className="h-5 w-5" />
    },
    {
      id: "analytics",
      name: "AI Analytics",
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      id: "weather",
      name: "Weather",
      icon: <Cloud className="h-5 w-5" />
    },
    {
      id: "navigation",
      name: "Navigation",
      icon: <Compass className="h-5 w-5" />
    },
    {
      id: "events",
      name: "Events",
      icon: <Moon className="h-5 w-5" />
    }
  ];

  const bottomItems = [
    {
      id: "settings",
      name: "Settings",
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: "security",
      name: "Security",
      icon: <Shield className="h-5 w-5" />
    }
  ];

  return (
    <div className="w-64 border-r border-border/50 bg-space-dark-blue flex-shrink-0 hidden md:flex flex-col">
      <div className="flex flex-col flex-grow p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`justify-start ${
              activeView === item.id
                ? "bg-space-blue text-space-accent"
                : "hover:bg-space-blue/20"
            }`}
            onClick={() => setActiveView(item.id as any)}
          >
            {item.icon}
            <span className="ml-2 font-space">{item.name}</span>
          </Button>
        ))}

        <div className="h-px bg-border/50 my-4"></div>

        <div className="p-2 mb-2">
          <p className="text-xs text-muted-foreground font-space">LAYERS</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center px-3 py-1.5">
            <input id="weather-layer" type="checkbox" className="h-4 w-4 accent-space-accent" />
            <label htmlFor="weather-layer" className="ml-2 text-sm">Weather</label>
          </div>
          <div className="flex items-center px-3 py-1.5">
            <input id="population-layer" type="checkbox" className="h-4 w-4 accent-space-accent" defaultChecked />
            <label htmlFor="population-layer" className="ml-2 text-sm">Population</label>
          </div>
          <div className="flex items-center px-3 py-1.5">
            <input id="satellites-layer" type="checkbox" className="h-4 w-4 accent-space-accent" defaultChecked />
            <label htmlFor="satellites-layer" className="ml-2 text-sm">Satellites</label>
          </div>
          <div className="flex items-center px-3 py-1.5">
            <input id="debris-layer" type="checkbox" className="h-4 w-4 accent-space-accent" defaultChecked />
            <label htmlFor="debris-layer" className="ml-2 text-sm">Debris</label>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border/50">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className="justify-start w-full mb-2"
          >
            {item.icon}
            <span className="ml-2 font-space">{item.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
