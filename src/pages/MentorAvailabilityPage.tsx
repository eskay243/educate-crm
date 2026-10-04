import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { MentorAvailabilityManager } from '../components/mentors/MentorAvailabilityManager';

export const MentorAvailabilityPage: React.FC = () => {
  const { 
    mentors, 
    currentUser, 
    students, 
    courses 
  } = useCRM();

  const isMentor = currentUser?.role === 'mentor';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Find logged-in mentor profile if mentor
  const myMentorProfile = useMemo(() => {
    if (!isMentor) return null;
    return mentors.find(
      m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
    ) || null;
  }, [isMentor, mentors, currentUser]);

  // Determine accessible mentors based on role
  const accessibleMentors = useMemo(() => {
    if (!isMentor) return mentors;

    const myStudents = myMentorProfile 
      ? students.filter(s => s.mentorId === myMentorProfile.id || s.mentorName === myMentorProfile.name)
      : [];
    const myStudentPrograms = new Set(myStudents.map(s => s.program));
    const myCourses = myMentorProfile
      ? courses.filter(c => c.leadInstructor === myMentorProfile.name || myStudentPrograms.has(c.title))
      : [];
    const sharedInstructors = new Set(myCourses.map(c => c.leadInstructor));

    return mentors.filter(m => {
      if (myMentorProfile && m.id === myMentorProfile.id) return true;
      if (myMentorProfile?.department && m.department === myMentorProfile.department) return true;
      if (sharedInstructors.has(m.name)) return true;
      return false;
    });
  }, [mentors, isMentor, myMentorProfile, students, courses]);

  // Aggregate metrics
  const totalActiveSlots = useMemo(() => {
    return accessibleMentors.reduce((acc, m) => acc + (m.officeHours?.filter(s => s.isActive).length || 0), 0);
  }, [accessibleMentors]);

  const configuredMentorsCount = useMemo(() => {
    return accessibleMentors.filter(m => (m.officeHours?.length || 0) > 0).length;
  }, [accessibleMentors]);

  return (
    <div className="space-y-stack-lg max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-secondary">
          <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/mentors" className="hover:text-primary transition-colors">Mentors &amp; Sessions</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-bold text-on-surface">Office Hours &amp; Slots</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/mentors"
            className="h-8 px-3 rounded bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            <span>Faculty Overview</span>
          </Link>
          <Link
            to="/mentors/grading"
            className="h-8 px-3 rounded bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>Grading Inbox</span>
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">schedule</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                {isMentor ? 'My Office Hours & Booking Windows' : 'Faculty Office Hours & Availability'}
              </h1>
              <p className="text-secondary font-body-sm text-body-sm mt-0.5">
                {isMentor 
                  ? 'Manage your available coaching days, timeslots, and meeting links for student 1-on-1 bookings.'
                  : 'Manage weekly office hours, video links, and booking availability across academic faculty.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI stats pill */}
        <div className="flex items-center gap-3">
          <div className="bg-surface border border-outline-variant rounded-xl p-3 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div>
              <p className="text-[11px] text-secondary font-medium">Active Weekly Slots</p>
              <p className="font-bold text-sm text-on-surface">{totalActiveSlots} Slots Live</p>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl p-3 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container/40 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">person_check</span>
            </div>
            <div>
              <p className="text-[11px] text-secondary font-medium">Faculty Configured</p>
              <p className="font-bold text-sm text-on-surface">{configuredMentorsCount} of {accessibleMentors.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Availability Workspace Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <MentorAvailabilityManager
          mentors={accessibleMentors}
          targetMentor={myMentorProfile}
          isMentor={isMentor}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </div>
  );
};
