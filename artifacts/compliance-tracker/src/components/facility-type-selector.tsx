import { Badge } from "@/components/ui/badge";
import { FACILITY_META, ROLE_OPTIONS, getTrainingRequirement, type FacilityType } from "@/lib/compliance-rules";
import { BookOpen, Building2, Home, School, GraduationCap, Clock } from "lucide-react";

const FACILITY_CARDS: {
  key: FacilityType;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  selectedBg: string;
  selectedBorder: string;
  iconBg: string;
}[] = [
  {
    key: "child_care_center",
    icon: Building2,
    color: "text-blue-700",
    selectedBg: "bg-blue-50",
    selectedBorder: "border-blue-400 ring-2 ring-blue-200",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    key: "licensed_home",
    icon: Home,
    color: "text-emerald-700",
    selectedBg: "bg-emerald-50",
    selectedBorder: "border-emerald-400 ring-2 ring-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    key: "school_age",
    icon: School,
    color: "text-violet-700",
    selectedBg: "bg-violet-50",
    selectedBorder: "border-violet-400 ring-2 ring-violet-200",
    iconBg: "bg-violet-100 text-violet-600",
  },
];

// Key training hours per facility type shown inside each card
const HOURS_SUMMARY: Record<FacilityType, { role: string; annual: number; preservice: number }[]> = {
  child_care_center: [
    { role: "Director",          annual: 30, preservice: 24 },
    { role: "Lead Teacher",      annual: 24, preservice: 24 },
    { role: "Asst. Teacher",     annual: 24, preservice: 24 },
    { role: "Aide / Cook",       annual: 24, preservice: 24 },
  ],
  licensed_home: [
    { role: "Primary Caregiver", annual: 30, preservice: 24 },
    { role: "Asst. Caregiver",   annual: 24, preservice: 24 },
    { role: "Aide / Cook",       annual: 24, preservice: 24 },
  ],
  school_age: [
    { role: "Program Director",  annual: 20, preservice: 8 },
    { role: "Site Director",     annual: 20, preservice: 8 },
    { role: "Caregiver",         annual: 15, preservice: 8 },
    { role: "Aide",              annual: 15, preservice: 8 },
  ],
};

interface FacilityTypeSelectorProps {
  activeFacilityType: FacilityType;
  setActiveFacilityType: (ft: FacilityType) => void;
  /** If true, renders a compact strip below the 3 cards with per-role training hours */
  showRequirements?: boolean;
}

export function FacilityTypeSelector({
  activeFacilityType,
  setActiveFacilityType,
  showRequirements = true,
}: FacilityTypeSelectorProps) {
  const meta = FACILITY_META[activeFacilityType];

  return (
    <div className="rounded-2xl border-2 border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-base leading-tight">
            What type of facility do you operate?
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Select your facility type to see the correct TAC chapter, staff roles, and training hour requirements.
          </p>
        </div>
      </div>

      {/* 3-Card Selector */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FACILITY_CARDS.map(({ key, icon: Icon, color, selectedBg, selectedBorder, iconBg }) => {
          const m = FACILITY_META[key];
          const isSelected = activeFacilityType === key;
          const hours = HOURS_SUMMARY[key];
          const directorRow = hours.find(h =>
            h.role.toLowerCase().includes("director") || h.role.toLowerCase().includes("primary")
          );
          const staffRow = hours.find(h =>
            !h.role.toLowerCase().includes("director") && !h.role.toLowerCase().includes("primary")
          );

          return (
            <button
              key={key}
              onClick={() => setActiveFacilityType(key)}
              className={`relative w-full text-left rounded-xl border-2 p-4 transition-all duration-150 cursor-pointer group ${
                isSelected
                  ? `${selectedBg} ${selectedBorder}`
                  : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white hover:shadow-sm"
              }`}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider text-white bg-gray-900 px-2 py-0.5 rounded-full">
                  ✓ Selected
                </span>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? iconBg : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold text-sm leading-tight ${isSelected ? color : "text-gray-700"}`}>
                    {m.label}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono mt-1 px-1.5 ${
                      isSelected ? `border-current ${color} bg-white/70` : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {m.tacLabel}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Annual Training Hours
                </p>
                {directorRow && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate pr-2">{directorRow.role}</span>
                    <span className={`font-bold tabular-nums shrink-0 ${isSelected ? color : "text-gray-700"}`}>
                      {directorRow.annual} hrs
                    </span>
                  </div>
                )}
                {staffRow && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate pr-2">{staffRow.role}</span>
                    <span className={`font-bold tabular-nums shrink-0 ${isSelected ? color : "text-gray-700"}`}>
                      {staffRow.annual} hrs
                    </span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-gray-200/80 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Pre-service hrs</span>
                  <span className={`font-semibold ${isSelected ? color : "text-gray-600"}`}>
                    {hours[0]?.preservice} hrs
                  </span>
                </div>
                {m.participatesTRS && (
                  <div className="pt-0.5">
                    <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                      ⭐ TRS Eligible
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Requirements summary strip */}
      {showRequirements && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-800 flex items-center gap-1.5 shrink-0">
              <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
              {meta.tacLabel} — {meta.label}:
            </span>
            {HOURS_SUMMARY[activeFacilityType].map(h => (
              <span key={h.role} className="flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-700">
                  <strong>{h.role}</strong> · {h.annual} annual / {h.preservice} pre-service hrs
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
