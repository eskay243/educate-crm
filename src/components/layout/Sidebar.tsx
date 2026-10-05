import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { usePWA } from '../../context/PWAContext';
import { UserRole, EnabledModules } from '../../types/crm';
import { BrandLogo } from '../common/BrandLogo';

export interface SidebarProps {
  onCloseMobile?: () => void;
}

interface NavSubItem {
  to: string;
  label: string;
  icon: string;
  section: string;
}

interface NavItemConfig {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
  allowedRoles?: UserRole[];
  module?: keyof EnabledModules;
  subItems?: NavSubItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { openModal, resetAllData, currentUser, logout, settings, isModuleEnabled, hasPermission, hasModulePermission, hasFeaturePermission, tickets } = useCRM();
  const { isStandalone, promptInstall, isIOS, setShowIOSInstallGuide } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/settings': true,
    '/mentors': true,
  });

  const isMenuExpanded = (path: string) => expandedMenus[path] !== false;
  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => ({ ...prev, [path]: !isMenuExpanded(path) }));
  };

  const isStudent = currentUser?.role === 'student';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isMentor = currentUser?.role === 'mentor';
  const canManageSettings = isSuperAdmin || hasFeaturePermission('canManageSettings') || hasModulePermission('settings');

  const settingsSubItems: NavSubItem[] = canManageSettings ? [
    { to: '/settings?section=profile', label: 'My Profile & KYC', icon: 'person', section: 'profile' },
    { to: '/settings?section=general', label: 'Institutional Profile', icon: 'storefront', section: 'general' },
    { to: '/settings?section=staff', label: 'Staff Accounts', icon: 'badge', section: 'staff' },
    { to: '/settings?section=users', label: 'User Directory', icon: 'manage_accounts', section: 'users' },
    { to: '/settings?section=roles', label: 'Roles & Permissions', icon: 'admin_panel_settings', section: 'roles' },
    { to: '/settings?section=backups', label: 'Backup & Production', icon: 'database', section: 'backups' },
  ] : [
    { to: '/settings?section=profile', label: 'My Profile & KYC', icon: 'person', section: 'profile' },
    { to: '/settings?section=security', label: 'Security & Password', icon: 'lock_reset', section: 'security' },
  ];

  const mentorsSubItems: NavSubItem[] = [
    { to: '/mentors', label: 'Faculty Overview', icon: 'groups', section: 'roster' },
    { to: '/mentors/office-hours', label: 'Office Hours & Slots', icon: 'schedule', section: 'office-hours' },
    { to: '/mentors/grading', label: 'Grading Inbox', icon: 'fact_check', section: 'grading' },
    { to: '/mentors/course-outlines', label: 'Course Outlines', icon: 'account_tree', section: 'course-outlines' },
    { to: '/mentors?action=book-session', label: 'Log 1-on-1 Session', icon: 'calendar_month', section: 'book-session' },
    { to: '/mentors?action=submit-report', label: 'File Evaluation Report', icon: 'assessment', section: 'submit-report' },
    { to: '/mentors?action=request-payout', label: 'Request Payout', icon: 'payments', section: 'request-payout' },
  ];

  const allNavItems: NavItemConfig[] = [
    // Staff & Admin Links
    { to: '/', label: 'Dashboard', icon: 'dashboard', exact: true, allowedRoles: ['super_admin', 'admissions', 'finance', 'program_officer'] },
    { to: '/courses', label: 'Programs & Cohorts', icon: 'menu_book', allowedRoles: ['super_admin', 'admissions', 'program_officer'], module: 'courses' },
    { to: '/leads', label: 'Leads Pipeline', icon: 'leaderboard', allowedRoles: ['super_admin', 'admissions'], module: 'leads' },
    { to: '/students', label: 'Students & Billing', icon: 'school', allowedRoles: ['super_admin', 'admissions', 'mentor', 'finance', 'program_officer'], module: 'students' },
    { 
      to: '/mentors', 
      label: 'Mentors & Sessions', 
      icon: 'groups', 
      allowedRoles: ['super_admin', 'mentor', 'program_officer'], 
      module: 'mentors',
      subItems: mentorsSubItems,
    },
    { to: '/attendance', label: 'Staff Attendance', icon: 'schedule', allowedRoles: ['super_admin', 'admissions', 'mentor', 'finance', 'program_officer'], module: 'attendance' },
    { to: '/expenses', label: 'Expenses & Budget', icon: 'payments', allowedRoles: ['super_admin', 'admissions', 'finance'], module: 'expenses' },
    { 
      to: '/settings', 
      label: 'Settings', 
      icon: 'settings', 
      allowedRoles: ['super_admin', 'admissions', 'mentor', 'finance', 'program_officer', 'student'],
      subItems: settingsSubItems,
    },

    // Student Portal Links
    { to: '/student/dashboard', label: 'Student Dashboard', icon: 'dashboard', exact: true, allowedRoles: ['student'] },
    { to: '/student/courses', label: 'Classroom & LMS', icon: 'local_library', allowedRoles: ['student'], module: 'lms' },
    { to: '/student/mentor', label: '1-on-1 Faculty Mentor', icon: 'support_agent', allowedRoles: ['student'], module: 'mentors' },
    { to: '/student/billing', label: 'Tuition & Invoicing', icon: 'receipt_long', allowedRoles: ['student'] },

    // Universal Support & Feedback Module for all roles
    { to: '/tickets', label: 'Support & Tickets', icon: 'confirmation_number' },
  ];

  const visibleNavItems = allNavItems.filter(item => {
    if (!currentUser) return false;
    
    // Support & Tickets and Settings are universal to all authenticated roles
    if (item.to === '/tickets' || item.to === '/settings') return true;

    // Role filter
    let roleAllowed = false;
    if (isStudent) {
      roleAllowed = !!item.allowedRoles?.includes('student');
    } else if (isSuperAdmin) {
      roleAllowed = !item.allowedRoles?.includes('student') || item.allowedRoles?.includes('super_admin');
    } else {
      if (item.to === '/' && !isStudent) {
        roleAllowed = true;
      } else {
        const allowedByRole = item.allowedRoles ? hasPermission(item.allowedRoles, item.module) : true;
        const allowedByModule = item.module ? hasModulePermission(item.module) : true;
        roleAllowed = item.module ? (allowedByModule || allowedByRole) : allowedByRole;
      }
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
    <nav className="flex flex-col bg-surface border-r border-border-subtle h-screen w-64 py-stack-md z-40 select-none">
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
              className="btn-primary w-full h-10 text-xs"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_circle</span>
              <span>Resume Classroom</span>
            </Link>
          ) : (
            <Link
              to="/student/billing"
              onClick={onCloseMobile}
              className="btn-primary w-full h-10 text-xs"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
              <span>Tuition & Billing</span>
            </Link>
          )
        ) : isMentor ? (
          <div className="flex flex-col gap-1.5">
            <Link
              to="/mentors/office-hours"
              onClick={onCloseMobile}
              className="btn-primary w-full h-10 text-xs"
              title="Manage your weekly office hours and open booking slots"
            >
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>Office Hours &amp; Slots</span>
            </Link>
            <Link
              to="/mentors/course-outlines"
              onClick={onCloseMobile}
              className="btn-secondary w-full h-8 text-xs"
              title="View NBTE & NITDA standard syllabus outlines"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
              <span>Course Outlines</span>
            </Link>
          </div>
        ) : (
          <button
            onClick={() => {
              openModal('create-hub');
              if (onCloseMobile) onCloseMobile();
            }}
            className="btn-primary w-full h-10 text-xs"
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
          const hasSubItems = item.subItems && item.subItems.length > 0;

          if (hasSubItems) {
            const isExpanded = isMenuExpanded(item.to);

            return (
              <div key={item.to} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <NavLink
                    to={item.to}
                    end={false}
                    onClick={() => {
                      if (!isExpanded) toggleMenu(item.to);
                      if (onCloseMobile && !hasSubItems) onCloseMobile();
                    }}
                    className={({ isActive }) =>
                      `flex-1 flex items-center gap-stack-sm px-3 py-2 rounded-md font-medium text-xs transition-all duration-150 ease-in-out ${
                        isActive
                          ? 'text-primary font-bold bg-[#EEF4FF]'
                          : 'text-[#475569] hover:text-crisp-black hover:bg-surface-dim transition-colors'
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
                      </>
                    )}
                  </NavLink>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMenu(item.to);
                    }}
                    className="p-1.5 text-secondary hover:text-on-surface rounded hover:bg-surface-container-high transition-colors"
                    title={isExpanded ? "Collapse submenus" : "Expand submenus"}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="flex flex-col gap-0.5 pl-3 border-l-2 border-outline-variant/60 ml-4 my-1">
                    {item.subItems!.map((sub) => {
                      let isSubActive = false;
                      if (item.to === '/settings') {
                        const currentSection = new URLSearchParams(location.search).get('section') || (isSuperAdmin ? 'general' : 'profile');
                        isSubActive = location.pathname.startsWith('/settings') && currentSection === sub.section;
                      } else if (item.to === '/mentors') {
                        if (sub.to === '/mentors/office-hours') {
                          isSubActive = location.pathname === '/mentors/office-hours';
                        } else if (sub.to === '/mentors/grading') {
                          isSubActive = location.pathname === '/mentors/grading';
                        } else if (sub.to === '/mentors/course-outlines') {
                          isSubActive = location.pathname === '/mentors/course-outlines';
                        } else if (sub.section === 'book-session' || sub.section === 'submit-report' || sub.section === 'request-payout') {
                          const currentAction = new URLSearchParams(location.search).get('action');
                          isSubActive = location.pathname === '/mentors' && currentAction === sub.section;
                        } else {
                          const currentAction = new URLSearchParams(location.search).get('action');
                          isSubActive = location.pathname === '/mentors' && !currentAction;
                        }
                      } else {
                        isSubActive = location.pathname + location.search === sub.to;
                      }

                      return (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => {
                            if (item.to === '/mentors' && sub.section) {
                              if (sub.section === 'book-session') openModal('book-session');
                              else if (sub.section === 'submit-report') openModal('submit-performance-report');
                              else if (sub.section === 'request-payout') openModal('request-payout');
                            }
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md font-medium text-xs transition-colors ${
                            isSubActive
                              ? 'text-primary font-bold bg-[#EEF4FF]'
                              : 'text-[#475569] hover:text-crisp-black hover:bg-surface-dim'
                          }`}
                        >
                          <span 
                            className="material-symbols-outlined text-[16px]"
                            style={{ fontVariationSettings: isSubActive ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            {sub.icon}
                          </span>
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-stack-sm px-3 py-2 rounded-md font-medium text-xs transition-all duration-150 ease-in-out ${
                  isActive
                    ? 'text-primary font-bold bg-[#EEF4FF]'
                    : isItemDisabled
                    ? 'text-[#475569]/60 hover:bg-surface-dim transition-colors'
                    : 'text-[#475569] hover:text-crisp-black hover:bg-surface-dim transition-colors'
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
                  {item.to === '/tickets' && tickets.filter(t => t.status === 'open').length > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-data-tabular">
                      {tickets.filter(t => t.status === 'open').length}
                    </span>
                  )}
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


