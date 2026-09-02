import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { MentorStatus } from '../../types/crm';

export interface EditMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditMentorModal: React.FC<EditMentorModalProps> = ({ isOpen, onClose }) => {
  const { mentors, updateMentor, selectedMentorForEditId } = useCRM();

  const currentMentor = mentors.find(m => m.id === selectedMentorForEditId) || mentors[0];

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Data & AI');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState(35000);
  const [commissionRate, setCommissionRate] = useState(37);
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [status, setStatus] = useState<MentorStatus>('Active');
  const [expertiseString, setExpertiseString] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (currentMentor) {
      setName(currentMentor.name || '');
      setRole(currentMentor.role || '');
      setDepartment(currentMentor.department || 'Data & AI');
      setEmail(currentMentor.email || '');
      setPhone(currentMentor.phone || '');
      setHourlyRate(currentMentor.hourlyRate || 35000);
      setCommissionRate(currentMentor.commissionRate || 37);
      setMaxCapacity(currentMentor.maxCapacity || 30);
      setStatus(currentMentor.status || 'Active');
      setExpertiseString(currentMentor.expertise ? currentMentor.expertise.join(', ') : '');
      setBio(currentMentor.bio || '');
    }
  }, [currentMentor, isOpen]);

  if (!isOpen || !currentMentor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const expertise = expertiseString
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    updateMentor(currentMentor.id, {
      name,
      role,
      department,
      email,
      phone,
      hourlyRate: Number(hourlyRate),
      commissionRate: Number(commissionRate),
      maxCapacity: Number(maxCapacity),
      status,
      expertise: expertise.length > 0 ? expertise : currentMentor.expertise,
      bio,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Edit Faculty Mentor Profile</h2>
              <p className="font-body-sm text-xs text-secondary">Admin Rights: Update faculty title, department, rate, capacity, and revenue share.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Faculty Name <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Academic Role / Title <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Academic Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Data & AI">Data &amp; AI</option>
                <option value="Design Systems">Design Systems</option>
                <option value="Backend & Cloud">Backend &amp; Cloud</option>
                <option value="Frontend">Frontend</option>
                <option value="Product">Product</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as MentorStatus)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Available">Available</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Official Email <span className="text-error">*</span></label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Telephone Contact</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Honorarium Hourly Rate (₦/h)</label>
              <input
                type="number"
                min="5000"
                max="500000"
                step="1000"
                value={hourlyRate}
                onChange={e => setHourlyRate(Number(e.target.value))}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Commission / Revenue Share (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={e => setCommissionRate(Number(e.target.value))}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Max Student Mentee Capacity</label>
              <input
                type="number"
                min="5"
                max="100"
                value={maxCapacity}
                onChange={e => setMaxCapacity(Number(e.target.value))}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Active Mentees (Current Load)</label>
              <input
                type="text"
                disabled
                value={`${currentMentor.activeMentees} active students`}
                className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-secondary outline-none cursor-not-allowed"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Domain Expertise (comma separated)</label>
              <input
                type="text"
                value={expertiseString}
                onChange={e => setExpertiseString(e.target.value)}
                placeholder="e.g. Python, PyTorch, Cloud Architecture, LLMs"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Professional Bio &amp; Credentials</label>
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full p-2.5 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-stack-sm flex justify-end gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Mentor Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
