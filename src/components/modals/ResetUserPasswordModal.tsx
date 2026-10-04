import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

interface ResetUserPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetUserPasswordModal: React.FC<ResetUserPasswordModalProps> = ({ isOpen, onClose }) => {
  const { selectedUserForPasswordReset, adminResetUserPassword } = useCRM();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !selectedUserForPasswordReset) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await adminResetUserPassword(selectedUserForPasswordReset.id, newPassword);
      if (success) {
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-xl max-w-md w-full border border-outline-variant shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">lock_reset</span>
            </div>
            <div>
              <h2 className="font-title-md font-bold text-on-surface">Reset User Password</h2>
              <p className="font-body-sm text-on-surface-variant">Administrative credential override</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* User Identity Banner */}
        <div className="p-4 bg-surface-container border-b border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-label-md">
            {selectedUserForPasswordReset.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-body-md text-on-surface truncate">
              {selectedUserForPasswordReset.name}
            </div>
            <div className="text-label-xs text-on-surface-variant truncate">
              {selectedUserForPasswordReset.email} &bull; <span className="capitalize font-medium text-primary">{selectedUserForPasswordReset.role.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-label-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-label-sm font-semibold text-on-surface">
                New Password *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-label-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">vpn_key</span>
                Generate Strong
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-sm">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-label-sm font-semibold text-on-surface mb-1">
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full h-10 px-3 rounded-lg border border-outline bg-surface text-on-surface text-body-sm focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="p-3 rounded-lg bg-surface-container text-label-xs text-on-surface-variant flex items-start gap-2">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5 text-primary">security</span>
            <span>
              As Super Admin, setting this password will immediately update the user's institutional login credentials across staff, mentor, and student portals.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-outline-variant flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline text-on-surface hover:bg-surface-container text-label-md font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-surface-tint font-bold text-label-md flex items-center gap-2 shadow-xs disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">check</span>
                  <span>Set New Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
