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
    settings,
    isSuperAdmin,
    isSimulatingRole,
    switchRole
  } = useCRM();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [elapsedText, setElapsedText] = useState('00h 00m');

  React.useEffect(() => {
    if (!activeAttendanceSession) return;
    const updateElapsed = () => {
      const ms = Math.max(0, Date.now() - activeAttendanceSession.clockInTimestamp);
      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
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
            onClick={() => switchRole('super_admin')}
            className="px-2.5 py-0.5 rounded bg-surface text-on-surface hover:bg-surface-container font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[13px] text-primary">admin_panel_settings</span>
            <span>Exit Preview Mode</span>
          </button>
        </div>
      )}

      <header className="bg-surface flex justify-between items-center h-16 px-gutter w-full sticky top-0 z-30 border-b border-outline-variant shadow-xs transition-colors">
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
            className="w-full h-9 pl-9 pr-4 rounded bg-surface-container-low border border-outline-variant font-body-md text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
          {/* Quick Record Creator */}
          <button
            onClick={() => openModal('create-hub')}
            className="hidden sm:flex items-center gap-1 px-3 h-8 rounded bg-primary text-on-primary font-label-md text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Record</span>
          </button>

          {/* Real-Time Live Clock-In Pill */}
          {activeAttendanceSession ? (
            <div 
              onClick={() => openModal('clock-out')}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-semibold cursor-pointer hover:bg-[#d1fae5] transition-all"
              title="Click to Clock Out"
            >
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              <span className="capitalize">{activeAttendanceSession.workMode}</span>
              <span className="font-data-tabular font-bold border-l border-[#a7f3d0] pl-1.5">{elapsedText}</span>
            </div>
          ) : (
            <button
              onClick={() => openModal('clock-in')}
              className="h-8 px-2.5 sm:px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-primary/20"
              title="Clock In for Shift"
            >
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span className="hidden sm:inline">Clock In</span>
            </button>
          )}

          {/* Help Center Quick Link */}
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors"
            title="Institutional Documentation & Audit Settings"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>

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
              <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl p-4 z-50 animate-in fade-in space-y-3">
                <div className="border-b border-outline-variant pb-2">
                  <p className="font-bold text-sm text-on-surface">{currentUser?.name}</p>
                  <p className="text-xs text-secondary">{currentUser?.roleTitle}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-primary-container/30 text-primary text-[10px] font-bold capitalize">
                    Role: {currentUser?.role.replace('_', ' ')}
                  </span>
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
                        onClick={() => { switchRole('super_admin'); setIsProfileOpen(false); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between ${currentUser?.role === 'super_admin' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                      >
                        <span>Super Admin</span>
                        {currentUser?.role === 'super_admin' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                      <button
                        onClick={() => { switchRole('admissions'); setIsProfileOpen(false); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between ${currentUser?.role === 'admissions' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                      >
                        <span>Admissions</span>
                        {currentUser?.role === 'admissions' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                      <button
                        onClick={() => { switchRole('mentor'); setIsProfileOpen(false); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between ${currentUser?.role === 'mentor' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                      >
                        <span>Faculty Mentor</span>
                        {currentUser?.role === 'mentor' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                      <button
                        onClick={() => { switchRole('finance'); setIsProfileOpen(false); }}
                        className={`p-1.5 rounded text-left transition-colors flex items-center justify-between ${currentUser?.role === 'finance' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                      >
                        <span>Finance</span>
                        {currentUser?.role === 'finance' && <span className="material-symbols-outlined text-[13px]">check</span>}
                      </button>
                      <button
                        onClick={() => { switchRole('student'); setIsProfileOpen(false); }}
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
