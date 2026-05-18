import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  AppState, UserRole, QualityStatus, Referral, ReferralPartner,
  AuditEntry, AlertItem, FieldVisit, StaffMember, QualityItem,
  ComplianceItem, OASISAssessment, HOPEAssessment
} from '../types';
import { getInitialState } from '../data/seedData';
import { getComplianceStatus } from '../utils/dataLogic';

// --- Action Types ---
type Action =
  | { type: 'SET_ROLE'; role: UserRole }
  | { type: 'UPDATE_REFERRAL_STAGE'; id: string; stage: Referral['stage'] }
  | { type: 'UPDATE_REFERRAL'; id: string; updates: Partial<Referral> }
  | { type: 'ADD_REFERRAL'; referral: Referral }
  | { type: 'UPDATE_VISIT_CHECKLIST'; visitId: string; taskIndex: number; completed: boolean }
  | { type: 'UPDATE_VISIT'; visitId: string; updates: Partial<FieldVisit> }
  | { type: 'UPDATE_QUALITY_STATUS'; id: string; status: QualityStatus }
  | { type: 'ADD_QUALITY_ITEM'; item: QualityItem }
  | { type: 'UPDATE_STAFF'; staffId: string; updates: Partial<StaffMember> }
  | { type: 'ADD_PARTNER'; partner: ReferralPartner }
  | { type: 'UPDATE_PARTNER'; id: string; updates: Partial<ReferralPartner> }
  | { type: 'ADD_AUDIT_ENTRY'; entry: Omit<AuditEntry, 'id' | 'timestamp'> }
  | { type: 'ADD_ALERT'; alert: Omit<AlertItem, 'id'> }
  | { type: 'ACKNOWLEDGE_ALERT'; alertId: string }
  | { type: 'UPDATE_OASIS'; id: string; updates: Partial<OASISAssessment> }
  | { type: 'UPDATE_HOPE'; id: string; updates: Partial<HOPEAssessment> }
  | { type: 'UPDATE_COMPLIANCE'; id: string; updates: Partial<ComplianceItem> }
  | { type: 'REFRESH_TIMESTAMP' };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, currentUser: { ...state.currentUser, role: action.role } };

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

    case 'ADD_REFERRAL':
      return { ...state, referrals: [...state.referrals, action.referral] };

    case 'UPDATE_VISIT_CHECKLIST':
      return {
        ...state,
        visits: state.visits.map(v =>
          v.id === action.visitId
            ? {
              ...v,
              checklist: v.checklist.map((t, i) =>
                i === action.taskIndex ? { ...t, completed: action.completed } : t
              ),
            }
            : v
        ),
      };

    case 'UPDATE_VISIT':
      return {
        ...state,
        visits: state.visits.map(v =>
          v.id === action.visitId ? { ...v, ...action.updates } : v
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
      return { ...state, quality: [...state.quality, action.item] };

    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map(s =>
          s.id === action.staffId ? { ...s, ...action.updates } : s
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

    case 'ADD_AUDIT_ENTRY': {
      const entry: AuditEntry = {
        ...action.entry,
        id: 'a' + Date.now(),
        timestamp: new Date().toISOString(),
      };
      return { ...state, auditLog: [entry, ...state.auditLog] };
    }

    case 'ADD_ALERT': {
      const alert: AlertItem = {
        ...action.alert,
        id: 'al' + Date.now(),
      };
      return { ...state, alerts: [alert, ...state.alerts] };
    }

    case 'ACKNOWLEDGE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.id === action.alertId ? { ...a, acknowledged: true } : a
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

    case 'UPDATE_COMPLIANCE':
      return {
        ...state,
        compliance: state.compliance.map(c =>
          c.id === action.id ? { ...c, ...action.updates } : c
        ),
      };

    case 'REFRESH_TIMESTAMP':
      return { ...state, lastRefreshed: new Date().toISOString() };

    default:
      return state;
  }
}

// --- Context Shape ---
interface AppContextValue {
  state: AppState;
  // Role
  setCurrentRole: (role: UserRole) => void;
  // Referrals
  updateReferralStage: (id: string, stage: Referral['stage']) => void;
  updateReferral: (id: string, updates: Partial<Referral>) => void;
  addReferral: (referral: Referral) => void;
  // Visits
  updateVisitChecklist: (visitId: string, taskIndex: number, completed: boolean) => void;
  updateVisit: (visitId: string, updates: Partial<FieldVisit>) => void;
  // Quality
  updateQualityStatus: (id: string, status: QualityStatus) => void;
  addQualityItem: (item: QualityItem) => void;
  // Staff
  updateStaff: (staffId: string, updates: Partial<StaffMember>) => void;
  // Partners
  addPartner: (partner: ReferralPartner) => void;
  updatePartner: (id: string, updates: Partial<ReferralPartner>) => void;
  // Audit
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  // Alerts
  addAlert: (alert: Omit<AlertItem, 'id'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  // Assessments
  updateOASIS: (id: string, updates: Partial<OASISAssessment>) => void;
  updateHOPE: (id: string, updates: Partial<HOPEAssessment>) => void;
  // Compliance
  updateCompliance: (id: string, updates: Partial<ComplianceItem>) => void;
  // Calculated compliance status
  getCalculatedComplianceStatus: (item: ComplianceItem) => ReturnType<typeof getComplianceStatus>;
  // Refresh
  refreshTimestamp: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  const value: AppContextValue = {
    state,
    setCurrentRole: (role) => dispatch({ type: 'SET_ROLE', role }),
    updateReferralStage: (id, stage) => dispatch({ type: 'UPDATE_REFERRAL_STAGE', id, stage }),
    updateReferral: (id, updates) => dispatch({ type: 'UPDATE_REFERRAL', id, updates }),
    addReferral: (referral) => dispatch({ type: 'ADD_REFERRAL', referral }),
    updateVisitChecklist: (visitId, taskIndex, completed) =>
      dispatch({ type: 'UPDATE_VISIT_CHECKLIST', visitId, taskIndex, completed }),
    updateVisit: (visitId, updates) => dispatch({ type: 'UPDATE_VISIT', visitId, updates }),
    updateQualityStatus: (id, status) => dispatch({ type: 'UPDATE_QUALITY_STATUS', id, status }),
    addQualityItem: (item) => dispatch({ type: 'ADD_QUALITY_ITEM', item }),
    updateStaff: (staffId, updates) => dispatch({ type: 'UPDATE_STAFF', staffId, updates }),
    addPartner: (partner) => dispatch({ type: 'ADD_PARTNER', partner }),
    updatePartner: (id, updates) => dispatch({ type: 'UPDATE_PARTNER', id, updates }),
    addAuditEntry: (entry) => dispatch({ type: 'ADD_AUDIT_ENTRY', entry }),
    addAlert: (alert) => dispatch({ type: 'ADD_ALERT', alert }),
    acknowledgeAlert: (alertId) => dispatch({ type: 'ACKNOWLEDGE_ALERT', alertId }),
    updateOASIS: (id, updates) => dispatch({ type: 'UPDATE_OASIS', id, updates }),
    updateHOPE: (id, updates) => dispatch({ type: 'UPDATE_HOPE', id, updates }),
    updateCompliance: (id, updates) => dispatch({ type: 'UPDATE_COMPLIANCE', id, updates }),
    getCalculatedComplianceStatus: getComplianceStatus,
    refreshTimestamp: () => dispatch({ type: 'REFRESH_TIMESTAMP' }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
