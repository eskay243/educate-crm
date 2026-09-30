import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const { currentUser } = useCRM();
  const navItems = React.useMemo(() => {
    const role = currentUser?.role;
    if (role === 'student') {
      return [
        { label: 'Portal', to: '/student/dashboard', icon: 'dashboard' },
        { label: 'LMS', to: '/student/courses', icon: 'local_library' },
        { label: 'Faculty', to: '/student/mentor', icon: 'supervised_user_circle' },
        { label: 'Billing', to: '/student/billing', icon: 'credit_card' },
      ];
    }
    if (role === 'finance') {
      return [
        { label: 'Expenses', to: '/expenses', icon: 'account_balance_wallet' },
        { label: 'Scholars', to: '/students', icon: 'school' },
        { label: 'Clock-In', to: '/attendance', icon: 'schedule' },
        { label: 'Tickets', to: '/tickets', icon: 'confirmation_number' },
      ];
    }
    if (role === 'mentor') {
      return [
        { label: 'Faculty', to: '/mentors', icon: 'diversity_3' },
        { label: 'Scholars', to: '/students', icon: 'school' },
        { label: 'Clock-In', to: '/attendance', icon: 'schedule' },
        { label: 'Tickets', to: '/tickets', icon: 'confirmation_number' },
      ];
    }
    if (role === 'admissions') {
      return [
        { label: 'Leads', to: '/leads', icon: 'person_search' },
        { label: 'Scholars', to: '/students', icon: 'school' },
        { label: 'Courses', to: '/courses', icon: 'local_library' },
        { label: 'Clock-In', to: '/attendance', icon: 'schedule' },
      ];
    }
    // super_admin & default
    return [
      { label: 'Executive', to: '/reports', icon: 'monitoring' },
      { label: 'Leads', to: '/leads', icon: 'person_search' },
      { label: 'Scholars', to: '/students', icon: 'school' },
      { label: 'Expenses', to: '/expenses', icon: 'account_balance_wallet' },
    ];
  }, [currentUser?.role]);

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/80 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-lg transition-transform duration-200 select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/' || item.to === '/student/dashboard'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-secondary hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-9 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-primary/15 text-primary' : 'text-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 font-medium">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* More / Menu Button */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl text-secondary hover:text-on-surface transition-all cursor-pointer"
        >
          <div className="w-9 h-6 rounded-full flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[20px]">
              menu
            </span>
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
};
