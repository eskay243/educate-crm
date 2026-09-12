import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { UserRole, EnabledModules } from '../../types/crm';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredModule?: keyof EnabledModules;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredModule }) => {
  const { currentUser, hasPermission, isModuleEnabled, isSuperAdmin, switchRole } = useCRM();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasPermission(allowedRoles)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-error-container/30 text-error flex items-center justify-center mb-4 border border-error/20">
          <span className="material-symbols-outlined text-[32px]">lock</span>
        </div>

        <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2">Access Restricted</h2>
        <p className="text-secondary text-sm max-w-md mb-6 leading-relaxed">
          Your active role (<span className="font-bold text-primary">{currentUser.roleTitle}</span>) does not have permission to view or manage this institutional module.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={currentUser.role === 'student' ? '/student/dashboard' : '/'}
            className="px-4 h-10 rounded bg-surface border border-outline-variant font-label-md text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Dashboard</span>
          </Link>
          {isSuperAdmin && (
            <button
              onClick={() => switchRole('super_admin')}
              className="px-4 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Return to Super Admin</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Check if module is turned off
  if (requiredModule && !isModuleEnabled(requiredModule)) {
    // If Super Admin, allow access with an administrative preview banner
    if (currentUser.role === 'super_admin') {
      return (
        <div className="flex flex-col min-h-full">
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-sm">visibility_off</span>
              <span>
                <strong>Administrative Preview:</strong> The <strong>{requiredModule.toUpperCase()}</strong> module is currently turned <strong>OFF</strong> for students and staff.
              </span>
            </div>
            <Link 
              to="/settings" 
              className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold text-[11px] hover:bg-amber-700 transition-colors shadow-xs"
            >
              Configure in Settings
            </Link>
          </div>
          {children}
        </div>
      );
    }

    // For students and other staff, show the Scheduled for Launch view
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center mb-4 border border-outline-variant shadow-xs">
          <span className="material-symbols-outlined text-[32px]">upcoming</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-secondary text-xs font-bold uppercase tracking-wider mb-2">
          Scheduled for Launch
        </div>
        <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2">Module Under Preparation</h2>
        <p className="text-secondary text-sm max-w-md mb-6 leading-relaxed">
          This institutional module has been scheduled for upcoming launch or is currently undergoing administrative review. Please check back shortly.
        </p>
        <Link
          to={currentUser.role === 'student' ? "/student/billing" : "/"}
          className="px-4 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>{currentUser.role === 'student' ? 'View Tuition & Billing' : 'Return to Dashboard'}</span>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
