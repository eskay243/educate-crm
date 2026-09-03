import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

export interface TopNavbarProps {
  onOpenMobileSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileSidebar }) => {
  const { 
    globalSearch, 
    setGlobalSearch, 
    openModal, 
    currentUser, 
    login, 
    logout, 
    unreadNotificationCount 
  } = useCRM();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
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
          <span className="font-headline-md text-headline-md font-bold text-primary">Nexus CRM</span>
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
            placeholder="Search leads, students, mentors, expenses..."
            className="w-full h-10 pl-10 pr-4 rounded bg-surface-container-lowest border border-outline-variant text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
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

        {/* Trailing Actions & Profile */}
        <div className="flex items-center gap-stack-sm relative">
          <button 
            onClick={() => openModal('export-report')}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer relative"
            aria-label="Export"
            title="Export Data"
          >
            <span className="material-symbols-outlined">download</span>
          </button>

          {/* Notifications Trigger Button */}
          <button 
            onClick={() => {
              setIsNotificationsOpen(prev => !prev);
              setIsProfileOpen(false);
            }}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer relative"
            aria-label="Notifications"
            title="Live Alerts & Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-error text-white font-data-tabular text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface animate-in zoom-in-50">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {currentUser?.role === 'super_admin' && (
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
              aria-label="Settings"
              title="System Settings"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          )}

          {/* User Profile Avatar & Popup with Persona Switcher */}
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

                {/* Persona Switcher Menu */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider px-1">Switch Role Persona</p>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      onClick={() => { login('super_admin'); setIsProfileOpen(false); }}
                      className={`p-1.5 rounded text-left transition-colors ${currentUser?.role === 'super_admin' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                    >
                      Super Admin
                    </button>
                    <button
                      onClick={() => { login('admissions'); setIsProfileOpen(false); }}
                      className={`p-1.5 rounded text-left transition-colors ${currentUser?.role === 'admissions' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                    >
                      Admissions
                    </button>
                    <button
                      onClick={() => { login('mentor'); setIsProfileOpen(false); }}
                      className={`p-1.5 rounded text-left transition-colors ${currentUser?.role === 'mentor' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                    >
                      Faculty Mentor
                    </button>
                    <button
                      onClick={() => { login('finance'); setIsProfileOpen(false); }}
                      className={`p-1.5 rounded text-left transition-colors ${currentUser?.role === 'finance' ? 'bg-primary text-white font-bold' : 'bg-surface hover:bg-surface-container text-on-surface'}`}
                    >
                      Finance Officer
                    </button>
                  </div>
                </div>

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
