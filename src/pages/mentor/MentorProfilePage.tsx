import React, { useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Mentor360Dossier } from '../../components/mentors/Mentor360Dossier';

export const MentorProfilePage: React.FC = () => {
  const { currentUser, mentors } = useCRM();

  // Find active mentor profile
  const myMentor = useMemo(() => {
    return (
      mentors.find(
        m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
      ) || mentors[0]
    );
  }, [mentors, currentUser]);

  if (!myMentor) {
    return (
      <div className="p-8 text-center text-secondary">
        Mentor profile not found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Faculty 360° Dossier &amp; KYC</h1>
        <p className="text-secondary text-xs md:text-sm mt-0.5">
          View your verified personal credentials, Central Bank of Nigeria settlement details, company property, and leave history.
        </p>
      </div>

      {/* Embedded 360 Dossier */}
      <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        <Mentor360Dossier mentor={myMentor} isStaffView={false} />
      </div>
    </div>
  );
};
