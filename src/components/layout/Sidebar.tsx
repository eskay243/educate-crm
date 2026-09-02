import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { UserRole } from '../../types/crm';

export interface SidebarProps {
  onCloseMobile?: () => void;
}

interface NavItemConfig {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
  allowedRoles?: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { openModal, resetAllData, currentUser, logout } = useCRM();
  const navigate = useNavigate();

  const allNavItems: NavItemConfig[] = [
    { to: '/', label: 'Dashboard', icon: 'dashboard', exact: true, allowedRoles: ['super_admin', 'admissions', 'finance'] },
    { to: '/courses', label: 'Programs & Cohorts', icon: 'menu_book', allowedRoles: ['super_admin', 'admissions'] },
    { to: '/leads', label: 'Leads Pipeline', icon: 'leaderboard', allowedRoles: ['super_admin', 'admissions'] },
    { to: '/students', label: 'Students & Billing', icon: 'school', allowedRoles: ['super_admin', 'admissions', 'mentor', 'finance'] },
    { to: '/mentors', label: 'Mentors & Sessions', icon: 'groups', allowedRoles: ['super_admin', 'mentor'] },
    { to: '/expenses', label: 'Expenses & Budget', icon: 'payments', allowedRoles: ['super_admin', 'finance'] },
    { to: '/settings', label: 'Settings', icon: 'settings', allowedRoles: ['super_admin'] },
  ];

  const visibleNavItems = allNavItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return item.allowedRoles?.includes(currentUser.role);
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
          to="/" 
          onClick={onCloseMobile}
          className="flex items-center gap-stack-sm group hover:opacity-90 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>domain</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-headline-md text-headline-md font-bold text-primary truncate leading-tight">Enterprise Portal</h1>
            <p className="font-body-sm text-body-sm text-secondary truncate">Management Suite</p>
          </div>
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
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-unit px-stack-md">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-stack-sm px-stack-sm py-2 rounded font-label-md text-label-md transition-all duration-150 ease-in-out ${
                isActive
                  ? 'text-primary font-bold border-r-4 border-primary bg-surface-container'
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
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
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


