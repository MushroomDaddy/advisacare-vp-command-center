import { createContext, useContext, useState, type ReactNode } from 'react';

// --- Types ---
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
  createdAt: string;
}

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
  phone: string;
}

export interface ComplianceItem {
  id: string;
  staffId: string;
  staffName: string;
  itemType: 'RN License' | 'LPN License' | 'CNA License' | 'CPR Certification' | 'Background Check' | 'Drug Screen' | 'OSHA Training' | 'Confidentiality Ack';
  status: 'Compliant' | 'Due Soon' | 'Expired';
  expiryDate: string;
  lastCompleted: string;
}

export interface FieldVisit {
  id: string;
  patientInitials: string;
  staffId: string;
  staffName: string;
  time: string;
  address: string;
  serviceType: string;
  checklist: { task: string; completed: boolean }[];
  suppliesNeeded: string[];
  documentationStatus: 'Complete' | 'Pending' | 'Overdue';
  notes: string;
}

export interface QualityItem {
  id: string;
  type: 'OASIS Due' | 'QA Review' | 'Readmission Follow-up' | 'Hospice Comfort' | 'CAHPS Follow-up' | 'Missed Visit' | 'Late Note';
  patientInitials: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Complete';
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
}

export interface ReferralPartner {
  id: string;
  name: string;
  type: 'Hospital' | 'Physician' | 'Discharge Planner' | 'Case Manager' | 'Attorney';
  volume: number;
  avgTimeToSOC: string;
  lostReasons: string[];
  lastFollowUp: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: 'VP' | 'Intake Coordinator' | 'Scheduler' | 'Field Staff' | 'Compliance Admin';
  action: string;
  recordType: 'Referral' | 'Staff' | 'Compliance' | 'Quality' | 'Partner';
  recordId: string;
  details: string;
}

// --- Seed Data ---
const seedReferrals: Referral[] = [
  { id: '1', source: 'Mercy Hospital', patientInitials: 'J.D.', serviceType: 'Home Health', urgency: 'Immediate', dischargeFacility: 'Mercy Main', dischargeDate: '2026-05-18', physicianOrders: 'Missing', insuranceStatus: 'Pending', documentsUploaded: 2, assignedCoordinator: 'Sarah L.', stage: 'Missing Docs', missingItems: ['Physician Orders', 'Discharge Summary'], createdAt: '2026-05-17T08:00:00Z' },
  { id: '2', source: 'St. Jude Medical', patientInitials: 'M.S.', serviceType: 'Hospice', urgency: 'Urgent 24-48 hours', dischargeFacility: 'St. Jude South', dischargeDate: '2026-05-17', physicianOrders: 'Available', insuranceStatus: 'Verified', documentsUploaded: 5, assignedCoordinator: 'Mike R.', stage: 'Scheduled', missingItems: [], createdAt: '2026-05-16T10:30:00Z' },
  { id: '3', source: 'Dr. Smith Clinic', patientInitials: 'R.T.', serviceType: 'Therapy', urgency: 'Routine', dischargeFacility: 'Regional General', dischargeDate: '2026-05-20', physicianOrders: 'Pending', insuranceStatus: 'Verified', documentsUploaded: 3, assignedCoordinator: 'Emily T.', stage: 'Eligibility', missingItems: ['Lab Results'], createdAt: '2026-05-15T14:20:00Z' },
  { id: '4', source: 'Regional Rehab', patientInitials: 'L.K.', serviceType: 'Catastrophic Injury Care', urgency: 'Immediate', dischargeFacility: 'Lakeside Medical', dischargeDate: '2026-05-18', physicianOrders: 'Available', insuranceStatus: 'Pending', documentsUploaded: 4, assignedCoordinator: 'James K.', stage: 'Staffing', missingItems: [], createdAt: '2026-05-17T16:45:00Z' },
  { id: '5', source: 'Attorney Miller', patientInitials: 'P.W.', serviceType: 'Personal Care', urgency: 'Routine', dischargeFacility: 'City Hospital', dischargeDate: '2026-05-22', physicianOrders: 'Available', insuranceStatus: 'Denied', documentsUploaded: 5, assignedCoordinator: 'Sarah L.', stage: 'Declined', missingItems: [], createdAt: '2026-05-14T09:15:00Z' },
  { id: '6', source: 'Lakeside Medical', patientInitials: 'A.B.', serviceType: 'Home Health', urgency: 'Urgent 24-48 hours', dischargeFacility: 'Lakeside Medical', dischargeDate: '2026-05-19', physicianOrders: 'Available', insuranceStatus: 'Verified', documentsUploaded: 4, assignedCoordinator: 'Mike R.', stage: 'Started', missingItems: [], createdAt: '2026-05-16T11:00:00Z' },
  { id: '7', source: 'Mercy Hospital', patientInitials: 'C.D.', serviceType: 'Hospice', urgency: 'Immediate', dischargeFacility: 'Mercy Main', dischargeDate: '2026-05-18', physicianOrders: 'Missing', insuranceStatus: 'Verified', documentsUploaded: 1, assignedCoordinator: 'Emily T.', stage: 'Missing Docs', missingItems: ['Physician Orders', 'Power of Attorney'], createdAt: '2026-05-17T07:30:00Z' },
  { id: '8', source: 'St. Jude Medical', patientInitials: 'E.F.', serviceType: 'Therapy', urgency: 'Routine', dischargeFacility: 'St. Jude South', dischargeDate: '2026-05-21', physicianOrders: 'Available', insuranceStatus: 'Verified', documentsUploaded: 5, assignedCoordinator: 'James K.', stage: 'Scheduled', missingItems: [], createdAt: '2026-05-15T13:45:00Z' },
];

const seedStaff: StaffMember[] = [
  { id: 's1', name: 'Sarah Mitchell', role: 'RN', specialties: ['Hospice', 'Wound Care', 'Home Health'], availability: 'Available', cprExpiry: '2026-08-15', licenseExpiry: '2027-03-01', todayVisits: 4, overtimeRisk: 'Low', location: 'Downtown', phone: '555-0101' },
  { id: 's2', name: 'James Wilson', role: 'LPN', specialties: ['Personal Care', 'Geriatrics'], availability: 'Available', cprExpiry: '2026-06-30', licenseExpiry: '2026-12-15', todayVisits: 6, overtimeRisk: 'Medium', location: 'Northside', phone: '555-0102' },
  { id: 's3', name: 'Maria Garcia', role: 'HHA', specialties: ['Hospice', 'Pediatrics'], availability: 'Partially', cprExpiry: '2026-09-20', licenseExpiry: '2027-05-10', todayVisits: 3, overtimeRisk: 'Low', location: 'Westside', phone: '555-0103' },
  { id: 's4', name: 'Robert Chen', role: 'PT', specialties: ['Therapy', 'Catastrophic Injury'], availability: 'Available', cprExpiry: '2027-01-15', licenseExpiry: '2027-08-20', todayVisits: 5, overtimeRisk: 'Medium', location: 'Eastside', phone: '555-0104' },
  { id: 's5', name: 'Emily Davis', role: 'RN', specialties: ['Wound Care', 'Vent/Trach', 'SCI'], availability: 'Unavailable', cprExpiry: '2026-05-20', licenseExpiry: '2026-11-30', todayVisits: 0, overtimeRisk: 'Low', location: 'Downtown', phone: '555-0105' },
  { id: 's6', name: 'Michael Brown', role: 'CNA', specialties: ['Hospice', 'Geriatrics'], availability: 'Available', cprExpiry: '2026-12-01', licenseExpiry: '2027-06-15', todayVisits: 7, overtimeRisk: 'High', location: 'Northside', phone: '555-0106' },
  { id: 's7', name: 'Lisa Johnson', role: 'OT', specialties: ['Therapy', 'Pediatrics', 'SCI'], availability: 'Available', cprExpiry: '2027-03-10', licenseExpiry: '2027-09-25', todayVisits: 4, overtimeRisk: 'Low', location: 'Westside', phone: '555-0107' },
  { id: 's8', name: 'David Lee', role: 'ST', specialties: ['Therapy', 'Pediatrics'], availability: 'Partially', cprExpiry: '2026-07-15', licenseExpiry: '2026-10-30', todayVisits: 5, overtimeRisk: 'Medium', location: 'Eastside', phone: '555-0108' },
];

const seedCompliance: ComplianceItem[] = [
  { id: 'c1', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'RN License', status: 'Compliant', expiryDate: '2027-03-01', lastCompleted: '2026-03-01' },
  { id: 'c2', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'CPR Certification', status: 'Compliant', expiryDate: '2026-08-15', lastCompleted: '2025-08-15' },
  { id: 'c3', staffId: 's5', staffName: 'Emily Davis', itemType: 'RN License', status: 'Compliant', expiryDate: '2026-11-30', lastCompleted: '2025-11-30' },
  { id: 'c4', staffId: 's5', staffName: 'Emily Davis', itemType: 'CPR Certification', status: 'Due Soon', expiryDate: '2026-05-20', lastCompleted: '2025-05-20' },
  { id: 'c5', staffId: 's2', staffName: 'James Wilson', itemType: 'LPN License', status: 'Due Soon', expiryDate: '2026-12-15', lastCompleted: '2024-12-15' },
  { id: 'c6', staffId: 's2', staffName: 'James Wilson', itemType: 'CPR Certification', status: 'Due Soon', expiryDate: '2026-06-30', lastCompleted: '2025-06-30' },
  { id: 'c7', staffId: 's6', staffName: 'Michael Brown', itemType: 'CNA License', status: 'Compliant', expiryDate: '2027-06-15', lastCompleted: '2026-06-15' },
  { id: 'c8', staffId: 's6', staffName: 'Michael Brown', itemType: 'CPR Certification', status: 'Compliant', expiryDate: '2026-12-01', lastCompleted: '2025-12-01' },
  { id: 'c9', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'Background Check', status: 'Compliant', expiryDate: '2027-01-01', lastCompleted: '2026-01-01' },
  { id: 'c10', staffId: 's2', staffName: 'James Wilson', itemType: 'Drug Screen', status: 'Compliant', expiryDate: '2026-10-01', lastCompleted: '2026-04-01' },
];

const seedVisits: FieldVisit[] = [
  { id: 'v1', patientInitials: 'J.D.', staffId: 's1', staffName: 'Sarah Mitchell', time: '09:00', address: '123 Main St', serviceType: 'Home Health', checklist: [{ task: 'Vitals Check', completed: true }, { task: 'Medication Review', completed: true }, { task: 'Wound Assessment', completed: false }, { task: 'Patient Education', completed: false }], suppliesNeeded: ['Gloves', 'Bandages', 'Wound Dressings'], documentationStatus: 'Pending', notes: '' },
  { id: 'v2', patientInitials: 'M.S.', staffId: 's1', staffName: 'Sarah Mitchell', time: '11:00', address: '456 Oak Ave', serviceType: 'Hospice', checklist: [{ task: 'Vitals Check', completed: true }, { task: 'Comfort Assessment', completed: true }, { task: 'Family Support', completed: false }, { task: 'Medication Review', completed: true }], suppliesNeeded: ['Gloves', 'Oxygen Tank'], documentationStatus: 'Complete', notes: 'Patient comfortable, family doing well' },
  { id: 'v3', patientInitials: 'R.T.', staffId: 's4', staffName: 'Robert Chen', time: '10:00', address: '789 Pine Rd', serviceType: 'Therapy', checklist: [{ task: 'Range of Motion', completed: false }, { task: 'Strength Assessment', completed: false }, { task: 'Home Exercise Plan', completed: false }], suppliesNeeded: ['Therapy Bands', 'Assessment Forms'], documentationStatus: 'Overdue', notes: '' },
  { id: 'v4', patientInitials: 'A.B.', staffId: 's2', staffName: 'James Wilson', time: '13:00', address: '321 Elm St', serviceType: 'Home Health', checklist: [{ task: 'Vitals Check', completed: true }, { task: 'Medication Review', completed: true }, { task: 'Wound Assessment', completed: true }], suppliesNeeded: ['Gloves', 'Bandages'], documentationStatus: 'Complete', notes: 'Wound healing well' },
  { id: 'v5', patientInitials: 'L.K.', staffId: 's3', staffName: 'Maria Garcia', time: '14:30', address: '654 Maple Dr', serviceType: 'Catastrophic Injury Care', checklist: [{ task: 'Vitals Check', completed: false }, { task: 'Mobility Assessment', completed: false }, { task: 'Equipment Check', completed: false }], suppliesNeeded: ['Gloves', 'Syringes', 'Vent Supplies'], documentationStatus: 'Pending', notes: '' },
];

const seedQuality: QualityItem[] = [
  { id: 'q1', type: 'OASIS Due', patientInitials: 'A.B.', dueDate: '2026-05-20', status: 'Open', priority: 'High', assignedTo: 'Sarah L.' },
  { id: 'q2', type: 'QA Review', patientInitials: 'M.S.', dueDate: '2026-05-19', status: 'In Progress', priority: 'Medium', assignedTo: 'Mike R.' },
  { id: 'q3', type: 'Readmission Follow-up', patientInitials: 'R.T.', dueDate: '2026-05-21', status: 'Open', priority: 'High', assignedTo: 'Emily T.' },
  { id: 'q4', type: 'Hospice Comfort', patientInitials: 'M.S.', dueDate: '2026-05-18', status: 'Open', priority: 'High', assignedTo: 'Mike R.' },
  { id: 'q5', type: 'CAHPS Follow-up', patientInitials: 'J.D.', dueDate: '2026-05-25', status: 'Open', priority: 'Medium', assignedTo: 'Sarah L.' },
  { id: 'q6', type: 'Missed Visit', patientInitials: 'R.T.', dueDate: '2026-05-18', status: 'Open', priority: 'High', assignedTo: 'James K.' },
  { id: 'q7', type: 'Late Note', patientInitials: 'L.K.', dueDate: '2026-05-18', status: 'In Progress', priority: 'High', assignedTo: 'James K.' },
];

const seedPartners: ReferralPartner[] = [
  { id: 'p1', name: 'Mercy Hospital', type: 'Hospital', volume: 45, avgTimeToSOC: '2.1 days', lostReasons: ['Insurance Denial', 'Staff Shortage'], lastFollowUp: '2026-05-15', notes: 'Excellent relationship, fast discharge process', contactName: 'Dr. Anderson', contactEmail: 'd.anderson@mercy.com', contactPhone: '555-1001' },
  { id: 'p2', name: 'St. Jude Medical', type: 'Hospital', volume: 38, avgTimeToSOC: '2.8 days', lostReasons: ['Patient Declined'], lastFollowUp: '2026-05-16', notes: 'Consistent volume, good communication', contactName: 'Lisa Thompson', contactEmail: 'l.thompson@stjude.com', contactPhone: '555-1002' },
  { id: 'p3', name: 'Dr. Smith Clinic', type: 'Physician', volume: 12, avgTimeToSOC: '1.5 days', lostReasons: [], lastFollowUp: '2026-05-17', notes: 'Primary care, quick referrals', contactName: 'Dr. Smith', contactEmail: 'j.smith@smithclinic.com', contactPhone: '555-1003' },
  { id: 'p4', name: 'Regional Rehab', type: 'Hospital', volume: 22, avgTimeToSOC: '3.2 days', lostReasons: ['Service Not Available'], lastFollowUp: '2026-05-14', notes: 'Specializes in catastrophic injury', contactName: 'Mark Davis', contactEmail: 'm.davis@regionalrehab.com', contactPhone: '555-1004' },
  { id: 'p5', name: 'Attorney Miller', type: 'Attorney', volume: 8, avgTimeToSOC: '4.5 days', lostReasons: ['Insurance Denial'], lastFollowUp: '2026-05-10', notes: 'Legal cases, personal injury', contactName: 'John Miller', contactEmail: 'j.miller@millerglaw.com', contactPhone: '555-1005' },
];

// --- Context/State ---
interface AppState {
  referrals: Referral[];
  staff: StaffMember[];
  compliance: ComplianceItem[];
  visits: FieldVisit[];
  quality: QualityItem[];
  partners: ReferralPartner[];
  auditLog: AuditEntry[];
  currentUser: { name: string; role: 'VP' | 'Intake Coordinator' | 'Scheduler' | 'Field Staff' | 'Compliance Admin' };
}

const initialState: AppState = {
  referrals: seedReferrals,
  staff: seedStaff,
  compliance: seedCompliance,
  visits: seedVisits,
  quality: seedQuality,
  partners: seedPartners,
  auditLog: [
    { id: 'a1', timestamp: '2026-05-18T05:30:00Z', user: 'Sarah L.', role: 'Intake Coordinator', action: 'Created', recordType: 'Referral', recordId: '1', details: 'New referral J.D. from Mercy Hospital' },
    { id: 'a2', timestamp: '2026-05-18T05:45:00Z', user: 'Mike R.', role: 'Scheduler', action: 'Updated', recordType: 'Referral', recordId: '2', details: 'Stage changed to Scheduled' },
    { id: 'a3', timestamp: '2026-05-18T06:00:00Z', user: 'Sarah Mitchell', role: 'Field Staff', action: 'Completed', recordType: 'Quality', recordId: 'q2', details: 'QA Review for M.S. completed' },
    { id: 'a4', timestamp: '2026-05-17T14:20:00Z', user: 'Emily T.', role: 'Intake Coordinator', action: 'Edited', recordType: 'Referral', recordId: '3', details: 'Updated insurance status to Verified' },
    { id: 'a5', timestamp: '2026-05-17T16:45:00Z', user: 'James K.', role: 'Intake Coordinator', action: 'Created', recordType: 'Referral', recordId: '4', details: 'New referral L.K. from Regional Rehab' },
  ],
  currentUser: { name: 'VP User', role: 'VP' },
};

interface AppContextType {
  state: AppState;
  updateReferralStage: (id: string, stage: Referral['stage']) => void;
  updateVisitChecklist: (visitId: string, taskIndex: number) => void;
  updateQualityStatus: (id: string, status: QualityItem['status']) => void;
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const updateReferralStage = (id: string, stage: Referral['stage']) => {
    setState(prev => ({
      ...prev,
      referrals: prev.referrals.map(r => r.id === id ? { ...r, stage } : r),
    }));
  };

  const updateVisitChecklist = (visitId: string, taskIndex: number) => {
    setState(prev => ({
      ...prev,
      visits: prev.visits.map(v => 
        v.id === visitId 
          ? { ...v, checklist: v.checklist.map((item, idx) => idx === taskIndex ? { ...item, completed: !item.completed } : item) }
          : v
      ),
    }));
  };

  const updateQualityStatus = (id: string, status: QualityItem['status']) => {
    setState(prev => ({
      ...prev,
      quality: prev.quality.map(q => q.id === id ? { ...q, status } : q),
    }));
  };

  const addAuditEntry = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, auditLog: [newEntry, ...prev.auditLog] }));
  };

  return (
    <AppContext.Provider value={{ state, updateReferralStage, updateVisitChecklist, updateQualityStatus, addAuditEntry }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}
