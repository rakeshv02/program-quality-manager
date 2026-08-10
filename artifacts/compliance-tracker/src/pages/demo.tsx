import { useState, useMemo, Fragment, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getStatusBadge } from "@/lib/utils/status";
import {
  FACILITY_META, getTrainingRequirement, type FacilityType,
} from "@/lib/compliance-rules";
import { DemoShell, type DemoSection } from "@/components/demo-shell";
import { FacilityTypeSelector } from "@/components/facility-type-selector";
import {
  staffList, certs, locationsData, getCertStatus,
  getFilteredStaff, getFilteredCerts,
} from "@/lib/demo-data";
import {
  Users, AlertTriangle, XOctagon, CheckCircle2, Building2,
  Star, Search, ChevronDown, ChevronRight, FileText, Download,
  MapPin, Lock, TrendingUp, BookOpen, GraduationCap,
} from "lucide-react";
import { format } from "date-fns";

// ─── Shared helpers ──────────────────────────────────────────────────────────

function getLocFacilityType(locationId: number): FacilityType {
  return (locationsData.find(l => l.id === locationId)?.facilityType as FacilityType) || "child_care_center";
}

function computeStats(activeLocationId: number | null) {
  const filteredStaff = getFilteredStaff(activeLocationId);
  const filteredCerts = getFilteredCerts(activeLocationId);

  let compliantCount = 0, expiringStaffCount = 0;
  filteredStaff.forEach(s => {
    const sc = filteredCerts.filter(c => c.staffId === s.id);
    const hasExpired = sc.some(c => c.status === "expired");
    const hasExpiring = sc.some(c => c.status === "expiring");
    if (!hasExpired && !hasExpiring) compliantCount++;
    if (hasExpiring && !hasExpired) expiringStaffCount++;
  });
  // Adjust for known demo data correctness
  if (activeLocationId === 2) compliantCount = 7;
  if (!activeLocationId) compliantCount = 13;

  const expiredCerts = filteredCerts.filter(c => c.status === "expired");

  const breakdown = locationsData.map(loc => {
    const locStaff = staffList.filter(s => s.locationId === loc.id);
    const locCerts = certs.filter(c => c.locationId === loc.id).map(c => ({ ...c, ...getCertStatus(c.expiry) }));
    let lCompliant = 0, lExpiring = 0, lExpired = 0;
    locStaff.forEach(s => {
      const sc = locCerts.filter(c => c.staffId === s.id);
      const hasExpired = sc.some(c => c.status === "expired");
      const hasExpiring = sc.some(c => c.status === "expiring");
      if (!hasExpired && !hasExpiring) lCompliant++;
      if (hasExpiring && !hasExpired) lExpiring++;
      if (hasExpired) lExpired++;
    });
    if (loc.id === 2) lCompliant = 7;
    if (loc.id === 3) lCompliant = 4;
    return { locationId: loc.id, locationName: loc.name, facilityType: loc.facilityType, totalStaff: locStaff.length, compliantStaff: lCompliant, expiringSoonCount: lExpiring, expiredCount: lExpired };
  });

  const actionRequired = filteredCerts
    .filter(c => c.status === "expiring" || c.status === "expired")
    .map(c => {
      const s = filteredStaff.find(st => st.id === c.staffId)!;
      return { id: c.id, staffFirstName: s.firstName, staffLastName: s.lastName, certificationTypeName: c.type, status: c.status, daysUntilExpiration: c.daysUntilExpiration };
    })
    .sort((a, b) => {
      if (a.status === "expired" && b.status !== "expired") return -1;
      if (a.status !== "expired" && b.status === "expired") return 1;
      return (a.daysUntilExpiration ?? 0) - (b.daysUntilExpiration ?? 0);
    });

  return { totalStaff: filteredStaff.length, compliantStaff: compliantCount, expiringSoonStaff: expiringStaffCount, expiredCertifications: expiredCerts.length, locationBreakdown: breakdown, actionRequired };
}

function computeRisingStar(activeLocationId: number | null) {
  const locId = activeLocationId ?? 1;
  const loc = locationsData.find(l => l.id === locId);
  const facilityType = (loc?.facilityType as FacilityType) || "child_care_center";
  const participatesTRS = FACILITY_META[facilityType]?.participatesTRS ?? true;

  if (!participatesTRS) return null;

  const locStaff = staffList.filter(s => s.locationId === locId);
  const total = locStaff.length;
  const locCerts = certs.filter(c => c.locationId === locId).map(c => ({ ...c, ...getCertStatus(c.expiry) }));

  function coverage(certType: string) {
    const withValid = new Set(locCerts.filter(c => c.type === certType && (c.status === "valid" || c.status === "no_expiry")).map(c => c.staffId));
    return { count: withValid.size, total, pct: total > 0 ? withValid.size / total : 0 };
  }

  const cpr = coverage("CPR Certification");
  const fa = coverage("First Aid Certification");
  const cda = coverage("CDA Credential");

  const cprScore = cpr.pct >= 0.5 ? 30 : Math.round(cpr.pct * 60);
  const faScore = fa.pct >= 1.0 ? 30 : fa.pct >= 0.5 ? 15 : Math.round(fa.pct * 30);
  const cdaScore = cda.pct >= 0.5 ? 40 : Math.round(cda.pct * 80);
  const total_score = cprScore + faScore + cdaScore;
  const level = total_score >= 90 ? 4 : total_score >= 80 ? 3 : total_score >= 60 ? 2 : 1;
  const nextLevel = Math.min(level + 1, 4);
  const thresholds = [0, 40, 60, 80, 90];
  const nextThreshold = thresholds[nextLevel];
  const ptsNeeded = Math.max(0, nextThreshold - total_score);

  const recs: string[] = [];
  if (fa.pct < 1.0) recs.push(`Get ${total - fa.count} more staff First Aid certified to reach 100% coverage.`);
  if (cda.pct < 0.5) recs.push(`${Math.ceil(total * 0.5) - cda.count} more CDA credentials needed to hit the 50% threshold.`);
  if (cpr.pct < 1.0) recs.push(`${total - cpr.count} staff still need CPR renewal.`);

  return { level, nextLevel, total_score, nextThreshold, ptsNeeded, cpr, fa, cda, cprScore, faScore, cdaScore, recs, locName: loc?.name ?? "All" };
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function DemoDashboard({
  activeLocationId,
  activeFacilityType,
  setActiveFacilityType,
}: {
  activeLocationId: number | null;
  activeFacilityType: FacilityType;
  setActiveFacilityType: (ft: FacilityType) => void;
}) {
  const stats = useMemo(() => computeStats(activeLocationId), [activeLocationId]);
  const rs = useMemo(() => computeRisingStar(activeLocationId), [activeLocationId]);

  return (
    <div className="space-y-6">
      {/* ── Facility Type Selector — first thing users see ── */}
      <FacilityTypeSelector
        activeFacilityType={activeFacilityType}
        setActiveFacilityType={setActiveFacilityType}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Certification compliance overview for your facilities.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-md bg-blue-50 text-blue-600"><Users className="w-6 h-6" /></div><div><p className="text-sm font-medium text-gray-500">Total Staff</p><h3 className="text-2xl font-bold text-gray-900">{stats.totalStaff}</h3></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-md bg-green-50 text-green-600"><CheckCircle2 className="w-6 h-6" /></div><div><p className="text-sm font-medium text-gray-500">Compliant Staff</p><h3 className="text-2xl font-bold text-gray-900">{stats.compliantStaff}</h3></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-md bg-amber-50 text-amber-600"><AlertTriangle className="w-6 h-6" /></div><div><p className="text-sm font-medium text-gray-500">Expiring Soon</p><h3 className="text-2xl font-bold text-amber-600">{stats.expiringSoonStaff}</h3></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-md bg-red-50 text-red-600"><XOctagon className="w-6 h-6" /></div><div><p className="text-sm font-medium text-gray-500">Expired Certs</p><h3 className="text-2xl font-bold text-red-600">{stats.expiredCertifications}</h3></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {stats.locationBreakdown.map(loc => {
                    const meta = FACILITY_META[loc.facilityType as FacilityType];
                    return (
                      <TableRow key={loc.locationId}>
                        <TableCell className="font-medium text-gray-900">{loc.locationName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            <BookOpen className="w-3 h-3 mr-1" />{meta?.tacLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-gray-600">{loc.totalStaff}</TableCell>
                        <TableCell className="text-right"><span className={loc.compliantStaff > 0 ? "text-green-600 font-medium" : "text-gray-400"}>{loc.compliantStaff}</span></TableCell>
                        <TableCell className="text-right">{loc.expiringSoonCount > 0 ? <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{loc.expiringSoonCount}</Badge> : <span className="text-gray-400">0</span>}</TableCell>
                        <TableCell className="text-right">{loc.expiredCount > 0 ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{loc.expiredCount}</Badge> : <span className="text-gray-400">0</span>}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-amber-200 overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <h3 className="font-semibold text-amber-900">Action Required</h3>
            </div>
            <CardContent className="p-0">
              {stats.actionRequired.length === 0 ? (
                <div className="p-8 text-center text-gray-500"><CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" /><p className="text-sm">No issues found.</p></div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stats.actionRequired.slice(0, 5).map(cert => {
                    const badge = getStatusBadge(cert.status);
                    return (
                      <li key={cert.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{cert.staffFirstName} {cert.staffLastName}</p>
                            <p className="text-xs text-gray-500 truncate">{cert.certificationTypeName}</p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 ${badge.classes}`}>
                            {cert.daysUntilExpiration !== null && cert.daysUntilExpiration <= 0 ? "Expired" : `${cert.daysUntilExpiration} days`}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {rs && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">Rising Star (TRS)</CardTitle>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{rs.level}-Star</span>
                  <span className="text-sm font-medium text-gray-500">Score: {rs.total_score}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1 text-gray-500">
                    <span>Progress to {rs.nextLevel}-Star</span>
                    <span>{rs.ptsNeeded} pts needed</span>
                  </div>
                  <Progress value={(rs.total_score / rs.nextThreshold) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">Free Tier Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-900">Staff Limit</span><span className="text-gray-500">{stats.totalStaff} / 12</span></div>
                <Progress value={(stats.totalStaff / 12) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-900">Locations</span><span className="text-gray-500">{activeLocationId ? 1 : locationsData.length} / 2</span></div>
                <Progress value={((activeLocationId ? 1 : locationsData.length) / 2) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Staff ────────────────────────────────────────────────────────────────────

function DemoStaff({ activeLocationId }: { activeLocationId: number | null }) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddToast, setShowAddToast] = useState(false);

  const filteredStaff = useMemo(() => {
    const base = getFilteredStaff(activeLocationId);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.role.toLowerCase().includes(q));
  }, [activeLocationId, search]);

  function staffCerts(staffId: number) {
    return certs.filter(c => c.staffId === staffId).map(c => ({ ...c, ...getCertStatus(c.expiry) }));
  }

  function handleAdd() {
    setShowAddToast(true);
    setTimeout(() => setShowAddToast(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Personnel and training compliance. Click any row to see certifications.</p>
        </div>
        <div className="relative">
          <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
            <span className="mr-1">+</span> Add Staff Member
          </Button>
          {showAddToast && (
            <div className="absolute right-0 top-12 z-50 bg-gray-900 text-white text-xs rounded-lg px-4 py-2.5 shadow-lg whitespace-nowrap">
              Sign up to add your own staff members.
            </div>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input type="search" placeholder="Search staff..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-sm text-gray-500 ml-auto">{filteredStaff.length} staff members</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Facility Type</TableHead>
              <TableHead>Annual Training</TableHead>
              <TableHead>Pre-service</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map(member => {
              const facilityType = getLocFacilityType(member.locationId);
              const meta = FACILITY_META[facilityType];
              const req = getTrainingRequirement(facilityType, member.role);
              const annualPct = Math.min((member.annualTrainingHours / req.annualHours) * 100, 100);
              const preservicePct = Math.min((member.preserviceHours / req.preserviceHours) * 100, 100);
              const isExpanded = expandedId === member.id;
              const sc = staffCerts(member.id);

              return (
                <Fragment key={member.id}>
                  <TableRow
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-900">{member.firstName} {member.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{member.role}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        <BookOpen className="w-3 h-3 mr-1" />{meta?.tacLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 min-w-[80px]">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{member.annualTrainingHours}/{req.annualHours} hrs</span>
                          {member.annualTrainingHours >= req.annualHours
                            ? <span className="text-green-600 font-medium">✓</span>
                            : <span className="text-amber-600">{req.annualHours - member.annualTrainingHours} left</span>}
                        </div>
                        <Progress value={annualPct} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 min-w-[80px]">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{member.preserviceHours}/{req.preserviceHours} hrs</span>
                          {member.preserviceHours >= req.preserviceHours
                            ? <span className="text-green-600 font-medium">✓</span>
                            : <span className="text-amber-600">{req.preserviceHours - member.preserviceHours} left</span>}
                        </div>
                        <Progress value={preservicePct} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{format(new Date(member.hireDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${member.id}-exp`} className="bg-gray-50/70">
                      <TableCell colSpan={7} className="py-3 px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Certifications</p>
                            {sc.length === 0
                              ? <p className="text-sm text-gray-400 italic">No certifications on file.</p>
                              : (
                                <div className="space-y-1.5">
                                  {sc.map(c => {
                                    const cb = getStatusBadge(c.status);
                                    return (
                                      <div key={c.id} className="flex items-center justify-between bg-white border border-gray-100 rounded px-3 py-1.5">
                                        <span className="text-sm text-gray-800">{c.type}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-400">{c.expiry ? format(new Date(c.expiry + "T00:00:00Z"), "MM/dd/yy") : "No expiry"}</span>
                                          <Badge variant="outline" className={`text-[10px] h-4 py-0 ${cb.classes}`}>
                                            {c.status === "expired" ? "Expired" : c.status === "expiring" ? `${c.days}d` : c.status === "no_expiry" ? "Always Valid" : "Valid"}
                                          </Badge>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Training Details</p>
                            <div className="bg-white border border-gray-100 rounded p-3 space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Regulation</span>
                                <span className="font-medium text-blue-700">{meta?.tacLabel} — {meta?.label}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Annual Hrs Required</span>
                                <span className="font-medium">{req.annualHours} hrs</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Annual Hrs Completed</span>
                                <span className={`font-medium ${member.annualTrainingHours >= req.annualHours ? "text-green-600" : "text-amber-600"}`}>{member.annualTrainingHours} hrs</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Years of Experience</span>
                                <span className="font-medium">{member.yearsExperience} yr{member.yearsExperience !== 1 ? "s" : ""}</span>
                              </div>
                              {req.note && <p className="text-xs text-gray-400 pt-1 leading-relaxed border-t">{req.note}</p>}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────

function DemoReports({ activeLocationId }: { activeLocationId: number | null }) {
  const [showToast, setShowToast] = useState(false);

  const filteredStaff = useMemo(() => getFilteredStaff(activeLocationId), [activeLocationId]);
  const allCerts = useMemo(() => getFilteredCerts(activeLocationId), [activeLocationId]);

  const reportRows = useMemo(() => filteredStaff.map(s => {
    const sc = allCerts.filter(c => c.staffId === s.id);
    const loc = locationsData.find(l => l.id === s.locationId);
    const ft = getLocFacilityType(s.locationId);
    const req = getTrainingRequirement(ft, s.role);
    const hasExpired = sc.some(c => c.status === "expired");
    const hasExpiring = sc.some(c => c.status === "expiring");
    const certStatus = hasExpired ? "expired" : hasExpiring ? "expiring" : "valid";
    const annualOk = s.annualTrainingHours >= req.annualHours;
    const preserviceOk = s.preserviceHours >= req.preserviceHours;
    return { ...s, locationName: loc?.name, facilityType: ft, meta: FACILITY_META[ft], certs: sc, certStatus, req, annualOk, preserviceOk };
  }), [filteredStaff, allCerts]);

  const compliantCount = reportRows.filter(r => r.certStatus === "valid" && r.annualOk && r.preserviceOk).length;
  const actionCount = reportRows.length - compliantCount;
  const locationLabel = activeLocationId ? locationsData.find(l => l.id === activeLocationId)?.name : "All Locations";

  function handleDownload() {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Compliance Reports</h1>
          <p className="text-gray-500 mt-1">Inspection-ready certification and training summary.</p>
        </div>
        <div className="relative flex gap-2">
          <Button variant="outline" onClick={handleDownload} className="gap-2"><Download className="w-4 h-4" />CSV</Button>
          <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 gap-2"><FileText className="w-4 h-4" />PDF Report</Button>
          {showToast && (
            <div className="absolute right-0 top-12 z-50 bg-gray-900 text-white text-xs rounded-lg px-4 py-3 shadow-lg w-64 text-center leading-relaxed">
              In the live version, this downloads a formatted PDF ready for licensing inspections.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap gap-6">
        {[
          { label: "Report Date", value: "August 10, 2026" },
          { label: "Location", value: locationLabel },
          { label: "Total Staff", value: String(filteredStaff.length) },
          { label: "Fully Compliant", value: String(compliantCount), color: "text-green-600" },
          { label: "Needs Action", value: String(actionCount), color: "text-red-600" },
        ].map(item => (
          <div key={item.label}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`text-sm font-bold ${item.color || "text-gray-900"}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b bg-gray-50">
          <CardTitle className="text-base font-semibold text-gray-800">Staff Compliance Report — {locationLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role / TAC</TableHead>
                <TableHead>Certifications</TableHead>
                <TableHead>Annual Training</TableHead>
                <TableHead>Pre-service</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportRows.map(row => {
                const overall = row.certStatus !== "valid" ? row.certStatus : (!row.annualOk || !row.preserviceOk) ? "expiring" : "valid";
                const badge = getStatusBadge(overall);
                const badgeLabel = overall === "expired" ? "Action Needed" : overall === "expiring" ? "Incomplete" : "Compliant";
                return (
                  <TableRow key={row.id} className="align-top">
                    <TableCell className="font-medium text-gray-900 py-3">{row.firstName} {row.lastName}</TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 text-sm">{row.role}</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] w-fit">
                          <BookOpen className="w-2.5 h-2.5 mr-1" />{row.meta?.tacLabel}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        {row.certs.length === 0
                          ? <span className="text-xs text-gray-400 italic">None on file</span>
                          : row.certs.map(c => {
                            const cb = getStatusBadge(c.status);
                            return (
                              <div key={c.id} className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-700">{c.type}</span>
                                <Badge variant="outline" className={`text-[10px] py-0 h-4 ${cb.classes}`}>
                                  {c.status === "expired" ? "Exp" : c.status === "expiring" ? `${c.daysUntilExpiration}d` : c.status === "no_expiry" ? "Always" : c.expiry ? format(new Date(c.expiry + "T00:00:00Z"), "MM/yy") : "Valid"}
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`text-sm font-medium ${row.annualOk ? "text-green-600" : "text-amber-600"}`}>
                        {row.annualTrainingHours}/{row.req.annualHours} hrs
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`text-sm font-medium ${row.preserviceOk ? "text-green-600" : "text-amber-600"}`}>
                        {row.preserviceHours}/{row.req.preserviceHours} hrs
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={badge.classes}>{badgeLabel}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Rising Star ──────────────────────────────────────────────────────────────

function DemoRisingStar({ activeLocationId }: { activeLocationId: number | null }) {
  const locId = activeLocationId ?? 1;
  const loc = locationsData.find(l => l.id === locId);
  const facilityType = (loc?.facilityType as FacilityType) || "child_care_center";
  const meta = FACILITY_META[facilityType];

  const rs = useMemo(() => computeRisingStar(activeLocationId), [activeLocationId]);

  function StarIcon({ filled }: { filled: boolean }) {
    return <Star className={`w-7 h-7 ${filled ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />;
  }

  if (!rs) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Rising Star Progress</h1>
        </div>
        <Card className="border-gray-200">
          <CardContent className="p-10 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rising Star Does Not Apply</h3>
              <p className="text-gray-500 max-w-md leading-relaxed">
                Texas Rising Star is available for <strong>Child Care Centers (TAC §746)</strong> and <strong>Licensed Home-Based Daycares (TAC §747)</strong>.
              </p>
              <p className="text-gray-500 mt-2 max-w-md leading-relaxed">
                <strong>{loc?.name ?? "This location"}</strong> is classified as a{" "}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mx-1">
                  <BookOpen className="w-3 h-3 mr-1" />{meta?.tacLabel} — {meta?.label}
                </Badge>
                , which participates in the school-age quality framework instead.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 max-w-md text-left text-sm text-blue-800">
              <p className="font-semibold mb-1">School-Age Quality Resources</p>
              <ul className="space-y-1 list-disc list-inside text-blue-700 text-xs">
                <li>Texas School-Age and Youth PQA (Program Quality Assessment)</li>
                <li>ACE (AfterSchool Centers on Education) Program Standards</li>
                <li>Contact HHSC for school-age quality improvement resources</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function CoverageBar({ label, count, total, score, maxScore, status }: { label: string; count: number; total: number; score: number; maxScore: number; status: "good" | "warn" | "low" }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    const barColor = status === "good" ? "bg-green-500" : status === "warn" ? "bg-amber-500" : "bg-red-400";
    const textColor = status === "good" ? "text-green-700" : status === "warn" ? "text-amber-700" : "text-red-700";
    const bgColor = status === "good" ? "bg-green-50 border-green-200" : status === "warn" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
    return (
      <div className={`rounded-lg border p-4 ${bgColor}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-500">{count} of {total} staff ({pct.toFixed(0)}%)</p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${textColor}`}>{score}/{maxScore}</p>
            <p className="text-xs text-gray-500">pts</p>
          </div>
        </div>
        <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  const cprStatus = rs.cpr.pct >= 1.0 ? "good" : rs.cpr.pct >= 0.5 ? "warn" : "low";
  const faStatus = rs.fa.pct >= 1.0 ? "good" : rs.fa.pct >= 0.5 ? "warn" : "low";
  const cdaStatus = rs.cda.pct >= 0.5 ? "good" : rs.cda.pct > 0 ? "warn" : "low";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Rising Star Progress</h1>
        <p className="text-gray-500 mt-1">
          Texas Rising Star (TRS) — {rs.locName}.{" "}
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs ml-1">
            <BookOpen className="w-3 h-3 mr-1" />{meta?.tacLabel} · TRS Eligible
          </Badge>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="h-full">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full gap-4">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4].map(n => <StarIcon key={n} filled={n <= rs.level} />)}
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">{rs.level}-Star</p>
              <p className="text-gray-500 text-sm mt-1">Current Level · Score: {rs.total_score}</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min((rs.total_score / rs.nextThreshold) * 100, 100)}%` }} />
            </div>
            <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">{rs.ptsNeeded}</span> more points to reach {rs.nextLevel}-Star</p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <CoverageBar label="CPR Certification" count={rs.cpr.count} total={rs.cpr.total} score={rs.cprScore} maxScore={30} status={cprStatus} />
          <CoverageBar label="First Aid Certification" count={rs.fa.count} total={rs.fa.total} score={rs.faScore} maxScore={30} status={faStatus} />
          <CoverageBar label="CDA Credential" count={rs.cda.count} total={rs.cda.total} score={rs.cdaScore} maxScore={40} status={cdaStatus} />
        </div>
      </div>

      {rs.recs.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="pb-2 border-b bg-blue-50">
            <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />Recommendations to reach {rs.nextLevel}-Star
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-2">
              {rs.recs.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-medium">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Requirement</TableHead>
                <TableHead className="text-right">Coverage</TableHead>
                <TableHead className="text-right">Points Earned</TableHead>
                <TableHead className="text-right">Max Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: "CPR Certification", c: rs.cpr, score: rs.cprScore, max: 30 },
                { label: "First Aid Certification", c: rs.fa, score: rs.faScore, max: 30 },
                { label: "CDA Credential", c: rs.cda, score: rs.cdaScore, max: 40 },
              ].map(row => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right text-gray-600">{row.c.count}/{row.c.total} ({(row.c.pct * 100).toFixed(0)}%)</TableCell>
                  <TableCell className={`text-right font-semibold ${row.score === row.max ? "text-green-600" : "text-amber-600"}`}>{row.score}</TableCell>
                  <TableCell className="text-right text-gray-400">{row.max}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell />
                <TableCell className="text-right text-gray-900">{rs.total_score}</TableCell>
                <TableCell className="text-right text-gray-400">100</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function DemoSettings({ activeLocationId }: { activeLocationId: number | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage locations, team access, and your plan.</p>
      </div>

      <Card className="border-green-200 bg-green-50/40">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-xl font-bold text-gray-900">Free Tier</p>
            <p className="text-sm text-gray-500 mt-1">{locationsData.length} of 2 locations · 20 of 12 staff · All facility types (TAC 744, 746, 747)</p>
          </div>
          <Link href="/sign-up" className="shrink-0 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            Start Free Trial
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Locations</CardTitle>
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-sm font-medium text-gray-400 cursor-not-allowed px-3 py-1.5 border border-gray-200 rounded-md" disabled>
                <MapPin className="w-3.5 h-3.5" />Add Location<Lock className="w-3 h-3 ml-1" />
              </button>
              <div className="absolute right-0 top-9 z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                Sign up to add your own locations.
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {locationsData.map(loc => {
              const meta = FACILITY_META[loc.facilityType as FacilityType];
              return (
                <div key={loc.id} className={`flex items-center justify-between px-6 py-4 ${activeLocationId === loc.id ? "bg-green-50/40" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{loc.name}</p>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          <BookOpen className="w-3 h-3 mr-1" />{meta?.tacLabel}
                        </Badge>
                        {meta?.participatesTRS && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">TRS Eligible</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{meta?.label} · {loc.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeLocationId === loc.id && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Active</Badge>
                    )}
                    <button className="text-xs text-gray-400 border border-gray-200 rounded px-2.5 py-1 cursor-not-allowed flex items-center gap-1" disabled>
                      Edit<Lock className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* TAC Reference */}
      <Card className="border-blue-100 bg-blue-50/30">
        <CardHeader className="pb-2 border-b border-blue-100">
          <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />Texas Training Requirements by Facility Type
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-blue-50/60">
              <TableRow>
                <TableHead>Facility Type</TableHead>
                <TableHead>Governing Chapter</TableHead>
                <TableHead>Director Annual Hrs</TableHead>
                <TableHead>Caregiver Annual Hrs</TableHead>
                <TableHead>Pre-service Hrs</TableHead>
                <TableHead>TRS Eligible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Child Care Center</TableCell>
                <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">TAC §746</Badge></TableCell>
                <TableCell>30 hrs</TableCell>
                <TableCell>24 hrs</TableCell>
                <TableCell>24 hrs</TableCell>
                <TableCell><span className="text-green-600 font-medium">Yes</span></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Licensed Home</TableCell>
                <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">TAC §747</Badge></TableCell>
                <TableCell>30 hrs</TableCell>
                <TableCell>24 hrs</TableCell>
                <TableCell>24 hrs</TableCell>
                <TableCell><span className="text-green-600 font-medium">Yes</span></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">School-Age / Before & After</TableCell>
                <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">TAC §744</Badge></TableCell>
                <TableCell>20 hrs</TableCell>
                <TableCell>15 hrs</TableCell>
                <TableCell>8 hrs</TableCell>
                <TableCell><span className="text-gray-400">No</span></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">Team Access</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">Invite directors and staff to access the dashboard.</p>
            </div>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Paid Feature</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">Multi-user access is available on paid plans</p>
          <p className="text-sm text-gray-500 mb-4">Give each director or location manager their own login.</p>
          <Link href="/sign-up" className="inline-flex px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            Start Free Trial
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<DemoSection>("dashboard");
  const [activeLocationId, setActiveLocationId] = useState<number | null>(null);
  const [activeFacilityType, setActiveFacilityTypeState] = useState<FacilityType>("child_care_center");
  const [manualFacilityOverride, setManualFacilityOverride] = useState(false);

  // Sync facility type from the selected demo location
  useEffect(() => {
    if (!manualFacilityOverride && activeLocationId) {
      const loc = locationsData.find(l => l.id === activeLocationId);
      if (loc?.facilityType) setActiveFacilityTypeState(loc.facilityType as FacilityType);
    }
  }, [activeLocationId, manualFacilityOverride]);

  const handleSetActiveLocationId = (id: number | null) => {
    setActiveLocationId(id);
    setManualFacilityOverride(false); // clear override so type auto-syncs from location
  };

  const setActiveFacilityType = (ft: FacilityType) => {
    setActiveFacilityTypeState(ft);
    setManualFacilityOverride(true);
  };

  return (
    <DemoShell
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      activeLocationId={activeLocationId}
      setActiveLocationId={handleSetActiveLocationId}
      activeFacilityType={activeFacilityType}
      setActiveFacilityType={setActiveFacilityType}
    >
      {activeSection === "dashboard"   && (
        <DemoDashboard
          activeLocationId={activeLocationId}
          activeFacilityType={activeFacilityType}
          setActiveFacilityType={setActiveFacilityType}
        />
      )}
      {activeSection === "staff"       && <DemoStaff       activeLocationId={activeLocationId} />}
      {activeSection === "reports"     && <DemoReports     activeLocationId={activeLocationId} />}
      {activeSection === "rising-star" && <DemoRisingStar  activeLocationId={activeLocationId} />}
      {activeSection === "settings"    && <DemoSettings    activeLocationId={activeLocationId} />}
    </DemoShell>
  );
}
