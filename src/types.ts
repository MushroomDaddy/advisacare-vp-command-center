// --- Types for AdvisaCare VP Command Center ---

// ==================== Referrals ====================

export interface ReferralDocument {
  name: string;
  type: 'Face Sheet' | 'Insurance Card' | 'Physician Orders' | 'Discharge Summary' | 'Diagnosis/Reason' | 'Contact Info' | 'Other';
  uploaded: boolean;
  uploadedAt?: string;
}

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
  documents: ReferralDocument[];
  assignedCoordinator: string;
  assignedOwner: string;
  nextFollowUpDate: string;
  stage: 'New' | 'Missing Docs' | 'Eligibility' | 'Staffing' | 'Scheduled' | 'Started' | 'Declined';
  missingItems: string[];
  createdAt: string;
  declineReason?: string;
  lostReason?: string;
  slaDeadline: string;
  branch: string;
}

// ==================== Staff ====================

export interface StaffMember {
  id: string;
  name: string;
  role: 'RN' | 'LPN' | 'HHA' | 'CNA' | 'PT' | 'OT' | 'ST';
  specialties: string[];
  availability: 'Available' | 'Partially' | 'Unavailable';
  cprExpiry: string;
  licenseExpiry: string;
  todayVisits: number;
  maxVisits: number;
  overtimeRisk: 'Low' | 'Medium' | 'High';
  location: string;
  phone: string;
  shiftStatus: 'Confirmed' | 'Unconfirmed' | 'Declined' | 'Off';
}

// ==================== Compliance ====================

export interface ComplianceItem {
  id: string;
  staffId: string;
  staffName: string;
  itemType: 'RN License' | 'LPN License' | 'CNA License' | 'CPR Certification' | 'Background Check' | 'Drug Screen' | 'OSHA Training' | 'Confidentiality Ack';
  status: 'Compliant' | 'Due Soon' | 'Critical Soon' | 'Expired';
  expiryDate: string;
  lastCompleted: string;
}

// ==================== Field Visits ====================

export interface EVVData {
  clockIn?: string;
  clockOut?: string;
  gpsLatitude?: string;
  gpsLongitude?: string;
  gpsAddress?: string;
  patientSignature?: boolean;
  caregiverSignature?: boolean;
  exceptionReason?: string;
  syncStatus: 'Synced' | 'Pending' | 'Failed';
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
  visitStatus: 'Scheduled' | 'In Progress' | 'Completed' | 'Missed';
  evv: EVVData;
}

export interface VisitTask {
  task: string;
  completed: boolean;
}

// ==================== Quality ====================

export type QualityCategory = 'Home Health' | 'Hospice' | 'General QA';

export interface OASISAssessment {
  id: string;
  patientInitials: string;
  type: 'SOC' | 'Recertification' | 'ROC' | 'Discharge';
  dueDate: string;
  status: 'Due' | 'Submitted' | 'Accepted' | 'Rejected';
  assignedTo: string;
  rejectionReason?: string;
}

export interface HOPEAssessment {
  id: string;
  patientInitials: string;
  type: 'HOPE Admission' | 'HOPE Update Visit 1' | 'HOPE Update Visit 2' | 'HOPE Discharge';
  dueDate: string;
  status: 'Due' | 'Submitted' | 'Accepted' | 'Rejected';
  iqiesStatus: 'Not Submitted' | 'Submitted' | 'Accepted' | 'Error';
  assignedTo: string;
}

export interface QualityItem {
  id: string;
  type: 'OASIS Due' | 'QA Review' | 'Readmission Follow-up' | 'Hospice Comfort' | 'CAHPS Follow-up' | 'Missed Visit' | 'Late Note' | 'Incident';
  category: QualityCategory;
  patientInitials: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Complete';
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
  reviewerName?: string;
  reviewDueDate?: string;
}

// ==================== Partners ====================

export interface PartnerTimelineEntry {
  date: string;
  action: string;
  user: string;
}

export interface ReferralPartner {
  id: string;
  name: string;
  type: 'Hospital' | 'Physician' | 'Discharge Planner' | 'Case Manager' | 'Attorney';
  volume: number;
  acceptedReferrals: number;
  declinedReferrals: number;
  avgTimeToSOC: string;
  lostReasons: string[];
  lastFollowUp: string;
  nextFollowUpReminder: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  timeline: PartnerTimelineEntry[];
}

// ==================== Audit ====================

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: 'VP' | 'Intake Coordinator' | 'Scheduler' | 'Field Staff' | 'Compliance Admin';
  action: string;
  recordType: 'Referral' | 'Staff' | 'Compliance' | 'Visit' | 'Quality' | 'Partner' | 'System' | 'User';
  recordId: string;
  details: string;
  before?: string;
  after?: string;
}

// ==================== Alerts ====================

export interface AlertItem {
  id: string;
  type: 'escalation' | 'incident' | 'compliance' | 'sla' | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  details: string;
  timestamp: string;
  acknowledged: boolean;
  sourceRecordType?: string;
  sourceRecordId?: string;
}

// ==================== App State ====================

export interface AppState {
  referrals: Referral[];
  staff: StaffMember[];
  compliance: ComplianceItem[];
  visits: FieldVisit[];
  quality: QualityItem[];
  oasisAssessments: OASISAssessment[];
  hopeAssessments: HOPEAssessment[];
  partners: ReferralPartner[];
  auditLog: AuditEntry[];
  alerts: AlertItem[];
  currentUser: {
    name: string;
    role: UserRole;
  };
  lastRefreshed: string;
}

// ==================== RBAC ====================

export type CRUDAction = 'view' | 'edit' | 'create' | 'delete' | 'export';

export interface PermissionEntry {
  resource: string;
  actions: CRUDAction[];
}

// ==================== Convenience Aliases ====================

export type ReferralStage = Referral['stage'];
export type UrgencyLevel = Referral['urgency'];
export type ComplianceStatus = ComplianceItem['status'];
export type QualityStatus = QualityItem['status'];
export type StaffRole = StaffMember['role'];
export type UserRole = 'VP' | 'Intake Coordinator' | 'Scheduler' | 'Field Staff' | 'Compliance Admin';
