import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { Mentor360Dossier } from '../mentors/Mentor360Dossier';

export interface MentorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MentorProfileModal: React.FC<MentorProfileModalProps> = ({ isOpen, onClose }) => {
  const { mentors, selectedMentorForProfileId, currentUser } = useCRM();

  if (!isOpen) return null;

  const currentMentor = mentors.find(m => m.id === selectedMentorForProfileId) || mentors[0];
  if (!currentMentor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-6xl my-auto max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl no-scrollbar">
        <Mentor360Dossier
          mentor={currentMentor}
          isStaffView={currentUser?.role !== 'student'}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
