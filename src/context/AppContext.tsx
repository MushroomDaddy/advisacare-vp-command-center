// ==============================
// App Context — State Management + Toast System
// ==============================

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type {
  AppState, UserRole, Referral, StaffMember, QualityItem, QualityStatus,
  AuditEntry, AlertItem, ReferralPartner, FieldVisit, OASISAssessment,
  HOPEAssessment, ToastItem, ShiftBoardEntry, OfflineSyncItem
} from '../types';
import { roleNameMap } from '../types';
import {
  seedReferrals, seedStaff, seedCompliance, seedVisits, seedQuality,
  seedOASIS, seedHOPE, seedPartners, seedAlerts, seedAuditLog,
  seedShiftBoard, seedOfflineSync
} from '../data/seedData';

// --- Actions ---
type Action =
  | { type: 'SET_ROLE'; role: UserRole }
  | { type: 'UPDATE_REFERRAL_STAGE'; id: string; stage: Referral['stage'] }
  | { type: 'UPDATE_REFERRAL'; id: string; updates: Partial<Referral> }
  | { type: 'UPDATE_STAFF'; id: string; updates: Partial<StaffMember> }
  | { type: 'UPDATE_QUALITY_STATUS'; id: string; status: QualityStatus }
  | { type: 'ADD_QUALITY_ITEM'; item: QualityItem }
  | { type: 'ADD_AUDIT_ENTRY'; entry: Omit<AuditEntry, 'id' | 'timestamp'> }
  | { type: 'ADD_ALERT'; alert: Omit<AlertItem, 'id'> }
  | { type: 'ACKNOWLEDGE_ALERT'; id: string; user: string }
  | { type: 'ADD_PARTNER'; partner: ReferralPartner }
  | { type: 'UPDATE_PARTNER'; id: string; updates: Partial<ReferralPartner> }
  | { type: 'UPDATE_VISIT'; id: string; updates: Partial<FieldVisit> }
  | { type: 'UPDATE_VISIT_CHECKLIST'; visitId: string; taskIndex: number; completed: boolean }
  | { type: 'UPDATE_OASIS'; id: string; updates: Partial<OASISAssessment> }
  | { type: 'UPDATE_HOPE'; id: string; updates: Partial<HOPEAssessment> }
  | { type: 'ADD_VISIT'; visit: FieldVisit }
  | { type: 'UPDATE_SHIFT_BOARD'; id: string; updates: Partial<ShiftBoardEntry> }
  | { type: 'UPDATE_OFFLINE_SYNC'; id: string; updates: Partial<OfflineSyncItem> }
  | { type: 'ADD_TOAST'; toast: ToastItem }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'REFRESH_TIMESTAMP' };

// --- Initial State ---
const initialState: AppState = {
  currentUser: { name: roleNameMap['VP'], role: 'VP' },
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
  offlineSyncQueue: seedOfflineSync,
  toasts: [],
  lastRefreshed: new Date().toISOString(),
};

// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return {
        ...state,
        currentUser: { name: roleNameMap[action.role], role: action.role },
      };

    case 'UPDATE_REFERRAL_STAGE':
      return {
        ...state,
        referrals: state.referrals.map(r =>
          r.id === action.id ? { ...r, stage: action.stage } : r
        ),
      };

    case 'UPDATE_REFERRAL':
      return {
        ...state,
        referrals: state.referrals.map(r =>
          r.id === action.id ? { ...r, ...action.updates } : r
        ),
      };

    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map(s =>
          s.id === action.id ? { ...s, ...action.updates } : s
        ),
      };

    case 'UPDATE_QUALITY_STATUS':
      return {
        ...state,
        quality: state.quality.map(q =>
          q.id === action.id ? { ...q, status: action.status } : q
        ),
      };

    case 'ADD_QUALITY_ITEM':
      return { ...state, quality: [action.item, ...state.quality] };

    case 'ADD_AUDIT_ENTRY':
      return {
        ...state,
        auditLog: [
          { ...action.entry, id: 'audit' + Date.now() + Math.random().toString(36).slice(2, 6), timestamp: new Date().toISOString() },
          ...state.auditLog,
        ],
      };

    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [
          { ...action.alert, id: 'al' + Date.now() + Math.random().toString(36).slice(2, 6) },
          ...state.alerts,
        ],
      };

    case 'ACKNOWLEDGE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.id === action.id ? { ...a, acknowledged: true, acknowledgedBy: action.user, acknowledgedAt: new Date().toISOString() } : a
        ),
      };

    case 'ADD_PARTNER':
      return { ...state, partners: [...state.partners, action.partner] };

    case 'UPDATE_PARTNER':
      return {
        ...state,
        partners: state.partners.map(p =>
          p.id === action.id ? { ...p, ...action.updates } : p
        ),
      };

    case 'UPDATE_VISIT':
      return {
        ...state,
        visits: state.visits.map(v =>
          v.id === action.id ? { ...v, ...action.updates } : v
        ),
      };

    case 'UPDATE_VISIT_CHECKLIST':
      return {
        ...state,
        visits: state.visits.map(v =>
          v.id === action.visitId
            ? {
                ...v,
                checklist: v.checklist.map((task, i) =>
                  i === action.taskIndex ? { ...task, completed: action.completed } : task
                ),
              }
            : v
        ),
      };

    case 'UPDATE_OASIS':
      return {
        ...state,
        oasisAssessments: state.oasisAssessments.map(o =>
          o.id === action.id ? { ...o, ...action.updates } : o
        ),
      };

    case 'UPDATE_HOPE':
      return {
        ...state,
        hopeAssessments: state.hopeAssessments.map(h =>
          h.id === action.id ? { ...h, ...action.updates } : h
        ),
      };

    case 'ADD_VISIT':
      return { ...state, visits: [...state.visits, action.visit] };

    case 'UPDATE_SHIFT_BOARD':
      return {
        ...state,
        shiftBoard: state.shiftBoard.map(s =>
          s.id === action.id ? { ...s, ...action.updates } : s
        ),
      };

    case 'UPDATE_OFFLINE_SYNC':
      return {
        ...state,
        offlineSyncQueue: state.offlineSyncQueue.map(item =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
      };

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };

    case 'REFRESH_TIMESTAMP':
      return { ...state, lastRefreshed: new Date().toISOString() };

    default:
      return state;
  }
}

// --- Context ---
interface AppContextValue {
  state: AppState;
  setCurrentRole: (role: UserRole) => void;
  updateReferralStage: (id: string, stage: Referral['stage']) => void;
  updateReferral: (id: string, updates: Partial<Referral>) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  updateQualityStatus: (id: string, status: QualityStatus) => void;
  addQualityItem: (item: QualityItem) => void;
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  addAlert: (alert: Omit<AlertItem, 'id'>) => void;
  acknowledgeAlert: (id: string) => void;
  addPartner: (partner: ReferralPartner) => void;
  updatePartner: (id: string, updates: Partial<ReferralPartner>) => void;
  updateVisit: (id: string, updates: Partial<FieldVisit>) => void;
  updateVisitChecklist: (visitId: string, taskIndex: number, completed: boolean) => void;
  updateOASIS: (id: string, updates: Partial<OASISAssessment>) => void;
  updateHOPE: (id: string, updates: Partial<HOPEAssessment>) => void;
  addVisit: (visit: FieldVisit) => void;
  updateShiftBoard: (id: string, updates: Partial<ShiftBoardEntry>) => void;
  updateOfflineSync: (id: string, updates: Partial<OfflineSyncItem>) => void;
  addToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
  refreshTimestamp: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setCurrentRole = useCallback((role: UserRole) => dispatch({ type: 'SET_ROLE', role }), []);
  const updateReferralStage = useCallback((id: string, stage: Referral['stage']) => dispatch({ type: 'UPDATE_REFERRAL_STAGE', id, stage }), []);
  const updateReferral = useCallback((id: string, updates: Partial<Referral>) => dispatch({ type: 'UPDATE_REFERRAL', id, updates }), []);
  const updateStaff = useCallback((id: string, updates: Partial<StaffMember>) => dispatch({ type: 'UPDATE_STAFF', id, updates }), []);
  const updateQualityStatus = useCallback((id: string, status: QualityStatus) => dispatch({ type: 'UPDATE_QUALITY_STATUS', id, status }), []);
  const addQualityItem = useCallback((item: QualityItem) => dispatch({ type: 'ADD_QUALITY_ITEM', item }), []);
  const addAuditEntry = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'>) => dispatch({ type: 'ADD_AUDIT_ENTRY', entry }), []);
  const addAlert = useCallback((alert: Omit<AlertItem, 'id'>) => dispatch({ type: 'ADD_ALERT', alert }), []);
  const acknowledgeAlert = useCallback((id: string) => dispatch({ type: 'ACKNOWLEDGE_ALERT', id, user: state.currentUser.name }), [state.currentUser.name]);
  const addPartner = useCallback((partner: ReferralPartner) => dispatch({ type: 'ADD_PARTNER', partner }), []);
  const updatePartner = useCallback((id: string, updates: Partial<ReferralPartner>) => dispatch({ type: 'UPDATE_PARTNER', id, updates }), []);
  const updateVisit = useCallback((id: string, updates: Partial<FieldVisit>) => dispatch({ type: 'UPDATE_VISIT', id, updates }), []);
  const updateVisitChecklist = useCallback((visitId: string, taskIndex: number, completed: boolean) => dispatch({ type: 'UPDATE_VISIT_CHECKLIST', visitId, taskIndex, completed }), []);
  const updateOASIS = useCallback((id: string, updates: Partial<OASISAssessment>) => dispatch({ type: 'UPDATE_OASIS', id, updates }), []);
  const updateHOPE = useCallback((id: string, updates: Partial<HOPEAssessment>) => dispatch({ type: 'UPDATE_HOPE', id, updates }), []);
  const addVisit = useCallback((visit: FieldVisit) => dispatch({ type: 'ADD_VISIT', visit }), []);
  const updateShiftBoard = useCallback((id: string, updates: Partial<ShiftBoardEntry>) => dispatch({ type: 'UPDATE_SHIFT_BOARD', id, updates }), []);
  const updateOfflineSync = useCallback((id: string, updates: Partial<OfflineSyncItem>) => dispatch({ type: 'UPDATE_OFFLINE_SYNC', id, updates }), []);
  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = 'toast' + Date.now() + Math.random().toString(36).slice(2, 6);
    dispatch({ type: 'ADD_TOAST', toast: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 4000);
  }, []);
  const removeToast = useCallback((id: string) => dispatch({ type: 'REMOVE_TOAST', id }), []);
  const refreshTimestamp = useCallback(() => dispatch({ type: 'REFRESH_TIMESTAMP' }), []);

  return (
    <AppContext.Provider value={{
      state, setCurrentRole, updateReferralStage, updateReferral, updateStaff,
      updateQualityStatus, addQualityItem, addAuditEntry, addAlert, acknowledgeAlert,
      addPartner, updatePartner, updateVisit, updateVisitChecklist, updateOASIS, updateHOPE,
      addVisit, updateShiftBoard, updateOfflineSync, addToast, removeToast, refreshTimestamp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}
