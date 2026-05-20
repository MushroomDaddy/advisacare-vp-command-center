/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type {
  AppState, Referral, ReferralStage, ComplianceItem, QualityItem, QualityStatus,
  AuditEntry, Alert, Shift, ShiftStatus, DemoDocument, DocumentCategory,
  UserRole, StaffMember, FieldVisit, ReferralPartner, CatastrophicCase,
  TimelineEntry, OfflineQueueItem,
} from '../types';
import { ROLE_NAMES, REQUIRED_DOCUMENTS } from '../types';
import { getInitialState, getSeedState, saveState, clearSavedState } from '../data/seedData';
import { getComplianceCategory } from '../lib/complianceUtils';
import { computeReadiness, computeSlaDeadline, computeSlaStatus } from '../utils/dataLogic';
import { deriveAlerts, reconcileAlerts } from '../lib/alertEngine';

interface AppContextType {
  state: AppState;

  // Referrals
  addReferral: (referral: Referral) => void;
  updateReferralStage: (id: string, stage: ReferralStage, declineReason?: string) => void;
  updateReferral: (id: string, updates: Partial<Referral>) => void;

  // Staff
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;

  // Compliance
  updateComplianceItem: (id: string, updates: Partial<ComplianceItem>) => void;
  /** @deprecated Use getComplianceCategory from lib/complianceUtils directly */
  getComplianceStatus: (item: ComplianceItem) => ComplianceItem['status'];

  // Field Visits
  updateVisitChecklist: (visitId: string, taskIndex: number) => void;
  updateVisitNotes: (visitId: string, notes: string) => void;
  clockInVisit: (visitId: string) => void;
  clockOutVisit: (visitId: string, signatureCaptured: boolean, evvException?: string) => void;
  updateVisit: (id: string, updates: Partial<FieldVisit>) => void;
  addVisit: (visit: FieldVisit) => void;

  // Quality
  updateQualityStatus: (id: string, status: QualityStatus, reviewNotes?: string) => void;
  updateQualityItem: (id: string, updates: Partial<QualityItem>) => void;
  addIncidentReport: (item: Omit<QualityItem, 'id'>) => void;

  // Partners
  addPartner: (partner: ReferralPartner) => void;
  updatePartner: (id: string, updates: Partial<ReferralPartner>) => void;

  // Shifts
  createShift: (shift: Omit<Shift, 'id' | 'createdAt'>) => string;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  offerShift: (shiftId: string, staffId: string, staffName: string) => void;
  acceptShift: (shiftId: string) => void;
  declineShift: (shiftId: string) => void;

  // Documents
  uploadDocument: (doc: Omit<DemoDocument, 'id' | 'uploadedAt'>) => void;

  // Alerts
  createAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'acknowledged' | 'resolved'>) => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  runAlertEngine: () => void;

  // Audit
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;

  // Catastrophic Care
  updateCatastrophicCase: (id: string, updates: Partial<CatastrophicCase>) => void;
  addCatastrophicCase: (c: CatastrophicCase) => void;

  // Offline Queue
  addOfflineQueueItem: (item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'status'>) => void;
  syncOfflineItem: (id: string) => void;

  // Settings
  setCurrentRole: (role: UserRole) => void;
  resetDemoData: () => void;
  exportDemoData: () => string;
  importDemoData: (json: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppState(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

function genId(prefix: string = '') {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);

  // Persist to localStorage on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // --- Audit helper ---
  const addAuditEntry = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      auditLog: [
        { id: genId('a'), timestamp: new Date().toISOString(), ...entry },
        ...prev.auditLog,
      ],
    }));
  }, []);

  // --- Alert helpers ---
  const createAlert = useCallback((alert: Omit<Alert, 'id' | 'createdAt' | 'acknowledged' | 'resolved'>) => {
    setState(prev => {
      // Deduplicate by type + sourceRecordType + sourceRecordId
      const existing = prev.alerts.find(
        a => a.type === alert.type &&
             a.sourceRecordType === alert.sourceRecordType &&
             a.sourceRecordId === alert.sourceRecordId &&
             !a.resolved
      );
      if (existing) return prev;
      return {
        ...prev,
        alerts: [
          { id: genId('al'), createdAt: new Date().toISOString(), acknowledged: false, resolved: false, ...alert },
          ...prev.alerts,
        ],
      };
    });
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a =>
        a.id === id ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a
      ),
    }));
  }, []);

  const resolveAlert = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a =>
        a.id === id ? { ...a, resolved: true, resolvedAt: new Date().toISOString(), acknowledged: true } : a
      ),
    }));
  }, []);

  /** Run the alert engine: derive alerts from state, reconcile with existing */
  const runAlertEngine = useCallback(() => {
    setState(prev => {
      const derived = deriveAlerts(prev);
      const reconciled = reconcileAlerts(prev.alerts, derived);
      return { ...prev, alerts: reconciled };
    });
  }, []);

  // --- Referrals ---
  const addReferral = useCallback((referral: Referral) => {
    // Compute readiness and SLA on add
    const slaDeadline = computeSlaDeadline(referral);
    const enriched = {
      ...referral,
      readiness: computeReadiness(referral),
      slaDeadline,
      slaStatus: computeSlaStatus({ ...referral, slaDeadline }),
    };
    setState(prev => ({ ...prev, referrals: [...prev.referrals, enriched] }));
  }, []);

  const updateReferralStage = useCallback((id: string, stage: ReferralStage, declineReason?: string) => {
    setState(prev => ({
      ...prev,
      referrals: prev.referrals.map(r => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        const newTimeline: TimelineEntry = {
          timestamp: now,
          action: `Stage → ${stage}`,
          user: prev.currentUser.name,
          details: declineReason ? `Reason: ${declineReason}` : undefined,
        };
        const updated = {
          ...r,
          stage,
          stageTimestamps: { ...r.stageTimestamps, [stage]: now },
          timeline: [...r.timeline, newTimeline],
          ...(declineReason ? { declineReason } : {}),
        };
        updated.readiness = computeReadiness(updated);
        updated.slaStatus = computeSlaStatus(updated);
        return updated;
      }),
    }));
  }, []);

  const updateReferral = useCallback((id: string, updates: Partial<Referral>) => {
    setState(prev => ({
      ...prev,
      referrals: prev.referrals.map(r => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        updated.readiness = computeReadiness(updated);
        updated.slaStatus = computeSlaStatus(updated);
        return updated;
      }),
    }));
  }, []);

  // --- Staff ---
  const updateStaff = useCallback((id: string, updates: Partial<StaffMember>) => {
    setState(prev => ({
      ...prev,
      staff: prev.staff.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  // --- Compliance ---
  const getComplianceStatusFn = useCallback((item: ComplianceItem): ComplianceItem['status'] => {
    return getComplianceCategory(item.expiryDate);
  }, []);

  const updateComplianceItem = useCallback((id: string, updates: Partial<ComplianceItem>) => {
    setState(prev => ({
      ...prev,
      compliance: prev.compliance.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  // --- Visits ---
  const updateVisitChecklist = useCallback((visitId: string, taskIndex: number) => {
    setState(prev => ({
      ...prev,
      visits: prev.visits.map(v => {
        if (v.id !== visitId) return v;
        const newChecklist = v.checklist.map((item, i) =>
          i === taskIndex ? { ...item, completed: !item.completed } : item
        );
        return { ...v, checklist: newChecklist };
      }),
    }));
  }, []);

  const updateVisitNotes = useCallback((visitId: string, notes: string) => {
    setState(prev => ({
      ...prev,
      visits: prev.visits.map(v => v.id === visitId ? { ...v, notes: v.notes ? `${v.notes}\n${notes}` : notes } : v),
    }));
  }, []);

  const clockInVisit = useCallback((visitId: string) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      visits: prev.visits.map(v => v.id === visitId ? {
        ...v,
        clockIn: now,
        evvStatus: 'Clocked In' as const,
        timeline: [...v.timeline, { timestamp: now, action: 'Clocked In', user: prev.currentUser.name }],
      } : v),
    }));
  }, []);

  const clockOutVisit = useCallback((visitId: string, signatureCaptured: boolean, evvException?: string) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      visits: prev.visits.map(v => {
        if (v.id !== visitId) return v;
        const allComplete = v.checklist.every(i => i.completed);
        return {
          ...v,
          clockOut: now,
          evvStatus: evvException ? 'Exception' as const : 'Clocked Out' as const,
          signatureCaptured,
          evvException,
          documentationStatus: allComplete && signatureCaptured ? 'Complete' as const : 'Pending' as const,
          timeline: [
            ...v.timeline,
            { timestamp: now, action: evvException ? 'Clocked Out (EVV Exception)' : 'Clocked Out', user: prev.currentUser.name, details: evvException },
          ],
        };
      }),
    }));
  }, []);

  const updateVisit = useCallback((id: string, updates: Partial<FieldVisit>) => {
    setState(prev => ({
      ...prev,
      visits: prev.visits.map(v => v.id === id ? { ...v, ...updates } : v),
    }));
  }, []);

  const addVisit = useCallback((visit: FieldVisit) => {
    setState(prev => ({ ...prev, visits: [...prev.visits, visit] }));
  }, []);

  // --- Quality ---
  const updateQualityStatus = useCallback((id: string, status: QualityStatus, reviewNotes?: string) => {
    setState(prev => ({
      ...prev,
      quality: prev.quality.map(q => q.id === id ? { ...q, status, ...(reviewNotes !== undefined ? { reviewNotes } : {}) } : q),
    }));
  }, []);

  const updateQualityItem = useCallback((id: string, updates: Partial<QualityItem>) => {
    setState(prev => ({
      ...prev,
      quality: prev.quality.map(q => q.id === id ? { ...q, ...updates } : q),
    }));
  }, []);

  const addIncidentReport = useCallback((item: Omit<QualityItem, 'id'>) => {
    setState(prev => ({
      ...prev,
      quality: [...prev.quality, { id: genId('q'), ...item }],
    }));
  }, []);

  // --- Partners ---
  const addPartner = useCallback((partner: ReferralPartner) => {
    setState(prev => ({ ...prev, partners: [...prev.partners, partner] }));
  }, []);

  const updatePartner = useCallback((id: string, updates: Partial<ReferralPartner>) => {
    setState(prev => ({
      ...prev,
      partners: prev.partners.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  // --- Shifts (createShift now returns the new ID) ---
  const createShift = useCallback((shift: Omit<Shift, 'id' | 'createdAt'>): string => {
    const newId = genId('sh');
    setState(prev => ({
      ...prev,
      shifts: [...prev.shifts, { id: newId, createdAt: new Date().toISOString(), ...shift }],
    }));
    return newId;
  }, []);

  const updateShift = useCallback((id: string, updates: Partial<Shift>) => {
    setState(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const offerShift = useCallback((shiftId: string, staffId: string, staffName: string) => {
    setState(prev => ({
      ...prev,
      shifts: prev.shifts.map(s =>
        s.id === shiftId ? { ...s, status: 'Offered' as ShiftStatus, offeredTo: staffId, offeredToName: staffName } : s
      ),
    }));
  }, []);

  const acceptShift = useCallback((shiftId: string) => {
    setState(prev => {
      const shift = prev.shifts.find(s => s.id === shiftId);
      if (!shift || !shift.offeredTo) return prev;

      const staffMember = prev.staff.find(s => s.id === shift.offeredTo);
      const staffName = staffMember?.name || shift.offeredToName || 'Unknown';
      const now = new Date().toISOString();

      // 1. Update the shift to Accepted
      const updatedShifts = prev.shifts.map(s =>
        s.id === shiftId ? { ...s, status: 'Accepted' as ShiftStatus, acceptedBy: s.offeredTo } : s
      );

      // 2. Create or update FieldVisit for this shift
      const existingVisit = prev.visits.find(v => v.referralId === shift.referralId && v.staffId === shift.offeredTo);
      let updatedVisits = prev.visits;
      if (!existingVisit) {
        const newVisit: FieldVisit = {
          id: genId('v'),
          patientInitials: shift.patientInitials,
          staffId: shift.offeredTo!,
          staffName,
          time: shift.time?.split('-')[0] || '09:00',
          address: shift.location,
          serviceType: shift.serviceType,
          referralId: shift.referralId,
          checklist: [
            { task: 'Vitals Check', completed: false },
            { task: 'Assessment', completed: false },
            { task: 'Documentation', completed: false },
          ],
          suppliesNeeded: [],
          documentationStatus: 'Pending',
          notes: '',
          evvStatus: 'Not Started',
          signatureCaptured: false,
          timeline: [{ timestamp: now, action: 'Visit created from shift acceptance', user: prev.currentUser.name }],
        };
        updatedVisits = [...prev.visits, newVisit];
      }

      // 3. Update referral with assigned staff
      const updatedReferrals = prev.referrals.map(r => {
        if (r.id !== shift.referralId) return r;
        const updated = {
          ...r,
          assignedStaffId: shift.offeredTo,
          stage: (r.stage === 'Staffing' ? 'Scheduled' : r.stage) as ReferralStage,
          stageTimestamps: r.stage === 'Staffing' ? { ...r.stageTimestamps, 'Scheduled': now } : r.stageTimestamps,
          timeline: [
            ...r.timeline,
            { timestamp: now, action: `Shift accepted by ${staffName}`, user: prev.currentUser.name },
          ],
        };
        updated.readiness = computeReadiness(updated);
        updated.slaStatus = computeSlaStatus(updated);
        return updated;
      });

      // 4. Resolve related alerts for this shift
      const updatedAlerts = prev.alerts.map(a => {
        if (a.sourceRecordId === shiftId && !a.resolved) {
          return { ...a, resolved: true, resolvedAt: now };
        }
        if (a.sourceRecordId === shift.referralId && a.type === 'Staffing' && !a.resolved) {
          return { ...a, resolved: true, resolvedAt: now };
        }
        return a;
      });

      return {
        ...prev,
        shifts: updatedShifts,
        visits: updatedVisits,
        referrals: updatedReferrals,
        alerts: updatedAlerts,
      };
    });
  }, []);

  const declineShift = useCallback((shiftId: string) => {
    setState(prev => ({
      ...prev,
      shifts: prev.shifts.map(s =>
        s.id === shiftId ? { ...s, status: 'Open' as ShiftStatus, offeredTo: undefined, offeredToName: undefined } : s
      ),
    }));
  }, []);

  // --- Documents (comprehensive update on upload) ---
  const uploadDocument = useCallback((doc: Omit<DemoDocument, 'id' | 'uploadedAt'>) => {
    const now = new Date().toISOString();
    const newDoc: DemoDocument = { id: genId('d'), uploadedAt: now, ...doc };
    setState(prev => {
      const newReferrals = prev.referrals.map(r => {
        if (r.id !== doc.referralId) return r;

        // Remove from missing items
        const updatedMissing = r.missingItems.filter(i => i !== doc.category);

        // Check if physician orders are now available
        const newPhysicianOrders = doc.category === 'Physician Orders' ? 'Available' as const : r.physicianOrders;

        // All required docs for this service type
        const required = REQUIRED_DOCUMENTS[r.serviceType] || [];
        const existingDocs = prev.documents
          .filter(d => d.referralId === r.id)
          .map(d => d.category);
        const allDocsWithNew = [...existingDocs, doc.category as DocumentCategory];
        const stillMissing = required.filter(req => !allDocsWithNew.includes(req));

        // Compute new readiness
        const updated: Referral = {
          ...r,
          documentsUploaded: r.documentsUploaded + 1,
          missingItems: updatedMissing.length > 0 ? updatedMissing : stillMissing,
          physicianOrders: newPhysicianOrders,
          timeline: [
            ...r.timeline,
            { timestamp: now, action: `Document uploaded: ${doc.category}`, user: prev.currentUser.name, details: doc.fileName },
          ],
        };
        updated.readiness = computeReadiness(updated);
        updated.slaStatus = computeSlaStatus(updated);
        return updated;
      });

      return {
        ...prev,
        documents: [...prev.documents, newDoc],
        referrals: newReferrals,
      };
    });
  }, []);

  // --- Catastrophic Care ---
  const updateCatastrophicCase = useCallback((id: string, updates: Partial<CatastrophicCase>) => {
    setState(prev => ({
      ...prev,
      catastrophicCases: prev.catastrophicCases.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const addCatastrophicCase = useCallback((c: CatastrophicCase) => {
    setState(prev => ({
      ...prev,
      catastrophicCases: [...prev.catastrophicCases, c],
    }));
  }, []);

  // --- Offline Queue ---
  const addOfflineQueueItem = useCallback((item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'status'>) => {
    setState(prev => ({
      ...prev,
      offlineQueue: [...prev.offlineQueue, { id: genId('oq'), createdAt: new Date().toISOString(), status: 'Pending', ...item }],
    }));
  }, []);

  const syncOfflineItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      offlineQueue: prev.offlineQueue.map(item => item.id === id ? { ...item, status: 'Synced' as const } : item),
    }));
  }, []);

  // --- Settings ---
  const setCurrentRole = useCallback((role: UserRole) => {
    // Update BOTH role AND name based on ROLE_NAMES mapping
    setState(prev => ({
      ...prev,
      currentUser: { name: ROLE_NAMES[role], role },
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    clearSavedState();
    setState(getSeedState());
  }, []);

  const exportDemoData = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importDemoData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as AppState;
      if (parsed.referrals && parsed.staff && parsed.alerts) {
        setState(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      addReferral, updateReferralStage, updateReferral,
      updateStaff,
      updateComplianceItem, getComplianceStatus: getComplianceStatusFn,
      updateVisitChecklist, updateVisitNotes, clockInVisit, clockOutVisit, updateVisit, addVisit,
      updateQualityStatus, updateQualityItem, addIncidentReport,
      addPartner, updatePartner,
      createShift, updateShift, offerShift, acceptShift, declineShift,
      uploadDocument,
      createAlert, acknowledgeAlert, resolveAlert, runAlertEngine,
      addAuditEntry,
      updateCatastrophicCase, addCatastrophicCase,
      addOfflineQueueItem, syncOfflineItem,
      setCurrentRole, resetDemoData, exportDemoData, importDemoData,
    }}>
      {children}
    </AppContext.Provider>
  );
}
