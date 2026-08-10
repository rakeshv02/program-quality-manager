// Shared hardcoded demo data — no API calls, used by all demo section views
import type { FacilityType } from "@/lib/compliance-rules";

export const BASE_DATE = new Date("2026-08-10T00:00:00Z");

export const locationsData: { id: number; name: string; address: string; facilityType: FacilityType }[] = [
  { id: 1, name: "Downtown Center",          address: "1402 Congress Ave, Austin, TX 78701",    facilityType: "child_care_center" },
  { id: 2, name: "North Campus",             address: "8900 N Lamar Blvd, Austin, TX 78753",    facilityType: "licensed_home" },
  { id: 3, name: "Riverside After School",   address: "3200 E Riverside Dr, Austin, TX 78741",  facilityType: "school_age" },
];

export const staffList = [
  // Downtown Center — TAC 746 (child_care_center)
  { id: 1,  locationId: 1, firstName: "Maria",        lastName: "Garcia",    role: "Lead Teacher",         status: "active", hireDate: "2021-03-15", yearsExperience: 6,  annualTrainingHours: 22, preserviceHours: 24 },
  { id: 2,  locationId: 1, firstName: "James",        lastName: "Wilson",    role: "Assistant Teacher",    status: "active", hireDate: "2022-06-01", yearsExperience: 4,  annualTrainingHours: 24, preserviceHours: 24 },
  { id: 3,  locationId: 1, firstName: "Patricia",     lastName: "Thompson",  role: "Director",             status: "active", hireDate: "2019-08-20", yearsExperience: 9,  annualTrainingHours: 30, preserviceHours: 24 },
  { id: 4,  locationId: 1, firstName: "Robert",       lastName: "Martinez",  role: "Lead Teacher",         status: "active", hireDate: "2022-01-10", yearsExperience: 4,  annualTrainingHours: 18, preserviceHours: 24 },
  { id: 5,  locationId: 1, firstName: "Linda",        lastName: "Anderson",  role: "Cook",                 status: "active", hireDate: "2020-11-05", yearsExperience: 5,  annualTrainingHours: 24, preserviceHours: 24 },
  { id: 6,  locationId: 1, firstName: "Carlos",       lastName: "Rivera",    role: "Assistant Teacher",    status: "active", hireDate: "2023-04-17", yearsExperience: 3,  annualTrainingHours: 24, preserviceHours: 24 },
  { id: 7,  locationId: 1, firstName: "Susan",        lastName: "Lee",       role: "Aide",                 status: "active", hireDate: "2023-09-01", yearsExperience: 2,  annualTrainingHours: 24, preserviceHours: 24 },
  { id: 8,  locationId: 1, firstName: "Michael",      lastName: "Brown",     role: "Assistant Teacher",    status: "active", hireDate: "2024-01-08", yearsExperience: 1,  annualTrainingHours: 12, preserviceHours: 16 },
  // North Campus — TAC 747 (licensed_home)
  { id: 9,  locationId: 2, firstName: "Jennifer",     lastName: "Davis",     role: "Primary Caregiver",    status: "active", hireDate: "2020-05-12", yearsExperience: 8,  annualTrainingHours: 28, preserviceHours: 24 },
  { id: 10, locationId: 2, firstName: "David",        lastName: "Johnson",   role: "Assistant Caregiver",  status: "active", hireDate: "2021-07-19", yearsExperience: 5,  annualTrainingHours: 24, preserviceHours: 24 },
  { id: 11, locationId: 2, firstName: "Amanda",       lastName: "White",     role: "Assistant Caregiver",  status: "active", hireDate: "2022-10-03", yearsExperience: 3,  annualTrainingHours: 20, preserviceHours: 24 },
  { id: 12, locationId: 2, firstName: "Christopher",  lastName: "Harris",    role: "Assistant Caregiver",  status: "active", hireDate: "2021-11-22", yearsExperience: 5,  annualTrainingHours: 24, preserviceHours: 24 },
  { id: 13, locationId: 2, firstName: "Michelle",     lastName: "Clark",     role: "Cook",                 status: "active", hireDate: "2020-08-14", yearsExperience: 6,  annualTrainingHours: 24, preserviceHours: 24 },
  { id: 14, locationId: 2, firstName: "Daniel",       lastName: "Lewis",     role: "Aide",                 status: "active", hireDate: "2023-03-06", yearsExperience: 2,  annualTrainingHours: 24, preserviceHours: 24 },
  { id: 15, locationId: 2, firstName: "Ashley",       lastName: "Walker",    role: "Assistant Caregiver",  status: "active", hireDate: "2024-02-26", yearsExperience: 0,  annualTrainingHours: 10, preserviceHours: 12 },
  // Riverside After School — TAC 744 (school_age)
  { id: 16, locationId: 3, firstName: "Thomas",       lastName: "Reed",      role: "Program Director",     status: "active", hireDate: "2020-06-01", yearsExperience: 8,  annualTrainingHours: 20, preserviceHours: 8  },
  { id: 17, locationId: 3, firstName: "Sarah",        lastName: "Mitchell",  role: "Site Director",        status: "active", hireDate: "2022-03-15", yearsExperience: 3,  annualTrainingHours: 18, preserviceHours: 8  },
  { id: 18, locationId: 3, firstName: "Kevin",        lastName: "Turner",    role: "Caregiver",            status: "active", hireDate: "2023-08-01", yearsExperience: 1,  annualTrainingHours: 10, preserviceHours: 6  },
  { id: 19, locationId: 3, firstName: "Rachel",       lastName: "Adams",     role: "Caregiver",            status: "active", hireDate: "2024-05-01", yearsExperience: 0,  annualTrainingHours: 15, preserviceHours: 8  },
  { id: 20, locationId: 3, firstName: "Tyler",        lastName: "Brooks",    role: "Aide",                 status: "active", hireDate: "2024-09-01", yearsExperience: 0,  annualTrainingHours: 8,  preserviceHours: 4  },
];

export const certs = [
  // Downtown Center (TAC 746)
  { id: 1,  staffId: 1,  locationId: 1, type: "CPR Certification",              expiry: "2026-09-07" },
  { id: 2,  staffId: 1,  locationId: 1, type: "First Aid Certification",         expiry: "2027-03-15" },
  { id: 3,  staffId: 2,  locationId: 1, type: "CPR Certification",              expiry: "2024-11-01" },
  { id: 4,  staffId: 2,  locationId: 1, type: "First Aid Certification",         expiry: "2027-05-20" },
  { id: 5,  staffId: 3,  locationId: 1, type: "CPR Certification",              expiry: "2027-01-10" },
  { id: 6,  staffId: 3,  locationId: 1, type: "CDA Credential",                 expiry: null },
  { id: 7,  staffId: 3,  locationId: 1, type: "Director Certification",         expiry: "2027-08-01" },
  { id: 8,  staffId: 4,  locationId: 1, type: "CPR Certification",              expiry: "2026-09-01" },
  { id: 9,  staffId: 4,  locationId: 1, type: "First Aid Certification",         expiry: "2025-06-30" },
  { id: 10, staffId: 5,  locationId: 1, type: "Food Handler Certification",      expiry: "2027-04-15" },
  { id: 11, staffId: 6,  locationId: 1, type: "CPR Certification",              expiry: "2027-02-28" },
  { id: 12, staffId: 6,  locationId: 1, type: "First Aid Certification",         expiry: "2027-02-28" },
  { id: 13, staffId: 7,  locationId: 1, type: "Child Abuse & Neglect Training", expiry: "2026-12-01" },
  { id: 14, staffId: 8,  locationId: 1, type: "CPR Certification",              expiry: "2027-06-15" },
  // North Campus (TAC 747)
  { id: 15, staffId: 9,  locationId: 2, type: "CDA Credential",                 expiry: null },
  { id: 16, staffId: 9,  locationId: 2, type: "Director Certification",         expiry: "2027-11-20" },
  { id: 17, staffId: 10, locationId: 2, type: "CPR Certification",              expiry: "2027-03-01" },
  { id: 18, staffId: 10, locationId: 2, type: "First Aid Certification",         expiry: "2026-10-15" },
  { id: 19, staffId: 11, locationId: 2, type: "CPR Certification",              expiry: "2026-08-25" },
  { id: 20, staffId: 11, locationId: 2, type: "Shaken Baby Syndrome Training",  expiry: "2027-01-10" },
  { id: 21, staffId: 12, locationId: 2, type: "CPR Certification",              expiry: "2027-05-30" },
  { id: 22, staffId: 12, locationId: 2, type: "CDA Credential",                 expiry: null },
  { id: 23, staffId: 13, locationId: 2, type: "Food Handler Certification",      expiry: "2027-02-14" },
  { id: 24, staffId: 14, locationId: 2, type: "CPR Certification",              expiry: "2027-04-20" },
  { id: 25, staffId: 15, locationId: 2, type: "First Aid Certification",         expiry: "2027-07-08" },
  // Riverside After School (TAC 744)
  { id: 26, staffId: 16, locationId: 3, type: "CPR Certification",              expiry: "2027-01-15" },
  { id: 27, staffId: 17, locationId: 3, type: "CPR Certification",              expiry: "2026-10-01" },
  { id: 28, staffId: 18, locationId: 3, type: "CPR Certification",              expiry: "2026-08-20" },
  { id: 29, staffId: 19, locationId: 3, type: "CPR Certification",              expiry: "2027-03-10" },
  // Tyler Brooks (id:20) has no certs
];

export type CertStatus = "valid" | "expiring" | "expired" | "no_expiry";

export function getCertStatus(expiry: string | null): { status: CertStatus; days: number | null } {
  if (!expiry) return { status: "no_expiry", days: null };
  const d = new Date(expiry + "T00:00:00Z");
  const days = Math.ceil((d.getTime() - BASE_DATE.getTime()) / 86400000);
  if (days <= 0) return { status: "expired", days };
  if (days <= 30) return { status: "expiring", days };
  return { status: "valid", days };
}

export function getFilteredStaff(activeLocationId: number | null) {
  return staffList.filter(s => !activeLocationId || s.locationId === activeLocationId);
}

export function getFilteredCerts(activeLocationId: number | null) {
  return certs
    .filter(c => !activeLocationId || c.locationId === activeLocationId)
    .map(c => {
      const { status, days } = getCertStatus(c.expiry);
      return { ...c, status, daysUntilExpiration: days };
    });
}
