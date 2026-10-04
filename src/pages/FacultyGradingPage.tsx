import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { FacultyGradingInbox } from '../components/mentors/FacultyGradingInbox';

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
          <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/mentors" className="hover:text-primary transition-colors">Mentors &amp; Sessions</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-bold text-on-surface">Grading Inbox</span>
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
            to="/mentors/office-hours"
            className="h-8 px-3 rounded bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Office Hours &amp; Slots</span>
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">fact_check</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                {isMentor ? 'Faculty Grading & Code Review Inbox' : 'Institutional Grading & Evaluation Queue'}
              </h1>
              <p className="text-secondary font-body-sm text-body-sm mt-0.5">
                Review student project pull requests, test submissions, score rubrics, and disburse constructive feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3">
          <div className="bg-surface border border-outline-variant rounded-xl p-3 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
            <div>
              <p className="text-[11px] text-secondary font-medium">Pending Review</p>
              <p className="font-bold text-sm text-on-surface">{pendingSubmissions} Submissions</p>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl p-3 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </div>
            <div>
              <p className="text-[11px] text-secondary font-medium">Graded &amp; Passed</p>
              <p className="font-bold text-sm text-on-surface">{reviewedSubmissions} Submissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grading Inbox Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <FacultyGradingInbox isMentor={isMentor} />
      </div>
    </div>
  );
};
