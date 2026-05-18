// ==============================
// Seed Data — Demo / Fake Data Only — No Real PHI
// ==============================

import type {
  Referral, StaffMember, ComplianceItem, FieldVisit, QualityItem,
  OASISAssessment, HOPEAssessment, ReferralPartner, AlertItem, AuditEntry,
  ShiftBoardEntry, OfflineSyncItem
} from '../types';

const today = new Date().toISOString().split('T')[0];
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
const daysFrom = (n: number) => new Date(Date.now() + n * 86400000).toISOString().split('T')[0];
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();

export const seedReferrals: Referral[] = [
  {
    id: 'ref1', patientInitials: 'J.D.', serviceType: 'SN', urgency: 'Immediate', source: 'Memorial Hermann', dischargeFacility: 'Memorial Hermann',
    dischargeDate: daysFrom(2), slaDeadline: daysFrom(0), stage: 'Staffing', assignedOwner: 'Sarah L.',
    branch: 'Houston North', insuranceStatus: 'Verified', nextFollowUpDate: today,
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(1) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(1) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(1) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(36), recommendedNextAction: 'Assign clinician and schedule SOC visit',
    readiness: 'Ready for Staffing',
    timeline: [
      { date: daysAgo(2), action: 'Referral received', user: 'System', details: 'From Memorial Hermann via fax' },
      { date: daysAgo(1), action: 'Documents uploaded', user: 'Sarah L.', details: 'All 4 documents received' },
      { date: daysAgo(1), action: 'Eligibility verified', user: 'Sarah L.', details: 'Insurance verified' },
      { date: today, action: 'Moved to Staffing', user: 'Sarah L.' },
    ],
  },
  {
    id: 'ref2', patientInitials: 'M.K.', serviceType: 'PT', urgency: 'Urgent 24-48 hours', source: 'St. Luke\'s', dischargeFacility: 'St. Luke\'s',
    dischargeDate: daysFrom(5), slaDeadline: daysFrom(2), stage: 'Missing Docs', assignedOwner: 'Sarah L.',
    branch: 'Houston South', insuranceStatus: 'Pending', nextFollowUpDate: daysFrom(1),
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(1) },
      { type: 'Physician Orders', uploaded: false },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(1) },
      { type: 'Discharge Summary', uploaded: false },
    ],
    documentsUploaded: 2, missingItems: 2, physicianOrdersReceived: false,
    createdAt: hoursAgo(24), recommendedNextAction: 'Collect missing documents: Physician Orders, Discharge Summary',
    readiness: 'Missing Docs',
    timeline: [
      { date: daysAgo(1), action: 'Referral received', user: 'System', details: 'From St. Luke\'s via EMR' },
      { date: daysAgo(1), action: 'Partial docs uploaded', user: 'Sarah L.' },
    ],
  },
  {
    id: 'ref3', patientInitials: 'A.R.', serviceType: 'OT', urgency: 'Routine', source: 'Houston Methodist', dischargeFacility: 'Houston Methodist',
    dischargeDate: daysFrom(10), slaDeadline: daysFrom(7), stage: 'Eligibility', assignedOwner: 'Mike R.',
    branch: 'Houston North', insuranceStatus: 'Pending', nextFollowUpDate: daysFrom(2),
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(3) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(3) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(2) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(72), recommendedNextAction: 'Verify insurance eligibility',
    readiness: 'Ready for Eligibility',
    timeline: [
      { date: daysAgo(3), action: 'Referral received', user: 'System' },
      { date: daysAgo(2), action: 'All docs uploaded', user: 'Mike R.' },
      { date: daysAgo(1), action: 'Eligibility review started', user: 'Mike R.' },
    ],
  },
  {
    id: 'ref4', patientInitials: 'B.T.', serviceType: 'SN', urgency: 'Immediate', source: 'Memorial Hermann', dischargeFacility: 'Memorial Hermann',
    dischargeDate: daysFrom(1), slaDeadline: daysAgo(1), stage: 'New', assignedOwner: 'Sarah L.',
    branch: 'Houston South', insuranceStatus: 'Verified', nextFollowUpDate: today,
    documents: [
      { type: 'Face-to-Face', uploaded: false },
      { type: 'Physician Orders', uploaded: false },
      { type: 'Insurance Card', uploaded: true, uploadedAt: today },
      { type: 'Discharge Summary', uploaded: false },
    ],
    documentsUploaded: 1, missingItems: 3, physicianOrdersReceived: false,
    createdAt: hoursAgo(30), recommendedNextAction: 'Collect missing documents: Face-to-Face, Physician Orders, Discharge Summary',
    readiness: 'Missing Docs',
    timeline: [
      { date: daysAgo(1), action: 'Referral received', user: 'System', details: 'URGENT — Immediate' },
    ],
  },
  {
    id: 'ref5', patientInitials: 'L.H.', serviceType: 'Hospice', urgency: 'Urgent 24-48 hours', source: 'MD Anderson', dischargeFacility: 'MD Anderson',
    dischargeDate: daysFrom(3), slaDeadline: daysFrom(1), stage: 'Scheduled', assignedOwner: 'Mike R.',
    branch: 'Houston North', insuranceStatus: 'Verified', nextFollowUpDate: daysFrom(1),
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(3) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(2) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(96), recommendedNextAction: 'Confirm SOC visit with patient and clinician',
    readiness: 'Ready for SOC',
    timeline: [
      { date: daysAgo(4), action: 'Referral received', user: 'System' },
      { date: daysAgo(3), action: 'Docs uploaded', user: 'Sarah L.' },
      { date: daysAgo(2), action: 'Eligibility verified', user: 'Sarah L.' },
      { date: daysAgo(1), action: 'Staff assigned — Sarah Mitchell', user: 'Mike R.' },
      { date: today, action: 'SOC visit scheduled', user: 'Mike R.' },
    ],
  },
  {
    id: 'ref6', patientInitials: 'C.W.', serviceType: 'SN', urgency: 'Routine', source: 'St. Luke\'s', dischargeFacility: 'St. Luke\'s',
    dischargeDate: daysAgo(3), slaDeadline: daysAgo(2), stage: 'Started', assignedOwner: 'Mike R.',
    branch: 'Houston South', insuranceStatus: 'Verified', nextFollowUpDate: daysFrom(7),
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(10) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(10) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(10) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(10) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(240), recommendedNextAction: 'Monitor case progress',
    readiness: 'Ready for SOC',
    timeline: [
      { date: daysAgo(10), action: 'Referral received', user: 'System' },
      { date: daysAgo(9), action: 'All docs uploaded', user: 'Sarah L.' },
      { date: daysAgo(7), action: 'Eligibility verified', user: 'Sarah L.' },
      { date: daysAgo(5), action: 'Staff assigned', user: 'Mike R.' },
      { date: daysAgo(3), action: 'SOC visit started', user: 'Sarah Mitchell' },
    ],
  },
  {
    id: 'ref7', patientInitials: 'R.P.', serviceType: 'PT', urgency: 'Routine', source: 'Houston Methodist', dischargeFacility: 'Houston Methodist',
    dischargeDate: daysFrom(14), slaDeadline: daysFrom(10), stage: 'New', assignedOwner: 'Sarah L.',
    branch: 'Houston North', insuranceStatus: 'Pending', nextFollowUpDate: daysFrom(2),
    documents: [
      { type: 'Face-to-Face', uploaded: false },
      { type: 'Physician Orders', uploaded: false },
      { type: 'Insurance Card', uploaded: false },
      { type: 'Discharge Summary', uploaded: false },
    ],
    documentsUploaded: 0, missingItems: 4, physicianOrdersReceived: false,
    createdAt: hoursAgo(4), recommendedNextAction: 'Review referral and request missing documents',
    readiness: 'Missing Docs',
    timeline: [
      { date: today, action: 'Referral received', user: 'System', details: 'From Houston Methodist via portal' },
    ],
  },
  {
    id: 'ref8', patientInitials: 'S.M.', serviceType: 'SN', urgency: 'Urgent 24-48 hours', source: 'Memorial Hermann', dischargeFacility: 'Memorial Hermann',
    dischargeDate: daysFrom(4), slaDeadline: daysFrom(2), stage: 'Declined', assignedOwner: 'Sarah L.',
    branch: 'Houston South', insuranceStatus: 'Denied', nextFollowUpDate: today,
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(5) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(5) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(5) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(5) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(120),
    declineReason: 'Insurance denied — out of network',
    lostReason: 'Insurance Denial',
    recommendedNextAction: 'Appeal insurance denial or update payer',
    readiness: 'Ready for Eligibility',
    timeline: [
      { date: daysAgo(5), action: 'Referral received', user: 'System' },
      { date: daysAgo(4), action: 'All docs uploaded', user: 'Sarah L.' },
      { date: daysAgo(3), action: 'Insurance denied', user: 'Sarah L.' },
      { date: daysAgo(2), action: 'Referral declined', user: 'Sarah L.', details: 'Insurance denied — out of network' },
    ],
  },
];

export const seedStaff: StaffMember[] = [
  { id: 's1', name: 'Sarah Mitchell', role: 'RN', location: 'Houston North', specialty: ['SN', 'Wound Care'], availability: 'Available', todayVisits: 3, maxVisits: 6, shiftStatus: 'Confirmed', certifications: ['RN', 'BLS', 'OASIS'], overtimeRisk: 'Low', continuityPatients: ['J.D.', 'L.H.'] },
  { id: 's2', name: 'David Chen', role: 'PT', location: 'Houston South', specialty: ['PT', 'Ortho'], availability: 'Available', todayVisits: 4, maxVisits: 6, shiftStatus: 'Confirmed', certifications: ['PT', 'DPT'], overtimeRisk: 'Medium', continuityPatients: ['M.K.'] },
  { id: 's3', name: 'Maria Garcia', role: 'OT', location: 'Houston North', specialty: ['OT', 'Neuro'], availability: 'Partially', todayVisits: 5, maxVisits: 6, shiftStatus: 'Unconfirmed', certifications: ['OT', 'CHT'], overtimeRisk: 'High', continuityPatients: ['A.R.'] },
  { id: 's4', name: 'James Wilson', role: 'RN', location: 'Houston South', specialty: ['SN', 'Cardiac'], availability: 'Available', todayVisits: 2, maxVisits: 6, shiftStatus: 'Confirmed', certifications: ['RN', 'ACLS', 'OASIS'], overtimeRisk: 'Low', continuityPatients: [] },
  { id: 's5', name: 'Emily Brown', role: 'HHA', location: 'Houston North', specialty: ['HHA', 'Personal Care'], availability: 'Unavailable', todayVisits: 0, maxVisits: 8, shiftStatus: 'Declined', certifications: ['CNA', 'HHA'], overtimeRisk: 'Low', continuityPatients: [] },
  { id: 's6', name: 'Robert Taylor', role: 'RN', location: 'Houston North', specialty: ['SN', 'Hospice'], availability: 'Available', todayVisits: 4, maxVisits: 5, shiftStatus: 'Confirmed', certifications: ['RN', 'CHPN'], overtimeRisk: 'Medium', continuityPatients: ['L.H.'] },
];

export const seedCompliance: ComplianceItem[] = [
  { id: 'c1', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'RN License', expiryDate: daysFrom(180), lastCompleted: daysAgo(90), status: '' },
  { id: 'c2', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'BLS Certification', expiryDate: daysFrom(45), lastCompleted: daysAgo(320), status: '' },
  { id: 'c3', staffId: 's2', staffName: 'David Chen', itemType: 'PT License', expiryDate: daysFrom(15), lastCompleted: daysAgo(350), status: '' },
  { id: 'c4', staffId: 's3', staffName: 'Maria Garcia', itemType: 'OT License', expiryDate: daysAgo(5), lastCompleted: daysAgo(370), status: '' },
  { id: 'c5', staffId: 's4', staffName: 'James Wilson', itemType: 'RN License', expiryDate: daysFrom(200), lastCompleted: daysAgo(60), status: '' },
  { id: 'c6', staffId: 's4', staffName: 'James Wilson', itemType: 'ACLS Certification', expiryDate: daysFrom(90), lastCompleted: daysAgo(275), status: '' },
  { id: 'c7', staffId: 's5', staffName: 'Emily Brown', itemType: 'CNA Certification', expiryDate: daysFrom(300), lastCompleted: daysAgo(30), status: '' },
  { id: 'c8', staffId: 's6', staffName: 'Robert Taylor', itemType: 'RN License', expiryDate: daysFrom(25), lastCompleted: daysAgo(340), status: '' },
  { id: 'c9', staffId: 's6', staffName: 'Robert Taylor', itemType: 'CHPN Certification', expiryDate: daysFrom(5), lastCompleted: daysAgo(360), status: '' },
  { id: 'c10', staffId: 's2', staffName: 'David Chen', itemType: 'TB Test', expiryDate: daysAgo(10), lastCompleted: daysAgo(380), status: '' },
];

export const seedVisits: FieldVisit[] = [
  {
    id: 'v1', patientInitials: 'J.D.', address: '123 Main St, Houston, TX 77001', time: '08:00 AM',
    serviceType: 'SN — Wound Care', visitStatus: 'Scheduled', staffName: 'Sarah Mitchell', acuity: 'High',
    checklist: [
      { task: 'Verify patient identity', completed: false },
      { task: 'Assess wound condition', completed: false },
      { task: 'Change dressing per orders', completed: false },
      { task: 'Document vitals', completed: false },
      { task: 'Patient education on wound care', completed: false },
    ],
    evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Pending', patientSignature: false, caregiverSignature: false },
    suppliesNeeded: ['Wound dressing kit', 'Sterile gloves', 'Saline'],
    notes: '', evvExceptions: [],
  },
  {
    id: 'v2', patientInitials: 'L.H.', address: '456 Oak Ave, Houston, TX 77002', time: '10:30 AM',
    serviceType: 'Hospice — Comfort Visit', visitStatus: 'Scheduled', staffName: 'Sarah Mitchell', acuity: 'High',
    checklist: [
      { task: 'Pain assessment', completed: false },
      { task: 'Medication reconciliation', completed: false },
      { task: 'Comfort care plan review', completed: false },
      { task: 'Family support / education', completed: false },
    ],
    evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Pending', patientSignature: false, caregiverSignature: false },
    suppliesNeeded: ['Comfort kit', 'PRN medications'],
    notes: '', evvExceptions: [],
  },
  {
    id: 'v3', patientInitials: 'A.R.', address: '789 Pine Rd, Houston, TX 77003', time: '01:00 PM',
    serviceType: 'OT — Neuro Rehab', visitStatus: 'Completed', staffName: 'Maria Garcia', acuity: 'Medium',
    checklist: [
      { task: 'Verify patient identity', completed: true },
      { task: 'Assess ADL performance', completed: true },
      { task: 'Therapeutic exercises', completed: true },
      { task: 'Document progress', completed: true },
    ],
    evv: { clockIn: hoursAgo(3), clockOut: hoursAgo(2), gpsLatitude: '29.7604', gpsLongitude: '-95.3698', gpsAddress: '789 Pine Rd (GPS verified)', syncStatus: 'Synced', patientSignature: true, caregiverSignature: false },
    suppliesNeeded: ['Exercise bands'],
    notes: 'Patient progressing well. Increased independence in ADLs.',
    evvExceptions: [],
  },
  {
    id: 'v4', patientInitials: 'C.W.', address: '321 Elm Blvd, Houston, TX 77004', time: '03:00 PM',
    serviceType: 'SN — Cardiac Assessment', visitStatus: 'Missed', staffName: 'James Wilson', acuity: 'High',
    checklist: [
      { task: 'Verify patient identity', completed: false },
      { task: 'Cardiac assessment', completed: false },
      { task: 'ECG if ordered', completed: false },
      { task: 'Medication education', completed: false },
    ],
    evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Failed', patientSignature: false, caregiverSignature: false, exceptionReason: 'Patient not home' },
    suppliesNeeded: ['ECG kit', 'BP cuff'],
    notes: '', evvExceptions: [
      { id: 'exc1', visitId: 'v4', type: 'Missed Clock-In', reason: 'Patient not home — rescheduling required' },
    ],
  },
  {
    id: 'v5', patientInitials: 'M.K.', address: '555 Cedar Ln, Houston, TX 77005', time: '04:30 PM',
    serviceType: 'PT — Ortho Rehab', visitStatus: 'Scheduled', staffName: 'David Chen', acuity: 'Medium',
    checklist: [
      { task: 'Verify patient identity', completed: false },
      { task: 'ROM assessment', completed: false },
      { task: 'Therapeutic exercises', completed: false },
      { task: 'Gait training', completed: false },
      { task: 'Home safety assessment', completed: false },
    ],
    evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Pending', patientSignature: false, caregiverSignature: false },
    suppliesNeeded: ['Gait belt', 'Exercise bands'],
    notes: '', evvExceptions: [],
  },
];

export const seedQuality: QualityItem[] = [
  { id: 'q1', type: 'OASIS Due', category: 'Home Health', patientInitials: 'J.D.', dueDate: daysFrom(2), status: 'Open', priority: 'High', assignedTo: 'Sarah Mitchell', reviewerName: 'Dr. Adams', reviewDueDate: daysFrom(4) },
  { id: 'q2', type: 'QA Review', category: 'Home Health', patientInitials: 'C.W.', dueDate: daysFrom(5), status: 'In Progress', priority: 'Medium', assignedTo: 'Mike R.', reviewerName: 'Dr. Adams', reviewDueDate: daysFrom(7) },
  { id: 'q3', type: 'Late Note', category: 'General QA', patientInitials: 'M.K.', dueDate: daysAgo(1), status: 'Open', priority: 'High', assignedTo: 'David Chen' },
  { id: 'q4', type: 'Readmission Follow-up', category: 'Home Health', patientInitials: 'A.R.', dueDate: daysFrom(3), status: 'Open', priority: 'Medium', assignedTo: 'Maria Garcia' },
  { id: 'q5', type: 'CAHPS Follow-up', category: 'Home Health', patientInitials: 'L.H.', dueDate: daysFrom(7), status: 'Open', priority: 'Low', assignedTo: 'Sarah L.' },
  { id: 'q6', type: 'Hospice Comfort', category: 'Hospice', patientInitials: 'L.H.', dueDate: daysAgo(1), status: 'Open', priority: 'High', assignedTo: 'Robert Taylor' },
  { id: 'q7', type: 'Missed Visit', category: 'General QA', patientInitials: 'C.W.', dueDate: today, status: 'Open', priority: 'High', assignedTo: 'James Wilson' },
  { id: 'q8', type: 'QA Review', category: 'Home Health', patientInitials: 'R.P.', dueDate: daysFrom(10), status: 'Open', priority: 'Low', assignedTo: 'Sarah L.' },
  { id: 'q9', type: 'Incident', category: 'General QA', patientInitials: 'A.R.', dueDate: daysAgo(2), status: 'In Progress', priority: 'High', assignedTo: 'Maria Garcia', reviewerName: 'Compliance Admin', reviewDueDate: daysFrom(1) },
  { id: 'q10', type: 'Late Note', category: 'General QA', patientInitials: 'J.D.', dueDate: daysAgo(3), status: 'Complete', priority: 'Medium', assignedTo: 'Sarah Mitchell' },
];

export const seedOASIS: OASISAssessment[] = [
  { id: 'oa1', patientInitials: 'J.D.', type: 'SOC', dueDate: daysFrom(2), assignedTo: 'Sarah Mitchell', status: 'Due' },
  { id: 'oa2', patientInitials: 'C.W.', type: 'Recertification', dueDate: daysAgo(1), assignedTo: 'James Wilson', status: 'Due' },
  { id: 'oa3', patientInitials: 'A.R.', type: 'ROC', dueDate: daysFrom(5), assignedTo: 'Maria Garcia', status: 'Submitted' },
  { id: 'oa4', patientInitials: 'M.K.', type: 'SOC', dueDate: daysFrom(7), assignedTo: 'David Chen', status: 'Due' },
  { id: 'oa5', patientInitials: 'R.P.', type: 'SOC', dueDate: daysFrom(14), assignedTo: 'Sarah Mitchell', status: 'Due' },
  { id: 'oa6', patientInitials: 'B.T.', type: 'Discharge', dueDate: daysAgo(3), assignedTo: 'Sarah Mitchell', status: 'Rejected', rejectionReason: 'Missing M1028 — Active Diagnosis' },
  { id: 'oa7', patientInitials: 'L.H.', type: 'SOC', dueDate: daysAgo(2), assignedTo: 'Robert Taylor', status: 'Accepted' },
  { id: 'oa8', patientInitials: 'C.W.', type: 'ROC', dueDate: daysFrom(3), assignedTo: 'James Wilson', status: 'Accepted' },
];

export const seedHOPE: HOPEAssessment[] = [
  { id: 'ha1', patientInitials: 'L.H.', type: 'HOPE Admission', dueDate: daysAgo(2), assignedTo: 'Robert Taylor', status: 'Accepted', iqiesStatus: 'Accepted' },
  { id: 'ha2', patientInitials: 'L.H.', type: 'HOPE Update Visit 1', dueDate: daysFrom(14), assignedTo: 'Robert Taylor', status: 'Due', iqiesStatus: 'Pending' },
  { id: 'ha3', patientInitials: 'L.H.', type: 'HOPE Update Visit 2', dueDate: daysFrom(28), assignedTo: 'Robert Taylor', status: 'Due', iqiesStatus: 'Pending' },
  { id: 'ha4', patientInitials: 'L.H.', type: 'HOPE Discharge', dueDate: daysFrom(90), assignedTo: 'Robert Taylor', status: 'Due', iqiesStatus: 'Pending' },
];

export const seedPartners: ReferralPartner[] = [
  {
    id: 'p1', name: 'Memorial Hermann', type: 'Hospital', volume: 18, acceptedReferrals: 14, declinedReferrals: 2, avgTimeToSOC: '3.2 days',
    lostReasons: ['Insurance Denial', 'Patient Declined'], lastFollowUp: daysAgo(2), nextFollowUpReminder: daysFrom(5), notes: 'Top referral source. Strong relationship with discharge planning team.',
    contactName: 'Jennifer Adams', contactEmail: 'j.adams@memorialhermann.demo', contactPhone: '(713) 555-0101',
    timeline: [
      { date: daysAgo(30), action: 'Partnership renewed', user: 'VP User' },
      { date: daysAgo(14), action: 'Monthly review meeting', user: 'VP User' },
      { date: daysAgo(2), action: 'Follow-up completed', user: 'Sarah L.' },
    ],
    trends: [
      { period: '30d', volume: 18, accepted: 14, declined: 2 },
      { period: '60d', volume: 15, accepted: 12, declined: 1 },
      { period: '90d', volume: 12, accepted: 10, declined: 1 },
    ],
    relationshipOwner: 'VP User', riskLabel: 'Growing',
  },
  {
    id: 'p2', name: 'St. Luke\'s', type: 'Hospital', volume: 12, acceptedReferrals: 8, declinedReferrals: 3, avgTimeToSOC: '4.1 days',
    lostReasons: ['Coverage Area', 'Insurance Denial', 'Staffing'], lastFollowUp: daysAgo(7), nextFollowUpReminder: today, notes: 'Moderate volume. Working on improving conversion rate.',
    contactName: 'Robert Kim', contactEmail: 'r.kim@stlukes.demo', contactPhone: '(713) 555-0202',
    timeline: [
      { date: daysAgo(30), action: 'QBR completed', user: 'VP User' },
      { date: daysAgo(7), action: 'Follow-up completed', user: 'Sarah L.' },
    ],
    trends: [
      { period: '30d', volume: 12, accepted: 8, declined: 3 },
      { period: '60d', volume: 14, accepted: 10, declined: 2 },
      { period: '90d', volume: 16, accepted: 13, declined: 1 },
    ],
    relationshipOwner: 'Sarah L.', riskLabel: 'Needs Attention',
  },
  {
    id: 'p3', name: 'Houston Methodist', type: 'Hospital', volume: 8, acceptedReferrals: 6, declinedReferrals: 1, avgTimeToSOC: '2.8 days',
    lostReasons: ['Patient Declined'], lastFollowUp: daysAgo(5), nextFollowUpReminder: daysFrom(2), notes: 'Growing relationship. Fast SOC times.',
    contactName: 'Lisa Park', contactEmail: 'l.park@methodist.demo', contactPhone: '(713) 555-0303',
    timeline: [
      { date: daysAgo(21), action: 'Initial outreach meeting', user: 'VP User' },
      { date: daysAgo(5), action: 'Follow-up completed', user: 'Mike R.' },
    ],
    trends: [
      { period: '30d', volume: 8, accepted: 6, declined: 1 },
      { period: '60d', volume: 5, accepted: 4, declined: 0 },
      { period: '90d', volume: 3, accepted: 2, declined: 0 },
    ],
    relationshipOwner: 'VP User', riskLabel: 'Growing',
  },
  {
    id: 'p4', name: 'MD Anderson', type: 'Hospital', volume: 4, acceptedReferrals: 4, declinedReferrals: 0, avgTimeToSOC: '2.5 days',
    lostReasons: [], lastFollowUp: daysAgo(3), nextFollowUpReminder: daysFrom(4), notes: 'Hospice-focused referrals. 100% conversion.',
    contactName: 'Dr. James Lee', contactEmail: 'j.lee@mdanderson.demo', contactPhone: '(713) 555-0404',
    timeline: [
      { date: daysAgo(15), action: 'Partnership established', user: 'VP User' },
      { date: daysAgo(3), action: 'Follow-up completed', user: 'VP User' },
    ],
    trends: [
      { period: '30d', volume: 4, accepted: 4, declined: 0 },
      { period: '60d', volume: 3, accepted: 3, declined: 0 },
      { period: '90d', volume: 2, accepted: 2, declined: 0 },
    ],
    relationshipOwner: 'VP User', riskLabel: 'Growing',
  },
  {
    id: 'p5', name: 'Dr. Martinez', type: 'Physician', volume: 2, acceptedReferrals: 1, declinedReferrals: 1, avgTimeToSOC: '5.0 days',
    lostReasons: ['Staffing'], lastFollowUp: daysAgo(14), nextFollowUpReminder: daysAgo(1), notes: 'Low volume. Needs re-engagement.',
    contactName: 'Dr. Ana Martinez', contactEmail: 'a.martinez@clinic.demo', contactPhone: '(713) 555-0505',
    timeline: [
      { date: daysAgo(30), action: 'Initial contact', user: 'Sarah L.' },
      { date: daysAgo(14), action: 'Follow-up completed', user: 'Sarah L.' },
    ],
    trends: [
      { period: '30d', volume: 2, accepted: 1, declined: 1 },
      { period: '60d', volume: 4, accepted: 3, declined: 0 },
      { period: '90d', volume: 5, accepted: 4, declined: 0 },
    ],
    relationshipOwner: 'Sarah L.', riskLabel: 'At Risk',
  },
];

export const seedAlerts: AlertItem[] = [
  { id: 'al1', type: 'expired_credential', severity: 'critical', title: 'Expired: Maria Garcia — OT License', details: 'OT License expired 5 days ago. Maria Garcia cannot be assigned to visits.', timestamp: hoursAgo(5), acknowledged: false, sourceRecordType: 'Compliance', sourceRecordId: 'c4', owner: 'Compliance Admin' },
  { id: 'al2', type: 'expired_credential', severity: 'critical', title: 'Expired: David Chen — TB Test', details: 'TB Test expired 10 days ago. David Chen cannot be assigned to visits.', timestamp: hoursAgo(10), acknowledged: false, sourceRecordType: 'Compliance', sourceRecordId: 'c10', owner: 'Compliance Admin' },
  { id: 'al3', type: 'critical_soon_credential', severity: 'high', title: 'Expiring Soon: Robert Taylor — CHPN', details: 'CHPN Certification expires in 5 days.', timestamp: hoursAgo(12), acknowledged: false, sourceRecordType: 'Compliance', sourceRecordId: 'c9', owner: 'Compliance Admin' },
  { id: 'al4', type: 'sla_breach', severity: 'critical', title: 'SLA Breach: B.T. — SN', details: 'SLA deadline overdue by 1 day. Immediate action required.', timestamp: hoursAgo(24), acknowledged: false, sourceRecordType: 'Referral', sourceRecordId: 'ref4', owner: 'Sarah L.' },
  { id: 'al5', type: 'sla_risk', severity: 'high', title: 'SLA Risk: J.D. — SN', details: 'SLA deadline is today. Staff assignment needed.', timestamp: hoursAgo(2), acknowledged: false, sourceRecordType: 'Referral', sourceRecordId: 'ref1', owner: 'Sarah L.' },
  { id: 'al6', type: 'late_note', severity: 'medium', title: 'Late Note: M.K. — David Chen', details: 'Documentation note overdue by 1 day.', timestamp: hoursAgo(26), acknowledged: false, sourceRecordType: 'Quality', sourceRecordId: 'q3', owner: 'David Chen' },
  { id: 'al7', type: 'uncovered_high_acuity', severity: 'critical', title: 'Uncovered: J.D. — Immediate SN', details: 'High-acuity immediate patient J.D. in Staffing stage without assigned clinician.', timestamp: hoursAgo(3), acknowledged: false, sourceRecordType: 'Referral', sourceRecordId: 'ref1', owner: 'Mike R.' },
  { id: 'al8', type: 'incident', severity: 'high', title: 'Incident: A.R. — Fall Risk', details: 'Incident report filed by Maria Garcia. Under review.', timestamp: hoursAgo(48), acknowledged: true, acknowledgedBy: 'Compliance Admin', acknowledgedAt: hoursAgo(46), sourceRecordType: 'Quality', sourceRecordId: 'q9', owner: 'Maria Garcia' },
  { id: 'al9', type: 'late_note', severity: 'medium', title: 'Late Note: J.D. — Sarah Mitchell', details: 'Documentation note overdue by 3 days. Now resolved.', timestamp: hoursAgo(72), acknowledged: true, acknowledgedBy: 'Sarah Mitchell', acknowledgedAt: hoursAgo(70), sourceRecordType: 'Quality', sourceRecordId: 'q10', owner: 'Sarah Mitchell' },
  { id: 'al10', type: 'sla_risk', severity: 'high', title: 'SLA Risk: L.H. — Hospice', details: 'SLA deadline in 1 day. SOC visit scheduled.', timestamp: hoursAgo(6), acknowledged: false, sourceRecordType: 'Referral', sourceRecordId: 'ref5', owner: 'Mike R.' },
];

export const seedShiftBoard: ShiftBoardEntry[] = [
  { id: 'sb1', referralId: 'ref1', patientInitials: 'J.D.', serviceType: 'SN', acuity: 'High', neededRole: 'RN', deadline: daysFrom(0), status: 'Open' },
  { id: 'sb2', referralId: 'ref4', patientInitials: 'B.T.', serviceType: 'SN', acuity: 'High', neededRole: 'RN', deadline: daysAgo(1), status: 'Open' },
];

export const seedOfflineSync: OfflineSyncItem[] = [
  { id: 'os1', visitId: 'v4', patientInitials: 'C.W.', action: 'EVV data sync', status: 'Failed', queuedAt: hoursAgo(2), retryCount: 3 },
  { id: 'os2', visitId: 'v1', patientInitials: 'J.D.', action: 'Checklist update', status: 'Pending', queuedAt: hoursAgo(0.5), retryCount: 0 },
];

export const seedAuditLog: AuditEntry[] = [
  { id: 'audit1', timestamp: hoursAgo(48), user: 'Sarah L.', role: 'Intake Coordinator', action: 'Created', recordType: 'Referral', recordId: 'ref1', details: 'New referral J.D. from Memorial Hermann' },
  { id: 'audit2', timestamp: hoursAgo(36), user: 'Sarah L.', role: 'Intake Coordinator', action: 'Updated', recordType: 'Referral', recordId: 'ref1', details: 'Uploaded all documents for J.D.', before: '0 docs', after: '4 docs' },
  { id: 'audit3', timestamp: hoursAgo(24), user: 'Sarah L.', role: 'Intake Coordinator', action: 'Updated', recordType: 'Referral', recordId: 'ref1', details: 'Stage changed to Staffing for J.D.', before: 'Eligibility', after: 'Staffing' },
  { id: 'audit4', timestamp: hoursAgo(48), user: 'Maria Garcia', role: 'Field Staff', action: 'Created', recordType: 'Quality', recordId: 'q9', details: 'Incident reported for A.R.' },
  { id: 'audit5', timestamp: hoursAgo(46), user: 'Compliance Admin', role: 'Compliance Admin', action: 'Updated', recordType: 'Alert', recordId: 'al8', details: 'Acknowledged incident alert for A.R.' },
  { id: 'audit6', timestamp: hoursAgo(12), user: 'VP User', role: 'VP', action: 'Viewed', recordType: 'Dashboard', recordId: 'dashboard', details: 'VP accessed executive dashboard' },
];
