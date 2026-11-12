import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { BrandLogo } from '../common/BrandLogo';

export interface TopNavbarProps {
  onOpenMobileSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileSidebar }) => {
  const { 
    globalSearch, 
    setGlobalSearch, 
    openModal, 
    currentUser, 
    logout, 
    unreadNotificationCount,
    activeAttendanceSession,
    staleAttendanceSession,
    todayCompletedSession,
    toggleShiftBreak,
    settings,
    isSuperAdmin,
    isSimulatingRole,
    originSuperAdmin,
    switchRole
  } = useCRM();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [elapsedText, setElapsedText] = useState('00h 00m');

  React.useEffect(() => {
    if (!activeAttendanceSession) return;
    const updateElapsed = () => {
      const nowMs = Date.now();
      const grossMs = Math.max(0, nowMs - activeAttendanceSession.clockInTimestamp);
      const breakMins = Number(activeAttendanceSession.totalBreakMinutes || 0);
      const currentOpenBreakMins =
        activeAttendanceSession.isOnBreak &&
        activeAttendanceSession.breaks &&
        activeAttendanceSession.breaks.length > 0
          ? Math.max(
              0,
              Math.round(
                (nowMs -
                  activeAttendanceSession.breaks[activeAttendanceSession.breaks.length - 1]
                    .startTimestamp) /
                  60000
              )
            )
          : 0;
      const netMs = Math.max(0, grossMs - (breakMins + currentOpenBreakMins) * 60000);
      const h = Math.floor(netMs / (1000 * 60 * 60));
      const m = Math.floor((netMs % (1000 * 60 * 60)) / (1000 * 60));
      setElapsedText(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 30000);
    return () => clearInterval(interval);
  }, [activeAttendanceSession]);

  return (
    <>
      {/* Super Admin Simulation Alert Banner */}
      {isSimulatingRole && (
        <div className="bg-primary text-on-primary px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-xs sticky top-0 z-40 border-b border-white/10 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-300">visibility</span>
            <span>
              Super Admin Preview Active — You are viewing the system as <strong className="underline">{currentUser?.roleTitle}</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              switchRole('super_admin');
              navigate('/');
            }}
            className="px-2.5 py-0.5 rounded bg-surface text-on-surface hover:bg-surface-container font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[13px] text-primary">admin_panel_settings</span>
            <span>Exit Preview Mode</span>
          </button>
        </div>
      )}

      <header className="bg-surface flex justify-between items-center h-16 px-gutter w-full sticky top-0 z-30 border-b border-border-subtle shadow-xs transition-colors">
        {/* Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-stack-md md:hidden">
          <button
            onClick={onOpenMobileSidebar}
            className="text-on-surface-variant p-2 rounded hover:bg-surface-container-low transition-colors"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <BrandLogo size="sm" logoUrl={settings.logoUrl} />
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex relative w-72 lg:w-96 items-center">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: '20px' }}>
            search
          </span>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search leads, cohorts, curricula, expenses..."
            className="w-full h-9 pl-9 pr-4 rounded-md bg-canvas border border-border-subtle font-sans text-xs text-crisp-black focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5 rounded"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Daily Standup / AI Scrum Quick Trigger */}
          {currentUser && (
            <button
              onClick={() => openModal('daily-standup')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-8 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300 transition-colors cursor-pointer shadow-xs"
              title="Open AI Scrum & Daily Standup task logger"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-600">psychology</span>
              <span className="hidden sm:inline">Daily Standup</span>
            </button>
          )}

          {/* Instant Virtual Classroom / Meeting Launcher */}
          {currentUser && currentUser.role !== 'student' && (
            <button
              onClick={() => openModal('instant-meeting')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-8 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors cursor-pointer shadow-xs"
              title="Launch instant SIPCore virtual classroom or faculty sync"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">videocam</span>
              <span className="hidden sm:inline">Instant Class</span>
            </button>
          )}

          {/* Quick Record Creator (Restricted to non-students and non-mentors) */}
          {currentUser && currentUser.role !== 'student' && currentUser.role !== 'mentor' && (
            <button
              onClick={() => openModal('create-hub')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Record</span>
            </button>
          )}

          {/* Real-Time Live Clock-In Pill (Staff / Mentors only, not students) */}
          {currentUser && currentUser.role !== 'student' && (
            activeAttendanceSession ? (
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleShiftBreak(activeAttendanceSession.isOnBreak ? 'end' : 'start')}
                  className={`h-8 px-2 rounded-l-full border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    activeAttendanceSession.isOnBreak
                      ? 'bg-[#FEF3C7] border-[#D97706]/40 text-[#92400E] hover:bg-[#FDE68A]'
                      : 'bg-surface-container-low border-outline-variant text-secondary hover:text-on-surface'
                  }`}
                  title={
                    activeAttendanceSession.isOnBreak
                      ? 'Resume Shift (End Break)'
                      : 'Pause Shift for Break'
                  }
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {activeAttendanceSession.isOnBreak ? 'play_arrow' : 'coffee'}
                  </span>
                  <span className="hidden lg:inline">
                    {activeAttendanceSession.isOnBreak ? 'Resume' : 'Break'}
                  </span>
                </button>
                <div
                  onClick={() => openModal('clock-out')}
                  className={`flex items-center gap-2 px-2.5 h-8 rounded-r-full border text-xs font-semibold cursor-pointer transition-all ${
                    activeAttendanceSession.isOnBreak
                      ? 'bg-[#FEF3C7] border-[#D97706]/40 text-[#92400E]'
                      : 'bg-[#DCFCE7] border-[#16A34A]/30 text-[#166534] hover:bg-[#DCFCE7]/80'
                  }`}
                  title="Click to End Shift & Clock Out"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeAttendanceSession.isOnBreak
                        ? 'bg-[#D97706]'
                        : 'bg-[#16A34A] animate-pulse'
                    }`}
                  />
                  <span className="hidden sm:inline capitalize">
                    {activeAttendanceSession.isOnBreak
                      ? 'On Break'
                      : activeAttendanceSession.workMode}
                  </span>
                  <span className="font-data-tabular font-bold border-l border-current/25 pl-1.5">
                    {elapsedText}
                  </span>
                </div>
              </div>
            ) : staleAttendanceSession ? (
              <button
                onClick={() => openModal('clock-in')}
                className="h-8 px-2.5 sm:px-3 rounded-md bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[#D97706]/40"
                title={`Unclosed shift from ${staleAttendanceSession.date} — Click to reconcile & clock in`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#D97706]">
                  history_toggle_off
                </span>
                <span className="hidden sm:inline">Reconcile Shift</span>
              </button>
            ) : (
              <button
                onClick={() => openModal('clock-in')}
                className="h-8 px-2.5 sm:px-3 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-primary/20"
                title={
                  todayCompletedSession
                    ? 'Resume Today Shift or Clock In Again'
                    : 'Clock In for Shift'
                }
              >
                <span className="material-symbols-outlined text-[16px]">
                  {todayCompletedSession ? 'replay' : 'timer'}
                </span>
                <span className="hidden sm:inline">
                  {todayCompletedSession ? 'Resume / Clock In' : 'Clock In'}
                </span>
              </button>
            )
          )}

          {/* Help Center / Settings Quick Link */}
          {currentUser?.role === 'super_admin' ? (
            <button
              onClick={() => navigate('/settings')}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors"
              title="Institutional Documentation & Audit Settings"
              aria-label="Settings"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/tickets')}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors"
              title="Support Desk & Feedback Tickets"
              aria-label="Support Tickets"
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </button>
          )}

          {/* Notifications Trigger */}
          <button 
            onClick={() => {
              setIsNotificationsOpen(prev => !prev);
              setIsProfileOpen(false);
            }}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded relative transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-surface animate-pulse" />
            )}
          </button>

          {/* User Profile Avatar Popover */}
          <div className="relative">
            <div 
              onClick={() => {
                setIsProfileOpen(prev => !prev);
                setIsNotificationsOpen(false);
              }}
              className="h-8 px-2 rounded-full border border-outline-variant cursor-pointer hover:ring-2 hover:ring-primary-fixed-dim transition-all bg-primary-container text-on-primary-container flex items-center gap-1.5 font-bold text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'AA'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold">{currentUser?.name.split(' ')[0]}</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </div>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl p-4 z-50 animate-in fade-in space-y-3">
                <div className="border-b border-outline-variant pb-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{currentUser?.name}</p>
                    <p className="text-xs text-secondary truncate">{currentUser?.roleTitle}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="inline-block px-2 py-0.5 rounded bg-primary-container/30 text-primary text-[10px] font-bold capitalize">
                        Role: {currentUser?.role.replace('_', ' ')}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          currentUser?.kycStatus === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[11px]">
                          {currentUser?.kycStatus === 'Verified' ? 'verified' : 'pending_actions'}
                        </span>
                        <span>
                          {currentUser?.kycStatus === 'Verified'
                            ? 'KYC Verified'
                            : `KYC: ${currentUser?.kycStatus || 'Pending'}`}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Profile & 3-Tier KYC Quick Access */}
                <div className="space-y-1.5">
                  <button
                    type="button"
                    data-testid="topnavbar-my-profile-btn"
                    onClick={() => {
                      navigate('/settings?section=profile');
                      setIsProfileOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/25 text-left transition-all flex items-center justify-between gap-2 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[18px]">account_circle</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-primary group-hover:underline truncate">
                          My Profile &amp; 3-Tier KYC
                        </p>
                        <p className="text-[10px] text-secondary truncate">
                          Biodata, Govt ID, NUBAN Bank &amp; Guarantor
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                      arrow_forward
                    </span>
                  </button>

                  {(currentUser?.role === 'mentor' || Boolean(currentUser?.mentorId)) && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/mentor/profile');
                        setIsProfileOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant/60 text-on-surface font-semibold text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                        <span>My 360° Faculty Dossier</span>
                      </span>
                      <span className="material-symbols-outlined text-[14px] text-secondary">open_in_new</span>
                    </button>
                  )}

                  {currentUser?.role === 'student' && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/student/profile');
                        setIsProfileOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant/60 text-on-surface font-semibold text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                        <span>My 360° Scholar Dossier</span>
                      </span>
                      <span className="material-symbols-outlined text-[14px] text-secondary">open_in_new</span>
                    </button>
                  )}
                </div>

                {/* Persona Switcher Menu — Strictly Super Admin Only */}
                {isSuperAdmin && (
                  <div className="space-y-1.5 p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/60">
                    <div className="flex items-center justify-between px-0.5">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">admin_panel_settings</span>
                        <span>Super Admin Role Switcher</span>
                      </p>
                      {isSimulatingRole && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                          Simulating
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        onClick={() => { switchRole('super_admin'); setIsProfileOpen(false); navigate('/'); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between ${currentUser?.role === 'super_admin' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                        title={originSuperAdmin ? `Return to ${originSuperAdmin.name}` : 'Super Admin'}
                      >
                        <span className="truncate">
                          {originSuperAdmin ? `Super Admin (${originSuperAdmin.name.split(' ')[0]})` : 'Super Admin'}
                        </span>
                        {currentUser?.role === 'super_admin' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                      <button
                        onClick={() => { switchRole('program_officer'); setIsProfileOpen(false); navigate('/'); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between ${currentUser?.role === 'program_officer' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                      >
                        <span>Program Officer</span>
                        {currentUser?.role === 'program_officer' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                      <button
                        onClick={() => { switchRole('admissions'); setIsProfileOpen(false); navigate('/leads'); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between ${currentUser?.role === 'admissions' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                      >
                        <span>Admissions</span>
                        {currentUser?.role === 'admissions' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                      <button
                        onClick={() => { switchRole('mentor'); setIsProfileOpen(false); navigate('/mentor/dashboard'); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between ${currentUser?.role === 'mentor' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                      >
                        <span>Faculty Mentor</span>
                        {currentUser?.role === 'mentor' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                      <button
                        onClick={() => { switchRole('finance'); setIsProfileOpen(false); navigate('/expenses'); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between ${currentUser?.role === 'finance' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                      >
                        <span>Finance</span>
                        {currentUser?.role === 'finance' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                      <button
                        onClick={() => { switchRole('student'); setIsProfileOpen(false); navigate('/student/dashboard'); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between col-span-2 ${currentUser?.role === 'student' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                      >
                        <span>🎓 Student Scholar Portal</span>
                        {currentUser?.role === 'student' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-outline-variant space-y-1">
                  <button
                    onClick={() => { openModal('change-password'); setIsProfileOpen(false); }}
                    className="w-full h-8 px-3 rounded bg-surface hover:bg-surface-container text-on-surface font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">lock_reset</span>
                    <span>Change My Password</span>
                  </button>

                  <button
                    onClick={() => { logout(); setIsProfileOpen(false); }}
                    className="w-full h-8 px-3 rounded bg-surface hover:bg-error-container/20 text-error font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer Popover */}
      <NotificationDrawer 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </>
  );
};
