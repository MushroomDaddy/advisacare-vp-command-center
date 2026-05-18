import type { Referral, StaffMember, ComplianceItem, FieldVisit, QualityItem, ReferralPartner, AuditEntry, AppState, OASISAssessment, HOPEAssessment, AlertItem } from '../types';

// --- Seed Referrals ---
export const seedReferrals: Referral[] = [
  { id: '1', source: 'Mercy Hospital', patientInitials: 'J.D.', serviceType: 'Home Health', urgency: 'Immediate', dischargeFacility: 'Mercy Main', dischargeDate: '2026-05-18', physicianOrders: 'Missing', insuranceStatus: 'Pending', documentsUploaded: 2, documents: [
    { name: 'Face Sheet', type: 'Face Sheet', uploaded: true, uploadedAt: '2026-05-17T08:00:00Z' },
    { name: 'Insurance Card', type: 'Insurance Card', uploaded: true, uploadedAt: '2026-05-17T08:00:00Z' },
    { name: 'Physician Orders', type: 'Physician Orders', uploaded: false },
    { name: 'Discharge Summary', type: 'Discharge Summary', uploaded: false },
    { name: 'Diagnosis/Reason', type: 'Diagnosis/Reason', uploaded: false },
    { name: 'Contact Info', type: 'Contact Info', uploaded: false },
  ], assignedCoordinator: 'Sarah L.', assignedOwner: 'Sarah L.', nextFollowUpDate: '2026-05-19', stage: 'Missing Docs', missingItems: ['Physician Orders', 'Discharge Summary'], createdAt: '2026-05-17T08:00:00Z', slaDeadline: '2026-05-20T08:00:00Z', branch: 'Downtown' },
  { id: '2', source: 'St. Jude Medical', patientInitials: 'M.S.', serviceType: 'Hospice', urgency: 'Urgent 24-48 hours', dischargeFacility: 'St. Jude South', dischargeDate: '2026-05-17', physicianOrders: 'Available', insuranceStatus: 'Verified', documentsUploaded: 5, documents: [
    { name: 'Face Sheet', type: 'Face Sheet', uploaded: true, uploadedAt: '2026-05-16T10:00:00Z' },
    { name: 'Insurance Card', type: 'Insurance Card', uploaded: true, uploadedAt: '2026-05-16T10:00:00Z' },
    { name: 'Physician Orders', type: 'Physician Orders', uploaded: true, uploadedAt: '2026-05-16T10:00:00Z' },
    { name: 'Discharge Summary', type: 'Discharge Summary', uploaded: true, uploadedAt: '2026-05-16T10:30:00Z' },
    { name: 'Contact Info', type: 'Contact Info', uploaded: true, uploadedAt: '2026-05-16T10:30:00Z' },
    { name: 'Diagnosis/Reason', type: 'Diagnosis/Reason', uploaded: false },
  ], assignedCoordinator: 'Mike R.', assignedOwner: 'Mike R.', nextFollowUpDate: '2026-05-18', stage: 'Scheduled', missingItems: [], createdAt: '2026-05-16T10:30:00Z', slaDeadline: '2026-05-19T10:30:00Z', branch: 'Southside' },
  { id: '3', source: 'Dr. Smith Clinic', patientInitials: 'R.T.', serviceType: 'Therapy', urgency: 'Routine', dischargeFacility: 'Regional General', dischargeDate: '2026-05-20', physicianOrders: 'Pending', insuranceStatus: 'Verified', documentsUploaded: 3, documents: [
    { name: 'Face Sheet', type: 'Face Sheet', uploaded: true, uploadedAt: '2026-05-15T14:00:00Z' },
    { name: 'Insurance Card', type: 'Insurance Card', uploaded: true, uploadedAt: '2026-05-15T14:00:00Z' },
    { name: 'Contact Info', type: 'Contact Info', uploaded: true, uploadedAt: '2026-05-15T14:20:00Z' },
    { name: 'Physician Orders', type: 'Physician Orders', uploaded: false },
    { name: 'Discharge Summary', type: 'Discharge Summary', uploaded: false },
    { name: 'Diagnosis/Reason', type: 'Diagnosis/Reason', uploaded: false },
  ], assignedCoordinator: 'Emily T.', assignedOwner: 'Emily T.', nextFollowUpDate: '2026-05-19', stage: 'Eligibility', missingItems: ['Lab Results'], createdAt: '2026-05-15T14:20:00Z', slaDeadline: '2026-05-22T14:20:00Z', branch: 'Eastside' },
  { id: '4', source: 'Regional Rehab', patientInitials: 'L.K.', serviceType: 'Catastrophic Injury Care', urgency: 'Immediate', dischargeFacility: 'Lakeside Medical', dischargeDate: '2026-05-18', physicianOrders: 'Available', insuranceStatus: 'Pending', documentsUploaded: 4, documents: [
    { name: 'Face Sheet', type: 'Face Sheet', uploaded: true, uploadedAt: '2026-05-17T16:00:00Z' },
    { name: 'Insurance Card', type: 'Insurance Card', uploaded: true, uploadedAt: '2026-05-17T16:00:00Z' },
    { name: 'Physician Orders', type: 'Physician Orders', uploaded: true, uploadedAt: '2026-05-17T16:30:00Z' },
    { name: 'Discharge Summary', type: 'Discharge Summary', uploaded: true, uploadedAt: '2026-05-17T16:30:00Z' },
    { name: 'Diagnosis/Reason', type: 'Diagnosis/Reason', uploaded: false },
    { name: 'Contact Info', type: 'Contact Info', uploaded: false },
  ], assignedCoordinator: 'James K.', assignedOwner: 'James K.', nextFollowUpDate: '2026-05-19', stage: 'Staffing', missingItems: [], createdAt: '2026-05-17T16:45:00Z', slaDeadline: '2026-05-20T16:45:00Z', branch: 'Westside' },
  { id: '5', source: 'Attorney Miller', patientInitials: 'P.W.', serviceType: 'Personal Care', urgency: 'Routine', dischargeFacility: 'City Hospital', dischargeDate: '2026-05-22', physicianOrders: 'Available', insuranceStatus: 'Denied', documentsUploaded: 5, documents: [
    { name: 'Face Sheet', type: 'Face Sheet', uploaded: true, uploadedAt: '2026-05-14T09:00:00Z' },
    { name: 'Insurance Card', type: 'Insurance Card', uploaded: true, uploadedAt: '2026-05-14T09:00:00Z' },
    { name: 'Physician Orders', type: 'Physician Orders', uploaded: true, uploadedAt: '2026-05-14T09:00:00Z' },
    { name: 'Discharge Summary', type: 'Discharge Summary', uploaded: true, uploadedAt: '2026-05-14T09:00:00Z' },
    { name: 'Contact Info', type: 'Contact Info', uploaded: true, uploadedAt: '2026-05-14T09:00:00Z' },
    { name: 'Diagnosis/Reason', type: 'Diagnosis/Reason', uploaded: false },
  ], assignedCoordinator: 'Sarah L.', assignedOwner: 'Sarah L.', nextFollowUpDate: '2026-05-20', stage: 'Declined', missingItems: [], createdAt: '2026-05-14T09:15:00Z', declineReason: 'Insurance denied', lostReason: 'Insurance Denial', slaDeadline: '2026-05-24T09:15:00Z', branch: 'Downtown' },
  { id: '6', source: 'Lakeside Medical', patientInitials: 'A.B.', serviceType: 'Home Health', urgency: 'Urgent 24-48 hours', dischargeFacility: 'Lakeside Medical', dischargeDate: '2026-05-19', physicianOrders: 'Available', insuranceStatus: 'Verified', documentsUploaded: 4, documents: [
    { name: 'Face Sheet', type: 'Face Sheet', uploaded: true, uploadedAt: '2026-05-16T11:00:00Z' },
    { name: 'Insurance Card', type: 'Insurance Card', uploaded: true, uploadedAt: '2026-05-16T11:00:00Z' },
    { name: 'Physician Orders', type: 'Physician Orders', uploaded: true, uploadedAt: '2026-05-16T11:00:00Z' },
    { name: 'Discharge Summary', type: 'Discharge Summary', uploaded: true, uploadedAt: '2026-05-16T11:00:00Z' },
    { name: 'Diagnosis/Reason', type: 'Diagnosis/Reason', uploaded: false },
    { name: 'Contact Info', type: 'Contact Info', uploaded: false },
  ], assignedCoordinator: 'Mike R.', assignedOwner: 'Mike R.', nextFollowUpDate: '2026-05-18', stage: 'Started', missingItems: [], createdAt: '2026-05-16T11:00:00Z', slaDeadline: '2026-05-21T11:00:00Z', branch: 'Westside' },
  { id: '7', source: 'Mercy Hospital', patientInitials: 'C.D.', serviceType: 'Hospice', urgency: 'Immediate', dischargeFacility: 'Mercy Main', dischargeDate: '2026-05-18', physicianOrders: 'Missing', insuranceStatus: 'Verified', documentsUploaded: 1, documents: [
    { name: 'Face Sheet', type: 'Face Sheet', uploaded: true, uploadedAt: '2026-05-17T07:30:00Z' },
    { name: 'Insurance Card', type: 'Insurance Card', uploaded: false },
    { name: 'Physician Orders', type: 'Physician Orders', uploaded: false },
    { name: 'Discharge Summary', type: 'Discharge Summary', uploaded: false },
    { name: 'Diagnosis/Reason', type: 'Diagnosis/Reason', uploaded: false },
    { name: 'Contact Info', type: 'Contact Info', uploaded: false },
  ], assignedCoordinator: 'Emily T.', assignedOwner: 'Emily T.', nextFollowUpDate: '2026-05-18', stage: 'Missing Docs', missingItems: ['Physician Orders', 'Power of Attorney'], createdAt: '2026-05-17T07:30:00Z', slaDeadline: '2026-05-19T07:30:00Z', branch: 'Downtown' },
  { id: '8', source: 'St. Jude Medical', patientInitials: 'E.F.', serviceType: 'Therapy', urgency: 'Routine', dischargeFacility: 'St. Jude South', dischargeDate: '2026-05-21', physicianOrders: 'Available', insuranceStatus: 'Verified', documentsUploaded: 5, documents: [
    { name: 'Face Sheet', type: 'Face Sheet', uploaded: true, uploadedAt: '2026-05-15T13:00:00Z' },
    { name: 'Insurance Card', type: 'Insurance Card', uploaded: true, uploadedAt: '2026-05-15T13:00:00Z' },
    { name: 'Physician Orders', type: 'Physician Orders', uploaded: true, uploadedAt: '2026-05-15T13:00:00Z' },
    { name: 'Discharge Summary', type: 'Discharge Summary', uploaded: true, uploadedAt: '2026-05-15T13:30:00Z' },
    { name: 'Contact Info', type: 'Contact Info', uploaded: true, uploadedAt: '2026-05-15T13:30:00Z' },
    { name: 'Diagnosis/Reason', type: 'Diagnosis/Reason', uploaded: false },
  ], assignedCoordinator: 'James K.', assignedOwner: 'James K.', nextFollowUpDate: '2026-05-20', stage: 'Scheduled', missingItems: [], createdAt: '2026-05-15T13:45:00Z', slaDeadline: '2026-05-23T13:45:00Z', branch: 'Southside' },
];

// --- Seed Staff ---
export const seedStaff: StaffMember[] = [
  { id: 's1', name: 'Sarah Mitchell', role: 'RN', specialties: ['Hospice', 'Wound Care', 'Home Health'], availability: 'Available', cprExpiry: '2026-08-15', licenseExpiry: '2027-03-01', todayVisits: 4, maxVisits: 8, overtimeRisk: 'Low', location: 'Downtown', phone: '555-0101', shiftStatus: 'Confirmed' },
  { id: 's2', name: 'James Wilson', role: 'LPN', specialties: ['Personal Care', 'Geriatrics'], availability: 'Available', cprExpiry: '2026-06-30', licenseExpiry: '2026-12-15', todayVisits: 6, maxVisits: 8, overtimeRisk: 'Medium', location: 'Northside', phone: '555-0102', shiftStatus: 'Confirmed' },
  { id: 's3', name: 'Maria Garcia', role: 'HHA', specialties: ['Hospice', 'Pediatrics'], availability: 'Partially', cprExpiry: '2026-09-20', licenseExpiry: '2027-05-10', todayVisits: 3, maxVisits: 7, overtimeRisk: 'Low', location: 'Westside', phone: '555-0103', shiftStatus: 'Confirmed' },
  { id: 's4', name: 'Robert Chen', role: 'PT', specialties: ['Therapy', 'Catastrophic Injury'], availability: 'Available', cprExpiry: '2027-01-15', licenseExpiry: '2027-08-20', todayVisits: 5, maxVisits: 8, overtimeRisk: 'Medium', location: 'Eastside', phone: '555-0104', shiftStatus: 'Confirmed' },
  { id: 's5', name: 'Emily Davis', role: 'RN', specialties: ['Wound Care', 'Vent/Trach', 'SCI'], availability: 'Unavailable', cprExpiry: '2026-05-01', licenseExpiry: '2026-11-30', todayVisits: 0, maxVisits: 8, overtimeRisk: 'Low', location: 'Downtown', phone: '555-0105', shiftStatus: 'Off' },
  { id: 's6', name: 'Michael Brown', role: 'CNA', specialties: ['Hospice', 'Geriatrics'], availability: 'Available', cprExpiry: '2026-12-01', licenseExpiry: '2027-06-15', todayVisits: 7, maxVisits: 8, overtimeRisk: 'High', location: 'Northside', phone: '555-0106', shiftStatus: 'Confirmed' },
  { id: 's7', name: 'Lisa Johnson', role: 'OT', specialties: ['Therapy', 'Pediatrics', 'SCI'], availability: 'Available', cprExpiry: '2027-03-10', licenseExpiry: '2027-09-25', todayVisits: 4, maxVisits: 8, overtimeRisk: 'Low', location: 'Westside', phone: '555-0107', shiftStatus: 'Confirmed' },
  { id: 's8', name: 'David Lee', role: 'ST', specialties: ['Therapy', 'Pediatrics'], availability: 'Partially', cprExpiry: '2026-07-15', licenseExpiry: '2026-10-30', todayVisits: 5, maxVisits: 7, overtimeRisk: 'Medium', location: 'Eastside', phone: '555-0108', shiftStatus: 'Unconfirmed' },
];

// --- Seed Compliance ---
export const seedCompliance: ComplianceItem[] = [
  { id: 'c1', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'RN License', status: 'Compliant', expiryDate: '2027-03-01', lastCompleted: '2026-03-01' },
  { id: 'c2', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'CPR Certification', status: 'Due Soon', expiryDate: '2026-08-15', lastCompleted: '2025-08-15' },
  { id: 'c3', staffId: 's5', staffName: 'Emily Davis', itemType: 'RN License', status: 'Due Soon', expiryDate: '2026-11-30', lastCompleted: '2025-11-30' },
  { id: 'c4', staffId: 's5', staffName: 'Emily Davis', itemType: 'CPR Certification', status: 'Expired', expiryDate: '2026-05-01', lastCompleted: '2025-05-01' },
  { id: 'c5', staffId: 's2', staffName: 'James Wilson', itemType: 'LPN License', status: 'Due Soon', expiryDate: '2026-12-15', lastCompleted: '2024-12-15' },
  { id: 'c6', staffId: 's2', staffName: 'James Wilson', itemType: 'CPR Certification', status: 'Critical Soon', expiryDate: '2026-06-10', lastCompleted: '2025-06-10' },
  { id: 'c7', staffId: 's6', staffName: 'Michael Brown', itemType: 'CNA License', status: 'Compliant', expiryDate: '2027-06-15', lastCompleted: '2026-06-15' },
  { id: 'c8', staffId: 's6', staffName: 'Michael Brown', itemType: 'CPR Certification', status: 'Compliant', expiryDate: '2026-12-01', lastCompleted: '2025-12-01' },
  { id: 'c9', staffId: 's1', staffName: 'Sarah Mitchell', itemType: 'Background Check', status: 'Compliant', expiryDate: '2027-01-01', lastCompleted: '2026-01-01' },
  { id: 'c10', staffId: 's2', staffName: 'James Wilson', itemType: 'Drug Screen', status: 'Compliant', expiryDate: '2026-10-01', lastCompleted: '2026-04-01' },
];

// --- Seed Visits ---
export const seedVisits: FieldVisit[] = [
  { id: 'v1', patientInitials: 'J.D.', staffId: 's1', staffName: 'Sarah Mitchell', time: '09:00', address: '123 Main St', serviceType: 'Home Health', checklist: [{ task: 'Vitals Check', completed: true }, { task: 'Medication Review', completed: true }, { task: 'Wound Assessment', completed: false }, { task: 'Patient Education', completed: false }], suppliesNeeded: ['Gloves', 'Bandages', 'Wound Dressings'], documentationStatus: 'Pending', notes: '', visitStatus: 'In Progress', evv: { clockIn: '2026-05-18T09:02:00Z', gpsLatitude: '29.7604', gpsLongitude: '-95.3698', gpsAddress: '123 Main St (GPS verified)', syncStatus: 'Synced' } },
  { id: 'v2', patientInitials: 'M.S.', staffId: 's1', staffName: 'Sarah Mitchell', time: '11:00', address: '456 Oak Ave', serviceType: 'Hospice', checklist: [{ task: 'Vitals Check', completed: true }, { task: 'Comfort Assessment', completed: true }, { task: 'Family Support', completed: false }, { task: 'Medication Review', completed: true }], suppliesNeeded: ['Gloves', 'Oxygen Tank'], documentationStatus: 'Complete', notes: 'Patient comfortable, family doing well', visitStatus: 'Completed', evv: { clockIn: '2026-05-18T11:01:00Z', clockOut: '2026-05-18T11:58:00Z', gpsLatitude: '29.7500', gpsLongitude: '-95.3600', gpsAddress: '456 Oak Ave (GPS verified)', patientSignature: true, caregiverSignature: true, syncStatus: 'Synced' } },
  { id: 'v3', patientInitials: 'R.T.', staffId: 's4', staffName: 'Robert Chen', time: '10:00', address: '789 Pine Rd', serviceType: 'Therapy', checklist: [{ task: 'Range of Motion', completed: false }, { task: 'Strength Assessment', completed: false }, { task: 'Home Exercise Plan', completed: false }], suppliesNeeded: ['Therapy Bands', 'Assessment Forms'], documentationStatus: 'Overdue', notes: '', visitStatus: 'Scheduled', evv: { syncStatus: 'Pending' } },
  { id: 'v4', patientInitials: 'A.B.', staffId: 's2', staffName: 'James Wilson', time: '13:00', address: '321 Elm St', serviceType: 'Home Health', checklist: [{ task: 'Vitals Check', completed: true }, { task: 'Medication Review', completed: true }, { task: 'Wound Assessment', completed: true }], suppliesNeeded: ['Gloves', 'Bandages'], documentationStatus: 'Complete', notes: 'Wound healing well', visitStatus: 'Completed', evv: { clockIn: '2026-05-18T13:00:00Z', clockOut: '2026-05-18T13:45:00Z', gpsLatitude: '29.7650', gpsLongitude: '-95.3750', gpsAddress: '321 Elm St (GPS verified)', patientSignature: true, syncStatus: 'Synced' } },
  { id: 'v5', patientInitials: 'L.K.', staffId: 's3', staffName: 'Maria Garcia', time: '14:30', address: '654 Maple Dr', serviceType: 'Catastrophic Injury Care', checklist: [{ task: 'Vitals Check', completed: false }, { task: 'Mobility Assessment', completed: false }, { task: 'Equipment Check', completed: false }], suppliesNeeded: ['Gloves', 'Syringes', 'Vent Supplies'], documentationStatus: 'Pending', notes: '', visitStatus: 'Scheduled', evv: { syncStatus: 'Pending' } },
];

// --- Seed Quality ---
export const seedQuality: QualityItem[] = [
  { id: 'q1', type: 'OASIS Due', category: 'Home Health', patientInitials: 'A.B.', dueDate: '2026-05-20', status: 'Open', priority: 'High', assignedTo: 'Sarah L.', reviewerName: 'QA Team Lead', reviewDueDate: '2026-05-21' },
  { id: 'q2', type: 'QA Review', category: 'General QA', patientInitials: 'M.S.', dueDate: '2026-05-19', status: 'In Progress', priority: 'Medium', assignedTo: 'Mike R.', reviewerName: 'QA Team Lead', reviewDueDate: '2026-05-20' },
  { id: 'q3', type: 'Readmission Follow-up', category: 'Home Health', patientInitials: 'R.T.', dueDate: '2026-05-21', status: 'Open', priority: 'High', assignedTo: 'Emily T.' },
  { id: 'q4', type: 'Hospice Comfort', category: 'Hospice', patientInitials: 'M.S.', dueDate: '2026-05-18', status: 'Open', priority: 'High', assignedTo: 'Mike R.' },
  { id: 'q5', type: 'CAHPS Follow-up', category: 'Home Health', patientInitials: 'J.D.', dueDate: '2026-05-25', status: 'Open', priority: 'Medium', assignedTo: 'Sarah L.' },
  { id: 'q6', type: 'Missed Visit', category: 'General QA', patientInitials: 'R.T.', dueDate: '2026-05-18', status: 'Open', priority: 'High', assignedTo: 'James K.' },
  { id: 'q7', type: 'Late Note', category: 'General QA', patientInitials: 'L.K.', dueDate: '2026-05-18', status: 'In Progress', priority: 'High', assignedTo: 'James K.' },
];

// --- Seed OASIS Assessments ---
export const seedOASIS: OASISAssessment[] = [
  { id: 'oa1', patientInitials: 'A.B.', type: 'SOC', dueDate: '2026-05-20', status: 'Due', assignedTo: 'Sarah L.' },
  { id: 'oa2', patientInitials: 'J.D.', type: 'Recertification', dueDate: '2026-05-22', status: 'Submitted', assignedTo: 'Mike R.' },
  { id: 'oa3', patientInitials: 'R.T.', type: 'ROC', dueDate: '2026-05-25', status: 'Accepted', assignedTo: 'Emily T.' },
  { id: 'oa4', patientInitials: 'E.F.', type: 'Discharge', dueDate: '2026-05-19', status: 'Rejected', assignedTo: 'James K.', rejectionReason: 'Missing M1028 field' },
];

// --- Seed HOPE Assessments ---
export const seedHOPE: HOPEAssessment[] = [
  { id: 'ho1', patientInitials: 'M.S.', type: 'HOPE Admission', dueDate: '2026-05-17', status: 'Accepted', iqiesStatus: 'Accepted', assignedTo: 'Mike R.' },
  { id: 'ho2', patientInitials: 'M.S.', type: 'HOPE Update Visit 1', dueDate: '2026-05-24', status: 'Due', iqiesStatus: 'Not Submitted', assignedTo: 'Mike R.' },
  { id: 'ho3', patientInitials: 'C.D.', type: 'HOPE Admission', dueDate: '2026-05-19', status: 'Due', iqiesStatus: 'Not Submitted', assignedTo: 'Emily T.' },
  { id: 'ho4', patientInitials: 'M.S.', type: 'HOPE Update Visit 2', dueDate: '2026-05-31', status: 'Due', iqiesStatus: 'Not Submitted', assignedTo: 'Mike R.' },
];

// --- Seed Partners ---
export const seedPartners: ReferralPartner[] = [
  { id: 'p1', name: 'Mercy Hospital', type: 'Hospital', volume: 45, acceptedReferrals: 38, declinedReferrals: 7, avgTimeToSOC: '2.1 days', lostReasons: ['Insurance Denial', 'Staff Shortage'], lastFollowUp: '2026-05-15', nextFollowUpReminder: '2026-05-22', notes: 'Excellent relationship, fast discharge process', contactName: 'Dr. Anderson', contactEmail: 'd.anderson@mercy.com', contactPhone: '555-1001', timeline: [{ date: '2026-05-15', action: 'Quarterly review meeting', user: 'Sarah L.' }, { date: '2026-05-01', action: 'New contact introduced', user: 'VP User' }] },
  { id: 'p2', name: 'St. Jude Medical', type: 'Hospital', volume: 38, acceptedReferrals: 35, declinedReferrals: 3, avgTimeToSOC: '2.8 days', lostReasons: ['Patient Declined'], lastFollowUp: '2026-05-16', nextFollowUpReminder: '2026-05-23', notes: 'Consistent volume, good communication', contactName: 'Lisa Thompson', contactEmail: 'l.thompson@stjude.com', contactPhone: '555-1002', timeline: [{ date: '2026-05-16', action: 'Follow-up call', user: 'Mike R.' }] },
  { id: 'p3', name: 'Dr. Smith Clinic', type: 'Physician', volume: 12, acceptedReferrals: 12, declinedReferrals: 0, avgTimeToSOC: '1.5 days', lostReasons: [], lastFollowUp: '2026-05-17', nextFollowUpReminder: '2026-05-24', notes: 'Primary care, quick referrals', contactName: 'Dr. Smith', contactEmail: 'j.smith@smithclinic.com', contactPhone: '555-1003', timeline: [{ date: '2026-05-17', action: 'Email check-in', user: 'Emily T.' }] },
  { id: 'p4', name: 'Regional Rehab', type: 'Hospital', volume: 22, acceptedReferrals: 18, declinedReferrals: 4, avgTimeToSOC: '3.2 days', lostReasons: ['Service Not Available'], lastFollowUp: '2026-05-14', nextFollowUpReminder: '2026-05-21', notes: 'Specializes in catastrophic injury', contactName: 'Mark Davis', contactEmail: 'm.davis@regionalrehab.com', contactPhone: '555-1004', timeline: [{ date: '2026-05-14', action: 'On-site visit', user: 'James K.' }] },
  { id: 'p5', name: 'Attorney Miller', type: 'Attorney', volume: 8, acceptedReferrals: 5, declinedReferrals: 3, avgTimeToSOC: '4.5 days', lostReasons: ['Insurance Denial'], lastFollowUp: '2026-05-10', nextFollowUpReminder: '2026-05-17', notes: 'Legal cases, personal injury', contactName: 'John Miller', contactEmail: 'j.miller@millerlaw.com', contactPhone: '555-1005', timeline: [{ date: '2026-05-10', action: 'Case review call', user: 'Sarah L.' }] },
];

// --- Seed Audit Log ---
export const seedAuditLog: AuditEntry[] = [
  { id: 'a1', timestamp: '2026-05-18T05:30:00Z', user: 'Sarah L.', role: 'Intake Coordinator', action: 'Created', recordType: 'Referral', recordId: '1', details: 'New referral J.D. from Mercy Hospital' },
  { id: 'a2', timestamp: '2026-05-18T05:45:00Z', user: 'Mike R.', role: 'Scheduler', action: 'Updated', recordType: 'Referral', recordId: '2', details: 'Stage changed to Scheduled', before: 'Staffing', after: 'Scheduled' },
  { id: 'a3', timestamp: '2026-05-18T06:00:00Z', user: 'Sarah Mitchell', role: 'Field Staff', action: 'Updated', recordType: 'Quality', recordId: 'q2', details: 'QA Review for M.S. completed' },
  { id: 'a4', timestamp: '2026-05-17T14:20:00Z', user: 'Emily T.', role: 'Intake Coordinator', action: 'Updated', recordType: 'Referral', recordId: '3', details: 'Updated insurance status to Verified', before: 'Pending', after: 'Verified' },
  { id: 'a5', timestamp: '2026-05-17T16:45:00Z', user: 'James K.', role: 'Intake Coordinator', action: 'Created', recordType: 'Referral', recordId: '4', details: 'New referral L.K. from Regional Rehab' },
];

// --- Seed Alerts ---
export const seedAlerts: AlertItem[] = [
  { id: 'al1', type: 'compliance', severity: 'critical', title: 'CPR Certification Expired', details: 'Emily Davis — CPR Certification expired on 2026-05-01. Work restriction in effect.', timestamp: '2026-05-18T06:00:00Z', acknowledged: false, sourceRecordType: 'Compliance', sourceRecordId: 'c4' },
  { id: 'al2', type: 'sla', severity: 'high', title: 'SLA Breach Risk', details: 'Referral J.D. (Mercy Hospital) — Immediate urgency, SLA deadline approaching in 2 days.', timestamp: '2026-05-18T06:00:00Z', acknowledged: false, sourceRecordType: 'Referral', sourceRecordId: '1' },
];

// --- Initial State ---
export const initialUser = { name: 'VP User', role: 'VP' as const };

export function getInitialState(): AppState {
  return {
    referrals: seedReferrals,
    staff: seedStaff,
    compliance: seedCompliance,
    visits: seedVisits,
    quality: seedQuality,
    oasisAssessments: seedOASIS,
    hopeAssessments: seedHOPE,
    partners: seedPartners,
    auditLog: seedAuditLog,
    alerts: seedAlerts,
    currentUser: initialUser,
    lastRefreshed: new Date().toISOString(),
  };
}
