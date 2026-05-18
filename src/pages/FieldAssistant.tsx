import { useAppState } from '../context/AppContext';
import { useState } from 'react';

export default function FieldAssistant() {
  const { state, updateVisitChecklist, addAuditEntry } = useAppState();
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationText, setEscalationText] = useState('');
  
  const selectedVisitData = state.visits.find(v => v.id === selectedVisit);
  
  const handleChecklistToggle = (visitId: string, taskIndex: number) => {
    updateVisitChecklist(visitId, taskIndex);
    const visit = state.visits.find(v => v.id === visitId);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Quality',
      recordId: visitId,
      details: `Checklist item ${taskIndex} toggled for ${visit?.patientInitials}`,
    });
  };

  const handleSaveNote = () => {
    if (!selectedVisit || !noteText.trim()) return;
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Quality',
      recordId: selectedVisit,
      details: `Voice note added for ${selectedVisitData?.patientInitials}`,
    });
    setNoteText('');
    alert('Note saved successfully!');
  };

  const handleEscalation = () => {
    if (!escalationText.trim()) return;
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Created',
      recordType: 'Quality',
      recordId: selectedVisit || 'N/A',
      details: `ESCALATION: ${escalationText}`,
    });
    setEscalationText('');
    setShowEscalation(false);
    alert('Escalation submitted!');
  };

  const completedCount = state.visits.filter(v => v.documentationStatus === 'Complete').length;
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-advisa-primary mb-6">Field Visit Assistant</h2>
      
      <div className="max-w-4xl mx-auto">
        {/* Mobile-style card */}
        <div className="card border-2 border-advisa-accent">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📱 Today's Route</h3>
            <div className="flex gap-2">
              <span className="badge-success">{state.visits.length} Visits</span>
              <span className="badge-success">{completedCount} Documented</span>
            </div>
          </div>
          
          {/* Visit Cards */}
          <div className="space-y-3 mb-6">
            {state.visits.map((visit) => (
              <div 
                key={visit.id} 
                className={"p-4 border rounded-lg cursor-pointer transition-all " + 
                  (selectedVisit === visit.id 
                    ? "border-advisa-accent bg-blue-50 shadow-md" 
                    : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  )}
                onClick={() => setSelectedVisit(selectedVisit === visit.id ? null : visit.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{visit.patientInitials}</p>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{visit.serviceType}</span>
                    </div>
                    <p className="text-sm text-gray-500">🕐 {visit.time} • {visit.staffName}</p>
                    <p className="text-xs text-gray-400 mt-1">📍 {visit.address}</p>
                  </div>
                  <div className="text-right">
                    <span className={
                      visit.documentationStatus === 'Complete' ? 'badge-success' :
                      visit.documentationStatus === 'Pending' ? 'badge-warning' : 'badge-urgent'
                    }>
                      {visit.documentationStatus}
                    </span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Checklist</span>
                    <span>{visit.checklist.filter(i => i.completed).length}/{visit.checklist.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-advisa-accent h-2 rounded-full transition-all" 
                      style={{ width: `${(visit.checklist.filter(i => i.completed).length / visit.checklist.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Visit Detail */}
          {selectedVisitData && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Visit Details - {selectedVisitData.patientInitials}</h4>
              
              {/* Checklist */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Checklist:</p>
                <div className="space-y-2">
                  {selectedVisitData.checklist.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => handleChecklistToggle(selectedVisitData.id, idx)}
                        className="w-5 h-5 rounded border-gray-300 text-advisa-accent focus:ring-advisa-accent"
                      />
                      <span className={item.completed ? "line-through text-gray-400" : "text-gray-700"}>
                        {item.task}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Supplies Needed */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Supplies Needed:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedVisitData.suppliesNeeded.map(s => (
                    <span key={s} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Voice-to-Note */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Voice-to-Note / Notes:</label>
                <textarea 
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-advisa-accent focus:outline-none"
                  rows={4}
                  placeholder="Record or type your visit notes here..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button 
                  onClick={handleSaveNote}
                  className="mt-2 px-4 py-2 bg-advisa-primary text-white rounded-lg text-sm hover:bg-advisa-secondary"
                >
                  💾 Save Note
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowEscalation(!showEscalation)}
                  className="flex-1 bg-hipaa-red/10 text-hipaa-red py-2 rounded-lg text-sm font-medium hover:bg-hipaa-red/20 transition-colors"
                >
                  🚨 Escalate
                </button>
                <button className="flex-1 bg-advisa-accent/10 text-advisa-primary py-2 rounded-lg text-sm font-medium hover:bg-advisa-accent/20 transition-colors">
                  📋 Incident Report
                </button>
              </div>

              {/* Escalation Form */}
              {showEscalation && (
                <div className="mt-4 p-4 bg-hipaa-red/5 border border-hipaa-red/20 rounded-lg">
                  <p className="font-medium text-hipaa-red mb-2">Escalation Details:</p>
                  <textarea 
                    className="w-full p-3 border border-hipaa-red/30 rounded-lg text-sm"
                    rows={3}
                    placeholder="Describe the issue that needs escalation..."
                    value={escalationText}
                    onChange={(e) => setEscalationText(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={handleEscalation}
                      className="px-4 py-2 bg-hipaa-red text-white rounded-lg text-sm"
                    >
                      Submit Escalation
                    </button>
                    <button 
                      onClick={() => { setShowEscalation(false); setEscalationText(''); }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
