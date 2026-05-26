// --- Types for AdvisaCare VP Command Center ---

// --- Timeline & Audit ---
export interface TimelineEntry {
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  recordType: RecordType;
  recordId: string;
  details: string;
  before?: string;
  after?: string;
}

export type RecordType = 'Referral' | 'Staff' | 'Compliance' | 'Visit' | 'Quality' | 'Partner' | 'Shift' | 'Document' | 'Alert' | 'System';

// --- Alerts ---
export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type AlertType =
  | 'Expired Credential'
  | 'Critical Soon Credential'
  | 'Missing Documents'
  | 'SLA Risk'
  | 'SLA Breach'
  | 'Open Shift'
  | 'Catastrophic Uncovered Shift'
  | 'EVV Exception'
  | 'OASIS Rejected'
  | 'HOPE Overdue'
  | 'Partner Follow-up Overdue'
  | 'Urgent Referral'
  | 'Staffing'
  | 'Quality'
  | 'Incident';

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  sourceRecordType: RecordType;
  sourceRecordId: string;
  acknowledged: boolean;
  resolved: boolean;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  /** Set when reconcileAlerts reactivates a previously-resolved alert because the underlying problem still exists */
  reactivatedAt?: string;
  /** Optional source-record metadata for richer deep linking (e.g. caseId for catastrophic shifts) */
  metadata?: {
    caseId?: string;
    [key: string]: string | undefined;
  };
}

// --- Documents ---
export type DocumentCategory = 'Physician Orders' | 'Discharge Summary' | 'Insurance Card' | 'Lab Results' | 'Power of Attorney' | 'Consent Form' | 'Other';

export interface DemoDocument {
  id: string;
  referralId: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  category: DocumentCategory;
}

// --- Referrals ---
export type ReferralStage = 'New' | 'Missing Docs' | 'Eligibility' | 'Staffing' | 'Scheduled' | 'Started' | 'Declined';

export type ReferralReadiness = 'Missing Docs' | 'Ready for Eligibility' | 'Ready for Staffing' | 'Ready for SOC';

export interface StageTimestamps {
  'New'?: string;
  'Missing Docs'?: string;
  'Eligibility'?: string;
  'Staffing'?: string;
  'Scheduled'?: string;
  'Started'?: string;
  'Declined'?: string;
}

export interface Referral {
  id: string;
  source: string;
  patientInitials: string;
  serviceType: ServiceType;
  urgency: UrgencyLevel;
  dischargeFacility: string;
  dischargeDate: string;
  physicianOrders: 'Available' | 'Pending' | 'Missing';
  insuranceStatus: 'Verified' | 'Pending' | 'Denied';
  documentsUploaded: number;
  assignedCoordinator: string;
  stage: ReferralStage;
  missingItems: string[];
  createdAt: string;
  stageTimestamps: StageTimestamps;
  declineReason?: string;
  assignedStaffId?: string;
  timeline: TimelineEntry[];
  /** Computed readiness based on documents and stage */
  readiness?: ReferralReadiness;
  /** SLA deadline as ISO datetime (e.g. 48h from creation for Immediate) */
  slaDeadline?: string;
  /** Whether SLA is at risk or breached */
  slaStatus?: 'OK' | 'Risk' | 'Breach';
}

export type ServiceType = 'Home Health' | 'Hospice' | 'Personal Care' | 'Therapy' | 'Catastrophic Injury Care';
export type UrgencyLevel = 'Routine' | 'Urgent 24-48 hours' | 'Immediate';

/** Required documents per service type */
export const REQUIRED_DOCUMENTS: Record<ServiceType, DocumentCategory[]> = {
  'Home Health': ['Physician Orders', 'Discharge Summary', 'Insurance Card'],
  'Hospice': ['Physician Orders', 'Discharge Summary', 'Insurance Card', 'Consent Form'],
  'Personal Care': ['Physician Orders', 'Insurance Card'],
  'Therapy': ['Physician Orders', 'Lab Results', 'Insurance Card'],
  'Catastrophic Injury Care': ['Physician Orders', 'Discharge Summary', 'Insurance Card', 'Consent Form'],
};

// --- Staff ---
export type StaffRole = 'RN' | 'LPN' | 'HHA' | 'CNA' | 'PT' | 'OT' | 'ST';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  specialties: string[];
  availability: 'Available' | 'Partially' | 'Unavailable';
  cprExpiry: string;
  licenseExpiry: string;
  todayVisits: number;
  overtimeRisk: 'Low' | 'Medium' | 'High';
  location: string;
  phone: string;
}

// --- Shifts ---
export type ShiftStatus = 'Open' | 'Offered' | 'Accepted' | 'Declined';

export interface Shift {
  id: string;
  referralId: string;
  patientInitials: string;
  serviceType: ServiceType;
  status: ShiftStatus;
  offeredTo?: string;
  offeredToName?: string;
  acceptedBy?: string;
  date: string;
  time?: string;
  location: string;
  notes: string;
  createdAt: string;
}

// --- Compliance ---
export type ComplianceCategory = 'Expired' | 'Critical Soon' | 'Due Soon' | 'Compliant';

export interface ComplianceItem {
  id: string;
  staffId: string;
  staffName: string;
  itemType: 'RN License' | 'LPN License' | 'CNA License' | 'CPR Certification' | 'Background Check' | 'Drug Screen' | 'OSHA Training' | 'Confidentiality Ack';
  /** Stored status — may be stale. Always recompute via getComplianceCategory(). */
  status: 'Compliant' | 'Due Soon' | 'Expired' | 'Critical Soon';
  expiryDate: string;
  lastCompleted: string;
  proofDocumentId?: string;
}

// --- Field Visits ---
export interface VisitTask {
  task: string;
  completed: boolean;
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
  clockIn?: string;
  clockOut?: string;
  evvStatus: 'Not Started' | 'Clocked In' | 'Clocked Out' | 'Exception';
  signatureCaptured: boolean;
  evvException?: string;
  timeline: TimelineEntry[];
  referralId?: string;
}

export interface OfflineQueueItem {
  id: string;
  visitId: string;
  action: string;
  data: string;
  createdAt: string;
  status: 'Pending' | 'Synced' | 'Failed';
}

// --- Quality ---
export type QualityType = 'OASIS Due' | 'OASIS Review' | 'QA Review' | 'Readmission Follow-up' | 'Hospice Comfort' | 'CAHPS Follow-up' | 'Missed Visit' | 'Late Note' | 'HOPE Assessment' | 'Incident';
export type QualityStatus = 'Open' | 'In Progress' | 'Resolved' | 'Rejected' | 'Submitted' | 'Accepted';

export interface QualityItem {
  id: string;
  type: QualityType;
  patientInitials: string;
  dueDate: string;
  status: QualityStatus;
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
  reviewNotes?: string;
  /** For OASIS items: score value for QAO calculation */
  oasisScore?: number;
}

// --- Referral Partners ---
export interface ReferralPartner {
  id: string;
  name: string;
  type: 'Hospital' | 'Physician' | 'Discharge Planner' | 'Case Manager' | 'Attorney' | 'Other';
  volume: number;
  conversionRate: number;
  declineRate: number;
  avgTimeToSOC: string;
  lostReasons: string[];
  lastFollowUp: string;
  nextFollowUp: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  riskLabel: 'Healthy' | 'At Risk' | 'Critical';
  timeline: TimelineEntry[];
  trendData: { month: string; volume: number }[];
}

// --- Catastrophic Care ---
export interface CatastrophicCase {
  id: string;
  referralId: string;
  patientInitials: string;
  acuityLevel: 'High' | 'Critical';
  caseManagerName: string;
  familyContact: string;
  coverageStatus: 'Fully Covered' | 'Partially Covered' | 'Uncovered';
  shifts: string[]; // shift IDs
  suppliesStatus: 'Adequate' | 'Low' | 'Critical';
  equipmentNeeded: string[];
  incidents: TimelineEntry[];
  notes: string;
}

// --- App State ---
export type UserRole = 'VP' | 'Intake Coordinator' | 'Scheduler' | 'Field Staff' | 'Compliance Admin';

/** Role → display name mapping for demo role switching */
export const ROLE_NAMES: Record<UserRole, string> = {
  'VP': 'VP User',
  'Intake Coordinator': 'Sarah L.',
  'Scheduler': 'Mike R.',
  'Field Staff': 'Sarah Mitchell',
  'Compliance Admin': 'Compliance Admin',
};

export interface ProductionReadinessItem {
  id: string;
  feature: string;
  status: 'Not Started' | 'Planned' | 'Implemented in Demo' | 'Production Required';
}

export interface AppState {
  referrals: Referral[];
  staff: StaffMember[];
  compliance: ComplianceItem[];
  visits: FieldVisit[];
  quality: QualityItem[];
  partners: ReferralPartner[];
  auditLog: AuditEntry[];
  alerts: Alert[];
  shifts: Shift[];
  documents: DemoDocument[];
  offlineQueue: OfflineQueueItem[];
  catastrophicCases: CatastrophicCase[];
  productionReadiness: ProductionReadinessItem[];
  currentUser: { name: string; role: UserRole };
}

export type ComplianceStatus = ComplianceItem['status'];
