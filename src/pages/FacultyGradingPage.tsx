import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { FacultyGradingInbox } from '../components/mentors/FacultyGradingInbox';
import { PageHeader, SemanticMetricCard } from '../components/common/KineticUI';

export const FacultyGradingPage: React.FC = () => {
  const { currentUser, assignments } = useCRM();

  const isMentor = currentUser?.role === 'mentor';

  const pendingSubmissions = useMemo(() => {
    return assignments.filter(a => a.status === 'Pending').length;
  }, [assignments]);

  const reviewedSubmissions = useMemo(() => {
    return assignments.filter(a => a.status === 'Passed' || a.status === 'Exceptional').length;
  }, [assignments]);

  return (
    <div className="space-y-stack-lg max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-secondary">
          <Link to={isMentor ? "/mentor/dashboard" : "/"} className="hover:text-primary transition-colors">
            {isMentor ? "Faculty Hub" : "Dashboard"}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          {!isMentor && (
            <>
              <Link to="/mentors" className="hover:text-primary transition-colors">Mentors &amp; Sessions</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </>
          )}
          <span className="font-bold text-on-surface">Grading Inbox</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={isMentor ? "/mentor/dashboard" : "/mentors"}
            className="h-8 px-3 rounded bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            <span>{isMentor ? "Faculty Hub" : "Faculty Overview"}</span>
          </Link>
          <Link
            to={isMentor ? "/mentor/schedule" : "/mentors/office-hours"}
            className="h-8 px-3 rounded bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Schedule &amp; Slots</span>
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <PageHeader
        title={isMentor ? 'Faculty Grading & Code Review Inbox' : 'Institutional Grading & Evaluation Queue'}
        subtitle="Review student project pull requests, test submissions, score rubrics, and disburse constructive feedback."
        badgeText="Academic Evaluation Queue"
        badgeIntent="amber"
        badgePulse={pendingSubmissions > 0}
      />

      {/* Quick KPI stats - Color-Coded Semantic Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SemanticMetricCard
          label="Pending Review"
          value={pendingSubmissions}
          icon="pending_actions"
          intent="amber"
          badge="Awaiting Score"
          badgePulse={pendingSubmissions > 0}
          subtitle="Student lab & project submissions"
        />
        <SemanticMetricCard
          label="Graded & Passed"
          value={reviewedSubmissions}
          icon="task_alt"
          intent="emerald"
          badge="Verified"
          subtitle="Completed evaluations & feedback"
        />
      </div>

      {/* Main Grading Inbox Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <FacultyGradingInbox isMentor={isMentor} />
      </div>
    </div>
  );
};
