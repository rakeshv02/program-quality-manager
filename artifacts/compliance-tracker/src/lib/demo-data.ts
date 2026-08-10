// Shared hardcoded demo data — no API calls, used by all demo section views

export const BASE_DATE = new Date("2026-08-10T00:00:00Z");

export const locationsData = [
  { id: 1, name: "Downtown Center", address: "1402 Congress Ave, Austin, TX 78701" },
  { id: 2, name: "North Campus", address: "8900 N Lamar Blvd, Austin, TX 78753" },
];

export const staffList = [
  { id: 1, locationId: 1, firstName: "Maria",       lastName: "Garcia",    role: "Lead Teacher",       status: "active", hireDate: "2021-03-15" },
  { id: 2, locationId: 1, firstName: "James",       lastName: "Wilson",    role: "Assistant Teacher",  status: "active", hireDate: "2022-06-01" },
  { id: 3, locationId: 1, firstName: "Patricia",    lastName: "Thompson",  role: "Director",           status: "active", hireDate: "2019-08-20" },
  { id: 4, locationId: 1, firstName: "Robert",      lastName: "Martinez",  role: "Lead Teacher",       status: "active", hireDate: "2022-01-10" },
  { id: 5, locationId: 1, firstName: "Linda",       lastName: "Anderson",  role: "Cook",               status: "active", hireDate: "2020-11-05" },
  { id: 6, locationId: 1, firstName: "Carlos",      lastName: "Rivera",    role: "Assistant Teacher",  status: "active", hireDate: "2023-04-17" },
  { id: 7, locationId: 1, firstName: "Susan",       lastName: "Lee",       role: "Aide",               status: "active", hireDate: "2023-09-01" },
  { id: 8, locationId: 1, firstName: "Michael",     lastName: "Brown",     role: "Assistant Teacher",  status: "active", hireDate: "2024-01-08" },
  { id: 9, locationId: 2, firstName: "Jennifer",    lastName: "Davis",     role: "Director",           status: "active", hireDate: "2020-05-12" },
  { id: 10, locationId: 2, firstName: "David",      lastName: "Johnson",   role: "Lead Teacher",       status: "active", hireDate: "2021-07-19" },
  { id: 11, locationId: 2, firstName: "Amanda",     lastName: "White",     role: "Assistant Teacher",  status: "active", hireDate: "2022-10-03" },
  { id: 12, locationId: 2, firstName: "Christopher",lastName: "Harris",    role: "Lead Teacher",       status: "active", hireDate: "2021-11-22" },
  { id: 13, locationId: 2, firstName: "Michelle",   lastName: "Clark",     role: "Cook",               status: "active", hireDate: "2020-08-14" },
  { id: 14, locationId: 2, firstName: "Daniel",     lastName: "Lewis",     role: "Aide",               status: "active", hireDate: "2023-03-06" },
  { id: 15, locationId: 2, firstName: "Ashley",     lastName: "Walker",    role: "Assistant Teacher",  status: "active", hireDate: "2024-02-26" },
];

export const certs = [
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
