import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { Student360Dossier } from '../../components/student/Student360Dossier';
import { Student } from '../../types/crm';

export const StudentProfilePage: React.FC = () => {
  const { currentStudentProfile, currentUser, students } = useCRM();

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
      </div>

      <Student360Dossier
        student={student}
        isStaffView={false}
      />
    </div>
  );
};
