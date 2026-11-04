import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { Student360Dossier } from '../student/Student360Dossier';

export interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose }) => {
  const { students, selectedStudentId, currentUser } = useCRM();

  if (!isOpen) return null;

  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];
  if (!currentStudent) return null;

  const isStaffView = currentUser?.role !== 'student';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-6xl my-auto max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl no-scrollbar">
        <Student360Dossier
          student={currentStudent}
          isStaffView={isStaffView}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
