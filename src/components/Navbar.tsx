
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-space-dark-blue relative z-10">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center">
          <div className="h-8 w-8 relative">
            <div className="absolute inset-0 rounded-full bg-space-bright-blue animate-pulse-glow"></div>
            <div className="absolute inset-1 rounded-full bg-space-dark-blue"></div>
            <div className="absolute inset-0 rounded-full border border-space-accent"></div>
          </div>
          <h1 className="ml-2 text-xl font-bold tracking-tight text-space-accent">
            ORBITAL<span className="text-space-highlight">INSIGHT</span>
            <span className="text-xs bg-space-bright-blue text-white px-1 rounded ml-1">AI</span>
          </h1>
        </div>
      </div>

      <div className="hidden md:flex max-w-md w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search satellites, events, regions..." 
            className="pl-8 bg-muted/20 border-muted focus:border-space-accent" 
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-space-alert"></span>
        </Button>

        <div className="hidden md:flex items-center">
          <div className="h-8 w-8 rounded-full bg-space-bright-blue flex items-center justify-center text-white font-medium">
            AI
          </div>
          <div className="ml-2 mr-1">
            <p className="text-sm font-medium leading-none">Admin</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
