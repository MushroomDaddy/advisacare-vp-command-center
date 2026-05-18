import { useAppState } from '../context/AppContext';
import { useState } from 'react';

export default function Referrals() {
  const { state, updateReferralStage, addAuditEntry } = useAppState();
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('All Stages');
  const [showNewForm, setShowNewForm] = useState(false);

  const filtered = state.referrals.filter((r) => {
    const matchesText = r.patientInitials.toLowerCase().includes(filter.toLowerCase()) ||
      r.source.toLowerCase().includes(filter.toLowerCase());
    const matchesStage = stageFilter === 'All Stages' || r.stage === stageFilter;
    return matchesText && matchesStage;
  });

  const stages = ['All Stages', 'New', 'Missing Docs', 'Eligibility', 'Staffing', 'Scheduled', 'Started', 'Declined'];

  const handleStageChange = (id: string, newStage: string) => {
    updateReferralStage(id, newStage as any);
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

  const getAISummary = (referral: typeof state.referrals[0]) => {
    const missing = referral.missingItems.length > 0 ? referral.missingItems.join(', ') : 'None';
    let action = '';
    let followUp = referral.assignedCoordinator;
    
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
      action = `Continue to next stage: ${getNextStage(referral.stage)}`;
    }
    
    return { missing, action, followUp };
  };

  const getNextStage = (current: string) => {
    const flow = ['New', 'Missing Docs', 'Eligibility', 'Staffing', 'Scheduled', 'Started'];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : 'Completed';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-advisa-primary">Referral Intake Command Center</h2>
        <button 
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-4 py-2 bg-advisa-primary text-white rounded-lg text-sm hover:bg-advisa-secondary"
        >
          + New Referral
        </button>
      </div>
      
      {/* New Referral Form */}
      {showNewForm && (
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-4">New Referral Form</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Patient Initials (e.g. J.D.)" className="px-3 py-2 border rounded-lg text-sm" />
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Select Service Type</option>
              <option>Home Health</option>
              <option>Hospice</option>
              <option>Personal Care</option>
              <option>Therapy</option>
              <option>Catastrophic Injury Care</option>
            </select>
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Select Urgency</option>
              <option>Routine</option>
              <option>Urgent 24-48 hours</option>
              <option>Immediate</option>
            </select>
            <input placeholder="Discharge Facility" className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button className="mt-4 px-4 py-2 bg-advisa-accent text-white rounded-lg text-sm">
            Submit Referral
          </button>
        </div>
      )}
      
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search by initials or source..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-advisa-accent"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          {stages.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2">Patient</th>
                <th className="text-left py-3 px-2">Service</th>
                <th className="text-left py-3 px-2">Urgency</th>
                <th className="text-left py-3 px-2">Source</th>
                <th className="text-left py-3 px-2">Stage</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((referral) => (
                <tr
                  key={referral.id}
                  className={"border-b border-gray-50 hover:bg-gray-50 " + (selectedReferral === referral.id ? "bg-blue-50" : "")}
                  onClick={() => setSelectedReferral(referral.id)}
                >
                  <td className="py-3 px-2 font-medium">{referral.patientInitials}</td>
                  <td className="py-3 px-2">{referral.serviceType}</td>
                  <td className="py-3 px-2">
                    <span className={
                      referral.urgency === 'Immediate' ? 'badge-urgent' :
                      referral.urgency === 'Urgent 24-48 hours' ? 'badge-warning' : 'badge-success'
                    }>
                      {referral.urgency}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600">{referral.source}</td>
                  <td className="py-3 px-2">
                    <select 
                      value={referral.stage}
                      onChange={(e) => handleStageChange(referral.id, e.target.value)}
                      className="text-xs px-2 py-1 border rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {stages.filter(s => s !== 'All Stages').map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-2">
                    <span className={referral.documentsUploaded < 3 ? 'text-hipaa-red' : 'text-hipaa-green'}>
                      📄 {referral.documentsUploaded}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Referral Summary Panel */}
        <div className="card">
          <h3 className="text-lg font-semibold text-advisa-primary mb-4">AI Referral Summary</h3>
          {selectedReferral ? (() => {
            const referral = state.referrals.find(r => r.id === selectedReferral);
            if (!referral) return null;
            const summary = getAISummary(referral);
            
            return (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">PATIENT INITIALS</p>
                  <p className="font-medium text-lg">{referral.patientInitials}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">SERVICE REQUESTED</p>
                  <p className="font-medium">{referral.serviceType}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">URGENCY</p>
                  <p className="font-medium">{referral.urgency}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">CURRENT STAGE</p>
                  <p className="font-medium">{referral.stage}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">MISSING ITEMS</p>
                  <ul className="list-disc list-inside text-hipaa-red text-xs mt-1">
                    {referral.missingItems.length > 0 ? (
                      referral.missingItems.map((item) => <li key={item}>{item}</li>)
                    ) : (
                      <li className="text-hipaa-green">None 🎉</li>
                    )}
                  </ul>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-gray-500 text-xs">RECOMMENDED NEXT ACTION (ADMIN)</p>
                  <p className="font-medium text-sm mt-1 p-3 bg-blue-50 rounded-lg">
                    {summary.action}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">FOLLOW UP WITH</p>
                  <p className="font-medium">{summary.followUp}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg mt-4">
                  <p className="text-xs text-blue-600">🤖 AI summary uses demo data only. No medical advice provided. Administrative actions only.</p>
                </div>
              </div>
            );
          })() : (
            <p className="text-gray-400 text-sm">👈 Select a referral to view AI summary</p>
          )}
        </div>
      </div>
    </div>
  );
}
