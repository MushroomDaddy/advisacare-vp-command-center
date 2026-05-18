// --- Types for AdvisaCare VP Command Center ---

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
  checklist: VisitTask[];
  suppliesNeeded: string[];
  documentationStatus: 'Complete' | 'Pending' | 'Overdue';
  notes: string;
}

export interface VisitTask {
  task: string;
  completed: boolean;
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
  recordType: 'Referral' | 'Staff' | 'Compliance' | 'Visit' | 'Quality' | 'Partner';
  recordId: string;
  details: string;
}

export interface AppState {
  referrals: Referral[];
  staff: StaffMember[];
  compliance: ComplianceItem[];
  visits: FieldVisit[];
  quality: QualityItem[];
  partners: ReferralPartner[];
  auditLog: AuditEntry[];
  currentUser: { name: string; role: 'VP' | 'Intake Coordinator' | 'Scheduler' | 'Field Staff' | 'Compliance Admin' };
}

export type ReferralStage = Referral['stage'];
export type UrgencyLevel = Referral['urgency'];
export type ComplianceStatus = ComplianceItem['status'];
export type QualityStatus = QualityItem['status'];
export type StaffRole = StaffMember['role'];
export type UserRole = AppState['currentUser']['role'];
