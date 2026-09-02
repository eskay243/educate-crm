import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

export interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { addLead } = useCRM();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [programInterest, setProgramInterest] = useState('Full-Stack Software Engineering');
  const [company, setCompany] = useState('Paystack WA');
  const [source, setSource] = useState('Organic Search');
  const [assignedRep, setAssignedRep] = useState('Marcus Vance');
  const [score, setScore] = useState(75);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addLead({
      name,
      email,
      phone: phone || '+234 800 123 4567',
      company: company || 'Enterprise Client',
      programInterest,
      status: 'New',
      score: Number(score),
      source,
      lastContactDate: 'Today',
      lastContactChannel: 'via Email',
      assignedRep,
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
            className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container"
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Lead Source
              </label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              >
                <option value="Organic Search">Organic Search</option>
                <option value="LinkedIn Campaign">LinkedIn Campaign</option>
                <option value="Webinar Referral">Webinar Referral</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Community Discord">Community Discord</option>
                <option value="Direct Referral">Direct Referral</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Program of Interest
              </label>
              <select
                value={programInterest}
                onChange={e => setProgramInterest(e.target.value)}
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              >
                <option value="Full-Stack Software Engineering">Full-Stack Software Engineering</option>
                <option value="AI & Machine Learning Bootcamp">AI & Machine Learning Bootcamp</option>
                <option value="Cloud DevOps & SRE Masterclass">Cloud DevOps & SRE Masterclass</option>
                <option value="Data Science & Analytics">Data Science & Analytics</option>
                <option value="Product Management in EdTech">Product Management in EdTech</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Assigned Admissions Rep
              </label>
              <select
                value={assignedRep}
                onChange={e => setAssignedRep(e.target.value)}
                className="w-full h-10 px-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              >
                <option value="Marcus Vance">Marcus Vance</option>
                <option value="Elena Rostova">Elena Rostova</option>
                <option value="Kemi Adeyemi">Kemi Adeyemi</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Initial Lead Fit Score
              </label>
              <span className="text-xs font-bold text-primary">{score}/100</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={score}
              onChange={e => setScore(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Intake Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Candidate background, motivation, timeline..."
              className="w-full p-3 border border-outline-variant/80 rounded-md bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded-md border border-outline-variant hover:bg-surface-container font-semibold text-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded-md bg-primary text-on-primary hover:bg-surface-tint font-bold shadow-sm flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
