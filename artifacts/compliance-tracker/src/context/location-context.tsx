import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useListLocations } from "@workspace/api-client-react";

interface LocationContextType {
  activeLocationId: number | null;
  setActiveLocationId: (id: number | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [activeLocationId, setActiveLocationId] = useState<number | null>(null);
  const { data: locations, isLoading } = useListLocations();

  useEffect(() => {
    // Auto-select first location if none is selected and data is available
    if (!isLoading && locations && locations.length > 0 && !activeLocationId) {
      setActiveLocationId(locations[0].id);
    }
  }, [locations, isLoading, activeLocationId]);

  return (
    <LocationContext.Provider value={{ activeLocationId, setActiveLocationId }}>
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
