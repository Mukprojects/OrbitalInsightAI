
import { Bell, ChevronDown, Menu, Search, LogOut, User, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "../hooks/useAuth";
import { satelliteService } from "../services/satellites";
import { toast } from "sonner";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await satelliteService.searchSatellites(searchQuery);
      if (results.results.length > 0) {
        toast.success(`Found ${results.count} satellites matching "${searchQuery}"`);
      } else {
        toast.info(`No satellites found matching "${searchQuery}"`);
      }
    } catch (error) {
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  };

  const getUserDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || user?.email || "User";
  };

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
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search satellites, events, regions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-muted/20 border-muted focus:border-space-accent" 
            disabled={isSearching}
          />
        </form>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {user?.unreadAlerts && user.unreadAlerts > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {user.unreadAlerts > 9 ? '9+' : user.unreadAlerts}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="hidden md:flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={getUserDisplayName(user)} />
                <AvatarFallback className="bg-space-bright-blue text-white text-sm">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium leading-none">{getUserDisplayName(user)}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-black/90 border-space-accent/20">
            <div className="px-2 py-1.5 text-sm text-gray-300">
              <div className="font-medium text-white">{getUserDisplayName(user)}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
            <DropdownMenuSeparator className="bg-space-accent/20" />
            <DropdownMenuItem className="text-white hover:bg-space-accent/20">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-space-accent/20">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-space-accent/20" />
            <DropdownMenuItem 
              className="text-red-400 hover:bg-red-500/20"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
