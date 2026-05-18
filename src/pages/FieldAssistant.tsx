import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import type { FieldVisit, EVVExceptionType, OfflineSyncItem } from '../types';
import {
  Smartphone, MapPin, CheckCircle, XCircle, AlertTriangle,
  Navigation, Wifi, WifiOff, Play, Square, ChevronDown,
  ChevronUp, RotateCcw, PenTool, Home, ClipboardList, Star, Settings
} from 'lucide-react';

const evvExceptionTypes: EVVExceptionType[] = ['GPS Mismatch', 'Missed Clock-In', 'Late Clock-Out', 'No Signature', 'Offline Sync'];

function SignatureModal({ onCapture, onClose }: { onCapture: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl p-5 w-80">
        <p className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
          <PenTool size={14} className="text-advisa-accent" /> Capture Signature
        </p>
        <p className="text-xs text-slate-500 mb-3">
          In production, this would open a signature pad. For demo, click below to simulate capture.
        </p>
        <div className="border-2 border-dashed border-slate-300 rounded-lg h-24 flex items-center justify-center mb-4 text-slate-400 text-xs">
          [ Signature Pad Placeholder ]
        </div>
        <div className="flex gap-2">
          <button onClick={onCapture} className="btn-primary text-sm flex-1" data-testid="confirm-signature">
            <CheckCircle size={14} /> Confirm Signature
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function VisitCard({ visit, onStartVisit, onEndVisit, onChecklistToggle, onAddException, onCaptureSignature }: {
  visit: FieldVisit;
  onStartVisit: (id: string) => void;
  onEndVisit: (id: string) => void;
  onChecklistToggle: (visitId: string, taskIndex: number, completed: boolean) => void;
  onAddException: (visitId: string, type: EVVExceptionType, reason: string) => void;
  onCaptureSignature: (visitId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionType, setExceptionType] = useState<EVVExceptionType>('GPS Mismatch');
  const [exceptionReason, setExceptionReason] = useState('');

  const completedTasks = visit.checklist.filter(t => t.completed).length;
  const allCompleted = completedTasks === visit.checklist.length;
  const hasSigOrException = visit.signatureCaptured || visit.evv.patientSignature || visit.evvExceptions.some(e => e.type === 'No Signature');
  const hasClockIn = !!visit.evv.clockIn;
  const canEndVisit = allCompleted && hasSigOrException && hasClockIn;

  const statusColor = visit.visitStatus === 'Completed' ? 'border-emerald-200 bg-emerald-50'
    : visit.visitStatus === 'In Progress' ? 'border-sky-200 bg-sky-50'
    : visit.visitStatus === 'Missed' ? 'border-red-200 bg-red-50'
    : 'border-advisa-border bg-white';

  const handleEndVisit = () => {
    if (!allCompleted) return;
    if (!hasSigOrException) {
      // Prompt for signature or exception
      setShowExceptionForm(true);
      setExceptionType('No Signature');
      return;
    }
    if (!hasClockIn) return;
    onEndVisit(visit.id);
  };

  const handleSubmitException = () => {
    if (exceptionReason.trim()) {
      onAddException(visit.id, exceptionType, exceptionReason);
      setShowExceptionForm(false);
      setExceptionReason('');
      // If this was a "No Signature" exception during end-visit attempt, also end the visit
      if (exceptionType === 'No Signature' && allCompleted && hasClockIn) {
        onEndVisit(visit.id);
      }
    }
  };

  // Reasons why End Visit is blocked
  const blockReasons: string[] = [];
  if (!allCompleted) blockReasons.push('Complete all checklist items');
  if (!hasSigOrException) blockReasons.push('Capture signature or submit exception');
  if (!hasClockIn) blockReasons.push('Clock-in required');

  return (
    <div className={`rounded-xl border-2 shadow-sm transition-all ${statusColor}`} data-testid="visit-card">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${visit.acuity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {visit.patientInitials.split('.')[0]}
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">{visit.patientInitials}</p>
              <p className="text-xs text-slate-500">{visit.serviceType}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`badge text-xs ${visit.visitStatus === 'Completed' ? 'badge-success' : visit.visitStatus === 'In Progress' ? 'badge-info' : visit.visitStatus === 'Missed' ? 'badge-urgent' : 'badge-neutral'}`}>
              {visit.visitStatus}
            </span>
            <p className="text-xs text-slate-400 mt-1">{visit.time}</p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
          <span>{visit.address}</span>
        </div>

        {/* Acuity + EVV Status + Signature */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`badge text-[10px] ${visit.acuity === 'High' ? 'badge-urgent' : 'badge-warning'}`}>
            {visit.acuity} Acuity
          </span>
          <span className={`badge text-[10px] ${visit.evv.syncStatus === 'Synced' ? 'badge-success' : visit.evv.syncStatus === 'Failed' ? 'badge-urgent' : 'badge-warning'}`}>
            {visit.evv.syncStatus === 'Synced' ? <Wifi size={8} /> : <WifiOff size={8} />}
            EVV: {visit.evv.syncStatus}
          </span>
          {visit.evvExceptions.length > 0 && (
            <span className="badge badge-warning text-[10px]">{visit.evvExceptions.length} exception{visit.evvExceptions.length > 1 ? 's' : ''}</span>
          )}
          {visit.signatureCaptured && (
            <span className="badge badge-success text-[10px]" data-testid="signature-badge"><PenTool size={8} /> Signed</span>
          )}
        </div>

        {/* Checklist Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-500">Checklist {completedTasks}/{visit.checklist.length}</span>
            <span className="text-[10px] text-slate-400">{Math.round((completedTasks / visit.checklist.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-advisa-accent rounded-full transition-all" style={{ width: `${(completedTasks / visit.checklist.length) * 100}%` }} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {visit.visitStatus === 'Scheduled' && (
            <button onClick={() => onStartVisit(visit.id)} className="btn-primary text-sm flex-1">
              <Play size={14} /> Start Visit
            </button>
          )}
          {visit.visitStatus === 'In Progress' && !visit.signatureCaptured && !visit.evv.patientSignature && (
            <button onClick={() => onCaptureSignature(visit.id)} className="btn-secondary text-sm flex-1" data-testid="capture-signature-btn">
              <PenTool size={14} /> Capture Signature
            </button>
          )}
          {visit.visitStatus === 'In Progress' && (
            <button
              onClick={handleEndVisit}
              disabled={!canEndVisit}
              className={`text-sm flex-1 ${canEndVisit ? 'btn-primary bg-emerald-600 hover:bg-emerald-700' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              title={!canEndVisit ? blockReasons.join('; ') : undefined}
              data-testid="end-visit-btn"
            >
              <Square size={14} /> End Visit
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="btn-secondary p-2">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {visit.visitStatus === 'In Progress' && blockReasons.length > 0 && (
          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
            <AlertTriangle size={9} /> {blockReasons.join(' · ')}
          </p>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-advisa-border p-4 space-y-4">
          {/* Checklist */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Checklist</p>
            <div className="space-y-1.5">
              {visit.checklist.map((task, idx) => (
                <button
                  key={idx}
                  onClick={() => onChecklistToggle(visit.id, idx, !task.completed)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-colors ${task.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  {task.completed ? <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" /> : <XCircle size={13} className="text-slate-300 flex-shrink-0" />}
                  <span className={task.completed ? 'line-through' : ''}>{task.task}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Supplies */}
          {visit.suppliesNeeded.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Supplies Needed</p>
              <div className="flex flex-wrap gap-1.5">
                {visit.suppliesNeeded.map(s => (
                  <span key={s} className="badge badge-info text-[10px]">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* EVV Details */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">EVV Details</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-400">Clock In:</span>
                <p className="font-semibold">{visit.evv.clockIn ? new Date(visit.evv.clockIn).toLocaleTimeString() : '—'}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-400">Clock Out:</span>
                <p className="font-semibold">{visit.evv.clockOut ? new Date(visit.evv.clockOut).toLocaleTimeString() : '—'}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-400">GPS:</span>
                <p className="font-semibold">{visit.evv.gpsAddress || '—'}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-400">Signatures:</span>
                <p className="font-semibold">
                  {(visit.signatureCaptured || visit.evv.patientSignature) ? '✅ Patient' : '❌ Patient'}
                  {' '}
                  {visit.evv.caregiverSignature ? '✅ Caregiver' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* EVV Exceptions */}
          {visit.evvExceptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">EVV Exceptions</p>
              {visit.evvExceptions.map(exc => (
                <div key={exc.id} className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 mb-1">
                  <strong>{exc.type}:</strong> {exc.reason}
                </div>
              ))}
            </div>
          )}

          {/* Add Exception */}
          {visit.visitStatus !== 'Completed' && (
            <div>
              {!showExceptionForm ? (
                <button onClick={() => setShowExceptionForm(true)} className="btn-secondary text-xs w-full">
                  <AlertTriangle size={12} /> Report EVV Exception
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <p className="text-xs font-semibold text-amber-800">EVV Exception</p>
                  <select className="select text-xs w-full" value={exceptionType} onChange={e => setExceptionType(e.target.value as EVVExceptionType)}>
                    {evvExceptionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <textarea
                    className="w-full text-xs p-2 border border-amber-200 rounded-lg bg-white resize-none"
                    rows={2}
                    placeholder="Reason for exception..."
                    value={exceptionReason}
                    onChange={e => setExceptionReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSubmitException} className="btn-primary text-xs flex-1">Submit</button>
                    <button onClick={() => setShowExceptionForm(false)} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {visit.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Notes</p>
              <p className="text-xs text-slate-600 p-2 bg-slate-50 rounded">{visit.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RouteOptimization({ visits }: { visits: FieldVisit[] }) {
  const scheduled = visits.filter(v => v.visitStatus === 'Scheduled' || v.visitStatus === 'In Progress');
  if (scheduled.length === 0) return null;

  return (
    <div className="card mb-5 bg-sky-50/50 border-sky-200">
      <div className="card-header mb-3 text-sky-800"><Navigation size={15} /> Optimized Route (Placeholder)</div>
      <div className="space-y-2">
        {scheduled.map((v, idx) => (
          <div key={v.id} className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 bg-advisa-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
            <div className="flex-1">
              <p className="font-semibold text-slate-700">{v.patientInitials} — {v.time}</p>
              <p className="text-slate-500">{v.address}</p>
            </div>
            <span className={`badge text-[9px] ${v.acuity === 'High' ? 'badge-urgent' : 'badge-warning'}`}>{v.acuity}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-sky-500 mt-3 italic">⚠ Route optimization is a placeholder — real implementation requires mapping API integration.</p>
    </div>
  );
}

function OfflineQueue({ items, onRetry }: { items: OfflineSyncItem[]; onRetry: (id: string) => void }) {
  if (items.length === 0) return null;

  return (
    <div className="card mb-5 bg-amber-50/50 border-amber-200" data-testid="offline-queue">
      <div className="card-header mb-3 text-amber-800"><WifiOff size={15} /> Offline Sync Queue</div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-2 bg-white border border-amber-200 rounded-lg text-xs">
            <div>
              <p className="font-semibold text-slate-700">{item.patientInitials} — {item.action}</p>
              <p className="text-slate-400">{item.retryCount > 0 ? `${item.retryCount} retries` : 'Queued'} · {new Date(item.queuedAt).toLocaleTimeString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge text-[9px] ${item.status === 'Failed' ? 'badge-urgent' : 'badge-warning'}`}>
                {item.status}
              </span>
              {item.status === 'Failed' && (
                <button onClick={() => onRetry(item.id)} className="btn-secondary text-[10px] py-1 px-2">
                  <RotateCcw size={9} /> Retry
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Bottom mobile nav for Field Staff role */
function FieldMobileNav({ activeTab, onChangeTab }: { activeTab: string; onChangeTab: (tab: string) => void }) {
  const tabs = [
    { id: 'visits', label: 'Visits', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'quality', label: 'Quality', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-advisa-border z-30 flex md:hidden" data-testid="field-mobile-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${active ? 'text-advisa-accent' : 'text-slate-400'}`}
          >
            <Icon size={18} />
            <span className="mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function FieldAssistant() {
  const { state, updateVisit, updateVisitChecklist, updateOfflineSync, addAuditEntry, addToast } = useAppState();
  const [signatureVisitId, setSignatureVisitId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState('visits');

  // Filter visits for current user (Field Staff = Sarah Mitchell)
  const myVisits = state.currentUser.role === 'Field Staff'
    ? state.visits.filter(v => v.staffName === state.currentUser.name)
    : state.visits;

  const handleStartVisit = (visitId: string) => {
    const now = new Date().toISOString();
    updateVisit(visitId, {
      visitStatus: 'In Progress',
      evv: {
        ...state.visits.find(v => v.id === visitId)!.evv,
        clockIn: now,
        gpsLatitude: '29.7604',
        gpsLongitude: '-95.3698',
        gpsAddress: 'GPS captured (demo)',
        syncStatus: 'Pending',
      },
    });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Visit', recordId: visitId,
      details: `Started visit — EVV clock-in recorded`,
    });
    addToast('Visit started — EVV clock-in recorded', 'success');
  };

  const handleEndVisit = (visitId: string) => {
    const now = new Date().toISOString();
    const visit = state.visits.find(v => v.id === visitId);
    if (!visit) return;
    updateVisit(visitId, {
      visitStatus: 'Completed',
      evv: {
        ...visit.evv,
        clockOut: now,
        syncStatus: 'Synced',
      },
    });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Visit', recordId: visitId,
      details: `Ended visit — EVV clock-out recorded`,
    });
    addToast('Visit completed — EVV synced', 'success');
  };

  const handleChecklistToggle = (visitId: string, taskIndex: number, completed: boolean) => {
    updateVisitChecklist(visitId, taskIndex, completed);
  };

  const handleAddException = (visitId: string, type: EVVExceptionType, reason: string) => {
    const visit = state.visits.find(v => v.id === visitId);
    if (!visit) return;
    const newException = { id: 'exc' + Date.now(), visitId, type, reason };
    updateVisit(visitId, {
      evvExceptions: [...visit.evvExceptions, newException],
    });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Created', recordType: 'EVV Exception', recordId: visitId,
      details: `EVV exception: ${type} — ${reason}`,
    });
    addToast(`EVV exception reported: ${type}`, 'warning');
  };

  const handleCaptureSignature = (visitId: string) => {
    setSignatureVisitId(visitId);
  };

  const handleConfirmSignature = () => {
    if (!signatureVisitId) return;
    updateVisit(signatureVisitId, { signatureCaptured: true });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Visit', recordId: signatureVisitId,
      details: `Patient/caregiver signature captured`,
    });
    addToast('Signature captured', 'success');
    setSignatureVisitId(null);
  };

  const handleRetrySync = (itemId: string) => {
    updateOfflineSync(itemId, { status: 'Pending', retryCount: (state.offlineSyncQueue.find(i => i.id === itemId)?.retryCount || 0) + 1 });
    addToast('Retry queued', 'info');
  };

  // Stats
  const scheduled = myVisits.filter(v => v.visitStatus === 'Scheduled').length;
  const inProgress = myVisits.filter(v => v.visitStatus === 'In Progress').length;
  const completed = myVisits.filter(v => v.visitStatus === 'Completed').length;
  const missed = myVisits.filter(v => v.visitStatus === 'Missed').length;

  const isFieldStaff = state.currentUser.role === 'Field Staff';

  return (
    <div className={`max-w-lg mx-auto ${isFieldStaff ? 'pb-20' : ''}`}>
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <Smartphone size={22} className="text-advisa-accent" />
          Field Assistant
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {myVisits.length} visits today · {scheduled} scheduled · {inProgress} in progress · {completed} completed
          {missed > 0 && <span className="text-red-500"> · {missed} missed</span>}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        <div className="stat-card text-center py-2">
          <p className="text-lg font-bold text-sky-600">{scheduled}</p>
          <p className="text-[9px] text-slate-400">Scheduled</p>
        </div>
        <div className="stat-card text-center py-2">
          <p className="text-lg font-bold text-amber-600">{inProgress}</p>
          <p className="text-[9px] text-slate-400">In Progress</p>
        </div>
        <div className="stat-card text-center py-2">
          <p className="text-lg font-bold text-emerald-600">{completed}</p>
          <p className="text-[9px] text-slate-400">Completed</p>
        </div>
        <div className="stat-card text-center py-2">
          <p className="text-lg font-bold text-red-600">{missed}</p>
          <p className="text-[9px] text-slate-400">Missed</p>
        </div>
      </div>

      {/* Route Optimization */}
      <RouteOptimization visits={myVisits} />

      {/* Offline Queue */}
      <OfflineQueue items={state.offlineSyncQueue} onRetry={handleRetrySync} />

      {/* Visit Cards — Mobile-first layout */}
      <div className="space-y-4">
        {myVisits.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No visits assigned today</p>
        )}
        {myVisits
          .sort((a, b) => {
            const order = { 'In Progress': 0, 'Scheduled': 1, 'Missed': 2, 'Completed': 3 };
            return (order[a.visitStatus] ?? 9) - (order[b.visitStatus] ?? 9);
          })
          .map(visit => (
            <VisitCard
              key={visit.id}
              visit={visit}
              onStartVisit={handleStartVisit}
              onEndVisit={handleEndVisit}
              onChecklistToggle={handleChecklistToggle}
              onAddException={handleAddException}
              onCaptureSignature={handleCaptureSignature}
            />
          ))
        }
      </div>

      {/* Signature Modal */}
      {signatureVisitId && (
        <SignatureModal
          onCapture={handleConfirmSignature}
          onClose={() => setSignatureVisitId(null)}
        />
      )}

      {/* Mobile Nav for Field Staff */}
      {isFieldStaff && <FieldMobileNav activeTab={mobileTab} onChangeTab={setMobileTab} />}
    </div>
  );
}
