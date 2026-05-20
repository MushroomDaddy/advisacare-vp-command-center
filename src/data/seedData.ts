import type {
  Referral, StaffMember, ComplianceItem, FieldVisit, QualityItem,
  ReferralPartner, AuditEntry, AppState, Alert, Shift, DemoDocument,
  CatastrophicCase, ProductionReadinessItem, OfflineQueueItem,
} from '../types';

// --- Seed Referrals ---
export const seedReferrals: Referral[] = [
  {
    id: '1', source: 'Mercy Hospital', patientInitials: 'J.D.', serviceType: 'Home Health',
    urgency: 'Immediate', dischargeFacility: 'Mercy Main', dischargeDate: '2026-05-18',
    physicianOrders: 'Missing', insuranceStatus: 'Pending', documentsUploaded: 2,
    assignedCoordinator: 'Sarah L.', stage: 'Missing Docs',
    missingItems: ['Physician Orders', 'Discharge Summary'],
    createdAt: '2026-05-17T08:00:00Z',
    stageTimestamps: { 'New': '2026-05-17T08:00:00Z', 'Missing Docs': '2026-05-17T09:00:00Z' },
    readiness: 'Missing Docs',
    slaDeadline: '2026-05-18T08:00:00Z',
    slaStatus: 'Breach',
    timeline: [
      { timestamp: '2026-05-17T08:00:00Z', action: 'Referral Created', user: 'Sarah L.', details: 'From Mercy Hospital' },
      { timestamp: '2026-05-17T09:00:00Z', action: 'Moved to Missing Docs', user: 'Sarah L.', details: 'Missing: Physician Orders, Discharge Summary' },
    ],
  },
  {
    id: '2', source: 'St. Jude Medical', patientInitials: 'M.S.', serviceType: 'Hospice',
    urgency: 'Urgent 24-48 hours', dischargeFacility: 'St. Jude South', dischargeDate: '2026-05-17',
    physicianOrders: 'Available', insuranceStatus: 'Verified', documentsUploaded: 5,
    assignedCoordinator: 'Mike R.', stage: 'Scheduled', missingItems: [],
    createdAt: '2026-05-16T10:30:00Z',
    stageTimestamps: { 'New': '2026-05-16T10:30:00Z', 'Missing Docs': '2026-05-16T11:00:00Z', 'Eligibility': '2026-05-16T14:00:00Z', 'Staffing': '2026-05-16T16:00:00Z', 'Scheduled': '2026-05-17T08:00:00Z' },
    assignedStaffId: 's1',
    readiness: 'Ready for SOC',
    slaDeadline: '2026-05-18T10:30:00Z',
    slaStatus: 'OK',
    timeline: [
      { timestamp: '2026-05-16T10:30:00Z', action: 'Referral Created', user: 'Mike R.' },
      { timestamp: '2026-05-17T08:00:00Z', action: 'Scheduled for SOC', user: 'Mike R.', details: 'Assigned to Sarah Mitchell' },
    ],
  },
  {
    id: '3', source: 'Dr. Smith Clinic', patientInitials: 'R.T.', serviceType: 'Therapy',
    urgency: 'Routine', dischargeFacility: 'Regional General', dischargeDate: '2026-05-20',
    physicianOrders: 'Pending', insuranceStatus: 'Verified', documentsUploaded: 3,
    assignedCoordinator: 'Emily T.', stage: 'Eligibility', missingItems: ['Lab Results'],
    createdAt: '2026-05-15T14:20:00Z',
    stageTimestamps: { 'New': '2026-05-15T14:20:00Z', 'Missing Docs': '2026-05-15T15:00:00Z', 'Eligibility': '2026-05-16T10:00:00Z' },
    readiness: 'Ready for Staffing',
    slaDeadline: '2026-05-20T14:20:00Z',
    slaStatus: 'OK',
    timeline: [
      { timestamp: '2026-05-15T14:20:00Z', action: 'Referral Created', user: 'Emily T.' },
      { timestamp: '2026-05-16T10:00:00Z', action: 'Moved to Eligibility', user: 'Emily T.' },
    ],
  },
  {
    id: '4', source: 'Regional Rehab', patientInitials: 'L.K.', serviceType: 'Catastrophic Injury Care',
    urgency: 'Immediate', dischargeFacility: 'Lakeside Medical', dischargeDate: '2026-05-18',
    physicianOrders: 'Available', insuranceStatus: 'Pending', documentsUploaded: 4,
    assignedCoordinator: 'James K.', stage: 'Staffing', missingItems: [],
    createdAt: '2026-05-17T16:45:00Z',
    stageTimestamps: { 'New': '2026-05-17T16:45:00Z', 'Missing Docs': '2026-05-17T17:00:00Z', 'Eligibility': '2026-05-17T18:00:00Z', 'Staffing': '2026-05-18T08:00:00Z' },
    readiness: 'Ready for SOC',
    slaDeadline: '2026-05-18T16:45:00Z',
    slaStatus: 'Risk',
    timeline: [
      { timestamp: '2026-05-17T16:45:00Z', action: 'Referral Created', user: 'James K.' },
      { timestamp: '2026-05-18T08:00:00Z', action: 'Moved to Staffing', user: 'James K.', details: 'Catastrophic care — urgent staffing needed' },
    ],
  },
  {
    id: '5', source: 'Attorney Miller', patientInitials: 'P.W.', serviceType: 'Personal Care',
    urgency: 'Routine', dischargeFacility: 'City Hospital', dischargeDate: '2026-05-22',
    physicianOrders: 'Available', insuranceStatus: 'Denied', documentsUploaded: 5,
    assignedCoordinator: 'Sarah L.', stage: 'Declined', missingItems: [],
    createdAt: '2026-05-14T09:15:00Z',
    declineReason: 'Insurance denial — no coverage for personal care services',
    stageTimestamps: { 'New': '2026-05-14T09:15:00Z', 'Declined': '2026-05-16T11:00:00Z' },
    timeline: [
      { timestamp: '2026-05-14T09:15:00Z', action: 'Referral Created', user: 'Sarah L.' },
      { timestamp: '2026-05-16T11:00:00Z', action: 'Declined', user: 'Sarah L.', details: 'Insurance denial' },
    ],
  },
  {
    id: '6', source: 'Lakeside Medical', patientInitials: 'A.B.', serviceType: 'Home Health',
    urgency: 'Urgent 24-48 hours', dischargeFacility: 'Lakeside Medical', dischargeDate: '2026-05-19',
    physicianOrders: 'Available', insuranceStatus: 'Verified', documentsUploaded: 4,
    assignedCoordinator: 'Mike R.', stage: 'Started', missingItems: [],
    createdAt: '2026-05-16T11:00:00Z', assignedStaffId: 's2',
    stageTimestamps: { 'New': '2026-05-16T11:00:00Z', 'Eligibility': '2026-05-16T14:00:00Z', 'Staffing': '2026-05-17T08:00:00Z', 'Scheduled': '2026-05-17T10:00:00Z', 'Started': '2026-05-18T09:00:00Z' },
    readiness: 'Ready for SOC',
    slaDeadline: '2026-05-18T11:00:00Z',
    slaStatus: 'OK',
    timeline: [
      { timestamp: '2026-05-16T11:00:00Z', action: 'Referral Created', user: 'Mike R.' },
      { timestamp: '2026-05-18T09:00:00Z', action: 'SOC Started', user: 'James Wilson' },
    ],
  },
  {
    id: '7', source: 'Mercy Hospital', patientInitials: 'C.D.', serviceType: 'Hospice',
    urgency: 'Immediate', dischargeFacility: 'Mercy Main', dischargeDate: '2026-05-18',
    physicianOrders: 'Missing', insuranceStatus: 'Verified', documentsUploaded: 1,
    assignedCoordinator: 'Emily T.', stage: 'Missing Docs',
    missingItems: ['Physician Orders', 'Power of Attorney'],
    createdAt: '2026-05-17T07:30:00Z',
    stageTimestamps: { 'New': '2026-05-17T07:30:00Z', 'Missing Docs': '2026-05-17T08:00:00Z' },
    readiness: 'Missing Docs',
    slaDeadline: '2026-05-18T07:30:00Z',
    slaStatus: 'Breach',
    timeline: [
      { timestamp: '2026-05-17T07:30:00Z', action: 'Referral Created', user: 'Emily T.' },
    ],
  },
  {
    id: '8', source: 'St. Jude Medical', patientInitials: 'E.F.', serviceType: 'Therapy',
    urgency: 'Routine', dischargeFacility: 'St. Jude South', dischargeDate: '2026-05-21',
    physicianOrders: 'Available', insuranceStatus: 'Verified', documentsUploaded: 5,
    assignedCoordinator: 'James K.', stage: 'Scheduled', missingItems: [],
    createdAt: '2026-05-15T13:45:00Z', assignedStaffId: 's4',
    stageTimestamps: { 'New': '2026-05-15T13:45:00Z', 'Eligibility': '2026-05-15T16:00:00Z', 'Staffing': '2026-05-16T08:00:00Z', 'Scheduled': '2026-05-17T10:00:00Z' },
    readiness: 'Ready for SOC',
    slaDeadline: '2026-05-20T13:45:00Z',
    slaStatus: 'OK',
    timeline: [
      { timestamp: '2026-05-15T13:45:00Z', action: 'Referral Created', user: 'James K.' },
      { timestamp: '2026-05-17T10:00:00Z', action: 'Scheduled', user: 'James K.' },
    ],
  },
];

// --- Seed Staff ---
export const seedStaff: StaffMember[] = [
  { id: 's1', name: 'Sarah Mitchell', role: 'RN', specialties: ['Hospice', 'Wound Care', 'Home Health'], availability: 'Available', cprExpiry: '2026-08-15', licenseExpiry: '2027-03-01', todayVisits: 4, overtimeRisk: 'Low', location: 'Downtown', phone: '555-0101' },
  { id: 's2', name: 'James Wilson', role: 'LPN', specialties: ['Personal Care', 'Geriatrics'], availability: 'Available', cprExpiry: '2026-06-30', licenseExpiry: '2026-12-15', todayVisits: 6, overtimeRisk: 'Medium', location: 'Northside', phone: '555-0102' },
  { id: 's3', name: 'Maria Garcia', role: 'HHA', specialties: ['Hospice', 'Pediatrics'], availability: 'Partially', cprExpiry: '2026-09-20', licenseExpiry: '2027-05-10', todayVisits: 3, overtimeRisk: 'Low', location: 'Westside', phone: '555-0103' },
  { id: 's4', name: 'Robert Chen', role: 'PT', specialties: ['Therapy', 'Catastrophic Injury'], availability: 'Available', cprExpiry: '2027-01-15', licenseExpiry: '2027-08-20', todayVisits: 5, overtimeRisk: 'Medium', location: 'Eastside', phone: '555-0104' },
  { id: 's5', name: 'Emily Davis', role: 'RN', specialties: ['Wound Care', 'Vent/Trach', 'SCI'], availability: 'Unavailable', cprExpiry: '2026-05-01', licenseExpiry: '2026-11-30', todayVisits: 0, overtimeRisk: 'Low', location: 'Downtown', phone: '555-0105' },
  { id: 's6', name: 'Michael Brown', role: 'CNA', specialties: ['Hospice', 'Geriatrics'], availability: 'Available', cprExpiry: '2026-12-01', licenseExpiry: '2027-06-15', todayVisits: 7, overtimeRisk: 'High', location: 'Northside', phone: '555-0106' },
  { id: 's7', name: 'Lisa Johnson', role: 'OT', specialties: ['Therapy', 'Pediatrics', 'SCI'], availability: 'Available', cprExpiry: '2027-03-10', licenseExpiry: '2027-09-25', todayVisits: 4, overtimeRisk: 'Low', location: 'Westside', phone: '555-0107' },
  { id: 's8', name: 'David Lee', role: 'ST', specialties: ['Therapy', 'Pediatrics'], availability: 'Partially', cprExpiry: '2026-07-15', licenseExpiry: '2026-10-30', todayVisits: 5, overtimeRisk: 'Medium', location: 'Eastside', phone: '555-0108' },
];

// --- Seed Compliance (includes Critical Soon items) ---
export const seedCompliance: ComplianceItem[] = [
  { id: 'c1', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'RN License', status: 'Compliant', expiryDate: '2027-03-01', lastCompleted: '2026-03-01' },
  { id: 'c2', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'CPR Certification', status: 'Due Soon', expiryDate: '2026-08-15', lastCompleted: '2025-08-15' },
  { id: 'c3', staffId: 's5', staffName: 'Emily Davis', itemType: 'RN License', status: 'Compliant', expiryDate: '2026-11-30', lastCompleted: '2025-11-30' },
  { id: 'c4', staffId: 's5', staffName: 'Emily Davis', itemType: 'CPR Certification', status: 'Expired', expiryDate: '2026-05-01', lastCompleted: '2025-05-01' },
  { id: 'c5', staffId: 's2', staffName: 'James Wilson', itemType: 'LPN License', status: 'Due Soon', expiryDate: '2026-07-20', lastCompleted: '2024-12-15' },
  { id: 'c6', staffId: 's2', staffName: 'James Wilson', itemType: 'CPR Certification', status: 'Critical Soon', expiryDate: '2026-06-10', lastCompleted: '2025-06-10' },
  { id: 'c7', staffId: 's6', staffName: 'Michael Brown', itemType: 'CNA License', status: 'Compliant', expiryDate: '2027-06-15', lastCompleted: '2026-06-15' },
  { id: 'c8', staffId: 's6', staffName: 'Michael Brown', itemType: 'CPR Certification', status: 'Compliant', expiryDate: '2026-12-01', lastCompleted: '2025-12-01' },
  { id: 'c9', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'Background Check', status: 'Compliant', expiryDate: '2027-01-01', lastCompleted: '2026-01-01' },
  { id: 'c10', staffId: 's2', staffName: 'James Wilson', itemType: 'Drug Screen', status: 'Compliant', expiryDate: '2026-10-01', lastCompleted: '2026-04-01' },
];

// --- Seed Visits ---
export const seedVisits: FieldVisit[] = [
  {
    id: 'v1', patientInitials: 'J.D.', staffId: 's1', staffName: 'Sarah Mitchell', time: '09:00',
    address: '123 Main St', serviceType: 'Home Health', referralId: '1',
    checklist: [
      { task: 'Vitals Check', completed: true }, { task: 'Medication Review', completed: true },
      { task: 'Wound Assessment', completed: false }, { task: 'Patient Education', completed: false },
    ],
    suppliesNeeded: ['Gloves', 'Bandages', 'Wound Dressings'], documentationStatus: 'Pending', notes: '',
    evvStatus: 'Not Started', signatureCaptured: false, timeline: [],
  },
  {
    id: 'v2', patientInitials: 'M.S.', staffId: 's1', staffName: 'Sarah Mitchell', time: '11:00',
    address: '456 Oak Ave', serviceType: 'Hospice', referralId: '2',
    checklist: [
      { task: 'Vitals Check', completed: true }, { task: 'Comfort Assessment', completed: true },
      { task: 'Family Support', completed: true }, { task: 'Medication Review', completed: true },
    ],
    suppliesNeeded: ['Gloves', 'Oxygen Tank'], documentationStatus: 'Complete',
    notes: 'Patient comfortable, family doing well',
    evvStatus: 'Clocked Out', signatureCaptured: true,
    clockIn: '2026-05-18T11:02:00Z', clockOut: '2026-05-18T12:15:00Z',
    timeline: [
      { timestamp: '2026-05-18T11:02:00Z', action: 'Clocked In', user: 'Sarah Mitchell' },
      { timestamp: '2026-05-18T12:15:00Z', action: 'Clocked Out', user: 'Sarah Mitchell' },
    ],
  },
  {
    id: 'v3', patientInitials: 'R.T.', staffId: 's4', staffName: 'Robert Chen', time: '10:00',
    address: '789 Pine Rd', serviceType: 'Therapy', referralId: '3',
    checklist: [
      { task: 'Range of Motion', completed: false }, { task: 'Strength Assessment', completed: false },
      { task: 'Home Exercise Plan', completed: false },
    ],
    suppliesNeeded: ['Therapy Bands', 'Assessment Forms'], documentationStatus: 'Overdue', notes: '',
    evvStatus: 'Not Started', signatureCaptured: false, timeline: [],
  },
  {
    id: 'v4', patientInitials: 'A.B.', staffId: 's2', staffName: 'James Wilson', time: '13:00',
    address: '321 Elm St', serviceType: 'Home Health', referralId: '6',
    checklist: [
      { task: 'Vitals Check', completed: true }, { task: 'Medication Review', completed: true },
      { task: 'Wound Assessment', completed: true },
    ],
    suppliesNeeded: ['Gloves', 'Bandages'], documentationStatus: 'Complete', notes: 'Wound healing well',
    evvStatus: 'Clocked Out', signatureCaptured: true,
    clockIn: '2026-05-18T13:05:00Z', clockOut: '2026-05-18T14:00:00Z',
    timeline: [
      { timestamp: '2026-05-18T13:05:00Z', action: 'Clocked In', user: 'James Wilson' },
      { timestamp: '2026-05-18T14:00:00Z', action: 'Clocked Out', user: 'James Wilson' },
    ],
  },
  {
    id: 'v5', patientInitials: 'L.K.', staffId: 's3', staffName: 'Maria Garcia', time: '14:30',
    address: '654 Maple Dr', serviceType: 'Catastrophic Injury Care', referralId: '4',
    checklist: [
      { task: 'Vitals Check', completed: false }, { task: 'Mobility Assessment', completed: false },
      { task: 'Equipment Check', completed: false },
    ],
    suppliesNeeded: ['Gloves', 'Syringes', 'Vent Supplies'], documentationStatus: 'Pending', notes: '',
    evvStatus: 'Not Started', signatureCaptured: false, timeline: [],
  },
];

// --- Seed Quality (with OASIS scores for QAO calculation) ---
export const seedQuality: QualityItem[] = [
  { id: 'q1', type: 'OASIS Due', patientInitials: 'A.B.', dueDate: '2026-05-20', status: 'Open', priority: 'High', assignedTo: 'Sarah L.', oasisScore: 82 },
  { id: 'q2', type: 'QA Review', patientInitials: 'M.S.', dueDate: '2026-05-19', status: 'In Progress', priority: 'Medium', assignedTo: 'Mike R.' },
  { id: 'q3', type: 'Readmission Follow-up', patientInitials: 'R.T.', dueDate: '2026-05-21', status: 'Open', priority: 'High', assignedTo: 'Emily T.' },
  { id: 'q4', type: 'Hospice Comfort', patientInitials: 'M.S.', dueDate: '2026-05-18', status: 'Open', priority: 'High', assignedTo: 'Mike R.' },
  { id: 'q5', type: 'CAHPS Follow-up', patientInitials: 'J.D.', dueDate: '2026-05-25', status: 'Open', priority: 'Medium', assignedTo: 'Sarah L.' },
  { id: 'q6', type: 'Missed Visit', patientInitials: 'R.T.', dueDate: '2026-05-18', status: 'Open', priority: 'High', assignedTo: 'James K.' },
  { id: 'q7', type: 'Late Note', patientInitials: 'L.K.', dueDate: '2026-05-18', status: 'In Progress', priority: 'High', assignedTo: 'James K.' },
  { id: 'q8', type: 'HOPE Assessment', patientInitials: 'M.S.', dueDate: '2026-05-17', status: 'Open', priority: 'High', assignedTo: 'Sarah L.' },
  { id: 'q9', type: 'OASIS Review', patientInitials: 'M.S.', dueDate: '2026-05-22', status: 'Submitted', priority: 'Medium', assignedTo: 'Sarah L.', oasisScore: 78 },
];

// --- Seed Partners ---
export const seedPartners: ReferralPartner[] = [
  {
    id: 'p1', name: 'Mercy Hospital', type: 'Hospital', volume: 45, conversionRate: 0.82, declineRate: 0.08,
    avgTimeToSOC: '2.1 days', lostReasons: ['Insurance Denial', 'Staff Shortage'],
    lastFollowUp: '2026-05-15', nextFollowUp: '2026-05-22',
    notes: 'Excellent relationship, fast discharge process',
    contactName: 'Dr. Anderson', contactEmail: 'd.anderson@mercy.com', contactPhone: '555-1001',
    riskLabel: 'Healthy',
    timeline: [{ timestamp: '2026-05-15T10:00:00Z', action: 'Follow-up call', user: 'Sarah L.', details: 'Discussed new discharge protocols' }],
    trendData: [{ month: 'Jan', volume: 38 }, { month: 'Feb', volume: 41 }, { month: 'Mar', volume: 43 }, { month: 'Apr', volume: 40 }, { month: 'May', volume: 45 }],
  },
  {
    id: 'p2', name: 'St. Jude Medical', type: 'Hospital', volume: 38, conversionRate: 0.78, declineRate: 0.05,
    avgTimeToSOC: '2.8 days', lostReasons: ['Patient Declined'],
    lastFollowUp: '2026-05-16', nextFollowUp: '2026-05-23',
    notes: 'Consistent volume, good communication',
    contactName: 'Lisa Thompson', contactEmail: 'l.thompson@stjude.com', contactPhone: '555-1002',
    riskLabel: 'Healthy',
    timeline: [{ timestamp: '2026-05-16T14:00:00Z', action: 'Follow-up meeting', user: 'Mike R.' }],
    trendData: [{ month: 'Jan', volume: 35 }, { month: 'Feb', volume: 37 }, { month: 'Mar', volume: 36 }, { month: 'Apr', volume: 39 }, { month: 'May', volume: 38 }],
  },
  {
    id: 'p3', name: 'Dr. Smith Clinic', type: 'Physician', volume: 12, conversionRate: 0.92, declineRate: 0.0,
    avgTimeToSOC: '1.5 days', lostReasons: [],
    lastFollowUp: '2026-05-17', nextFollowUp: '2026-05-31',
    notes: 'Primary care, quick referrals',
    contactName: 'Dr. Smith', contactEmail: 'j.smith@smithclinic.com', contactPhone: '555-1003',
    riskLabel: 'Healthy',
    timeline: [{ timestamp: '2026-05-17T09:00:00Z', action: 'Follow-up call', user: 'Emily T.' }],
    trendData: [{ month: 'Jan', volume: 10 }, { month: 'Feb', volume: 11 }, { month: 'Mar', volume: 13 }, { month: 'Apr', volume: 11 }, { month: 'May', volume: 12 }],
  },
  {
    id: 'p4', name: 'Regional Rehab', type: 'Hospital', volume: 22, conversionRate: 0.68, declineRate: 0.14,
    avgTimeToSOC: '3.2 days', lostReasons: ['Service Not Available'],
    lastFollowUp: '2026-05-10', nextFollowUp: '2026-05-17',
    notes: 'Specializes in catastrophic injury',
    contactName: 'Mark Davis', contactEmail: 'm.davis@regionalrehab.com', contactPhone: '555-1004',
    riskLabel: 'At Risk',
    timeline: [{ timestamp: '2026-05-10T11:00:00Z', action: 'Follow-up call', user: 'James K.' }],
    trendData: [{ month: 'Jan', volume: 28 }, { month: 'Feb', volume: 25 }, { month: 'Mar', volume: 24 }, { month: 'Apr', volume: 23 }, { month: 'May', volume: 22 }],
  },
  {
    id: 'p5', name: 'Attorney Miller', type: 'Attorney', volume: 8, conversionRate: 0.50, declineRate: 0.25,
    avgTimeToSOC: '4.5 days', lostReasons: ['Insurance Denial'],
    lastFollowUp: '2026-05-01', nextFollowUp: '2026-05-15',
    notes: 'Legal cases, personal injury',
    contactName: 'John Miller', contactEmail: 'j.miller@millerlaw.com', contactPhone: '555-1005',
    riskLabel: 'Critical',
    timeline: [{ timestamp: '2026-05-01T15:00:00Z', action: 'Follow-up call', user: 'Sarah L.' }],
    trendData: [{ month: 'Jan', volume: 12 }, { month: 'Feb', volume: 10 }, { month: 'Mar', volume: 9 }, { month: 'Apr', volume: 9 }, { month: 'May', volume: 8 }],
  },
];

// --- Seed Audit Log ---
export const seedAuditLog: AuditEntry[] = [
  { id: 'a1', timestamp: '2026-05-18T05:30:00Z', user: 'Sarah L.', role: 'Intake Coordinator', action: 'Created', recordType: 'Referral', recordId: '1', details: 'New referral J.D. from Mercy Hospital' },
  { id: 'a2', timestamp: '2026-05-18T05:45:00Z', user: 'Mike R.', role: 'Scheduler', action: 'Updated', recordType: 'Referral', recordId: '2', details: 'Stage changed to Scheduled' },
  { id: 'a3', timestamp: '2026-05-18T06:00:00Z', user: 'Sarah Mitchell', role: 'Field Staff', action: 'Updated', recordType: 'Quality', recordId: 'q2', details: 'QA Review for M.S. started' },
  { id: 'a4', timestamp: '2026-05-17T14:20:00Z', user: 'Emily T.', role: 'Intake Coordinator', action: 'Updated', recordType: 'Referral', recordId: '3', details: 'Updated insurance status to Verified' },
  { id: 'a5', timestamp: '2026-05-17T16:45:00Z', user: 'James K.', role: 'Intake Coordinator', action: 'Created', recordType: 'Referral', recordId: '4', details: 'New referral L.K. from Regional Rehab' },
];

// --- Seed Alerts ---
export const seedAlerts: Alert[] = [
  { id: 'al1', type: 'Missing Documents', severity: 'Critical', message: 'J.D. — missing: Physician Orders, Discharge Summary', sourceRecordType: 'Referral', sourceRecordId: '1', acknowledged: false, resolved: false, createdAt: '2026-05-17T09:00:00Z' },
  { id: 'al2', type: 'Missing Documents', severity: 'Critical', message: 'C.D. — missing: Physician Orders, Power of Attorney', sourceRecordType: 'Referral', sourceRecordId: '7', acknowledged: false, resolved: false, createdAt: '2026-05-17T08:00:00Z' },
  { id: 'al3', type: 'Expired Credential', severity: 'High', message: 'Emily Davis — CPR Certification expired', sourceRecordType: 'Compliance', sourceRecordId: 'c4', acknowledged: false, resolved: false, createdAt: '2026-05-01T00:00:00Z' },
  { id: 'al4', type: 'Critical Soon Credential', severity: 'Medium', message: 'James Wilson — CPR Certification expires within 30 days', sourceRecordType: 'Compliance', sourceRecordId: 'c6', acknowledged: false, resolved: false, createdAt: '2026-05-15T00:00:00Z' },
  { id: 'al5', type: 'Open Shift', severity: 'High', message: 'Uncovered shift for L.K. — Catastrophic Injury Care', sourceRecordType: 'Shift', sourceRecordId: 'sh1', acknowledged: false, resolved: false, createdAt: '2026-05-18T08:00:00Z' },
  { id: 'al6', type: 'OASIS Rejected', severity: 'High', message: 'OASIS assessment due for A.B. — May 20', sourceRecordType: 'Quality', sourceRecordId: 'q1', acknowledged: false, resolved: false, createdAt: '2026-05-18T06:00:00Z' },
  { id: 'al7', type: 'HOPE Overdue', severity: 'High', message: 'HOPE Assessment overdue for M.S.', sourceRecordType: 'Quality', sourceRecordId: 'q8', acknowledged: false, resolved: false, createdAt: '2026-05-18T00:00:00Z' },
  { id: 'al8', type: 'Partner Follow-up Overdue', severity: 'Medium', message: 'Attorney Miller follow-up overdue', sourceRecordType: 'Partner', sourceRecordId: 'p5', acknowledged: false, resolved: false, createdAt: '2026-05-16T00:00:00Z' },
  { id: 'al9', type: 'Staffing', severity: 'Critical', message: 'L.K. needs staffing — Immediate', sourceRecordType: 'Referral', sourceRecordId: '4', acknowledged: false, resolved: false, createdAt: '2026-05-18T08:00:00Z' },
];

// --- Seed Shifts ---
export const seedShifts: Shift[] = [
  { id: 'sh1', referralId: '4', patientInitials: 'L.K.', serviceType: 'Catastrophic Injury Care', status: 'Open', date: '2026-05-19', time: '08:00-16:00', location: 'Lakeside Medical', notes: 'Catastrophic care — high acuity', createdAt: '2026-05-18T08:00:00Z' },
  { id: 'sh2', referralId: '2', patientInitials: 'M.S.', serviceType: 'Hospice', status: 'Accepted', offeredTo: 's1', offeredToName: 'Sarah Mitchell', acceptedBy: 's1', date: '2026-05-19', time: '09:00-13:00', location: 'St. Jude South', notes: 'Hospice comfort care', createdAt: '2026-05-17T10:00:00Z' },
  { id: 'sh3', referralId: '1', patientInitials: 'J.D.', serviceType: 'Home Health', status: 'Open', date: '2026-05-20', time: '09:00-12:00', location: 'Downtown', notes: 'Pending document completion', createdAt: '2026-05-18T09:00:00Z' },
];

// --- Seed Documents ---
export const seedDocuments: DemoDocument[] = [
  { id: 'd1', referralId: '2', fileName: 'physician_orders_ms.pdf', fileType: 'application/pdf', uploadedBy: 'Mike R.', uploadedAt: '2026-05-16T12:00:00Z', category: 'Physician Orders' },
  { id: 'd2', referralId: '2', fileName: 'discharge_summary_ms.pdf', fileType: 'application/pdf', uploadedBy: 'Mike R.', uploadedAt: '2026-05-16T12:05:00Z', category: 'Discharge Summary' },
  { id: 'd3', referralId: '2', fileName: 'insurance_card_ms.jpg', fileType: 'image/jpeg', uploadedBy: 'Mike R.', uploadedAt: '2026-05-16T12:10:00Z', category: 'Insurance Card' },
  { id: 'd4', referralId: '6', fileName: 'physician_orders_ab.pdf', fileType: 'application/pdf', uploadedBy: 'Mike R.', uploadedAt: '2026-05-17T09:00:00Z', category: 'Physician Orders' },
  { id: 'd5', referralId: '1', fileName: 'insurance_card_jd.jpg', fileType: 'image/jpeg', uploadedBy: 'Sarah L.', uploadedAt: '2026-05-17T10:00:00Z', category: 'Insurance Card' },
];

// --- Seed Catastrophic Cases ---
export const seedCatastrophicCases: CatastrophicCase[] = [
  {
    id: 'cc1', referralId: '4', patientInitials: 'L.K.', acuityLevel: 'Critical',
    caseManagerName: 'James K.', familyContact: 'Karen K. (555-2001)',
    coverageStatus: 'Partially Covered', shifts: ['sh1'],
    suppliesStatus: 'Low', equipmentNeeded: ['Vent Supplies', 'Hospital Bed', 'Suction Machine'],
    incidents: [
      { timestamp: '2026-05-18T10:00:00Z', action: 'Equipment delivery delayed', user: 'James K.', details: 'Suction machine ETA pushed to May 20' },
    ],
    notes: 'High-acuity spinal cord injury. Requires 24/7 skilled nursing coverage.',
  },
];

// --- Seed Offline Queue ---
export const seedOfflineQueue: OfflineQueueItem[] = [
  { id: 'oq1', visitId: 'v3', action: 'Update checklist', data: '{"taskIndex": 0, "completed": true}', createdAt: '2026-05-18T10:05:00Z', status: 'Pending' },
];

// --- Production Readiness ---
export const seedProductionReadiness: ProductionReadinessItem[] = [
  { id: 'pr1', feature: 'Encrypted data storage at rest', status: 'Production Required' },
  { id: 'pr2', feature: 'OAuth 2.0 / OIDC authentication', status: 'Production Required' },
  { id: 'pr3', feature: 'Server-side role-based access control', status: 'Planned' },
  { id: 'pr4', feature: 'Immutable append-only audit logging with hash chains', status: 'Production Required' },
  { id: 'pr5', feature: 'End-to-end encryption for sensitive fields', status: 'Not Started' },
  { id: 'pr6', feature: 'MFA for sensitive roles', status: 'Not Started' },
  { id: 'pr7', feature: 'BAA with cloud provider', status: 'Not Started' },
  { id: 'pr8', feature: 'Penetration testing', status: 'Not Started' },
  { id: 'pr9', feature: 'Role-based access UI', status: 'Implemented in Demo' },
  { id: 'pr10', feature: 'Audit logging', status: 'Implemented in Demo' },
  { id: 'pr11', feature: 'Demo data separation', status: 'Implemented in Demo' },
  { id: 'pr12', feature: 'Referral pipeline workflow', status: 'Implemented in Demo' },
  { id: 'pr13', feature: 'Compliance tracking', status: 'Implemented in Demo' },
  { id: 'pr14', feature: 'Field visit EVV tracking', status: 'Implemented in Demo' },
];

export const initialUser = { name: 'VP User', role: 'VP' as const };

const STORAGE_KEY = 'advisacare-demo-state';

export function getInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AppState;
      if (parsed.referrals && parsed.staff && parsed.alerts) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors, fall through to seed data
  }
  return getSeedState();
}

export function getSeedState(): AppState {
  return {
    referrals: seedReferrals,
    staff: seedStaff,
    compliance: seedCompliance,
    visits: seedVisits,
    quality: seedQuality,
    partners: seedPartners,
    auditLog: seedAuditLog,
    alerts: seedAlerts,
    shifts: seedShifts,
    documents: seedDocuments,
    offlineQueue: seedOfflineQueue,
    catastrophicCases: seedCatastrophicCases,
    productionReadiness: seedProductionReadiness,
    currentUser: initialUser,
  };
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

export function clearSavedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function exportStateJSON(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importStateJSON(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as AppState;
    if (parsed.referrals && parsed.staff && parsed.alerts) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
