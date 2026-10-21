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
      title: 'Request OpEx',
      desc: 'Submit an operational expense requisition for office, marketing, or hub facilities.',
      icon: 'payments',
      colorClass: 'bg-primary-container/15 text-primary group-hover:bg-primary group-hover:text-white',
      borderHover: 'hover:border-primary',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex min-h-[100dvh] items-end sm:items-center justify-center animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[min(90dvh,850px)] rounded-t-2xl sm:rounded-xl shadow-modal flex flex-col overflow-hidden transform transition-all bg-surface border border-border-subtle z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle bg-surface">
          <div>
            <h2 className="font-headline-lg text-lg sm:text-xl font-bold text-crisp-black">Create New Record</h2>
            <p className="font-sans text-xs text-on-surface-variant mt-0.5">Select the type of record you want to add to the CRM.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">close</span>
          </button>
        </div>

        {/* Bento Grid Body */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto overscroll-contain bg-surface/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {actions.map((act) => (
              <button
                key={act.id}
                onClick={() => openModal(act.id as any)}
                className={`group flex flex-col items-start p-4 sm:p-5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest hover:shadow-md transition-all text-left ${act.borderHover} cursor-pointer active:scale-[0.99]`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200 shadow-xs ${act.colorClass}`}>
                  <span className="material-symbols-outlined text-[22px] sm:text-[26px]">{act.icon}</span>
                </div>
                <h3 className="font-headline-md text-sm sm:text-base font-semibold text-on-surface mb-1 group-hover:text-primary transition-colors">
                  {act.title}
                </h3>
                <p className="font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {act.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 px-4 sm:px-6 border-t border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs text-secondary">
          <span className="truncate pr-2">Need bulk import? CSV Upload supported in Settings.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface font-semibold text-on-surface transition-colors cursor-pointer shrink-0"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
