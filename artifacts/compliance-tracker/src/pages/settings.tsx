import { useState } from "react";
import { useUser } from "@clerk/react";
import { 
  useListLocations, 
  useCreateLocation, 
  useUpdateLocation, 
  useDeleteLocation,
  useGetDashboard,
  getListLocationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Plus, Pencil, Trash2, Download, Zap, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocationContext } from "@/context/location-context";
import { FACILITY_META, type FacilityType } from "@/lib/compliance-rules";

function FacilityBadge({ facilityType }: { facilityType: string }) {
  const meta = FACILITY_META[facilityType as FacilityType];
  if (!meta) return null;
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
      <BookOpen className="w-3 h-3 mr-1" />
      {meta.tacLabel}
    </Badge>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeLocationId } = useLocationContext();
  const { user } = useUser();
  
  const { data: locations, isLoading: isLoadingLocations } = useListLocations();
  const { data: dashboard } = useGetDashboard();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const handleUpgradeToPro = async () => {
    try {
      setIsUpgrading(true);
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        toast({
          title: "Error",
          description: "Failed to redirect to checkout",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsUpgrading(false);
    }
  };
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "TX",
    zip: "",
    facilityType: "child_care_center" as FacilityType,
  });

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  const handleOpenCreate = () => {
    if (dashboard?.freeTierUsage && locations && locations.length >= dashboard.freeTierUsage.locationLimit) {
      toast({ title: "Limit Reached", description: `Free tier is limited to ${dashboard.freeTierUsage.locationLimit} locations.`, variant: "destructive" });
      return;
    }
    setSelectedLocation(null);
    setFormData({ name: "", address: "", city: "", state: "TX", zip: "", facilityType: "child_care_center" });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (loc: any) => {
    setSelectedLocation(loc);
    setFormData({
      name: loc.name,
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "TX",
      zip: loc.zip || "",
      facilityType: (loc.facilityType as FacilityType) || "child_care_center",
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (loc: any) => {
    setSelectedLocation(loc);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Location name is required", variant: "destructive" });
      return;
    }
    const payload = { ...formData };
    if (selectedLocation) {
      updateLocation.mutate({ id: selectedLocation.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Location updated." });
          setIsFormOpen(false);
          queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        }
      });
    } else {
      createLocation.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Location added." });
          setIsFormOpen(false);
          queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        }
      });
    }
  };

  const handleDelete = () => {
    if (!selectedLocation) return;
    deleteLocation.mutate({ id: selectedLocation.id }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Location deleted." });
        setIsDeleteDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
      }
    });
  };

  const handleExport = () => {
    let url = '/api/export/csv';
    if (activeLocationId) url += `?locationId=${activeLocationId}`;
    window.location.href = url;
    toast({ title: "Export Started", description: "Your CSV download should begin shortly." });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account, locations, and data.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">Pro Tier</div>
              <div className="text-2xl font-bold text-primary mb-4">$49<span className="text-lg font-normal text-gray-400">/month</span></div>
              <ul className="space-y-2 text-sm text-gray-300 mb-6">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />Unlimited staff members</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />Unlimited locations</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />All Texas program types (TAC 744, 746, 747)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />Clock hour tracking & reports</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />SMS alerts for expiring certifications</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />PDF reports for inspections</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />Email support</li>
              </ul>
              <Button 
                className="w-full bg-primary text-white hover:bg-primary/90" 
                onClick={handleUpgradeToPro}
                disabled={isUpgrading}
              >
                {isUpgrading ? "Processing..." : "Upgrade to Pro - $49/month"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Export</CardTitle>
              <CardDescription>Download your compliance records</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />Export as CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                TAC Chapters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(Object.entries(FACILITY_META) as [FacilityType, typeof FACILITY_META[FacilityType]][]).map(([key, meta]) => (
                <div key={key}>
                  <p className="font-semibold text-blue-900">{meta.tacLabel} — {meta.label}</p>
                  <p className="text-xs text-blue-700/80 mt-0.5">{meta.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-start border-b pb-4">
              <div>
                <CardTitle className="text-xl">Locations</CardTitle>
                <CardDescription>Manage facilities and childcare centers</CardDescription>
              </div>
              <Button onClick={handleOpenCreate} size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-1" /> Add Location
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingLocations ? (
                <div className="p-6 space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : locations?.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-medium text-gray-900">No locations added</p>
                  <p className="text-sm mt-1">Add your first location to start tracking staff quality and certifications.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {locations?.map((loc) => {
                    const meta = FACILITY_META[(loc.facilityType as FacilityType) || "child_care_center"];
                    return (
                      <li key={loc.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900 text-lg">{loc.name}</h4>
                                <FacilityBadge facilityType={loc.facilityType || "child_care_center"} />
                                {meta?.participatesTRS && (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">TRS Eligible</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">{meta?.label}</p>
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <MapPin className="w-3.5 h-3.5 mr-1" />
                                {loc.address ? `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}` : "No address provided"}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenEdit(loc)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleOpenDelete(loc)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{selectedLocation ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>Provide the details for this location. The program type determines which TAC chapter governs training requirements.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="facilityType">Program Type *</Label>
              <Select value={formData.facilityType} onValueChange={(v) => setFormData({ ...formData, facilityType: v as FacilityType })}>
                <SelectTrigger id="facilityType">
                  <SelectValue placeholder="Select program type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(FACILITY_META) as [FacilityType, typeof FACILITY_META[FacilityType]][]).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{meta.label}</span>
                        <span className="text-xs text-gray-500">{meta.tacLabel}{meta.participatesTRS ? " · TRS Eligible" : ""}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.facilityType && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1">
                  {FACILITY_META[formData.facilityType].description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Downtown Center" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-3 space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div className="col-span-1 space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createLocation.isPending || updateLocation.isPending}>
              {selectedLocation ? "Save Changes" : "Add Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Location</DialogTitle>
            <DialogDescription>Are you sure you want to delete {selectedLocation?.name}? This will also delete all staff and certifications. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLocation.isPending}>
              {deleteLocation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
