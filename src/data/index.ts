import { faker } from '@faker-js/faker';

// --- Referrals ---
export interface Referral {
  id: string;
  source: string;
  patientInitials: string;
  serviceType: 'Home Health' | 'Hospice' | 'Personal Care' | 'Therapy' | 'Catastrophic Injury Care';
  urgency: 'Routine' | 'Urgent 24-48 hours' | 'Immediate';
  dischargeFacility: string;
  dischargeDate: string;
  physicianOrders: 'Available' | 'Pending' | 'Missing';
  insuranceStatus: 'Verified' | 'Pending' | 'Denied';
  documentsUploaded: number;
  assignedCoordinator: string;
  stage: 'New' | 'Missing Docs' | 'Eligibility' | 'Staffing' | 'Scheduled' | 'Started' | 'Declined';
  missingItems: string[];
}

export const generateReferrals = (count: number = 25): Referral[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    source: faker.helpers.arrayElement(['Mercy Hospital', 'St. Jude Medical', 'Dr. Smith Clinic', 'Regional Rehab', 'Attorney Miller', 'Lakeside Medical']),
    patientInitials: faker.helpers.arrayElement(['J.D.', 'M.S.', 'R.T.', 'L.K.', 'P.W.', 'A.B.', 'C.D.', 'E.F.', 'G.H.', 'I.J.']),
    serviceType: faker.helpers.arrayElement(['Home Health', 'Hospice', 'Personal Care', 'Therapy', 'Catastrophic Injury Care'] as const),
    urgency: faker.helpers.arrayElement(['Routine', 'Urgent 24-48 hours', 'Immediate'] as const),
    dischargeFacility: faker.helpers.arrayElement(['Mercy Main', 'St. Jude South', 'Regional General', 'Lakeside Medical', 'City Hospital']),
    dischargeDate: faker.date.recent({ days: 7 }).toISOString().split('T')[0],
    physicianOrders: faker.helpers.arrayElement(['Available', 'Pending', 'Missing'] as const),
    insuranceStatus: faker.helpers.arrayElement(['Verified', 'Pending', 'Denied'] as const),
    documentsUploaded: faker.number.int({ min: 0, max: 5 }),
    assignedCoordinator: faker.helpers.arrayElement(['Sarah L.', 'Mike R.', 'Emily T.', 'James K.', 'Anna P.']),
    stage: faker.helpers.arrayElement(['New', 'Missing Docs', 'Eligibility', 'Staffing', 'Scheduled', 'Started', 'Declined'] as const),
    missingItems: faker.helpers.arrayElements(['Physician Orders', 'Insurance Card', 'Discharge Summary', 'Power of Attorney', 'Lab Results', 'Vaccination Record'], { min: 0, max: 3 }),
  }));
};

// --- Staff ---
export interface StaffMember {
  id: string;
  name: string;
  role: 'RN' | 'LPN' | 'HHA' | 'CNA' | 'PT' | 'OT' | 'ST';
  specialties: string[];
  availability: 'Available' | 'Partially' | 'Unavailable';
  cprExpiry: string;
  licenseExpiry: string;
  todayVisits: number;
  overtimeRisk: 'Low' | 'Medium' | 'High';
  location: string;
}

export const generateStaff = (count: number = 20): StaffMember[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement(['RN', 'LPN', 'HHA', 'CNA', 'PT', 'OT', 'ST'] as const),
    specialties: faker.helpers.arrayElements(['Hospice', 'TBI', 'SCI', 'Wound Care', 'Vent/Trach', 'Pediatrics', 'Geriatrics', 'Catastrophic Injury'], { min: 1, max: 3 }),
    availability: faker.helpers.arrayElement(['Available', 'Partially', 'Unavailable'] as const),
    cprExpiry: faker.date.soon({ days: faker.number.int({ min: 30, max: 365 }) }).toISOString().split('T')[0],
    licenseExpiry: faker.date.soon({ days: faker.number.int({ min: 60, max: 730 }) }).toISOString().split('T')[0],
    todayVisits: faker.number.int({ min: 0, max: 8 }),
    overtimeRisk: faker.helpers.arrayElement(['Low', 'Medium', 'High'] as const),
    location: faker.location.city(),
  }));
};

// --- Compliance ---
export interface ComplianceItem {
  id: string;
  staffName: string;
  itemType: 'RN License' | 'LPN License' | 'CPR Certification' | 'Background Check' | 'Drug Screen' | 'OSHA Training' | 'Confidentiality Ack';
  status: 'Compliant' | 'Due Soon' | 'Expired';
  expiryDate: string;
  lastCompleted: string;
}

export const generateCompliance = (staffList: StaffMember[]): ComplianceItem[] => {
  const items: ComplianceItem[] = [];
  staffList.forEach(staff => {
    const baseDate = faker.date.soon({ days: 90 });
    items.push({
      id: faker.string.uuid(),
      staffName: staff.name,
      itemType: 'RN License',
      status: faker.helpers.arrayElement(['Compliant', 'Due Soon', 'Expired'] as const),
      expiryDate: baseDate.toISOString().split('T')[0],
      lastCompleted: faker.date.past({ years: 1 }).toISOString().split('T')[0],
    });
    items.push({
      id: faker.string.uuid(),
      staffName: staff.name,
      itemType: 'CPR Certification',
      status: faker.helpers.arrayElement(['Compliant', 'Due Soon', 'Expired'] as const),
      expiryDate: faker.date.soon({ days: 60 }).toISOString().split('T')[0],
      lastCompleted: faker.date.past({ years: 1 }).toISOString().split('T')[0],
    });
  });
  return items;
};

// --- Field Visits ---
export interface FieldVisit {
  id: string;
  patientInitials: string;
  staffName: string;
  time: string;
  address: string;
  serviceType: string;
  checklist: { task: string; completed: boolean }[];
  suppliesNeeded: string[];
  documentationStatus: 'Complete' | 'Pending' | 'Overdue';
}

export const generateFieldVisits = (count: number = 10): FieldVisit[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    patientInitials: faker.helpers.arrayElement(['J.D.', 'M.S.', 'R.T.', 'L.K.', 'P.W.']),
    staffName: faker.person.fullName(),
    time: `${faker.number.int({ min: 8, max: 17 })}:00`,
    address: faker.location.streetAddress(),
    serviceType: faker.helpers.arrayElement(['Home Health', 'Hospice', 'Personal Care', 'Therapy']),
    checklist: [
      { task: 'Vitals Check', completed: faker.datatype.boolean() },
      { task: 'Medication Review', completed: faker.datatype.boolean() },
      { task: 'Wound Assessment', completed: faker.datatype.boolean() },
      { task: 'Patient Education', completed: faker.datatype.boolean() },
    ],
    suppliesNeeded: faker.helpers.arrayElements(['Gloves', 'Bandages', 'Syringes', 'Oxygen Tank', 'Wound Dressings'], { min: 1, max: 3 }),
    documentationStatus: faker.helpers.arrayElement(['Complete', 'Pending', 'Overdue'] as const),
  }));
};

// --- Quality ---
export interface QualityItem {
  id: string;
  type: 'OASIS Due' | 'QA Review' | 'Readmission Follow-up' | 'Hospice Comfort' | 'CAHPS Follow-up' | 'Missed Visit' | 'Late Note';
  patientInitials: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Complete';
  priority: 'High' | 'Medium' | 'Low';
}

export const generateQualityItems = (count: number = 15): QualityItem[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['OASIS Due', 'QA Review', 'Readmission Follow-up', 'Hospice Comfort', 'CAHPS Follow-up', 'Missed Visit', 'Late Note'] as const),
    patientInitials: faker.helpers.arrayElement(['J.D.', 'M.S.', 'R.T.', 'L.K.', 'P.W.', 'A.B.']),
    dueDate: faker.date.soon({ days: 14 }).toISOString().split('T')[0],
    status: faker.helpers.arrayElement(['Open', 'In Progress', 'Complete'] as const),
    priority: faker.helpers.arrayElement(['High', 'Medium', 'Low'] as const),
  }));
};

// --- Referral Partners ---
export interface ReferralPartner {
  id: string;
  name: string;
  type: 'Hospital' | 'Physician' | 'Discharge Planner' | 'Case Manager' | 'Attorney';
  volume: number;
  avgTimeToSOC: string;
  lostReasons: string[];
  lastFollowUp: string;
  notes: string;
}

export const generatePartners = (count: number = 10): ReferralPartner[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    type: faker.helpers.arrayElement(['Hospital', 'Physician', 'Discharge Planner', 'Case Manager', 'Attorney'] as const),
    volume: faker.number.int({ min: 5, max: 50 }),
    avgTimeToSOC: `${faker.number.int({ min: 1, max: 5 })} days`,
    lostReasons: faker.helpers.arrayElements(['Insurance Denial', 'Staff Shortage', 'Patient Declined', 'Service Not Available'], { min: 0, max: 2 }),
    lastFollowUp: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
    notes: faker.lorem.sentence(),
  }));
};

// --- Audit Log ---
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: 'VP' | 'Intake Coordinator' | 'Scheduler' | 'Field Staff' | 'Compliance Admin';
  action: string;
  recordType: 'Referral' | 'Staff' | 'Compliance' | 'Quality' | 'Partner';
  recordId: string;
}

export const generateAuditLog = (count: number = 30): AuditEntry[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    user: faker.person.fullName(),
    role: faker.helpers.arrayElement(['VP', 'Intake Coordinator', 'Scheduler', 'Field Staff', 'Compliance Admin'] as const),
    action: faker.helpers.arrayElement(['Viewed', 'Edited', 'Created', 'Deleted', 'Exported']),
    recordType: faker.helpers.arrayElement(['Referral', 'Staff', 'Compliance', 'Quality', 'Partner'] as const),
    recordId: faker.string.uuid().substring(0, 8),
  }));
};

// Export pre-generated data
export const fakeReferrals = generateReferrals(25);
export const fakeStaff = generateStaff(20);
export const fakeCompliance = generateCompliance(fakeStaff);
export const fakeFieldVisits = generateFieldVisits(10);
export const fakeQualityItems = generateQualityItems(15);
export const fakePartners = generatePartners(10);
export const fakeAuditLog = generateAuditLog(30);
