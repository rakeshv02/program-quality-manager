import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useListLocations } from "@workspace/api-client-react";
import { useLocationContext } from "@/context/location-context";
import { FACILITY_META, type FacilityType } from "@/lib/compliance-rules";
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  Star, 
  Settings,
  LogOut,
  MapPin,
  Building2,
  ChevronDown,
  BookOpen,
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
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/certifications", label: "Certifications", icon: Award },
  { href: "/rising-star", label: "Rising Star", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

const FACILITY_TYPE_COLORS: Record<FacilityType, string> = {
  child_care_center: "bg-blue-500",
  licensed_home:     "bg-emerald-500",
  school_age:        "bg-violet-500",
};

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { activeLocationId, setActiveLocationId, activeFacilityType, setActiveFacilityType } = useLocationContext();
  const { data: locations = [] } = useListLocations();
  
  const activeLocation = locations.find(l => l.id === activeLocationId);
  const meta = FACILITY_META[activeFacilityType];
  const dotColor = FACILITY_TYPE_COLORS[activeFacilityType];

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-sm">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 shrink-0 gap-3 border-b border-sidebar-border/50">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-tight leading-tight">Texas Childcare Advisors</span>
            <span className="text-[9px] text-sidebar-foreground/60 uppercase tracking-wider font-semibold">Compliance</span>
          </div>
        </div>

        {/* Facility Type Selector — always visible in sidebar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full px-3 py-2.5 border-b border-sidebar-border/50 text-left hover:bg-sidebar-accent/40 transition-colors group">
              <p className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                <BookOpen className="w-2.5 h-2.5" />Facility Type
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                  <span className="text-xs font-semibold text-sidebar-foreground truncate">{meta.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-sidebar-border/60 text-sidebar-foreground/60 bg-sidebar-accent/30 font-mono">
                    {meta.tacLabel}
                  </Badge>
                  <ChevronDown className="w-3 h-3 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors" />
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="start" sideOffset={4}>
            <DropdownMenuLabel className="text-xs text-muted-foreground pb-1">Select Facility Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.entries(FACILITY_META) as [FacilityType, typeof FACILITY_META[FacilityType]][]).map(([key, m]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setActiveFacilityType(key)}
                className={`flex flex-col items-start py-2.5 gap-0.5 cursor-pointer ${activeFacilityType === key ? "bg-accent" : ""}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${FACILITY_TYPE_COLORS[key]}`} />
                  <span className="font-semibold text-sm flex-1">{m.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{m.tacLabel}</Badge>
                </div>
                <p className="text-xs text-muted-foreground pl-4 leading-relaxed">{m.description.slice(0, 60)}…</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
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

        {/* Bottom: Location + User */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar shrink-0 flex flex-col gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start px-2 h-auto py-1.5 hover:bg-sidebar-accent hover:text-sidebar-foreground text-left flex gap-2.5"
              >
                <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center shrink-0 border border-sidebar-border">
                  <MapPin className="w-3.5 h-3.5 text-sidebar-foreground/80" />
                </div>
                <div className="flex-1 truncate text-left">
                  <p className="text-[10px] text-sidebar-foreground/60 font-medium">Location</p>
                  <p className="text-xs font-semibold truncate">
                    {activeLocation ? activeLocation.name : "All Locations"}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/50 shrink-0" />
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

          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold uppercase shrink-0 border border-sidebar-border">
              {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "?"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold truncate">{user?.firstName || "User"}</p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0" onClick={() => signOut()}>
              <LogOut className="w-3.5 h-3.5" />
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
