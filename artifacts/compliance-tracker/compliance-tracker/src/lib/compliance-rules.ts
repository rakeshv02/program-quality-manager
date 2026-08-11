/**
 * Texas childcare compliance requirements by facility type and role.
 * Source: TAC 744 (school-age), TAC 746 (child care centers), TAC 747 (licensed homes).
 */

export type FacilityType = "child_care_center" | "licensed_home" | "school_age";

export interface FacilityMeta {
  label: string;
  tacChapter: string;
  tacLabel: string;
  participatesTRS: boolean; // Texas Rising Star
  description: string;
}

export const FACILITY_META: Record<FacilityType, FacilityMeta> = {
  child_care_center: {
    label: "Child Care Center",
    tacChapter: "746",
    tacLabel: "TAC §746",
    participatesTRS: true,
    description: "Licensed childcare center operating under Texas Administrative Code Chapter 746.",
  },
  licensed_home: {
    label: "Licensed Home-Based Daycare",
    tacChapter: "747",
    tacLabel: "TAC §747",
    participatesTRS: true,
    description: "Licensed family home daycare operating under Texas Administrative Code Chapter 747.",
  },
  school_age: {
    label: "School-Age / Before & After School",
    tacChapter: "744",
    tacLabel: "TAC §744",
    participatesTRS: false,
    description: "Before/after-school program or school-age childcare under Texas Administrative Code Chapter 744.",
  },
};

export interface TrainingRequirement {
  annualHours: number;
  preserviceHours: number;
  note?: string;
}

// Map of role keywords → training requirement for each facility type.
// Matching is case-insensitive substring. Falls back to "default" if no role matches.
export const TRAINING_REQUIREMENTS: Record<
  FacilityType,
  { roleMatchers: { keywords: string[]; req: TrainingRequirement }[]; default: TrainingRequirement }
> = {
  child_care_center: {
    roleMatchers: [
      {
        keywords: ["director"],
        req: {
          annualHours: 30,
          preserviceHours: 24,
          note: "New directors with ≤5 years experience: 6 hrs minimum in first year. Pre-service: 8 hrs before ratio count, 16 hrs within 90 days.",
        },
      },
    ],
    default: {
      annualHours: 24,
      preserviceHours: 24,
      note: "Pre-service: 8 hrs before counting in ratio, 16 hrs within 90 days of hire.",
    },
  },
  licensed_home: {
    roleMatchers: [
      {
        keywords: ["primary caregiver", "primary"],
        req: { annualHours: 30, preserviceHours: 24 },
      },
    ],
    default: {
      annualHours: 24,
      preserviceHours: 24,
      note: "Required if employee is on child-to-caregiver ratio 10 or more times per year.",
    },
  },
  school_age: {
    roleMatchers: [
      {
        keywords: ["director", "program director", "operation director"],
        req: {
          annualHours: 20,
          preserviceHours: 8,
          note: "Pre-service exemptions available for staff with 6+ months experience in school-age programs.",
        },
      },
    ],
    default: {
      annualHours: 15,
      preserviceHours: 8,
      note: "Pre-service exemptions available for staff with 6+ months school-age program experience.",
    },
  },
};

export function getTrainingRequirement(
  facilityType: FacilityType,
  role: string
): TrainingRequirement {
  const rules = TRAINING_REQUIREMENTS[facilityType];
  const roleLower = role.toLowerCase();
  for (const { keywords, req } of rules.roleMatchers) {
    if (keywords.some((k) => roleLower.includes(k))) return req;
  }
  return rules.default;
}

export function getTrainingStatus(
  completed: number,
  required: number
): "complete" | "in_progress" | "not_started" {
  if (completed >= required) return "complete";
  if (completed > 0) return "in_progress";
  return "not_started";
}

export function trainingStatusBadge(status: "complete" | "in_progress" | "not_started") {
  if (status === "complete") return { label: "Complete", classes: "bg-green-100 text-green-800 border-green-200" };
  if (status === "in_progress") return { label: "In Progress", classes: "bg-amber-100 text-amber-800 border-amber-200" };
  return { label: "Not Started", classes: "bg-red-100 text-red-800 border-red-200" };
}

// Canonical role options per facility type for form dropdowns
export const ROLE_OPTIONS: Record<FacilityType, string[]> = {
  child_care_center: [
    "Director",
    "Lead Teacher",
    "Assistant Teacher",
    "Aide",
    "Cook",
    "Driver",
    "Administrative Staff",
  ],
  licensed_home: [
    "Primary Caregiver",
    "Assistant Caregiver",
    "Cook",
    "Aide",
  ],
  school_age: [
    "Program Director",
    "Site Director",
    "Caregiver",
    "Assistant Caregiver",
    "Aide",
    "Cook",
  ],
};
