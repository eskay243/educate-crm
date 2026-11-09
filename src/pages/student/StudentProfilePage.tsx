import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { Student360Dossier } from '../../components/student/Student360Dossier';
import { Student } from '../../types/crm';

export const StudentProfilePage: React.FC = () => {
  const { currentStudentProfile, currentUser, students, openModal, openBiodataModal, setSelectedStudentId } = useCRM();

  // If viewing as a logged-in student, use their current profile; fallback to demo student if demoing
  const fallbackStudent: Student = students[0] || {
    id: 'stu-demo-001',
    studentCode: 'STU-8492',
    name: currentUser?.name || 'Adebayo Adeleke',
    email: currentUser?.email || 'student@codelab.institute',
    phone: '+234 809 111 2233',
    program: 'Full-Stack Software Engineering',
    cohort: 'Cohort Alpha 2026',
    mentorName: 'Dr. Chidi Okeke',
    mentorId: 'user-mentor-demo',
    status: 'Active',
    attendanceRate: 95,
    tuitionStatus: 'Paid',
    enrolledDate: '2026-02-01',
    totalFees: 350000,
    outstandingBalance: 0,
    paidAmount: 350000,
    courses: [],
    installments: [],
  };

  const student = currentStudentProfile || fallbackStudent;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">My 360° Academic Profile</h1>
          <p className="text-xs text-secondary mt-0.5">
            View your complete academic journey, faculty mentorship history, verified attendance, and student documents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openBiodataModal({ ...student, category: 'student' })}
            className="h-9 px-3.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
            <span>Update My KYC</span>
          </button>
          {(student.certificateIssued || (student.attendedLearningHours || 0) >= 40) && (
            <button
              type="button"
              onClick={() => {
                setSelectedStudentId(student.id);
                openModal('view-certificate');
              }}
              className="h-9 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              <span>Official Certificate</span>
            </button>
          )}
        </div>
      </div>

      <Student360Dossier
        student={student}
        isStaffView={false}
      />
    </div>
  );
};
