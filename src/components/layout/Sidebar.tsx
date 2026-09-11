import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { usePWA } from '../../context/PWAContext';
import { UserRole, EnabledModules } from '../../types/crm';
import { BrandLogo } from '../common/BrandLogo';

export interface SidebarProps {
  onCloseMobile?: () => void;
}

interface NavItemConfig {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
  allowedRoles?: UserRole[];
  module?: keyof EnabledModules;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { openModal, resetAllData, currentUser, logout, settings, isModuleEnabled } = useCRM();
  const { isStandalone, promptInstall, isIOS, setShowIOSInstallGuide } = usePWA();
  const navigate = useNavigate();

  const allNavItems: NavItemConfig[] = [
    // Staff & Admin Links
    { to: '/', label: 'Dashboard', icon: 'dashboard', exact: true, allowedRoles: ['super_admin', 'admissions', 'finance'] },
    { to: '/courses', label: 'Programs & Cohorts', icon: 'menu_book', allowedRoles: ['super_admin', 'admissions'], module: 'courses' },
    { to: '/leads', label: 'Leads Pipeline', icon: 'leaderboard', allowedRoles: ['super_admin', 'admissions'], module: 'leads' },
    { to: '/students', label: 'Students & Billing', icon: 'school', allowedRoles: ['super_admin', 'admissions', 'mentor', 'finance'], module: 'students' },
    { to: '/mentors', label: 'Mentors & Sessions', icon: 'groups', allowedRoles: ['super_admin', 'mentor'], module: 'mentors' },
    { to: '/attendance', label: 'Staff Attendance', icon: 'schedule', allowedRoles: ['super_admin', 'admissions', 'mentor', 'finance'], module: 'attendance' },
    { to: '/expenses', label: 'Expenses & Budget', icon: 'payments', allowedRoles: ['super_admin', 'admissions', 'finance'], module: 'expenses' },
    { to: '/settings', label: 'Settings', icon: 'settings', allowedRoles: ['super_admin'] },

    // Student Portal Links
    { to: '/student/dashboard', label: 'Student Dashboard', icon: 'dashboard', exact: true, allowedRoles: ['student'] },
    { to: '/student/courses', label: 'Classroom & LMS', icon: 'local_library', allowedRoles: ['student'], module: 'lms' },
    { to: '/student/mentor', label: '1-on-1 Faculty Mentor', icon: 'support_agent', allowedRoles: ['student'], module: 'mentors' },
    { to: '/student/billing', label: 'Tuition & Invoicing', icon: 'receipt_long', allowedRoles: ['student'] },
  ];

  const isStudent = currentUser?.role === 'student';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const visibleNavItems = allNavItems.filter(item => {
    if (!currentUser) return false;
    
    // Role filter
    let roleAllowed = false;
    if (isStudent) {
      roleAllowed = !!item.allowedRoles?.includes('student');
    } else if (isSuperAdmin) {
      roleAllowed = !item.allowedRoles?.includes('student') || item.allowedRoles?.includes('super_admin');
    } else {
      roleAllowed = !!item.allowedRoles?.includes(currentUser.role);
    }
    if (!roleAllowed) return false;

    // Module enablement filter: non-super_admin users don't see disabled modules
    if (!isSuperAdmin && item.module && !isModuleEnabled(item.module)) {
      return false;
    }

    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="flex flex-col bg-surface-container-low border-r border-outline-variant h-screen w-64 py-stack-md z-40 select-none">
      {/* Brand Header */}
      <div className="px-gutter mb-stack-lg flex items-center justify-between">
        <Link 
          to={isStudent ? "/student/dashboard" : "/"} 
          onClick={onCloseMobile}
          className="hover:opacity-90 transition-opacity"
        >
          <BrandLogo size="md" logoUrl={settings.logoUrl} />
        </Link>
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile} 
            className="md:hidden p-1 text-on-surface-variant hover:text-primary rounded hover:bg-surface-container"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="px-stack-md mb-stack-md">
        {isStudent ? (
          isModuleEnabled('lms') ? (
            <Link
              to="/student/courses"
              onClick={onCloseMobile}
              className="w-full bg-primary text-on-primary hover:bg-surface-tint active:scale-[0.98] transition-all rounded h-10 flex items-center justify-center gap-unit font-label-md text-label-md font-bold shadow-xs"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_circle</span>
              <span>Resume Classroom</span>
            </Link>
          ) : (
            <Link
              to="/student/billing"
              onClick={onCloseMobile}
              className="w-full bg-primary text-on-primary hover:bg-surface-tint active:scale-[0.98] transition-all rounded h-10 flex items-center justify-center gap-unit font-label-md text-label-md font-bold shadow-xs"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
              <span>Tuition & Billing</span>
            </Link>
          )
        ) : (
          <button
            onClick={() => {
              openModal('create-hub');
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full bg-primary text-on-primary hover:bg-surface-tint active:scale-[0.98] transition-all rounded h-10 flex items-center justify-center gap-unit font-label-md text-label-md font-bold shadow-xs"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            <span>Create New Record</span>
          </button>
        )}
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-unit px-stack-md">
        {visibleNavItems.map((item) => {
          const isItemDisabled = isSuperAdmin && item.module && !isModuleEnabled(item.module);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-stack-sm px-stack-sm py-2 rounded font-label-md text-label-md transition-all duration-150 ease-in-out ${
                  isActive
                    ? 'text-primary font-bold border-r-4 border-primary bg-surface-container'
                    : isItemDisabled
                    ? 'text-secondary/70 hover:bg-surface-container-high transition-colors'
                    : 'text-secondary hover:bg-surface-container-high transition-colors'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span 
                    className="material-symbols-outlined" 
                    style={{ 
                      fontSize: '20px',
                      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" 
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {isItemDisabled && (
                    <span 
                      title="Module is disabled for staff and students"
                      className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30"
                    >
                      OFF
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer User Info & Controls */}
      <div className="mt-auto px-stack-md pt-stack-sm border-t border-outline-variant space-y-2">
        {/* Logged in User Card */}
        {currentUser && (
          <div className="p-2 rounded-lg bg-surface border border-outline-variant flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-on-surface truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-primary font-semibold truncate capitalize">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-secondary hover:text-error p-1 rounded hover:bg-surface-container"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1 text-xs">
          {!isStandalone && (
            <button
              type="button"
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                if (isIOS) setShowIOSInstallGuide(true);
                else promptInstall();
              }}
              className="flex items-center gap-stack-sm px-stack-sm py-1.5 rounded text-primary hover:bg-primary/10 transition-colors font-label-md text-label-md text-left w-full font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">install_mobile</span>
              <span>Install Nexus App</span>
            </button>
          )}

          <button
            onClick={() => openModal('export-report')}
            className="flex items-center gap-stack-sm px-stack-sm py-1.5 rounded text-secondary hover:bg-surface-container-high transition-colors font-label-md text-label-md text-left w-full"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Reports</span>
          </button>

          {currentUser?.role === 'super_admin' && (
            <button
              onClick={() => {
                if (window.confirm('Reset all CRM data back to initial Nigerian seed records?')) {
                  resetAllData();
                }
              }}
              className="flex items-center gap-stack-sm px-stack-sm py-1.5 rounded text-secondary hover:text-error hover:bg-error-container/20 transition-colors font-label-md text-label-md text-left w-full"
              title="Reset back to initial dataset"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>Reset Demo Data</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};


