import { useState } from "react";
import { 
  useListStaff, 
  useCreateStaffMember, 
  useUpdateStaffMember, 
  useDeleteStaffMember,
  getListStaffQueryKey
} from "@workspace/api-client-react";
import { useLocationContext } from "@/context/location-context";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusBadge } from "@/lib/utils/status";
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Filter, Users } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function StaffPage() {
  const { activeLocationId } = useLocationContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "Teacher",
    status: "active" as const,
    hireDate: "",
  });

  const queryParams = { 
    locationId: activeLocationId || undefined,
    ...(statusFilter !== 'all' ? { status: statusFilter as any } : {})
  };
  
  const { data: staff, isLoading } = useListStaff(queryParams);

  const createStaff = useCreateStaffMember();
  const updateStaff = useUpdateStaffMember();
  const deleteStaff = useDeleteStaffMember();

  const handleOpenCreate = () => {
    setSelectedStaff(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "Teacher",
      status: "active",
      hireDate: format(new Date(), 'yyyy-MM-dd'),
    });
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
      hireDate: member.hireDate ? member.hireDate.split('T')[0] : "",
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
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (selectedStaff) {
      updateStaff.mutate(
        { 
          id: selectedStaff.id, 
          data: { ...formData, locationId: activeLocationId }
        },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Staff member updated." });
            setIsFormOpen(false);
            queryClient.invalidateQueries({ queryKey: getListStaffQueryKey(queryParams) });
          }
        }
      );
    } else {
      createStaff.mutate(
        { 
          data: { ...formData, locationId: activeLocationId } 
        },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Staff member added." });
            setIsFormOpen(false);
            queryClient.invalidateQueries({ queryKey: getListStaffQueryKey(queryParams) });
          }
        }
      );
    }
  };

  const handleDelete = () => {
    if (!selectedStaff) return;
    
    deleteStaff.mutate(
      { id: selectedStaff.id },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Staff member deleted." });
          setIsDeleteDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey(queryParams) });
        }
      }
    );
  };

  const filteredStaff = staff?.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage personnel and their compliance status.</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={!activeLocationId} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {!activeLocationId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 flex items-center">
          <Filter className="w-5 h-5 mr-3 text-amber-500" />
          <p className="text-sm font-medium">Please select a specific location in the sidebar to add or manage staff.</p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              type="search" 
              placeholder="Search staff..." 
              className="pl-9 bg-white" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredStaff?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900">No staff found</p>
                    <p className="text-sm">Try adjusting your filters or add a new staff member.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff?.map((member) => {
                const badge = getStatusBadge(member.status);
                return (
                  <TableRow key={member.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{member.firstName} {member.lastName}</span>
                        {member.email && <span className="text-xs text-gray-500">{member.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{member.role}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.classes}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {member.hireDate ? format(new Date(member.hireDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(member)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDelete(member)} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
            <DialogDescription>
              {selectedStaff ? "Update the details for this staff member." : "Enter the details for the new staff member."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName} 
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={formData.lastName} 
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input 
                  id="role" 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: any) => setFormData({...formData, status: v})}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input 
                id="hireDate" 
                type="date"
                value={formData.hireDate} 
                onChange={(e) => setFormData({...formData, hireDate: e.target.value})} 
              />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStaff?.firstName} {selectedStaff?.lastName}? This action cannot be undone and will also delete their certifications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteStaff.isPending}>
              {deleteStaff.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
