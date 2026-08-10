import { useGetDashboard, useListExpiringCertifications } from "@workspace/api-client-react";
import { useLocationContext } from "@/context/location-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusBadge } from "@/lib/utils/status";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, AlertTriangle, XOctagon, CheckCircle2, Building2 } from "lucide-react";

export default function Dashboard() {
  const { activeLocationId } = useLocationContext();
  
  const { data: dashboard, isLoading: isLoadingDashboard } = useGetDashboard(
    { locationId: activeLocationId || undefined },
  );

  const { data: expiringCerts, isLoading: isLoadingExpiring } = useListExpiringCertifications(
    { locationId: activeLocationId || undefined, daysAhead: 30 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of compliance and expiring items.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-blue-50 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Staff</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : dashboard?.totalStaff}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-green-50 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Compliant Staff</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : dashboard?.compliantStaff}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-amber-50 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                <h3 className="text-2xl font-bold text-amber-600">
                  {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : dashboard?.expiringSoonStaff}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-red-50 text-red-600">
                <XOctagon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expired Certs</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : dashboard?.expiredCertifications}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Location Compliance Breakdown</CardTitle>
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Staff</TableHead>
                    <TableHead className="text-right">Compliant</TableHead>
                    <TableHead className="text-right">Expiring</TableHead>
                    <TableHead className="text-right">Expired</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingDashboard ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : dashboard?.locationBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                        No location data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dashboard?.locationBreakdown.map((loc) => (
                      <TableRow key={loc.locationId}>
                        <TableCell className="font-medium text-gray-900">{loc.locationName}</TableCell>
                        <TableCell className="text-right text-gray-600">{loc.totalStaff}</TableCell>
                        <TableCell className="text-right">
                          <span className={loc.compliantStaff > 0 ? "text-green-600 font-medium" : "text-gray-400"}>
                            {loc.compliantStaff}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {loc.expiringSoonCount > 0 ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                              {loc.expiringSoonCount}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {loc.expiredCount > 0 ? (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                              {loc.expiredCount}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          <Card className="border-amber-200 overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Action Required
              </h3>
              <Link href="/certifications" className="text-xs font-medium text-amber-700 hover:text-amber-800">
                View All
              </Link>
            </div>
            <CardContent className="p-0">
              {isLoadingExpiring ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : expiringCerts?.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No certifications expiring soon.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {expiringCerts?.slice(0, 5).map((cert) => {
                    const badge = getStatusBadge(cert.status);
                    return (
                      <li key={cert.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {cert.staffFirstName} {cert.staffLastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{cert.certificationTypeName}</p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 ${badge.classes}`}>
                            {cert.daysUntilExpiration !== null && cert.daysUntilExpiration <= 0 
                              ? "Expired" 
                              : `${cert.daysUntilExpiration} days`}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {dashboard?.freeTierUsage && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">Free Tier Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">Staff Limit</span>
                    <span className="text-gray-500">{dashboard.freeTierUsage.staffCount} / {dashboard.freeTierUsage.staffLimit}</span>
                  </div>
                  <Progress 
                    value={(dashboard.freeTierUsage.staffCount / dashboard.freeTierUsage.staffLimit) * 100} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">Locations</span>
                    <span className="text-gray-500">{dashboard.freeTierUsage.locationCount} / {dashboard.freeTierUsage.locationLimit}</span>
                  </div>
                  <Progress 
                    value={(dashboard.freeTierUsage.locationCount / dashboard.freeTierUsage.locationLimit) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
