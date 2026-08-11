import { useState, Fragment } from "react";
import { 
  useListStaff,
  useListLocations,
  useCreateStaffMember, 
  useUpdateStaffMember, 
  useDeleteStaffMember,
  useGetDashboard,
  getListStaffQueryKey
} from "@workspace/api-client-react";
import { useLocationContext } from "@/context/location-context";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusBadge } from "@/lib/utils/status";
import { FACILITY_META, getTrainingRequirement, ROLE_OPTIONS, type FacilityType } from "@/lib/compliance-rules";
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Filter, Users, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";

export default function StaffPage() {
  const { activeLocationId, activeFacilityType } = useLocationContext();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    status: "active" as const,
    hireDate: "",
    yearsExperience: "",
    annualTrainingHours: "0",
    preserviceHours: "0",
  });

  const queryParams = {
    locationId: activeLocationId || undefined,
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
  };

  const { data: staff, isLoading } = useListStaff(queryParams);
  const { data: locations = [] } = useListLocations();
  const { data: dashboard } = useGetDashboard({});

  const createStaff = useCreateStaffMember();
  const updateStaff = useUpdateStaffMember();
  const deleteStaff = useDeleteStaffMember();

  // Facility type: prefer active location's type, fall back to context (which may be manually selected)
  const activeLocation = locations.find(l => l.id === activeLocationId);
  const formFacilityType: FacilityType = activeLocation
    ? ((activeLocation.facilityType as FacilityType) || "child_care_center")
    : activeFacilityType;
  const activeMeta = FACILITY_META[formFacilityType];
  const roleOptions = ROLE_OPTIONS[formFacilityType];

  function getLocFacilityType(locationId: number): FacilityType {
    const loc = locations.find(l => l.id === locationId);
    return (loc?.facilityType as FacilityType) || activeFacilityType;
  }

  const handleOpenCreate = () => {
    if (!activeLocationId) {
      toast({ title: "Select a Location", description: "Please select a specific location in the sidebar before adding staff.", variant: "destructive" });
      return;
    }
    // Pre-check free tier staff limit before opening the form
    const usage = dashboard?.freeTierUsage;
    if (dashboard?.plan !== "pro" && usage && usage.staffCount >= usage.staffLimit) {
      setIsUpgradeDialogOpen(true);
      return;
    }
    setSelectedStaff(null);
    setFormData({ firstName: "", lastName: "", email: "", role: roleOptions[0] || "", status: "active", hireDate: format(new Date(), "yyyy-MM-dd"), yearsExperience: "", annualTrainingHours: "0", preserviceHours: "0" });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (member: any) => {
    setSelectedStaff(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || "",
      role: member.role,
      status: member.status,
      hireDate: member.hireDate ? member.hireDate.split("T")[0] : "",
      yearsExperience: member.yearsExperience != null ? String(member.yearsExperience) : "",
      annualTrainingHours: String(member.annualTrainingHours ?? 0),
      preserviceHours: String(member.preserviceHours ?? 0),
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (member: any) => {
    setSelectedStaff(member);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!activeLocationId) {
      toast({ title: "Error", description: "Please select a location first", variant: "destructive" });
      return;
    }
    if (!formData.firstName || !formData.lastName || !formData.role) {
      toast({ title: "Error", description: "First name, last name, and role are required", variant: "destructive" });
      return;
    }
    const payload = {
      ...formData,
      locationId: activeLocationId,
      yearsExperience: formData.yearsExperience !== "" ? parseInt(formData.yearsExperience) : undefined,
      annualTrainingHours: parseInt(formData.annualTrainingHours) || 0,
      preserviceHours: parseInt(formData.preserviceHours) || 0,
    };
    if (selectedStaff) {
      updateStaff.mutate({ id: selectedStaff.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Updated", description: "Staff member updated." });
          setIsFormOpen(false);
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey(queryParams) });
        }
      });
    } else {
      createStaff.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Added", description: "Staff member added." });
          setIsFormOpen(false);
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey(queryParams) });
        },
        onError: (err: any) => {
          const msg: string = err?.response?.data?.error ?? err?.message ?? "";
          if (err?.response?.status === 403 || msg.toLowerCase().includes("free tier")) {
            setIsFormOpen(false);
            setIsUpgradeDialogOpen(true);
          } else {
            toast({ title: "Error", description: msg || "Failed to add staff member.", variant: "destructive" });
          }
        },
      });
    }
  };

  const handleDelete = () => {
    if (!selectedStaff) return;
    deleteStaff.mutate({ id: selectedStaff.id }, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Staff member removed." });
        setIsDeleteDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: getListStaffQueryKey(queryParams) });
      }
    });
  };

  const filteredStaff = staff?.filter(m => {
    const q = search.toLowerCase();
    return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">
            Manage staff certifications and training quality.
            {activeMeta && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-0.5">
                <BookOpen className="w-3 h-3" />
                {activeMeta.tacLabel} · {activeMeta.label}
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleOpenCreate} disabled={!activeLocationId} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Staff Member
        </Button>
      </div>

      {!activeLocationId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 flex items-center">
          <Filter className="w-5 h-5 mr-3 text-amber-500" />
          <p className="text-sm font-medium">Select a specific location in the sidebar to add or manage staff.</p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input type="search" placeholder="Search staff..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Annual Training</TableHead>
              <TableHead>Pre-service</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredStaff?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900">No staff found</p>
                    <p className="text-sm">Try adjusting your filters or add a new staff member.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff?.map((member) => {
                const facilityType = getLocFacilityType(member.locationId);
                const req = getTrainingRequirement(facilityType, member.role);
                const annualCompleted = member.annualTrainingHours ?? 0;
                const preserviceCompleted = member.preserviceHours ?? 0;
                const annualPct = Math.min((annualCompleted / req.annualHours) * 100, 100);
                const preservicePct = Math.min((preserviceCompleted / req.preserviceHours) * 100, 100);
                const statusBadge = getStatusBadge(member.status);
                const isExpanded = expandedId === member.id;

                return (
                  <Fragment key={member.id}>
                  <TableRow
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{member.firstName} {member.lastName}</span>
                          {member.email && <span className="text-xs text-gray-500">{member.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{member.role}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadge.classes}>{statusBadge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 min-w-[80px]">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{annualCompleted}/{req.annualHours} hrs</span>
                            {annualCompleted >= req.annualHours
                              ? <span className="text-green-600 font-medium">✓</span>
                              : <span className="text-amber-600">{req.annualHours - annualCompleted} left</span>}
                          </div>
                          <Progress value={annualPct} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 min-w-[80px]">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{preserviceCompleted}/{req.preserviceHours} hrs</span>
                            {preserviceCompleted >= req.preserviceHours
                              ? <span className="text-green-600 font-medium">✓</span>
                              : <span className="text-amber-600">{req.preserviceHours - preserviceCompleted} left</span>}
                          </div>
                          <Progress value={preservicePct} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {member.hireDate ? format(new Date(member.hireDate), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(member); }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDelete(member); }} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-gray-50/60">
                        <TableCell colSpan={7} className="py-3 px-6">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="bg-white border border-gray-100 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Training Requirement</p>
                              <p className="text-gray-900 font-medium">{req.annualHours} annual hrs / {req.preserviceHours} pre-service hrs</p>
                              {req.note && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{req.note}</p>}
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Experience</p>
                              <p className="text-gray-900 font-medium">
                                {member.yearsExperience != null ? `${member.yearsExperience} year${member.yearsExperience !== 1 ? "s" : ""}` : "Not recorded"}
                              </p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Governing Regulation</p>
                              <p className="text-gray-900 font-medium">{FACILITY_META[facilityType].tacLabel} — {FACILITY_META[facilityType].label}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
            <DialogDescription>
              {activeMeta ? `${activeMeta.tacLabel} · ${activeMeta.label}` : "Enter the staff member's details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    <SelectItem value="__custom">Other (custom)</SelectItem>
                  </SelectContent>
                </Select>
                {formData.role === "__custom" && (
                  <Input placeholder="Enter custom role" onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="mt-1" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input id="hireDate" type="date" value={formData.hireDate} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input id="yearsExperience" type="number" min="0" value={formData.yearsExperience} onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })} placeholder="e.g. 3" />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Training Hours (Current Year)</p>
              {formData.role && formData.role !== "__custom" && (
                <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1.5 mb-3">
                  {(() => {
                    const req = getTrainingRequirement(formFacilityType, formData.role);
                    return `Required: ${req.annualHours} annual hrs · ${req.preserviceHours} pre-service hrs`;
                  })()}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualTrainingHours">Annual Training Hours</Label>
                  <Input id="annualTrainingHours" type="number" min="0" value={formData.annualTrainingHours} onChange={(e) => setFormData({ ...formData, annualTrainingHours: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preserviceHours">Pre-service Hours</Label>
                  <Input id="preserviceHours" type="number" min="0" value={formData.preserviceHours} onChange={(e) => setFormData({ ...formData, preserviceHours: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createStaff.isPending || updateStaff.isPending}>
              {selectedStaff ? "Save Changes" : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Staff Member</DialogTitle>
            <DialogDescription>Are you sure you want to delete {selectedStaff?.firstName} {selectedStaff?.lastName}? This also deletes their certifications and cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteStaff.isPending}>
              {deleteStaff.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog — shown when free tier staff limit is reached */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-gray-900">Free Tier Limit Reached</DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed pt-1">
              You've reached the free tier limit of{" "}
              <strong>{dashboard?.freeTierUsage?.staffLimit ?? 12} staff members</strong>.
              Upgrade to Pro to add unlimited staff and locations.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 my-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pro Plan includes</p>
            {["Unlimited staff members", "Unlimited locations", "Advanced quality reports", "Priority support"].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-500 font-bold">✓</span> {f}
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>Maybe Later</Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={isUpgrading}
              onClick={async () => {
                try {
                  setIsUpgrading(true);
                  const token = await getToken();
                  const response = await fetch("/api/payments/checkout", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                  });
                  if (!response.ok) throw new Error("Failed to create checkout session");
                  const { url } = await response.json();
                  if (!url) throw new Error("No checkout URL");
                  window.location.href = url;
                } catch (error) {
                  console.error("Upgrade error:", error);
                  setIsUpgrading(false);
                  toast({
                    title: "Error",
                    description: "Failed to start checkout. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              {isUpgrading ? "Processing..." : "Upgrade to Pro – $49/month"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
