import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { LeadStatus } from '../../types/crm';

export interface LogFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogFollowUpModal: React.FC<LogFollowUpModalProps> = ({ isOpen, onClose }) => {
  const { selectedLeadForFollowUp, scheduleLeadFollowUp, currentUser } = useCRM();

  const [outcome, setOutcome] = useState('Call Answered - Interested');
  const [notes, setNotes] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('11:00 AM');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [preferredChannel, setPreferredChannel] = useState<'phone' | 'whatsapp' | 'email' | 'in_person'>('whatsapp');
  const [newStatus, setNewStatus] = useState<LeadStatus>('Negotiation');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedLeadForFollowUp) {
      // Default next date to 2 days from now
      const inTwoDays = new Date();
      inTwoDays.setDate(inTwoDays.getDate() + 2);
      setNextDate(inTwoDays.toISOString().split('T')[0]);
      setNotes('');
      setOutcome('Call Answered - Interested');
      setPriority(selectedLeadForFollowUp.followUpPriority || 'High');
      setPreferredChannel(selectedLeadForFollowUp.preferredChannel || 'whatsapp');
      setNewStatus(selectedLeadForFollowUp.status === 'New' ? 'Discovery' : selectedLeadForFollowUp.status);
    }
  }, [selectedLeadForFollowUp]);

  if (!isOpen || !selectedLeadForFollowUp) return null;

  const lead = selectedLeadForFollowUp;

  // Format Nigerian phone for WhatsApp (e.g. 08012345678 -> 2348012345678)
  const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') 
    ? '234' + cleanPhone.slice(1) 
    : cleanPhone.startsWith('234') 
    ? cleanPhone 
    : '234' + cleanPhone;

  const repName = currentUser?.name || 'Admissions Specialist';
  const whatsappGreeting = encodeURIComponent(
    `Hello ${lead.name}, this is ${repName} from Codelab Educate. Following up on your inquiry regarding our ${lead.programInterest} program. Are you available for a quick chat?`
  );
  const whatsappUrl = `https://wa.me/${waPhone}?text=${whatsappGreeting}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await scheduleLeadFollowUp(lead.id, {
        outcome,
        notes: notes.trim(),
        nextFollowUpDate: nextDate || undefined,
        nextFollowUpTime: nextTime || undefined,
        priority,
        preferredChannel,
        newStatus,
      });
      onClose();
    } catch (err) {
      console.error('Failed to log follow-up:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="my-auto relative w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-surface border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">phone_in_talk</span>
            </div>
            <div>
              <h2 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
                Log Follow-Up Call &amp; Target
              </h2>
              <p className="text-xs text-secondary">
                Candidate: <span className="font-bold text-on-surface">{lead.name}</span> ({lead.phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 1-Click Fast Reach-Out Bar */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-secondary font-medium">Quick Connect:</span>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:border-primary text-on-surface font-semibold hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">call</span>
              <span>Call Phone</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>WhatsApp Direct</span>
            </a>
            <a
              href={`mailto:${lead.email}?subject=Codelab%20Educate%20-%20${encodeURIComponent(lead.programInterest)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:border-blue-500 text-on-surface font-semibold hover:bg-blue-500/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">mail</span>
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            {/* Outcome and Pipeline Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Call / Reach-Out Outcome <span className="text-red-500">*</span>
                </label>
                <select
                  value={outcome}
                  onChange={e => setOutcome(e.target.value)}
                  className="w-full h-10 px-3 border border-outline-variant rounded-lg bg-surface text-xs font-medium focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Call Answered - Interested">Call Answered - Highly Interested</option>
                  <option value="Requested Callback">Requested Callback Later</option>
                  <option value="Sent Syllabus via WhatsApp">Sent Course Outline via WhatsApp</option>
                  <option value="Follow-up Call Scheduled">Follow-up Call Scheduled</option>
                  <option value="Left Voicemail / SMS Sent">Left Voicemail / SMS Sent</option>
                  <option value="Busy / No Answer">Busy / No Answer (Try again)</option>
                  <option value="Price / Budget Constraint">Price / Budget Constraint</option>
                  <option value="Distance / Timing Constraint">Distance / Commute Constraint</option>
                  <option value="Ready to Enroll">Ready to Enroll (Sending Invoice)</option>
                  <option value="Not Interested / Lost">Not Interested / Disqualified</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Update Lead Pipeline Stage
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as LeadStatus)}
                  className="w-full h-10 px-3 border border-outline-variant rounded-lg bg-surface text-xs font-medium focus:border-primary outline-none cursor-pointer"
                >
                  <option value="New">New Lead</option>
                  <option value="Discovery">Discovery Call</option>
                  <option value="Negotiation">Negotiation / Reviewing</option>
                  <option value="Qualified">Qualified &amp; Ready</option>
                  <option value="Lost">Disqualified / Lost</option>
                </select>
              </div>
            </div>

            {/* Interaction Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Interaction Notes &amp; Discussion Summary
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What did the prospective scholar say? Any questions about fees, installment options, or schedules?"
                className="w-full p-3 border border-outline-variant rounded-lg bg-surface text-xs focus:border-primary outline-none resize-none"
              />
            </div>

            {/* Next Scheduled Follow-Up */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">calendar_add_on</span>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Next Follow-Up Commitment
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-secondary">Follow-Up Date</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={e => setNextDate(e.target.value)}
                    className="w-full h-9 px-2.5 border border-outline-variant rounded-md bg-surface text-xs focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-secondary">Target Time</label>
                  <input
                    type="text"
                    value={nextTime}
                    onChange={e => setNextTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    className="w-full h-9 px-2.5 border border-outline-variant rounded-md bg-surface text-xs focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-secondary">Channel</label>
                  <select
                    value={preferredChannel}
                    onChange={e => setPreferredChannel(e.target.value as any)}
                    className="w-full h-9 px-2 border border-outline-variant rounded-md bg-surface text-xs focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="whatsapp">WhatsApp Direct</option>
                    <option value="phone">Phone Call</option>
                    <option value="email">Email Follow-Up</option>
                    <option value="in_person">In-Person Meeting</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-semibold text-secondary">Priority:</span>
                {(['High', 'Medium', 'Low'] as const).map(p => (
                  <label key={p} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="modalPriority"
                      checked={priority === p}
                      onChange={() => setPriority(p)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className={p === 'High' ? 'text-red-600 font-bold' : p === 'Medium' ? 'text-amber-600 font-medium' : 'text-secondary'}>
                      {p}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Interaction Timeline History */}
            {lead.followUpHistory && lead.followUpHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-outline-variant/60">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Past Interactions &amp; Call Logs ({lead.followUpHistory.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {lead.followUpHistory.map((act) => (
                    <div key={act.id} className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs">
                      <div className="flex items-center justify-between font-medium mb-1">
                        <span className="font-bold text-on-surface text-[11px]">{act.outcome}</span>
                        <span className="text-[10px] text-secondary">
                          {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-secondary text-[11px] whitespace-pre-wrap">{act.notes}</p>
                      <div className="flex items-center justify-between text-[10px] text-secondary/70 mt-1">
                        <span>Rep: {act.repName}</span>
                        {act.nextScheduledDate && (
                          <span className="text-primary font-medium">
                            Next: {act.nextScheduledDate} {act.nextScheduledTime || ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="shrink-0 p-3 sm:p-4 border-t border-outline-variant bg-surface-bright flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !notes.trim()}
              className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{isSubmitting ? 'Saving...' : 'Save & Schedule Follow-Up'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
