import { useAppState } from '../context/AppContext';
import { useState } from 'react';

export default function ReferralPartners() {
  const { state, addAuditEntry } = useAppState();
  const [filterType, setFilterType] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  
  const types = ['All', 'Hospital', 'Physician', 'Discharge Planner', 'Case Manager', 'Attorney'];
  
  const filtered = state.partners.filter(p => 
    filterType === 'All' || p.type === filterType
  );

  const avgSOC = '2.4 days'; // calculated from data in real app
  
  const totalVolume = state.partners.reduce((sum, p) => sum + p.volume, 0);

  const handleFollowUp = (partnerId: string) => {
    const partner = state.partners.find(p => p.id === partnerId);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Partner',
      recordId: partnerId,
      details: `Follow-up completed for ${partner?.name}`,
    });
    alert(`Follow-up logged for ${partner?.name}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-advisa-primary">Referral Partner CRM</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-advisa-primary text-white rounded-lg text-sm hover:bg-advisa-secondary"
        >
          + Add Partner
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Total Partners</p>
          <p className="text-3xl font-bold text-advisa-primary">{state.partners.length}</p>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Total Referrals (30d)</p>
          <p className="text-3xl font-bold text-advisa-accent">{totalVolume}</p>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Avg Time to SOC</p>
          <p className="text-3xl font-bold text-hipaa-green">{avgSOC}</p>
        </div>
      </div>

      {/* Add Partner Form */}
      {showAddForm && (
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-4">Add New Partner</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Partner Name" className="px-3 py-2 border rounded-lg text-sm" />
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Select Type</option>
              <option>Hospital</option>
              <option>Physician</option>
              <option>Discharge Planner</option>
              <option>Case Manager</option>
              <option>Attorney</option>
            </select>
            <input placeholder="Contact Name" className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Email" type="email" className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Phone" className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Volume (30d)" type="number" className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 bg-advisa-accent text-white rounded-lg text-sm">
              Save Partner
            </button>
            <button 
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Partners Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2">Partner</th>
              <th className="text-left py-3 px-2">Type</th>
              <th className="text-left py-3 px-2">Contact</th>
              <th className="text-left py-3 px-2">Volume (30d)</th>
              <th className="text-left py-3 px-2">Avg SOC</th>
              <th className="text-left py-3 px-2">Lost Reasons</th>
              <th className="text-left py-3 px-2">Last Follow-up</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((partner) => (
              <tr key={partner.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div>
                    <p className="font-medium">{partner.name}</p>
                    <p className="text-xs text-gray-400">{partner.notes}</p>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">{partner.type}</span>
                </td>
                <td className="py-3 px-2">
                  <div className="text-xs">
                    <p className="font-medium">{partner.contactName}</p>
                    <p className="text-gray-400">{partner.contactEmail}</p>
                    <p className="text-gray-400">{partner.contactPhone}</p>
                  </div>
                </td>
                <td className="py-3 px-2 font-medium">{partner.volume}</td>
                <td className="py-3 px-2 text-gray-600">{partner.avgTimeToSOC}</td>
                <td className="py-3 px-2">
                  {partner.lostReasons.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {partner.lostReasons.map(r => (
                        <span key={r} className="bg-hipaa-red/10 text-hipaa-red px-2 py-0.5 rounded-full text-xs">{r}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
                <td className="py-3 px-2 text-gray-600">{partner.lastFollowUp}</td>
                <td className="py-3 px-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleFollowUp(partner.id)}
                      className="text-xs px-3 py-1 bg-advisa-accent text-white rounded hover:bg-advisa-primary"
                    >
                      Follow Up
                    </button>
                    <button 
                      onClick={() => setSelectedPartner(selectedPartner === partner.id ? null : partner.id)}
                      className="text-xs text-advisa-accent hover:underline"
                    >
                      {selectedPartner === partner.id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Partner Detail */}
      {selectedPartner && (
        <div className="card mt-6 bg-blue-50 border-blue-200">
          {(() => {
            const partner = state.partners.find(p => p.id === selectedPartner);
            if (!partner) return null;
            return (
              <div>
                <h3 className="font-semibold text-lg mb-3">{partner.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Contact</p>
                    <p className="font-medium">{partner.contactName}</p>
                    <p className="text-gray-600">{partner.contactEmail}</p>
                    <p className="text-gray-600">{partner.contactPhone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Performance</p>
                    <p className="font-medium">Volume: {partner.volume}/month</p>
                    <p className="text-gray-600">Avg SOC: {partner.avgTimeToSOC}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Notes</p>
                    <p className="text-gray-600">{partner.notes}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
