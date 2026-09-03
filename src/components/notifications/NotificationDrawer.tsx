import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { NotificationItem } from '../../types/crm';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotifications,
    unreadNotificationCount 
  } = useCRM();
  const [filter, setFilter] = useState<'all' | 'admissions' | 'finance' | 'mentor'>('all');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const handleNotificationClick = (notif: NotificationItem) => {
    markNotificationAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'admissions':
        return { icon: 'person_add', bg: 'bg-amber-100 text-amber-800' };
      case 'finance':
        return { icon: 'receipt_long', bg: 'bg-emerald-100 text-emerald-800' };
      case 'mentor':
        return { icon: 'school', bg: 'bg-blue-100 text-blue-800' };
      default:
        return { icon: 'notifications', bg: 'bg-secondary-container text-primary' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-container-lowest border-l border-outline-variant shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">notifications_active</span>
              <div>
                <h2 className="font-headline-md text-base font-bold text-on-surface">Live Operations Alerts</h2>
                <p className="text-xs text-secondary">
                  {unreadNotificationCount > 0 
                    ? `${unreadNotificationCount} unread system alerts`
                    : 'All notifications read'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Quick Actions & Filters */}
          <div className="p-3 border-b border-outline-variant bg-surface space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-secondary uppercase tracking-wider text-[10px]">Filter Channel</span>
              <div className="flex gap-2">
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-primary hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-secondary hover:text-error font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'admissions', 'finance', 'mentor'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                    filter === f
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-secondary hover:text-on-surface'
                  }`}
                >
                  {f === 'mentor' ? 'Mentorship' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-secondary space-y-2">
                <span className="material-symbols-outlined text-[36px] text-outline">notifications_off</span>
                <p className="text-sm font-medium">No alerts found in this channel.</p>
                <p className="text-xs">You're completely up to date!</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const { icon, bg } = getTypeIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-surface-container-low transition-colors cursor-pointer flex gap-3 relative ${
                      !notif.read ? 'bg-secondary-container/15' : ''
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {!notif.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                      <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-headline-sm text-xs font-bold text-on-surface truncate">
                          {notif.title}
                        </h4>
                        <span className="font-data-tabular text-[10px] text-secondary whitespace-nowrap">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="font-body-sm text-xs text-secondary leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-primary pt-0.5">
                          <span>View record</span>
                          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="p-3 border-t border-outline-variant bg-surface-container-low flex justify-between items-center text-[11px] text-secondary font-data-tabular">
            <span>NEXUS REAL-TIME EVENT STREAM</span>
            <span className="flex items-center gap-1 text-[#166534]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
