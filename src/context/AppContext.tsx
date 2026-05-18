/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AppState, Referral, QualityItem, AuditEntry, ComplianceItem, StaffMember } from '../types';
import { getInitialState } from '../data/seedData';
import { calculateDashboardKPIs, findBestMatchStaff, getSOCDaysUntilDeadline, getComplianceStatus as getNewComplianceStatus, type ComplianceCategory, type StaffScore, type DashboardKPIs } from '../utils/dataLogic';

// --- Context Type ---
interface AppContextType {
  state: AppState;
  updateReferralStage: (id: string, stage: Referral['stage']) => void;
  updateVisitChecklist: (visitId: string, taskIndex: number) => void;
  updateVisitNotes: (visitId: string, notes: string) => void;
  addIncidentReport: (report: Omit<QualityItem, 'id'>) => void;
  updateQualityStatus: (id: string, status: QualityItem['status']) => void;
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  addReferral: (referral: Referral) => void;
  updateComplianceItem: (id: string, updates: Partial<ComplianceItem>) => void;
  getComplianceStatus: (item: ComplianceItem) => ComplianceCategory;
  calculateDashboardKPIs: (referrals: Referral[], staff: StaffMember[], compliance: ComplianceItem[], quality: QualityItem[]) => DashboardKPIs;
  findBestMatchStaff: (referral: Referral, staffList: StaffMember[]) => StaffScore[];
  getSOCDaysUntilDeadline: (referral: Referral) => number | null;
  setCurrentRole: (role: AppState['currentUser']['role']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Provider ---
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);

  const updateReferralStage = useCallback((id: string, stage: Referral['stage']) => {
    setState(prev => ({
      ...prev,
      referrals: prev.referrals.map(r => r.id === id ? { ...r, stage } : r),
    }));
  }, []);

  const updateVisitChecklist = useCallback((visitId: string, taskIndex: number) => {
    setState(prev => ({
      ...prev,
      visits: prev.visits.map(v => 
        v.id === visitId 
          ? { ...v, checklist: v.checklist.map((item, idx) => idx === taskIndex ? { ...item, completed: !item.completed } : item) }
          : v
      ),
    }));
  }, []);

  const updateQualityStatus = useCallback((id: string, status: QualityItem['status']) => {
    setState(prev => ({
      ...prev,
      quality: prev.quality.map(q => q.id === id ? { ...q, status } : q),
    }));
  }, []);

  const addAuditEntry = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, auditLog: [newEntry, ...prev.auditLog] }));
  }, []);

  const addReferral = useCallback((referral: Referral) => {
    setState(prev => ({
      ...prev,
      referrals: [...prev.referrals, referral],
    }));
  }, []);

  const updateVisitNotes = useCallback((visitId: string, notes: string) => {
    setState(prev => ({
      ...prev,
      visits: prev.visits.map(v => v.id === visitId ? { ...v, notes } : v),
    }));
  }, []);

  const addIncidentReport = useCallback((report: Omit<QualityItem, 'id'>) => {
    const newReport: QualityItem = {
      ...report,
      id: `incident_${Date.now()}`,
    };
    setState(prev => ({
      ...prev,
      quality: [...prev.quality, newReport],
    }));
  }, []);

  const updateComplianceItem = useCallback((id: string, updates: Partial<ComplianceItem>) => {
    setState(prev => ({
      ...prev,
      compliance: prev.compliance.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  const getComplianceStatus = useCallback((item: ComplianceItem) => {
    return getNewComplianceStatus(item);
  }, []);

  const setCurrentRole = useCallback((role: AppState['currentUser']['role']) => {
    setState(prev => ({
      ...prev,
      currentUser: {
        ...prev.currentUser,
        role: role,
      },
    }));
  }, []);

  return (
    <AppContext.Provider value={{ state, updateReferralStage, updateVisitChecklist, updateVisitNotes, addIncidentReport, updateQualityStatus, addAuditEntry, addReferral, updateComplianceItem, getComplianceStatus, calculateDashboardKPIs, findBestMatchStaff, getSOCDaysUntilDeadline, setCurrentRole }}>
      {children}
    </AppContext.Provider>
  );
}

// --- Hook ---
export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}
