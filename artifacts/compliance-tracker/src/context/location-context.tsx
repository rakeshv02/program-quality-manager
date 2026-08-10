import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useListLocations } from "@workspace/api-client-react";
import type { FacilityType } from "@/lib/compliance-rules";

interface LocationContextType {
  activeLocationId: number | null;
  setActiveLocationId: (id: number | null) => void;
  activeFacilityType: FacilityType;
  setActiveFacilityType: (ft: FacilityType) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [activeLocationId, setActiveLocationIdState] = useState<number | null>(null);
  const [activeFacilityType, setActiveFacilityTypeState] = useState<FacilityType>("child_care_center");
  const [manualFacilityOverride, setManualFacilityOverride] = useState(false);
  const { data: locations, isLoading } = useListLocations();

  // Auto-select first location on load
  useEffect(() => {
    if (!isLoading && locations && locations.length > 0 && !activeLocationId) {
      setActiveLocationIdState(locations[0].id);
    }
  }, [locations, isLoading, activeLocationId]);

  // Sync facility type from the selected location (unless user manually overrode it)
  useEffect(() => {
    if (!manualFacilityOverride && locations) {
      if (activeLocationId) {
        const loc = locations.find(l => l.id === activeLocationId);
        if (loc?.facilityType) {
          setActiveFacilityTypeState(loc.facilityType as FacilityType);
        }
      }
    }
  }, [activeLocationId, locations, manualFacilityOverride]);

  const setActiveLocationId = (id: number | null) => {
    setActiveLocationIdState(id);
    // Switching location clears the manual override so the type auto-syncs
    setManualFacilityOverride(false);
  };

  const setActiveFacilityType = (ft: FacilityType) => {
    setActiveFacilityTypeState(ft);
    setManualFacilityOverride(true);
  };

  return (
    <LocationContext.Provider value={{ activeLocationId, setActiveLocationId, activeFacilityType, setActiveFacilityType }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
}
