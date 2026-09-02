import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { UserRole } from '../../types/crm';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, hasPermission, login } = useCRM();
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
            to="/"
            className="px-4 h-10 rounded bg-surface border border-outline-variant font-label-md text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Dashboard</span>
          </Link>
          <button
            onClick={() => login('super_admin')}
            className="px-4 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            <span>Switch to Super Admin</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
