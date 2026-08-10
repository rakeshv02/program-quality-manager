import { useGetRisingStarScore, getGetRisingStarScoreQueryKey, useListLocations } from "@workspace/api-client-react";
import { useLocationContext } from "@/context/location-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FACILITY_META, type FacilityType } from "@/lib/compliance-rules";
import { Star, CheckCircle2, XCircle, Info, Filter, ArrowRight, BookOpen } from "lucide-react";

export default function RisingStarPage() {
  const { activeLocationId } = useLocationContext();
  const { data: locations = [] } = useListLocations();

  const activeLocation = locations.find(l => l.id === activeLocationId);
  const facilityType = (activeLocation?.facilityType as FacilityType) || "child_care_center";
  const meta = FACILITY_META[facilityType];
  const trsEligible = !activeLocationId || meta?.participatesTRS !== false;

  const { data: scoreData, isLoading } = useGetRisingStarScore(
    { locationId: activeLocationId! },
    { query: { enabled: !!activeLocationId && trsEligible, queryKey: getGetRisingStarScoreQueryKey({ locationId: activeLocationId! }) } }
  );

  const renderStars = (level: number) => (
    Array.from({ length: 4 }).map((_, i) => (
      <Star key={i} className={`w-8 h-8 ${i < level ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
    ))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between items-start gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Texas Rising Star</h1>
        <p className="text-gray-500">Calculator and requirements checklist for TRS certification levels.</p>
      </div>

      {/* No location selected */}
      {!activeLocationId ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-6 flex flex-col items-center justify-center text-center">
          <Filter className="w-10 h-10 mb-3 text-amber-500" />
          <h3 className="text-lg font-semibold mb-1">Select a Location</h3>
          <p className="text-sm max-w-md">The Rising Star calculator requires a specific location to evaluate staff certifications and ratios.</p>
        </div>
      ) : !trsEligible ? (
        /* School-Age / TAC 744 — not TRS eligible */
        <Card className="border-gray-200">
          <CardContent className="p-10 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rising Star Does Not Apply</h3>
              <p className="text-gray-500 max-w-md leading-relaxed">
                Texas Rising Star is a quality rating system for <strong>licensed childcare centers (TAC 746)</strong> and <strong>licensed home-based daycares (TAC 747)</strong>.
              </p>
              <p className="text-gray-500 mt-2 max-w-md leading-relaxed">
                <strong>{activeLocation?.name}</strong> is classified as a{" "}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mx-1">
                  <BookOpen className="w-3 h-3 mr-1" />{meta?.tacLabel} — {meta?.label}
                </Badge>{" "}
                which participates in the school-age quality framework instead.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 max-w-md text-left text-sm text-blue-800">
              <p className="font-semibold mb-1">School-Age Quality Resources</p>
              <ul className="space-y-1 list-disc list-inside text-blue-700">
                <li>Texas School-Age and Youth Program Quality Assessment (PQA)</li>
                <li>Texas AfterSchool Centers on Education (ACE) Program Standards</li>
                <li>Contact HHSC for school-age quality improvement resources</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <div className="flex gap-2 mb-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-8 h-8 rounded-full" />)}</div>
              <Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>
      ) : !scoreData ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Data Unavailable</p>
            <p>Could not calculate Rising Star score. Please ensure you have staff and certifications added.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Facility type notice */}
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span><strong>{meta?.tacLabel}</strong> — {meta?.label} · TRS certification is available for this facility type.</span>
          </div>

          <Card className="overflow-hidden border-2 border-primary/20 shadow-sm">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex gap-1.5 mb-3">{renderStars(scoreData.currentLevel)}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Current Level: {scoreData.currentLevel}-Star</h2>
                <p className="text-gray-600">Total Score: <span className="font-semibold text-gray-900">{scoreData.overallScore}</span> pts</p>
              </div>
              {scoreData.nextLevel && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center md:items-end text-center md:text-right min-w-[240px]">
                  <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Target Level</p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5"><Star className="w-5 h-5 fill-amber-400 text-amber-400" /><span className="font-bold text-lg">{scoreData.nextLevel}</span></div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 px-1">Category Breakdown</h3>
              {scoreData.categories.map((category, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-end">
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <span className="font-semibold text-primary">{category.score} <span className="text-gray-400 font-normal text-sm">/ {category.maxScore} pts</span></span>
                    </div>
                    <Progress value={(category.score / category.maxScore) * 100} className="h-2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {category.requirements.map((req, reqIdx) => (
                        <li key={reqIdx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                          {req.met
                            ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            : <XCircle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />}
                          <div>
                            <p className={`text-sm font-medium ${req.met ? "text-gray-900" : "text-gray-600"}`}>{req.description}</p>
                            {req.detail && <p className="text-xs text-gray-500 mt-1">{req.detail}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 px-1">Action Plan</h3>
              <Card className="border-blue-100 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />Recommendations
                  </CardTitle>
                  <CardDescription className="text-blue-700/80">To reach the next level, focus on these areas:</CardDescription>
                </CardHeader>
                <CardContent>
                  {scoreData.recommendations.length > 0 ? (
                    <ul className="space-y-4">
                      {scoreData.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{idx + 1}</div>
                          <p className="text-sm text-blue-900 leading-relaxed">{rec}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6 text-green-700">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="font-medium">You meet all requirements for 4-Star!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
