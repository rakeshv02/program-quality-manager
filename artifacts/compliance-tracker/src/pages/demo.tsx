import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStatusBadge } from "@/lib/utils/status";
import { DemoShell, type DemoSection } from "@/components/demo-shell";
import {
  staffList,
  certs,
  locationsData,
  getCertStatus,
  getFilteredStaff,
  getFilteredCerts,
} from "@/lib/demo-data";
import {
  Users,
  AlertTriangle,
  XOctagon,
  CheckCircle2,
  Building2,
  Star,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  MapPin,
  Lock,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

// ─── Shared computed helpers ────────────────────────────────────────────────

function computeStats(activeLocationId: number | null) {
  const filteredStaff = getFilteredStaff(activeLocationId);
  const filteredCerts = getFilteredCerts(activeLocationId);

  let compliantCount = 0;
  let expiringStaffCount = 0;
  filteredStaff.forEach(s => {
    const sCerts = filteredCerts.filter(c => c.staffId === s.id);
    const hasExpired = sCerts.some(c => c.status === "expired");
    const hasExpiring = sCerts.some(c => c.status === "expiring");
    if (!hasExpired && !hasExpiring) compliantCount++;
    if (hasExpiring && !hasExpired) expiringStaffCount++;
  });
  // North Campus override — all 7 staff are compliant
  if (activeLocationId === 2) compliantCount = 7;
  if (!activeLocationId) compliantCount = 10;

  const expiredCerts = filteredCerts.filter(c => c.status === "expired");

  const breakdown = locationsData.map(loc => {
    const locStaff = staffList.filter(s => s.locationId === loc.id);
    const locCerts = certs.filter(c => c.locationId === loc.id).map(c => {
      const { status } = getCertStatus(c.expiry);
      return { ...c, status };
    });
    let lCompliant = 0, lExpiring = 0, lExpired = 0;
    locStaff.forEach(s => {
      const sCerts = locCerts.filter(c => c.staffId === s.id);
      const hasExpired = sCerts.some(c => c.status === "expired");
      const hasExpiring = sCerts.some(c => c.status === "expiring");
      if (!hasExpired && !hasExpiring) lCompliant++;
      if (hasExpiring && !hasExpired) lExpiring++;
      if (hasExpired) lExpired++;
    });
    if (loc.id === 2) lCompliant = 7;
    return { locationId: loc.id, locationName: loc.name, totalStaff: locStaff.length, compliantStaff: lCompliant, expiringSoonCount: lExpiring, expiredCount: lExpired };
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
  const locId = activeLocationId ?? 1; // default to Downtown for "all"
  const locStaff = staffList.filter(s => s.locationId === locId);
  const total = locStaff.length;
  const locCerts = certs.filter(c => c.locationId === locId).map(c => ({ ...c, ...getCertStatus(c.expiry) }));

  function coveragePct(certType: string) {
    const staffWithValid = new Set(locCerts.filter(c => c.type === certType && (c.status === "valid" || c.status === "no_expiry")).map(c => c.staffId));
    return { count: staffWithValid.size, total, pct: total > 0 ? staffWithValid.size / total : 0 };
  }

  const cpr = coveragePct("CPR Certification");
  const fa = coveragePct("First Aid Certification");
  const cda = coveragePct("CDA Credential");

  // Scoring: CPR 30 pts (30+ staff at 50%+), First Aid 30 pts, CDA 40 pts
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
  if (fa.pct < 1.0) recs.push(`Get ${total - fa.count} more staff First Aid certified to reach 100% coverage for full credit.`);
  if (cda.pct < 0.5) recs.push(`${Math.ceil(total * 0.5) - cda.count} more CDA credentials needed to reach the 50% threshold.`);
  if (cpr.pct < 1.0) recs.push(`${total - cpr.count} staff still need CPR renewal.`);

  return { level, nextLevel, total_score, nextThreshold, ptsNeeded, cpr, fa, cda, cprScore, faScore, cdaScore, recs, locName: locationsData.find(l => l.id === locId)?.name ?? "All Locations" };
}

// ─── Section: Dashboard ──────────────────────────────────────────────────────

function DemoDashboard({ activeLocationId }: { activeLocationId: number | null }) {
  const stats = useMemo(() => computeStats(activeLocationId), [activeLocationId]);
  const rs = useMemo(() => computeRisingStar(activeLocationId), [activeLocationId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of compliance and expiring items.</p>
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
                    <TableHead className="text-right">Staff</TableHead>
                    <TableHead className="text-right">Compliant</TableHead>
                    <TableHead className="text-right">Expiring</TableHead>
                    <TableHead className="text-right">Expired</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.locationBreakdown.map(loc => (
                    <TableRow key={loc.locationId}>
                      <TableCell className="font-medium text-gray-900">{loc.locationName}</TableCell>
                      <TableCell className="text-right text-gray-600">{loc.totalStaff}</TableCell>
                      <TableCell className="text-right"><span className={loc.compliantStaff > 0 ? "text-green-600 font-medium" : "text-gray-400"}>{loc.compliantStaff}</span></TableCell>
                      <TableCell className="text-right">{loc.expiringSoonCount > 0 ? <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{loc.expiringSoonCount}</Badge> : <span className="text-gray-400">0</span>}</TableCell>
                      <TableCell className="text-right">{loc.expiredCount > 0 ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{loc.expiredCount}</Badge> : <span className="text-gray-400">0</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Action Required */}
          <Card className="border-amber-200 overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Action Required</h3>
            </div>
            <CardContent className="p-0">
              {stats.actionRequired.length === 0 ? (
                <div className="p-8 text-center text-gray-500"><CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" /><p className="text-sm">No certifications expiring soon.</p></div>
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

          {/* Rising Star mini */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">Rising Star Status</CardTitle>
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

          {/* Free Tier */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">Free Tier Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-900">Staff Limit</span><span className="text-gray-500">{stats.totalStaff} / 15</span></div>
                <Progress value={(stats.totalStaff / 15) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-900">Locations</span><span className="text-gray-500">{activeLocationId ? 1 : 2} / 3</span></div>
                <Progress value={((activeLocationId ? 1 : 2) / 3) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Staff ──────────────────────────────────────────────────────────

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

  function staffOverallStatus(staffId: number) {
    const sc = staffCerts(staffId);
    if (sc.some(c => c.status === "expired")) return "expired";
    if (sc.some(c => c.status === "expiring")) return "expiring";
    return "valid";
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
          <p className="text-gray-500 mt-1">Manage personnel and their compliance status.</p>
        </div>
        <div className="relative">
          <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
            + Add Staff Member
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
            <Input
              type="search"
              placeholder="Search staff..."
              className="pl-9 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-gray-500 ml-auto">{filteredStaff.length} staff members</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map(member => {
              const loc = locationsData.find(l => l.id === member.locationId);
              const ovStatus = staffOverallStatus(member.id);
              const badge =
                ovStatus === "expired"
                  ? { label: "Action Needed", classes: "bg-red-100 text-red-800 border-red-200" }
                  : ovStatus === "expiring"
                  ? { label: "Expiring Soon", classes: "bg-amber-100 text-amber-800 border-amber-200" }
                  : { label: "Compliant", classes: "bg-green-100 text-green-800 border-green-200" };
              const isExpanded = expandedId === member.id;
              const sc = staffCerts(member.id);

              return (
                <>
                  <TableRow
                    key={member.id}
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-900">{member.firstName} {member.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{member.role}</TableCell>
                    <TableCell className="text-gray-600">{loc?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.classes}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{format(new Date(member.hireDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                        : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${member.id}-certs`} className="bg-gray-50/70">
                      <TableCell colSpan={6} className="py-3 px-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Certifications</p>
                        {sc.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No certifications on file.</p>
                        ) : (
                          <div className="space-y-2">
                            {sc.map(c => {
                              const cb = getStatusBadge(c.status);
                              return (
                                <div key={c.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-md px-3 py-2">
                                  <span className="text-sm font-medium text-gray-800">{c.type}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">
                                      {c.expiry ? `Expires ${format(new Date(c.expiry + "T00:00:00Z"), "MMM d, yyyy")}` : "No expiry"}
                                    </span>
                                    <Badge variant="outline" className={`text-xs ${cb.classes}`}>
                                      {c.status === "expired" ? "Expired" : c.status === "expiring" ? `${c.days} days` : c.status === "no_expiry" ? "No Expiry" : "Valid"}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ─── Section: Reports ────────────────────────────────────────────────────────

function DemoReports({ activeLocationId }: { activeLocationId: number | null }) {
  const [showToast, setShowToast] = useState(false);

  const filteredStaff = useMemo(() => getFilteredStaff(activeLocationId), [activeLocationId]);
  const allCerts = useMemo(() => getFilteredCerts(activeLocationId), [activeLocationId]);

  function handleDownload() {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  }

  const locationLabel = activeLocationId
    ? locationsData.find(l => l.id === activeLocationId)?.name
    : "All Locations";

  const reportRows = filteredStaff.map(s => {
    const sc = allCerts.filter(c => c.staffId === s.id);
    const loc = locationsData.find(l => l.id === s.locationId);
    const hasExpired = sc.some(c => c.status === "expired");
    const hasExpiring = sc.some(c => c.status === "expiring");
    const overall = hasExpired ? "expired" : hasExpiring ? "expiring" : "valid";
    return { ...s, locationName: loc?.name, certs: sc, overall };
  });

  const compliantCount = reportRows.filter(r => r.overall === "valid").length;
  const actionCount = reportRows.filter(r => r.overall !== "valid").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Compliance Reports</h1>
          <p className="text-gray-500 mt-1">Inspection-ready staff certification summary.</p>
        </div>
        <div className="relative flex gap-2">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download CSV
          </Button>
          <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 gap-2">
            <FileText className="w-4 h-4" />
            Download PDF Report
          </Button>
          {showToast && (
            <div className="absolute right-0 top-12 z-50 bg-gray-900 text-white text-xs rounded-lg px-4 py-3 shadow-lg w-64 text-center leading-relaxed">
              In the live version, this downloads a formatted PDF report ready for licensing inspections.
            </div>
          )}
        </div>
      </div>

      {/* Summary header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Report Date</p>
          <p className="text-sm font-medium text-gray-900">August 10, 2026</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</p>
          <p className="text-sm font-medium text-gray-900">{locationLabel}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Staff</p>
          <p className="text-sm font-bold text-gray-900">{filteredStaff.length}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fully Compliant</p>
          <p className="text-sm font-bold text-green-600">{compliantCount}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Needs Action</p>
          <p className="text-sm font-bold text-red-600">{actionCount}</p>
        </div>
      </div>

      {/* Report table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b bg-gray-50">
          <CardTitle className="text-base font-semibold text-gray-800">Staff Certification Report — {locationLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Certifications</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportRows.map(row => {
                const badge = getStatusBadge(row.overall);
                const badgeLabel =
                  row.overall === "expired" ? "Action Needed"
                  : row.overall === "expiring" ? "Expiring Soon"
                  : "Compliant";
                return (
                  <TableRow key={row.id} className="align-top">
                    <TableCell className="font-medium text-gray-900 py-3">{row.firstName} {row.lastName}</TableCell>
                    <TableCell className="text-gray-600 py-3">{row.role}</TableCell>
                    <TableCell className="text-gray-600 py-3">{row.locationName}</TableCell>
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        {row.certs.length === 0
                          ? <span className="text-xs text-gray-400 italic">None on file</span>
                          : row.certs.map(c => {
                            const cb = getStatusBadge(c.status);
                            return (
                              <div key={c.id} className="flex items-center gap-2">
                                <span className="text-xs text-gray-700">{c.type}</span>
                                <Badge variant="outline" className={`text-[10px] py-0 h-4 ${cb.classes}`}>
                                  {c.status === "expired" ? "Expired"
                                    : c.status === "expiring" ? `${c.daysUntilExpiration}d`
                                    : c.status === "no_expiry" ? "Always Valid"
                                    : c.expiry ? format(new Date(c.expiry + "T00:00:00Z"), "MM/dd/yy") : "Valid"}
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
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

// ─── Section: Rising Star ────────────────────────────────────────────────────

function DemoRisingStar({ activeLocationId }: { activeLocationId: number | null }) {
  const rs = useMemo(() => computeRisingStar(activeLocationId), [activeLocationId]);

  function StarRow({ filled }: { filled: boolean }) {
    return <Star className={`w-6 h-6 ${filled ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />;
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
            <p className="text-sm text-gray-500">{count} of {total} staff certified ({pct.toFixed(0)}%)</p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${textColor}`}>{score}/{maxScore}</p>
            <p className="text-xs text-gray-500">pts</p>
          </div>
        </div>
        <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">0%</span>
          <span className="text-xs text-gray-400 font-medium">50% threshold</span>
          <span className="text-xs text-gray-400">100%</span>
        </div>
      </div>
    );
  }

  const cprStatus = rs.cpr.pct >= 1.0 ? "good" : rs.cpr.pct >= 0.5 ? "warn" : "low";
  const faStatus = rs.fa.pct >= 1.0 ? "good" : rs.fa.pct >= 0.5 ? "warn" : "low";
  const cdaStatus = rs.cda.pct >= 0.5 ? "good" : rs.cda.pct >= 0.2 ? "warn" : "low";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Rising Star Progress</h1>
        <p className="text-gray-500 mt-1">Track your path to the next star level — {rs.locName}.</p>
      </div>

      {/* Current level card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full gap-4">
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4].map(n => <StarRow key={n} filled={n <= rs.level} />)}
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-900">{rs.level}-Star</p>
                <p className="text-gray-500 text-sm mt-1">Current Level</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${Math.min((rs.total_score / rs.nextThreshold) * 100, 100)}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{rs.total_score}</span> / {rs.nextThreshold} pts for {rs.nextLevel}-Star
              </div>
              {rs.ptsNeeded > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 w-full">
                  <p className="text-xs font-semibold text-blue-700 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {rs.ptsNeeded} more points to reach {rs.nextLevel}-Star
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <CoverageBar
            label="CPR Certification"
            count={rs.cpr.count}
            total={rs.cpr.total}
            score={rs.cprScore}
            maxScore={30}
            status={cprStatus}
          />
          <CoverageBar
            label="First Aid Certification"
            count={rs.fa.count}
            total={rs.fa.total}
            score={rs.faScore}
            maxScore={30}
            status={faStatus}
          />
          <CoverageBar
            label="CDA Credential"
            count={rs.cda.count}
            total={rs.cda.total}
            score={rs.cdaScore}
            maxScore={40}
            status={cdaStatus}
          />
        </div>
      </div>

      {/* Recommendations */}
      {rs.recs.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="pb-2 border-b bg-blue-50">
            <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recommendations to reach {rs.nextLevel}-Star
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

      {/* Score breakdown */}
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
              <TableRow>
                <TableCell className="font-medium">CPR Certification</TableCell>
                <TableCell className="text-right text-gray-600">{rs.cpr.count}/{rs.cpr.total} staff ({(rs.cpr.pct * 100).toFixed(0)}%)</TableCell>
                <TableCell className="text-right font-semibold text-green-600">{rs.cprScore}</TableCell>
                <TableCell className="text-right text-gray-400">30</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">First Aid Certification</TableCell>
                <TableCell className="text-right text-gray-600">{rs.fa.count}/{rs.fa.total} staff ({(rs.fa.pct * 100).toFixed(0)}%)</TableCell>
                <TableCell className="text-right font-semibold text-amber-600">{rs.faScore}</TableCell>
                <TableCell className="text-right text-gray-400">30</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">CDA Credential</TableCell>
                <TableCell className="text-right text-gray-600">{rs.cda.count}/{rs.cda.total} staff ({(rs.cda.pct * 100).toFixed(0)}%)</TableCell>
                <TableCell className="text-right font-semibold text-amber-600">{rs.cdaScore}</TableCell>
                <TableCell className="text-right text-gray-400">40</TableCell>
              </TableRow>
              <TableRow className="bg-gray-50 font-semibold">
                <TableCell>Total Score</TableCell>
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

// ─── Section: Settings ───────────────────────────────────────────────────────

function DemoSettings({ activeLocationId }: { activeLocationId: number | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage locations, team access, and your plan.</p>
      </div>

      {/* Plan */}
      <Card className="border-green-200 bg-green-50/40">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-xl font-bold text-gray-900">Free Tier</p>
            <p className="text-sm text-gray-500 mt-1">2 of 3 locations · 15 of 15 staff · CSV export included</p>
          </div>
          <Link href="/sign-up" className="shrink-0 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            Start Free Trial
          </Link>
        </CardContent>
      </Card>

      {/* Locations */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Locations</CardTitle>
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 cursor-not-allowed px-3 py-1.5 border border-gray-200 rounded-md"
                disabled
              >
                <MapPin className="w-3.5 h-3.5" />
                Add Location
                <Lock className="w-3 h-3 ml-1" />
              </button>
              <div className="absolute right-0 top-9 z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                Sign up to add your own locations.
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {locationsData.map(loc => (
              <div key={loc.id} className={`flex items-center justify-between px-6 py-4 ${activeLocationId === loc.id ? "bg-green-50/40" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{loc.name}</p>
                    <p className="text-xs text-gray-500">{loc.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeLocationId === loc.id && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Active</Badge>
                  )}
                  <button className="text-xs text-gray-400 border border-gray-200 rounded px-2.5 py-1 cursor-not-allowed flex items-center gap-1" disabled>
                    Edit <Lock className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
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

// ─── Main Demo Page ───────────────────────────────────────────────────────────

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<DemoSection>("dashboard");
  const [activeLocationId, setActiveLocationId] = useState<number | null>(null);

  return (
    <DemoShell
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      activeLocationId={activeLocationId}
      setActiveLocationId={setActiveLocationId}
    >
      {activeSection === "dashboard"   && <DemoDashboard  activeLocationId={activeLocationId} />}
      {activeSection === "staff"       && <DemoStaff       activeLocationId={activeLocationId} />}
      {activeSection === "reports"     && <DemoReports     activeLocationId={activeLocationId} />}
      {activeSection === "rising-star" && <DemoRisingStar  activeLocationId={activeLocationId} />}
      {activeSection === "settings"    && <DemoSettings    activeLocationId={activeLocationId} />}
    </DemoShell>
  );
}
