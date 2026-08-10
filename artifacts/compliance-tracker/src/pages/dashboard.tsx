import { useGetDashboard, useListExpiringCertifications, useListLocations } from "@workspace/api-client-react";
import { useLocationContext } from "@/context/location-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusBadge } from "@/lib/utils/status";
import {
  FACILITY_META, ROLE_OPTIONS, getTrainingRequirement, type FacilityType,
} from "@/lib/compliance-rules";
import { format } from "date-fns";
import { Link } from "wouter";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, AlertTriangle, XOctagon, CheckCircle2, Building2,
  BookOpen, GraduationCap, Zap, TrendingUp,
} from "lucide-react";
import { FacilityTypeSelector } from "@/components/facility-type-selector";

// ─── Free Tier Usage Card ──────────────────────────────────────────────────────

type FreeTierUsage = {
  staffCount: number;
  staffLimit: number;
  locationCount: number;
  locationLimit: number;
};

function FreeTierCard({ usage }: { usage: FreeTierUsage }) {
  const staffPct = Math.min((usage.staffCount / usage.staffLimit) * 100, 100);
  const locPct   = Math.min((usage.locationCount / usage.locationLimit) * 100, 100);
  const staffAtLimit  = usage.staffCount  >= usage.staffLimit;
  const locAtLimit    = usage.locationCount >= usage.locationLimit;
  const staffWarning  = !staffAtLimit && staffPct >= 75;
  const locWarning    = !locAtLimit   && locPct   >= 75;
  const anyAtLimit    = staffAtLimit  || locAtLimit;
  const anyWarning    = staffWarning  || locWarning;

  function barColor(atLimit: boolean, warning: boolean) {
    if (atLimit)  return "bg-red-500";
    if (warning)  return "bg-amber-400";
    return "bg-emerald-500";
  }

  function countColor(atLimit: boolean, warning: boolean) {
    if (atLimit)  return "text-red-600 font-bold";
    if (warning)  return "text-amber-600 font-semibold";
    return "text-gray-500";
  }

  return (
    <Card className={`overflow-hidden border-2 transition-colors ${
      anyAtLimit ? "border-red-200" : anyWarning ? "border-amber-200" : "border-gray-100"
    }`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        anyAtLimit ? "bg-red-50 border-red-100" : anyWarning ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"
      }`}>
        <h3 className={`text-sm font-semibold flex items-center gap-2 ${
          anyAtLimit ? "text-red-800" : anyWarning ? "text-amber-800" : "text-gray-700"
        }`}>
          {anyAtLimit ? <AlertTriangle className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
          Free Plan Usage
        </h3>
        <Link
          href="/settings"
          className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Zap className="w-3 h-3" /> Upgrade
        </Link>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Staff */}
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-sm font-medium text-gray-800">Staff Members</span>
            <span className={`text-sm tabular-nums ${countColor(staffAtLimit, staffWarning)}`}>
              {usage.staffCount} / {usage.staffLimit}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor(staffAtLimit, staffWarning)}`}
              style={{ width: `${staffPct}%` }}
            />
          </div>
          {staffAtLimit && (
            <p className="text-xs text-red-600 mt-1.5 font-medium">
              You've reached the 12-staff limit.{" "}
              <Link href="/settings" className="underline underline-offset-2 hover:text-red-700">Upgrade to Pro</Link>
              {" "}for unlimited staff.
            </p>
          )}
          {staffWarning && (
            <p className="text-xs text-amber-700 mt-1.5">
              You have {usage.staffCount}/{usage.staffLimit} staff. Upgrade to add more.
            </p>
          )}
        </div>

        {/* Locations */}
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-sm font-medium text-gray-800">Locations</span>
            <span className={`text-sm tabular-nums ${countColor(locAtLimit, locWarning)}`}>
              {usage.locationCount} / {usage.locationLimit}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor(locAtLimit, locWarning)}`}
              style={{ width: `${locPct}%` }}
            />
          </div>
          {locAtLimit && (
            <p className="text-xs text-red-600 mt-1.5 font-medium">
              You've reached the 2-location limit.{" "}
              <Link href="/settings" className="underline underline-offset-2 hover:text-red-700">Upgrade to Pro</Link>
              {" "}for unlimited locations.
            </p>
          )}
          {locWarning && (
            <p className="text-xs text-amber-700 mt-1.5">
              You have {usage.locationCount}/{usage.locationLimit} locations. Upgrade to add more.
            </p>
          )}
        </div>

        {anyAtLimit && (
          <div className="pt-1 border-t border-red-100">
            <Link
              href="/settings"
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg py-2 transition-colors"
            >
              <Zap className="w-4 h-4" /> Upgrade to Pro — Remove Limits
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { activeLocationId, activeFacilityType, setActiveFacilityType } = useLocationContext();

  const { data: dashboard, isLoading: isLoadingDashboard } = useGetDashboard(
    { locationId: activeLocationId || undefined },
  );
  const { data: expiringCerts, isLoading: isLoadingExpiring } = useListExpiringCertifications(
    { locationId: activeLocationId || undefined, daysAhead: 30 }
  );
  const { data: locations = [] } = useListLocations();

  function getLocFacilityType(locationId: number): FacilityType {
    const loc = locations.find(l => l.id === locationId);
    return (loc?.facilityType as FacilityType) || "child_care_center";
  }

  return (
    <div className="space-y-6">
      {/* ── Facility Type Selector — always first ── */}
      <FacilityTypeSelector
        activeFacilityType={activeFacilityType}
        setActiveFacilityType={setActiveFacilityType}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Certification compliance overview for your facilities.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-blue-50 text-blue-600"><Users className="w-6 h-6" /></div>
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
              <div className="p-3 rounded-md bg-green-50 text-green-600"><CheckCircle2 className="w-6 h-6" /></div>
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
              <div className="p-3 rounded-md bg-amber-50 text-amber-600"><AlertTriangle className="w-6 h-6" /></div>
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
              <div className="p-3 rounded-md bg-red-50 text-red-600"><XOctagon className="w-6 h-6" /></div>
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
        {/* Location Breakdown */}
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
                    <TableHead>Facility Type</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : dashboard?.locationBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">No location data available.</TableCell>
                    </TableRow>
                  ) : (
                    dashboard?.locationBreakdown.map((loc) => {
                      const ft = getLocFacilityType(loc.locationId);
                      const meta = FACILITY_META[ft];
                      return (
                        <TableRow key={loc.locationId}>
                          <TableCell className="font-medium text-gray-900">{loc.locationName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {meta?.tacLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-gray-600">{loc.totalStaff}</TableCell>
                          <TableCell className="text-right">
                            <span className={loc.compliantStaff > 0 ? "text-green-600 font-medium" : "text-gray-400"}>{loc.compliantStaff}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {loc.expiringSoonCount > 0
                              ? <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{loc.expiringSoonCount}</Badge>
                              : <span className="text-gray-400">0</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {loc.expiredCount > 0
                              ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{loc.expiredCount}</Badge>
                              : <span className="text-gray-400">0</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Training Requirements Reference for Selected Facility Type */}
          <Card className="border-gray-100">
            <CardHeader className="pb-3 border-b bg-gray-50/60">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Training Hours — {FACILITY_META[activeFacilityType].tacLabel} ({FACILITY_META[activeFacilityType].label})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/40">
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Annual Hrs</TableHead>
                    <TableHead className="text-right">Pre-service Hrs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLE_OPTIONS[activeFacilityType].map((role) => {
                    const req = getTrainingRequirement(activeFacilityType, role);
                    return (
                      <TableRow key={role}>
                        <TableCell className="font-medium text-gray-800">{role}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-gray-900">{req.annualHours}</span>
                          <span className="text-gray-400 text-xs ml-1">hrs</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-gray-900">{req.preserviceHours}</span>
                          <span className="text-gray-400 text-xs ml-1">hrs</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {!FACILITY_META[activeFacilityType].participatesTRS && (
                <div className="px-4 py-2 bg-violet-50 border-t border-violet-100 text-xs text-violet-700 font-medium">
                  School-age programs (TAC §744) do not participate in Texas Rising Star. Quality is assessed through the school-age PQA framework.
                </div>
              )}
              {FACILITY_META[activeFacilityType].participatesTRS && (
                <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 font-medium flex items-center gap-1.5">
                  <span>⭐</span> This facility type is eligible for Texas Rising Star (TRS) certification.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          <Card className="border-amber-200 overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />Action Required
              </h3>
              <Link href="/certifications" className="text-xs font-medium text-amber-700 hover:text-amber-800">View All</Link>
            </div>
            <CardContent className="p-0">
              {isLoadingExpiring ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
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
                            <p className="text-sm font-medium text-gray-900 truncate">{cert.staffFirstName} {cert.staffLastName}</p>
                            <p className="text-xs text-gray-500 truncate">{cert.certificationTypeName}</p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 ${badge.classes}`}>
                            {cert.daysUntilExpiration != null && cert.daysUntilExpiration <= 0 ? "Expired" : `${cert.daysUntilExpiration ?? "?"} days`}
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
            <FreeTierCard usage={dashboard.freeTierUsage} />
          )}
        </div>
      </div>
    </div>
  );
}
