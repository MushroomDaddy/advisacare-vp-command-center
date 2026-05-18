// ==============================
// AdvisaCare VP Command Center — Types
// ==============================

export type UserRole = 'VP' | 'Intake Coordinator' | 'Scheduler' | 'Field Staff' | 'Compliance Admin';

// Role → display name mapping for demo role switcher
export const roleNameMap: Record<UserRole, string> = {
  'VP': 'VP User',
  'Intake Coordinator': 'Sarah L.',
  'Scheduler': 'Mike R.',
  'Field Staff': 'Sarah Mitchell',
  'Compliance Admin': 'Compliance Admin',
};

export interface CurrentUser {
  name: string;
  role: UserRole;
}

// --- RBAC CRUD ---
export type CRUDAction = 'view' | 'edit' | 'create' | 'delete' | 'export';

export interface PermissionEntry {
  resource: string;
  actions: CRUDAction[];
}

// --- Referral Pipeline ---
export interface ReferralDocument {
  type: string;
  uploaded: boolean;
  uploadedAt?: string;
}

export type ReferralStage = 'New' | 'Missing Docs' | 'Eligibility' | 'Staffing' | 'Scheduled' | 'Started' | 'Declined';
export type ReferralReadiness = 'Missing Docs' | 'Ready for Eligibility' | 'Ready for Staffing' | 'Ready for SOC';
export type InsuranceStatus = 'Verified' | 'Pending' | 'Denied';

export interface ReferralTimelineEvent {
  date: string;
  action: string;
  user: string;
  details?: string;
}

export interface StageTimestamps {
  receivedAt?: string;
  docsRequestedAt?: string;
  docsCompleteAt?: string;
  eligibilityStartedAt?: string;
  eligibilityVerifiedAt?: string;
  staffingStartedAt?: string;
  staffAssignedAt?: string;
  socScheduledAt?: string;
  socCompletedAt?: string;
  declinedAt?: string;
}

export type ServiceType = 'SN' | 'PT' | 'OT' | 'Hospice' | 'Personal Care' | 'Catastrophic Care';

export interface Referral {
  id: string;
  patientInitials: string;
  serviceType: string;
  urgency: 'Routine' | 'Urgent 24-48 hours' | 'Immediate';
  source: string;
  dischargeFacility: string;
  dischargeDate: string;
  slaDeadline: string;           // date-only legacy field
  slaDeadlineAt: string;         // ISO datetime for precise SLA
  stage: ReferralStage;
  assignedOwner: string;
  branch: string;
  insuranceStatus: InsuranceStatus;
  nextFollowUpDate: string;
  documents: ReferralDocument[];
  documentsUploaded: number;
  missingItems: number;
  physicianOrdersReceived: boolean;
  declineReason?: string;
  lostReason?: string;
  createdAt: string;
  recommendedNextAction: string;
  readiness: ReferralReadiness;
  timeline: ReferralTimelineEvent[];
  stageTimestamps: StageTimestamps;
}

// --- Required Docs by Service Type ---
export const requiredDocsByService: Record<string, string[]> = {
  'SN':                ['Face-to-Face', 'Physician Orders', 'Insurance Card', 'Discharge Summary'],
  'PT':                ['Face-to-Face', 'Physician Orders', 'Insurance Card', 'Discharge Summary'],
  'OT':                ['Face-to-Face', 'Physician Orders', 'Insurance Card', 'Discharge Summary'],
  'Hospice':           ['Hospice Order', 'Eligibility Note', 'Insurance Card', 'Face Sheet'],
  'Personal Care':     ['Service Authorization', 'Care Plan', 'Insurance/Medicaid Info'],
  'Catastrophic Care': ['Orders', 'Case Manager Contact', 'Authorization', 'Care Plan', 'Equipment/Supplies'],
};

// --- Staffing ---
export type ShiftStatus = 'Confirmed' | 'Unconfirmed' | 'Declined';

export type SkillTag = 'wound care' | 'IV' | 'vent/trach' | 'TBI' | 'SCI' | 'hospice' | 'pediatric' | 'ADL';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  location: string;
  specialty: string[];
  skillTags: SkillTag[];
  availability: 'Available' | 'Partially' | 'Unavailable';
  todayVisits: number;
  maxVisits: number;
  shiftStatus: ShiftStatus;
  certifications: string[];
  overtimeRisk: 'Low' | 'Medium' | 'High';
  continuityPatients: string[];
}

export interface ShiftBoardEntry {
  id: string;
  referralId: string;
  patientInitials: string;
  serviceType: string;
  acuity: 'Low' | 'Medium' | 'High';
  neededRole: string;
  deadline: string;
  status: 'Open' | 'Offered' | 'Accepted' | 'Declined';
  offeredTo?: string;
  offeredAt?: string;
}

// --- Compliance ---
export interface ComplianceItem {
  id: string;
  staffId: string;
  staffName: string;
  itemType: string;
  expiryDate: string;
  lastCompleted: string;
  status: string;
}

// --- Field Visits ---
export interface EVVData {
  clockIn: string | null;
  clockOut: string | null;
  gpsLatitude: string | null;
  gpsLongitude: string | null;
  gpsAddress: string;
  syncStatus: 'Synced' | 'Pending' | 'Failed';
  patientSignature: boolean;
  caregiverSignature: boolean;
  exceptionReason?: string;
}

export type EVVExceptionType = 'GPS Mismatch' | 'Missed Clock-In' | 'Late Clock-Out' | 'No Signature' | 'Offline Sync';

export interface EVVException {
  id: string;
  visitId: string;
  type: EVVExceptionType;
  reason: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface FieldVisit {
  id: string;
  patientInitials: string;
  address: string;
  time: string;
  serviceType: string;
  visitStatus: 'Scheduled' | 'In Progress' | 'Completed' | 'Missed';
  staffName: string;
  checklist: { task: string; completed: boolean }[];
  evv: EVVData;
  suppliesNeeded: string[];
  notes: string;
  acuity: 'Low' | 'Medium' | 'High';
  evvExceptions: EVVException[];
  signatureCaptured?: boolean;
}

export interface OfflineSyncItem {
  id: string;
  visitId: string;
  patientInitials: string;
  action: string;
  status: 'Pending' | 'Synced' | 'Failed';
  queuedAt: string;
  syncedAt?: string;
  retryCount: number;
}

// --- Quality ---
export type QualityStatus = 'Open' | 'In Progress' | 'Complete';

export interface QualityItem {
  id: string;
  type: string;
  category: 'Home Health' | 'Hospice' | 'General QA';
  patientInitials: string;
  dueDate: string;
  status: QualityStatus;
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
  reviewerName?: string;
  reviewDueDate?: string;
}

export type OASISType = 'SOC' | 'ROC' | 'Recertification' | 'Discharge';

export interface OASISAssessment {
  id: string;
  patientInitials: string;
  type: OASISType;
  dueDate: string;
  assignedTo: string;
  status: 'Due' | 'Submitted' | 'Accepted' | 'Rejected';
  rejectionReason?: string;
  daysUntilDue?: number;
}

export type HOPEType = 'HOPE Admission' | 'HOPE Update Visit 1' | 'HOPE Update Visit 2' | 'HOPE Discharge';

export interface HOPEAssessment {
  id: string;
  patientInitials: string;
  type: HOPEType;
  dueDate: string;
  assignedTo: string;
  status: 'Due' | 'Submitted' | 'Accepted' | 'Rejected';
  iqiesStatus: 'Pending' | 'Submitted' | 'Accepted' | 'Error';
}

// --- Referral Partners ---
export interface PartnerTimelineEntry {
  date: string;
  action: string;
  user: string;
}

export interface PartnerTrend {
  period: string;
  volume: number;
  accepted: number;
  declined: number;
}

export type PartnerRiskLabel = 'Growing' | 'Stable' | 'Needs Attention' | 'At Risk';

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
  trends: PartnerTrend[];
  relationshipOwner: string;
  riskLabel: PartnerRiskLabel;
}

// --- Alerts / Notifications ---
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export type AlertType =
  | 'sla_breach' | 'sla_risk'
  | 'expired_credential' | 'critical_soon_credential'
  | 'uncovered_high_acuity'
  | 'late_note' | 'missed_visit'
  | 'rejected_oasis' | 'overdue_oasis' | 'overdue_hope'
  | 'evv_exception'
  | 'partner_followup_due'
  | 'incident' | 'escalation';

export interface AlertItem {
  id?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  details: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  sourceRecordType?: string;
  sourceRecordId?: string;
  owner?: string;
  recommendedAction?: string;
  resolved?: boolean;
  resolvedAt?: string;
}

// --- Catastrophic Care ---
export interface CatastrophicCase {
  id: string;
  patientInitials: string;
  conditions: ('TBI' | 'SCI' | 'wound care' | 'vent/trach' | '24-hour coverage')[];
  payerType: 'Workers Comp' | 'Auto No-Fault' | 'Commercial' | 'Medicaid';
  requiredSkills: SkillTag[];
  shiftCoverage: { shift: string; covered: boolean; staffName?: string }[];
  familyContact: string;
  caseManagerContact: string;
  supplyEquipmentNeeds: string[];
  incidentTimeline: { date: string; event: string }[];
  coverageRisk: 'Covered' | 'Partial' | 'Uncovered';
  branch: string;
}

// --- Audit ---
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  recordType: string;
  recordId: string;
  details: string;
  before?: string;
  after?: string;
}

// --- Toast ---
export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// --- App State ---
export interface AppState {
  currentUser: CurrentUser;
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
  shiftBoard: ShiftBoardEntry[];
  offlineSyncQueue: OfflineSyncItem[];
  catastrophicCases: CatastrophicCase[];
  toasts: ToastItem[];
  lastRefreshed: string;
}
