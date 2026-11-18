import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { MentorAvailabilityManager } from '../components/mentors/MentorAvailabilityManager';
import { PageHeader, SemanticMetricCard } from '../components/common/KineticUI';

export const MentorAvailabilityPage: React.FC = () => {
  const { 
    mentors, 
    currentUser 
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

  // Determine accessible mentors based on role (mentors only see themselves)
  const accessibleMentors = useMemo(() => {
    if (!isMentor) return mentors;
    return myMentorProfile ? [myMentorProfile] : [];
  }, [mentors, isMentor, myMentorProfile]);

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
      <PageHeader
        title={isMentor ? 'My Office Hours & Booking Windows' : 'Faculty Office Hours & Availability'}
        subtitle={
          isMentor
            ? 'Manage your available coaching days, timeslots, and meeting links for student 1-on-1 bookings.'
            : 'Manage weekly office hours, video links, and booking availability across academic faculty.'
        }
        badgeText="1-on-1 Coaching Windows"
        badgeIntent="sky"
        badgePulse
      />

      {/* Quick KPI stats - Color-Coded Semantic Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SemanticMetricCard
          label="Active Weekly Slots"
          value={totalActiveSlots}
          icon="verified"
          intent="emerald"
          badge="Slots Live"
          subtitle="Open booking windows for mentees"
        />
        <SemanticMetricCard
          label="Faculty Configured"
          value={`${configuredMentorsCount} / ${accessibleMentors.length}`}
          icon="person_check"
          intent="sky"
          badge="Roster Ready"
          subtitle="Mentors with active office hours"
        />
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
