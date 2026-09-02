import React from 'react';
import { useCRM } from '../../context/CRMContext';

export interface CreateRecordHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRecordHubModal: React.FC<CreateRecordHubModalProps> = ({ isOpen, onClose }) => {
  const { openModal } = useCRM();

  if (!isOpen) return null;

  const actions = [
    {
      id: 'recruit-mentor',
      title: 'Recruit Mentor',
      desc: 'Add a new mentor profile to the network, complete with expertise and availability.',
      icon: 'supervisor_account',
      colorClass: 'bg-primary-container/15 text-primary group-hover:bg-primary-container group-hover:text-white',
      borderHover: 'hover:border-primary',
    },
    {
      id: 'enroll-student',
      title: 'Enroll Student',
      desc: 'Register a new student, assign them to programs, and set up their initial profile.',
      icon: 'school',
      colorClass: 'bg-secondary-container/30 text-secondary group-hover:bg-secondary group-hover:text-white',
      borderHover: 'hover:border-secondary',
    },
    {
      id: 'add-lead',
      title: 'Add Lead',
      desc: 'Capture a prospective student inquiry, set source attribution, and schedule intake.',
      icon: 'person_add',
      colorClass: 'bg-tertiary-container/30 text-tertiary group-hover:bg-tertiary group-hover:text-white',
      borderHover: 'hover:border-tertiary',
    },
    {
      id: 'log-expense',
      title: 'Log Expense',
      desc: 'Record business expenditures, attach receipts, and assign to departments.',
      icon: 'receipt_long',
      colorClass: 'bg-surface-tint/15 text-surface-tint group-hover:bg-surface-tint group-hover:text-white',
      borderHover: 'hover:border-surface-tint',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-4 sm:p-margin-page animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="glass-panel relative w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all bg-surface-container-lowest/95 border border-outline-variant/60 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-lg border-b border-outline-variant/40 bg-surface-container-lowest">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Create New Record</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Select the type of record you want to add to the CRM.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {/* Bento Grid Body */}
        <div className="p-stack-lg overflow-y-auto bg-surface/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            {actions.map((act) => (
              <button
                key={act.id}
                onClick={() => openModal(act.id as any)}
                className={`group flex flex-col items-start p-stack-md rounded-xl border border-outline-variant/60 bg-surface-container-lowest hover:shadow-md transition-all text-left ${act.borderHover} cursor-pointer active:scale-[0.99]`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-stack-sm transition-all duration-200 shadow-xs ${act.colorClass}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>{act.icon}</span>
                </div>
                <h3 className="font-headline-md text-headline-md font-semibold text-on-surface mb-1 group-hover:text-primary transition-colors">
                  {act.title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {act.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-stack-lg border-t border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs text-secondary">
          <span>Need bulk import? CSV Upload supported in Settings.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-outline-variant hover:bg-surface font-semibold text-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
