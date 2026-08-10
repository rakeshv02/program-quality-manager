import { useState } from "react";
import { 
  useListCertifications, 
  useListCertificationTypes,
  useListStaff,
  useCreateCertification, 
  useUpdateCertification, 
  useDeleteCertification,
  getListCertificationsQueryKey,
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
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Filter, Award } from "lucide-react";
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

export default function CertificationsPage() {
  const { activeLocationId } = useLocationContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    staffId: "",
    certificationTypeId: "",
    issuedDate: "",
    expirationDate: "",
    notes: "",
  });

  const queryParams = { 
    locationId: activeLocationId || undefined,
    ...(statusFilter !== 'all' ? { status: statusFilter as any } : {})
  };
  
  const { data: certs, isLoading: isLoadingCerts } = useListCertifications(queryParams);
  const { data: certTypes, isLoading: isLoadingTypes } = useListCertificationTypes();
  const { data: staffList } = useListStaff(
    { locationId: activeLocationId || undefined }, 
    { query: { enabled: !!activeLocationId, queryKey: getListStaffQueryKey({ locationId: activeLocationId || undefined }) }}
  );

  const createCert = useCreateCertification();
  const updateCert = useUpdateCertification();
  const deleteCert = useDeleteCertification();

  const handleOpenCreate = () => {
    setSelectedCert(null);
    setFormData({
      staffId: "",
      certificationTypeId: "",
      issuedDate: format(new Date(), 'yyyy-MM-dd'),
      expirationDate: "",
      notes: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cert: any) => {
    setSelectedCert(cert);
    setFormData({
      staffId: cert.staffId.toString(),
      certificationTypeId: cert.certificationTypeId.toString(),
      issuedDate: cert.issuedDate ? cert.issuedDate.split('T')[0] : "",
      expirationDate: cert.expirationDate ? cert.expirationDate.split('T')[0] : "",
      notes: cert.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (cert: any) => {
    setSelectedCert(cert);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.staffId || !formData.certificationTypeId) {
      toast({ title: "Error", description: "Please select a staff member and certification type", variant: "destructive" });
      return;
    }

    const payload = {
      staffId: parseInt(formData.staffId),
      certificationTypeId: parseInt(formData.certificationTypeId),
      issuedDate: formData.issuedDate || undefined,
      expirationDate: formData.expirationDate || undefined,
      notes: formData.notes || undefined,
    };

    if (selectedCert) {
      // For updates, we don't send staffId
      const { staffId, ...updatePayload } = payload;
      updateCert.mutate(
        { 
          id: selectedCert.id, 
          data: updatePayload
        },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Certification updated." });
            setIsFormOpen(false);
            queryClient.invalidateQueries({ queryKey: getListCertificationsQueryKey(queryParams) });
          }
        }
      );
    } else {
      createCert.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Certification added." });
            setIsFormOpen(false);
            queryClient.invalidateQueries({ queryKey: getListCertificationsQueryKey(queryParams) });
          }
        }
      );
    }
  };

  const handleDelete = () => {
    if (!selectedCert) return;
    
    deleteCert.mutate(
      { id: selectedCert.id },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Certification deleted." });
          setIsDeleteDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListCertificationsQueryKey(queryParams) });
        }
      }
    );
  };

  // Auto-calculate expiration date based on cert type validity months
  const handleTypeChange = (typeId: string) => {
    setFormData(prev => ({ ...prev, certificationTypeId: typeId }));
    
    if (formData.issuedDate && typeId) {
      const type = certTypes?.find(t => t.id.toString() === typeId);
      if (type && type.validityMonths) {
        const issueDate = new Date(formData.issuedDate);
        const expDate = new Date(issueDate);
        expDate.setMonth(expDate.getMonth() + type.validityMonths);
        setFormData(prev => ({ ...prev, expirationDate: format(expDate, 'yyyy-MM-dd') }));
      }
    }
  };

  const filteredCerts = certs?.filter(cert => {
    const searchLower = search.toLowerCase();
    const fullName = `${cert.staffFirstName} ${cert.staffLastName}`.toLowerCase();
    const typeName = cert.certificationTypeName.toLowerCase();
    return fullName.includes(searchLower) || typeName.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Certifications</h1>
          <p className="text-gray-500 mt-1">Track compliance records and expiration dates.</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={!activeLocationId} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Record Certification
        </Button>
      </div>

      {!activeLocationId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 flex items-center">
          <Filter className="w-5 h-5 mr-3 text-amber-500" />
          <p className="text-sm font-medium">Please select a specific location in the sidebar to add records.</p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              type="search" 
              placeholder="Search staff or cert type..." 
              className="pl-9 bg-white" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Name</TableHead>
              <TableHead>Certification</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingCerts ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredCerts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Award className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900">No records found</p>
                    <p className="text-sm">Try adjusting your filters or record a new certification.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCerts?.map((cert) => {
                const badge = getStatusBadge(cert.status);
                // Apply a subtle background tint based on status for critical states
                const rowClass = cert.status === 'expired' ? 'bg-red-50/30' : 
                                cert.status === 'expiring' ? 'bg-amber-50/30' : '';
                return (
                  <TableRow key={cert.id} className={`hover:bg-gray-50/50 ${rowClass}`}>
                    <TableCell className="font-medium text-gray-900">
                      {cert.staffFirstName} {cert.staffLastName}
                    </TableCell>
                    <TableCell className="text-gray-700">{cert.certificationTypeName}</TableCell>
                    <TableCell className="text-gray-600">
                      {cert.issuedDate ? format(new Date(cert.issuedDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      {cert.expirationDate ? format(new Date(cert.expirationDate), 'MMM d, yyyy') : 'No Expiry'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.classes}>
                        {cert.daysUntilExpiration !== null && cert.daysUntilExpiration > 0 && cert.status !== 'valid'
                          ? `Exp in ${cert.daysUntilExpiration}d`
                          : badge.label}
                      </Badge>
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
                          <DropdownMenuItem onClick={() => handleOpenEdit(cert)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDelete(cert)} className="text-red-600 focus:bg-red-50 focus:text-red-700">
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
            <DialogTitle>{selectedCert ? "Edit Certification" : "Record Certification"}</DialogTitle>
            <DialogDescription>
              Enter the certification details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staffId">Staff Member</Label>
              <Select 
                value={formData.staffId} 
                onValueChange={(v) => setFormData({...formData, staffId: v})}
                disabled={!!selectedCert} // Cannot change staff member on edit
              >
                <SelectTrigger id="staffId">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList?.map(staff => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.firstName} {staff.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="typeId">Certification Type</Label>
              <Select 
                value={formData.certificationTypeId} 
                onValueChange={handleTypeChange}
              >
                <SelectTrigger id="typeId">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTypes ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    certTypes?.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuedDate">Issue Date</Label>
                <Input 
                  id="issuedDate" 
                  type="date"
                  value={formData.issuedDate} 
                  onChange={(e) => {
                    setFormData({...formData, issuedDate: e.target.value});
                    // Recalculate expiry if type is already selected
                    if (formData.certificationTypeId) {
                       const type = certTypes?.find(t => t.id.toString() === formData.certificationTypeId);
                       if (type && type.validityMonths && e.target.value) {
                         const issueDate = new Date(e.target.value);
                         const expDate = new Date(issueDate);
                         expDate.setMonth(expDate.getMonth() + type.validityMonths);
                         setFormData(prev => ({ ...prev, issuedDate: e.target.value, expirationDate: format(expDate, 'yyyy-MM-dd') }));
                       }
                    }
                  }} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input 
                  id="expirationDate" 
                  type="date"
                  value={formData.expirationDate} 
                  onChange={(e) => setFormData({...formData, expirationDate: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input 
                id="notes" 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                placeholder="Certificate ID, issuer, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createCert.isPending || updateCert.isPending}>
              {selectedCert ? "Save Changes" : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Certification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {selectedCert?.certificationTypeName} record for {selectedCert?.staffFirstName} {selectedCert?.staffLastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCert.isPending}>
              {deleteCert.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
