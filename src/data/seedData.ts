// ==============================
// AdvisaCare VP Command Center — Seed Data (Phase 3)
// All data is fake/demo only. No real PHI.
// ==============================

import type {
  Referral, StaffMember, ComplianceItem, FieldVisit, QualityItem,
  OASISAssessment, HOPEAssessment, ReferralPartner, AuditEntry,
  AlertItem, ShiftBoardEntry, OfflineSyncItem, CatastrophicCase,
} from '../types';

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function daysFrom(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3600000).toISOString();
}
function hoursFrom(n: number): string {
  return new Date(Date.now() + n * 3600000).toISOString();
}

// ========== REFERRALS ==========
export const seedReferrals: Referral[] = [
  {
    id: 'REF-001', patientInitials: 'J.D.', serviceType: 'SN', urgency: 'Immediate',
    source: 'Memorial Hospital', dischargeFacility: 'Memorial Hospital', dischargeDate: daysFrom(3),
    slaDeadline: daysFrom(1), slaDeadlineAt: hoursFrom(18),
    stage: 'Missing Docs', assignedOwner: 'Sarah L.', branch: 'Houston',
    insuranceStatus: 'Verified', nextFollowUpDate: daysFrom(1),
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(1) },
      { type: 'Physician Orders', uploaded: false },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Discharge Summary', uploaded: false },
    ],
    documentsUploaded: 2, missingItems: 2, physicianOrdersReceived: false,
    createdAt: hoursAgo(30), recommendedNextAction: 'Collect missing documents: Physician Orders, Discharge Summary',
    readiness: 'Missing Docs',
    timeline: [
      { date: daysAgo(1), action: 'Referral received', user: 'Sarah L.', details: 'From Memorial Hospital' },
      { date: daysAgo(1), action: 'Face-to-Face uploaded', user: 'Sarah L.' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(30), docsRequestedAt: hoursAgo(28) },
  },
  {
    id: 'REF-002', patientInitials: 'M.B.', serviceType: 'PT', urgency: 'Routine',
    source: 'St. Luke\'s', dischargeFacility: 'St. Luke\'s', dischargeDate: daysFrom(7),
    slaDeadline: daysFrom(5), slaDeadlineAt: hoursFrom(110),
    stage: 'Eligibility', assignedOwner: 'Sarah L.', branch: 'Dallas',
    insuranceStatus: 'Pending', nextFollowUpDate: daysFrom(2),
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(3) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(3) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(1) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(72), recommendedNextAction: 'Complete eligibility verification and advance to Staffing',
    readiness: 'Ready for Eligibility',
    timeline: [
      { date: daysAgo(3), action: 'Referral received', user: 'Sarah L.' },
      { date: daysAgo(2), action: 'All documents received', user: 'Sarah L.' },
      { date: daysAgo(1), action: 'Stage → Eligibility', user: 'Sarah L.' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(72), docsRequestedAt: hoursAgo(70), docsCompleteAt: hoursAgo(48), eligibilityStartedAt: hoursAgo(24) },
  },
  {
    id: 'REF-003', patientInitials: 'R.W.', serviceType: 'SN', urgency: 'Urgent 24-48 hours',
    source: 'Memorial Hospital', dischargeFacility: 'Memorial Hospital', dischargeDate: daysFrom(2),
    slaDeadline: daysAgo(1), slaDeadlineAt: hoursAgo(12),
    stage: 'Staffing', assignedOwner: 'Mike R.', branch: 'Houston',
    insuranceStatus: 'Verified', nextFollowUpDate: daysFrom(0),
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(4) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(3) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(4) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(3) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(96), recommendedNextAction: 'Assign qualified clinician',
    readiness: 'Ready for Staffing',
    timeline: [
      { date: daysAgo(4), action: 'Referral received', user: 'Sarah L.' },
      { date: daysAgo(3), action: 'All documents received', user: 'Sarah L.' },
      { date: daysAgo(2), action: 'Insurance verified', user: 'Sarah L.' },
      { date: daysAgo(1), action: 'Stage → Staffing', user: 'Mike R.' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(96), docsRequestedAt: hoursAgo(94), docsCompleteAt: hoursAgo(72), eligibilityStartedAt: hoursAgo(48), eligibilityVerifiedAt: hoursAgo(36), staffingStartedAt: hoursAgo(24) },
  },
  {
    id: 'REF-004', patientInitials: 'T.S.', serviceType: 'Hospice', urgency: 'Immediate',
    source: 'Bayou Hospice Group', dischargeFacility: 'Home', dischargeDate: daysFrom(1),
    slaDeadline: daysFrom(0), slaDeadlineAt: hoursFrom(6),
    stage: 'Staffing', assignedOwner: 'Mike R.', branch: 'Houston',
    insuranceStatus: 'Verified', nextFollowUpDate: daysFrom(0),
    documents: [
      { type: 'Hospice Order', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Eligibility Note', uploaded: true, uploadedAt: daysAgo(1) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Face Sheet', uploaded: true, uploadedAt: daysAgo(1) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(50), recommendedNextAction: 'Assign qualified clinician',
    readiness: 'Ready for Staffing',
    timeline: [
      { date: daysAgo(2), action: 'Referral received', user: 'Sarah L.' },
      { date: daysAgo(1), action: 'All docs complete', user: 'Sarah L.' },
      { date: daysAgo(0), action: 'Stage → Staffing', user: 'Mike R.' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(50), docsRequestedAt: hoursAgo(48), docsCompleteAt: hoursAgo(24), eligibilityStartedAt: hoursAgo(20), eligibilityVerifiedAt: hoursAgo(12), staffingStartedAt: hoursAgo(6) },
  },
  {
    id: 'REF-005', patientInitials: 'A.C.', serviceType: 'Personal Care', urgency: 'Routine',
    source: 'Dr. Patel (PCP)', dischargeFacility: 'Home', dischargeDate: daysFrom(10),
    slaDeadline: daysFrom(8), slaDeadlineAt: hoursFrom(190),
    stage: 'New', assignedOwner: 'Sarah L.', branch: 'Dallas',
    insuranceStatus: 'Pending', nextFollowUpDate: daysFrom(3),
    documents: [
      { type: 'Service Authorization', uploaded: false },
      { type: 'Care Plan', uploaded: false },
      { type: 'Insurance/Medicaid Info', uploaded: false },
    ],
    documentsUploaded: 0, missingItems: 3, physicianOrdersReceived: false,
    createdAt: hoursAgo(4), recommendedNextAction: 'Collect missing documents: Service Authorization, Care Plan, Insurance/Medicaid Info',
    readiness: 'Missing Docs',
    timeline: [
      { date: daysAgo(0), action: 'Referral received', user: 'Sarah L.', details: 'From Dr. Patel' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(4) },
  },
  {
    id: 'REF-006', patientInitials: 'B.H.', serviceType: 'Catastrophic Care', urgency: 'Immediate',
    source: 'Workers Comp Adjuster', dischargeFacility: 'TIRR Memorial Hermann', dischargeDate: daysFrom(2),
    slaDeadline: daysFrom(1), slaDeadlineAt: hoursFrom(20),
    stage: 'Missing Docs', assignedOwner: 'Sarah L.', branch: 'Houston',
    insuranceStatus: 'Verified', nextFollowUpDate: daysFrom(0),
    documents: [
      { type: 'Orders', uploaded: true, uploadedAt: daysAgo(1) },
      { type: 'Case Manager Contact', uploaded: true, uploadedAt: daysAgo(1) },
      { type: 'Authorization', uploaded: false },
      { type: 'Care Plan', uploaded: false },
      { type: 'Equipment/Supplies', uploaded: false },
    ],
    documentsUploaded: 2, missingItems: 3, physicianOrdersReceived: false,
    createdAt: hoursAgo(28), recommendedNextAction: 'Collect missing documents: Authorization, Care Plan, Equipment/Supplies',
    readiness: 'Missing Docs',
    timeline: [
      { date: daysAgo(1), action: 'Referral received', user: 'Sarah L.', details: 'Catastrophic care case — TBI/vent' },
      { date: daysAgo(0), action: 'Partial docs uploaded', user: 'Sarah L.' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(28), docsRequestedAt: hoursAgo(26) },
  },
  {
    id: 'REF-007', patientInitials: 'L.K.', serviceType: 'SN', urgency: 'Routine',
    source: 'St. Luke\'s', dischargeFacility: 'St. Luke\'s', dischargeDate: daysFrom(12),
    slaDeadline: daysFrom(10), slaDeadlineAt: hoursFrom(240),
    stage: 'Scheduled', assignedOwner: 'Mike R.', branch: 'Dallas',
    insuranceStatus: 'Verified', nextFollowUpDate: daysFrom(5),
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(5) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(4) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(5) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(3) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(120), recommendedNextAction: 'Confirm SOC visit with patient and clinician',
    readiness: 'Ready for SOC',
    timeline: [
      { date: daysAgo(5), action: 'Referral received', user: 'Sarah L.' },
      { date: daysAgo(3), action: 'Insurance verified', user: 'Sarah L.' },
      { date: daysAgo(2), action: 'Staff assigned — Lisa Anderson', user: 'Mike R.', details: 'Match score: 85/110' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(120), docsRequestedAt: hoursAgo(118), docsCompleteAt: hoursAgo(96), eligibilityStartedAt: hoursAgo(72), eligibilityVerifiedAt: hoursAgo(60), staffingStartedAt: hoursAgo(48), staffAssignedAt: hoursAgo(36), socScheduledAt: hoursAgo(12) },
  },
  {
    id: 'REF-008', patientInitials: 'S.G.', serviceType: 'OT', urgency: 'Routine',
    source: 'Dr. Patel (PCP)', dischargeFacility: 'Home', dischargeDate: daysFrom(14),
    slaDeadline: daysFrom(12), slaDeadlineAt: hoursFrom(288),
    stage: 'Started', assignedOwner: 'Sarah L.', branch: 'Houston',
    insuranceStatus: 'Verified', nextFollowUpDate: daysFrom(7),
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(10) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(9) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(10) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(8) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(240), recommendedNextAction: 'Monitor ongoing care',
    readiness: 'Ready for SOC',
    timeline: [
      { date: daysAgo(10), action: 'Referral received', user: 'Sarah L.' },
      { date: daysAgo(7), action: 'SOC visit completed', user: 'Sarah Mitchell' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(240), docsCompleteAt: hoursAgo(192), eligibilityVerifiedAt: hoursAgo(168), staffAssignedAt: hoursAgo(144), socScheduledAt: hoursAgo(120), socCompletedAt: hoursAgo(72) },
  },
  {
    id: 'REF-009', patientInitials: 'P.M.', serviceType: 'SN', urgency: 'Routine',
    source: 'Memorial Hospital', dischargeFacility: 'Memorial Hospital', dischargeDate: daysAgo(3),
    slaDeadline: daysAgo(5), slaDeadlineAt: hoursAgo(100),
    stage: 'Declined', assignedOwner: 'Sarah L.', branch: 'Houston',
    insuranceStatus: 'Denied', nextFollowUpDate: daysAgo(2),
    declineReason: 'Insurance denied — patient referred to alternative provider.',
    lostReason: 'Insurance',
    documents: [
      { type: 'Face-to-Face', uploaded: true, uploadedAt: daysAgo(8) },
      { type: 'Physician Orders', uploaded: true, uploadedAt: daysAgo(7) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(8) },
      { type: 'Discharge Summary', uploaded: true, uploadedAt: daysAgo(7) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(200), recommendedNextAction: 'Closed — declined',
    readiness: 'Ready for SOC',
    timeline: [
      { date: daysAgo(8), action: 'Referral received', user: 'Sarah L.' },
      { date: daysAgo(5), action: 'Stage → Declined', user: 'Sarah L.', details: 'Insurance denied' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(200), declinedAt: hoursAgo(120) },
  },
  {
    id: 'REF-010', patientInitials: 'K.N.', serviceType: 'Hospice', urgency: 'Urgent 24-48 hours',
    source: 'Bayou Hospice Group', dischargeFacility: 'Home', dischargeDate: daysFrom(4),
    slaDeadline: daysFrom(2), slaDeadlineAt: hoursFrom(44),
    stage: 'Eligibility', assignedOwner: 'Sarah L.', branch: 'Dallas',
    insuranceStatus: 'Pending', nextFollowUpDate: daysFrom(1),
    documents: [
      { type: 'Hospice Order', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Eligibility Note', uploaded: true, uploadedAt: daysAgo(1) },
      { type: 'Insurance Card', uploaded: true, uploadedAt: daysAgo(2) },
      { type: 'Face Sheet', uploaded: true, uploadedAt: daysAgo(1) },
    ],
    documentsUploaded: 4, missingItems: 0, physicianOrdersReceived: true,
    createdAt: hoursAgo(56), recommendedNextAction: 'Complete eligibility verification and advance to Staffing',
    readiness: 'Ready for Eligibility',
    timeline: [
      { date: daysAgo(2), action: 'Referral received', user: 'Sarah L.' },
      { date: daysAgo(1), action: 'All docs complete', user: 'Sarah L.' },
    ],
    stageTimestamps: { receivedAt: hoursAgo(56), docsRequestedAt: hoursAgo(54), docsCompleteAt: hoursAgo(32), eligibilityStartedAt: hoursAgo(20) },
  },
];

// ========== STAFF ==========
export const seedStaff: StaffMember[] = [
  {
    id: 'STF-001', name: 'Lisa Anderson', role: 'RN', location: 'Houston',
    specialty: ['Wound Care', 'SN'], skillTags: ['wound care', 'IV'], availability: 'Available',
    todayVisits: 3, maxVisits: 6, shiftStatus: 'Confirmed',
    certifications: ['RN License', 'BLS', 'Wound Care Certified'],
    overtimeRisk: 'Low', continuityPatients: ['J.D.', 'L.K.'],
  },
  {
    id: 'STF-002', name: 'Robert Chen', role: 'PT', location: 'Dallas',
    specialty: ['Physical Therapy', 'PT'], skillTags: ['ADL'], availability: 'Partially',
    todayVisits: 5, maxVisits: 6, shiftStatus: 'Confirmed',
    certifications: ['PT License', 'BLS'],
    overtimeRisk: 'High', continuityPatients: ['M.B.'],
  },
  {
    id: 'STF-003', name: 'Sarah Mitchell', role: 'RN', location: 'Houston',
    specialty: ['Hospice', 'SN'], skillTags: ['hospice', 'IV', 'vent/trach'], availability: 'Available',
    todayVisits: 2, maxVisits: 5, shiftStatus: 'Confirmed',
    certifications: ['RN License', 'CHPN', 'BLS'],
    overtimeRisk: 'Low', continuityPatients: ['T.S.'],
  },
  {
    id: 'STF-004', name: 'James Parker', role: 'HHA', location: 'Houston',
    specialty: ['Personal Care'], skillTags: ['ADL', 'TBI'], availability: 'Available',
    todayVisits: 4, maxVisits: 8, shiftStatus: 'Confirmed',
    certifications: ['HHA Certified', 'BLS', 'CNA'],
    overtimeRisk: 'Medium', continuityPatients: [],
  },
  {
    id: 'STF-005', name: 'Maria Gonzalez', role: 'LPN', location: 'Dallas',
    specialty: ['SN', 'Wound Care'], skillTags: ['wound care', 'SCI'], availability: 'Unavailable',
    todayVisits: 0, maxVisits: 6, shiftStatus: 'Declined',
    certifications: ['LPN License', 'BLS'],
    overtimeRisk: 'Low', continuityPatients: [],
  },
  {
    id: 'STF-006', name: 'David Thompson', role: 'RN', location: 'Houston',
    specialty: ['Catastrophic Care', 'SN'], skillTags: ['vent/trach', 'TBI', 'SCI', 'wound care', 'IV'], availability: 'Available',
    todayVisits: 1, maxVisits: 4, shiftStatus: 'Confirmed',
    certifications: ['RN License', 'BLS', 'ACLS', 'Vent/Trach Certified'],
    overtimeRisk: 'Low', continuityPatients: ['B.H.'],
  },
];

// ========== COMPLIANCE ==========
export const seedCompliance: ComplianceItem[] = [
  { id: 'CMP-001', staffId: 'STF-001', staffName: 'Lisa Anderson', itemType: 'RN License', expiryDate: daysFrom(180), lastCompleted: daysAgo(90), status: 'Compliant' },
  { id: 'CMP-002', staffId: 'STF-001', staffName: 'Lisa Anderson', itemType: 'BLS Certification', expiryDate: daysFrom(45), lastCompleted: daysAgo(320), status: 'Due Soon' },
  { id: 'CMP-003', staffId: 'STF-002', staffName: 'Robert Chen', itemType: 'PT License', expiryDate: daysFrom(200), lastCompleted: daysAgo(60), status: 'Compliant' },
  { id: 'CMP-004', staffId: 'STF-003', staffName: 'Sarah Mitchell', itemType: 'RN License', expiryDate: daysFrom(150), lastCompleted: daysAgo(120), status: 'Compliant' },
  { id: 'CMP-005', staffId: 'STF-003', staffName: 'Sarah Mitchell', itemType: 'CHPN', expiryDate: daysFrom(20), lastCompleted: daysAgo(340), status: 'Critical Soon' },
  { id: 'CMP-006', staffId: 'STF-005', staffName: 'Maria Gonzalez', itemType: 'LPN License', expiryDate: daysAgo(10), lastCompleted: daysAgo(380), status: 'Expired' },
  { id: 'CMP-007', staffId: 'STF-005', staffName: 'Maria Gonzalez', itemType: 'BLS Certification', expiryDate: daysAgo(5), lastCompleted: daysAgo(370), status: 'Expired' },
  { id: 'CMP-008', staffId: 'STF-004', staffName: 'James Parker', itemType: 'HHA Certification', expiryDate: daysFrom(300), lastCompleted: daysAgo(30), status: 'Compliant' },
  { id: 'CMP-009', staffId: 'STF-006', staffName: 'David Thompson', itemType: 'RN License', expiryDate: daysFrom(250), lastCompleted: daysAgo(50), status: 'Compliant' },
  { id: 'CMP-010', staffId: 'STF-006', staffName: 'David Thompson', itemType: 'Vent/Trach Cert', expiryDate: daysFrom(25), lastCompleted: daysAgo(335), status: 'Critical Soon' },
];

// ========== VISITS ==========
export const seedVisits: FieldVisit[] = [
  {
    id: 'VIS-001', patientInitials: 'J.D.', address: '1234 Oak St, Houston, TX 77001', time: '09:00 AM',
    serviceType: 'SN', visitStatus: 'Scheduled', staffName: 'Sarah Mitchell',
    acuity: 'High',
    checklist: [
      { task: 'Verify patient identity', completed: false },
      { task: 'Complete wound assessment', completed: false },
      { task: 'Administer medications', completed: false },
      { task: 'Update care plan', completed: false },
      { task: 'Document visit', completed: false },
    ],
    evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Pending', patientSignature: false, caregiverSignature: false },
    suppliesNeeded: ['Wound dressing kit', 'Gauze pads', 'Normal saline'],
    notes: 'Post-surgical wound care. Patient has limited mobility.',
    evvExceptions: [],
  },
  {
    id: 'VIS-002', patientInitials: 'M.B.', address: '5678 Elm Ave, Dallas, TX 75001', time: '11:00 AM',
    serviceType: 'PT', visitStatus: 'In Progress', staffName: 'Robert Chen',
    acuity: 'Medium',
    checklist: [
      { task: 'Verify patient identity', completed: true },
      { task: 'Range of motion exercises', completed: true },
      { task: 'Gait training', completed: false },
      { task: 'Document visit', completed: false },
    ],
    evv: { clockIn: hoursAgo(1), clockOut: null, gpsLatitude: '32.7767', gpsLongitude: '-96.7970', gpsAddress: '5678 Elm Ave, Dallas', syncStatus: 'Pending', patientSignature: false, caregiverSignature: false },
    suppliesNeeded: ['Resistance bands', 'Gait belt'],
    notes: 'Patient progressing well. Focus on gait training.',
    evvExceptions: [],
  },
  {
    id: 'VIS-003', patientInitials: 'S.G.', address: '9012 Pine Rd, Houston, TX 77002', time: '02:00 PM',
    serviceType: 'OT', visitStatus: 'Completed', staffName: 'Sarah Mitchell',
    acuity: 'Medium',
    checklist: [
      { task: 'Verify patient identity', completed: true },
      { task: 'ADL assessment', completed: true },
      { task: 'Fine motor exercises', completed: true },
      { task: 'Document visit', completed: true },
    ],
    evv: { clockIn: hoursAgo(6), clockOut: hoursAgo(5), gpsLatitude: '29.7604', gpsLongitude: '-95.3698', gpsAddress: '9012 Pine Rd, Houston', syncStatus: 'Synced', patientSignature: true, caregiverSignature: false },
    suppliesNeeded: [],
    notes: 'Patient demonstrated improved grip strength.',
    evvExceptions: [],
    signatureCaptured: true,
  },
  {
    id: 'VIS-004', patientInitials: 'R.W.', address: '3456 Cedar Ln, Houston, TX 77003', time: '08:00 AM',
    serviceType: 'SN', visitStatus: 'Missed', staffName: 'Lisa Anderson',
    acuity: 'High',
    checklist: [
      { task: 'Verify patient identity', completed: false },
      { task: 'IV medication administration', completed: false },
      { task: 'Document visit', completed: false },
    ],
    evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Failed', patientSignature: false, caregiverSignature: false },
    suppliesNeeded: ['IV supplies', 'Medications'],
    notes: 'Patient not home at scheduled time. Rescheduling required.',
    evvExceptions: [
      { id: 'EXC-001', visitId: 'VIS-004', type: 'Missed Clock-In', reason: 'Patient not home at scheduled time' },
    ],
  },
  {
    id: 'VIS-005', patientInitials: 'T.S.', address: '7890 Maple Dr, Houston, TX 77004', time: '03:00 PM',
    serviceType: 'Hospice', visitStatus: 'Scheduled', staffName: 'Sarah Mitchell',
    acuity: 'High',
    checklist: [
      { task: 'Verify patient identity', completed: false },
      { task: 'Pain assessment', completed: false },
      { task: 'Symptom management', completed: false },
      { task: 'Family support assessment', completed: false },
      { task: 'Document visit', completed: false },
    ],
    evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Pending', patientSignature: false, caregiverSignature: false },
    suppliesNeeded: ['Comfort care kit', 'Medication box'],
    notes: 'Hospice comfort visit. Family meeting scheduled.',
    evvExceptions: [],
  },
];

// ========== QUALITY ==========
export const seedQuality: QualityItem[] = [
  { id: 'QL-001', type: 'Late Note', category: 'Home Health', patientInitials: 'J.D.', dueDate: daysAgo(2), status: 'Open', priority: 'High', assignedTo: 'Sarah Mitchell' },
  { id: 'QL-002', type: 'OASIS Review', category: 'Home Health', patientInitials: 'M.B.', dueDate: daysFrom(3), status: 'In Progress', priority: 'Medium', assignedTo: 'Robert Chen', reviewerName: 'QA Team' },
  { id: 'QL-003', type: 'Late Note', category: 'General QA', patientInitials: 'R.W.', dueDate: daysAgo(1), status: 'Open', priority: 'High', assignedTo: 'Lisa Anderson' },
  { id: 'QL-004', type: 'Incident Report', category: 'Home Health', patientInitials: 'S.G.', dueDate: daysFrom(5), status: 'Complete', priority: 'Low', assignedTo: 'Sarah Mitchell' },
  { id: 'QL-005', type: 'Care Plan Review', category: 'Hospice', patientInitials: 'T.S.', dueDate: daysFrom(2), status: 'Open', priority: 'Medium', assignedTo: 'Sarah Mitchell' },
  { id: 'QL-006', type: 'HOPE Coordination', category: 'Hospice', patientInitials: 'K.N.', dueDate: daysFrom(4), status: 'Open', priority: 'Medium', assignedTo: 'Sarah Mitchell' },
];

// ========== OASIS ==========
export const seedOASIS: OASISAssessment[] = [
  { id: 'OA-001', patientInitials: 'J.D.', type: 'SOC', dueDate: daysFrom(2), assignedTo: 'Sarah Mitchell', status: 'Due' },
  { id: 'OA-002', patientInitials: 'M.B.', type: 'ROC', dueDate: daysFrom(5), assignedTo: 'Robert Chen', status: 'Submitted' },
  { id: 'OA-003', patientInitials: 'S.G.', type: 'Recertification', dueDate: daysAgo(1), assignedTo: 'Sarah Mitchell', status: 'Accepted' },
  { id: 'OA-004', patientInitials: 'R.W.', type: 'SOC', dueDate: daysAgo(3), assignedTo: 'Lisa Anderson', status: 'Due' },
  { id: 'OA-005', patientInitials: 'L.K.', type: 'SOC', dueDate: daysFrom(7), assignedTo: 'Lisa Anderson', status: 'Rejected', rejectionReason: 'Missing M1800 functional assessment data' },
];

// ========== HOPE ==========
export const seedHOPE: HOPEAssessment[] = [
  { id: 'HP-001', patientInitials: 'T.S.', type: 'HOPE Admission', dueDate: daysFrom(3), assignedTo: 'Sarah Mitchell', status: 'Due', iqiesStatus: 'Pending' },
  { id: 'HP-002', patientInitials: 'K.N.', type: 'HOPE Admission', dueDate: daysAgo(2), assignedTo: 'Sarah Mitchell', status: 'Due', iqiesStatus: 'Pending' },
  { id: 'HP-003', patientInitials: 'T.S.', type: 'HOPE Update Visit 1', dueDate: daysFrom(10), assignedTo: 'Sarah Mitchell', status: 'Submitted', iqiesStatus: 'Submitted' },
];

// ========== PARTNERS ==========
export const seedPartners: ReferralPartner[] = [
  {
    id: 'PTR-001', name: 'Memorial Hospital', type: 'Hospital',
    volume: 15, acceptedReferrals: 12, declinedReferrals: 3,
    avgTimeToSOC: '3.2 days', lostReasons: ['Insurance', 'Out of Service Area'],
    lastFollowUp: daysAgo(5), nextFollowUpReminder: daysFrom(2),
    notes: 'Top referral source. Weekly case review scheduled.',
    contactName: 'Janet Torres', contactEmail: 'jtorres@memorial.org', contactPhone: '(713) 555-0101',
    timeline: [
      { date: daysAgo(5), action: 'Follow-up completed', user: 'Sarah L.' },
      { date: daysAgo(12), action: 'Contract renewed', user: 'VP User' },
    ],
    trends: [
      { period: '30d', volume: 15, accepted: 12, declined: 3 },
      { period: '60d', volume: 12, accepted: 10, declined: 2 },
      { period: '90d', volume: 10, accepted: 8, declined: 2 },
    ],
    relationshipOwner: 'Sarah L.', riskLabel: 'Growing',
  },
  {
    id: 'PTR-002', name: 'St. Luke\'s', type: 'Hospital',
    volume: 8, acceptedReferrals: 5, declinedReferrals: 3,
    avgTimeToSOC: '4.1 days', lostReasons: ['Capacity', 'Insurance'],
    lastFollowUp: daysAgo(15), nextFollowUpReminder: daysAgo(1),
    notes: 'Follow-up overdue — need to discuss declined referrals.',
    contactName: 'Dr. Alex Kim', contactEmail: 'akim@stlukes.org', contactPhone: '(214) 555-0202',
    timeline: [
      { date: daysAgo(15), action: 'Follow-up completed', user: 'Sarah L.' },
    ],
    trends: [
      { period: '30d', volume: 8, accepted: 5, declined: 3 },
      { period: '60d', volume: 10, accepted: 8, declined: 2 },
      { period: '90d', volume: 12, accepted: 10, declined: 2 },
    ],
    relationshipOwner: 'Sarah L.', riskLabel: 'Needs Attention',
  },
  {
    id: 'PTR-003', name: 'Dr. Patel (PCP)', type: 'Physician',
    volume: 4, acceptedReferrals: 4, declinedReferrals: 0,
    avgTimeToSOC: '5.0 days', lostReasons: [],
    lastFollowUp: daysAgo(3), nextFollowUpReminder: daysFrom(4),
    notes: 'Strong relationship. Consistent referrals.',
    contactName: 'Dr. Raj Patel', contactEmail: 'rpatel@clinic.com', contactPhone: '(713) 555-0303',
    timeline: [
      { date: daysAgo(3), action: 'Follow-up completed', user: 'Sarah L.' },
    ],
    trends: [
      { period: '30d', volume: 4, accepted: 4, declined: 0 },
      { period: '60d', volume: 3, accepted: 3, declined: 0 },
      { period: '90d', volume: 3, accepted: 3, declined: 0 },
    ],
    relationshipOwner: 'Sarah L.', riskLabel: 'Stable',
  },
  {
    id: 'PTR-004', name: 'Bayou Hospice Group', type: 'Case Manager',
    volume: 6, acceptedReferrals: 5, declinedReferrals: 1,
    avgTimeToSOC: '2.8 days', lostReasons: ['Patient Preference'],
    lastFollowUp: daysAgo(7), nextFollowUpReminder: daysFrom(0),
    notes: 'Hospice referral partnership.',
    contactName: 'Mary Wilson', contactEmail: 'mwilson@bayouhospice.org', contactPhone: '(713) 555-0404',
    timeline: [
      { date: daysAgo(7), action: 'Follow-up completed', user: 'Sarah L.' },
    ],
    trends: [
      { period: '30d', volume: 6, accepted: 5, declined: 1 },
      { period: '60d', volume: 5, accepted: 5, declined: 0 },
      { period: '90d', volume: 4, accepted: 4, declined: 0 },
    ],
    relationshipOwner: 'Sarah L.', riskLabel: 'Growing',
  },
  {
    id: 'PTR-005', name: 'Workers Comp Adjuster (Smith & Assoc.)', type: 'Attorney',
    volume: 2, acceptedReferrals: 2, declinedReferrals: 0,
    avgTimeToSOC: '1.5 days', lostReasons: [],
    lastFollowUp: daysAgo(10), nextFollowUpReminder: daysFrom(4),
    notes: 'Catastrophic care referrals. High urgency.',
    contactName: 'Tom Smith', contactEmail: 'tsmith@smithlaw.com', contactPhone: '(713) 555-0505',
    timeline: [
      { date: daysAgo(10), action: 'Initial partnership meeting', user: 'VP User' },
    ],
    trends: [
      { period: '30d', volume: 2, accepted: 2, declined: 0 },
      { period: '60d', volume: 1, accepted: 1, declined: 0 },
      { period: '90d', volume: 0, accepted: 0, declined: 0 },
    ],
    relationshipOwner: 'VP User', riskLabel: 'Growing',
  },
];

// ========== AUDIT LOG ==========
export const seedAuditLog: AuditEntry[] = [
  { id: 'AUD-001', timestamp: hoursAgo(28), user: 'Sarah L.', role: 'Intake Coordinator', action: 'Created', recordType: 'Referral', recordId: 'REF-001', details: 'New referral created for J.D. — SN Immediate' },
  { id: 'AUD-002', timestamp: hoursAgo(24), user: 'Sarah L.', role: 'Intake Coordinator', action: 'Updated', recordType: 'Referral', recordId: 'REF-001', details: 'Uploaded Face-to-Face for J.D.' },
  { id: 'AUD-003', timestamp: hoursAgo(12), user: 'Mike R.', role: 'Scheduler', action: 'Updated', recordType: 'Referral', recordId: 'REF-003', details: 'Stage changed to Staffing for R.W.', before: 'Eligibility', after: 'Staffing' },
  { id: 'AUD-004', timestamp: hoursAgo(6), user: 'Sarah Mitchell', role: 'Field Staff', action: 'Updated', recordType: 'Visit', recordId: 'VIS-003', details: 'Completed visit for S.G. — EVV clock-out recorded' },
  { id: 'AUD-005', timestamp: hoursAgo(2), user: 'VP User', role: 'VP', action: 'Viewed', recordType: 'Dashboard', recordId: 'dashboard', details: 'VP reviewed executive dashboard' },
];

// ========== ALERTS (initial — will be reconciled by alert engine) ==========
export const seedAlerts: AlertItem[] = [];

// ========== SHIFT BOARD ==========
export const seedShiftBoard: ShiftBoardEntry[] = [
  { id: 'SHF-001', referralId: 'REF-003', patientInitials: 'R.W.', serviceType: 'SN', acuity: 'High', neededRole: 'RN', deadline: daysFrom(1), status: 'Open' },
  { id: 'SHF-002', referralId: 'REF-004', patientInitials: 'T.S.', serviceType: 'Hospice', acuity: 'High', neededRole: 'RN (CHPN preferred)', deadline: daysFrom(0), status: 'Open' },
  { id: 'SHF-003', referralId: 'REF-006', patientInitials: 'B.H.', serviceType: 'Catastrophic Care', acuity: 'High', neededRole: 'RN (Vent/Trach)', deadline: daysFrom(1), status: 'Open' },
];

// ========== OFFLINE SYNC QUEUE ==========
export const seedOfflineSyncQueue: OfflineSyncItem[] = [
  { id: 'OS-001', visitId: 'VIS-004', patientInitials: 'R.W.', action: 'Clock-In', status: 'Failed', queuedAt: hoursAgo(4), retryCount: 2 },
];

// ========== CATASTROPHIC CASES ==========
export const seedCatastrophicCases: CatastrophicCase[] = [
  {
    id: 'CAT-001', patientInitials: 'B.H.',
    conditions: ['TBI', 'vent/trach'],
    payerType: 'Workers Comp',
    requiredSkills: ['vent/trach', 'TBI', 'IV'],
    shiftCoverage: [
      { shift: 'Day (7a-3p)', covered: true, staffName: 'David Thompson' },
      { shift: 'Evening (3p-11p)', covered: false },
      { shift: 'Night (11p-7a)', covered: false },
    ],
    familyContact: 'Maria H. (wife) — (713) 555-9999',
    caseManagerContact: 'Tom Smith — (713) 555-0505',
    supplyEquipmentNeeds: ['Ventilator', 'Suction machine', 'Pulse oximeter', 'Hospital bed', 'IV pump'],
    incidentTimeline: [
      { date: daysAgo(14), event: 'Initial injury — workplace accident' },
      { date: daysAgo(10), event: 'Admitted to TIRR Memorial Hermann' },
      { date: daysAgo(3), event: 'Discharge planning initiated' },
      { date: daysAgo(1), event: 'Referral received by AdvisaCare' },
    ],
    coverageRisk: 'Partial', branch: 'Houston',
  },
  {
    id: 'CAT-002', patientInitials: 'W.F.',
    conditions: ['SCI', 'wound care', '24-hour coverage'],
    payerType: 'Auto No-Fault',
    requiredSkills: ['SCI', 'wound care', 'ADL'],
    shiftCoverage: [
      { shift: 'Day (7a-3p)', covered: true, staffName: 'Lisa Anderson' },
      { shift: 'Evening (3p-11p)', covered: true, staffName: 'James Parker' },
      { shift: 'Night (11p-7a)', covered: false },
    ],
    familyContact: 'Robert F. (brother) — (214) 555-8888',
    caseManagerContact: 'Legal team — (214) 555-7777',
    supplyEquipmentNeeds: ['Wound care supplies', 'Wheelchair', 'Hospital bed', 'Pressure relief mattress'],
    incidentTimeline: [
      { date: daysAgo(30), event: 'Motor vehicle accident — SCI' },
      { date: daysAgo(20), event: 'Transferred to rehab facility' },
      { date: daysAgo(7), event: 'Home care authorization received' },
      { date: daysAgo(5), event: 'Day and evening shifts staffed' },
    ],
    coverageRisk: 'Partial', branch: 'Houston',
  },
];
