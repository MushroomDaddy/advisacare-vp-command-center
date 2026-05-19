/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type {
  AppState, Referral, ReferralStage, ComplianceItem, QualityItem, QualityStatus,
  AuditEntry, Alert, Shift, ShiftStatus, DemoDocument,
  UserRole, StaffMember, FieldVisit, ReferralPartner, CatastrophicCase,
  TimelineEntry, OfflineQueueItem,
} from '../types';
import { getInitialState, getSeedState, saveState, clearSavedState } from '../data/seedData';

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
  getComplianceStatus: (item: ComplianceItem) => ComplianceItem['status'];

  // Field Visits
  updateVisitChecklist: (visitId: string, taskIndex: number) => void;
  updateVisitNotes: (visitId: string, notes: string) => void;
  clockInVisit: (visitId: string) => void;
  clockOutVisit: (visitId: string, signatureCaptured: boolean, evvException?: string) => void;
  updateVisit: (id: string, updates: Partial<FieldVisit>) => void;

  // Quality
  updateQualityStatus: (id: string, status: QualityStatus, reviewNotes?: string) => void;
  updateQualityItem: (id: string, updates: Partial<QualityItem>) => void;
  addIncidentReport: (item: Omit<QualityItem, 'id'>) => void;

  // Partners
  addPartner: (partner: ReferralPartner) => void;
  updatePartner: (id: string, updates: Partial<ReferralPartner>) => void;

  // Shifts
  createShift: (shift: Omit<Shift, 'id' | 'createdAt'>) => void;
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

  // Audit
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;

  // Catastrophic Care
  updateCatastrophicCase: (id: string, updates: Partial<CatastrophicCase>) => void;

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

  // --- Alert helper ---
  const createAlert = useCallback((alert: Omit<Alert, 'id' | 'createdAt' | 'acknowledged' | 'resolved'>) => {
    setState(prev => {
      // Deduplicate: don't create if same sourceRecordType+sourceRecordId already has an unresolved alert
      const existing = prev.alerts.find(
        a => a.sourceRecordType === alert.sourceRecordType &&
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

  // --- Referrals ---
  const addReferral = useCallback((referral: Referral) => {
    setState(prev => ({ ...prev, referrals: [...prev.referrals, referral] }));
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
        return {
          ...r,
          stage,
          stageTimestamps: { ...r.stageTimestamps, [stage]: now },
          timeline: [...r.timeline, newTimeline],
          ...(declineReason ? { declineReason } : {}),
        };
      }),
    }));
  }, []);

  const updateReferral = useCallback((id: string, updates: Partial<Referral>) => {
    setState(prev => ({
      ...prev,
      referrals: prev.referrals.map(r => r.id === id ? { ...r, ...updates } : r),
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
  const getComplianceStatus = useCallback((item: ComplianceItem): ComplianceItem['status'] => {
    const expiry = new Date(item.expiryDate);
    const now = new Date();
    if (expiry < now) return 'Expired';
    const daysUntil = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 45) return 'Due Soon';
    return 'Compliant';
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
        evvStatus: 'Clocked In',
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
          evvStatus: evvException ? 'Exception' : 'Clocked Out',
          signatureCaptured,
          evvException,
          documentationStatus: allComplete && signatureCaptured ? 'Complete' : 'Pending',
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

  // --- Shifts ---
  const createShift = useCallback((shift: Omit<Shift, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      shifts: [...prev.shifts, { id: genId('sh'), createdAt: new Date().toISOString(), ...shift }],
    }));
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
    setState(prev => ({
      ...prev,
      shifts: prev.shifts.map(s =>
        s.id === shiftId ? { ...s, status: 'Accepted' as ShiftStatus, acceptedBy: s.offeredTo } : s
      ),
    }));
  }, []);

  const declineShift = useCallback((shiftId: string) => {
    setState(prev => ({
      ...prev,
      shifts: prev.shifts.map(s =>
        s.id === shiftId ? { ...s, status: 'Open' as ShiftStatus, offeredTo: undefined, offeredToName: undefined } : s
      ),
    }));
  }, []);

  // --- Documents ---
  const uploadDocument = useCallback((doc: Omit<DemoDocument, 'id' | 'uploadedAt'>) => {
    const newDoc: DemoDocument = { id: genId('d'), uploadedAt: new Date().toISOString(), ...doc };
    setState(prev => {
      // Update referral document count and possibly remove from missingItems
      const newReferrals = prev.referrals.map(r => {
        if (r.id !== doc.referralId) return r;
        const updatedMissing = r.missingItems.filter(i => i !== doc.category);
        return {
          ...r,
          documentsUploaded: r.documentsUploaded + 1,
          missingItems: updatedMissing,
          physicianOrders: doc.category === 'Physician Orders' ? 'Available' as const : r.physicianOrders,
        };
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
    setState(prev => ({ ...prev, currentUser: { ...prev.currentUser, role } }));
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
      updateComplianceItem, getComplianceStatus,
      updateVisitChecklist, updateVisitNotes, clockInVisit, clockOutVisit, updateVisit,
      updateQualityStatus, updateQualityItem, addIncidentReport,
      addPartner, updatePartner,
      createShift, updateShift, offerShift, acceptShift, declineShift,
      uploadDocument,
      createAlert, acknowledgeAlert, resolveAlert,
      addAuditEntry,
      updateCatastrophicCase,
      addOfflineQueueItem, syncOfflineItem,
      setCurrentRole, resetDemoData, exportDemoData, importDemoData,
    }}>
      {children}
    </AppContext.Provider>
  );
}
