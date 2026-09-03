import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

export interface RecruitMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecruitMentorModal: React.FC<RecruitMentorModalProps> = ({ isOpen, onClose }) => {
  const { recruitMentor, courses } = useCRM();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Software Engineering');
  const [hourlyRate, setHourlyRate] = useState(35000);
  const [commissionRate, setCommissionRate] = useState(37);
  const [maxCapacity, setMaxCapacity] = useState(15);
  const [payoutFrequency, setPayoutFrequency] = useState('Monthly');
  const [bankName, setBankName] = useState('Access Bank Nigeria');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  if (!isOpen) return null;

  const coursesList = courses.length > 0 
    ? courses.map(c => c.title) 
    : [
      'Full-Stack Software Engineering',
      'Data Science & Analytics',
      'Product UI/UX Design',
      'Cloud DevOps & SRE',
      'AI & Machine Learning',
    ];

  const toggleCourse = (course: string) => {
    setSelectedCourses(prev =>
      prev.includes(course) ? prev.filter(c => c !== course) : [...prev, course]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    recruitMentor({
      name,
      email,
      phone: phone || '+234 800 000 0000',
      role: `${department} Lead Mentor`,
      department,
      expertise: selectedCourses,
      hourlyRate: Number(hourlyRate),
      commissionRate: Number(commissionRate),
      activeMentees: 0,
      maxCapacity: Number(maxCapacity),
      rating: 5.0,
      status: 'Active',
      pendingPayout: 0,
      payoutStatus: 'Completed',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Recruit Mentor</h2>
            <p className="font-body-md text-body-md text-secondary">Add a new mentor to the faculty roster and configure their financial agreement.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-stack-md flex-1">
          {/* Personal Info Section */}
          <section className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
            <h3 className="text-headline-md font-headline-md font-bold text-primary flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-primary-container">person</span> Personal Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Full Name <span className="text-error">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Email <span className="text-error">*</span></label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="arthur@university.ng"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+234 802 345 6789"
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Specialized Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Product Design">Product Design</option>
                  <option value="Cloud Architecture">Cloud Architecture</option>
                </select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="font-label-md text-label-md text-secondary">Courses Offered (Select Multiple)</label>
                <div className="border border-outline-variant rounded-lg p-3 bg-surface grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {coursesList.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-body-md text-on-surface cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(c)}
                        onChange={() => toggleCourse(c)}
                        className="rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Financial Agreement Section */}
          <section className="bg-surface rounded-lg border border-outline-variant p-stack-md space-y-4">
            <h3 className="text-headline-md font-headline-md font-bold text-primary flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-primary-container">account_balance</span> Financial Agreement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Hourly Rate (₦/h)</label>
                <input
                  type="number"
                  step="1000"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Commission Share (%)</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={e => setCommissionRate(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Max Mentee Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxCapacity}
                  onChange={e => setMaxCapacity(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Payout Frequency</label>
                <select
                  value={payoutFrequency}
                  onChange={e => setPayoutFrequency(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Per Cohort">Per Cohort</option>
                </select>
              </div>
              <div className="sm:col-span-2 space-y-3 pt-2">
                <h4 className="font-label-md text-label-md text-on-surface font-semibold">Nigerian Bank Account Details (₦)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low/50 rounded-lg border border-outline-variant">
                  <div className="space-y-1">
                    <label className="font-body-sm text-xs text-secondary">Bank Name</label>
                    <select
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full h-9 px-2 bg-surface border border-outline-variant rounded text-xs text-on-surface outline-none"
                    >
                      <option value="Access Bank Nigeria">Access Bank</option>
                      <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTB)</option>
                      <option value="Zenith Bank">Zenith Bank</option>
                      <option value="First Bank of Nigeria">First Bank</option>
                      <option value="United Bank for Africa (UBA)">UBA</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-body-sm text-xs text-secondary">Account Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="0123456789"
                      className="w-full h-9 px-2 bg-surface border border-outline-variant rounded font-mono text-xs text-on-surface outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-body-sm text-xs text-secondary">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                      placeholder="e.g. ARTHUR PENDELTON"
                      className="w-full h-9 px-2 bg-surface border border-outline-variant rounded text-xs text-on-surface outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Submit Buttons */}
          <div className="pt-stack-sm flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded border border-outline-variant font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-xs"
            >
              Recruit &amp; Confirm Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
