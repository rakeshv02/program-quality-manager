import { type ReactNode } from "react";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  Star, 
  Settings,
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
  { href: "/demo", label: "Dashboard", icon: LayoutDashboard, active: true },
  { href: "#", label: "Staff", icon: Users, active: false },
  { href: "#", label: "Certifications", icon: Award, active: false },
  { href: "#", label: "Rising Star", icon: Star, active: false },
  { href: "#", label: "Settings", icon: Settings, active: false },
];

const locations = [
  { id: 1, name: "Downtown Center" },
  { id: 2, name: "North Campus" }
];

export function DemoShell({ 
  children, 
  activeLocationId, 
  setActiveLocationId 
}: { 
  children: ReactNode;
  activeLocationId: number | null;
  setActiveLocationId: (id: number | null) => void;
}) {
  const activeLocation = locations.find(l => l.id === activeLocationId);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <aside className="w-56 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-sm">
        <div className="h-16 flex items-center px-4 shrink-0 gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
             <Star className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight leading-tight">Texas Childcare Advisors</span>
            <span className="text-[10px] text-sidebar-foreground/70 uppercase tracking-wider font-semibold">Compliance</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (!item.active) {
              return (
                <div 
                  key={item.label} 
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-sidebar-foreground/80 cursor-not-allowed opacity-60"
                >
                  <item.icon className="w-4 h-4 text-sidebar-foreground/60" />
                  {item.label}
                </div>
              );
            }
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary pl-2.5 cursor-default"
              >
                <item.icon className="w-4 h-4 text-primary" />
                {item.label}
              </Link>
            );
          })}
        </nav>

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
            <div className="w-8 h-8 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0 border border-amber-500/30">
              DEMO
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-amber-500 truncate">Demo Mode</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">View only</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="w-full bg-indigo-50 border-b border-indigo-100 p-3 flex flex-col sm:flex-row items-center justify-center gap-4 text-center shrink-0">
          <p className="text-sm font-medium text-indigo-900">
            You're viewing a demo. Ready to track your own staff?
          </p>
          <Link href="/sign-up" className="text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white px-4 py-1.5 rounded-md transition-colors">
            Start Free Trial
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
