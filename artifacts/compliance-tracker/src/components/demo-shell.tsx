import { type ReactNode } from "react";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  FileText,
  Star,
  Settings,
  MapPin,
  Building2,
  ChevronDown,
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
import { locationsData } from "@/lib/demo-data";

export type DemoSection = "dashboard" | "staff" | "reports" | "rising-star" | "settings";

const navItems: { section: DemoSection; label: string; icon: React.ElementType }[] = [
  { section: "dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { section: "staff",       label: "Staff",        icon: Users },
  { section: "reports",     label: "Reports",      icon: FileText },
  { section: "rising-star", label: "Rising Star",  icon: Star },
  { section: "settings",    label: "Settings",     icon: Settings },
];

interface DemoShellProps {
  children: ReactNode;
  activeSection: DemoSection;
  setActiveSection: (s: DemoSection) => void;
  activeLocationId: number | null;
  setActiveLocationId: (id: number | null) => void;
}

export function DemoShell({
  children,
  activeSection,
  setActiveSection,
  activeLocationId,
  setActiveLocationId,
}: DemoShellProps) {
  const activeLocation = locationsData.find(l => l.id === activeLocationId);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-sm">
        {/* Logo */}
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
            const isActive = activeSection === item.section;
            return (
              <button
                key={item.section}
                onClick={() => setActiveSection(item.section)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary pl-2.5"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-sidebar-foreground/60"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom: location picker + demo badge */}
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
              {locationsData.map((loc) => (
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
            <div className="w-8 h-8 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold shrink-0 border border-amber-500/30 uppercase tracking-wider">
              Demo
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-amber-500 truncate">Demo Mode</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">Sample data only</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Demo banner */}
        <div className="w-full bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-3 shrink-0">
          <p className="text-sm font-medium text-indigo-900">
            You're viewing a demo with sample data.
          </p>
          <Link
            href="/sign-up"
            className="text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white px-4 py-1.5 rounded-md transition-colors whitespace-nowrap"
          >
            Start Free Trial
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
