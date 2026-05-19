// ==============================
// AdvisaCare VP Command Center — AppContext (Phase 3)
// ==============================

import { createContext, useContext, useReducer, type ReactNode, useCallback, useEffect } from 'react';
import type {
  AppState, CurrentUser, Referral, ReferralStage, StaffMember,
  FieldVisit, QualityItem, OASISAssessment, ReferralPartner,
  AuditEntry, AlertItem, ShiftBoardEntry, OfflineSyncItem,
  ToastItem, CatastrophicCase,
} from '../types';
import {
  seedReferrals, seedStaff, seedCompliance, seedVisits,
  seedQuality, seedOASIS, seedHOPE, seedPartners, seedAuditLog,
  seedAlerts, seedShiftBoard, seedOfflineSyncQueue, seedCatastrophicCases,
} from '../data/seedData';
import { generateDerivedAlerts, reconcileAlerts } from '../utils/alertEngine';

// ==================== Initial State ====================
const initialState: AppState = {
  currentUser: { name: 'VP User', role: 'VP' },
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
  shiftBoard: seedShiftBoard,
  offlineSyncQueue: seedOfflineSyncQueue,
  catastrophicCases: seedCatastrophicCases,
  toasts: [],
  lastRefreshed: new Date().toISOString(),
};

// ==================== Actions ====================
type Action =
  | { type: 'SET_USER'; payload: CurrentUser }
  | { type: 'UPDATE_REFERRAL'; payload: { id: string; updates: Partial<Referral> } }
  | { type: 'UPDATE_REFERRAL_STAGE'; payload: { id: string; stage: ReferralStage } }
  | { type: 'UPDATE_STAFF'; payload: { id: string; updates: Partial<StaffMember> } }
  | { type: 'UPDATE_VISIT'; payload: { id: string; updates: Partial<FieldVisit> } }
  | { type: 'ADD_VISIT'; payload: FieldVisit }
  | { type: 'UPDATE_VISIT_CHECKLIST'; payload: { visitId: string; taskIndex: number; completed: boolean } }
  | { type: 'UPDATE_QUALITY'; payload: { id: string; updates: Partial<QualityItem> } }
  | { type: 'UPDATE_OASIS'; payload: { id: string; updates: Partial<OASISAssessment> } }
  | { type: 'UPDATE_PARTNER'; payload: { id: string; updates: Partial<ReferralPartner> } }
  | { type: 'ADD_AUDIT_ENTRY'; payload: Omit<AuditEntry, 'id' | 'timestamp'> }
  | { type: 'ADD_TOAST'; payload: ToastItem }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'ACKNOWLEDGE_ALERT'; payload: { id: string; user: string } }
  | { type: 'RECONCILE_ALERTS'; payload: AlertItem[] }
  | { type: 'UPDATE_SHIFT_BOARD'; payload: { id: string; updates: Partial<ShiftBoardEntry> } }
  | { type: 'UPDATE_OFFLINE_SYNC'; payload: { id: string; updates: Partial<OfflineSyncItem> } }
  | { type: 'UPDATE_CATASTROPHIC_CASE'; payload: { id: string; updates: Partial<CatastrophicCase> } }
  | { type: 'UPDATE_HOPE'; payload: { id: string; updates: Partial<import('../types').HOPEAssessment> } };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };

    case 'UPDATE_REFERRAL':
      return {
        ...state,
        referrals: state.referrals.map(r => r.id === action.payload.id ? { ...r, ...action.payload.updates } : r),
      };

    case 'UPDATE_REFERRAL_STAGE':
      return {
        ...state,
        referrals: state.referrals.map(r =>
          r.id === action.payload.id ? { ...r, stage: action.payload.stage } : r
        ),
      };

    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map(s => s.id === action.payload.id ? { ...s, ...action.payload.updates } : s),
      };

    case 'UPDATE_VISIT':
      return {
        ...state,
        visits: state.visits.map(v => v.id === action.payload.id ? { ...v, ...action.payload.updates } : v),
      };

    case 'ADD_VISIT':
      return { ...state, visits: [...state.visits, action.payload] };

    case 'UPDATE_VISIT_CHECKLIST':
      return {
        ...state,
        visits: state.visits.map(v => {
          if (v.id !== action.payload.visitId) return v;
          const newChecklist = v.checklist.map((item, idx) =>
            idx === action.payload.taskIndex ? { ...item, completed: action.payload.completed } : item
          );
          return { ...v, checklist: newChecklist };
        }),
      };

    case 'UPDATE_QUALITY':
      return {
        ...state,
        quality: state.quality.map(q => q.id === action.payload.id ? { ...q, ...action.payload.updates } : q),
      };

    case 'UPDATE_OASIS':
      return {
        ...state,
        oasisAssessments: state.oasisAssessments.map(o => o.id === action.payload.id ? { ...o, ...action.payload.updates } : o),
      };

    case 'UPDATE_PARTNER':
      return {
        ...state,
        partners: state.partners.map(p => p.id === action.payload.id ? { ...p, ...action.payload.updates } : p),
      };

    case 'ADD_AUDIT_ENTRY': {
      const entry: AuditEntry = {
        id: 'AUD-' + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      return { ...state, auditLog: [entry, ...state.auditLog] };
    }

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    case 'ACKNOWLEDGE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.id === action.payload.id ? { ...a, acknowledged: true, acknowledgedBy: action.payload.user, acknowledgedAt: new Date().toISOString() } : a
        ),
      };

    case 'RECONCILE_ALERTS':
      return { ...state, alerts: action.payload };

    case 'UPDATE_SHIFT_BOARD':
      return {
        ...state,
        shiftBoard: state.shiftBoard.map(s => s.id === action.payload.id ? { ...s, ...action.payload.updates } : s),
      };

    case 'UPDATE_OFFLINE_SYNC':
      return {
        ...state,
        offlineSyncQueue: state.offlineSyncQueue.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload.updates } : i
        ),
      };

    case 'UPDATE_CATASTROPHIC_CASE':
      return {
        ...state,
        catastrophicCases: state.catastrophicCases.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };

    case 'UPDATE_HOPE':
      return {
        ...state,
        hopeAssessments: state.hopeAssessments.map(h =>
          h.id === action.payload.id ? { ...h, ...action.payload.updates } : h
        ),
      };

    default:
      return state;
  }
}

// ==================== Context Interface ====================
interface AppContextType {
  state: AppState;
  setUser: (user: CurrentUser) => void;
  updateReferral: (id: string, updates: Partial<Referral>) => void;
  updateReferralStage: (id: string, stage: ReferralStage) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  updateVisit: (id: string, updates: Partial<FieldVisit>) => void;
  addVisit: (visit: FieldVisit) => void;
  updateVisitChecklist: (visitId: string, taskIndex: number, completed: boolean) => void;
  updateQuality: (id: string, updates: Partial<QualityItem>) => void;
  updateOASIS: (id: string, updates: Partial<OASISAssessment>) => void;
  updatePartner: (id: string, updates: Partial<ReferralPartner>) => void;
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  addToast: (message: string, type: ToastItem['type']) => void;
  removeToast: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  updateShiftBoard: (id: string, updates: Partial<ShiftBoardEntry>) => void;
  updateOfflineSync: (id: string, updates: Partial<OfflineSyncItem>) => void;
  updateCatastrophicCase: (id: string, updates: Partial<CatastrophicCase>) => void;
  updateHOPE: (id: string, updates: Partial<import('../types').HOPEAssessment>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Run alert engine on state changes — destructure for stable deps
  const { referrals, compliance, quality, visits, oasisAssessments, hopeAssessments, partners, alerts: currentAlerts } = state;
  useEffect(() => {
    const derived = generateDerivedAlerts(state);
    const reconciled = reconcileAlerts(currentAlerts, derived);
    // Only dispatch if alerts actually changed to avoid infinite loop
    const changed = reconciled.length !== currentAlerts.length ||
      reconciled.some((a, i) => a.id !== currentAlerts[i]?.id || a.resolved !== currentAlerts[i]?.resolved);
    if (changed) {
      dispatch({ type: 'RECONCILE_ALERTS', payload: reconciled });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state is derived from the listed deps; listing state directly would over-fire
  }, [referrals, compliance, quality, visits, oasisAssessments, hopeAssessments, partners, currentAlerts]);

  const setUser = useCallback((user: CurrentUser) => dispatch({ type: 'SET_USER', payload: user }), []);
  const updateReferral = useCallback((id: string, updates: Partial<Referral>) => dispatch({ type: 'UPDATE_REFERRAL', payload: { id, updates } }), []);
  const updateReferralStage = useCallback((id: string, stage: ReferralStage) => dispatch({ type: 'UPDATE_REFERRAL_STAGE', payload: { id, stage } }), []);
  const updateStaff = useCallback((id: string, updates: Partial<StaffMember>) => dispatch({ type: 'UPDATE_STAFF', payload: { id, updates } }), []);
  const updateVisit = useCallback((id: string, updates: Partial<FieldVisit>) => dispatch({ type: 'UPDATE_VISIT', payload: { id, updates } }), []);
  const addVisit = useCallback((visit: FieldVisit) => dispatch({ type: 'ADD_VISIT', payload: visit }), []);
  const updateVisitChecklist = useCallback((visitId: string, taskIndex: number, completed: boolean) => dispatch({ type: 'UPDATE_VISIT_CHECKLIST', payload: { visitId, taskIndex, completed } }), []);
  const updateQuality = useCallback((id: string, updates: Partial<QualityItem>) => dispatch({ type: 'UPDATE_QUALITY', payload: { id, updates } }), []);
  const updateOASIS = useCallback((id: string, updates: Partial<OASISAssessment>) => dispatch({ type: 'UPDATE_OASIS', payload: { id, updates } }), []);
  const updatePartner = useCallback((id: string, updates: Partial<ReferralPartner>) => dispatch({ type: 'UPDATE_PARTNER', payload: { id, updates } }), []);
  const addAuditEntry = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'>) => dispatch({ type: 'ADD_AUDIT_ENTRY', payload: entry }), []);
  const addToast = useCallback((message: string, type: ToastItem['type']) => {
    const id = 'toast_' + Date.now();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
  }, []);
  const removeToast = useCallback((id: string) => dispatch({ type: 'REMOVE_TOAST', payload: id }), []);
  const acknowledgeAlert = useCallback((id: string) => {
    dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: { id, user: state.currentUser.name } });
  }, [state.currentUser.name]);
  const updateShiftBoard = useCallback((id: string, updates: Partial<ShiftBoardEntry>) => dispatch({ type: 'UPDATE_SHIFT_BOARD', payload: { id, updates } }), []);
  const updateOfflineSync = useCallback((id: string, updates: Partial<OfflineSyncItem>) => dispatch({ type: 'UPDATE_OFFLINE_SYNC', payload: { id, updates } }), []);
  const updateCatastrophicCase = useCallback((id: string, updates: Partial<CatastrophicCase>) => dispatch({ type: 'UPDATE_CATASTROPHIC_CASE', payload: { id, updates } }), []);
  const updateHOPE = useCallback((id: string, updates: Partial<import('../types').HOPEAssessment>) => dispatch({ type: 'UPDATE_HOPE', payload: { id, updates } }), []);

  return (
    <AppContext.Provider value={{
      state, setUser, updateReferral, updateReferralStage, updateStaff,
      updateVisit, addVisit, updateVisitChecklist, updateQuality, updateOASIS,
      updatePartner, addAuditEntry, addToast, removeToast, acknowledgeAlert,
      updateShiftBoard, updateOfflineSync, updateCatastrophicCase, updateHOPE,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
