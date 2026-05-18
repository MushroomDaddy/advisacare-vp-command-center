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

export interface Referral {
  id: string;
  patientInitials: string;
  serviceType: string;
  urgency: 'Routine' | 'Urgent 24-48 hours' | 'Immediate';
  source: string;
  dischargeFacility: string;
  dischargeDate: string;
  slaDeadline: string;
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
}

// --- Staffing ---
export type ShiftStatus = 'Confirmed' | 'Unconfirmed' | 'Declined';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  location: string;
  specialty: string[];
  availability: 'Available' | 'Partially' | 'Unavailable';
  todayVisits: number;
  maxVisits: number;
  shiftStatus: ShiftStatus;
  certifications: string[];
  overtimeRisk: 'Low' | 'Medium' | 'High';
  continuityPatients: string[];  // patient initials for continuity scoring
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
  status: string; // always calculated from expiryDate
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
  period: string;  // e.g. '30d', '60d', '90d'
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

export interface AlertItem {
  id?: string;
  type: 'expired_credential' | 'critical_soon_credential' | 'sla_breach' | 'sla_risk' | 'late_note' | 'uncovered_high_acuity' | 'incident' | 'escalation';
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
  toasts: ToastItem[];
  lastRefreshed: string;
}
