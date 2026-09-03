import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

export interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { addLead, courses, staffUsers, currentUser } = useCRM();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '__custom__');
  const [customProgram, setCustomProgram] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('Organic Search');
  
  const defaultRep = staffUsers.find(u => u.role === 'admissions' || u.role === 'super_admin')?.name || currentUser?.name || 'Admissions Team';
  const [assignedRep, setAssignedRep] = useState(defaultRep);
  const [score, setScore] = useState(75);
  const [dealValue, setDealValue] = useState<number>(courses[0]?.tuitionFee || 850000);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const effectiveProgram = selectedCourseId === '__custom__'
    ? (customProgram || 'Full-Stack Software Engineering')
    : (courses.find(c => c.id === selectedCourseId)?.title || customProgram || 'Full-Stack Software Engineering');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addLead({
      name,
      email,
      phone: phone || '+234 800 123 4567',
      company: company || 'Enterprise Client',
      programInterest: effectiveProgram,
      status: 'New',
      score: Number(score),
      source,
      lastContactDate: 'Today',
      lastContactChannel: 'via Email',
      assignedRep: assignedRep || 'Admissions Specialist',
      dealValue: Number(dealValue),
      notes: notes || 'Direct intake record created from admin dashboard.',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-4 sm:p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant/60 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant/40 bg-surface-container-lowest">
          <div className="flex items-center gap-stack-sm">
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>person_add</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Add Prospective Lead</h2>
              <p className="text-xs text-on-surface-variant">Capture inquiry details and assign to intake sales rep</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Samuel Adebayo"
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Email Address <span className="text-error">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="samuel@techvision.io"
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Paystack WA / Flutterwave"
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+234 800 678 9012"
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Lead Source
              </label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
              >
                <option value="Organic Search">Organic Search</option>
                <option value="LinkedIn Campaign">LinkedIn Campaign</option>
                <option value="Webinar Referral">Webinar Referral</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Community Discord">Community Discord</option>
                <option value="Direct Referral">Direct Referral</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Assigned Admissions Rep
              </label>
              <select
                value={assignedRep}
                onChange={e => setAssignedRep(e.target.value)}
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
              >
                {staffUsers.length === 0 ? (
                  <option value={currentUser?.name || 'Super Admin'}>{currentUser?.name || 'Super Admin'} (Admissions)</option>
                ) : (
                  staffUsers.map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.roleTitle})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Program of Interest
              </label>
              <select
                value={selectedCourseId}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedCourseId(id);
                  if (id !== '__custom__') {
                    const c = courses.find(item => item.id === id);
                    if (c) setDealValue(c.tuitionFee);
                  }
                }}
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
                <option value="__custom__">+ Custom Program Track...</option>
              </select>

              {selectedCourseId === '__custom__' && (
                <div className="pt-2 animate-in fade-in">
                  <input
                    type="text"
                    required
                    value={customProgram}
                    onChange={e => setCustomProgram(e.target.value)}
                    placeholder="e.g. Full-Stack Software Engineering"
                    className="w-full h-10 px-3 border border-primary rounded-md bg-surface text-body-md outline-none"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Expected Deal / Tuition Value (₦)
              </label>
              <input
                type="number"
                value={dealValue}
                onChange={e => setDealValue(Number(e.target.value))}
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md font-bold font-mono focus:border-primary outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Lead Qualification Score
                </label>
                <span className="text-xs font-bold text-primary font-mono">{score}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Discovery Notes &amp; Background
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Candidate background, funding capability, target commencement month..."
              className="w-full p-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-md hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-on-primary text-xs font-bold rounded-md hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
              <span>Save Lead Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
