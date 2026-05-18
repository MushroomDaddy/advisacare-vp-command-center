import { useAppState } from '../context/AppContext';
import type { Referral, ReferralStage } from '../types';
import { useState } from 'react';
import { ClipboardList, Plus, Search, Bot, FileText, ArrowRight, AlertTriangle } from 'lucide-react';

export default function Referrals() {
  const { state, updateReferralStage, addAuditEntry, addReferral } = useAppState();
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('All Stages');
  const [showNewForm, setShowNewForm] = useState(false);
  
  const [newPatientInitials, setNewPatientInitials] = useState('');
  const [newServiceType, setNewServiceType] = useState<Referral['serviceType']>('Home Health');
  const [newUrgency, setNewUrgency] = useState<Referral['urgency']>('Routine');
  const [newFacility, setNewFacility] = useState('');

  const filtered = state.referrals.filter((r) => {
    const matchesText = r.patientInitials.toLowerCase().includes(filter.toLowerCase()) ||
      r.source.toLowerCase().includes(filter.toLowerCase());
    const matchesStage = stageFilter === 'All Stages' || r.stage === stageFilter;
    return matchesText && matchesStage;
  });

  const stages = ['All Stages', 'New', 'Missing Docs', 'Eligibility', 'Staffing', 'Scheduled', 'Started', 'Declined'];

  const handleStageChange = (id: string, newStage: string) => {
    updateReferralStage(id, newStage as ReferralStage);
    const r = state.referrals.find(ref => ref.id === id);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Referral',
      recordId: id,
      details: `Stage changed to ${newStage} for ${r?.patientInitials}`,
    });
  };

  const handleNewReferral = () => {
    const newReferral: Referral = {
      id: `ref_${Date.now()}`,
      source: 'Manual Entry',
      patientInitials: newPatientInitials || 'J.D.',
      serviceType: newServiceType,
      urgency: newUrgency,
      dischargeFacility: newFacility || 'Demo Hospital',
      dischargeDate: new Date().toISOString().split('T')[0],
      physicianOrders: 'Pending',
      insuranceStatus: 'Pending',
      documentsUploaded: 0,
      assignedCoordinator: state.currentUser.name,
      stage: 'New',
      missingItems: ['Physician Orders', 'Discharge Summary', 'Insurance Card'],
      createdAt: new Date().toISOString(),
    };
    
    addReferral(newReferral);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Created',
      recordType: 'Referral',
      recordId: newReferral.id,
      details: `New referral ${newReferral.patientInitials} from ${newReferral.source}`,
    });
    
    setNewPatientInitials('');
    setNewServiceType('Home Health');
    setNewUrgency('Routine');
    setNewFacility('');
    setShowNewForm(false);
  };

  const getAISummary = (referral: Referral) => {
    const missing = referral.missingItems.length > 0 ? referral.missingItems.join(', ') : 'None';
    let followUp = referral.assignedCoordinator;
    
    let action: string;
    if (referral.stage === 'Missing Docs') {
      action = `Request missing documents (${missing}) from ${referral.dischargeFacility}`;
    } else if (referral.stage === 'Eligibility') {
      action = `Verify insurance coverage - current status: ${referral.insuranceStatus}`;
    } else if (referral.stage === 'Staffing') {
      action = `Match staff with: ${referral.serviceType} certification needed`;
    } else if (referral.stage === 'New') {
      action = 'Begin intake process - verify eligibility and request documents';
    } else if (referral.stage === 'Declined') {
      action = `Review decline reason - consider appeal or alternative services`;
      followUp = 'VP Review';
    } else {
      const flow = ['New', 'Missing Docs', 'Eligibility', 'Staffing', 'Scheduled', 'Started'];
      const idx = flow.indexOf(referral.stage);
      action = `Continue to next stage: ${idx < flow.length - 1 ? flow[idx + 1] : 'Completed'}`;
    }
    
    return { missing, action, followUp };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <ClipboardList size={22} className="text-advisa-accent" />
            Referral Intake Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">{filtered.length} referrals · {state.referrals.filter(r => r.urgency === 'Immediate').length} immediate</p>
        </div>
        <button onClick={() => setShowNewForm(!showNewForm)} className="btn-primary">
          <Plus size={15} />
          New Referral
        </button>
      </div>
      
      {showNewForm && (
        <div className="card mb-5 bg-sky-50/50 border-sky-200">
          <p className="section-title mb-3">New Referral Form</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Patient Initials (e.g. J.D.)" className="input" value={newPatientInitials} onChange={(e) => setNewPatientInitials(e.target.value)} />
            <select className="select" value={newServiceType} onChange={(e) => setNewServiceType(e.target.value as Referral['serviceType'])}>
              <option>Home Health</option><option>Hospice</option><option>Personal Care</option><option>Therapy</option><option>Catastrophic Injury Care</option>
            </select>
            <select className="select" value={newUrgency} onChange={(e) => setNewUrgency(e.target.value as Referral['urgency'])}>
              <option>Routine</option><option>Urgent 24-48 hours</option><option>Immediate</option>
            </select>
            <input placeholder="Discharge Facility" className="input" value={newFacility} onChange={(e) => setNewFacility(e.target.value)} />
          </div>
          <button className="btn-primary mt-3" onClick={handleNewReferral}>Submit Referral (Demo Data)</button>
        </div>
      )}
      
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by initials or source..." className="input pl-9" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <select className="select" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          {stages.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-head">Patient</th>
                <th className="table-head">Service</th>
                <th className="table-head">Urgency</th>
                <th className="table-head">Source</th>
                <th className="table-head">Stage</th>
                <th className="table-head">Docs</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((referral) => (
                <tr
                  key={referral.id}
                  className={`cursor-pointer transition-colors ${selectedReferral === referral.id ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedReferral(referral.id)}
                >
                  <td className="table-cell font-semibold text-slate-800">{referral.patientInitials}</td>
                  <td className="table-cell">{referral.serviceType}</td>
                  <td className="table-cell">
                    <span className={`badge ${
                      referral.urgency === 'Immediate' ? 'badge-urgent' :
                      referral.urgency === 'Urgent 24-48 hours' ? 'badge-warning' : 'badge-success'
                    }`}>{referral.urgency}</span>
                  </td>
                  <td className="table-cell text-slate-500">{referral.source}</td>
                  <td className="table-cell">
                    <select value={referral.stage} onChange={(e) => handleStageChange(referral.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-advisa-border rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
                      {stages.filter(s => s !== 'All Stages').map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="table-cell">
                    <div className={`flex items-center gap-1 text-xs font-medium ${referral.documentsUploaded < 3 ? 'text-red-600' : 'text-emerald-600'}`}>
                      <FileText size={13} />
                      {referral.documentsUploaded}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <Bot size={16} className="text-advisa-accent" />
            AI Referral Summary
          </div>
          {selectedReferral ? (() => {
            const referral = state.referrals.find(r => r.id === selectedReferral);
            if (!referral) return null;
            const summary = getAISummary(referral);
            
            return (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="stat-label">Patient</p>
                  <p className="text-lg font-bold text-slate-800">{referral.patientInitials}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="stat-label">Service</p><p className="font-medium text-slate-700 mt-0.5">{referral.serviceType}</p></div>
                  <div><p className="stat-label">Urgency</p><p className="font-medium text-slate-700 mt-0.5">{referral.urgency}</p></div>
                  <div><p className="stat-label">Stage</p><p className="font-medium text-slate-700 mt-0.5">{referral.stage}</p></div>
                  <div><p className="stat-label">Insurance</p><p className="font-medium text-slate-700 mt-0.5">{referral.insuranceStatus}</p></div>
                </div>
                {referral.missingItems.length > 0 && (
                  <div>
                    <p className="stat-label">Missing Items</p>
                    <ul className="mt-1 space-y-1">
                      {referral.missingItems.map((item) => (
                        <li key={item} className="flex items-center gap-1.5 text-xs text-red-600">
                          <AlertTriangle size={11} />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="pt-3 border-t border-advisa-border">
                  <p className="stat-label">Recommended Action</p>
                  <div className="mt-1.5 p-3 bg-sky-50 border border-sky-100 rounded-lg text-xs text-slate-700 flex items-start gap-2">
                    <ArrowRight size={13} className="text-advisa-accent mt-0.5 flex-shrink-0" />
                    {summary.action}
                  </div>
                </div>
                <div>
                  <p className="stat-label">Follow Up</p>
                  <p className="font-medium text-slate-700 mt-0.5">{summary.followUp}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                  <p className="text-[10px] text-slate-400">AI summary uses demo data only. No medical advice provided.</p>
                </div>
              </div>
            );
          })() : (
            <div className="text-center py-8">
              <ClipboardList size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">Select a referral to view summary</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
