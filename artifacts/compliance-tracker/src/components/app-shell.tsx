import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useListLocations } from "@workspace/api-client-react";
import { useLocationContext } from "@/context/location-context";
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  Star, 
  Settings,
  LogOut,
  MapPin,
  Building2,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/certifications", label: "Certifications", icon: Award },
  { href: "/rising-star", label: "Rising Star", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { activeLocationId, setActiveLocationId } = useLocationContext();
  const { data: locations = [] } = useListLocations();
  
  const activeLocation = locations.find(l => l.id === activeLocationId);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Sidebar - fixed left, dark charcoal */}
      <aside className="w-56 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-sm">
        {/* Logo/Title Area */}
        <div className="h-16 flex items-center px-4 shrink-0 gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
             <Star className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight leading-tight">Texas Childcare Advisors</span>
            <span className="text-[10px] text-sidebar-foreground/70 uppercase tracking-wider font-semibold">Compliance</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary pl-2.5" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-sidebar-foreground/60"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions (Location + User) */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0 flex flex-col gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start px-2 h-auto py-2 hover:bg-sidebar-accent hover:text-sidebar-foreground text-left flex gap-3"
              >
                <div className="w-8 h-8 rounded-md bg-sidebar-accent flex items-center justify-center shrink-0 border border-sidebar-border">
                  <MapPin className="w-4 h-4 text-sidebar-foreground/80" />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs text-sidebar-foreground/70 font-medium">Location</p>
                  <p className="text-sm font-medium truncate">
                    {activeLocation ? activeLocation.name : "All Locations"}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-sidebar-foreground/50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="start">
              <DropdownMenuLabel>Select Location</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setActiveLocationId(null)}
                className={!activeLocationId ? "bg-accent" : ""}
              >
                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                All Locations
              </DropdownMenuItem>
              {locations.map((loc) => (
                <DropdownMenuItem 
                  key={loc.id} 
                  onClick={() => setActiveLocationId(loc.id)}
                  className={activeLocationId === loc.id ? "bg-accent" : ""}
                >
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  {loc.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium uppercase shrink-0 border border-sidebar-border">
              {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "?"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{user?.firstName || "User"}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0" onClick={() => signOut()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
